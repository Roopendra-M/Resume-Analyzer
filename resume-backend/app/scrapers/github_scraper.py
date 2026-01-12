# app/scrapers/github_scraper.py
"""
GitHub Jobs Scraper

Note: GitHub Jobs was shut down in May 2021.
This is a placeholder/example scraper that demonstrates the pattern.
In production, you would use GitHub's actual job board or another source.

For demonstration, this scraper will return sample data.
"""

from typing import List, Dict, Any
from app.scrapers.base_scraper import BaseScraper


class GitHubScraper(BaseScraper):
    """Scraper for GitHub-related jobs (placeholder)"""
    
    def __init__(self):
        super().__init__(
            platform_name="GitHub",
            max_requests_per_minute=30,
            timeout=30
        )
    
    async def scrape_jobs(self, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Scrape jobs from GitHub.
        
        Note: This is a placeholder since GitHub Jobs is discontinued.
        In production, replace with actual job source.
        
        Args:
            limit: Maximum number of jobs to scrape
            
        Returns:
            List of normalized job dictionaries
        """
        
        print(f"⚠️ GitHub Jobs API is discontinued. Returning sample data for demonstration.")
        
        # Sample jobs for demonstration
        sample_jobs = [
            {
                "title": "Senior Full Stack Developer",
                "company": "GitHub Inc",
                "location": "Remote",
                "remote_type": "Remote",
                "job_type": "Full-time",
                "salary_min": 120000,
                "salary_max": 180000,
                "currency": "USD",
                "skills": ["JavaScript", "TypeScript", "React", "Node.js", "PostgreSQL"],
                "experience": "Senior",
                "description": "We're looking for a senior full stack developer to join our team...",
                "url": "https://github.com/careers/"
            },
            {
                "title": "DevOps Engineer",
                "company": "GitHub Inc",
                "location": "San Francisco, CA",
                "remote_type": "Hybrid",
                "job_type": "Full-time",
                "salary_min": 130000,
                "salary_max": 190000,
                "currency": "USD",
                "skills": ["Kubernetes", "Docker", "AWS", "Terraform", "Python"],
                "experience": "Mid",
                "description": "Join our infrastructure team to build and maintain...",
                "url": "https://github.com/careers/"
            }
        ]
        
        normalized_jobs = []
        
        for job_data in sample_jobs[:limit]:
            try:
                normalized_job = self.normalize_job_data(job_data)
                normalized_jobs.append(normalized_job)
            except Exception as e:
                print(f"❌ Error parsing GitHub job: {e}")
                continue
        
        print(f"✅ GitHub: Parsed {len(normalized_jobs)} sample jobs")
        return normalized_jobs


# Example usage
async def test_github_scraper():
    """Test the GitHub scraper"""
    scraper = GitHubScraper()
    jobs = await scraper.scrape_jobs(limit=5)
    
    print(f"\n📊 Scraped {len(jobs)} jobs from GitHub")
    
    if jobs:
        print("\n🔍 Sample job:")
        print(f"   Title: {jobs[0]['job_title']}")
        print(f"   Company: {jobs[0]['company_name']}")
        print(f"   Location: {jobs[0]['location']}")
        print(f"   Skills: {', '.join(jobs[0]['skills_required'])}")
        print(f"   Category: {jobs[0]['category']}")


if __name__ == "__main__":
    import asyncio
    asyncio.run(test_github_scraper())
