# 🚀 JobCopilot Pro - Complete Setup & Run Guide

## **Quick Start (5 Minutes)**

Follow these steps to get JobCopilot Pro running on your machine!

---

## 📋 **Prerequisites**

### **Required Software:**
- ✅ **Python 3.8+** - [Download](https://www.python.org/downloads/)
- ✅ **Node.js 16+** - [Download](https://nodejs.org/)
- ✅ **MongoDB Atlas Account** - [Sign Up Free](https://www.mongodb.com/cloud/atlas/register)
- ✅ **Groq API Key** - [Get Free Key](https://console.groq.com/)

### **Check Installations:**
```bash
# Check Python
python --version
# Should show: Python 3.8.x or higher

# Check Node.js
node --version
# Should show: v16.x.x or higher

# Check npm
npm --version
# Should show: 8.x.x or higher
```

---

## 🔧 **Step 1: Clone/Navigate to Project**

```bash
cd "d:/Major Project/Project"
```

Your project structure should look like:
```
Project/
├── resume-backend/          # Backend API
├── resume-analyzer-frontend/ # Frontend React app
└── Documentation files
```

---

## 🗄️ **Step 2: Setup MongoDB Atlas**

### **2.1 Create Database:**
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a **Free Cluster** (M0)
3. Click **"Connect"** → **"Connect your application"**
4. Copy the connection string

### **2.2 Configure Access:**
1. **Database Access** → Add user with password
2. **Network Access** → Add IP: `0.0.0.0/0` (allow all)

### **2.3 Get Connection String:**
```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

Replace `<username>` and `<password>` with your credentials.

---

## 🔑 **Step 3: Get Groq API Key**

1. Go to [Groq Console](https://console.groq.com/)
2. Sign up/Login
3. Go to **API Keys**
4. Click **"Create API Key"**
5. Copy the key (starts with `gsk_...`)

---

## ⚙️ **Step 4: Backend Setup**

### **4.1 Navigate to Backend:**
```bash
cd resume-backend
```

### **4.2 Create Virtual Environment (Recommended):**
```bash
# Create virtual environment
python -m venv venv

# Activate it
# On Windows:
venv\Scripts\activate

# On Mac/Linux:
source venv/bin/activate
```

### **4.3 Install Dependencies:**
```bash
pip install -r requirements.txt
```

This installs:
- FastAPI
- Motor (MongoDB async driver)
- Groq AI SDK
- BeautifulSoup4 (for scraping)
- APScheduler (for job scheduling)
- And more...

### **4.4 Create Environment File:**

Create a file named `.env` in the `resume-backend` folder:

```bash
# Create .env file
notepad .env
```

Add this content (replace with your actual values):

```env
# MongoDB Configuration
MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
DB_NAME=jobcopilot_db

# Groq AI Configuration
GROQ_API_KEY=gsk_your_actual_groq_api_key_here

# JWT Configuration
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS Configuration
ALLOW_ORIGINS=http://localhost:5173,http://localhost:3000

# Server Configuration
HOST=0.0.0.0
PORT=8000
```

**Important:** Replace:
- `username:password` in MONGO_URI with your MongoDB credentials
- `gsk_your_actual_groq_api_key_here` with your Groq API key

### **4.5 Run Database Migration:**
```bash
python migrate_jobs.py
```

This creates necessary indexes and updates existing data.

### **4.6 Start Backend Server:**
```bash
uvicorn app.main:app --reload
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

**Keep this terminal open!**

### **4.7 Test Backend:**
Open browser and go to:
- **API Docs:** http://localhost:8000/docs
- **Health Check:** http://localhost:8000/

---

## 🎨 **Step 5: Frontend Setup**

### **5.1 Open New Terminal:**
Open a **new terminal window** (keep backend running in the first one)

### **5.2 Navigate to Frontend:**
```bash
cd "d:/Major Project/Project/resume-analyzer-frontend"
```

### **5.3 Install Dependencies:**
```bash
npm install
```

This installs:
- React 18
- Vite
- Tailwind CSS
- Framer Motion
- Axios
- React Router
- And more...

**Note:** This may take 2-3 minutes.

### **5.4 Start Frontend Server:**
```bash
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

**Keep this terminal open too!**

---

## 🎉 **Step 6: Access the Application**

### **Open Your Browser:**
Go to: **http://localhost:5173**

You should see the **JobCopilot Pro landing page**!

---

## 👤 **Step 7: Create Account & Test**

### **7.1 Sign Up:**
1. Click **"Get Started"** or **"Sign Up"**
2. Enter:
   - Email: `test@example.com`
   - Password: `password123`
   - Name: `Test User`
3. Click **"Sign Up"**

### **7.2 Login:**
1. Go to **Login** page
2. Enter your credentials
3. Click **"Login"**

### **7.3 Explore Features:**

**Dashboard:**
- View your stats
- See top job matches
- Quick actions

**Upload Resume:**
1. Go to **Upload Resume**
2. Upload a PDF/DOCX resume
3. AI will analyze it

**Browse Jobs:**
1. Go to **Jobs**
2. See job listings (scraped from 8 platforms)
3. Each job shows match score
4. Save or apply to jobs

**Mock Interview:**
1. Go to **Mock Interview**
2. Choose interview type
3. Practice with AI

**Video Interview:**
1. Go to **Video Interview**
2. Allow camera/microphone
3. Have a real conversation with AI

**AI Chatbot:**
1. Click floating button (bottom-right)
2. Ask career questions
3. Get AI-powered advice

---

## 🔄 **Running the Platform (Daily Use)**

### **Every Time You Want to Run:**

**Terminal 1 - Backend:**
```bash
cd "d:/Major Project/Project/resume-backend"
venv\Scripts\activate  # If using virtual environment
uvicorn app.main:app --reload
```

**Terminal 2 - Frontend:**
```bash
cd "d:/Major Project/Project/resume-analyzer-frontend"
npm run dev
```

**Access:** http://localhost:5173

---

## 🛠️ **Troubleshooting**

### **Backend Won't Start:**

**Error: "No module named 'fastapi'"**
```bash
# Make sure you're in the virtual environment
venv\Scripts\activate
pip install -r requirements.txt
```

**Error: "Connection refused" (MongoDB)**
- Check your MongoDB Atlas connection string
- Ensure IP whitelist includes `0.0.0.0/0`
- Verify username/password are correct

**Error: "GROQ_API_KEY not found"**
- Check `.env` file exists in `resume-backend/`
- Verify GROQ_API_KEY is set correctly

### **Frontend Won't Start:**

**Error: "Cannot find module"**
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

**Error: "Port 5173 already in use"**
```bash
# Kill the process or use different port
npm run dev -- --port 3000
```

### **Can't Connect to Backend:**

**Error: "Network Error" or "CORS"**
- Ensure backend is running on http://localhost:8000
- Check ALLOW_ORIGINS in backend `.env` includes `http://localhost:5173`
- Restart both servers

### **Database Issues:**

**Collections not created:**
```bash
# Run migration again
python migrate_jobs.py
```

**No jobs showing:**
```bash
# Trigger manual scraping via API docs
# Go to http://localhost:8000/docs
# Find POST /api/admin/trigger-scraping
# Click "Try it out" → "Execute"
```

---

## 📊 **Admin Access**

### **Create Admin User:**

**Option 1: Via MongoDB Atlas:**
1. Go to MongoDB Atlas
2. Browse Collections → `users`
3. Find your user document
4. Edit: Change `"role": "user"` to `"role": "admin"`

**Option 2: Via Python Script:**
```python
# admin_setup.py
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

async def make_admin():
    client = AsyncIOMotorClient("your_mongo_uri")
    db = client.jobcopilot_db
    
    result = await db.users.update_one(
        {"email": "test@example.com"},
        {"$set": {"role": "admin"}}
    )
    print(f"Updated {result.modified_count} user(s)")

asyncio.run(make_admin())
```

### **Admin Features:**
- Post/Edit/Delete jobs
- View all applications
- Trigger manual scraping
- View lifecycle stats
- Monitor platform activity

**Access:** http://localhost:5173/admin/dashboard

---

## 🎯 **Testing All Features**

### **Checklist:**

**Authentication:**
- ✅ Sign up new user
- ✅ Login with credentials
- ✅ Logout

**Resume:**
- ✅ Upload PDF resume
- ✅ View extracted skills
- ✅ See analysis

**Jobs:**
- ✅ Browse job listings
- ✅ See match scores
- ✅ Filter by category
- ✅ Save jobs
- ✅ Apply to jobs

**Applications:**
- ✅ View my applications
- ✅ Update status
- ✅ Add notes
- ✅ View timeline

**Interviews:**
- ✅ Traditional mock interview
- ✅ AI conversational interview
- ✅ Video interview (camera/mic)

**Chatbot:**
- ✅ Click floating button
- ✅ Ask questions
- ✅ Get AI responses

**Analytics:**
- ✅ View dashboard stats
- ✅ See job trends
- ✅ Track progress

---

## 🚀 **Optional: Enable Automated Scraping**

By default, job scraping is manual. To enable automatic scraping:

### **Edit `app/services/job_scheduler.py`:**

Find this line (around line 50):
```python
# scheduler.add_job(
#     scrape_jobs_task,
#     'interval',
#     hours=6,
#     id='job_scraping'
# )
```

Uncomment it:
```python
scheduler.add_job(
    scrape_jobs_task,
    'interval',
    hours=6,
    id='job_scraping'
)
```

**Restart backend** - Jobs will now scrape every 6 hours automatically!

---

## 📝 **Environment Variables Reference**

### **Backend `.env` File:**

```env
# Required
MONGO_URI=mongodb+srv://...
DB_NAME=jobcopilot_db
GROQ_API_KEY=gsk_...
SECRET_KEY=your-secret-key

# Optional (with defaults)
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ALLOW_ORIGINS=http://localhost:5173,http://localhost:3000
HOST=0.0.0.0
PORT=8000
```

---

## 🎊 **You're All Set!**

Your JobCopilot Pro platform is now running with:

- ✅ AI-powered job matching
- ✅ 8-platform job scraping
- ✅ Mock interviews (3 modes)
- ✅ Video interviews with AI
- ✅ Career chatbot
- ✅ Application tracking
- ✅ Beautiful modern UI

**Enjoy your AI-powered job search platform!** 🚀

---

## 📚 **Additional Resources**

- **API Documentation:** http://localhost:8000/docs
- **Testing Guide:** `TESTING_GUIDE.md`
- **Scrapers Guide:** `SCRAPERS_SUMMARY.md`
- **Job Matching Guide:** `JOB_MATCHING_SUMMARY.md`
- **Video Interview Guide:** `AI_VIDEO_INTERVIEW_GUIDE.md`
- **Complete Summary:** `FINAL_PROJECT_SUMMARY.md`

---

## 🆘 **Need Help?**

**Common Issues:**
1. Backend not connecting → Check MongoDB URI
2. No jobs showing → Trigger manual scraping
3. Frontend errors → Clear cache, reinstall node_modules
4. CORS errors → Check ALLOW_ORIGINS in .env

**Still stuck?** Check the documentation files or review the error messages in the terminal.

**Happy Job Hunting!** 🎯✨
