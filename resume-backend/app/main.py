from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings

# Import ALL routers
from app.routers import auth, jobs, resume, apply, feedback, admin, chatbot, analytics, preferences, interview, ai_interview, notifications

app = FastAPI(
    title="Resume Analyzer API",
    version="1.0.0",
    description="AI-powered resume analyzer and job matching platform"
)

# Parse ALLOW_ORIGINS from string to list
allow_origins_list = [
    origin.strip() for origin in settings.ALLOW_ORIGINS.split(",")
]

# CORS Configuration - MUST BE FIRST
app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Include ALL routers WITH /api prefix
print("📌 Registering routers with /api prefix...")
app.include_router(auth.router, prefix="/api", tags=["Authentication"])
app.include_router(jobs.router, prefix="/api", tags=["Jobs"])
app.include_router(resume.router, prefix="/api", tags=["Resume"])
app.include_router(apply.router, prefix="/api", tags=["Applications"])
app.include_router(feedback.router, prefix="/api", tags=["Feedback"])
app.include_router(admin.router, prefix="/api", tags=["Admin"])
app.include_router(chatbot.router, prefix="/api", tags=["Chatbot"])
app.include_router(analytics.router, prefix="/api", tags=["Analytics"])
app.include_router(preferences.router, prefix="/api", tags=["Preferences"])
app.include_router(interview.router, prefix="/api", tags=["Interviews"])
app.include_router(ai_interview.router, prefix="/api", tags=["AI Interviews"])
app.include_router(notifications.router, prefix="/api", tags=["Notifications"])

# Startup event for automatic job scraping
@app.on_event("startup")
async def startup_event():
    """Run job scraping automatically on backend startup"""
    import asyncio
    from app.services.scraping_orchestrator import orchestrator
    
    async def scrape_jobs_background():
        """Background task to scrape jobs"""
        try:
            print("[STARTUP] Starting automatic job scraping...")
            result = await orchestrator.scrape_all_platforms(limit_per_platform=10)
            print(f"[STARTUP] Job scraping complete: {result['total_stored']} jobs stored")
        except Exception as e:
            print(f"[STARTUP] Job scraping failed: {e}")
    
    # Run scraping in background (non-blocking)
    asyncio.create_task(scrape_jobs_background())
    print("[STARTUP] Backend started - job scraping initiated in background")


# Root endpoints
@app.get("/")
def read_root():
    return {
        "message": "Resume Analyzer API",
        "version": "1.0.0",
        "docs": "http://localhost:8000/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "Resume Analyzer API"}

# Startup/Shutdown events
@app.on_event("startup")
async def startup_event():
    print("=" * 80)
    print("✅ Backend started successfully!")
    print("=" * 80)
    print("📚 API Documentation: http://localhost:8000/docs")
    print("📊 Available Endpoints:")
    print("   ✅ /api/auth/login (POST)")
    print("   ✅ /api/auth/signup (POST)")
    print("   ✅ /api/auth/admin/login (POST)")
    print("   ✅ /api/jobs (GET, POST)")
    print("   ✅ /api/jobs/{id} (GET, PUT, DELETE)")
    print("   ✅ /api/jobs/{id}/save (POST) - NEW")
    print("   ✅ /api/jobs/{id}/unsave (POST) - NEW")
    print("   ✅ /api/jobs/saved (GET) - NEW")
    print("   ✅ /api/preferences (GET, PUT) - NEW")
    print("   ✅ /api/admin/dashboard (GET)")
    print("   ✅ /api/admin/jobs/lifecycle-stats (GET) - NEW")
    print("   ✅ /api/admin/jobs/trigger-cleanup (POST) - NEW")
    print("=" * 80)
    
    # Start job lifecycle scheduler
    try:
        from app.services.job_scheduler import scheduler
        scheduler.start()
    except Exception as e:
        print(f"⚠️ Failed to start scheduler: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    print("❌ Backend shutdown")
    
    # Stop scheduler
    try:
        from app.services.job_scheduler import scheduler
        scheduler.stop()
    except Exception as e:
        print(f"⚠️ Failed to stop scheduler: {e}")
