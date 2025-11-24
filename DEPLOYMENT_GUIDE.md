# 🚀 RoosterScan Deployment Guide (100% FREE)

## Prerequisites
- GitHub account
- Vercel account (sign up with GitHub)
- Render account (sign up with GitHub)
- Supabase project (already set up ✅)

---

## 📦 Step 1: Prepare Repository

### 1.1 Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit - RoosterScan ready for deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/roosterscan.git
git push -u origin main
```

---

## 🎨 Step 2: Deploy Frontend (Vercel - FREE)

### 2.1 Go to Vercel
1. Visit https://vercel.com
2. Click "Sign Up" → Sign in with GitHub
3. Click "Add New Project"
4. Import your RoosterScan repository

### 2.2 Configure Build Settings
- **Framework Preset:** Vite
- **Build Command:** `npm run build:client`
- **Output Directory:** `dist/client`
- **Install Command:** `npm install`

### 2.3 Add Environment Variables
Click "Environment Variables" and add:
```
VITE_API_URL = https://your-backend-url.onrender.com
```
(You'll get this URL in Step 3)

### 2.4 Deploy
- Click "Deploy"
- Wait 2-3 minutes
- Your frontend will be live at: `https://roosterscan.vercel.app`

---

## ⚙️ Step 3: Deploy Backend (Render - FREE)

### 3.1 Go to Render
1. Visit https://render.com
2. Click "Sign Up" → Sign in with GitHub
3. Click "New +" → "Web Service"
4. Connect your RoosterScan repository

### 3.2 Configure Service
- **Name:** roosterscan-api
- **Region:** Oregon (US West)
- **Branch:** main
- **Runtime:** Node
- **Build Command:** `npm install && npm run build:server`
- **Start Command:** `npm start`
- **Plan:** Free

### 3.3 Add Environment Variables
Click "Environment" and add:
```
NODE_ENV = production
PORT = 10000
SUPABASE_URL = your_supabase_url
SUPABASE_ANON_KEY = your_supabase_anon_key
```

### 3.4 Deploy
- Click "Create Web Service"
- Wait 5-10 minutes (first deploy takes longer)
- Your backend will be live at: `https://roosterscan-api.onrender.com`

### 3.5 Update Frontend
- Go back to Vercel
- Update `VITE_API_URL` with your Render URL
- Redeploy frontend

---

## 🗄️ Step 4: Configure Supabase

### 4.1 Update Allowed URLs
1. Go to Supabase Dashboard
2. Settings → API
3. Add to "Site URL":
   - `https://roosterscan.vercel.app`
4. Add to "Redirect URLs":
   - `https://roosterscan.vercel.app/auth/callback`

### 4.2 Enable Storage
1. Go to Storage
2. Create bucket: `rooster-images`
3. Set to Public
4. Add CORS policy:
```json
{
  "allowedOrigins": ["https://roosterscan.vercel.app"],
  "allowedMethods": ["GET", "POST", "PUT", "DELETE"],
  "allowedHeaders": ["*"],
  "maxAgeSeconds": 3600
}
```

---

## ✅ Step 5: Test Deployment

### 5.1 Test Frontend
1. Visit `https://roosterscan.vercel.app`
2. Check if pages load
3. Try authentication

### 5.2 Test Backend
1. Visit `https://roosterscan-api.onrender.com/health`
2. Should return: `{"status": "ok"}`

### 5.3 Test Full Flow
1. Sign up / Log in
2. Upload rooster image
3. Check AI analysis works
4. Verify results save to database

---

## 🎯 Important Notes

### Free Tier Limitations:
- **Render:** Service sleeps after 15 mins of inactivity
  - First request after sleep takes ~30 seconds
  - Subsequent requests are instant
  - Perfect for demos and testing

- **Vercel:** No limitations for personal projects
  - Unlimited bandwidth
  - Always fast

- **Supabase:** 
  - 500MB database (plenty for testing)
  - 2GB bandwidth/month
  - 1GB file storage

### For Defense Presentation:
- Wake up backend 1 minute before demo
- Keep a tab open to prevent sleep
- Have backup screenshots ready

---

## 🔧 Troubleshooting

### Backend won't start:
- Check Render logs
- Verify environment variables
- Ensure Python dependencies in requirements.txt

### Frontend can't connect:
- Check VITE_API_URL is correct
- Verify CORS settings
- Check browser console for errors

### AI models not loading:
- Ensure model files are in repository
- Check file paths in code
- Verify Python packages installed

---

## 📱 Access Your App

**Frontend:** https://roosterscan.vercel.app
**Backend:** https://roosterscan-api.onrender.com
**Database:** Supabase Dashboard

---

## 🎓 For Your Defense

**What to say:**
- "Deployed on industry-standard platforms"
- "Using serverless architecture for scalability"
- "Free tier suitable for MVP and testing"
- "Can upgrade to paid tier for production"

**Demo tips:**
- Wake backend before presentation
- Have sample images ready
- Show mobile responsive design
- Demonstrate real-time AI analysis

---

## 🚀 Next Steps After Defense

1. Add custom domain
2. Implement PWA features
3. Add offline capabilities
4. Upgrade to paid tier if needed
5. Add monitoring and analytics

---

**Total Cost: $0/month** 🎉
**Deployment Time: ~30 minutes**
**Perfect for November defense!** ✅
