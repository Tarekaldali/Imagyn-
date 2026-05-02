"""
Cloudflare R2 Storage Service
Handles image uploads to Cloudflare R2
"""

import boto3
from botocore.exceptions import ClientError
from app.config import settings
import logging
from typing import Optional
import uuid
from pathlib import Path
from urllib.parse import urlparse

logger = logging.getLogger(__name__)


class R2Service:
    """Service for Cloudflare R2 storage operations"""
    
    def __init__(self):
        """Initialize R2 client with credentials"""
        self.s3_client = boto3.client(
            's3',
            endpoint_url=settings.r2_endpoint_url,
            aws_access_key_id=settings.R2_ACCESS_KEY_ID,
            aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
            region_name='auto'
        )
        self.bucket_name = settings.R2_BUCKET_NAME
        self.public_url = settings.R2_PUBLIC_URL
    
    async def upload_image(
        self,
        file_path: str,
        user_id: str,
        filename: Optional[str] = None
    ) -> Optional[str]:
        """
        Upload image to R2 and return public URL
        
        Args:
            file_path: Local path to image file
            user_id: User ID for organizing files
            filename: Optional custom filename
            
        Returns:
            Public URL of uploaded image or None if failed
        """
        try:
            # Generate unique filename if not provided
            if not filename:
                ext = Path(file_path).suffix
                filename = f"{uuid.uuid4()}{ext}"
            
            # Organize by user ID
            key = f"users/{user_id}/{filename}"
            
            # Upload file
            with open(file_path, 'rb') as file_data:
                self.s3_client.put_object(
                    Bucket=self.bucket_name,
                    Key=key,
                    Body=file_data,
                    ContentType='image/png'  # Adjust based on file type
                )
            
            # Construct public URL
            image_url = f"{self.public_url}/{key}"
            logger.info(f"Image uploaded successfully: {image_url}")
            
            return image_url
            
        except ClientError as e:
            logger.error(f"Failed to upload to R2: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error uploading to R2: {str(e)}")
            return None
    
    async def delete_image(self, image_key: str) -> bool:
        """
        Delete image from R2
        
        Args:
            image_key: S3 key of image to delete
            
        Returns:
            True if successful, False otherwise
        """
        try:
            key = image_key
            if image_key.startswith("http://") or image_key.startswith("https://"):
                parsed = urlparse(image_key)
                key = parsed.path.lstrip("/")

            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=key
            )
            logger.info(f"Image deleted successfully: {key}")
            return True
            
        except ClientError as e:
            logger.error(f"Failed to delete from R2: {str(e)}")
            return False
    
    async def list_user_images(self, user_id: str) -> list:
        """
        List all images for a user
        
        Args:
            user_id: User ID
            
        Returns:
            List of image keys
        """
        try:
            prefix = f"users/{user_id}/"
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix=prefix
            )
            
            if 'Contents' in response:
                return [obj['Key'] for obj in response['Contents']]
            
            return []
            
        except ClientError as e:
            logger.error(f"Failed to list images: {str(e)}")
            return []


# Global R2 service instance
r2_service = R2Service()


def get_r2_service() -> R2Service:
    """Dependency function to get R2 service instance"""
    return r2_service
