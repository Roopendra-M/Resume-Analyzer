# app/routers/preferences.py
"""
User Preferences Router

Manages user job preferences for personalized job recommendations.
"""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from app.db import db
from app.security import get_current_user
from app.models import UserPreferences, PreferencesOut

router = APIRouter(prefix="/preferences", tags=["preferences"])


@router.get("/", response_model=PreferencesOut)
async def get_preferences(current_user: dict = Depends(get_current_user)):
    """Get user's job preferences"""
    try:
        user_id = current_user.get("user_id")
        
        # Find user preferences
        prefs_doc = await db.user_preferences.find_one({"user_id": user_id})
        
        if not prefs_doc:
            # Return default preferences
            return PreferencesOut(
                user_id=user_id,
                preferences=UserPreferences(),
                updated_at=datetime.utcnow()
            )
        
        return PreferencesOut(
            user_id=user_id,
            preferences=UserPreferences(**prefs_doc.get("preferences", {})),
            updated_at=prefs_doc.get("updated_at", datetime.utcnow())
        )
        
    except Exception as e:
        print(f"❌ Error getting preferences: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/", response_model=PreferencesOut)
async def update_preferences(
    preferences: UserPreferences,
    current_user: dict = Depends(get_current_user)
):
    """Update user's job preferences"""
    try:
        user_id = current_user.get("user_id")
        
        # Validate job categories
        valid_categories = [
            "Data Science", "Machine Learning", "Frontend", "Backend",
            "DevOps", "Mobile", "Full Stack", "Other"
        ]
        
        for category in preferences.job_categories:
            if category not in valid_categories:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid job category: {category}. Valid categories: {', '.join(valid_categories)}"
                )
        
        # Validate remote preference
        valid_remote = ["Remote", "Hybrid", "On-site", "Any"]
        if preferences.remote_preference and preferences.remote_preference not in valid_remote:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid remote preference. Valid options: {', '.join(valid_remote)}"
            )
        
        # Validate experience level
        valid_experience = ["Entry", "Mid", "Senior", "Lead", None]
        if preferences.experience_level and preferences.experience_level not in valid_experience:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid experience level. Valid options: Entry, Mid, Senior, Lead"
            )
        
        # Update or insert preferences
        prefs_data = {
            "user_id": user_id,
            "preferences": preferences.dict(),
            "updated_at": datetime.utcnow()
        }
        
        await db.user_preferences.update_one(
            {"user_id": user_id},
            {"$set": prefs_data},
            upsert=True
        )
        
        print(f"✅ Preferences updated for user {user_id}")
        
        return PreferencesOut(
            user_id=user_id,
            preferences=preferences,
            updated_at=datetime.utcnow()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error updating preferences: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/")
async def reset_preferences(current_user: dict = Depends(get_current_user)):
    """Reset user preferences to defaults"""
    try:
        user_id = current_user.get("user_id")
        
        result = await db.user_preferences.delete_one({"user_id": user_id})
        
        if result.deleted_count > 0:
            print(f"✅ Preferences reset for user {user_id}")
            return {"message": "Preferences reset to defaults"}
        else:
            return {"message": "No preferences to reset"}
        
    except Exception as e:
        print(f"❌ Error resetting preferences: {e}")
        raise HTTPException(status_code=500, detail=str(e))
