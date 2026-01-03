# GitWatch Setup Guide

## Environment Variables

Add these to your `.env` file for proper functionality:

### Required Variables

```env
# Telegram Bot
TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
GITHUB_WEBHOOK_SECRET=your_webhook_secret

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/gitwatch

# App URL
NEXT_PUBLIC_APP_URL=https://your-app-url.com

# Cron Job Security (NEW)
CRON_SECRET=your_random_secret_string
```

### CRON_SECRET

The `CRON_SECRET` is used to authenticate requests to the polling endpoint `/api/cron/poll-repos`. This prevents unauthorized access to the cron job.

**To generate a secure secret:**
```bash
openssl rand -base64 32
```

Or in Node.js:
```javascript
require('crypto').randomBytes(32).toString('base64')
```

### Vercel Deployment

When deploying to Vercel, the cron job is automatically configured (see `vercel.json`). Make sure to:

1. Add `CRON_SECRET` to your Vercel environment variables
2. Vercel will automatically add the `authorization` header with your CRON_SECRET when calling the cron endpoint

For local testing of the cron endpoint:
```bash
curl -X GET http://localhost:3000/api/cron/poll-repos \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Features

### `/disconnect` Command

Users can now disconnect their GitHub account and remove all watched repositories:
- Clears GitHub token and username
- Deletes all watched repositories
- Removes webhooks for repos with webhook mode
- Sends confirmation message

### Public Repository Watching

GitWatch now supports watching any public repository with two modes:

#### Webhook Mode (Real-time)
- **Used for:** Repositories where you have admin or push access
- **Notifications:** Instant, webhook-driven
- **Rate limits:** None (event-driven)

#### Polling Mode
- **Used for:** Public repositories without admin access
- **Notifications:** Checked every 5 minutes
- **Rate limits:** Subject to GitHub API limits (5000 requests/hour)

When you use `/watch owner/repo`, GitWatch automatically:
1. Checks if you have admin access to the repository
2. If yes → creates webhook (real-time mode)
3. If no → enables polling mode (5-minute intervals)

### Watchlist Indicators

The `/watchlist` command now shows which mode each repository is using:
- ⚡ Real-time (webhook mode)
- 🔄 Polling (polling mode)

## Database Schema

The database has been updated with new fields:
- `watchMode` (enum: 'webhook' or 'polling')
- `lastPolled` (DateTime, tracks last polling time)

Migration was automatically applied. If you need to reapply:
```bash
npx prisma migrate dev
```
