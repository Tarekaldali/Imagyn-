"""
CRUD Operations for Images Table
Handles all database operations related to generated images
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from app.utils.supabase_client import get_supabase_admin
import logging

logger = logging.getLogger(__name__)


class ImageService:
    """Service class for image-related database operations"""
    
    @staticmethod
    async def create_image(
        user_id: str,
        job_id: str,
        prompt: str,
        image_url: str,
        model_used: str,
        status: str = "completed",
        generation_time: Optional[float] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Create a new image record
        
        Args:
            user_id: User ID who generated the image
            job_id: Associated job ID
            prompt: Text prompt used
            image_url: URL of the stored image
            model_used: Model name used for generation
            status: Image status (default: "completed")
            generation_time: Time taken to generate in seconds
            
        Returns:
            Created image data or None if failed
        """
        try:
            supabase = get_supabase_admin()
            
            image_data = {
                "user_id": user_id,
                "job_id": job_id,
                "prompt": prompt,
                "image_url": image_url,
                "model_used": model_used,
                "status": status,
                "generation_time": generation_time,
                "created_at": datetime.utcnow().isoformat()
            }
            
            response = supabase.table("images").insert(image_data).execute()
            
            if response.data:
                logger.info(f"Image created successfully: {response.data[0]['id']}")
                return response.data[0]
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to create image: {str(e)}")
            return None
    
    @staticmethod
    async def get_image_by_id(image_id: str) -> Optional[Dict[str, Any]]:
        """
        Get image by ID
        
        Args:
            image_id: Image ID
            
        Returns:
            Image data or None if not found
        """
        try:
            supabase = get_supabase_admin()
            response = supabase.table("images").select("*").eq("id", image_id).single().execute()
            return response.data if response.data else None
            
        except Exception as e:
            logger.error(f"Failed to get image: {str(e)}")
            return None
    
    @staticmethod
    async def get_images_by_user(
        user_id: str,
        limit: int = 50,
        offset: int = 0,
        status: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get all images for a specific user
        
        Args:
            user_id: User ID
            limit: Maximum number of images to return
            offset: Number of images to skip
            status: Filter by status (optional)
            
        Returns:
            List of image data
        """
        try:
            supabase = get_supabase_admin()
            query = supabase.table("images").select("*").eq("user_id", user_id)
            
            if status:
                query = query.eq("status", status)
            
            response = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
            return response.data if response.data else []
            
        except Exception as e:
            logger.error(f"Failed to get user images: {str(e)}")
            return []
    
    @staticmethod
    async def get_images_by_job(job_id: str) -> List[Dict[str, Any]]:
        """
        Get all images for a specific job
        
        Args:
            job_id: Job ID
            
        Returns:
            List of image data
        """
        try:
            supabase = get_supabase_admin()
            response = supabase.table("images").select("*").eq("job_id", job_id).execute()
            return response.data if response.data else []
            
        except Exception as e:
            logger.error(f"Failed to get job images: {str(e)}")
            return []
    
    @staticmethod
    async def get_all_images(limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """
        Get all images with pagination (admin only)
        
        Args:
            limit: Maximum number of images to return
            offset: Number of images to skip
            
        Returns:
            List of image data
        """
        try:
            supabase = get_supabase_admin()
            response = supabase.table("images").select("*").order("created_at", desc=True).range(offset, offset + limit - 1).execute()
            return response.data if response.data else []
            
        except Exception as e:
            logger.error(f"Failed to get images: {str(e)}")
            return []
    
    @staticmethod
    async def update_image_status(image_id: str, status: str) -> bool:
        """
        Update image status
        
        Args:
            image_id: Image ID
            status: New status
            
        Returns:
            True if successful, False otherwise
        """
        try:
            supabase = get_supabase_admin()
            response = supabase.table("images").update({"status": status}).eq("id", image_id).execute()
            return bool(response.data)
            
        except Exception as e:
            logger.error(f"Failed to update image status: {str(e)}")
            return False
    
    @staticmethod
    async def delete_image(image_id: str) -> bool:
        """
        Delete image record
        
        Args:
            image_id: Image ID
            
        Returns:
            True if successful, False otherwise
        """
        try:
            supabase = get_supabase_admin()
            response = supabase.table("images").delete().eq("id", image_id).execute()
            
            if response.data:
                logger.info(f"Image deleted: {image_id}")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Failed to delete image: {str(e)}")
            return False
    
    @staticmethod
    async def get_user_image_count(user_id: str) -> int:
        """
        Get total number of images for a user
        
        Args:
            user_id: User ID
            
        Returns:
            Number of images
        """
        try:
            supabase = get_supabase_admin()
            response = supabase.table("images").select("id", count="exact").eq("user_id", user_id).execute()
            return response.count if response.count else 0
            
        except Exception as e:
            logger.error(f"Failed to get image count: {str(e)}")
            return 0
    
    @staticmethod
    async def get_recent_images(user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get most recent images (for admin dashboard)
        
        Args:
            user_id: User ID
            limit: Number of images to return
            
        Returns:
            List of recent image data
        """
        try:
            supabase = get_supabase_admin()
            response = supabase.table("images").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(limit).execute()
            return response.data if response.data else []
            
        except Exception as e:
            logger.error(f"Failed to get recent images: {str(e)}")
            return []
