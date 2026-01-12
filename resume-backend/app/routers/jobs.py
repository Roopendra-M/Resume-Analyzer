from datetime import datetime
import re
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from pydantic import BaseModel
from typing import List, Optional
from bson import ObjectId

from app.db import db
from app.security import require_role, get_current_user, get_current_user_optional
from app.services.job_lifecycle import (
    cleanup_expired_jobs,
    log_job_event,
    remove_deletion_mark,
    mark_job_for_deletion
)
from app.services.job_matcher import calculate_job_match

router = APIRouter(prefix="/jobs", tags=["Jobs"])


# =========================
# Pydantic Schemas
# =========================

class JobCreate(BaseModel):
    title: str
    company: str
    location: str
    salary: Optional[str] = None
    job_type: str = "Full-time"
    description: str
    required_skills: List[str]
    end_date: Optional[str] = None


class JobUpdate(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    salary: Optional[str] = None
    job_type: Optional[str] = None
    description: Optional[str] = None
    required_skills: Optional[List[str]] = None
    end_date: Optional[str] = None


# =========================
# GET ALL JOBS
# =========================

@router.get("/")
async def list_jobs(
    background_tasks: BackgroundTasks,
    category: Optional[str] = Query(None),
    remote_type: Optional[str] = Query(None),
    source_platform: Optional[str] = Query(None),
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Get all active jobs with filters.
    Triggers lifecycle cleanup in background.
    """
    try:
        # 🔄 Run lifecycle cleanup in background
        background_tasks.add_task(cleanup_expired_jobs)

        now = datetime.utcnow()
        query = {
            "$or": [
                {"end_date": {"$gte": now}},
                {"end_date": None}
            ]
        }

        if category:
            query["category"] = category
        if remote_type:
            query["remote_type"] = remote_type
        if source_platform:
            query["source_platform"] = source_platform

        docs = await db.jobs.find(query).sort("created_at", -1).limit(100).to_list(100)

        user_id = current_user.get("user_id") if current_user else None
        output = []

        for job in docs:
            is_saved = user_id in job.get("saved_by", []) if user_id else False
            is_applied = any(
                a.get("user_id") == user_id for a in job.get("applied_by", [])
            ) if user_id else False

            match_data = await calculate_job_match(job, user_id, db)

            output.append({
                "_id": str(job["_id"]),
                "title": job.get("title"),
                "company": job.get("company"),
                "location": job.get("location"),
                "salary": job.get("salary"),
                "job_type": job.get("job_type"),
                "description": job.get("description"),
                "required_skills": job.get("required_skills", []),
                "created_at": job.get("created_at"),
                "end_date": job.get("end_date"),
                "apply_count": job.get("apply_count", 0),
                "save_count": job.get("save_count", 0),
                "is_saved": is_saved,
                "is_applied": is_applied,
                "match_score": match_data.get("overall_score", 0),
                "category": job.get("category"),
                "remote_type": job.get("remote_type"),
                "source_platform": job.get("source_platform"),
                "job_url": job.get("job_url")  # Added for external job applications
            })

        print(f"✅ Returning {len(output)} jobs")  # Debug log
        return output

    except Exception as e:
        print(f"❌ Error fetching jobs: {e}")  # Debug log
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))



# =========================
# RECOMMENDATIONS (Must be before /{job_id})
# =========================

@router.get("/recommendations")
async def get_job_recommendations(
    limit: int = 5,
    current_user: dict = Depends(get_current_user)
):
    """
    Get job recommendations based on user's resume skills.
    This endpoint MUST be defined before /{job_id} to avoid 400 errors.
    """
    try:
        user_id = current_user.get("user_id")
        
        # 1. Get user's resume for skills
        resume = await db.resumes.find_one({"user_id": user_id}, sort=[("uploaded_at", -1)])
        user_skills = []
        if resume:
            user_skills = resume.get("skills", [])
        
        # 2. Find jobs matching skills
        query = {}
        if user_skills:
            # Case insensitive regex match for skills
            skill_regexes = [re.compile(re.escape(skill), re.IGNORECASE) for skill in user_skills]
            query = {
                "required_skills": {"$in": skill_regexes},
                "end_date": {"$gte": datetime.utcnow()} # Only active jobs
            }
        
        # 3. Get jobs
        jobs = await db.jobs.find(query).sort("created_at", -1).limit(limit).to_list(limit)
        
        # 4. If few matches, fill with recent jobs
        if len(jobs) < limit:
            remaining = limit - len(jobs)
            exclude_ids = [j["_id"] for j in jobs]
            
            fallback_query = {
                "_id": {"$nin": exclude_ids},
                 "$or": [
                    {"end_date": {"$gte": datetime.utcnow()}},
                    {"end_date": None}
                ]
            }
            
            recent_jobs = await db.jobs.find(fallback_query).sort("created_at", -1).limit(remaining).to_list(remaining)
            jobs.extend(recent_jobs)
            
        # 5. Format output
        output = []
        for job in jobs:
            match_data = await calculate_job_match(job, user_id, db)
            
            output.append({
                "_id": str(job["_id"]),
                "title": job.get("title"),
                "company": job.get("company"),
                "location": job.get("location"),
                "salary": job.get("salary"),
                "job_type": job.get("job_type"),
                "match_score": match_data.get("overall_score", 0),
                "required_skills": job.get("required_skills", [])[:5],
                "posted_at": job.get("created_at")
            })
            
        return output

    except Exception as e:
        print(f"❌ Error getting recommendations: {e}")
        return []

# =========================
# GET SINGLE JOB
# =========================

@router.get("/{job_id}")
async def get_job(job_id: str, current_user: Optional[dict] = Depends(get_current_user_optional)):
    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID")

    job = await db.jobs.find_one({"_id": ObjectId(job_id)})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    user_id = current_user.get("user_id") if current_user else None

    return {
        "_id": str(job["_id"]),
        "title": job.get("title"),
        "company": job.get("company"),
        "location": job.get("location"),
        "salary": job.get("salary"),
        "job_type": job.get("job_type"),
        "description": job.get("description"),
        "required_skills": job.get("required_skills", []),
        "created_at": job.get("created_at"),
        "end_date": job.get("end_date"),
        "apply_count": job.get("apply_count", 0),
        "save_count": job.get("save_count", 0),
        "is_saved": user_id in job.get("saved_by", []) if user_id else False,
        "is_applied": any(
            a.get("user_id") == user_id for a in job.get("applied_by", [])
        ) if user_id else False,
        "category": job.get("category"),
        "remote_type": job.get("remote_type"),
        "source_platform": job.get("source_platform"),
    }


# =========================
# SAVE / UNSAVE JOB
# =========================

@router.post("/{job_id}/save")
async def save_job(job_id: str, current_user: dict = Depends(get_current_user)):
    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID")

    user_id = current_user["user_id"]
    job = await db.jobs.find_one({"_id": ObjectId(job_id)})

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if user_id in job.get("saved_by", []):
        return {"message": "Already saved"}

    await db.jobs.update_one(
        {"_id": ObjectId(job_id)},
        {
            "$push": {"saved_by": user_id},
            "$inc": {"save_count": 1},
            "$unset": {"expires_at": ""}
        }
    )

    await log_job_event(job_id, "saved", user_id)
    await remove_deletion_mark(job_id)

    return {"message": "Job saved successfully"}


@router.post("/{job_id}/unsave")
async def unsave_job(job_id: str, current_user: dict = Depends(get_current_user)):
    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID")

    user_id = current_user["user_id"]

    await db.jobs.update_one(
        {"_id": ObjectId(job_id)},
        {
            "$pull": {"saved_by": user_id},
            "$inc": {"save_count": -1}
        }
    )

    await log_job_event(job_id, "unsaved", user_id)

    job = await db.jobs.find_one({"_id": ObjectId(job_id)})
    if job and not job.get("saved_by") and not job.get("applied_by"):
        await mark_job_for_deletion(job_id, days=3)

    return {"message": "Job unsaved successfully"}


# =========================
# ADMIN CRUD
# =========================

@router.post("/")
async def create_job(payload: JobCreate, user: dict = Depends(require_role(["admin"]))):
    end_date = None
    if payload.end_date:
        end_date = datetime.fromisoformat(payload.end_date.replace("Z", "+00:00"))

    new_job = {
        "title": payload.title.strip(),
        "company": payload.company.strip(),
        "location": payload.location.strip(),
        "salary": payload.salary,
        "job_type": payload.job_type,
        "description": payload.description.strip(),
        "required_skills": payload.required_skills,
        "created_at": datetime.utcnow(),
        "end_date": end_date,
        "created_by": user["user_id"],
        "applied_by": [],
        "saved_by": [],
        "apply_count": 0,
        "save_count": 0,
        "expires_at": None
    }

    result = await db.jobs.insert_one(new_job)
    await log_job_event(str(result.inserted_id), "created", user["user_id"])

    return {"_id": str(result.inserted_id), "message": "Job created successfully"}


@router.put("/{job_id}")
async def update_job(
    job_id: str,
    payload: JobUpdate,
    user: dict = Depends(require_role(["admin"]))
):
    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID")

    update_data = {k: v for k, v in payload.dict().items() if v is not None}

    if "end_date" in update_data:
        update_data["end_date"] = datetime.fromisoformat(
            update_data["end_date"].replace("Z", "+00:00")
        )

    update_data["updated_at"] = datetime.utcnow()

    await db.jobs.update_one({"_id": ObjectId(job_id)}, {"$set": update_data})
    return {"message": "Job updated successfully"}


@router.delete("/{job_id}")
async def delete_job(job_id: str, user: dict = Depends(require_role(["admin"]))):
    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID")

    result = await db.jobs.delete_one({"_id": ObjectId(job_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Job not found")

    await log_job_event(job_id, "deleted", user["user_id"])
    return {"message": "Job deleted successfully"}
