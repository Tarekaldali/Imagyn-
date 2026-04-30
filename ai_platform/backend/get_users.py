"""
Quick script to get JWT token for existing Supabase user
"""
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.utils.supabase_client import supabase_admin
from gotrue import AuthResponse
import json

def get_users():
    """Get all users from database"""
    try:
        response = supabase_admin.table('users').select('*').execute()
        print("\n📋 Users in database:")
        print("="*60)
        for user in response.data:
            print(f"\n✅ User: {user['email']}")
            print(f"   ID: {user['id']}")
            print(f"   Name: {user.get('name', 'N/A')}")
            print(f"   Credits: {user.get('credits', 0)}")
            print(f"   Role: {user.get('role', 'user')}")
        print("="*60)
        return response.data
    except Exception as e:
        print(f"❌ Error: {e}")
        return []

def create_jwt_for_user(user_id: str):
    """
    Note: This creates a service-level token, not a user JWT.
    For actual user JWT, users need to sign in via Supabase Auth.
    """
    print(f"\n🔑 To get a JWT token for user {user_id}:")
    print("\nOption 1: Use Supabase Dashboard")
    print("  1. Go to Authentication → Users")
    print("  2. Click on the user")
    print("  3. Click 'Send magic link' or reset password")
    print("  4. User signs in and gets JWT token")
    
    print("\nOption 2: Sign in programmatically (if password is set)")
    print(f"  Use the sign_in.py script")

if __name__ == "__main__":
    print("🔍 Fetching users from database...")
    users = get_users()
    
    if users:
        print(f"\n✅ Found {len(users)} user(s)")
        print("\nTo generate images, you need a JWT token.")
        print("See options above to get user JWT tokens.")
    else:
        print("\n❌ No users found in database")
        print("Create a user first in Supabase Dashboard")
