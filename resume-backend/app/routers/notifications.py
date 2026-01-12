"""
Notifications Router
Real-time notification system for users
"""
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from typing import List
from app.security import get_current_user
from app.db import db
from app.models import NotificationOut
from bson import ObjectId

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("/", response_model=List[NotificationOut])
async def get_notifications(
    current_user: dict = Depends(get_current_user),
    unread_only: bool = False,
    limit: int = 50
):
    """Get user notifications"""
    try:
        user_id = current_user.get("user_id")
        
        query = {"user_id": user_id}
        if unread_only:
            query["read"] = False
        
        notifications = []
        async for notif in db.notifications.find(query).sort("created_at", -1).limit(limit):
            notifications.append({
                "id": str(notif["_id"]),
                "user_id": notif["user_id"],
                "title": notif["title"],
                "message": notif["message"],
                "type": notif.get("type", "info"),
                "action_url": notif.get("action_url"),
                "read": notif.get("read", False),
                "created_at": notif["created_at"]
            })
        
        return notifications
        
    except Exception as e:
        print(f"❌ Error fetching notifications: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/unread-count")
async def get_unread_count(current_user: dict = Depends(get_current_user)):
    """Get count of unread notifications"""
    try:
        user_id = current_user.get("user_id")
        count = await db.notifications.count_documents({
            "user_id": user_id,
            "read": False
        })
        
        return {"unread_count": count}
        
    except Exception as e:
        print(f"❌ Error counting notifications: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{notification_id}/read")
async def mark_as_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Mark notification as read"""
    try:
        user_id = current_user.get("user_id")
        
        result = await db.notifications.update_one(
            {
                "_id": ObjectId(notification_id),
                "user_id": user_id
            },
            {"$set": {"read": True}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        return {"message": "Notification marked as read"}
        
    except Exception as e:
        print(f"❌ Error marking notification as read: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/mark-all-read")
async def mark_all_read(current_user: dict = Depends(get_current_user)):
    """Mark all notifications as read"""
    try:
        user_id = current_user.get("user_id")
        
        result = await db.notifications.update_many(
            {"user_id": user_id, "read": False},
            {"$set": {"read": True}}
        )
        
        return {
            "message": "All notifications marked as read",
            "count": result.modified_count
        }
        
    except Exception as e:
        print(f"❌ Error marking all notifications as read: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a notification"""
    try:
        user_id = current_user.get("user_id")
        
        result = await db.notifications.delete_one({
            "_id": ObjectId(notification_id),
            "user_id": user_id
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        return {"message": "Notification deleted"}
        
    except Exception as e:
        print(f"❌ Error deleting notification: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Helper function to create notifications (used by other routers)
async def create_notification(
    user_id: str,
    title: str,
    message: str,
    notification_type: str = "info",
    action_url: str = None
):
    """Create a new notification for a user"""
    try:
        notification = {
            "user_id": user_id,
            "title": title,
            "message": message,
            "type": notification_type,
            "action_url": action_url,
            "read": False,
            "created_at": datetime.utcnow()
        }
        
        await db.notifications.insert_one(notification)
        print(f"✅ Notification created for user {user_id}: {title}")
        
    except Exception as e:
        print(f"❌ Error creating notification: {e}")


__all__ = ["router", "create_notification"]
