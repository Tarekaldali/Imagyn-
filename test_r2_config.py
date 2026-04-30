"""
Test R2 Upload - Quick diagnostic script
Run this to verify R2 is configured correctly
"""

import asyncio
import sys
import os
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / "ai_platform" / "backend"
sys.path.insert(0, str(backend_path))

# Change to backend directory to load .env properly
os.chdir(backend_path)

async def test_r2():
    """Test R2 configuration and upload"""
    print("=" * 60)
    print("R2 CONFIGURATION TEST")
    print("=" * 60)
    
    try:
        from app.services.r2_service import get_r2_service
        from app.config import settings
        
        print("\n✅ Imports successful")
        
        # Check configuration
        print("\n📋 Configuration:")
        print(f"   R2_ACCOUNT_ID: {'✅ Set' if settings.R2_ACCOUNT_ID else '❌ Missing'}")
        print(f"   R2_ACCESS_KEY_ID: {'✅ Set' if settings.R2_ACCESS_KEY_ID else '❌ Missing'}")
        print(f"   R2_SECRET_ACCESS_KEY: {'✅ Set' if settings.R2_SECRET_ACCESS_KEY else '❌ Missing'}")
        print(f"   R2_BUCKET_NAME: {settings.R2_BUCKET_NAME if settings.R2_BUCKET_NAME else '❌ Missing'}")
        print(f"   R2_PUBLIC_URL: {settings.R2_PUBLIC_URL if settings.R2_PUBLIC_URL else '❌ Missing'}")
        
        if not all([
            settings.R2_ACCOUNT_ID,
            settings.R2_ACCESS_KEY_ID,
            settings.R2_SECRET_ACCESS_KEY,
            settings.R2_BUCKET_NAME,
            settings.R2_PUBLIC_URL
        ]):
            print("\n❌ R2 configuration incomplete!")
            print("   Please set all R2 environment variables in .env file")
            return False
        
        # Get R2 service
        print("\n🔄 Initializing R2 service...")
        r2_service = get_r2_service()
        print("✅ R2 service initialized")
        
        # Create a test file
        test_file_path = "test_r2_upload.txt"
        with open(test_file_path, "w") as f:
            f.write("Test file for R2 upload verification")
        
        print(f"\n📤 Testing upload with file: {test_file_path}")
        
        # Test upload
        image_url = await r2_service.upload_image(
            file_path=test_file_path,
            user_id="test-user-123"
        )
        
        # Clean up test file
        os.remove(test_file_path)
        
        if image_url:
            print(f"✅ Upload successful!")
            print(f"   Image URL: {image_url}")
            print(f"\n🔗 Try opening this URL in your browser to verify:")
            print(f"   {image_url}")
            return True
        else:
            print("❌ Upload failed - R2 service returned None/empty")
            print("   Check backend logs for detailed error messages")
            return False
            
    except ImportError as e:
        print(f"\n❌ Import error: {e}")
        print("   Make sure you're running from the project root directory")
        return False
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("\n🔍 Testing R2 Upload Configuration...\n")
    result = asyncio.run(test_r2())
    print("\n" + "=" * 60)
    if result:
        print("✅ R2 IS WORKING CORRECTLY")
    else:
        print("❌ R2 HAS ISSUES - CHECK CONFIGURATION")
    print("=" * 60)
    sys.exit(0 if result else 1)
