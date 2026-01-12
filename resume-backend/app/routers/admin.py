from fastapi import APIRouter, Depends, Query, HTTPException
from datetime import datetime, timedelta
from typing import Optional
from app.db import db
from app.security import require_role
from bson import ObjectId

# ✅ Remove /api prefix - main.py will add it with prefix="/api"
router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/dashboard", response_model=dict)
async def dashboard(
    authed=Depends(lambda: require_role(["admin"])),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None)
):
    """Admin dashboard - platform statistics"""
    try:
        users = await db.users.count_documents({})
        jobs = await db.jobs.count_documents({})
        resumes = await db.resumes.count_documents({})
        
        apps_filter = {}
        if start_date and end_date:
            try:
                start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                apps_filter["created_at"] = {"$gte": start, "$lte": end}
            except:
                pass
        
        applications = await db.applications.count_documents(apps_filter)
        
        since = datetime.utcnow() - timedelta(days=30)
        apps_last_30 = await db.applications.count_documents({"created_at": {"$gte": since}})
        
        # Skill scores aggregation
        skill_scores = {}
        async for r in db.resumes.find({}):
            skills = r.get("skills", [])
            for skill in skills:
                if skill:
                    skill_scores[skill] = skill_scores.get(skill, 0) + 1
        
        sorted_skills = dict(sorted(skill_scores.items(), key=lambda x: x[1], reverse=True)[:20])
        
        # Applications timeline
        pipeline = [
            {"$match": {"created_at": {"$gte": since}}},
            {"$group": {
                "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
                "count": {"$sum": 1}
            }},
            {"$sort": {"_id": 1}}
        ]
        apps_timeline_cursor = db.applications.aggregate(pipeline)
        apps_timeline = await apps_timeline_cursor.to_list(length=None)
        
        return {
            "users": users,
            "jobs": jobs,
            "resumes": resumes,
            "applications": applications,
            "applications_last_30": apps_last_30,
            "skill_scores": sorted_skills,
            "applications_timeline": apps_timeline
        }
    except Exception as e:
        print(f"❌ Dashboard error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/applications")
async def list_all_applications(
    authed=Depends(lambda: require_role(["admin"])),
    status: Optional[str] = Query(None),
    sort_by: Optional[str] = Query("latest")
):
    """Get all applications with filtering"""
    try:
        filter_query = {}
        
        if status and status != "all":
            filter_query["status"] = status
        
        sort_config = {
            "latest": [("created_at", -1)],
            "oldest": [("created_at", 1)],
            "match-high": [("match_score", -1)],
            "match-low": [("match_score", 1)]
        }
        
        sort_order = sort_config.get(sort_by, [("created_at", -1)])
        
        applications = []
        query = db.applications.find(filter_query)
        
        for sort_field, sort_direction in sort_order:
            query = query.sort(sort_field, sort_direction)
        
        async for app in query:
            try:
                job = await db.jobs.find_one({"_id": ObjectId(app.get("job_id", ""))})
                user = await db.users.find_one({"_id": ObjectId(app.get("user_id", ""))})
                
                applications.append({
                    "_id": str(app.get("_id", "")),
                    "user_id": str(app.get("user_id", "")),
                    "job_id": str(app.get("job_id", "")),
                    "user_email": user.get("email", "Unknown") if user else "Unknown",
                    "job_title": job.get("title", "Unknown") if job else "Unknown",
                    "company": job.get("company", "Unknown") if job else "Unknown",
                    "match_score": app.get("match_score", 0),
                    "status": app.get("status", "pending"),
                    "created_at": app.get("created_at", datetime.utcnow())
                })
            except Exception as e:
                print(f"Error processing application: {e}")
                continue
        
        return applications
    except Exception as e:
        print(f"❌ Applications list error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/applications/{app_id}")
