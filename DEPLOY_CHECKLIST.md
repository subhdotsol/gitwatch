# Quick Vercel Deploy Checklist

## ✅ Before Deploying

- [ ] Code is on GitHub
- [ ] All environment variables are ready
- [ ] Tested locally

## 📝 Steps

### 1. Deploy to Vercel
```bash
# Option 1: Use Vercel CLI
npm i -g vercel
vercel

# Option 2: Use Vercel Dashboard
# Go to vercel.com → Import Project → Select repo
```

### 2. Add Environment Variables in Vercel Dashboard

Go to: **Project Settings → Environment Variables**

Add these:
```
TELEGRAM_BOT_TOKEN=8476986590:AAEcovJSgjMEdjnA3BfgFl2aqK8iSxnsaNw
GITHUB_CLIENT_ID=Ov23lieOfEPRbvEE3vDH
GITHUB_CLIENT_SECRET=your_secret_here
GITHUB_WEBHOOK_SECRET=6JGAf5iRUb9azQ/MUs/yViOL8hub5tU76FmkuhrFs5I=
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
```

### 3. Setup Telegram Webhook

**After deployment**, run this (replace YOUR_VERCEL_URL):

```bash
curl -X POST "https://api.telegram.org/bot8476986590:AAEcovJSgjMEdjnA3BfgFl2aqK8iSxnsaNw/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://YOUR_VERCEL_URL/api/telegram/webhook"}'
```

### 4. Update GitHub OAuth App

Go to: https://github.com/settings/developers

Update:
- Homepage URL: `https://your-project.vercel.app`
- Callback URL: `https://your-project.vercel.app/api/auth/github/callback`

### 5. Test!

Send `/start` to your bot on Telegram 🚀

---

## 🔄 Switch Between Local & Production

**For Local Development:**
```bash
# Delete webhook
curl -X POST "https://api.telegram.org/bot8476986590:AAEcovJSgjMEdjnA3BfgFl2aqK8iSxnsaNw/deleteWebhook"

# Run bot locally
npx tsx lib/telegram/bot.ts
```

**For Production:**
- Just set the webhook (step 3 above)
- Vercel handles everything automatically
