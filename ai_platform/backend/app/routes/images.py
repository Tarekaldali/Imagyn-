"""
Image Generation Routes - API endpoints for AI image generation
"""

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from typing import List
import os

from app.models.schemas import (
    ImageGenerationRequest,
    ImageGenerationResponse,
    ImageResponse
)
from app.utils.supabase_client import get_current_user
from app.services.user_service import UserService
from app.services.image_service import ImageService
from app.services.job_service import JobService
from app.services.comfyui_service import get_comfyui_service
from app.services.r2_service import get_r2_service
from app.config import settings
import logging
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter()


def _serialize_timestamp(value):
    """Normalize timestamp values that may come as datetime or ISO string."""
    if not value:
        return None

    if isinstance(value, datetime):
        return value.isoformat()

    if isinstance(value, str):
        return value

    try:
        return value.isoformat()
    except Exception:
        return str(value)


@router.post("/generate_image", response_model=ImageGenerationResponse)
async def generate_image(
    request: ImageGenerationRequest,
    user: dict = Depends(get_current_user)
):
    """
    Generate image using AI
    
    Flow:
    1. Check user has enough credits
    2. Create job record
    3. Generate image with ComfyUI
    4. Upload to R2
    5. Create image record
    6. Deduct credits
    7. Return response
    
    Requires authentication via JWT token in Authorization header.
    """
    comfyui_service = get_comfyui_service()
    r2_service = get_r2_service()
    
    try:
        # 1. Check credits
        required_credits = settings.CREDITS_PER_IMAGE
        if user['credits'] < required_credits:
            logger.warning(f"User {user['id']} has insufficient credits: {user['credits']} < {required_credits}")
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail=f"Insufficient credits. Required: {required_credits}, Available: {user['credits']}"
            )
        
        logger.info(f"User {user['id']} initiating generation - Credits: {user['credits']}")
        
        # 2. Create job
        job = await JobService.create_job(
            user_id=user['id'],
            prompt=request.prompt,
            model_name=request.model_name or settings.DEFAULT_MODEL
        )
        
        if not job:
            logger.error("Failed to create job record")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create job"
            )
        
        logger.info(f"Created job {job['id']} for user {user['id']}")
        
        # Update job status to processing
        await JobService.update_job_status(job['id'], "processing")
        
        # 3. Generate image
        logger.info(f"Starting ComfyUI generation for job {job['id']}")
        generation_result = await comfyui_service.generate_image(
            prompt=request.prompt,
            negative_prompt=request.negative_prompt or "",
            model_name=request.model_name,
            width=request.width,
            height=request.height,
            steps=request.steps,
            cfg_scale=request.cfg_scale,
            sampler=request.sampler,
            seed=request.seed
        )
        
        if not generation_result['success']:
            # Update job as failed
            error_msg = generation_result.get('error', 'Unknown error')
            logger.error(f"Generation failed for job {job['id']}: {error_msg}")
            await JobService.update_job_status(
                job['id'],
                "failed",
                error_message=error_msg
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Image generation failed: {error_msg}"
            )
        
        logger.info(f"Generation successful for job {job['id']}, uploading to R2")
        
        # 4. Upload to R2
        image_url = await r2_service.upload_image(
            file_path=generation_result['image_path'],
            user_id=user['id']
        )
        
        if not image_url:
            logger.error(f"Failed to upload image for job {job['id']}")
            await JobService.update_job_status(job['id'], "failed", "Upload failed")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to upload image to storage"
            )
        
        logger.info(f"Image uploaded to R2: {image_url}")
        
        # Clean up temp file
        try:
            if os.path.exists(generation_result['image_path']):
                os.remove(generation_result['image_path'])
                logger.debug(f"Cleaned up temp file: {generation_result['image_path']}")
        except Exception as e:
            logger.warning(f"Failed to clean up temp file: {str(e)}")
        
        # 5. Create image record
        image = await ImageService.create_image(
            user_id=user['id'],
            job_id=job['id'],
            prompt=request.prompt,
            image_url=image_url,
            model_used=request.model_name or settings.DEFAULT_MODEL,
            generation_time=generation_result['generation_time']
        )
        
        if not image:
            logger.error(f"Failed to create image record for job {job['id']}")
            # Job succeeded but DB write failed - still deduct credits
        
        logger.info(f"Created image record {image['id'] if image else 'N/A'}")
        
        # 6. Deduct credits
        deduction_result = await UserService.deduct_credits(user['id'], required_credits)
        if not deduction_result:
            logger.error(f"Failed to deduct credits for user {user['id']}")
            # Image was created, so we don't fail the request
        
        # 7. Update job
        await JobService.update_job_status(job['id'], "completed")
        await JobService.update_job_gpu_time(job['id'], generation_result['generation_time'])
        
        # Get updated user credits
        updated_user = await UserService.get_user_by_id(user['id'])
        credits_remaining = updated_user['credits'] if updated_user else user['credits'] - required_credits
        
        logger.info(f"Generation complete for job {job['id']} - Credits remaining: {credits_remaining}")
        
        return ImageGenerationResponse(
            success=True,
            message="Image generated successfully",
            job_id=job['id'],
            image_id=image['id'] if image else None,
            image_url=image_url,
            credits_remaining=credits_remaining,
            generation_time=generation_result['generation_time']
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in generate_image: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during image generation"
        )


