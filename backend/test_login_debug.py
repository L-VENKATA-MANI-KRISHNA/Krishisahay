import pymongo
import requests
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")
print(f"Testing MongoDB Connection to: {MONGODB_URL.split('@')[1] if '@' in MONGODB_URL else '...'}")

try:
    client = pymongo.MongoClient(MONGODB_URL, serverSelectionTimeoutMS=5000)
    db = client.get_database("krishi_sahay_db")
    count = db.users.count_documents({})
    print(f"✅ MongoDB Connected! User count: {count}")
except Exception as e:
    print(f"❌ MongoDB Connection Failed: {e}")

print("\nTesting Login Endpoint...")
try:
    response = requests.post("http://localhost:8000/login", json={"phone": "1234567890", "password": "password"}, timeout=5)
    print(f"Login Status: {response.status_code}")
    print(f"Login Response: {response.text}")
except Exception as e:
    print(f"❌ Login Request Failed: {e}")
