import os
import re
import json
import httpx
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from bson import ObjectId
from app.db import db
from app.security import get_current_user

router = APIRouter(prefix="/apply", tags=["apply"])

class ApplyRequest(BaseModel):
    job_id: str
    resume_id: Optional[str] = None

class StatusUpdateRequest(BaseModel):
    status: str  # Applied, Interviewing, Offered, Rejected, Withdrawn
    notes: Optional[str] = None

class AddNoteRequest(BaseModel):
    note: str

class ExternalApplyRequest(BaseModel):
    job_id: str
    external: bool = True  # Flag to indicate external application


async def calculate_dynamic_match_score(resume_text: str, job_description: str, required_skills: list) -> float:
    """Calculate accurate match score using AI Service"""
    from app.services.ai_service import ai_service
    
    prompt = f"""Analyze resume match with job requirements.

Resume Skills/Experience:
{resume_text[:2000]}

Job Description:
{job_description[:1000]}

Required Skills:
{', '.join(required_skills)}

Calculate match score (0-100) based on:
1. Skills match (50% weight) - How many required skills are present?
2. Experience relevance (30% weight) - Does experience align with job?
3. Education fit (20% weight) - Educational background suitable?

Return ONLY a JSON object:
{{"match_score": <number 0-100>, "reasoning": "<brief explanation>"}}
"""
    
    try:
        content = await ai_service.generate_content(prompt)
        
        json_match = re.search(r'\{[\s\S]*\}', content)
        if json_match:
            result = json.loads(json_match.group(0))
            score = float(result.get("match_score", 65))
            print(f"✅ AI match score: {score}% - {result.get('reasoning', '')}")
            return max(0, min(100, score))
        else:
            return fallback_match_calculation(resume_text, required_skills)
            
    except Exception as e:
        print(f"❌ AI match score error: {e}")
        return fallback_match_calculation(resume_text, required_skills)

def fallback_match_calculation(resume_text: str, required_skills: list) -> float:
    """Fallback skill-based matching"""
    if not required_skills:
        return 50.0
    
    resume_lower = resume_text.lower()
    matched = sum(1 for skill in required_skills if skill.lower() in resume_lower)
    score = (matched / len(required_skills)) * 100
    print(f"✅ Fallback match score: {score:.1f}% ({matched}/{len(required_skills)} skills)")
    return round(score, 1)


