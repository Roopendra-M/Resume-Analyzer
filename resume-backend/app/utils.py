import io
import json
import os
import re
from docx import Document
import google.generativeai as genai
from app.config import settings

# Configure Gemini API
genai.configure(api_key=settings.GEMINI_API_KEY)

async def validate_resume_content(text: str) -> dict:
    """
    Strictly validate if the uploaded document is actually a resume/CV using Gemini
    Returns: {"is_resume": bool, "reason": str, "confidence": float}
    """
    # Check minimum text length (stricter - 200 chars minimum)
    if len(text.strip()) < 200:
        return {
            "is_resume": False,
            "reason": "Document is too short to be a resume (minimum 200 characters required)",
            "confidence": 1.0
        }
    
    # Strict keyword check - must have multiple essential sections
    text_lower = text.lower()
    
    # Check for essential resume sections
    has_experience = any(word in text_lower for word in ['experience', 'work history', 'employment', 'professional experience', 'work experience'])
    has_education = any(word in text_lower for word in ['education', 'degree', 'university', 'college', 'bachelor', 'master', 'qualification', 'academic'])
    has_skills = any(word in text_lower for word in ['skills', 'technical skills', 'competencies', 'expertise', 'proficient'])
    has_contact = any(word in text_lower for word in ['email', 'phone', 'contact', '@', 'tel:', 'mobile', 'linkedin'])
    
    # Count how many essential sections are present
    sections_found = sum([has_experience, has_education, has_skills, has_contact])
    
    # Must have at least 3 out of 4 essential sections
    if sections_found < 3:
        missing_sections = []
        if not has_experience:
            missing_sections.append("Work Experience")
        if not has_education:
            missing_sections.append("Education")
        if not has_skills:
            missing_sections.append("Skills")
        if not has_contact:
            missing_sections.append("Contact Information")
        
        return {
            "is_resume": False,
            "reason": f"Missing critical resume sections: {', '.join(missing_sections)}. A valid resume must have Work Experience, Education, Skills, and Contact details.",
            "confidence": 0.9
        }
    
    # Use AI Service (Groq with Gemini Fallback)
    from app.services.ai_service import ai_service
    
    prompt = """You are a STRICT resume/CV validator. Analyze if this document is a RESUME or CV.

A VALID RESUME must contain:
1. Personal/Contact information (name, email, phone)
2. Work Experience or Employment History
3. Education background (degrees, universities)
4. Skills section (technical or professional skills)

REJECT these document types:
- Business reports, financial statements
- Recipes, cooking instructions
- Invoices, receipts, bills
- Manuals, guides, tutorials
- Articles, blog posts, news
- Books, chapters, papers
- Any other non-resume documents

Return ONLY valid JSON in this format:
{
  "is_resume": true or false,
  "reason": "specific detailed explanation",
  "confidence": 0.0 to 1.0
}

Be VERY STRICT - only accept documents that are clearly professional resumes/CVs.

Document text (first 2000 characters):
""" + text[:2000]
    
    try:
        content = await ai_service.generate_content(prompt)
        
        # Extract JSON using regex
        json_match = re.search(r'\{[\s\S]*\}', content)
        if json_match:
            result = json.loads(json_match.group(0))
            
            # If AI says it's a resume but confidence is low, reject it
            if result.get("is_resume") and result.get("confidence", 0) < 0.6:
                return {
                    "is_resume": False,
                    "reason": f"AI validation uncertain: {result.get('reason', 'Low confidence in document being a resume')}",
                    "confidence": result.get("confidence", 0.5)
                }
            
            return result
        else:
            # If can't parse AI response, use strict keyword check
            return {
                "is_resume": sections_found >= 4,  # Must have ALL sections
                "reason": f"Found {sections_found}/4 resume sections. Strict validation requires all 4 essential sections.",
                "confidence": 0.7
            }
    except Exception as e:
        print(f"Resume validation error: {e}")
        # On error, be conservative - require all 4 sections
        return {
            "is_resume": sections_found >= 4,
            "reason": f"Validation API failed. Found {sections_found}/4 required sections (Experience, Education, Skills, Contact). Need all 4 to proceed.",
            "confidence": 0.6
        }

async def extract_skills_experience_gemini(text: str) -> dict:
    """Extract skills and experience using AI Service"""
    from app.services.ai_service import ai_service
    
    # Build the prompt
    prompt_text = """Analyze this resume and extract:
1. Skills (technical skills, soft skills, tools, technologies)
2. Experience (job titles, companies, duration, key achievements)

Return ONLY valid JSON in this exact format:
{
  "skills": ["skill1", "skill2"],
  "experience": ["Job Title at Company (Duration): Description"]
}

Resume text:
""" + text[:4000]
    
    try:
        content = await ai_service.generate_content(prompt_text)
        
        # Extract JSON using regex
        json_match = re.search(r'\{[\s\S]*\}', content)
        if json_match:
            json_str = json_match.group(0)
            parsed = json.loads(json_str)
            return {
                "skills": parsed.get("skills", [])[:30],
                "experience": parsed.get("experience", [])[:10]
            }
        else:
            print("No JSON found in AI response, using fallback")
            return fallback_extraction(text)
            
    except Exception as e:
        print(f"AI API error: {e}")
        return fallback_extraction(text)

def fallback_extraction(text: str) -> dict:
    """Simple fallback extraction if Groq fails"""
    common_skills = [
        "Python", "Java", "JavaScript", "React", "Node.js", "SQL", "AWS", 
        "Docker", "Kubernetes", "Git", "Machine Learning", "Data Analysis",
        "Leadership", "Communication", "Problem Solving", "Teamwork", "C++",
        "HTML", "CSS", "MongoDB", "PostgreSQL", "Angular", "Vue.js", "Django",
        "Flask", "Spring Boot", "Microservices", "REST API", "GraphQL", "Azure",
        "GCP", "Jenkins", "CI/CD", "Agile", "Scrum", "Project Management"
    ]
    found_skills = [skill for skill in common_skills if skill.lower() in text.lower()]
    return {
        "skills": found_skills[:15] if found_skills else ["Skills not extracted"], 
        "experience": ["Experience details not extracted - please check resume format"]
    }

def extract_text_from_pdf(data: bytes) -> str:
    """Extract text from PDF file"""
    import pdfplumber
    with io.BytesIO(data) as f:
        text_all = []
        with pdfplumber.open(f) as pdf:
            for page in pdf.pages:
                text_all.append(page.extract_text() or "")
        return "\n".join(text_all)

def extract_text_from_docx(data: bytes) -> str:
    """Extract text from DOCX file"""
    with io.BytesIO(data) as f:
        doc = Document(f)
        return "\n".join(p.text for p in doc.paragraphs)

async def resume_jd_similarity(resume_text: str, job_description: str) -> dict:
    """Compute similarity score between resume and job description"""
    
    def clean_text(text: str) -> str:
        text = text.lower()
        text = re.sub(r"[^\w\s]", "", text)
        return text

    resume_clean = clean_text(resume_text)
    job_clean = clean_text(job_description)

    r_words = set(resume_clean.split())
    j_words = set(job_clean.split())

    inter = len(r_words & j_words)
    score = round(100.0 * inter / max(1, len(j_words)), 2)
    return {"similarity_score": score}
