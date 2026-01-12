import google.generativeai as genai
import json
import re
from typing import Dict, Any, List
from app.config import settings

# Configure Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)

class GeminiJobProcessor:
    """
    Process job data using Gemini AI to align, clean, and enhance content.
    """
    
    def __init__(self):
        self.model = genai.GenerativeModel(settings.GEMINI_MODEL)
    
    async def process_job(self, raw_job: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process a single job using Gemini to normalize and extract fields.
        """
        
        # Prepare the prompt
        prompt = f"""
        You are an AI Job Data Specialist. align and standardise this job posting.
        
        Raw Job Data:
        Title: {raw_job.get('title', 'Unknown')}
        Company: {raw_job.get('company', 'Unknown')}
        Location: {raw_job.get('location', 'Unknown')}
        Description: {raw_job.get('description', '')[:1000]}... (truncated)
        
        Task:
        1. Standardize the Job Title (e.g., "Sr. Dev" -> "Senior Developer")
        2. Clean the Company Name
        3. Determine Job Type (Full-time, Part-time, Contract, Internship)
        4. Determine Remote Type (Remote, Hybrid, On-site)
        5. Extract formatted Salary (if available, else null)
        6. EXTRACT SKILLS (very important) as an array of strings
        7. Categorize the role (Frontend, Backend, Full Stack, DevOps, Data Science, Mobile, Other)
        8. Write a short, engaging summary (2-3 sentences)
        
        Return JSON ONLY:
        {{
            "title": "Standardized Title",
            "company": "Clean Company Name",
            "location": "City, Country",
            "job_type": "Full-time",
            "remote_type": "Remote",
            "salary": "$100k - $120k" or null,
            "required_skills": ["Skill1", "Skill2"],
            "category": "Frontend",
            "summary": "Engaging summary..."
        }}
        """
        
        try:
            response = self.model.generate_content(prompt)
            return self._parse_response(response.text, raw_job)
        except Exception as e:
            print(f"⚠️ Gemini processing failed for {raw_job.get('title')}: {e}")
            return raw_job # Fallback to raw data

    def _parse_response(self, text: str, fallback_data: Dict[str, Any]) -> Dict[str, Any]:
        """Parse JSON response from Gemini"""
        try:
            # Clean up md formatting
            text = text.replace("```json", "").replace("```", "").strip()
            
            # Find JSON block
            json_match = re.search(r'\{[\s\S]*\}', text)
            if json_match:
                data = json.loads(json_match.group(0))
                # Merge with original data to keep URLs etc
                return {**fallback_data, **data}
            
            return fallback_data
            
        except Exception:
            return fallback_data

    async def batch_process(self, jobs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Process a batch of jobs (not used yet due to rate limits)"""
        processed = []
        for job in jobs:
            result = await self.process_job(job)
            processed.append(result)
        return processed

# Global instance
job_processor = GeminiJobProcessor()
