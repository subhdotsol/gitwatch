# GitWatch Vercel Deployment Checklist

## ✅ Pre-Deployment

- [x] Code pushed to GitHub
- [x] Database setup (Neon PostgreSQL)
- [x] Telegram bot created
- [x] GitHub OAuth app created

---

## 🚀 Deploy to Vercel

### 1. Push to GitHub (if not already)
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Deploy on Vercel
- Go to [vercel.com](https://vercel.com)
- Click "Import Project"
- Select your GitHub repo
- Click "Deploy"

### 3. Add Environment Variables in Vercel

Go to: **Project → Settings → Environment Variables**

Add these (copy from your `.env` file):

```bash
# Telegram
TELEGRAM_BOT_TOKEN=8476986590:AAEcovJSgjMEdjnA3BfgFl2aqK8iSxnsaNw

# GitHub OAuth
GITHUB_CLIENT_ID=Ov23lieOfEPRbvEE3vDH
GITHUB_CLIENT_SECRET=your_secret_here
GITHUB_WEBHOOK_SECRET=6JGAf5iRUb9azQ/MUs/yViOL8hub5tU76FmkuhrFs5I=

# Database
DATABASE_URL=postgresql://neondb_owner:npg_DHSUutF6RJL4@ep-plain-bonus-afieo483-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require

# App URL (IMPORTANT - update after first deploy!)
NEXT_PUBLIC_APP_URL=https://your-project-name.vercel.app
```

⚠️ **After first deployment**, update `NEXT_PUBLIC_APP_URL` with your actual Vercel URL!

---

## 🔧 Post-Deployment Setup

### 4. Set Telegram Webhook

**After deployment**, run this command (replace YOUR_VERCEL_URL):

```bash
curl -X POST "https://api.telegram.org/bot8476986590:AAEcovJSgjMEdjnA3BfgFl2aqK8iSxnsaNw/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://YOUR_VERCEL_URL/api/telegram/webhook"}'
```

**Expected response:**
```json
{"ok":true,"result":true,"description":"Webhook was set"}
```

### 5. Update GitHub OAuth App

Go to: https://github.com/settings/developers

Update your OAuth app:
- **Homepage URL**: `https://your-project.vercel.app`
- **Callback URL**: `https://your-project.vercel.app/api/auth/github/callback`

### 6. Redeploy (to use updated NEXT_PUBLIC_APP_URL)

In Vercel dashboard:
- Go to **Deployments**
- Click "..." on latest deployment
- Click "Redeploy"

---

## ✅ Test in Production

1. Open Telegram → Find your bot
2. Send `/start`
3. Click the **inline button** (now it works with HTTPS!)
4. Complete GitHub OAuth
5. Try `/watch facebook/react`
6. Try `/watchlist`

---

## 🐛 Troubleshooting

**Bot doesn't respond:**
- Check Vercel logs for errors
- Verify webhook is set: `curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo`
- Check all environment variables are set in Vercel

**Database errors:**
- Ensure `DATABASE_URL` is correct in Vercel
- Check Neon database is accessible

**OAuth fails:**
- Verify GitHub OAuth callback URL matches Vercel URL
- Check `GITHUB_CLIENT_SECRET` is set correctly