async def delete_application(
    app_id: str,
    authed=Depends(lambda: require_role(["admin"]))
):
    """Delete an application"""
    try:
        result = await db.applications.delete_one({"_id": ObjectId(app_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Application not found")
        return {"message": "Application deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/users")
async def list_all_users(
    authed=Depends(lambda: require_role(["admin"])),
    role: Optional[str] = Query(None)
):
    """Get all users"""
    try:
        filter_query = {}
        if role and role != "all":
            filter_query["role"] = role
        
        users = []
        async for user in db.users.find(filter_query):
            users.append({
                "_id": str(user.get("_id", "")),
                "name": user.get("name", ""),
                "email": user.get("email", ""),
                "role": user.get("role", "user"),
                "created_at": user.get("created_at", "")
            })
        
        return users
    except Exception as e:
        print(f"❌ Users list error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    authed=Depends(lambda: require_role(["admin"]))
):
    """Delete a user and related data"""
    try:
        await db.users.delete_one({"_id": ObjectId(user_id)})
        await db.resumes.delete_many({"user_id": user_id})
        await db.applications.delete_many({"user_id": user_id})
        return {"message": "User and related data deleted"}
    except Exception as e:
        print(f"❌ User delete error: {e}")
        raise HTTPException(status_code=400, detail=str(e))


# ==================== JOB LIFECYCLE MANAGEMENT ENDPOINTS ====================

@router.get("/jobs/lifecycle-stats")
async def get_lifecycle_stats(
    authed=Depends(lambda: require_role(["admin"]))
):
    """Get job lifecycle statistics for monitoring"""
    try:
        from app.services.job_lifecycle import get_lifecycle_stats
        
        stats = await get_lifecycle_stats()
        return stats
        
    except Exception as e:
        print(f"❌ Lifecycle stats error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/jobs/trigger-cleanup")
async def trigger_cleanup(
    authed=Depends(lambda: require_role(["admin"]))
):
    """Manually trigger job cleanup (for testing/admin)"""
    try:
        from app.services.job_scheduler import scheduler
        
        deleted_count = await scheduler.trigger_cleanup_now()
        
        return {
            "message": f"Cleanup triggered successfully",
            "deleted_count": deleted_count
        }
        
    except Exception as e:
        print(f"❌ Trigger cleanup error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/jobs/trigger-sync")
async def trigger_sync(
    authed=Depends(lambda: require_role(["admin"]))
):
    """Manually trigger job count sync (for testing/admin)"""
    try:
        from app.services.job_scheduler import scheduler
        
        updated_count = await scheduler.trigger_sync_now()
        
        return {
            "message": f"Sync triggered successfully",
            "updated_count": updated_count
        }
        
    except Exception as e:
        print(f"❌ Trigger sync error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/jobs/cleanup-logs")
async def get_cleanup_logs(
    authed=Depends(lambda: require_role(["admin"])),
    limit: int = Query(20, ge=1, le=100)
):
    """Get recent cleanup logs"""
    try:
        logs = await db.system_logs.find({
            "event": "job_cleanup"
        }).sort("timestamp", -1).limit(limit).to_list(limit)
        
        return [
            {
                "timestamp": log.get("timestamp"),
                "deleted_count": log.get("deleted_count", 0),
                "status": log.get("status", "unknown"),
                "error": log.get("error")
            }
            for log in logs
        ]
        
    except Exception as e:
        print(f"❌ Cleanup logs error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== JOB SCRAPING ENDPOINTS ====================

@router.post("/jobs/trigger-scrape")
async def trigger_scrape(
    authed=Depends(lambda: require_role(["admin"])),
    limit_per_platform: int = Query(50, ge=1, le=200)
):
    """Manually trigger job scraping from all platforms"""
    try:
        from app.services.scraping_orchestrator import orchestrator
        
        result = await orchestrator.scrape_all_platforms(limit_per_platform=limit_per_platform)
        
        return {
            "message": "Scraping completed successfully",
            "total_scraped": result["total_scraped"],
            "total_stored": result["total_stored"],
            "total_duplicates": result["total_duplicates"],
            "duration_seconds": result["duration_seconds"],
            "platforms": result["platforms"]
        }
        
    except Exception as e:
        print(f"❌ Trigger scrape error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/jobs/scraping-status")
async def get_scraping_status(
    authed=Depends(lambda: require_role(["admin"]))
):
    """Get scraping health and metrics"""
    try:
        from app.services.scraping_orchestrator import orchestrator
        
        stats = await orchestrator.get_scraping_stats()
        
        return stats
        
    except Exception as e:
        print(f"❌ Scraping status error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
