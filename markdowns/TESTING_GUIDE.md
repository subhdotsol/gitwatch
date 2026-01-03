# GitWatch Testing Guide

## Prerequisites Checklist

Before testing, ensure you have:

- [x] `GITHUB_CLIENT_ID` in `.env.local`
- [x] `GITHUB_CLIENT_SECRET` in `.env.local`
- [x] `GITHUB_WEBHOOK_SECRET` in `.env.local`
- [x] `BOT_TOKEN` in `.env.local` (from BotFather)
- [x] `NEXT_PUBLIC_APP_URL=http://localhost:3000` in `.env.local`

---

## Step 1: Start the Next.js Server

```bash
npm run dev
```

Wait for: `✓ Ready in XXXms`

---

## Step 2: Start the Telegram Bot

Open a **new terminal window** and run:

```bash
node -r esbuild-register lib/telegram/bot.ts
```

Or if you have `tsx` installed:

```bash
npx tsx lib/telegram/bot.ts
```

Wait for the bot to start. You should see no errors.

---

## Step 3: Test the `/start` Command

1. **Open Telegram** and find your bot
2. **Send**: `/start`
3. **Expected Response**:
   ```
   👋 Welcome to GitWatch, [YourName]!

   To get started, connect your GitHub account:

   🔗 Authorize GitHub

   Once connected, you can:
   • Add repositories to watch
   • Get real-time notifications
   • Manage issues directly from Telegram
   ```

---

## Step 4: Test GitHub OAuth

1. **Click** the "Authorize GitHub" link in Telegram
2. **Browser opens** → You're redirected to GitHub
3. **Authorize** the application
4. **Redirected back** to `http://localhost:3000/auth/success`
5. **Check Telegram** for confirmation message:
   ```
   ✅ Successfully connected to GitHub!

   Account: your-github-username

   You can now add repositories to watch using:
   /watch owner/repo
   ```

---

## Step 5: Test the `/watch` Command

1. **In Telegram**, send:
   ```
   /watch facebook/react
   ```
   
2. **Expected Response**:
   ```
   ✅ Now watching facebook/react!

   ⭐️ Stars: 230000
   📝 Description: The library for web and native user interfaces

   You'll receive notifications for:
   • Issues
   • Pull Requests
   • Pushes
   • Comments
   ```

3. **Verify webhook created**:
   - Go to: `https://github.com/facebook/react/settings/hooks`
   - You should see a webhook pointing to your URL

---

## Step 6: Test with Your Own Repo

1. **Use a repo you own** (to have admin access):
   ```
   /watch your-username/your-repo
   ```

2. **Create a test issue** on GitHub
3. **Expected**: You should receive a notification in Telegram (once webhook handler is implemented)

---

## Troubleshooting

### Bot doesn't start
- Check `BOT_TOKEN` is correct in `.env.local`
- Verify token with: `curl https://api.telegram.org/bot<YOUR_TOKEN>/getMe`

### OAuth fails
- Verify `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`
- Check callback URL matches: `http://localhost:3000/api/auth/github/callback`

### `/watch` fails
- Ensure you completed OAuth flow
- Check GitHub token is stored (add console.log in bot.ts)
- Verify you have admin access to the repo

### Webhook creation fails
- Need admin/owner permissions on the repo
- Try with a personal repo first

---

## Next Steps

Once basic testing works:
1. Implement webhook receiver (`/api/webhooks/github/route.ts`)
2. Add database for persistent storage
3. Test receiving actual GitHub events
