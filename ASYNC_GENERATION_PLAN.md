# Async Image Generation Solution

## Problem
Backend `/api/generate_image` is synchronous - waits for entire generation (can take 30-60 seconds), blocking the UI.

## Solution Options

### Option 1: Create Async Backend Endpoint (RECOMMENDED)
Create new endpoint `/api/generate_image_async` that:
1. Checks credits
2. Creates job
3. Deducts credits
4. Starts generation in background
5. Returns immediately with `job_id`
6. Frontend polls `/api/jobs/{job_id}/status` for updates

### Option 2: Use Background Tasks (FastAPI)
Modify existing endpoint to use `BackgroundTasks`:
```python
@router.post("/generate_image_async")
async def generate_image_async(
    request: ImageGenerationRequest,
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_current_user)
):
    # Check credits & create job
    # Deduct credits immediately
    # Add background task for generation
    background_tasks.add_task(generate_and_upload, job_id, request, user_id)
    # Return job_id immediately
```

### Option 3: Hybrid - Keep Both Endpoints
- `/api/generate_image` - Synchronous (wait for result)
- `/api/generate_image_async` - Asynchronous (queue-based)
- Frontend uses async by default

## Implementation Plan

### Step 1: Add Background Task Endpoint
File: `ai_platform/backend/app/routes/images.py`

### Step 2: Add Job Status Endpoint
```python
@router.get("/jobs/{job_id}/status")
async def get_job_status(job_id: str):
    return {
        "status": "processing|completed|failed",
        "image_url": "...",
        "progress": 45
    }
```

### Step 3: Update Frontend
Poll for job status every 2 seconds until complete.

## Quick Fix (Without Backend Changes)
Use the old ComfyUI direct approach for queueing, but call backend API after completion to record in database.
