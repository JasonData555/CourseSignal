# CourseSignal - Quick Start Guide

Get CourseSignal running in production in under 45 minutes.

## What You'll Get

✅ Live CourseSignal instance with public URL
✅ Tracking script ready to install on your course site
✅ Dashboard to view revenue attribution by marketing source
✅ Platform integrations (Kajabi, Teachable, Skool)

---

## Prerequisites (5 minutes)

1. **GitHub Account** - Your CourseSignal code must be in a GitHub repository
2. **Render Account** - Sign up free at https://render.com
3. **Course Platform** - Kajabi, Teachable, or Skool account

---

## Step 1: Deploy to Render (10 minutes)

### 1.1 Connect GitHub to Render
1. Go to https://dashboard.render.com
2. Click "Account Settings" → "Connect Accounts"
3. Authorize Render to access your GitHub
4. Select your CourseSignal repository

### 1.2 Deploy via Blueprint
1. Go to https://dashboard.render.com/blueprints
2. Click "New Blueprint"
3. Select your CourseSignal repository
4. Click "Apply"
5. ☕ Wait 5-10 minutes while Render provisions:
   - PostgreSQL database
   - Backend API server
   - Frontend static site

---

## Step 2: Configure Secrets (5 minutes)

### 2.1 Generate Secrets

Open terminal and run:

```bash
# Generate JWT Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Copy output (128 characters)

# Generate Encryption Key
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
# Copy output (32 characters)
```

### 2.2 Add to Render

1. **Navigate to:** Dashboard → `coursesignal-backend` → Environment
2. **Add these variables:**
   - `JWT_SECRET` - Paste the 128-char secret
   - `ENCRYPTION_KEY` - Paste the 32-char key
   - `APP_URL` - Set to `https://coursesignal-frontend.onrender.com`
3. **Click "Save Changes"** (triggers automatic redeploy)
4. **Wait 2-3 minutes** for redeploy to complete

### 2.3 Update Frontend

1. **Navigate to:** Dashboard → `coursesignal-frontend` → Environment
2. **Update:**
   - `VITE_API_URL` → `https://coursesignal-backend.onrender.com/api`
3. **Click "Save Changes"**
4. **Wait 1-2 minutes** for rebuild

---

## Step 3: Run Database Migrations (2 minutes)

1. **Navigate to:** Dashboard → `coursesignal-backend`
2. **Click "Shell" tab** (opens web terminal)
3. **Run:**
   ```bash
   npm run migrate
   ```
4. **Verify:** You should see green checkmarks for 10 migrations
5. **Close shell**

---

## Step 4: Test Your Deployment (3 minutes)

### 4.1 Backend Health Check

Open browser or terminal:
```bash
curl https://coursesignal-backend.onrender.com/health
```
**Expected:** `{"status":"ok","timestamp":"2024-10-14T..."}`

### 4.2 Access Frontend

1. Open: `https://coursesignal-frontend.onrender.com`
2. You should see the CourseSignal landing page
3. Click "Sign Up"

### 4.3 Create Account

1. Enter email and password
2. Click "Sign Up"
3. Login with your new account
4. You should see an empty dashboard

✅ **Deployment successful!** Your CourseSignal instance is live.

---

## Step 5: Get Your Tracking Script (2 minutes)

1. **Navigate to:** Settings (in the app)
2. **Scroll to:** "Installation" section
3. **Copy the tracking script** - it should look like:
   ```html
   <script>
   (function() {
     var scriptId = 'your-unique-id';
     var apiUrl = 'https://coursesignal-backend.onrender.com/api/tracking/event';
     ...
   </script>
   ```

✅ This script now references your **production URLs**, not localhost.

---

## Step 6: Install on Kajabi (5 minutes)

### 6.1 Add Tracking Script

1. **Login to Kajabi** admin dashboard
2. **Navigate to:** Settings → Custom Code → Head Tracking Code
3. **Paste** the tracking script from CourseSignal
4. **Click "Save"**

### 6.2 Test Tracking

1. **Open your Kajabi site** in an incognito browser window
2. **Visit any page** (e.g., your sales page)
3. **Go back to CourseSignal dashboard**
4. **Refresh** - you should see a new visitor in ~30 seconds

✅ **Tracking is working!** Visitors to your Kajabi site are now being tracked.

---

## Step 7: Connect Kajabi Integration (10 minutes)

This allows CourseSignal to import your purchases automatically.

### 7.1 Create Kajabi OAuth App

