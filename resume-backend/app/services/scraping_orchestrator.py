# app/services/scraping_orchestrator.py
"""
Scraping Orchestrator Service

Coordinates scraping from all platforms:
- Runs scrapers in parallel
- Aggregates results
- Stores in database with lifecycle fields
- Monitors scraping health
"""

import asyncio
from typing import List, Dict, Any
from datetime import datetime
from app.db import db


class ScrapingOrchestrator:
    """Orchestrates job scraping from multiple platforms"""
    
    def __init__(self):
        self.scrapers = []
        self._initialize_scrapers()
    
    def _initialize_scrapers(self):
        """Initialize all platform scrapers"""
        try:
            from app.scrapers.remoteok_scraper import RemoteOKScraper
            self.scrapers.append(RemoteOKScraper())
            print("[OK] Initialized RemoteOK scraper")
        except Exception as e:
            print(f"[WARN] Failed to initialize RemoteOK scraper: {e}")
        
        try:
            from app.scrapers.github_scraper import GitHubScraper
            self.scrapers.append(GitHubScraper())
            print("[OK] Initialized GitHub scraper")
        except Exception as e:
            print(f"[WARN] Failed to initialize GitHub scraper: {e}")
        
        try:
            from app.scrapers.weworkremotely_scraper import WeWorkRemotelyScraper
            self.scrapers.append(WeWorkRemotelyScraper())
            print("[OK] Initialized WeWorkRemotely scraper")
        except Exception as e:
            print(f"[WARN] Failed to initialize WeWorkRemotely scraper: {e}")
        
        try:
            from app.scrapers.indeed_scraper import IndeedScraper
            self.scrapers.append(IndeedScraper())
            print("[OK] Initialized Indeed scraper")
        except Exception as e:
            print(f"[WARN] Failed to initialize Indeed scraper: {e}")
        
        try:
            from app.scrapers.linkedin_scraper import LinkedInScraper
            self.scrapers.append(LinkedInScraper())
            print("[OK] Initialized LinkedIn scraper")
        except Exception as e:
            print(f"[WARN] Failed to initialize LinkedIn scraper: {e}")
        
        try:
            from app.scrapers.stackoverflow_scraper import StackOverflowScraper
            self.scrapers.append(StackOverflowScraper())
            print("[OK] Initialized StackOverflow scraper")
        except Exception as e:
            print(f"[WARN] Failed to initialize StackOverflow scraper: {e}")
        
        try:
            from app.scrapers.glassdoor_scraper import GlassdoorScraper
            self.scrapers.append(GlassdoorScraper())
            print("[OK] Initialized Glassdoor scraper")
        except Exception as e:
            print(f"[WARN] Failed to initialize Glassdoor scraper: {e}")
        
        try:
            from app.scrapers.angellist_scraper import AngelListScraper
            self.scrapers.append(AngelListScraper())
            print("[OK] Initialized AngelList scraper")
        except Exception as e:
            print(f"[WARN] Failed to initialize AngelList scraper: {e}")

    
    async def scrape_all_platforms(self, limit_per_platform: int = 50) -> Dict[str, Any]:
        """
        Scrape jobs from all platforms in parallel.
        
        Args:
            limit_per_platform: Maximum jobs to scrape per platform
            
        Returns:
            Aggregated statistics from all platforms
        """
        print("=" * 80)
        print("[START] Multi-Platform Job Scraping")
        print("=" * 80)
        print(f"Platforms: {len(self.scrapers)}")
        print(f"Limit per platform: {limit_per_platform}")
        print("=" * 80)
        
        start_time = datetime.utcnow()
        
        # Run all scrapers in parallel
        tasks = [
            scraper.scrape_and_store(db, limit=limit_per_platform)
            for scraper in self.scrapers
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Aggregate results
        total_scraped = 0
        total_stored = 0
        total_duplicates = 0
        total_errors = 0
        platform_results = []
        
        for result in results:
            if isinstance(result, Exception):
                print(f"[ERROR] Scraper error: {result}")
                total_errors += 1
                continue
            
            if isinstance(result, dict):
                total_scraped += result.get("scraped", 0)
                total_stored += result.get("stored", 0)
                total_duplicates += result.get("duplicates", 0)
                total_errors += result.get("errors", 0)
                platform_results.append(result)
        
        end_time = datetime.utcnow()
        duration = (end_time - start_time).total_seconds()
        
        # Log scraping event
        await self._log_scraping_event(
            total_scraped=total_scraped,
            total_stored=total_stored,
            total_duplicates=total_duplicates,
            total_errors=total_errors,
            duration=duration,
            platform_results=platform_results
        )
        
        print("=" * 80)
        print("[COMPLETE] Multi-Platform Scraping Complete")
        print("=" * 80)
        print(f"Total Scraped: {total_scraped}")
        print(f"Total Stored: {total_stored}")
        print(f"Total Duplicates: {total_duplicates}")
        print(f"Total Errors: {total_errors}")
        print(f"Duration: {duration:.2f}s")
        print("=" * 80)
        
        return {
            "success": True,
            "total_scraped": total_scraped,
            "total_stored": total_stored,
            "total_duplicates": total_duplicates,
            "total_errors": total_errors,
            "duration_seconds": duration,
            "platforms": platform_results,
            "timestamp": end_time
        }
    
    async def _log_scraping_event(
        self,
        total_scraped: int,
        total_stored: int,
        total_duplicates: int,
        total_errors: int,
        duration: float,
        platform_results: List[Dict[str, Any]]
    ):
        """Log scraping event to database"""
        try:
            event = {
                "event": "job_scraping",
                "timestamp": datetime.utcnow(),
                "total_scraped": total_scraped,
                "total_stored": total_stored,
                "total_duplicates": total_duplicates,
                "total_errors": total_errors,
                "duration_seconds": duration,
                "platforms": platform_results,
                "status": "success" if total_errors == 0 else "partial_success"
            }
            
            await db.system_logs.insert_one(event)
            
        except Exception as e:
            print(f"[ERROR] Error logging scraping event: {e}")
    
    async def get_scraping_stats(self) -> Dict[str, Any]:
        """Get scraping statistics from logs"""
        try:
            # Get recent scraping logs
            recent_logs = await db.system_logs.find({
                "event": "job_scraping"
            }).sort("timestamp", -1).limit(10).to_list(10)
            
            if not recent_logs:
                return {
                    "total_scraping_runs": 0,
                    "recent_logs": []
                }
            
            # Calculate totals
            total_runs = len(recent_logs)
            total_jobs_scraped = sum(log.get("total_scraped", 0) for log in recent_logs)
            total_jobs_stored = sum(log.get("total_stored", 0) for log in recent_logs)
            
            return {
                "total_scraping_runs": total_runs,
                "total_jobs_scraped": total_jobs_scraped,
                "total_jobs_stored": total_jobs_stored,
                "recent_logs": [
                    {
                        "timestamp": log.get("timestamp"),
                        "scraped": log.get("total_scraped", 0),
                        "stored": log.get("total_stored", 0),
                        "duplicates": log.get("total_duplicates", 0),
                        "errors": log.get("total_errors", 0),
                        "duration": log.get("duration_seconds", 0),
                        "status": log.get("status", "unknown")
                    }
                    for log in recent_logs
                ]
            }
            
        except Exception as e:
            print(f"[ERROR] Error getting scraping stats: {e}")
            return {
                "total_scraping_runs": 0,
                "recent_logs": [],
                "error": str(e)
            }


# Global orchestrator instance
orchestrator = ScrapingOrchestrator()


# Example usage
async def test_orchestrator():
    """Test the scraping orchestrator"""
    from app.db import client
    
    result = await orchestrator.scrape_all_platforms(limit_per_platform=10)
    
    print("\n📊 Scraping Results:")
    print(f"   Total Scraped: {result['total_scraped']}")
    print(f"   Total Stored: {result['total_stored']}")
    print(f"   Total Duplicates: {result['total_duplicates']}")
    print(f"   Duration: {result['duration_seconds']:.2f}s")
    
    print("\n📋 Platform Breakdown:")
    for platform in result['platforms']:
        print(f"   {platform['platform']}: {platform['stored']} stored, {platform['duplicates']} duplicates")


if __name__ == "__main__":
    asyncio.run(test_orchestrator())
