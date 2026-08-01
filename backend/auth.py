from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import os
import pymongo
from datetime import datetime, timedelta
from typing import Optional
from jose import jwt, JWTError
from passlib.context import CryptContext
from pydantic import BaseModel

# ... existing imports ...

# OAuth2 Scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# ... existing code ...

def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        phone: str = payload.get("sub")
        if phone is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
        
    collection = get_database()
    user = collection.find_one({"phone": phone})
    if user is None:
        raise credentials_exception
        
    return {"id": str(user["_id"]), "name": user["name"], "phone": user["phone"], "created_at": user.get("created_at")}

# Configuration
SECRET_KEY = "SECRET_KEY_GO_HERE_FOR_DEV_ONLY" # In prod, use env var
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 7 Days
MONGODB_URL = os.getenv("MONGODB_URL")

# Security Context
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

# Models for Data Transfer
class UserSignup(BaseModel):
    name: str
    phone: str
    password: str

class UserLogin(BaseModel):
    phone: str
    password: str

# MongoDB Connection
client = None
db = None
users_collection = None

def get_database():
    global client, db, users_collection
    if client is None:
        try:
            client = pymongo.MongoClient(MONGODB_URL, serverSelectionTimeoutMS=5000)
            db = client.get_database("krishi_sahay_db")
            users_collection = db.get_collection("users")
            # Create unique index on phone
            users_collection.create_index("phone", unique=True)
            print("Connected to MongoDB Atlas successfully!")
        except Exception as e:
            print(f"Failed to connect to MongoDB: {e}")
            raise e
    return users_collection

# Helper Functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Auth Logic
def register_user(user: UserSignup):
    try:
        collection = get_database()
        
        # Check if exists
        if collection.find_one({"phone": user.phone}):
            return {"error": "User already exists"}
            
        hashed_pw = get_password_hash(user.password)
        user_doc = {
            "name": user.name,
            "phone": user.phone,
            "hashed_password": hashed_pw,
            "created_at": datetime.utcnow()
        }
        
        collection.insert_one(user_doc)
        return {"message": "User registered successfully"}
    except Exception as e:
        return {"error": str(e)}

def authenticate_user(user: UserLogin):
    try:
        collection = get_database()
        record = collection.find_one({"phone": user.phone})
        
        if not record:
            return None
        
        if not verify_password(user.password, record["hashed_password"]):
            return None
            
        # Generate Token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.phone, "name": record["name"], "id": str(record["_id"])},
            expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer", "name": record["name"]}
    except Exception as e:
        print(f"Auth error: {e}")
        return None
