"""
Main FastAPI Application
Entry point for the AI Image Generation Platform API
"""

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import logging
import time

# Import routers (will be created)
# from app.routes import images, users, admin, auth

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI application
app = FastAPI(
    title="AI Image Generation Platform API",
    description="Production-ready API for AI image generation with credit system",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# ============================================
# CORS Configuration
# ============================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*"  # Allow all origins for development - restrict in production
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# ============================================
# Middleware
# ============================================

@app.middleware("http")
async def log_requests(request: Request, call_next):
    """
    Log all incoming requests with timing
    """
    start_time = time.time()
    
    # Log request
    logger.info(f"Request: {request.method} {request.url.path}")
    
    # Process request
    response = await call_next(request)
    
    # Calculate processing time
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    
    # Log response
    logger.info(f"Response: {response.status_code} - {process_time:.3f}s")
    
    return response


# ============================================
# Exception Handlers
# ============================================

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Handle validation errors with detailed messages
    """
    logger.error(f"Validation error: {exc.errors()}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": "Validation Error",
            "detail": exc.errors()
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """
    Handle uncaught exceptions
    """
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": "Internal Server Error",
            "detail": "An unexpected error occurred. Please try again later."
        }
    )


# ============================================
# Health Check Endpoints
# ============================================

@app.get("/")
async def root():
    """Root endpoint - API information"""
    return {
        "name": "AI Image Generation Platform API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """
    Health check endpoint for monitoring
    """
    return {
        "status": "healthy",
        "timestamp": time.time()
    }


@app.get("/ping")
async def ping():
    """Simple ping endpoint"""
    return {"message": "pong"}


# ============================================
# API Routers
# ============================================

# Include image generation routes
from app.routes import images
app.include_router(
    images.router,
    prefix="/api",
    tags=["Images"]
)

# Include authentication routes
from app.routes import auth
app.include_router(
    auth.router,
    tags=["Authentication"]
)

# Include user management routes
# app.include_router(
#     users.router,
#     prefix="/api/users",
#     tags=["Users"]
# )

# Include admin routes
# app.include_router(
#     admin.router,
#     prefix="/api/admin",
#     tags=["Admin"]
# )


# ============================================
# Startup/Shutdown Events
# ============================================

@app.on_event("startup")
async def startup_event():
    """
    Run on application startup
    Initialize connections, load models, etc.
    """
    logger.info("🚀 Application starting up...")
    logger.info("✅ Application startup complete")


@app.on_event("shutdown")
async def shutdown_event():
    """
    Run on application shutdown
    Cleanup connections, save state, etc.
    """
    logger.info("🛑 Application shutting down...")
    logger.info("✅ Application shutdown complete")


# ============================================
# Main Entry Point
# ============================================

if __name__ == "__main__":
    import uvicorn
    from app.config import settings
    
    uvicorn.run(
        "main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=True if not settings.is_production else False,
        log_level="info"
    )