1. **Go to:** Kajabi Partner Portal (https://partners.kajabi.com)
2. **Create new OAuth application**
3. **Set Redirect URI:**
   ```
   https://coursesignal-backend.onrender.com/api/kajabi/callback
   ```
4. **Copy** Client ID and Client Secret

### 7.2 Add to CourseSignal

1. **Go back to Render:** Dashboard → `coursesignal-backend` → Environment
2. **Add these variables:**
   - `KAJABI_CLIENT_ID` - Paste your Client ID
   - `KAJABI_CLIENT_SECRET` - Paste your Client Secret
3. **Click "Save Changes"**
4. **Wait 2 minutes** for redeploy

### 7.3 Connect Kajabi Account

1. **In CourseSignal:** Go to Settings
2. **Click "Connect Kajabi"**
3. **Authorize** on Kajabi OAuth screen
4. **You'll be redirected back** to CourseSignal
5. **CourseSignal starts syncing** your last 30 days of purchases
6. **Wait 1-2 minutes**, then refresh dashboard

✅ **Integration complete!** Your Kajabi purchases are now in CourseSignal.

---

## Step 8: View Your Attribution Data (2 minutes)

1. **Go to Dashboard**
2. **You should now see:**
   - Revenue by source (Google, Facebook, Direct, etc.)
   - Conversion rates per channel
   - Recent purchases with attribution
   - Revenue trends

🎉 **You're done!** CourseSignal is now tracking your marketing attribution.

---

## What's Next?

### Track More Traffic Sources

1. **Build UTM Links:** Settings → Build Link
2. **Add UTM parameters** for each marketing campaign:
   - Facebook ads: `?utm_source=facebook&utm_medium=cpc&utm_campaign=spring2024`
   - YouTube videos: `?utm_source=youtube&utm_medium=video&utm_campaign=launch`
   - Email: `?utm_source=email&utm_medium=newsletter&utm_campaign=weekly`
3. **Share these links** in your marketing
4. **Watch dashboard** to see which sources drive revenue

### Enable AI Recommendations (Optional)

1. **Get OpenAI API key:** https://platform.openai.com/api-keys
2. **Add to Render:** Dashboard → coursesignal-backend → Environment
   - `OPENAI_API_KEY` - Your OpenAI key
3. **Save and redeploy**
4. **Dashboard will now show** AI-powered insights

### Set Up Custom Domains (Optional)

**Backend:**
1. Dashboard → coursesignal-backend → Settings → Add Custom Domain
2. Enter: `api.yourdomain.com`
3. Add DNS CNAME: `api` → `coursesignal-backend.onrender.com`

**Frontend:**
1. Dashboard → coursesignal-frontend → Settings → Add Custom Domain
2. Enter: `app.yourdomain.com`
3. Add DNS CNAME: `app` → `coursesignal-frontend.onrender.com`

**Update environment variables** with new URLs.

---

## Troubleshooting

### "Backend health check fails"
- Wait 5 minutes for initial deployment to complete
- Check logs: Dashboard → coursesignal-backend → Logs
- Verify DATABASE_URL is set (should be automatic)

### "Tracking script returns 404"
- Check: `https://coursesignal-backend.onrender.com/track.js`
- If 404, trigger manual deploy: Dashboard → coursesignal-backend → Manual Deploy
- Check build logs for errors

### "No visitors showing up"
- Verify tracking script is in Kajabi head section
- Test in incognito mode (avoid cache)
- Check browser console for errors (F12)
- Wait 30-60 seconds for data to appear

### "Kajabi OAuth fails"
- Verify redirect URI matches exactly (no trailing slash)
- Must use HTTPS in production
- Check Client ID/Secret are correct in environment variables

---

## Cost

**Free Tier (What you just deployed):**
- ✅ Backend: 750 hours/month (enough for 24/7)
- ✅ Frontend: Unlimited
- ✅ Database: 1GB storage
- ⚠️ Backend "spins down" after 15 minutes of inactivity
- ⚠️ First request after spin-down takes 30-60 seconds

**Paid Tier ($14/month):**
- ✅ Always-on backend (no cold starts)
- ✅ 10GB database storage
- ✅ Faster performance
- ✅ Priority support

---

## Support

**Documentation:**
- Complete Guide: [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md)
- Checklist: [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
- Architecture: [CLAUDE.md](./CLAUDE.md)

**Render Support:**
- https://render.com/docs
- https://dashboard.render.com/support

---

## Summary

You now have:
✅ Live CourseSignal instance at Render-provided URLs
✅ Tracking script installed on Kajabi
✅ Kajabi purchases syncing automatically
✅ Dashboard showing revenue attribution by source

**Total setup time:** ~45 minutes

**Next:** Share UTM-tagged links in your marketing and watch which channels drive real revenue! 📈
