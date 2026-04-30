"""
Job Service - CRUD Operations for Jobs Table
Handles all database operations related to image generation jobs
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from app.utils.supabase_client import get_supabase_admin
import logging

logger = logging.getLogger(__name__)


class JobService:
    """Service class for job-related database operations"""
    
    @staticmethod
    async def create_job(
        user_id: str,
        prompt: str,
        model_name: str,
        status: str = "pending"
    ) -> Optional[Dict[str, Any]]:
        """
        Create a new job record
        
        Args:
            user_id: User ID who initiated the job
            prompt: Text prompt for generation
            model_name: Model to use
            status: Initial status (default: "pending")
            
        Returns:
            Created job data or None if failed
        """
        try:
            supabase = get_supabase_admin()
            
            job_data = {
                "user_id": user_id,
                "prompt": prompt,
                "model_name": model_name,
                "status": status,
                "created_at": datetime.utcnow().isoformat()
            }
            
            response = supabase.table("jobs").insert(job_data).execute()
            
            if response.data:
                logger.info(f"Job created successfully: {response.data[0]['id']}")
                return response.data[0]
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to create job: {str(e)}")
            return None
    
    @staticmethod
    async def get_job_by_id(job_id: str) -> Optional[Dict[str, Any]]:
        """Get job by ID"""
        try:
            supabase = get_supabase_admin()
            response = supabase.table("jobs").select("*").eq("id", job_id).single().execute()
            return response.data if response.data else None
        except Exception as e:
            logger.error(f"Failed to get job: {str(e)}")
            return None
    
    @staticmethod
    async def update_job_status(
        job_id: str,
        status: str,
        error_message: Optional[str] = None,
        image_url: Optional[str] = None
    ) -> bool:
        """Update job status and optionally set error message or image URL"""
        try:
            supabase = get_supabase_admin()
            update_data = {"status": status}
            
            if status == "processing" and not error_message:
                update_data["started_at"] = datetime.utcnow().isoformat()
            elif status in ["completed", "failed"]:
                update_data["finished_at"] = datetime.utcnow().isoformat()
            
            if error_message:
                update_data["error_message"] = error_message
            
            if image_url:
                update_data["image_url"] = image_url
            
            response = supabase.table("jobs").update(update_data).eq("id", job_id).execute()
            return bool(response.data)
        except Exception as e:
            logger.error(f"Failed to update job status: {str(e)}")
            return False
    
    @staticmethod
    async def update_job_gpu_time(job_id: str, gpu_time: float) -> bool:
        """Update job GPU time"""
        try:
            supabase = get_supabase_admin()
            response = supabase.table("jobs").update({"gpu_time": gpu_time}).eq("id", job_id).execute()
            return bool(response.data)
        except Exception as e:
            logger.error(f"Failed to update GPU time: {str(e)}")
            return False
    
    @staticmethod
    async def get_user_jobs(user_id: str, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
        """Get all jobs for a user"""
        try:
            supabase = get_supabase_admin()
            response = supabase.table("jobs").select("*").eq("user_id", user_id)\
                .order("created_at", desc=True).range(offset, offset + limit - 1).execute()
            return response.data if response.data else []
        except Exception as e:
            logger.error(f"Failed to get user jobs: {str(e)}")
            return []
    
    @staticmethod
    async def get_all_jobs(limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """Get all jobs (admin only)"""
        try:
            supabase = get_supabase_admin()
            response = supabase.table("jobs").select("*").order("created_at", desc=True)\
                .range(offset, offset + limit - 1).execute()
            return response.data if response.data else []
        except Exception as e:
            logger.error(f"Failed to get jobs: {str(e)}")
            return []
