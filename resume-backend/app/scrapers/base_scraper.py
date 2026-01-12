# app/scrapers/base_scraper.py
"""
Base Scraper Class

Provides common functionality for all job scrapers:
- Rate limiting
- Error handling and retries
- Data normalization
- Duplicate detection
- Logging
"""

import asyncio
import httpx
from typing import List, Dict, Any, Optional
from datetime import datetime
from abc import ABC, abstractmethod


class BaseScraper(ABC):
    """Base class for all job scrapers"""
    
    def __init__(
        self,
        platform_name: str,
        max_requests_per_minute: int = 30,
        timeout: int = 30
    ):
        self.platform_name = platform_name
        self.max_requests_per_minute = max_requests_per_minute
        self.timeout = timeout
        self.request_count = 0
        self.last_request_time = datetime.utcnow()
        
    async def rate_limit(self):
        """Implement rate limiting"""
        self.request_count += 1
        
        # Reset counter every minute
        now = datetime.utcnow()
        if (now - self.last_request_time).seconds >= 60:
            self.request_count = 0
            self.last_request_time = now
        
        # Wait if exceeded rate limit
        if self.request_count >= self.max_requests_per_minute:
            wait_time = 60 - (now - self.last_request_time).seconds
            if wait_time > 0:
                print(f"[WAIT] Rate limit reached for {self.platform_name}, waiting {wait_time}s...")
                await asyncio.sleep(wait_time)
                self.request_count = 0
                self.last_request_time = datetime.utcnow()
    
    async def fetch_with_retry(
        self,
        url: str,
        max_retries: int = 3,
        headers: Optional[Dict[str, str]] = None
    ) -> Optional[str]:
        """Fetch URL with retry logic"""
        
        for attempt in range(max_retries):
            try:
                await self.rate_limit()
                
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    response = await client.get(url, headers=headers or {})
                    response.raise_for_status()
                    return response.text
                    
            except httpx.HTTPStatusError as e:
                print(f"[ERROR] HTTP error {e.response.status_code} for {url} (attempt {attempt + 1}/{max_retries})")
                if attempt < max_retries - 1:
                    await asyncio.sleep(2 ** attempt)  # Exponential backoff
                else:
                    return None
                    
            except Exception as e:
                print(f"[ERROR] Error fetching {url}: {e} (attempt {attempt + 1}/{max_retries})")
                if attempt < max_retries - 1:
                    await asyncio.sleep(2 ** attempt)
                else:
                    return None
        
        return None
    
    def normalize_job_data(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalize job data to standard format.
        
        Standard format:
        {
            "job_title": str,
            "company_name": str,
            "location": str,
            "remote_type": str (Remote, Hybrid, On-site),
            "job_type": str (Full-time, Part-time, Contract, Internship),
            "salary_min": int or None,
            "salary_max": int or None,
            "currency": str,
            "skills_required": List[str],
            "experience_level": str (Entry, Mid, Senior, Lead),
            "job_description": str,
            "job_url": str,
            "source_platform": str,
            "category": str,
            "created_at": datetime,
            "applied_by": [],
            "saved_by": [],
            "apply_count": 0,
            "save_count": 0,
            "expires_at": None
        }
        """
        
        normalized = {
            "title": raw_data.get("title", "Unknown"),
            "company": raw_data.get("company", "Unknown"),
            "location": raw_data.get("location", "Unknown"),
            "remote_type": self._normalize_remote_type(raw_data.get("remote_type", "")),
            "job_type": self._normalize_job_type(raw_data.get("job_type", "Full-time")),
            "salary": raw_data.get("salary_string") or raw_data.get("salary"), # Ensure salary field matches
            "salary_min": raw_data.get("salary_min"),
            "salary_max": raw_data.get("salary_max"),
            "currency": raw_data.get("currency", "USD"),
            "required_skills": raw_data.get("skills", []),
            "experience_level": self._normalize_experience_level(raw_data.get("experience", "")),
            "description": raw_data.get("description", ""),
            "job_url": raw_data.get("url", ""),
            "source_platform": self.platform_name,
            "category": self._categorize_job(raw_data),
            "created_at": datetime.utcnow(),
            # Lifecycle fields
            "applied_by": [],
            "saved_by": [],
            "apply_count": 0,
            "save_count": 0,
            "expires_at": None,
            "end_date": None  # Add end_date matching JobCreate
        }
        
        return normalized
    
    def _normalize_remote_type(self, remote_type: str) -> str:
        """Normalize remote type to standard values"""
        remote_lower = remote_type.lower()
        
        if any(word in remote_lower for word in ["remote", "work from home", "wfh"]):
            return "Remote"
        elif any(word in remote_lower for word in ["hybrid", "flexible"]):
            return "Hybrid"
        else:
            return "On-site"
    
    def _normalize_job_type(self, job_type: str) -> str:
        """Normalize job type to standard values"""
        job_lower = job_type.lower()
        
        if "full" in job_lower or "full-time" in job_lower:
            return "Full-time"
        elif "part" in job_lower or "part-time" in job_lower:
            return "Part-time"
        elif "contract" in job_lower or "contractor" in job_lower:
            return "Contract"
        elif "intern" in job_lower:
            return "Internship"
        else:
            return "Full-time"  # Default
    
    def _normalize_experience_level(self, experience: str) -> Optional[str]:
        """Normalize experience level to standard values"""
        exp_lower = experience.lower()
        
        if any(word in exp_lower for word in ["entry", "junior", "0-2", "graduate"]):
            return "Entry"
        elif any(word in exp_lower for word in ["mid", "intermediate", "2-5", "3-5"]):
            return "Mid"
        elif any(word in exp_lower for word in ["senior", "5+", "7+", "experienced"]):
            return "Senior"
        elif any(word in exp_lower for word in ["lead", "principal", "staff", "architect"]):
            return "Lead"
        else:
            return None
    
    def _categorize_job(self, raw_data: Dict[str, Any]) -> str:
        """Categorize job based on title and description"""
        title = raw_data.get("title", "").lower()
        description = raw_data.get("description", "").lower()
        combined = f"{title} {description}"
        
        # Data Science & ML
        if any(word in combined for word in ["data scientist", "machine learning", "ml engineer", "ai engineer", "deep learning"]):
            return "Machine Learning"
        elif any(word in combined for word in ["data analyst", "data engineer", "analytics"]):
            return "Data Science"
        
        # Development
        elif any(word in combined for word in ["frontend", "front-end", "react", "vue", "angular"]):
            return "Frontend"
        elif any(word in combined for word in ["backend", "back-end", "api", "server"]):
            return "Backend"
        elif any(word in combined for word in ["full stack", "fullstack", "full-stack"]):
            return "Full Stack"
        elif any(word in combined for word in ["mobile", "ios", "android", "react native", "flutter"]):
            return "Mobile"
        
        # DevOps
        elif any(word in combined for word in ["devops", "sre", "infrastructure", "cloud engineer", "kubernetes", "docker"]):
            return "DevOps"
        
        else:
            return "Other"
    
    async def check_duplicate(self, job_url: str, db) -> bool:
        """Check if job already exists in database"""
        existing = await db.jobs.find_one({"job_url": job_url})
        return existing is not None
    
    @abstractmethod
    async def scrape_jobs(self, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Scrape jobs from the platform.
        Must be implemented by each platform scraper.
        
        Args:
            limit: Maximum number of jobs to scrape
            
        Returns:
            List of normalized job dictionaries
        """
        pass
    
    async def scrape_and_store(self, db, limit: int = 50) -> Dict[str, Any]:
        """
        Scrape jobs and store in database.
        
        Returns:
            Statistics about the scraping operation
        """
        print(f"[START] Starting scrape from {self.platform_name}...")
        
        try:
            # Scrape jobs
            jobs = await self.scrape_jobs(limit=limit)
            
            if not jobs:
                print(f"[WARN] No jobs found from {self.platform_name}")
                return {
                    "platform": self.platform_name,
                    "scraped": 0,
                    "stored": 0,
                    "duplicates": 0,
                    "errors": 0
                }
            
            stored_count = 0
            duplicate_count = 0
            error_count = 0
            
            # Store each job
            from app.services.gemini_job_processor import job_processor
            
            for job in jobs:
                try:
                    # Check for duplicates
                    if await self.check_duplicate(job["job_url"], db):
                        duplicate_count += 1
                        continue
                    
                    # Enhance with Gemini (with error handling/rate limit protection)
                    try:
                        job = await job_processor.process_job(job)
                    except Exception as ge:
                        print(f"[WARN] Gemini enhancement skipped: {ge}")
                    
                    # Insert job
                    await db.jobs.insert_one(job)
                    stored_count += 1
                    
                except Exception as e:
                    print(f"[ERROR] Error storing job: {e}")
                    error_count += 1
            
            print(f"[OK] {self.platform_name}: Scraped {len(jobs)}, Stored {stored_count}, Duplicates {duplicate_count}")
            
            return {
                "platform": self.platform_name,
                "scraped": len(jobs),
                "stored": stored_count,
                "duplicates": duplicate_count,
                "errors": error_count
            }
            
        except Exception as e:
            print(f"[ERROR] Scraping failed for {self.platform_name}: {e}")
            return {
                "platform": self.platform_name,
                "scraped": 0,
                "stored": 0,
                "duplicates": 0,
                "errors": 1,
                "error_message": str(e)
            }
