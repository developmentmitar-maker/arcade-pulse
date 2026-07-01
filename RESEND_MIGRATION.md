# Resend Migration Guide

## ✅ Code Changes Complete!

All code has been migrated from Nodemailer (Brevo SMTP) to Resend. Here's what was changed:

### Files Modified:
- ✅ `package.json` - Removed nodemailer, kept resend
- ✅ `src/lib/notifier.ts` - Complete rewrite using Resend API
- ✅ `.env.example` - Updated with Resend variables
- ✅ `.github/workflows/cron.yml` - Updated environment variables

---

## 🚀 Setup Steps

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Create Resend Account
1. Go to https://resend.com
2. Sign up for a free account
3. Verify your email

### Step 3: Get API Key
1. Go to **API Keys** in Resend dashboard
2. Click **Create API Key**
3. Copy the key (starts with `re_`)

Example: `re_123abc456def789ghi012jkl345mno678`

### Step 4: Update Local Environment (`.env.local`)

**Delete these old SMTP variables:**
```bash
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
```

**Add these new Resend variables:**
```bash
RESEND_API_KEY=re_your_actual_api_key_here
EMAIL_FROM=Arcade Pulse <onboarding@resend.dev>
```

### Step 5: Verify Email Recipients (Important!)

Since you're using `onboarding@resend.dev` (Resend's test domain), you **must verify** the recipient email addresses:

1. Go to Resend dashboard → **Audience**
2. Add and verify these emails:
   - `himatcreates@gmail.com`
   - `aakshatmittal609@gmail.com`
   - Any other subscriber emails

**Note:** With `onboarding@resend.dev`, you can only send to verified emails. To send to anyone, you need to:
- Verify your own domain (e.g., `arcadepulse.app`)
- Update `EMAIL_FROM` to use your domain

---

## 🔧 GitHub Actions Setup

Update your GitHub repository secrets:

### Delete Old Secrets:
1. Go to GitHub repo → Settings → Secrets and variables → Actions
2. Delete these:
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_USER`
   - `SMTP_PASS`

### Add New Secrets:
1. Click **New repository secret**
2. Add these:
   - Name: `RESEND_API_KEY`
     Value: `re_your_api_key`
   - Name: `EMAIL_FROM`
     Value: `Arcade Pulse <onboarding@resend.dev>`

### Existing Secrets (Keep These):
- ✅ `MONGODB_URI`
- ✅ `CRON_SECRET`
- ✅ `APP_URL`

---

## 🌐 Vercel Environment Variables

Update your Vercel project settings:

1. Go to Vercel dashboard → Your Project → Settings → Environment Variables

### Delete Old Variables:
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`

### Add New Variables:
| Key | Value | Environment |
|-----|-------|-------------|
| `RESEND_API_KEY` | `re_your_api_key` | Production, Preview, Development |
| `EMAIL_FROM` | `Arcade Pulse <onboarding@resend.dev>` | Production, Preview, Development |

### Keep Existing:
- ✅ `MONGODB_URI`
- ✅ `JWT_SECRET`
- ✅ `CRON_SECRET`
- ✅ `NEXT_PUBLIC_APP_URL`

---

## 📧 Using Your Own Domain (Optional)

To send emails from your own domain instead of `onboarding@resend.dev`:

### 1. Add Domain in Resend
1. Go to Resend dashboard → **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `arcadepulse.app`)

### 2. Verify Domain
1. Add the DNS records provided by Resend to your domain registrar
2. Wait for verification (usually 5-30 minutes)

### 3. Update Environment Variables
```bash
EMAIL_FROM=Arcade Pulse <noreply@arcadepulse.app>
```

**Benefits:**
- ✅ Send to any email address (no verification needed)
- ✅ Better deliverability
- ✅ Professional sender address
- ✅ Higher sending limits

---

## 🧪 Testing

### Test Locally:
```bash
# Make sure .env.local has RESEND_API_KEY
npm run dev

# Trigger a manual scrape (if you have the endpoint)
curl -X POST http://localhost:3000/api/trigger \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Test GitHub Actions:
1. Go to GitHub repo → **Actions** tab
2. Select **Website Monitor** workflow
3. Click **Run workflow**
4. Check logs for email sending

### Test on Vercel:
1. Deploy to Vercel
2. Check deployment logs
3. Trigger the `/api/notify` endpoint manually

---

## 📊 Resend Free Tier Limits

| Feature | Free Tier |
|---------|-----------|
| Emails per month | 3,000 |
| Emails per day | 100 |
| API requests | Unlimited |
| Recipients | Unlimited (with verified domain) |
| Team members | 1 |

**For this project:**
- Scraping every 5 minutes = 288 checks/day
- If changes occur every time = 288 emails/day × subscribers
- With 2 subscribers = 576 emails/day (need paid plan)
- Realistically, changes occur rarely, so free tier is plenty

---

## 🔍 Troubleshooting

### Error: "API key is invalid"
**Fix:** Double-check your `RESEND_API_KEY` starts with `re_`

### Error: "Email not verified"
**Fix:** Using `onboarding@resend.dev`? Verify recipient emails in Resend dashboard

### Error: "Daily sending limit exceeded"
**Fix:** Upgrade to paid plan or reduce scraping frequency

### Emails not sending
**Check:**
1. Resend API key is correct
2. `EMAIL_FROM` matches Resend configuration
3. Recipient emails are verified (if using `onboarding@resend.dev`)
4. Check Resend dashboard → Logs for errors

---

## ✅ Migration Checklist

- [ ] Install dependencies (`npm install`)
- [ ] Update `.env.local` with Resend credentials
- [ ] Get Resend API key from dashboard
- [ ] Verify recipient emails in Resend (if using test domain)
- [ ] Update GitHub Actions secrets
- [ ] Update Vercel environment variables
- [ ] Deploy to Vercel
- [ ] Test email sending
- [ ] Monitor Resend dashboard for delivery

---

## 🎉 Done!

Your email system is now using Resend instead of Nodemailer. Everything else remains the same:

- ✅ GitHub Actions scraping
- ✅ Playwright automation
- ✅ MongoDB storage
- ✅ Change detection
- ✅ Dashboard & SSE
- ✅ All API endpoints

Only the email delivery method changed - simpler, more reliable, and easier to monitor!
