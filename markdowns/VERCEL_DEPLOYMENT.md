# Vercel Deployment Guide for GitWatch

## 🚀 Deploy to Vercel

### Step 1: Prepare for Deployment

1. **Push your code to GitHub** (if not already):
   ```bash
   git add .
   git commit -m "Add Telegram webhook support"
   git push origin main
   ```

### Step 2: Deploy to Vercel

1. **Go to** [vercel.com](https://vercel.com)
2. **Click** "New Project"
3. **Import** your GitHub repository
4. **Configure** the project:
   - Framework Preset: Next.js
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`

5. **Add Environment Variables** (in Vercel dashboard):
   ```
   TELEGRAM_BOT_TOKEN=your_bot_token
   GITHUB_CLIENT_ID=your_client_id
   GITHUB_CLIENT_SECRET=your_client_secret
   GITHUB_WEBHOOK_SECRET=your_webhook_secret
   NEXT_PUBLIC_APP_URL=https://yourapp.vercel.app
   ```

6. **Click** "Deploy"

---

### Step 3: Setup Telegram Webhook

After deployment, you need to tell Telegram to send updates to your Vercel URL instead of polling.

**Run this command** (replace `YOUR_BOT_TOKEN` and `YOUR_VERCEL_URL`):

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://<YOUR_VERCEL_URL>/api/telegram/webhook"}'
```

**Example:**
```bash
curl -X POST "https://api.telegram.org/bot8476986590:AAEcovJSgjMEdjnA3BfgFl2aqK8iSxnsaNw/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://gitwatch.vercel.app/api/telegram/webhook"}'
```

**Expected response:**
```json
{"ok":true,"result":true,"description":"Webhook was set"}
```

---

### Step 4: Verify Webhook

Check if webhook is set correctly:

```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

You should see your Vercel URL in the response.

---

### Step 5: Update GitHub OAuth App

1. **Go to** GitHub OAuth App settings
2. **Update URLs**:
   - Homepage URL: `https://yourapp.vercel.app`
   - Authorization callback URL: `https://yourapp.vercel.app/api/auth/github/callback`

---

## 🧪 Testing in Production

1. **Open Telegram** and find your bot
2. **Send** `/start` - Should work immediately!
3. **Click** the GitHub authorization link
4. **Complete** OAuth flow
5. **Send** `/watch owner/repo`

---

## 🔄 Local Development vs Production

### Local Development (Polling)
```bash
# Terminal 1: Next.js
npm run dev

# Terminal 2: Telegram Bot (Polling)
npx tsx lib/telegram/bot.ts
```

### Production (Webhooks)
- No separate bot process needed
- Telegram sends updates directly to `/api/telegram/webhook`
- Everything runs serverless on Vercel

---

## ⚠️ Important Notes

1. **Webhook URL must be HTTPS** - Vercel provides this automatically
2. **Only ONE webhook OR polling** at a time - If you're testing locally with polling, remove the webhook first:
   ```bash
   curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/deleteWebhook"
   ```

3. **To switch back to polling** for local development:
   - Delete the webhook (command above)
   - Run `npx tsx lib/telegram/bot.ts`

---

## 🐛 Troubleshooting

### Bot doesn't respond in production
- Check Vercel logs for errors
- Verify webhook is set: `curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo`
- Check environment variables are set in Vercel dashboard

### Getting 401 errors
- Verify `TELEGRAM_BOT_TOKEN` is set in Vercel environment variables
- Make sure there are no extra spaces in the token

### Webhook setup fails
- Ensure your Vercel deployment is complete and accessible
- Try accessing `https://yourapp.vercel.app/api/telegram/webhook` - should return 405 (Method Not Allowed) for GET requests
