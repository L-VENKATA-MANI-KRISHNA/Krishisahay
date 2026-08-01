import os
import pymongo
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")
print(f"Testing connection to: {MONGODB_URL[:20]}...")

try:
    client = pymongo.MongoClient(MONGODB_URL, serverSelectionTimeoutMS=5000)
    # Force a connection verification
    client.admin.command('ping')
    print("✅ Successfully connected to MongoDB Atlas!")
    
    db = client.get_database("krishi_sahay_db")
    print(f"✅ Database selected: {db.name}")
    
except Exception as e:
    print(f"❌ Connection failed: {e}")
