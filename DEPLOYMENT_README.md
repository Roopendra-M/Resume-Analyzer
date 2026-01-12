# JobCopilot - Deployment Files

This directory contains deployment configuration files for production deployment.

## Files Created

### Backend (Render)
- `render.yaml` - Render service configuration
- `build.sh` - Build script for Render
- `requirements.txt` - Updated with groq package

### Frontend (Vercel)
- `vercel.json` - Vercel deployment configuration
- `.env.production` - Production environment variables

## Quick Start

1. **Read the deployment guide**: See `DEPLOYMENT_GUIDE.md` in the artifacts folder
2. **Setup MongoDB Atlas**: Create a free cluster and get connection string
3. **Push to GitHub**: Initialize git and push your code
4. **Deploy Backend**: Use Render with the provided `render.yaml`
5. **Deploy Frontend**: Use Vercel with the provided `vercel.json`

## Environment Variables Needed

### Backend (Render)
```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
GROQ_API_KEY=your-groq-api-key
GEMINI_API_KEY=your-gemini-key
GEMINI_MODEL=gemini-2.0-flash
ALLOW_ORIGINS=https://your-frontend.vercel.app
PYTHON_VERSION=3.10.19
```

### Frontend (Vercel)
```
VITE_API_URL=https://your-backend.onrender.com/api
```

## Important Notes

- **Free Tier**: Both Render and Vercel offer free tiers
- **Render Limitation**: Free tier spins down after 15 min inactivity
- **First Load**: May take 30-60 seconds after spin-down
- **MongoDB**: Use Atlas free tier (M0) for production database

## Support

Follow the complete deployment guide in the artifacts folder for step-by-step instructions.
