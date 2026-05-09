"""
Admin Routes
Lightweight operational endpoints for the website dashboard.
"""

from fastapi import APIRouter, Depends, HTTPException, status
import logging

from app.services.image_service import ImageService
from app.services.job_service import JobService
from app.services.user_service import UserService
from app.utils.supabase_client import require_admin

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/overview")
async def get_admin_overview(admin_user: dict = Depends(require_admin)):
    """Return overview data for the admin dashboard."""
    try:
        users = await UserService.get_all_users(limit=100, offset=0)
        jobs = await JobService.get_all_jobs(limit=120, offset=0)
        images = await ImageService.get_recent_images(limit=24)

        active_jobs = [job for job in jobs if job.get("status") in {"pending", "processing"}]
        completed_jobs = [job for job in jobs if job.get("status") == "completed"]
        failed_jobs = [job for job in jobs if job.get("status") == "failed"]
        admin_count = len([user for user in users if user.get("role") == "admin"])
        total_credits = sum(int(user.get("credits", 0) or 0) for user in users)

        return {
            "stats": {
                "total_users": len(users),
                "admin_users": admin_count,
                "active_jobs": len(active_jobs),
                "completed_jobs": len(completed_jobs),
                "failed_jobs": len(failed_jobs),
                "recent_images": len(images),
                "credit_balance_total": total_credits,
            },
            "users": users,
            "jobs": jobs,
            "images": images,
            "viewer": admin_user,
        }
    except Exception as exc:
        logger.error(f"Failed to load admin overview: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load admin overview",
        )
