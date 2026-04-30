"""
Pydantic Models for Request/Response Validation
Defines data schemas for API endpoints
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum


# ============= Enums =============

class JobStatus(str, Enum):
    """Job status enumeration"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class TransactionType(str, Enum):
    """Transaction type enumeration"""
    PURCHASE = "purchase"
    REFUND = "refund"
    BONUS = "bonus"
    DEDUCTION = "deduction"


class TransactionStatus(str, Enum):
    """Transaction status enumeration"""
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"


class UserRole(str, Enum):
    """User role enumeration"""
    USER = "user"
    ADMIN = "admin"


# ============= Request Models =============

class ImageGenerationRequest(BaseModel):
    """Request model for image generation"""
    prompt: str = Field(..., min_length=1, max_length=1000, description="Text prompt for image generation")
    negative_prompt: Optional[str] = Field(None, max_length=1000, description="Negative prompt")
    model_name: Optional[str] = Field(None, description="Model to use for generation")
    width: Optional[int] = Field(768, ge=256, le=2048, description="Image width")
    height: Optional[int] = Field(768, ge=256, le=2048, description="Image height")
    steps: Optional[int] = Field(25, ge=1, le=150, description="Number of generation steps")
    cfg_scale: Optional[float] = Field(7.0, ge=1.0, le=20.0, description="CFG scale")
    sampler: Optional[str] = Field("dpmpp_2m", description="Sampler name")
    seed: Optional[int] = Field(-1, description="Seed for reproducibility")
    
    @validator('prompt')
    def validate_prompt(cls, v):
        """Validate prompt is not empty after stripping whitespace"""
        if not v.strip():
            raise ValueError('Prompt cannot be empty')
        return v.strip()
    
    @validator('width', 'height')
    def validate_dimensions(cls, v):
        """Validate dimensions are multiples of 8"""
        if v % 8 != 0:
            raise ValueError('Width and height must be multiples of 8')
        return v


class UserUpdateRequest(BaseModel):
    """Request model for updating user"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[str] = Field(None, description="User email")


class TransactionCreateRequest(BaseModel):
    """Request model for creating transaction"""
    user_id: str = Field(..., description="User ID")
    amount: float = Field(..., gt=0, description="Transaction amount")
    credits_added: int = Field(..., gt=0, description="Credits to add")
    type: TransactionType = Field(..., description="Transaction type")


# ============= Response Models =============

class UserResponse(BaseModel):
    """Response model for user data"""
    id: str
    name: str
    email: str
    credits: int
    role: str
    plan_id: Optional[str]
    created_at: datetime
    last_login: Optional[datetime]
    
    class Config:
        from_attributes = True


class ImageResponse(BaseModel):
    """Response model for image data"""
    id: str
    user_id: str
    job_id: str
    prompt: str
    image_url: str
    model_used: str
    status: str
    generation_time: Optional[float]
    created_at: datetime
    
    class Config:
        from_attributes = True


class JobResponse(BaseModel):
    """Response model for job data"""
    id: str
    user_id: str
    prompt: str
    model_name: str
    gpu_time: Optional[float]
    status: str
    started_at: Optional[datetime]
    finished_at: Optional[datetime]
    error_message: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


class TransactionResponse(BaseModel):
    """Response model for transaction data"""
    id: str
    user_id: str
    amount: float
    credits_added: int
    type: str
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class PlanResponse(BaseModel):
    """Response model for plan data"""
    id: str
    name: str
    price: float
    credits: int
    duration_days: int
    description: Optional[str]
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class ImageGenerationResponse(BaseModel):
    """Response model for image generation endpoint"""
    success: bool
    message: str
    job_id: str
    image_id: Optional[str] = None
    image_url: Optional[str] = None
    credits_remaining: int
    generation_time: Optional[float] = None


class UserImagesResponse(BaseModel):
    """Response model for user images endpoint"""
    success: bool
    images: List[ImageResponse]
    total: int


class AdminDashboardResponse(BaseModel):
    """Response model for admin dashboard"""
    users: List[UserResponse]
    images: List[ImageResponse]
    jobs: List[JobResponse]
    transactions: List[TransactionResponse]
    stats: dict


class ErrorResponse(BaseModel):
    """Standard error response"""
    success: bool = False
    error: str
    detail: Optional[str] = None
