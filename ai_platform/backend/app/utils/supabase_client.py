"""
Supabase Client Setup and Authentication Utilities
Handles connection to Supabase and user authentication
"""

from supabase import create_client, Client
from app.config import settings
from typing import Optional, Dict, Any
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import logging

logger = logging.getLogger(__name__)

def _create_admin_client() -> Client:
    return create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SERVICE_ROLE_KEY
    )


def _create_public_client() -> Client:
    return create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_KEY
    )


# Initialize long-lived admin client for table operations.
supabase_admin: Client = _create_admin_client()

# Security scheme for JWT authentication
security = HTTPBearer()


def get_supabase_client() -> Client:
    """
    Get Supabase client instance for user operations
    Returns: Supabase Client with user-level permissions
    """
    return _create_public_client()


def get_supabase_admin() -> Client:
    """
    Get Supabase admin client instance
    Returns: Supabase Client with admin-level permissions
    """
    return supabase_admin


async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """
    Verify JWT token from Authorization header
    
    Args:
        credentials: HTTP Bearer credentials containing JWT token
        
    Returns:
        Dict containing user information from token
        
    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        token = credentials.credentials
        
        # Use a fresh public client so per-request auth state cannot leak between users.
        user = get_supabase_client().auth.get_user(token)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return user.user
        
    except Exception as e:
        logger.error(f"Token verification failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(user = Depends(verify_token)) -> Dict[str, Any]:
    """
    Get current authenticated user
    
    Args:
        user: User object from token verification
        
    Returns:
        Dict containing current user information
    """
    try:
        # User is a Supabase User object, access id as attribute
        user_id = getattr(user, "id", None) or user.get("id")
        logger.info(f"Fetching user details for ID: {user_id}")
        
        # Fetch full user details from database
        response = supabase_admin.table("users").select("*").eq("id", user_id).execute()
        
        logger.info(f"Supabase response: {response}")
        
        if not response.data or len(response.data) == 0:
            logger.error(f"User not found in database: {user_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User not found in database: {user_id}"
            )
        
        return response.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch user details: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch user information: {str(e)}"
        )


async def require_admin(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """
    Require user to have admin role
    
    Args:
        user: Current user from get_current_user dependency
        
    Returns:
        Dict containing admin user information
        
    Raises:
        HTTPException: If user is not an admin
    """
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    return user


def check_user_credits(user: Dict[str, Any], required_credits: int) -> bool:
    """
    Check if user has enough credits
    
    Args:
        user: User dictionary containing credits
        required_credits: Number of credits required
        
    Returns:
        True if user has enough credits, False otherwise
    """
    return user.get("credits", 0) >= required_credits


async def deduct_user_credits(user_id: str, credits: int) -> bool:
    """
    Deduct credits from user account
    
    Args:
        user_id: User ID
        credits: Number of credits to deduct
        
    Returns:
        True if successful, False otherwise
    """
    try:
        # Update user credits atomically
        response = supabase_admin.rpc(
            "deduct_credits",
            {"user_id_param": user_id, "credits_param": credits}
        ).execute()
        
        return response.data if response.data else False
        
    except Exception as e:
        logger.error(f"Failed to deduct credits: {str(e)}")
        return False
