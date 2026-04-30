"""
Cloudflare R2 Storage Helper
Uploads images to Cloudflare R2 bucket
"""
import boto3
import os
from pathlib import Path
from datetime import datetime
import mimetypes
from dotenv import load_dotenv

# Load environment variables from backend .env file
env_path = Path(__file__).parent.parent / 'ai_platform' / 'backend' / '.env'
load_dotenv(env_path)

# R2 Configuration from environment
R2_ACCOUNT_ID = os.getenv('R2_ACCOUNT_ID', 'a6bb4bcd2a241bc5468c132b32e16738')
R2_ACCESS_KEY_ID = os.getenv('R2_ACCESS_KEY_ID', '80817e834fe8960604d0203a599e7aa3')
R2_SECRET_ACCESS_KEY = os.getenv('R2_SECRET_ACCESS_KEY', '4df0be20c1986f6c5328dff7e677dca4e39f1205148992d88ad4d3e2dfef9f57')
R2_BUCKET_NAME = os.getenv('R2_BUCKET_NAME', 'ai-images')
R2_ENDPOINT = os.getenv('R2_ENDPOINT', f'https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com')
R2_PUBLIC_URL = os.getenv('R2_PUBLIC_URL', f'https://pub-{R2_ACCOUNT_ID}.r2.dev')

print(f"[R2 Config] Account ID: {R2_ACCOUNT_ID}")
print(f"[R2 Config] Bucket: {R2_BUCKET_NAME}")
print(f"[R2 Config] Endpoint: {R2_ENDPOINT}")
print(f"[R2 Config] Public URL: {R2_PUBLIC_URL}")

# Initialize S3 client for R2
s3_client = boto3.client(
    's3',
    endpoint_url=R2_ENDPOINT,
    aws_access_key_id=R2_ACCESS_KEY_ID,
    aws_secret_access_key=R2_SECRET_ACCESS_KEY,
    region_name='auto'
)

def upload_image_to_r2(file_path, user_id=None, metadata=None):
    """
    Upload an image file to Cloudflare R2
    
    Args:
        file_path: Path to the image file
        user_id: Optional user ID to organize images
        metadata: Optional dictionary of metadata
        
    Returns:
        dict: {
            'success': bool,
            'url': str (public URL),
            'key': str (R2 object key),
            'error': str (if failed)
        }
    """
    try:
        file_path = Path(file_path)
        
        if not file_path.exists():
            return {'success': False, 'error': 'File not found'}
        
        # Generate R2 key (path in bucket)
        timestamp = datetime.now().strftime('%Y/%m/%d')
        filename = file_path.name
        
        if user_id:
            r2_key = f'users/{user_id}/{timestamp}/{filename}'
        else:
            r2_key = f'generated/{timestamp}/{filename}'
        
        # Detect content type
        content_type, _ = mimetypes.guess_type(str(file_path))
        if not content_type:
            content_type = 'image/png'
        
        # Prepare metadata
        extra_args = {
            'ContentType': content_type,
            'ACL': 'public-read'  # Make images publicly accessible
        }
        
        if metadata:
            extra_args['Metadata'] = {k: str(v) for k, v in metadata.items()}
        
        # Upload to R2
        with open(file_path, 'rb') as f:
            s3_client.upload_fileobj(
                f,
                R2_BUCKET_NAME,
                r2_key,
                ExtraArgs=extra_args
            )
        
        # Generate public URL
        public_url = f'{R2_PUBLIC_URL}/{r2_key}'
        
        print(f'[R2 Upload] Success: {filename} → {r2_key}')
        print(f'[R2 Upload] Public URL: {public_url}')
        
        return {
            'success': True,
            'url': public_url,
            'key': r2_key,
            'bucket': R2_BUCKET_NAME,
            'filename': filename
        }
        
    except Exception as e:
        print(f'[R2 Upload] Error: {e}')
        return {
            'success': False,
            'error': str(e)
        }

def upload_file_content_to_r2(file_content, filename, user_id=None, metadata=None):
    """
    Upload file content directly to R2 (without saving to disk first)
    
    Args:
        file_content: File bytes or file-like object
        filename: Name for the file
        user_id: Optional user ID
        metadata: Optional metadata dict
        
    Returns:
        dict: Same as upload_image_to_r2
    """
    try:
        # Generate R2 key
        timestamp = datetime.now().strftime('%Y/%m/%d')
        
        if user_id:
            r2_key = f'users/{user_id}/{timestamp}/{filename}'
        else:
            r2_key = f'generated/{timestamp}/{filename}'
        
        # Detect content type
        content_type, _ = mimetypes.guess_type(filename)
        if not content_type:
            content_type = 'image/png'
        
        # Prepare metadata
        extra_args = {
            'ContentType': content_type,
            'ACL': 'public-read'
        }
        
        if metadata:
            extra_args['Metadata'] = {k: str(v) for k, v in metadata.items()}
        
        # Upload to R2
        if isinstance(file_content, bytes):
            from io import BytesIO
            file_obj = BytesIO(file_content)
        else:
            file_obj = file_content
            
        s3_client.upload_fileobj(
            file_obj,
            R2_BUCKET_NAME,
            r2_key,
            ExtraArgs=extra_args
        )
        
        # Generate public URL
        public_url = f'{R2_PUBLIC_URL}/{r2_key}'
        
        print(f'[R2 Upload] Success: {filename} → {r2_key}')
        print(f'[R2 Upload] Public URL: {public_url}')
        
        return {
            'success': True,
            'url': public_url,
            'key': r2_key,
            'bucket': R2_BUCKET_NAME,
            'filename': filename
        }
        
    except Exception as e:
        print(f'[R2 Upload] Error: {e}')
        return {
            'success': False,
            'error': str(e)
        }

def test_r2_connection():
    """Test R2 connection by listing buckets"""
    try:
        response = s3_client.list_buckets()
        print('[R2] Connection successful!')
        print(f'[R2] Buckets: {[b["Name"] for b in response.get("Buckets", [])]}')
        return True
    except Exception as e:
        print(f'[R2] Connection failed: {e}')
        return False

if __name__ == '__main__':
    # Test the connection
    test_r2_connection()