async def _process_image_generation_async(
    job_id: str,
    user_id: str,
    request: ImageGenerationRequest,
    required_credits: int
):
    """
    Background task to process image generation asynchronously
    """
    comfyui_service = get_comfyui_service()
    r2_service = get_r2_service()
    
    try:
        logger.info(f"Background task: Starting generation for job {job_id}")
        
        # Update job status to processing
        await JobService.update_job_status(job_id, "processing")
        
        # Generate image
        generation_result = await comfyui_service.generate_image(
            prompt=request.prompt,
            negative_prompt=request.negative_prompt or "",
            model_name=request.model_name,
            width=request.width,
            height=request.height,
            steps=request.steps,
            cfg_scale=request.cfg_scale,
            sampler=request.sampler,
            seed=request.seed
        )
        
        if not generation_result['success']:
            error_msg = generation_result.get('error', 'Unknown error')
            logger.error(f"Background task: Generation failed for job {job_id}: {error_msg}")
            await JobService.update_job_status(job_id, "failed", error_message=error_msg)
            return
        
        logger.info(f"Background task: Generation successful for job {job_id}, uploading to R2")
        logger.info(f"Background task: Image path: {generation_result['image_path']}")
        logger.info(f"Background task: File exists: {os.path.exists(generation_result['image_path'])}")
        
        # Upload to R2
        image_url = await r2_service.upload_image(
            file_path=generation_result['image_path'],
            user_id=user_id
        )
        
        if not image_url:
            logger.error(f"Background task: Failed to upload image for job {job_id} - R2 service returned None/empty")
            await JobService.update_job_status(job_id, "failed", error_message="Upload failed")
            return
        
        logger.info(f"Background task: Image uploaded to R2 successfully: {image_url}")
        
        # Clean up temp file
        try:
            if os.path.exists(generation_result['image_path']):
                os.remove(generation_result['image_path'])
        except Exception as e:
            logger.warning(f"Background task: Failed to clean up temp file: {str(e)}")
        
        # Create image record
        image = await ImageService.create_image(
            user_id=user_id,
            job_id=job_id,
            prompt=request.prompt,
            image_url=image_url,
            model_used=request.model_name or settings.DEFAULT_MODEL,
            generation_time=generation_result['generation_time']
        )
        
        if not image:
            logger.error(f"Background task: Failed to create image record for job {job_id}")
        else:
            logger.info(f"Background task: Image record created with ID: {image.get('id', 'unknown')}")
        
        # Update job with image URL and completion status
        logger.info(f"Background task: Updating job {job_id} status to completed with image_url: {image_url}")
        update_result = await JobService.update_job_status(job_id, "completed", image_url=image_url)
        logger.info(f"Background task: Job status update result: {update_result}")
        
        gpu_time_result = await JobService.update_job_gpu_time(job_id, generation_result['generation_time'])
        logger.info(f"Background task: GPU time update result: {gpu_time_result}")
        
        logger.info(f"Background task: Job {job_id} completed successfully with image_url: {image_url}")
        
    except Exception as e:
        logger.error(f"Background task: Unexpected error for job {job_id}: {str(e)}", exc_info=True)
        await JobService.update_job_status(job_id, "failed", error_message=str(e))


