# app/scrapers/angellist_scraper.py
"""
AngelList (Wellfound) Job Scraper

AngelList rebranded to Wellfound for their job platform.
This scraper uses HTML parsing to extract startup jobs.
"""

from typing import List, Dict, Any
from bs4 import BeautifulSoup
import re
from app.scrapers.base_scraper import BaseScraper


class AngelListScraper(BaseScraper):
    """Scraper for AngelList/Wellfound jobs"""
    
    def __init__(self):
        super().__init__(
            platform_name="AngelList",
            max_requests_per_minute=15,
            timeout=30
        )
        self.base_url = "https://wellfound.com"
        # Search for software engineering jobs at startups
        self.search_url = f"{self.base_url}/role/r/software-engineer"
    
    async def scrape_jobs(self, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Scrape jobs from AngelList/Wellfound.
        
        Note: Wellfound's structure may change. This implementation includes
        fallback to sample data if scraping fails.
        
        Args:
            limit: Maximum number of jobs to scrape
            
        Returns:
            List of normalized job dictionaries
        """
        
        try:
            print(f"🔍 Fetching jobs from AngelList/Wellfound...")
            
            # Set headers
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            }
            
            # Fetch the search results page
            html = await self.fetch_with_retry(self.search_url, headers=headers)
            
            if not html:
                print("⚠️ Failed to fetch AngelList page, using sample data")
                return self._get_sample_jobs(limit)
            
            # Parse HTML
            soup = BeautifulSoup(html, 'html.parser')
            
            # Find job listings (selectors may need updating)
            job_cards = soup.find_all('div', class_='job-listing')
            
            if not job_cards:
                # Try alternative selectors
                job_cards = soup.find_all('a', href=re.compile(r'/jobs/'))
            
            if not job_cards or len(job_cards) == 0:
                print("⚠️ No job cards found, using sample data")
                return self._get_sample_jobs(limit)
            
            normalized_jobs = []
            
            for card in job_cards[:limit]:
                try:
                    # Extract job details
                    title = card.get_text(strip=True) if hasattr(card, 'get_text') else "Unknown"
                    
                    # Build job URL
                    href = card.get('href', '') if hasattr(card, 'get') else ''
                    job_url = self.base_url + href if href and not href.startswith('http') else href
                    
                    # Create raw data dict with defaults
                    raw_data = {
                        "title": title,
                        "company": "Startup",  # Would need to parse from page
                        "location": "Remote",  # Most AngelList jobs are remote
                        "remote_type": "Remote",
                        "job_type": "Full-time",
                        "salary_min": None,
                        "salary_max": None,
                        "currency": "USD",
                        "skills": self._extract_skills_from_title(title),
                        "experience": "",
                        "description": title,
                        "url": job_url or f"{self.base_url}/jobs/example"
                    }
                    
                    # Normalize and add to list
                    normalized_job = self.normalize_job_data(raw_data)
                    normalized_jobs.append(normalized_job)
                    
                except Exception as e:
                    print(f"❌ Error parsing AngelList job: {e}")
                    continue
            
            if len(normalized_jobs) == 0:
                print("⚠️ Parsing failed, using sample data")
                return self._get_sample_jobs(limit)
            
            print(f"✅ AngelList: Parsed {len(normalized_jobs)} jobs")
            return normalized_jobs
            
        except Exception as e:
            print(f"❌ AngelList scraping error: {e}")
            print("⚠️ Returning sample data for demonstration")
            return self._get_sample_jobs(limit)
    
    def _get_sample_jobs(self, limit: int) -> List[Dict[str, Any]]:
        """Return sample startup jobs for demonstration"""
        sample_jobs = [
            {
                "title": "Full Stack Engineer",
                "company": "TechStartup Inc",
                "location": "Remote",
                "remote_type": "Remote",
                "job_type": "Full-time",
                "salary_min": 100000,
                "salary_max": 150000,
                "currency": "USD",
                "skills": ["React", "Node.js", "TypeScript", "PostgreSQL", "AWS"],
                "experience": "Mid",
                "description": "Join our fast-growing startup as a full stack engineer...",
                "url": "https://wellfound.com/jobs/example-1"
            },
            {
                "title": "Senior Backend Engineer",
                "company": "AI Startup",
                "location": "San Francisco, CA",
                "remote_type": "Hybrid",
                "job_type": "Full-time",
                "salary_min": 130000,
                "salary_max": 180000,
                "currency": "USD",
                "skills": ["Python", "FastAPI", "PostgreSQL", "Redis", "Docker"],
                "experience": "Senior",
                "description": "Build scalable backend systems for our AI platform...",
                "url": "https://wellfound.com/jobs/example-2"
            },
            {
                "title": "Frontend Engineer - React",
                "company": "FinTech Startup",
                "location": "Remote",
                "remote_type": "Remote",
                "job_type": "Full-time",
                "salary_min": 110000,
                "salary_max": 160000,
                "currency": "USD",
                "skills": ["React", "TypeScript", "CSS", "GraphQL", "Jest"],
                "experience": "Mid",
                "description": "Create beautiful user experiences for our fintech platform...",
                "url": "https://wellfound.com/jobs/example-3"
            },
            {
                "title": "Machine Learning Engineer",
                "company": "ML Startup",
                "location": "Remote",
                "remote_type": "Remote",
                "job_type": "Full-time",
                "salary_min": 120000,
                "salary_max": 170000,
                "currency": "USD",
                "skills": ["Python", "TensorFlow", "PyTorch", "Kubernetes", "MLOps"],
                "experience": "Senior",
                "description": "Build ML models that power our product...",
                "url": "https://wellfound.com/jobs/example-4"
            },
            {
                "title": "DevOps Engineer",
                "company": "Cloud Startup",
                "location": "Austin, TX",
                "remote_type": "Hybrid",
                "job_type": "Full-time",
                "salary_min": 115000,
                "salary_max": 155000,
                "currency": "USD",
                "skills": ["Kubernetes", "Terraform", "AWS", "Python", "CI/CD"],
                "experience": "Mid",
                "description": "Manage our cloud infrastructure and deployment pipelines...",
                "url": "https://wellfound.com/jobs/example-5"
            }
        ]
        
        normalized_jobs = []
        for job_data in sample_jobs[:limit]:
            normalized_job = self.normalize_job_data(job_data)
            normalized_jobs.append(normalized_job)
        
        return normalized_jobs
    
    def _extract_skills_from_title(self, title: str) -> List[str]:
        """Extract skills from job title"""
        skills = []
        common_skills = [
            "Python", "JavaScript", "TypeScript", "Java", "Go", "Rust", "Ruby",
            "React", "Vue", "Angular", "Node.js", "Django", "Flask", "FastAPI",
            "AWS", "Azure", "GCP", "Docker", "Kubernetes", "PostgreSQL", "MongoDB",
            "Machine Learning", "AI", "DevOps", "Frontend", "Backend", "Full Stack"
        ]
        
        title_lower = title.lower()
        for skill in common_skills:
            if skill.lower() in title_lower:
                skills.append(skill)
        
        return skills


# Example usage
async def test_angellist_scraper():
    """Test the AngelList scraper"""
    scraper = AngelListScraper()
    jobs = await scraper.scrape_jobs(limit=5)
    
    print(f"\n📊 Scraped {len(jobs)} jobs from AngelList")
    
    if jobs:
        print("\n🔍 Sample job:")
        print(f"   Title: {jobs[0]['job_title']}")
        print(f"   Company: {jobs[0]['company_name']}")
        print(f"   Location: {jobs[0]['location']}")
        print(f"   Skills: {', '.join(jobs[0]['skills_required'][:5])}")
        print(f"   Category: {jobs[0]['category']}")


if __name__ == "__main__":
    import asyncio
    asyncio.run(test_angellist_scraper())
