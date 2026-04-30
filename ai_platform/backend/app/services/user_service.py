"""
CRUD Operations for Users Table
Handles all database operations related to users
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from app.utils.supabase_client import get_supabase_admin
import logging

logger = logging.getLogger(__name__)


class UserService:
    """Service class for user-related database operations"""
    
    @staticmethod
    async def create_user(
        user_id: str,
        email: str,
        name: str,
        credits: int = 100,
        role: str = "user"
    ) -> Optional[Dict[str, Any]]:
        """
        Create a new user in the database
        
        Args:
            user_id: Unique user ID (from Supabase Auth)
            email: User email
            name: User name
            credits: Initial credits (default: 100)
            role: User role (default: "user")
            
        Returns:
            Created user data or None if failed
        """
        try:
            supabase = get_supabase_admin()
            
            user_data = {
                "id": user_id,
                "email": email,
                "name": name,
                "credits": credits,
                "role": role,
                "created_at": datetime.utcnow().isoformat(),
                "last_login": datetime.utcnow().isoformat()
            }
            
            response = supabase.table("users").insert(user_data).execute()
            
            if response.data:
                logger.info(f"User created successfully: {user_id}")
                return response.data[0]
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to create user: {str(e)}")
            return None
    
    @staticmethod
    async def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get user by ID
        
        Args:
            user_id: User ID
            
        Returns:
            User data or None if not found
        """
        try:
            supabase = get_supabase_admin()
            response = supabase.table("users").select("*").eq("id", user_id).single().execute()
            return response.data if response.data else None
            
        except Exception as e:
            logger.error(f"Failed to get user: {str(e)}")
            return None
    
    @staticmethod
    async def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
        """
        Get user by email
        
        Args:
            email: User email
            
        Returns:
            User data or None if not found
        """
        try:
            supabase = get_supabase_admin()
            response = supabase.table("users").select("*").eq("email", email).single().execute()
            return response.data if response.data else None
            
        except Exception as e:
            logger.error(f"Failed to get user by email: {str(e)}")
            return None
    
    @staticmethod
    async def get_all_users(limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """
        Get all users with pagination
        
        Args:
            limit: Maximum number of users to return
            offset: Number of users to skip
            
        Returns:
            List of user data
        """
        try:
            supabase = get_supabase_admin()
            response = supabase.table("users").select("*").range(offset, offset + limit - 1).execute()
            return response.data if response.data else []
            
        except Exception as e:
            logger.error(f"Failed to get users: {str(e)}")
            return []
    
    @staticmethod
    async def update_user(
        user_id: str,
        update_data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Update user information
        
        Args:
            user_id: User ID
            update_data: Dictionary of fields to update
            
        Returns:
            Updated user data or None if failed
        """
        try:
            supabase = get_supabase_admin()
            response = supabase.table("users").update(update_data).eq("id", user_id).execute()
            
            if response.data:
                logger.info(f"User updated successfully: {user_id}")
                return response.data[0]
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to update user: {str(e)}")
            return None
    
    @staticmethod
    async def update_credits(user_id: str, credits: int) -> bool:
        """
        Update user credits
        
        Args:
            user_id: User ID
            credits: New credit amount
            
        Returns:
            True if successful, False otherwise
        """
        try:
            supabase = get_supabase_admin()
            response = supabase.table("users").update({"credits": credits}).eq("id", user_id).execute()
            return bool(response.data)
            
        except Exception as e:
            logger.error(f"Failed to update credits: {str(e)}")
            return False
    
    @staticmethod
    async def deduct_credits(user_id: str, amount: int) -> bool:
        """
        Deduct credits from user account
        
        Args:
            user_id: User ID
            amount: Credits to deduct
            
        Returns:
            True if successful, False otherwise
        """
        try:
            supabase = get_supabase_admin()
            
            # Get current credits
            user = await UserService.get_user_by_id(user_id)
            if not user:
                return False
            
            current_credits = user.get("credits", 0)
            new_credits = max(0, current_credits - amount)
            
            # Update credits
            response = supabase.table("users").update({"credits": new_credits}).eq("id", user_id).execute()
            
            if response.data:
                logger.info(f"Deducted {amount} credits from user {user_id}. New balance: {new_credits}")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Failed to deduct credits: {str(e)}")
            return False
    
    @staticmethod
    async def add_credits(user_id: str, amount: int) -> bool:
        """
        Add credits to user account
        
        Args:
            user_id: User ID
            amount: Credits to add
            
        Returns:
            True if successful, False otherwise
        """
        try:
            supabase = get_supabase_admin()
            
            # Get current credits
            user = await UserService.get_user_by_id(user_id)
            if not user:
                return False
            
            current_credits = user.get("credits", 0)
            new_credits = current_credits + amount
            
            # Update credits
            response = supabase.table("users").update({"credits": new_credits}).eq("id", user_id).execute()
            
            if response.data:
                logger.info(f"Added {amount} credits to user {user_id}. New balance: {new_credits}")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Failed to add credits: {str(e)}")
            return False
    
    @staticmethod
    async def update_last_login(user_id: str) -> bool:
        """
        Update user's last login timestamp
        
        Args:
            user_id: User ID
            
        Returns:
            True if successful, False otherwise
        """
        try:
            supabase = get_supabase_admin()
            response = supabase.table("users").update({
                "last_login": datetime.utcnow().isoformat()
            }).eq("id", user_id).execute()
            
            return bool(response.data)
            
        except Exception as e:
            logger.error(f"Failed to update last login: {str(e)}")
            return False
    
    @staticmethod
    async def delete_user(user_id: str) -> bool:
        """
        Delete user (soft delete by setting is_active to false recommended)
        
        Args:
            user_id: User ID
            
        Returns:
            True if successful, False otherwise
        """
        try:
            supabase = get_supabase_admin()
            response = supabase.table("users").delete().eq("id", user_id).execute()
            
            if response.data:
                logger.info(f"User deleted: {user_id}")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Failed to delete user: {str(e)}")
            return False
