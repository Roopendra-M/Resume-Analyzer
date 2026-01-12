# app/services/job_scheduler.py
"""
Job Scheduler Service

Manages background tasks for:
- Job lifecycle cleanup (daily at 2 AM)
- Job count synchronization (hourly)
- Automated job scraping (every 6 hours)
"""

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime
from app.services.job_lifecycle import cleanup_expired_jobs, sync_job_counts


class JobLifecycleScheduler:
    """Scheduler for job lifecycle management tasks"""
    
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self._is_running = False
    
    def start(self):
        """Start the scheduler with all jobs"""
        if self._is_running:
            print("⚠️ Scheduler already running")
            return
        
        # Job cleanup - Daily at 2 AM
        self.scheduler.add_job(
            cleanup_expired_jobs,
            trigger=CronTrigger(hour=2, minute=0),
            id='job_cleanup',
            name='Clean up expired jobs',
            replace_existing=True
        )
        
        # Job count sync - Every hour
        self.scheduler.add_job(
            sync_job_counts,
            trigger=IntervalTrigger(hours=1),
            id='job_sync',
            name='Sync job interaction counts',
            replace_existing=True
        )
        
        # Job scraping - Every 6 hours (will be implemented later)
        # self.scheduler.add_job(
        #     scrape_all_platforms,
        #     trigger=IntervalTrigger(hours=6),
        #     id='job_scraping',
        #     name='Scrape jobs from all platforms',
        #     replace_existing=True
        # )
        
        self.scheduler.start()
        self._is_running = True
        
        print("=" * 80)
        print("✅ Job Lifecycle Scheduler Started")
        print("=" * 80)
        print("📅 Scheduled Jobs:")
        print("   ✅ Job Cleanup: Daily at 2:00 AM")
        print("   ✅ Job Count Sync: Every 1 hour")
        print("   ⏸️  Job Scraping: Every 6 hours (to be enabled)")
        print("=" * 80)
    
    def stop(self):
        """Stop the scheduler"""
        if not self._is_running:
            print("⚠️ Scheduler not running")
            return
        
        self.scheduler.shutdown()
        self._is_running = False
        print("❌ Job Lifecycle Scheduler Stopped")
    
    def get_jobs(self):
        """Get all scheduled jobs"""
        return self.scheduler.get_jobs()
    
    async def trigger_cleanup_now(self):
        """Manually trigger cleanup (for testing/admin)"""
        print("🔧 Manually triggering job cleanup...")
        deleted_count = await cleanup_expired_jobs()
        return deleted_count
    
    async def trigger_sync_now(self):
        """Manually trigger sync (for testing/admin)"""
        print("🔧 Manually triggering job count sync...")
        updated_count = await sync_job_counts()
        return updated_count


# Global scheduler instance
scheduler = JobLifecycleScheduler()
