"""
Authentication Routes
Handles user registration and login
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from typing import Optional
import logging

from app.config import settings
from app.utils.supabase_client import supabase_admin

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth", tags=["Authentication"])


class RegisterRequest(BaseModel):
    """User registration request"""
    name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    """User login request"""
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    """Authentication response"""
    success: bool
    message: str
    user_id: Optional[str] = None
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    user: Optional[dict] = None


@router.post("/register", response_model=AuthResponse)
async def register(request: RegisterRequest):
    """
    Register a new user
    
    This endpoint:
    1. Creates user in Supabase Auth
    2. Creates user record in public.users table (bypasses RLS with admin client)
    3. Returns access token for immediate login
    """
    try:
        logger.info(f"Registration attempt for email: {request.email}")
        
        # Step 1: Create auth user with Supabase Auth
        try:
            auth_response = supabase_admin.auth.admin.create_user({
                "email": request.email,
                "password": request.password,
                "email_confirm": True,  # Auto-confirm email
                "user_metadata": {
                    "name": request.name
                }
            })
            
            if not auth_response.user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to create auth user"
                )
            
            user_id = auth_response.user.id
            logger.info(f"Auth user created successfully: {user_id}")
            
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Auth creation failed: {error_msg}")
            
            # Check for common errors
            if "already registered" in error_msg.lower() or "duplicate" in error_msg.lower():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )
            elif "invalid" in error_msg.lower():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid email or password format"
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Registration failed: {error_msg}"
                )
        
        # Step 2: Create user record in public.users table (admin client bypasses RLS)
        try:
            user_data = {
                "id": user_id,
                "name": request.name,
                "email": request.email,
                "credits": 100,  # Give initial free credits
                "role": "user"
            }
            
            response = supabase_admin.table("users").insert(user_data).execute()
            
            if not response.data:
                logger.error("Failed to create user record in database")
                # Try to clean up auth user
                try:
                    supabase_admin.auth.admin.delete_user(user_id)
                except:
                    pass
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to create user profile"
                )
            
            logger.info(f"User record created successfully: {user_id}")
            
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Database insertion failed: {error_msg}")
            
            # Try to clean up auth user
            try:
                supabase_admin.auth.admin.delete_user(user_id)
            except:
                pass
            
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create user profile: {error_msg}"
            )
        
        # Step 3: Generate access token for immediate login
        try:
            # Sign in to get tokens
            sign_in_response = supabase_admin.auth.sign_in_with_password({
                "email": request.email,
                "password": request.password
            })
            
            return AuthResponse(
                success=True,
                message="Registration successful! You are now logged in.",
                user_id=user_id,
                access_token=sign_in_response.session.access_token if sign_in_response.session else None,
                refresh_token=sign_in_response.session.refresh_token if sign_in_response.session else None,
                user={
                    "id": user_id,
                    "name": request.name,
                    "email": request.email,
                    "credits": 100
                }
            )
            
        except Exception as e:
            logger.warning(f"Auto-login failed, but user created: {str(e)}")
            # User was created successfully, just couldn't auto-login
            return AuthResponse(
                success=True,
                message="Registration successful! Please log in.",
                user_id=user_id,
                user={
                    "id": user_id,
                    "name": request.name,
                    "email": request.email,
                    "credits": 100
                }
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected registration error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )


@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    """
    Login existing user
    
    Returns access token and user information
    """
    try:
        logger.info(f"Login attempt for email: {request.email}")
        
        # Sign in with Supabase
        response = supabase_admin.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password
        })
        
        if not response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Get user data from database
        user_response = supabase_admin.table("users").select("*").eq("id", response.user.id).execute()
        
        user_data = user_response.data[0] if user_response.data else None
        
        return AuthResponse(
            success=True,
            message="Login successful!",
            user_id=response.user.id,
            access_token=response.session.access_token if response.session else None,
            refresh_token=response.session.refresh_token if response.session else None,
            user=user_data
        )
        
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Login failed: {error_msg}")
        
        if "invalid" in error_msg.lower() or "credentials" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Login failed: {error_msg}"
            )