@router.post("/generate_image_async")
async def generate_image_async(
    request: ImageGenerationRequest,
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_current_user)
):
    """
    Generate image using AI asynchronously (queue-based)
    
    Flow:
    1. Check user has enough credits
    2. Deduct credits immediately
    3. Create job record
    4. Start generation in background
    5. Return job_id immediately
    
    Use GET /jobs/{job_id}/status to check progress.
    
    Requires authentication via JWT token in Authorization header.
    """
    try:
        # 1. Check credits
        required_credits = settings.CREDITS_PER_IMAGE
        if user['credits'] < required_credits:
            logger.warning(f"User {user['id']} has insufficient credits: {user['credits']} < {required_credits}")
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail=f"Insufficient credits. Required: {required_credits}, Available: {user['credits']}"
            )
        
        logger.info(f"User {user['id']} initiating async generation - Credits: {user['credits']}")
        
        # 2. Deduct credits immediately (to prevent duplicate generations)
        deduction_result = await UserService.deduct_credits(user['id'], required_credits)
        if not deduction_result:
            logger.error(f"Failed to deduct credits for user {user['id']}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to deduct credits"
            )
        
        # 3. Create job
        job = await JobService.create_job(
            user_id=user['id'],
            prompt=request.prompt,
            model_name=request.model_name or settings.DEFAULT_MODEL
        )
        
        if not job:
            logger.error("Failed to create job record")
            # Refund credits if job creation failed
            await UserService.add_credits(user['id'], required_credits)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create job"
            )
        
        logger.info(f"Created job {job['id']} for user {user['id']}")
        
        # 4. Start background generation
        background_tasks.add_task(
            _process_image_generation_async,
            job_id=job['id'],
            user_id=user['id'],
            request=request,
            required_credits=required_credits
        )
        
        # 5. Get updated user credits
        updated_user = await UserService.get_user_by_id(user['id'])
        credits_remaining = updated_user['credits'] if updated_user else user['credits'] - required_credits
        
        logger.info(f"Job {job['id']} queued - Credits remaining: {credits_remaining}")
        
        return {
            "success": True,
            "message": "Image generation started",
            "job_id": job['id'],
            "credits_remaining": credits_remaining,
            "status": "pending"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in generate_image_async: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )


@router.get("/jobs/{job_id}/status")
async def get_job_status(
    job_id: str,
    user: dict = Depends(get_current_user)
):
    """
    Get status of a job
    
    Returns:
        - status: pending, processing, completed, failed
        - image_url: URL if completed
        - error: Error message if failed
    """
    try:
        job = await JobService.get_job_by_id(job_id)
        
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found"
            )
        
        # Verify job belongs to user
        if job['user_id'] != user['id']:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        response = {
            "job_id": job['id'],
            "status": job['status'],
            "created_at": _serialize_timestamp(job.get('created_at'))
        }
        
        if job['status'] == "completed" and job.get('image_url'):
            response["image_url"] = job['image_url']
            response["generation_time"] = job.get('gpu_time', 0)
        
        # Log the job data for debugging
        logger.info(f"Job {job_id} status check - Status: {job['status']}, Has image_url: {bool(job.get('image_url'))}, Image URL: {job.get('image_url', 'None')}")
        
        if job['status'] == "failed" and job.get('error_message'):
            response["error"] = job['error_message']
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching job status: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch job status"
        )


@router.get("/jobs")
async def get_user_jobs(
    limit: int = 50,
    offset: int = 0,
    user: dict = Depends(get_current_user)
):
    """Return recent jobs for the authenticated user."""
    try:
        if limit > 100:
            limit = 100
        if limit < 1:
            limit = 1
        if offset < 0:
            offset = 0

        jobs = await JobService.get_user_jobs(user_id=user['id'], limit=limit, offset=offset)
        return jobs
    except Exception as e:
        logger.error(f"Failed to fetch jobs for user {user.get('id')}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch jobs"
        )


@router.get("/models")
async def get_available_models(user: dict = Depends(get_current_user)):
    """Return models available for generation and current default model."""
    try:
        comfyui_service = get_comfyui_service()
        comfy_models = await comfyui_service.get_available_models()

        env_models = [m.strip() for m in settings.ALLOWED_MODELS.split(",") if m.strip()]
        models = comfy_models if comfy_models else env_models

        if settings.DEFAULT_MODEL and settings.DEFAULT_MODEL not in models:
            models = [settings.DEFAULT_MODEL] + models

        return {
            "models": models,
            "default_model": settings.DEFAULT_MODEL
        }
    except Exception as e:
        logger.error(f"Failed to fetch models: {str(e)}", exc_info=True)
        return {
            "models": [settings.DEFAULT_MODEL] if settings.DEFAULT_MODEL else [],
            "default_model": settings.DEFAULT_MODEL
        }


