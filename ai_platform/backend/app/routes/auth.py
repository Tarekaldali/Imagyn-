"""
Authentication Routes
Handles user registration and login
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from typing import Optional
import logging
from supabase import create_client

from app.config import settings
from app.services.user_service import UserService
from app.utils.supabase_client import get_current_user, supabase_admin

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


def _create_auth_client():
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)


async def _ensure_user_profile(user_id: str, name: str, email: str) -> Optional[dict]:
    existing_user = await UserService.get_user_by_id(user_id)
    if existing_user:
        updates = {}
        if name and existing_user.get("name") != name:
            updates["name"] = name
        if email and existing_user.get("email") != email:
            updates["email"] = email
        if updates:
            updated_user = await UserService.update_user(user_id, updates)
            if updated_user:
                return updated_user
        return existing_user

    return await UserService.create_user(
        user_id=user_id,
        email=email,
        name=name,
    )


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
        
        # Step 2: Ensure user record exists in public.users.
        # Newer schemas create this automatically with an auth trigger, so we only
        # insert manually when the profile is still missing.
        try:
            user_profile = await _ensure_user_profile(
                user_id=user_id,
                name=request.name,
                email=str(request.email),
            )

            if not user_profile:
                logger.error("Failed to create user record in database")
                try:
                    supabase_admin.auth.admin.delete_user(user_id)
                except Exception:
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
            sign_in_response = _create_auth_client().auth.sign_in_with_password({
                "email": str(request.email),
                "password": request.password
            })

            await UserService.update_last_login(user_id)

            user_profile = await UserService.get_user_by_id(user_id)
            
            return AuthResponse(
                success=True,
                message="Registration successful! You are now logged in.",
                user_id=user_id,
                access_token=sign_in_response.session.access_token if sign_in_response.session else None,
                refresh_token=sign_in_response.session.refresh_token if sign_in_response.session else None,
                user=user_profile
            )
            
        except Exception as e:
            logger.warning(f"Auto-login failed, but user created: {str(e)}")
            # User was created successfully, just couldn't auto-login
            return AuthResponse(
                success=True,
                message="Registration successful! Please log in.",
                user_id=user_id,
                user=await UserService.get_user_by_id(user_id)
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
        response = _create_auth_client().auth.sign_in_with_password({
            "email": str(request.email),
            "password": request.password
        })
        
        if not response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        metadata = getattr(response.user, "user_metadata", {}) or {}
        fallback_name = metadata.get("name") or str(request.email).split("@", 1)[0]

        user_data = await _ensure_user_profile(
            user_id=response.user.id,
            name=fallback_name,
            email=str(request.email),
        )

        await UserService.update_last_login(response.user.id)
        
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


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """
    Return the authenticated user's profile.
    """
    return {
        "success": True,
        "user": current_user
    }
