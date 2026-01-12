# app/scrapers/stackoverflow_scraper.py
"""
Stack Overflow Jobs Scraper

Note: Stack Overflow Jobs was shut down in March 2022.
This scraper returns sample data for demonstration purposes.
In production, you could use Stack Overflow's Careers API or another tech job board.
"""

from typing import List, Dict, Any
from app.scrapers.base_scraper import BaseScraper


class StackOverflowScraper(BaseScraper):
    """Scraper for Stack Overflow Jobs (placeholder with sample data)"""
    
    def __init__(self):
        super().__init__(
            platform_name="StackOverflow",
            max_requests_per_minute=30,
            timeout=30
        )
    
    async def scrape_jobs(self, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Scrape jobs from Stack Overflow.
        
        Note: Stack Overflow Jobs was discontinued in March 2022.
        This returns sample data for demonstration.
        
        Args:
            limit: Maximum number of jobs to scrape
            
        Returns:
            List of normalized job dictionaries
        """
        
        print(f"⚠️ Stack Overflow Jobs was discontinued. Returning sample data for demonstration.")
        
        # Sample tech jobs for demonstration
        sample_jobs = [
            {
                "title": "Backend Engineer - Python/Django",
                "company": "Stack Overflow",
                "location": "Remote",
                "remote_type": "Remote",
                "job_type": "Full-time",
                "salary_min": 130000,
                "salary_max": 170000,
                "currency": "USD",
                "skills": ["Python", "Django", "PostgreSQL", "Redis", "AWS"],
                "experience": "Senior",
                "description": "Join our backend team to build scalable systems...",
                "url": "https://stackoverflow.com/jobs/example-1"
            },
            {
                "title": "Frontend Developer - React",
                "company": "Stack Overflow",
                "location": "New York, NY",
                "remote_type": "Hybrid",
                "job_type": "Full-time",
                "salary_min": 110000,
                "salary_max": 150000,
                "currency": "USD",
                "skills": ["React", "TypeScript", "CSS", "JavaScript", "Redux"],
                "experience": "Mid",
                "description": "We're looking for a frontend developer...",
                "url": "https://stackoverflow.com/jobs/example-2"
            },
            {
                "title": "DevOps Engineer",
                "company": "Tech Solutions Inc",
                "location": "Remote",
                "remote_type": "Remote",
                "job_type": "Full-time",
                "salary_min": 120000,
                "salary_max": 160000,
                "currency": "USD",
                "skills": ["Kubernetes", "Docker", "Terraform", "AWS", "Python"],
                "experience": "Senior",
                "description": "Help us build and maintain our cloud infrastructure...",
                "url": "https://stackoverflow.com/jobs/example-3"
            },
            {
                "title": "Mobile Developer - iOS/Swift",
                "company": "Mobile First Co",
                "location": "San Francisco, CA",
                "remote_type": "On-site",
                "job_type": "Full-time",
                "salary_min": 125000,
                "salary_max": 165000,
                "currency": "USD",
                "skills": ["Swift", "iOS", "UIKit", "SwiftUI", "Xcode"],
                "experience": "Mid",
                "description": "Build amazing iOS applications...",
                "url": "https://stackoverflow.com/jobs/example-4"
            }
        ]
        
        normalized_jobs = []
        
        for job_data in sample_jobs[:limit]:
            try:
                normalized_job = self.normalize_job_data(job_data)
                normalized_jobs.append(normalized_job)
            except Exception as e:
                print(f"❌ Error parsing Stack Overflow job: {e}")
                continue
        
        print(f"✅ StackOverflow: Parsed {len(normalized_jobs)} sample jobs")
        return normalized_jobs


# Example usage
async def test_stackoverflow_scraper():
    """Test the Stack Overflow scraper"""
    scraper = StackOverflowScraper()
    jobs = await scraper.scrape_jobs(limit=5)
    
    print(f"\n📊 Scraped {len(jobs)} jobs from Stack Overflow")
    
    if jobs:
        print("\n🔍 Sample job:")
        print(f"   Title: {jobs[0]['job_title']}")
        print(f"   Company: {jobs[0]['company_name']}")
        print(f"   Location: {jobs[0]['location']}")
        print(f"   Skills: {', '.join(jobs[0]['skills_required'])}")
        print(f"   Category: {jobs[0]['category']}")


if __name__ == "__main__":
    import asyncio
    asyncio.run(test_stackoverflow_scraper())
