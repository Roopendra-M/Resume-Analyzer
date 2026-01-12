# app/db.py
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings
import asyncio

client = AsyncIOMotorClient(settings.MONGO_URI)
db = client[settings.DB_NAME]

async def init_db():
    async def create_indexes():
        # User indexes
        await db.users.create_index("email", unique=True)
        
        # Job indexes - basic
        await db.jobs.create_index([("created_at", -1)])
        
        # Job indexes - lifecycle management
        await db.jobs.create_index([("expires_at", 1)], name="expiration_index")
        await db.jobs.create_index([("created_at", 1), ("applied_by", 1), ("saved_by", 1)], name="lifecycle_cleanup_index")
        
        # Job indexes - scraping and filtering
        await db.jobs.create_index([("source_platform", 1)])
        await db.jobs.create_index([("category", 1)])
        await db.jobs.create_index([("remote_type", 1)])
        await db.jobs.create_index([("job_url", 1)], unique=True, sparse=True)  # Prevent duplicate scraping
        
        # Application indexes
        await db.applications.create_index([("user_id", 1), ("job_id", 1)], unique=False)
        await db.applications.create_index([("user_id", 1), ("status", 1)])
        
        # User preferences indexes
        await db.user_preferences.create_index([("user_id", 1)], unique=True)
        
        # Lifecycle logs indexes
        await db.job_lifecycle_logs.create_index([("timestamp", -1)])
        await db.system_logs.create_index([("timestamp", -1)])
        
        print("✅ Database indexes created successfully")
    
    asyncio.create_task(create_indexes())

async def close_db():
    client.close()
