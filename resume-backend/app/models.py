# app/models.py
from pydantic import BaseModel, EmailStr, Field, HttpUrl
from typing import Optional, List, Literal, Dict
from datetime import datetime

Role = Literal["user", "admin"]

# ---------------- User models ----------------
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: Role

class UserPublic(BaseModel):
    id: str
    email: EmailStr
    name: str
    role: Role

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    phone: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    current_role: Optional[str] = None
    years_of_experience: Optional[int] = None

# ---------------- Job models ----------------
class JobCreate(BaseModel):
    title: str
    company: str
    location: str
    description: str
    skills: List[str]

# Extended job model with lifecycle and scraping fields
class JobCreateExtended(BaseModel):
    job_title: str
    company_name: str
    location: str
    remote_type: Optional[str] = "On-site"  # Remote, Hybrid, On-site
    job_type: str = "Full-time"  # Full-time, Part-time, Contract, Internship
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    currency: str = "USD"
    skills_required: List[str]
    experience_level: Optional[str] = None  # Entry, Mid, Senior, Lead
    job_description: str
    job_url: Optional[str] = None
    source_platform: Optional[str] = None  # LinkedIn, Indeed, GitHub, etc.
    category: Optional[str] = "Other"  # Data Science, ML, Frontend, Backend, etc.
    end_date: Optional[datetime] = None
    company_logo_url: Optional[str] = None
    benefits: Optional[List[str]] = []

class JobOut(BaseModel):
    id: str
    job_title: str
    company_name: str
    location: str
    remote_type: Optional[str] = None
    job_type: str
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    currency: str = "USD"
    skills_required: List[str]
    experience_level: Optional[str] = None
    job_description: str
    job_url: Optional[str] = None
    source_platform: Optional[str] = None
    category: Optional[str] = None
    created_at: datetime
    # Lifecycle fields
    applied_by: List[Dict] = []
    saved_by: List[str] = []
    apply_count: int = 0
    save_count: int = 0
    expires_at: Optional[datetime] = None
    # Match score (calculated per user)
    match_score: Optional[float] = None
    company_logo_url: Optional[str] = None
    benefits: Optional[List[str]] = []

# ---------------- Resume models ----------------
class ResumeUploadOut(BaseModel):
    id: str
    filename: str
    text_excerpt: str
    skills: List[str] = []
    experience: List[str] = []
    uploaded_at: datetime
    similarity_score: Dict[str, float] = {}
    ats_score: Optional[float] = None
    resume_strength: Optional[str] = None

# ---------------- Application models ----------------
class ApplyIn(BaseModel):
    job_id: str
    resume_id: Optional[str] = None

class ApplicationOut(BaseModel):
    id: str
    job_id: str
    job_title: str
    company: str
    location: str
    match_score: float
    created_at: datetime
    status: Optional[str] = "applied"
    notes: Optional[str] = None

class ApplicationDetailOut(BaseModel):
    id: str
    job_id: str
    job_title: str
    company: str
    location: str
    job_description: str
    job_url: Optional[str] = None
    match_score: float
    created_at: datetime
    status: str = "applied"
    notes: Optional[str] = None
    skills_matched: List[str] = []
    skills_missing: List[str] = []

# ---------------- Feedback models ----------------
class FeedbackIn(BaseModel):
    message: str
    rating: int = Field(ge=1, le=5)

class FeedbackOut(BaseModel):
    id: str
    user_id: str
    message: str
    rating: int
    created_at: datetime

# ---------------- Chat model ----------------
class ChatQuery(BaseModel):
    query: str

# ---------------- Notification models ----------------
class NotificationCreate(BaseModel):
    user_id: str
    title: str
    message: str
    type: str = "info"  # info, success, warning, error
    action_url: Optional[str] = None

class NotificationOut(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    type: str
    action_url: Optional[str] = None
    read: bool = False
    created_at: datetime

# ---------------- User Preferences models ----------------
class UserPreferences(BaseModel):
    job_categories: List[str] = []  # Data Science, ML, Frontend, Backend, DevOps, Mobile, Full Stack, Other
    preferred_locations: List[str] = []
    remote_preference: Optional[str] = "Any"  # Remote, Hybrid, On-site, Any
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    experience_level: Optional[str] = None  # Entry, Mid, Senior, Lead
    job_types: List[str] = ["Full-time"]  # Full-time, Part-time, Contract, Internship
    notification_preferences: Dict[str, bool] = {
        "email_notifications": True,
        "job_alerts": True,
        "application_updates": True
    }

class PreferencesOut(BaseModel):
    user_id: str
    preferences: UserPreferences
    updated_at: datetime

# ---------------- Job Lifecycle models ----------------
class JobSaveRequest(BaseModel):
    job_id: str

class JobUnsaveRequest(BaseModel):
    job_id: str

class LifecycleStats(BaseModel):
    total_jobs_in_db: int
    jobs_with_applies: int
    jobs_with_saves: int
    jobs_pending_deletion: int
    total_applications: int
    recent_cleanups: List[Dict]

# ---------------- Mock Interview models ----------------
class InterviewStart(BaseModel):
    interview_type: str  # Technical, Behavioral, HR, Case Study
    job_category: Optional[str] = "General"

class InterviewAnswer(BaseModel):
    interview_id: str
    question_id: str
    answer: str

class InterviewFeedback(BaseModel):
    interview_id: str
    question_id: str
    question: str
    answer: str
    criteria_scores: Dict[str, float]  # 6 criteria with scores 0-100
    feedback: str
    overall_score: float

# ---------------- Resume ATS Score models ----------------
class ATSScoreRequest(BaseModel):
    resume_id: str

class ATSScoreResponse(BaseModel):
    overall_score: float
    keyword_match: float
    formatting_score: float
    experience_relevance: float
    suggestions: List[str]
    strengths: List[str]
    weaknesses: List[str]

# ---------------- Skill Endorsement models ----------------
class SkillEndorsement(BaseModel):
    skill_name: str
    endorsed_by: str  # user_id
    endorsement_text: Optional[str] = None

class SkillEndorsementOut(BaseModel):
    id: str
    user_id: str
    skill_name: str
    endorsed_by: str
    endorsement_text: Optional[str] = None
    created_at: datetime

