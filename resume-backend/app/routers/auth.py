from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from app.db import db
from app.security import create_access_token, verify_password, get_password_hash, get_current_user
from bson import ObjectId

# ✅ NO /api prefix
router = APIRouter(prefix="/auth", tags=["auth"])

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    """User login"""
    print(f"📝 Login attempt: {credentials.email}")
    
    user = await db.users.find_one({"email": credentials.email})
    
    if not user or not verify_password(credentials.password, user.get("password", "")):
        print(f"❌ Invalid credentials for: {credentials.email}")
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user_id = str(user["_id"]) if isinstance(user["_id"], ObjectId) else user["_id"]
    
    token = create_access_token(
        data={
            "sub": user_id,
            "role": user.get("role", "user"),
            "email": user["email"]
        },
        expires_delta=timedelta(days=7)
    )
    
    print(f"✅ Login successful: {credentials.email}")
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.get("role", "user")
    }

@router.post("/admin/login", response_model=Token)
async def admin_login(credentials: UserLogin):
    """Admin login"""
    print(f"🔐 Admin login attempt: {credentials.email}")
    
    user = await db.users.find_one({"email": credentials.email})
    
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    if user.get("role") != "admin":
        raise HTTPException(status_code=401, detail="Admin access required")
    
    if not verify_password(credentials.password, user.get("password", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user_id = str(user["_id"]) if isinstance(user["_id"], ObjectId) else user["_id"]
    
    token = create_access_token(
        data={
            "sub": user_id,
            "role": "admin",
            "email": user["email"]
        },
        expires_delta=timedelta(days=7)
    )
    
    print(f"✅ Admin login successful: {credentials.email}")
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": "admin"
    }

@router.post("/signup")
async def signup(user_data: UserCreate):
    """User signup"""
    print(f"📝 Signup attempt: {user_data.email}")
    
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = {
        "name": user_data.name,
        "email": user_data.email,
        "password": get_password_hash(user_data.password),
        "role": "user",
        "created_at": datetime.utcnow()
    }
    
    result = await db.users.insert_one(new_user)
    print(f"✅ Signup successful: {user_data.email}")
    
    return {
        "message": "User created successfully",
        "user_id": str(result.inserted_id)
    }

@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user info with fresh data from database"""
    try:
        user_id = current_user.get("user_id")
        
        # Fetch fresh user data from database
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Return user data without password
        return {
            "user_id": str(user["_id"]),
            "name": user.get("name", ""),
            "email": user.get("email", ""),
            "phone": user.get("phone", ""),
            "location": user.get("location", ""),
            "bio": user.get("bio", ""),
            "role": user.get("role", "user"),
            "created_at": user.get("created_at")
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching user: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/profile")
async def update_profile(
    payload: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update user profile"""
    try:
        user_id = current_user.get("user_id")
        
        # Only allow updating certain fields
        allowed_fields = ["name", "phone", "location", "bio"]
        update_data = {k: v for k, v in payload.items() if k in allowed_fields}
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No valid fields to update")
        
        result = await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        print(f"✅ Profile updated for user: {user_id}")
        return {"message": "Profile updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Profile update error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
