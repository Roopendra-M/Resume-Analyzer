from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from app.db import db
from app.security import get_current_user, require_role
from bson import ObjectId
from collections import Counter

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/user")
async def get_user_analytics(current_user: dict = Depends(get_current_user)):
    """Get comprehensive user analytics with FIXED top skills"""
    try:
        user_id = current_user.get("user_id")
        
        # Get user's resumes and extract skills
        all_skills = []
        resume_count = 0
        
        async for resume in db.resumes.find({"user_id": user_id}):
            resume_count += 1
            skills_list = resume.get("skills", [])
            if isinstance(skills_list, list):
                all_skills.extend(skills_list)
        
        # Get applications
        apps = []
        async for app in db.applications.find({"user_id": user_id}):
            apps.append(app)
        
        # Count skill frequency from jobs applied to
        skill_frequency = Counter()
        job_skills = []
        
        for app in apps:
            try:
                job = await db.jobs.find_one({"_id": ObjectId(app.get("job_id", ""))})
                if job:
                    required_skills = job.get("required_skills", [])
                    job_skills.extend(required_skills)
                    for skill in required_skills:
                        if skill.lower() in [s.lower() for s in all_skills]:
                            skill_frequency[skill] += 1
            except:
                continue
        
        # Get top skills (prioritize matched skills, then all skills)
        if skill_frequency:
            top_skills_list = [skill for skill, count in skill_frequency.most_common(10)]
        else:
            top_skills_list = list(set(all_skills))[:10]
        
        # Skill match data for charts
        skill_match_data = []
        for skill, count in skill_frequency.most_common(10):
            skill_match_data.append({
                "skill": skill,
                "matches": count,
                "count": count  # For backward compatibility
            })
        
        # If no match data, create from all skills
        if not skill_match_data and all_skills:
            skill_counts = Counter(all_skills)
            skill_match_data = [
                {"skill": skill, "matches": count, "count": count}
                for skill, count in skill_counts.most_common(10)
            ]
        
        # Calculate statistics
        total_applications = len(apps)
        avg_match_score = sum(app.get("match_score", 0) for app in apps) / total_applications if total_applications > 0 else 0
        
        # Applications in last 30 days
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_apps = [app for app in apps if app.get("created_at", datetime.min) >= thirty_days_ago]
        
        # Match score distribution
        match_score_distribution = [
            {"range": "0-25%", "count": 0},
            {"range": "26-50%", "count": 0},
            {"range": "51-75%", "count": 0},
            {"range": "76-100%", "count": 0}
        ]
        
        for app in apps:
            score = app.get("match_score", 0)
            if score <= 25:
                match_score_distribution[0]["count"] += 1
            elif score <= 50:
                match_score_distribution[1]["count"] += 1
            elif score <= 75:
                match_score_distribution[2]["count"] += 1
            else:
                match_score_distribution[3]["count"] += 1
        
        # Applications timeline (last 30 days)
        timeline = {}
        for app in recent_apps:
            date = app.get("created_at", datetime.utcnow()).strftime("%Y-%m-%d")
            timeline[date] = timeline.get(date, 0) + 1
        
        applications_timeline = [
            {"date": date, "count": count}
            for date, count in sorted(timeline.items())
        ]
        
        # Top matching jobs
        top_matching_jobs = []
        for app in sorted(apps, key=lambda x: x.get("match_score", 0), reverse=True)[:5]:
            try:
                job = await db.jobs.find_one({"_id": ObjectId(app.get("job_id", ""))})
                if job:
                    top_matching_jobs.append({
                        "job_title": job.get("title", "Unknown"),
                        "company": job.get("company", "Unknown"),
                        "match_score": app.get("match_score", 0),
                        "applied_at": app.get("created_at")
                    })
            except:
                continue
        
        # Recommendations
        recommendations = []
        if total_applications == 0:
            recommendations.append("📝 Start applying to jobs to build your profile")
        if resume_count == 0:
            recommendations.append("📄 Upload your resume to get started")
        if avg_match_score < 60:
            recommendations.append("💡 Consider updating your resume to match job requirements better")
        if len(top_skills_list) < 5:
            recommendations.append("🎯 Add more skills to your resume for better matches")
        
        return {
            "summary": {
                "total_resumes": resume_count,
                "total_skills": len(set(all_skills)),
                "total_applications": total_applications,
                "average_match_score": round(avg_match_score, 1),
                "avg_match_score": round(avg_match_score, 1),  # Alias
                "applications_last_30_days": len(recent_apps),
                "skill_matches": len(skill_frequency)
            },
            "top_skills": top_skills_list,  # Array of strings for badges
            "skill_match_data": skill_match_data,  # Array of objects for chart
            "match_score_distribution": match_score_distribution,
            "applications_timeline": applications_timeline,
            "top_matching_jobs": top_matching_jobs,
            "recommendations": recommendations
        }
    except Exception as e:
        print(f"❌ Analytics error: {e}")
        import traceback
        traceback.print_exc()
        return {
            "summary": {
                "total_resumes": 0,
                "total_skills": 0,
                "total_applications": 0,
                "average_match_score": 0,
                "avg_match_score": 0,
                "applications_last_30_days": 0,
                "skill_matches": 0
            },
            "top_skills": [],
            "skill_match_data": [],
            "match_score_distribution": [],
            "applications_timeline": [],
            "top_matching_jobs": [],
            "recommendations": ["Upload a resume to get started!"]
        }

@router.get("/admin")
async def get_admin_analytics(user: dict = Depends(require_role(["admin"]))):
    """Get admin analytics dashboard"""
    try:
        # Count documents
        total_users = await db.users.count_documents({"role": "user"})
        total_jobs = await db.jobs.count_documents({})
        total_applications = await db.applications.count_documents({})
        total_resumes = await db.resumes.count_documents({})
        
        # Get all skills from resumes
        all_skills = []
        async for resume in db.resumes.find({}):
            skills = resume.get("skills", [])
            if isinstance(skills, list):
                all_skills.extend(skills)
        
        skill_frequency = Counter(all_skills)
        top_skills = [{"skill": skill, "count": count} for skill, count in skill_frequency.most_common(10)]
        
        # Application status breakdown
        status_counts = {
            "pending": await db.applications.count_documents({"status": "pending"}),
            "reviewed": await db.applications.count_documents({"status": "reviewed"}),
            "accepted": await db.applications.count_documents({"status": "accepted"}),
            "rejected": await db.applications.count_documents({"status": "rejected"})
        }
        
        # Recent applications
        recent_apps = []
        async for app in db.applications.find({}).sort("created_at", -1).limit(10):
            try:
                user_doc = await db.users.find_one({"_id": ObjectId(app.get("user_id", ""))})
                job_doc = await db.jobs.find_one({"_id": ObjectId(app.get("job_id", ""))})
                
                recent_apps.append({
                    "user_email": user_doc.get("email", "Unknown") if user_doc else "Unknown",
                    "job_title": job_doc.get("title", "Unknown") if job_doc else "Unknown",
                    "match_score": app.get("match_score", 0),
                    "status": app.get("status", "pending"),
                    "created_at": app.get("created_at")
                })
            except:
                continue
        
        return {
            "summary": {
                "total_users": total_users,
                "total_jobs": total_jobs,
                "total_applications": total_applications,
                "total_resumes": total_resumes
            },
            "top_skills": top_skills,
            "status_breakdown": status_counts,
            "recent_applications": recent_apps
        }
    except Exception as e:
        print(f"❌ Admin analytics error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