@router.post("/")
async def apply_to_job(payload: ApplyRequest, current_user: dict = Depends(get_current_user)):
    """Apply to a job with optional resume selection and lifecycle tracking"""
    try:
        user_id = current_user.get("user_id")
        job_id = payload.job_id
        resume_id = payload.resume_id
        
        if not ObjectId.is_valid(job_id):
            raise HTTPException(status_code=400, detail="Invalid job ID")
        
        # Check if already applied
        existing = await db.applications.find_one({
            "user_id": user_id,
            "job_id": job_id
        })
        
        if existing:
            raise HTTPException(status_code=400, detail="Already applied to this job")
        
        # Get job
        job = await db.jobs.find_one({"_id": ObjectId(job_id)})
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        # Get resume (specific or default)
        if resume_id and ObjectId.is_valid(resume_id):
            resume = await db.resumes.find_one({
                "_id": ObjectId(resume_id),
                "user_id": user_id
            })
        else:
            resume = await db.resumes.find_one({"user_id": user_id})
        
        if not resume:
            raise HTTPException(status_code=400, detail="Please upload a resume first")
        
        # Calculate match score
        resume_text = f"Skills: {', '.join(resume.get('skills', []))}. Experience: {', '.join(resume.get('experience', []))}"
        match_score = await calculate_dynamic_match_score(
            resume_text,
            job.get("description") or job.get("job_description", ""),
            job.get("required_skills") or job.get("skills_required", [])
        )
        
        
        # Store complete job details in application (so user can see job info even if job is deleted)
        application = {
            "user_id": user_id,
            "job_id": job_id,
            "resume_id": str(resume.get("_id")),
            "resume_filename": resume.get("filename", ""),
            "status": "Applied",
            "match_score": match_score,
            "created_at": datetime.utcnow(),
            # Store complete job snapshot
            "job_details": {
                "title": job.get("title", "Unknown"),
                "company": job.get("company", "Unknown"),
                "location": job.get("location", "Unknown"),
                "description": job.get("description", ""),
                "required_skills": job.get("required_skills", []),
                "job_type": job.get("job_type", "Full-time"),
                "remote_type": job.get("remote_type", "On-site"),
                "salary": job.get("salary"),
                "job_url": job.get("job_url"),
                "source_platform": job.get("source_platform", "Unknown"),
                "category": job.get("category", "Other"),
                "experience_level": job.get("experience_level")
            }
        }

        
        result = await db.applications.insert_one(application)
        
        # ⭐ LIFECYCLE MANAGEMENT: Add user to job's applied_by array
        await db.jobs.update_one(
            {"_id": ObjectId(job_id)},
            {
                "$push": {
                    "applied_by": {
                        "user_id": user_id,
                        "applied_at": datetime.utcnow(),
                        "status": "Applied",
                        "application_id": str(result.inserted_id)
                    }
                },
                "$inc": {"apply_count": 1},
                "$unset": {"expires_at": ""}  # Remove expiration mark - job will be kept permanently
            }
        )
        
        # Log lifecycle event
        from app.services.job_lifecycle import log_job_event
        await log_job_event(job_id, "applied", user_id, {
            "application_id": str(result.inserted_id),
            "match_score": match_score
        })
        
        print(f"✅ Application created: {result.inserted_id} (Match: {match_score}%)")
        print(f"✅ Job {job_id} marked as applied by user {user_id}")
        
        return {
            "message": "Application submitted successfully. Job will be kept in your history permanently.",
            "application_id": str(result.inserted_id),
            "match_score": match_score
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error applying to job: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/me")
async def get_my_applications(
    current_user: dict = Depends(get_current_user),
    status: Optional[str] = Query(None)
):
    """Get current user's applications"""
    try:
        user_id = current_user.get("user_id")
        
        filter_query = {"user_id": user_id}
        if status and status != "all":
            filter_query["status"] = status
        
        applications = []
        async for app in db.applications.find(filter_query).sort("created_at", -1):
            try:
                job = await db.jobs.find_one({"_id": ObjectId(app.get("job_id", ""))})
                
                applications.append({
                    "_id": str(app.get("_id", "")),
                    "job_id": str(app.get("job_id", "")),
                    "job_title": job.get("title", "Unknown") if job else "Unknown",
                    "company": job.get("company", "Unknown") if job else "Unknown",
                    "location": job.get("location", "Unknown") if job else "Unknown",
                    "match_score": app.get("match_score", 0),
                    "status": app.get("status", "pending"),
                    "created_at": app.get("created_at")
                })
            except Exception as e:
                print(f"Error processing application: {e}")
                continue
        
        return applications
    except Exception as e:
        print(f"❌ Error fetching applications: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{application_id}/status")
async def update_application_status(
    application_id: str,
    request: StatusUpdateRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update application status with timeline tracking"""
    try:
        user_id = current_user.get("user_id")
        
        # Validate status
        valid_statuses = ["Applied", "Interviewing", "Offered", "Rejected", "Withdrawn"]
        if request.status not in valid_statuses:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
            )
        
        # Get application
        application = await db.applications.find_one({
            "_id": ObjectId(application_id),
            "user_id": user_id
        })
        
        if not application:
            raise HTTPException(status_code=404, detail="Application not found")
        
        # Create timeline event
        timeline_event = {
            "status": request.status,
            "timestamp": datetime.utcnow(),
            "notes": request.notes
        }
        
        # Update application
        update_data = {
            "status": request.status,
            "updated_at": datetime.utcnow()
        }
        
        # Add timeline event
        await db.applications.update_one(
            {"_id": ObjectId(application_id)},
            {
                "$set": update_data,
                "$push": {"timeline": timeline_event}
            }
        )
        
        print(f"✅ Updated application {application_id} status to {request.status}")
        
        return {
            "message": "Status updated successfully",
            "status": request.status
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error updating status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{application_id}/notes")
async def add_application_note(
    application_id: str,
    request: AddNoteRequest,
    current_user: dict = Depends(get_current_user)
):
    """Add a note to an application"""
    try:
        user_id = current_user.get("user_id")
        
        # Get application
        application = await db.applications.find_one({
            "_id": ObjectId(application_id),
            "user_id": user_id
        })
        
        if not application:
            raise HTTPException(status_code=404, detail="Application not found")
        
        # Create note
        note = {
            "content": request.note,
            "timestamp": datetime.utcnow()
        }
        
        # Add note to application
        await db.applications.update_one(
            {"_id": ObjectId(application_id)},
            {
                "$push": {"notes": note},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        
        print(f"✅ Added note to application {application_id}")
        
        return {
            "message": "Note added successfully",
            "note": note
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error adding note: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{application_id}/timeline")
async def get_application_timeline(
    application_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get application timeline with all status changes"""
    try:
        user_id = current_user.get("user_id")
        
        application = await db.applications.find_one({
            "_id": ObjectId(application_id),
            "user_id": user_id
        })
        
        if not application:
            raise HTTPException(status_code=404, detail="Application not found")
        
        timeline = application.get("timeline", [])
        notes = application.get("notes", [])
        
        return {
            "timeline": timeline,
            "notes": notes,
            "current_status": application.get("status", "Applied")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching timeline: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats/overview")
async def get_application_stats(
    current_user: dict = Depends(get_current_user)
):
    """Get application statistics by status"""
    try:
        user_id = current_user.get("user_id")
        
        # Get all applications
        applications = await db.applications.find({"user_id": user_id}).to_list(1000)
        
        # Count by status
        stats = {
            "total": len(applications),
            "applied": 0,
            "interviewing": 0,
            "offered": 0,
            "rejected": 0,
            "withdrawn": 0
        }
        
        for app in applications:
            status = app.get("status", "Applied").lower()
            if status in stats:
                stats[status] += 1
        
        # Calculate success rate
        if stats["total"] > 0:
            stats["success_rate"] = round(
                (stats["offered"] / stats["total"]) * 100, 1
            )
        else:
            stats["success_rate"] = 0
        
        return stats
        
    except Exception as e:
        print(f"❌ Error fetching stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{application_id}")
async def delete_application(application_id: str, current_user: dict = Depends(get_current_user)):
    """Delete an application"""
    try:
        if not ObjectId.is_valid(application_id):
            raise HTTPException(status_code=400, detail="Invalid application ID")
        
        user_id = current_user.get("user_id")
        
        result = await db.applications.delete_one({
            "_id": ObjectId(application_id),
            "user_id": user_id
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Application not found")
        
        print(f"✅ Application deleted: {application_id}")
        return {"message": "Application deleted"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error deleting application: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/external")
async def mark_external_application(payload: ExternalApplyRequest, current_user: dict = Depends(get_current_user)):
    """Mark an external job as applied (for jobs with external URLs)"""
    try:
        user_id = current_user.get("user_id")
        job_id = payload.job_id
        
        if not ObjectId.is_valid(job_id):
            raise HTTPException(status_code=400, detail="Invalid job ID")
        
        # Check if already applied
        existing = await db.applications.find_one({
            "user_id": user_id,
            "job_id": job_id
        })
        
        if existing:
            raise HTTPException(status_code=400, detail="Already marked as applied")
        
        # Get job
        job = await db.jobs.find_one({"_id": ObjectId(job_id)})
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        
        # Create application record for external jobs with complete job snapshot
        application = {
            "user_id": user_id,
            "job_id": job_id,
            "external_application": True,  # Flag to indicate external
            "match_score": 0,  # No match score for external
            "status": "Applied",
            "created_at": datetime.utcnow(),
            "notes": [],
            # Store complete job snapshot
            "job_details": {
                "title": job.get("title", "Unknown"),
                "company": job.get("company", "Unknown"),
                "location": job.get("location", "Unknown"),
                "description": job.get("description", ""),
                "required_skills": job.get("required_skills", []),
                "job_type": job.get("job_type", "Full-time"),
                "remote_type": job.get("remote_type", "On-site"),
                "salary": job.get("salary"),
                "job_url": job.get("job_url"),
                "source_platform": job.get("source_platform", "Unknown"),
                "category": job.get("category", "Other"),
                "experience_level": job.get("experience_level")
            }
        }
        
        result = await db.applications.insert_one(application)
        
        # Update job's applied_by array
        await db.jobs.update_one(
            {"_id": ObjectId(job_id)},
            {
                "$push": {
                    "applied_by": {
                        "user_id": user_id,
                        "applied_at": datetime.utcnow(),
                        "status": "Applied",
                        "application_id": str(result.inserted_id),
                        "external": True
                    }
                },
                "$inc": {"apply_count": 1}
            }
        )
        
        print(f"✅ External application marked: {job.get('title')} by user {user_id}")
        
        return {
            "message": "Application marked successfully",
            "application_id": str(result.inserted_id),
            "job_title": job.get("title"),
            "external": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error marking external application: {e}")
        raise HTTPException(status_code=500, detail=str(e))

