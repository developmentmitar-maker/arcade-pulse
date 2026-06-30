# Vercel Hobby Plan Setup Guide

## The Problem
Vercel Hobby plan has a **10-second timeout** for serverless functions. Playwright scraping takes 20-40 seconds, which exceeds this limit.

## The Solution: GitHub Actions + Vercel Hybrid

Instead of running Playwright on Vercel, we run it in **GitHub Actions** (which has generous timeouts) and use Vercel only for:
- The web app (dashboard, login, etc.)
- API endpoints for notifications and status

## Architecture

```
┌─────────────────────┐
│  GitHub Actions     │
│  (Every 5 minutes)  │
│                     │
│  1. Run Playwright  │
│  2. Scrape websites │
│  3. Detect changes  │
│  4. Save to MongoDB │
│  5. Notify Vercel   │──────┐
└─────────────────────┘      │
                              │
                              ▼
                    ┌─────────────────────┐
                    │  Vercel (Hobby)     │
                    │                     │
                    │  /api/trigger       │◄──── Receives notifications
                    │  (sends emails)     │
                    │                     │
                    │  Dashboard          │
                    │  (React UI)         │
                    └─────────────────────┘
```

## Files Changed

### 1. `.github/workflows/cron.yml` ✅
- Now runs the scraper directly in GitHub Actions
- Installs Playwright browsers
- Calls `scripts/scrape-and-notify.js`

### 2. `scripts/scrape-and-notify.js` ✨ NEW
- Standalone Node.js script
- Runs Playwright scraping
- Saves snapshots to MongoDB
- Calls `/api/trigger` when changes detected

### 3. `package.json` ✅
- Added `playwright` (full package with browsers)
- Kept `playwright-core` for compatibility

### 4. `vercel.json` ✅
- Removed Playwright configuration
- Simplified to just `/api/trigger`

## Setup Instructions

### Step 1: Update GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:
```
MONGODB_URI=mongodb+srv://...
CRON_SECRET=your_secret_key
APP_URL=https://your-app.vercel.app
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASS=your_smtp_key
EMAIL_FROM=Arcade Pulse <noreply@yourdomain.com>
```

### Step 2: Install Dependencies Locally

```bash
npm install
```

This adds the full `playwright` package needed for GitHub Actions.

### Step 3: Deploy to Vercel

```bash
git add .
git commit -m "Move scraping to GitHub Actions for Hobby plan"
git push
```

Vercel will auto-deploy. The app will work without Playwright now.

### Step 4: Test GitHub Action

Go to your GitHub repository → Actions → Website Monitor → Run workflow

Click "Run workflow" to manually trigger it and verify it works.

### Step 5: Verify Logs

**GitHub Actions logs:**
- Go to Actions tab
- Click on the running workflow
- Check "Run scraper and notify" step
- Should see: `[scraper] ✓ arcade-portal scraped successfully`

**Vercel logs:**
- Go to Vercel dashboard → Your project → Functions
- Check `/api/trigger` logs
- Should see notification emails being sent

## API Endpoints

### `/api/cron` (OLD - can be removed)
- Previously ran Playwright on Vercel
- No longer needed

### `/api/trigger` (NEW)
- Receives webhook from GitHub Actions
- Sends notification emails
- Broadcasts SSE updates
- **Requires `Authorization: Bearer YOUR_CRON_SECRET`**

## Cost Analysis

| Service | Plan | Cost | What It Does |
|---------|------|------|--------------|
| Vercel | Hobby | Free | Hosts web app + API |
| GitHub Actions | Free | Free | Runs scraper (2,000 min/month free) |
| MongoDB Atlas | Free | Free | Stores snapshots |
| Brevo SMTP | Free | Free | Sends emails (300/day free) |

**Total: $0/month** ✅

## Troubleshooting

### GitHub Action fails with Playwright error
**Solution**: Ensure `npx playwright install --with-deps chromium` step runs successfully

### No emails received
**Solution**: Check `/api/trigger` logs in Vercel dashboard

### MongoDB connection error
**Solution**: Verify `MONGODB_URI` secret is set correctly in GitHub

### "Unauthorized" error
**Solution**: Verify `CRON_SECRET` matches in both GitHub and Vercel

## Monitoring

### GitHub Actions
- Go to: https://github.com/YOUR_USERNAME/YOUR_REPO/actions
- View run history and logs

### Vercel Function Logs
- Go to: https://vercel.com/YOUR_USERNAME/YOUR_PROJECT/functions
- Real-time logs for API calls

### MongoDB
- Go to: https://cloud.mongodb.com
- View collections: `snapshots`, `users`, `websites`

## Reverting (If You Upgrade to Pro)

If you upgrade to Vercel Pro later, you can revert to running everything on Vercel:

1. Restore original `.github/workflows/cron.yml` (simple curl call)
2. Re-enable `/api/cron` route in `vercel.json`
3. Set `maxDuration: 60` in vercel.json
4. Remove `scripts/scrape-and-notify.js`

## Need Help?

Check logs in this order:
1. GitHub Actions logs (for scraping issues)
2. Vercel function logs (for notification issues)
3. MongoDB logs (for database issues)
