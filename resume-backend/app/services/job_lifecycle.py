# app/services/job_lifecycle.py
"""
Job Lifecycle Management Service

Handles automatic deletion of jobs after 3 days if not applied/saved.
Tracks job interactions (applies, saves) and manages job expiration.
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from bson import ObjectId
from app.db import db


async def cleanup_expired_jobs() -> int:
    """
    Delete jobs older than 1 day (24 hours) with no applications or saves.
    
    Returns:
        Number of jobs deleted
    """
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=1)  # Changed from 3 days to 1 day (24 hours)
        
        # Delete jobs that are:
        # 1. Created more than 1 day (24 hours) ago
        # 2. Have no users in applied_by array
        # 3. Have no users in saved_by array
        result = await db.jobs.delete_many({
            "created_at": {"$lt": cutoff_date},
            "$expr": {
                "$and": [
                    {"$eq": [{"$size": {"$ifNull": ["$applied_by", []]}}, 0]},
                    {"$eq": [{"$size": {"$ifNull": ["$saved_by", []]}}, 0]}
                ]
            }
        })
        
        deleted_count = result.deleted_count
        
        if deleted_count > 0:
            print(f"✅ Lifecycle Cleanup: Deleted {deleted_count} expired jobs")
            
            # Log cleanup event
            await log_cleanup_event(deleted_count, "success")
        
        return deleted_count
        
    except Exception as e:
        print(f"❌ Lifecycle Cleanup Error: {e}")
        await log_cleanup_event(0, "failed", str(e))
        return 0


async def sync_job_counts() -> int:
    """
    Synchronize apply_count and save_count for all jobs.
    
    Returns:
        Number of jobs updated
    """
    try:
        updated_count = 0
        
        # Get all jobs
        async for job in db.jobs.find({}):
            apply_count = len(job.get("applied_by", []))
            save_count = len(job.get("saved_by", []))
            
            # Update counts
            await db.jobs.update_one(
                {"_id": job["_id"]},
                {
                    "$set": {
                        "apply_count": apply_count,
                        "save_count": save_count,
                        "last_checked": datetime.utcnow()
                    }
                }
            )
            updated_count += 1
        
        if updated_count > 0:
            print(f"✅ Sync: Updated counts for {updated_count} jobs")
        
        return updated_count
        
    except Exception as e:
        print(f"❌ Sync Error: {e}")
        return 0


async def log_job_event(
    job_id: str,
    event_type: str,
    user_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None
) -> None:
    """
    Log job lifecycle events for monitoring.
    
    Args:
        job_id: Job ID
        event_type: Type of event (created, applied, saved, unsaved, deleted)
        user_id: User ID who triggered the event
        details: Additional event details
    """
    try:
        event = {
            "job_id": job_id,
            "event_type": event_type,
            "user_id": user_id,
            "timestamp": datetime.utcnow(),
            "details": details or {}
        }
        
        await db.job_lifecycle_logs.insert_one(event)
        
    except Exception as e:
        print(f"❌ Error logging job event: {e}")


async def log_cleanup_event(
    deleted_count: int,
    status: str,
    error: Optional[str] = None
) -> None:
    """
    Log cleanup events for monitoring.
    
    Args:
        deleted_count: Number of jobs deleted
        status: Status of cleanup (success/failed)
        error: Error message if failed
    """
    try:
        event = {
            "event": "job_cleanup",
            "timestamp": datetime.utcnow(),
            "deleted_count": deleted_count,
            "status": status,
            "error": error
        }
        
        await db.system_logs.insert_one(event)
        
    except Exception as e:
        print(f"❌ Error logging cleanup event: {e}")


async def mark_job_for_deletion(job_id: str, days: int = 3) -> bool:
    """
    Mark a job for deletion after specified days.
    
    Args:
        job_id: Job ID to mark
        days: Number of days until deletion
        
    Returns:
        True if marked successfully
    """
    try:
        if not ObjectId.is_valid(job_id):
            return False
        
        expires_at = datetime.utcnow() + timedelta(days=days)
        
        result = await db.jobs.update_one(
            {"_id": ObjectId(job_id)},
            {"$set": {"expires_at": expires_at}}
        )
        
        return result.modified_count > 0
        
    except Exception as e:
        print(f"❌ Error marking job for deletion: {e}")
        return False


async def remove_deletion_mark(job_id: str) -> bool:
    """
    Remove deletion mark from a job (when applied or saved).
    
    Args:
        job_id: Job ID to unmark
        
    Returns:
        True if unmarked successfully
    """
    try:
        if not ObjectId.is_valid(job_id):
            return False
        
        result = await db.jobs.update_one(
            {"_id": ObjectId(job_id)},
            {"$unset": {"expires_at": ""}}
        )
        
        return result.modified_count > 0
        
    except Exception as e:
        print(f"❌ Error removing deletion mark: {e}")
        return False


async def get_lifecycle_stats() -> Dict[str, Any]:
    """
    Get job lifecycle statistics for admin monitoring.
    
    Returns:
        Dictionary with lifecycle statistics
    """
    try:
        total_jobs = await db.jobs.count_documents({})
        
        jobs_with_applies = await db.jobs.count_documents({
            "$expr": {"$gt": [{"$size": {"$ifNull": ["$applied_by", []]}}, 0]}
        })
        
        jobs_with_saves = await db.jobs.count_documents({
            "$expr": {"$gt": [{"$size": {"$ifNull": ["$saved_by", []]}}, 0]}
        })
        
        jobs_pending_deletion = await db.jobs.count_documents({
            "expires_at": {"$ne": None, "$exists": True}
        })
        
        total_applications = await db.applications.count_documents({})
        
        # Get recent cleanup logs
        recent_cleanups = await db.system_logs.find({
            "event": "job_cleanup"
        }).sort("timestamp", -1).limit(5).to_list(5)
        
        return {
            "total_jobs_in_db": total_jobs,
            "jobs_with_applies": jobs_with_applies,
            "jobs_with_saves": jobs_with_saves,
            "jobs_pending_deletion": jobs_pending_deletion,
            "total_applications": total_applications,
            "recent_cleanups": [
                {
                    "timestamp": log.get("timestamp"),
                    "deleted_count": log.get("deleted_count", 0),
                    "status": log.get("status", "unknown")
                }
                for log in recent_cleanups
            ]
        }
        
    except Exception as e:
        print(f"❌ Error getting lifecycle stats: {e}")
        return {
            "error": str(e),
            "total_jobs_in_db": 0,
            "jobs_with_applies": 0,
            "jobs_with_saves": 0,
            "jobs_pending_deletion": 0,
            "total_applications": 0,
            "recent_cleanups": []
        }
