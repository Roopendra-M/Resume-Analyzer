# app/scrapers/remoteok_scraper.py
"""
RemoteOK Job Scraper

Scrapes jobs from RemoteOK.com using their public API.
This is one of the easiest scrapers as RemoteOK provides a JSON API.
"""

import httpx
from typing import List, Dict, Any
from app.scrapers.base_scraper import BaseScraper


class RemoteOKScraper(BaseScraper):
    """Scraper for RemoteOK.com jobs"""
    
    def __init__(self):
        super().__init__(
            platform_name="RemoteOK",
            max_requests_per_minute=30,
            timeout=30
        )
        self.api_url = "https://remoteok.com/api"
    
    async def scrape_jobs(self, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Scrape jobs from RemoteOK API.
        
        Args:
            limit: Maximum number of jobs to scrape
            
        Returns:
            List of normalized job dictionaries
        """
        
        try:
            print(f"🔍 Fetching jobs from RemoteOK API...")
            
            # RemoteOK API returns JSON directly
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(self.api_url)
                response.raise_for_status()
                data = response.json()
            
            if not data or len(data) == 0:
                print("⚠️ No jobs found from RemoteOK")
                return []
            
            # First item is metadata, skip it
            jobs_data = data[1:limit+1] if len(data) > 1 else []
            
            normalized_jobs = []
            
            for job_data in jobs_data:
                try:
                    # Extract skills/tags
                    skills = []
                    if "tags" in job_data and job_data["tags"]:
                        skills = [tag for tag in job_data["tags"] if tag]
                    
                    # Parse salary if available
                    salary_min = job_data.get("salary_min")
                    salary_max = job_data.get("salary_max")
                    
                    # Build job URL
                    job_url = f"https://remoteok.com/remote-jobs/{job_data.get('id', '')}"
                    
                    # Create raw data dict
                    raw_data = {
                        "title": job_data.get("position", "Unknown"),
                        "company": job_data.get("company", "Unknown"),
                        "location": job_data.get("location", "Remote"),
                        "remote_type": "Remote",  # RemoteOK is all remote
                        "job_type": "Full-time",  # Default
                        "salary_min": salary_min,
                        "salary_max": salary_max,
                        "currency": "USD",
                        "skills": skills[:10],  # Limit to 10 skills
                        "experience": "",  # Not provided by RemoteOK
                        "description": job_data.get("description", ""),
                        "url": job_url
                    }
                    
                    # Normalize and add to list
                    normalized_job = self.normalize_job_data(raw_data)
                    normalized_jobs.append(normalized_job)
                    
                except Exception as e:
                    print(f"❌ Error parsing RemoteOK job: {e}")
                    continue
            
            print(f"✅ RemoteOK: Parsed {len(normalized_jobs)} jobs")
            return normalized_jobs
            
        except Exception as e:
            print(f"❌ RemoteOK scraping error: {e}")
            return []


# Example usage
async def test_remoteok_scraper():
    """Test the RemoteOK scraper"""
    scraper = RemoteOKScraper()
    jobs = await scraper.scrape_jobs(limit=10)
    
    print(f"\n📊 Scraped {len(jobs)} jobs from RemoteOK")
    
    if jobs:
        print("\n🔍 Sample job:")
        print(f"   Title: {jobs[0]['job_title']}")
        print(f"   Company: {jobs[0]['company_name']}")
        print(f"   Location: {jobs[0]['location']}")
        print(f"   Skills: {', '.join(jobs[0]['skills_required'][:5])}")
        print(f"   Category: {jobs[0]['category']}")
        print(f"   URL: {jobs[0]['job_url']}")


if __name__ == "__main__":
    import asyncio
    asyncio.run(test_remoteok_scraper())
