from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from datetime import datetime
from app.db import db
from app.security import get_current_user
from app.utils import extract_text_from_pdf, extract_text_from_docx, extract_skills_experience_gemini, validate_resume_content
from bson import ObjectId
import os

router = APIRouter(prefix="/resume", tags=["Resume"])

@router.post("/upload")
async def upload_resume(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """Upload and analyze resume with Groq AI extraction"""
    try:
        user_id = current_user.get("user_id")
        
        # Validate file type
        if not file.filename.lower().endswith(('.pdf', '.docx')):
            raise HTTPException(status_code=400, detail="Only PDF and DOCX files are allowed")
        
        # Read file content
        content = await file.read()
        
        # Extract text based on file type
        if file.filename.lower().endswith('.pdf'):
            text = extract_text_from_pdf(content)
        else:
            text = extract_text_from_docx(content)
        
        if not text or len(text.strip()) < 100:
            raise HTTPException(status_code=400, detail="Unable to extract text from resume or content too short")
        
        print(f"📄 Extracted {len(text)} characters from {file.filename}")
        
        # Validate if it's actually a resume
        validation = await validate_resume_content(text)
        if not validation.get("is_resume", False):
            raise HTTPException(
                status_code=400,
                detail=f"❌ Not a valid resume: {validation.get('reason', 'Unknown reason')}"
            )
        
        print(f"✅ Resume validated: {validation.get('reason')}")
        
        # ✅ EXTRACT SKILLS AND EXPERIENCE USING GEMINI AI
        extraction = await extract_skills_experience_gemini(text)
        skills = extraction.get("skills", [])
        experience = extraction.get("experience", [])
        
        print(f"✅ Extracted {len(skills)} skills and {len(experience)} experience entries")
        print(f"Skills: {skills[:5]}")  # Debug log
        print(f"Experience: {experience[:3]}")  # Debug log
        
        # Delete old resume if exists
        await db.resumes.delete_many({"user_id": user_id})
        
        # Save new resume to database with extracted data
        resume_data = {
            "user_id": user_id,
            "filename": file.filename,
            "text_content": text[:5000],  # Store first 5000 chars for reference
            "skills": skills,  # ✅ Save extracted skills
            "experience": experience,  # ✅ Save extracted experience
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = await db.resumes.insert_one(resume_data)
        
        print(f"✅ Resume saved with ID: {result.inserted_id}")
        
        return {
            "message": "Resume uploaded and analyzed successfully!",
            "resume_id": str(result.inserted_id),
            "filename": file.filename,
            "skills": skills,  # ✅ Return extracted skills
            "experience": experience,  # ✅ Return extracted experience
            "total_skills": len(skills),
            "total_experience": len(experience)
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error uploading resume: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to process resume: {str(e)}")

@router.get("/me")
async def get_my_resume(current_user: dict = Depends(get_current_user)):
    """Get current user's resume"""
    try:
        user_id = current_user.get("user_id")
        resume = await db.resumes.find_one({"user_id": user_id})
        
        if not resume:
            return {
                "message": "No resume found",
                "resume": None,
                "skills": [],
                "experience": []
            }
        
        return {
            "_id": str(resume.get("_id")),
            "user_id": str(resume.get("user_id")),
            "filename": resume.get("filename", ""),
            "skills": resume.get("skills", []),  # ✅ Return skills
            "experience": resume.get("experience", []),  # ✅ Return experience
            "created_at": resume.get("created_at"),
            "updated_at": resume.get("updated_at")
        }
    except Exception as e:
        print(f"❌ Error fetching resume: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/all")
async def get_all_resumes(current_user: dict = Depends(get_current_user)):
    """Get all resumes for current user"""
    try:
        user_id = current_user.get("user_id")
        resumes = []
        
        async for resume in db.resumes.find({"user_id": user_id}).sort("created_at", -1):
            resumes.append({
                "_id": str(resume.get("_id")),
                "filename": resume.get("filename", ""),
                "created_at": resume.get("created_at"),
                "skills": resume.get("skills", []),
                "experience": resume.get("experience", [])
            })
        
        return resumes
    except Exception as e:
        print(f"❌ Error fetching resumes: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{resume_id}")
async def delete_resume(resume_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a resume"""
    try:
        if not ObjectId.is_valid(resume_id):
            raise HTTPException(status_code=400, detail="Invalid resume ID")
        
        user_id = current_user.get("user_id")
        
        result = await db.resumes.delete_one({
            "_id": ObjectId(resume_id),
            "user_id": user_id
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        print(f"✅ Resume deleted: {resume_id}")
        return {"message": "Resume deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error deleting resume: {e}")
        raise HTTPException(status_code=500, detail=str(e))
