# app/scrapers/weworkremotely_scraper.py
"""
We Work Remotely Job Scraper

Scrapes jobs from WeWorkRemotely.com
Uses HTML parsing with BeautifulSoup.
"""

from typing import List, Dict, Any
from bs4 import BeautifulSoup
import re
from app.scrapers.base_scraper import BaseScraper


class WeWorkRemotelyScraper(BaseScraper):
    """Scraper for WeWorkRemotely.com jobs"""
    
    def __init__(self):
        super().__init__(
            platform_name="WeWorkRemotely",
            max_requests_per_minute=20,  # Be conservative
            timeout=30
        )
        self.base_url = "https://weworkremotely.com"
        self.jobs_url = f"{self.base_url}/categories/remote-programming-jobs"
    
    async def scrape_jobs(self, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Scrape jobs from WeWorkRemotely.
        
        Args:
            limit: Maximum number of jobs to scrape
            
        Returns:
            List of normalized job dictionaries
        """
        
        try:
            print(f"🔍 Fetching jobs from WeWorkRemotely...")
            
            # Fetch the jobs page
            html = await self.fetch_with_retry(self.jobs_url)
            
            if not html:
                print("⚠️ Failed to fetch WeWorkRemotely page")
                return []
            
            # Parse HTML
            soup = BeautifulSoup(html, 'html.parser')
            
            # Find job listings
            job_listings = soup.find_all('li', class_='feature')
            
            if not job_listings:
                print("⚠️ No job listings found on WeWorkRemotely")
                return []
            
            normalized_jobs = []
            
            for job_elem in job_listings[:limit]:
                try:
                    # Extract job details
                    title_elem = job_elem.find('span', class_='title')
                    company_elem = job_elem.find('span', class_='company')
                    link_elem = job_elem.find('a')
                    
                    if not title_elem or not company_elem or not link_elem:
                        continue
                    
                    title = title_elem.get_text(strip=True)
                    company = company_elem.get_text(strip=True)
                    job_url = self.base_url + link_elem.get('href', '')
                    
                    # Extract region/location if available
                    region_elem = job_elem.find('span', class_='region')
                    location = region_elem.get_text(strip=True) if region_elem else "Remote"
                    
                    # Create raw data dict
                    raw_data = {
                        "title": title,
                        "company": company,
                        "location": location,
                        "remote_type": "Remote",  # WWR is all remote
                        "job_type": "Full-time",  # Default
                        "salary_min": None,
                        "salary_max": None,
                        "currency": "USD",
                        "skills": self._extract_skills_from_title(title),
                        "experience": "",
                        "description": title,  # Would need to fetch individual job page for full description
                        "url": job_url
                    }
                    
                    # Normalize and add to list
                    normalized_job = self.normalize_job_data(raw_data)
                    normalized_jobs.append(normalized_job)
                    
                except Exception as e:
                    print(f"❌ Error parsing WeWorkRemotely job: {e}")
                    continue
            
            print(f"✅ WeWorkRemotely: Parsed {len(normalized_jobs)} jobs")
            return normalized_jobs
            
        except Exception as e:
            print(f"❌ WeWorkRemotely scraping error: {e}")
            return []
    
    def _extract_skills_from_title(self, title: str) -> List[str]:
        """Extract skills from job title"""
        skills = []
        common_skills = [
            "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go", "Rust",
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
async def test_weworkremotely_scraper():
    """Test the WeWorkRemotely scraper"""
    scraper = WeWorkRemotelyScraper()
    jobs = await scraper.scrape_jobs(limit=10)
    
    print(f"\n📊 Scraped {len(jobs)} jobs from WeWorkRemotely")
    
    if jobs:
        print("\n🔍 Sample job:")
        print(f"   Title: {jobs[0]['job_title']}")
        print(f"   Company: {jobs[0]['company_name']}")
        print(f"   Location: {jobs[0]['location']}")
        print(f"   Skills: {', '.join(jobs[0]['skills_required'])}")
        print(f"   Category: {jobs[0]['category']}")
        print(f"   URL: {jobs[0]['job_url']}")


if __name__ == "__main__":
    import asyncio
    asyncio.run(test_weworkremotely_scraper())
