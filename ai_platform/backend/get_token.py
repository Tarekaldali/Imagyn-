import requests
import json

print("\n" + "="*50)
print("🔑 GETTING YOUR JWT TOKEN")
print("="*50 + "\n")

url = "https://vklozghpdxgripszbepj.supabase.co/auth/v1/token?grant_type=password"
headers = {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrbG96Z2hwZHhncmlwc3piZXBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3OTY4NDMsImV4cCI6MjA3NTM3Mjg0M30.dbBHRHS1gT95kt7jLhEOPPknTzE8JnhMRadUk1Tw4Jc",
    "Content-Type": "application/json"
}
data = {
    "email": "test@example.com",
    "password": "testpassword123"
}

try:
    response = requests.post(url, headers=headers, json=data)
    response.raise_for_status()
    result = response.json()
    
    print("✅ SUCCESS!\n")
    print("YOUR JWT TOKEN:")
    print("-" * 50)
    print(result['access_token'])
    print("-" * 50)
    print(f"\nUser: {result['user']['email']}")
    print(f"Valid for: {result['expires_in']} seconds (~{result['expires_in']//3600} hours)")
    print("\n" + "="*50)
    print("NEXT STEPS:")
    print("="*50)
    print("1. Copy the token above")
    print("2. Go to: http://localhost:8001/docs")
    print("3. Click 'Authorize' button")
    print("4. Enter: Bearer YOUR_TOKEN")
    print("5. Test the /api/generate_image endpoint!")
    print("="*50 + "\n")
    
except Exception as e:
    print(f"❌ ERROR: {str(e)}")
    print("\nMake sure:")
    print("- You have internet connection")
    print("- Supabase credentials are correct")
    print("- test@example.com user exists in Supabase")

input("\nPress Enter to exit...")
