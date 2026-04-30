"""
Test R2 Connection
"""
import sys
sys.path.insert(0, '.')

from r2_uploader import test_r2_connection, s3_client, R2_BUCKET_NAME, R2_ENDPOINT, R2_ACCESS_KEY_ID

print("=" * 60)
print("R2 CONNECTION TEST")
print("=" * 60)
print(f"Endpoint: {R2_ENDPOINT}")
print(f"Bucket: {R2_BUCKET_NAME}")
print(f"Access Key: {R2_ACCESS_KEY_ID[:10]}...")
print("=" * 60)

print("\n1. Testing connection...")
if test_r2_connection():
    print("✅ Connection successful!")
    
    print("\n2. Testing bucket access...")
    try:
        response = s3_client.list_objects_v2(Bucket=R2_BUCKET_NAME, MaxKeys=5)
        print(f"✅ Bucket accessible!")
        print(f"   Objects in bucket: {response.get('KeyCount', 0)}")
        
        if 'Contents' in response:
            print("\n   Latest files:")
            for obj in response['Contents'][:5]:
                print(f"   - {obj['Key']}")
    except Exception as e:
        print(f"❌ Bucket access failed: {e}")
else:
    print("❌ Connection failed!")

print("\n" + "=" * 60)
