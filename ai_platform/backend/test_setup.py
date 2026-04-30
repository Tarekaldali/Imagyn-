"""
Test script to verify AI Platform setup
Run this after setting up environment to check all components
"""

import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.config import settings
from app.services.comfyui_service import get_comfyui_service
from app.utils.supabase_client import supabase_admin
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def test_comfyui():
    """Test ComfyUI connection"""
    logger.info("🔍 Testing ComfyUI connection...")
    comfyui = get_comfyui_service()
    
    is_healthy = await comfyui.health_check()
    if is_healthy:
        logger.info("✅ ComfyUI is running and responding")
        
        # Get available models
        models = await comfyui.get_available_models()
        if models:
            logger.info(f"✅ Found {len(models)} available models")
            logger.info(f"   First 3 models: {models[:3]}")
        else:
            logger.warning("⚠️  No models found")
    else:
        logger.error("❌ ComfyUI is not responding")
        logger.error(f"   Check if ComfyUI is running at: {settings.COMFYUI_URL}")
        return False
    
    return True


def test_supabase():
    """Test Supabase connection"""
    logger.info("\n🔍 Testing Supabase connection...")
    
    try:
        # Try to query users table
        response = supabase_admin.table('users').select('*').limit(1).execute()
        logger.info("✅ Supabase connection successful")
        logger.info(f"   Users table accessible (found {len(response.data)} sample records)")
        return True
    except Exception as e:
        logger.error(f"❌ Supabase connection failed: {str(e)}")
        logger.error("   Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env")
        return False


def test_config():
    """Test configuration"""
    logger.info("\n🔍 Testing configuration...")
    
    checks = {
        "SUPABASE_URL": settings.SUPABASE_URL,
        "SUPABASE_KEY": settings.SUPABASE_KEY[:20] + "..." if settings.SUPABASE_KEY else None,
        "COMFYUI_URL": settings.COMFYUI_URL,
        "R2_ACCOUNT_ID": settings.R2_ACCOUNT_ID,
        "R2_BUCKET_NAME": settings.R2_BUCKET_NAME,
        "DEFAULT_MODEL": settings.DEFAULT_MODEL,
    }
    
    all_ok = True
    for key, value in checks.items():
        if value and value != "REQUIRED":
            logger.info(f"✅ {key}: Configured")
        else:
            logger.error(f"❌ {key}: NOT CONFIGURED")
            all_ok = False
    
    return all_ok


async def test_generation():
    """Test image generation (requires credits)"""
    logger.info("\n🔍 Testing image generation...")
    logger.info("   This will use ComfyUI to generate a test image")
    
    comfyui = get_comfyui_service()
    
    result = await comfyui.generate_image(
        prompt="test image, simple pattern",
        width=512,
        height=512,
        steps=10  # Quick test
    )
    
    if result['success']:
        logger.info("✅ Image generation successful!")
        logger.info(f"   Generation time: {result['generation_time']:.2f}s")
        logger.info(f"   Image saved to: {result['image_path']}")
        
        # Clean up
        try:
            os.remove(result['image_path'])
            logger.info("   Cleaned up test image")
        except:
            pass
        
        return True
    else:
        logger.error(f"❌ Image generation failed: {result.get('error')}")
        return False


async def main():
    """Run all tests"""
    logger.info("="*60)
    logger.info("🚀 AI Image Generation Platform - Setup Verification")
    logger.info("="*60)
    
    results = {}
    
    # Test 1: Configuration
    results['config'] = test_config()
    
    # Test 2: Supabase
    results['supabase'] = test_supabase()
    
    # Test 3: ComfyUI
    results['comfyui'] = await test_comfyui()
    
    # Test 4: Generation (only if ComfyUI works)
    if results['comfyui']:
        logger.info("\n❓ Test image generation? This will take ~15-30 seconds.")
        response = input("   Run generation test? (y/n): ")
        if response.lower() == 'y':
            results['generation'] = await test_generation()
        else:
            logger.info("   Skipping generation test")
            results['generation'] = None
    else:
        results['generation'] = None
    
    # Summary
    logger.info("\n" + "="*60)
    logger.info("📊 Test Summary")
    logger.info("="*60)
    
    for test_name, result in results.items():
        if result is None:
            status = "⏭️  SKIPPED"
        elif result:
            status = "✅ PASSED"
        else:
            status = "❌ FAILED"
        logger.info(f"{status}  {test_name.upper()}")
    
    # Overall result
    passed = sum(1 for r in results.values() if r is True)
    total = sum(1 for r in results.values() if r is not None)
    
    logger.info(f"\nResult: {passed}/{total} tests passed")
    
    if all(r in [True, None] for r in results.values()):
        logger.info("\n✅ Setup verification complete! You're ready to go! 🎉")
        logger.info("\nNext steps:")
        logger.info("1. Start the backend: python -m app.main")
        logger.info("2. Open Swagger UI: http://localhost:8000/docs")
        logger.info("3. Create a user in Supabase dashboard")
        logger.info("4. Test image generation via API")
    else:
        logger.info("\n⚠️  Some tests failed. Please fix the issues above.")
        logger.info("\nCommon fixes:")
        logger.info("- Make sure .env file is configured")
        logger.info("- Start ComfyUI: python main.py")
        logger.info("- Run database_schema.sql in Supabase")
    
    logger.info("="*60)


if __name__ == "__main__":
    asyncio.run(main())
