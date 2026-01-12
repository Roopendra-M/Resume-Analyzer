# app/services/job_matcher.py
"""
Job Matching Service

Intelligent job matching algorithm that calculates match scores (0-100)
based on 6 criteria:
1. Skills match (40% weight)
2. Experience level (25% weight)
3. Location preference (15% weight)
4. Salary expectation (10% weight)
5. Job type preference (5% weight)
6. Company culture fit (5% weight)

Also generates missing skills recommendations.
"""

from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime


class JobMatcher:
    """Intelligent job matching algorithm"""
    
    # Weights for each criterion (must sum to 100)
    WEIGHTS = {
        "skills": 40,
        "experience": 25,
        "location": 15,
        "salary": 10,
        "job_type": 5,
        "culture": 5
    }
    
    def __init__(self):
        pass
    
    def calculate_match_score(
        self,
        job: Dict[str, Any],
        user_resume: Dict[str, Any],
        user_preferences: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Calculate comprehensive match score for a job.
        
        Args:
            job: Job dictionary with required fields
            user_resume: User's resume data (skills, experience)
            user_preferences: User's job preferences (optional)
            
        Returns:
            Dictionary with overall score, criterion scores, and recommendations
        """
        
        # Extract data
        job_skills = job.get("skills_required", [])
        job_experience = job.get("experience_level", "")
        job_location = job.get("location", "")
        job_remote = job.get("remote_type", "")
        job_salary_min = job.get("salary_min")
        job_salary_max = job.get("salary_max")
        job_type = job.get("job_type", "Full-time")
        job_category = job.get("category", "")
        
        resume_skills = user_resume.get("skills", [])
        resume_experience = user_resume.get("experience", [])
        
        # Get preferences (use defaults if not provided)
        preferences = user_preferences or {}
        pref_locations = preferences.get("preferred_locations", [])
        pref_remote = preferences.get("remote_preference", "Any")
        pref_salary_min = preferences.get("salary_min")
        pref_salary_max = preferences.get("salary_max")
        pref_experience = preferences.get("experience_level")
        pref_job_types = preferences.get("job_types", ["Full-time"])
        pref_categories = preferences.get("job_categories", [])
        
        # Calculate individual criterion scores
        skills_score = self._calculate_skills_match(job_skills, resume_skills)
        experience_score = self._calculate_experience_match(job_experience, resume_experience, pref_experience)
        location_score = self._calculate_location_match(job_location, job_remote, pref_locations, pref_remote)
        salary_score = self._calculate_salary_match(job_salary_min, job_salary_max, pref_salary_min, pref_salary_max)
        job_type_score = self._calculate_job_type_match(job_type, pref_job_types)
        culture_score = self._calculate_culture_match(job_category, pref_categories)
        
        # Calculate weighted overall score
        overall_score = (
            skills_score * self.WEIGHTS["skills"] / 100 +
            experience_score * self.WEIGHTS["experience"] / 100 +
            location_score * self.WEIGHTS["location"] / 100 +
            salary_score * self.WEIGHTS["salary"] / 100 +
            job_type_score * self.WEIGHTS["job_type"] / 100 +
            culture_score * self.WEIGHTS["culture"] / 100
        )
        
        # Generate missing skills recommendations
        missing_skills = self._get_missing_skills(job_skills, resume_skills)
        
        return {
            "overall_score": round(overall_score, 1),
            "criterion_scores": {
                "skills": round(skills_score, 1),
                "experience": round(experience_score, 1),
                "location": round(location_score, 1),
                "salary": round(salary_score, 1),
                "job_type": round(job_type_score, 1),
                "culture": round(culture_score, 1)
            },
            "missing_skills": missing_skills,
            "matched_skills": [skill for skill in job_skills if skill.lower() in [s.lower() for s in resume_skills]],
            "recommendations": self._generate_recommendations(
                skills_score, experience_score, location_score,
                salary_score, job_type_score, culture_score,
                missing_skills
            )
        }
    
    def _calculate_skills_match(self, job_skills: List[str], resume_skills: List[str]) -> float:
        """
        Calculate skills match score (0-100).
        
        40% weight in overall score.
        """
        if not job_skills:
            return 100.0  # No required skills = perfect match
        
        if not resume_skills:
            return 0.0  # No resume skills = no match
        
        # Normalize skills to lowercase for comparison
        job_skills_lower = [skill.lower() for skill in job_skills]
        resume_skills_lower = [skill.lower() for skill in resume_skills]
        
        # Count matched skills
        matched_count = sum(1 for skill in job_skills_lower if skill in resume_skills_lower)
        
        # Calculate percentage
        match_percentage = (matched_count / len(job_skills)) * 100
        
        return match_percentage
    
    def _calculate_experience_match(
        self,
        job_experience: str,
        resume_experience: List[str],
        pref_experience: Optional[str]
    ) -> float:
        """
        Calculate experience level match score (0-100).
        
        25% weight in overall score.
        """
        # Experience level hierarchy
        experience_levels = {
            "Entry": 1,
            "Mid": 2,
            "Senior": 3,
            "Lead": 4
        }
        
        # If job doesn't specify experience, perfect match
        if not job_experience:
            return 100.0
        
        # Get job experience level
        job_level = experience_levels.get(job_experience, 2)  # Default to Mid
        
        # Determine user's experience level
        user_level = 2  # Default to Mid
        
        if pref_experience and pref_experience in experience_levels:
            user_level = experience_levels[pref_experience]
        elif resume_experience:
            # Estimate from years of experience in resume
            total_years = len(resume_experience)
            if total_years >= 7:
                user_level = 4  # Lead
            elif total_years >= 5:
                user_level = 3  # Senior
            elif total_years >= 2:
                user_level = 2  # Mid
            else:
                user_level = 1  # Entry
        
        # Calculate score based on difference
        level_diff = abs(job_level - user_level)
        
        if level_diff == 0:
            return 100.0  # Perfect match
        elif level_diff == 1:
            return 75.0   # Close match
        elif level_diff == 2:
            return 50.0   # Moderate match
        else:
            return 25.0   # Poor match
    
    def _calculate_location_match(
        self,
        job_location: str,
        job_remote: str,
        pref_locations: List[str],
        pref_remote: str
    ) -> float:
        """
        Calculate location preference match score (0-100).
        
        15% weight in overall score.
        """
        # Remote jobs are always a good match if user prefers remote
        if job_remote == "Remote":
            if pref_remote in ["Remote", "Any"]:
                return 100.0
            elif pref_remote == "Hybrid":
                return 75.0
            else:
                return 50.0
        
        # Hybrid jobs
        if job_remote == "Hybrid":
            if pref_remote in ["Hybrid", "Any"]:
                return 100.0
            elif pref_remote == "Remote":
                return 75.0
            else:
                return 85.0
        
        # On-site jobs - check location match
        if pref_remote == "Remote":
            return 25.0  # User prefers remote, job is on-site
        
        # Check if job location matches preferred locations
        if not pref_locations:
            return 75.0  # No preference = moderate match
        
        job_location_lower = job_location.lower()
        for pref_loc in pref_locations:
            if pref_loc.lower() in job_location_lower or job_location_lower in pref_loc.lower():
                return 100.0  # Location match
        
        return 50.0  # Location doesn't match
    
    def _calculate_salary_match(
        self,
        job_salary_min: Optional[int],
        job_salary_max: Optional[int],
        pref_salary_min: Optional[int],
        pref_salary_max: Optional[int]
    ) -> float:
        """
        Calculate salary expectation match score (0-100).
        
        10% weight in overall score.
        """
        # If no salary info, return neutral score
        if not job_salary_min and not job_salary_max:
            return 75.0
        
        if not pref_salary_min and not pref_salary_max:
            return 75.0
        
        # Get job salary midpoint
        if job_salary_min and job_salary_max:
            job_salary = (job_salary_min + job_salary_max) / 2
        elif job_salary_min:
            job_salary = job_salary_min
        else:
            job_salary = job_salary_max
        
        # Get preferred salary midpoint
        if pref_salary_min and pref_salary_max:
            pref_salary = (pref_salary_min + pref_salary_max) / 2
        elif pref_salary_min:
            pref_salary = pref_salary_min
        else:
            pref_salary = pref_salary_max or job_salary
        
        # Calculate percentage difference
        if pref_salary == 0:
            return 75.0
        
        diff_percentage = abs(job_salary - pref_salary) / pref_salary * 100
        
        if diff_percentage <= 10:
            return 100.0  # Within 10%
        elif diff_percentage <= 20:
            return 85.0   # Within 20%
        elif diff_percentage <= 30:
            return 70.0   # Within 30%
        elif diff_percentage <= 50:
            return 50.0   # Within 50%
        else:
            return 25.0   # More than 50% difference
    
    def _calculate_job_type_match(self, job_type: str, pref_job_types: List[str]) -> float:
        """
        Calculate job type preference match score (0-100).
        
        5% weight in overall score.
        """
        if not pref_job_types:
            return 100.0  # No preference = perfect match
        
        if job_type in pref_job_types:
            return 100.0
        
        # Partial matches
        if job_type == "Full-time" and "Part-time" in pref_job_types:
            return 50.0
        elif job_type == "Part-time" and "Full-time" in pref_job_types:
            return 50.0
        
        return 25.0  # No match
    
    def _calculate_culture_match(self, job_category: str, pref_categories: List[str]) -> float:
        """
        Calculate company culture/category match score (0-100).
        
        5% weight in overall score.
        """
        if not pref_categories:
            return 75.0  # No preference = neutral
        
        if job_category in pref_categories:
            return 100.0
        
        return 50.0  # Different category
    
    def _get_missing_skills(self, job_skills: List[str], resume_skills: List[str]) -> List[str]:
        """Get list of skills required by job but missing from resume"""
        job_skills_lower = [skill.lower() for skill in job_skills]
        resume_skills_lower = [skill.lower() for skill in resume_skills]
        
        missing = []
        for i, skill_lower in enumerate(job_skills_lower):
            if skill_lower not in resume_skills_lower:
                missing.append(job_skills[i])  # Use original case
        
        return missing
    
    def _generate_recommendations(
        self,
        skills_score: float,
        experience_score: float,
        location_score: float,
        salary_score: float,
        job_type_score: float,
        culture_score: float,
        missing_skills: List[str]
    ) -> List[str]:
        """Generate actionable recommendations based on scores"""
        recommendations = []
        
        if skills_score < 60:
            if missing_skills:
                recommendations.append(
                    f"Consider learning: {', '.join(missing_skills[:3])} to improve your match"
                )
            else:
                recommendations.append("Highlight relevant skills in your resume")
        
        if experience_score < 60:
            recommendations.append("This role may require different experience level than yours")
        
        if location_score < 60:
            recommendations.append("Consider if you're willing to relocate or adjust remote preferences")
        
        if salary_score < 60:
            recommendations.append("Salary expectations may not align with this role")
        
        if skills_score >= 80 and experience_score >= 70:
            recommendations.append("Strong match! Consider applying soon")
        
        return recommendations


# Global matcher instance
matcher = JobMatcher()


# Helper function for easy use
async def calculate_job_match(
    job: Dict[str, Any],
    user_id: str,
    db
) -> Dict[str, Any]:
    """
    Calculate match score for a job and user.
    
    Args:
        job: Job dictionary
        user_id: User ID
        db: Database instance
        
    Returns:
        Match score dictionary
    """
    # Get user's resume
    resume = await db.resumes.find_one({"user_id": user_id})
    if not resume:
        return {
            "overall_score": 0.0,
            "criterion_scores": {},
            "missing_skills": job.get("skills_required", []),
            "matched_skills": [],
            "recommendations": ["Please upload a resume to see match scores"]
        }
    
    # Get user's preferences
    prefs_doc = await db.user_preferences.find_one({"user_id": user_id})
    preferences = prefs_doc.get("preferences") if prefs_doc else None
    
    # Calculate match
    return matcher.calculate_match_score(job, resume, preferences)