@router.get("/system/status")
async def get_system_status(user: dict = Depends(get_current_user)):
    """Return lightweight backend + ComfyUI status for frontend badges."""
    try:
        comfyui_service = get_comfyui_service()
        comfyui_online = await comfyui_service.health_check()
        return {
            "backend_online": True,
            "comfyui_online": comfyui_online
        }
    except Exception as e:
        logger.error(f"Failed to fetch system status: {str(e)}", exc_info=True)
        return {
            "backend_online": True,
            "comfyui_online": False
        }


@router.get("/user_images", response_model=List[ImageResponse])
async def get_user_images(
    limit: int = 50,
    offset: int = 0,
    user: dict = Depends(get_current_user)
):
    """
    Get all images for current user
    
    Args:
        limit: Maximum number of images to return (default: 50, max: 100)
        offset: Number of images to skip (for pagination)
    
    Returns:
        List of image records for the authenticated user
    """
    try:
        # Validate and cap limit
        if limit > 100:
            limit = 100
        
        logger.info(f"Fetching images for user {user['id']} (limit: {limit}, offset: {offset})")
        
        images = await ImageService.get_images_by_user(
            user_id=user['id'],
            limit=limit,
            offset=offset
        )
        
        logger.info(f"Found {len(images)} images for user {user['id']}")
        
        return [ImageResponse(**img) for img in images]
        
    except Exception as e:
        logger.error(f"Error fetching user images: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch images"
        )


@router.get("/user_images/count")
async def get_user_images_count(
    user: dict = Depends(get_current_user)
):
    """
    Get total count of images for current user
    
    Returns:
        dict with total count
    """
    try:
        total = await ImageService.get_user_image_count(user['id'])
        
        return {
            "success": True,
            "total": total,
            "user_id": user['id']
        }
        
    except Exception as e:
        logger.error(f"Error fetching image count: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch image count"
        )


@router.get("/images/{image_id}", response_model=ImageResponse)
async def get_image(
    image_id: str,
    user: dict = Depends(get_current_user)
):
    """
    Get specific image by ID
    
    Only returns image if it belongs to the authenticated user
    (unless user is admin)
    """
    try:
        image = await ImageService.get_image_by_id(image_id)
        
        if not image:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Image not found"
            )
        
        # Check ownership (unless admin)
        if image['user_id'] != user['id'] and user.get('role') != 'admin':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to access this image"
            )
        
        return ImageResponse(**image)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching image {image_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch image"
        )


@router.delete("/images/{image_id}")
async def delete_image(
    image_id: str,
    user: dict = Depends(get_current_user)
):
    """
    Delete an image
    
    Only allows deletion if image belongs to the authenticated user
    (unless user is admin)
    """
    r2_service = get_r2_service()
    
    try:
        image = await ImageService.get_image_by_id(image_id)
        
        if not image:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Image not found"
            )
        
        # Check ownership (unless admin)
        if image['user_id'] != user['id'] and user.get('role') != 'admin':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to delete this image"
            )
        
        # Delete from R2
        await r2_service.delete_image(image['image_url'])
        
        # Delete from database
        success = await ImageService.delete_image(image_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete image from database"
            )
        
        logger.info(f"Deleted image {image_id} by user {user['id']}")
        
        return {
            "success": True,
            "message": "Image deleted successfully",
            "image_id": image_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting image {image_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete image"
        )


@router.get("/recent_images", response_model=List[ImageResponse])
async def get_recent_images(
    limit: int = 10,
    user: dict = Depends(get_current_user)
):
    """
    Get most recent images for current user
    
    Args:
        limit: Maximum number of images to return (default: 10, max: 50)
    
    Returns:
        List of recent image records
    """
    try:
        # Validate and cap limit
        if limit > 50:
            limit = 50
        
        images = await ImageService.get_recent_images(
            user_id=user['id'],
            limit=limit
        )
        
        return [ImageResponse(**img) for img in images]
        
    except Exception as e:
        logger.error(f"Error fetching recent images: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch recent images"
        )
