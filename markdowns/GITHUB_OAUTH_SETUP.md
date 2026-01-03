# How to Get GitHub OAuth Credentials

## Step 1: Create a GitHub OAuth App

1. **Go to GitHub Settings**
   - Navigate to: https://github.com/settings/developers
   - Or: Click your profile → Settings → Developer settings → OAuth Apps

2. **Click "New OAuth App"**

3. **Fill in the Application Details:**
   ```
   Application name: GitWatch (or any name you prefer)
   Homepage URL: http://localhost:3000
   Authorization callback URL: http://localhost:3000/api/auth/github/callback
   ```

4. **Click "Register application"**

5. **Copy Your Credentials:**
   - **Client ID**: Copy this (visible on the page)
   - **Client Secret**: Click "Generate a new client secret" → Copy it immediately (you won't see it again)

---

## Step 2: Generate Webhook Secret

Run this command in your terminal to generate a random secret:

```bash
openssl rand -base64 32
```

Or use this Node.js command:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output - this is your `GITHUB_WEBHOOK_SECRET`.

---

## Step 3: Add to .env.local

Create/update your `.env.local` file with:

```bash
# Telegram Bot
BOT_TOKEN=your_telegram_bot_token_from_botfather

# GitHub OAuth
GITHUB_CLIENT_ID=paste_your_client_id_here
GITHUB_CLIENT_SECRET=paste_your_client_secret_here
GITHUB_WEBHOOK_SECRET=paste_your_random_secret_here

# App URL (for local development)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Step 4: When You Deploy to Production

1. **Update OAuth App Settings:**
   - Homepage URL: `https://yourdomain.com`
   - Callback URL: `https://yourdomain.com/api/auth/github/callback`

2. **Update Environment Variable:**
   - Change `NEXT_PUBLIC_APP_URL` to your production domain

---

## ⚠️ Important Security Notes

- **Never commit** `.env.local` to git
- Keep your `GITHUB_CLIENT_SECRET` private
- Keep your `GITHUB_WEBHOOK_SECRET` private
- Use different OAuth apps for development and production
