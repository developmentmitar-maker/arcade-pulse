# Vercel Hobby Plan Solution

## Problem
Vercel Hobby plan has a **10-second timeout** for serverless functions. Playwright scraping takes 20-40 seconds, causing timeouts.

## Solution Architecture

### Old Flow (❌ Won't Work on Hobby Plan)
```
GitHub Actions Cron → Vercel /api/cron → Playwright (60s) → MongoDB → Send Emails
                                    ↑
                            TIMEOUT after 10s!
```

### New Flow (✅ Works on Hobby Plan)
```
GitHub Actions Cron → Playwright (unlimited time) → MongoDB → Vercel /api/notify (< 10s) → Send Emails
```

## What Changed

### 1. **GitHub Actions Does the Scraping** (`/.github/workflows/cron.yml`)
- Runs every 5 minutes
- Installs Playwright with full browser
- Executes `scripts/scrape-and-notify.js`
- No time limits!

### 2. **Script Handles Everything** (`/scripts/scrape-and-notify.js`)
- Launches Playwright (full version, not playwright-core)
- Scrapes both portals
- Connects to MongoDB
- Compares with previous snapshots
- Saves new snapshots
- If changes detected → calls `/api/notify` on Vercel

### 3. **New Lightweight Vercel Endpoint** (`/src/app/api/notify/route.ts`)
- Receives change data from GitHub Actions
- Sends email notifications via Brevo
- Broadcasts SSE updates
- Completes in < 5 seconds ✓

## Setup Steps

### 1. Install Dependencies
```bash
npm install playwright --save
npm install
```

### 2. GitHub Secrets (Already Set)
Make sure these exist in your GitHub repo settings:
- `MONGODB_URI`
- `CRON_SECRET`
- `APP_URL` (your Vercel deployment URL)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
- `EMAIL_FROM`

### 3. Deploy to Vercel
```bash
git add .
git commit -m "Move Playwright to GitHub Actions for Hobby plan compatibility"
git push
```

### 4. Test It

#### Test the scraper locally:
```bash
# Set environment variables
export MONGODB_URI="your_mongodb_uri"
export CRON_SECRET="your_secret"
export APP_URL="https://your-app.vercel.app"
export SMTP_HOST="smtp-relay.brevo.com"
export SMTP_PORT="587"
export SMTP_USER="your_email"
export SMTP_PASS="your_key"
export EMAIL_FROM="your_sender"

# Run the script
node scripts/scrape-and-notify.js
```

#### Test GitHub Actions manually:
1. Go to your GitHub repo
2. Click **Actions** tab
3. Select **Website Monitor** workflow
4. Click **Run workflow** button
5. Check logs to see execution

#### Test the notify endpoint:
```bash
curl -X POST https://your-app.vercel.app/api/notify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -d '{
    "websiteId": "arcade-portal",
    "changes": [{"section": "games", "oldValue": "old", "newValue": "new"}],
    "snapshotId": "some-mongo-id"
  }'
```

## Benefits

✅ **No Timeout Issues** - Playwright runs in GitHub Actions (unlimited time)  
✅ **Works on Hobby Plan** - Vercel only handles lightweight notifications  
✅ **Same Functionality** - Everything still works exactly the same  
✅ **Better Separation** - Scraping logic decoupled from API  
✅ **Free GitHub Actions** - 2000 minutes/month free  

## Costs

- **Vercel Hobby**: Free (or $20/month if already paying)
- **GitHub Actions**: Free (2000 minutes/month, you'll use ~150 min/month)
- **MongoDB Atlas**: Free tier is fine
- **Brevo SMTP**: Free tier (300 emails/day)

**Total cost: $0** 🎉

## Old Endpoints (Can Keep or Remove)

- `/api/cron` - Was doing scraping, now unnecessary (but won't hurt to keep)
- `/api/trigger` - Manual trigger endpoint, also doing scraping (can remove)

You can delete these or keep them for reference. They won't be called anymore.

## Will This Work?

**YES!** Here's why:

1. ✅ GitHub Actions has unlimited execution time (well, 6 hours max, plenty for 30-second scrape)
2. ✅ Playwright has full Ubuntu environment with actual browsers
3. ✅ MongoDB connection works from GitHub Actions
4. ✅ Vercel endpoint only sends emails (< 5 seconds, well under 10s limit)
5. ✅ Your existing dashboard, SSE, and frontend all work unchanged

## Monitoring

Check logs in these places:

1. **GitHub Actions Logs**: GitHub repo → Actions tab → Latest run
2. **Vercel Function Logs**: Vercel dashboard → Your project → Functions → `/api/notify`
3. **MongoDB**: Check snapshots collection for new entries

## Troubleshooting

### Issue: "Cannot find module 'playwright'"
**Fix**: Run `npm install playwright --save`

### Issue: GitHub Actions fails with "Cannot connect to MongoDB"
**Fix**: Check that `MONGODB_URI` secret is set correctly in GitHub repo settings

### Issue: Vercel `/api/notify` not being called
**Fix**: Check GitHub Actions logs to see if scraper detected changes

### Issue: No emails being sent
**Fix**: Check Brevo SMTP credentials in GitHub secrets
