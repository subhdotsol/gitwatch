# GitWatch - Complete Project Guide

> **Your GitHub Command Center in Telegram**  
> A comprehensive guide to understanding, setting up, and developing GitWatch

---

## 📚 Table of Contents

1. [Project Overview](#-project-overview)
2. [Architecture](#-architecture)
3. [Tech Stack](#-tech-stack)
4. [Project Structure](#-project-structure)
5. [Setup Guide](#-setup-guide)
6. [Database Schema](#-database-schema)
7. [Key Features](#-key-features)
8. [API Routes](#-api-routes)
9. [Bot Commands](#-bot-commands)
10. [Development Workflow](#-development-workflow)
11. [Deployment](#-deployment)
12. [Testing](#-testing)
13. [Troubleshooting](#-troubleshooting)

---

## 🎯 Project Overview

**GitWatch** is an intelligent Telegram bot that bridges GitHub and Telegram, enabling developers to monitor repositories, receive real-time notifications, and manage issues directly from their chat interface.

### What Problem Does It Solve?

- **Context Switching**: Eliminates the need to constantly check GitHub for updates
- **Notification Overload**: Smart filtering ensures you only see what matters
- **Mobile Workflow**: Manage repositories from anywhere using Telegram
- **Team Collaboration**: Bind repositories to group chats for team-wide coordination

### Core Value Proposition

GitWatch transforms GitHub notifications from passive email alerts into actionable, real-time Telegram messages with inline actions, allowing developers to stay productive without leaving their chat application.

---

## 🏗️ Architecture

GitWatch uses a **hybrid notification system** combining webhooks and polling:

```mermaid
graph TB
    A[Telegram User] -->|Commands| B[Telegram Bot]
    B -->|OAuth Flow| C[GitHub OAuth]
    C -->|Access Token| D[User Database]
    
    E[GitHub Repository] -->|Webhook Events| F[Webhook Handler]
    F -->|Process Event| G[Notification Service]
    
    H[Cron Job] -->|Every 5 min| I[Polling Service]
    I -->|Fetch Updates| E
    I -->|Process Updates| G
    
    G -->|Send Message| B
    B -->|Deliver| A
    
    D -->|User Data| B
    D -->|Watch List| I
```

### Key Components

1. **Next.js Application**: Web server hosting API routes and OAuth flow
2. **Telegram Bot**: Handles user commands and sends notifications
3. **GitHub Integration**: OAuth authentication and API interactions
4. **Database (PostgreSQL)**: Stores users, watched repositories, and preferences
5. **Webhook Handler**: Processes real-time GitHub events
6. **Polling Service**: Checks repositories without webhook access

### Notification Modes

#### 🔴 Webhook Mode (Real-time)
- **When**: User has admin/push access to repository
- **How**: GitHub sends webhook events to `/api/webhooks/github`
- **Latency**: Instant (< 1 second)
- **Rate Limits**: None (event-driven)

#### 🟡 Polling Mode
- **When**: Watching public repositories without admin access
- **How**: Cron job checks repositories every 5 minutes
- **Latency**: Up to 5 minutes
- **Rate Limits**: GitHub API (5000 requests/hour)

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **UI Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)

### Backend
- **Bot Framework**: [Telegraf](https://telegraf.js.org/)
- **Database ORM**: [Prisma](https://www.prisma.io/)
- **Database**: PostgreSQL (Neon/Supabase)
- **HTTP Client**: Native `fetch` API

### Infrastructure
- **Hosting**: [Vercel](https://vercel.com/)
- **Database**: [Neon PostgreSQL](https://neon.tech/)
- **Cron Jobs**: Vercel Cron
- **Environment**: Node.js 20+

---

## 📁 Project Structure

```
gitwatch/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   │   ├── auth/          # GitHub OAuth
│   │   │   │   └── github/
│   │   │   │       └── route.ts
│   │   │   ├── cron/          # Scheduled jobs
│   │   │   │   └── poll-repos/
│   │   │   │       └── route.ts
│   │   │   ├── telegram/      # Telegram webhook
│   │   │   │   └── webhook/
│   │   │   │       └── route.ts
│   │   │   └── webhooks/      # GitHub webhooks
│   │   │       └── github/
│   │   │           └── route.ts
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Landing page
│   ├── components/            # React components
│   ├── hooks/                 # Custom React hooks
│   └── lib/                   # Utility functions
│
├── lib/                       # Server-side libraries
│   ├── prisma.ts             # Prisma client
│   └── telegram/             # Telegram bot
│       ├── bot.ts            # Bot initialization
│       └── commands/         # Bot commands
│           ├── disconnect.ts
│           ├── help.ts
│           ├── unwatch.ts
│           ├── watch.ts
│           └── watchlist.ts
│
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── migrations/           # Database migrations
│
├── markdowns/                # Documentation
│   ├── DEPLOYMENT.md
│   ├── GITHUB_OAUTH_SETUP.md
│   ├── POLLING_VS_WEBHOOKS.md
│   ├── TESTING_GUIDE.md
│   └── VERCEL_DEPLOYMENT.md
│
├── public/                   # Static assets
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript config
├── tailwind.config.ts       # Tailwind config
├── next.config.ts           # Next.js config
├── vercel.json              # Vercel deployment config
└── README.md                # Project README
```

---

## 🚀 Setup Guide

### Prerequisites

Before you begin, ensure you have:

- **Node.js 20+** installed
- **npm**, **yarn**, or **pnpm** package manager
- A **Telegram account**
- A **GitHub account**
- **PostgreSQL database** (local or cloud)

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/gitwatch.git
cd gitwatch
```

### Step 2: Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### Step 3: Create a Telegram Bot

1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Send `/newbot` command
3. Follow the prompts to create your bot
4. Copy the **Bot Token** (e.g., `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)

### Step 4: Set Up GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **"New OAuth App"**
3. Fill in the details:
   - **Application name**: GitWatch (or your preferred name)
   - **Homepage URL**: `http://localhost:3000` (for development)
   - **Authorization callback URL**: `http://localhost:3000/api/auth/github/callback`
4. Click **"Register application"**
5. Copy the **Client ID** and generate a **Client Secret**

For detailed instructions, see [GITHUB_OAUTH_SETUP.md](markdowns/GITHUB_OAUTH_SETUP.md)

### Step 5: Set Up Database

#### Option A: Local PostgreSQL

```bash
# Install PostgreSQL (macOS)
brew install postgresql@16
brew services start postgresql@16

# Create database
createdb gitwatch
```

Your `DATABASE_URL` will be:
```
postgresql://localhost:5432/gitwatch
```

#### Option B: Neon (Cloud PostgreSQL)

1. Go to [neon.tech](https://neon.tech/)
2. Create a free account
3. Create a new project
4. Copy the connection string

### Step 6: Configure Environment Variables

Create a `.env` file in the project root:

```env
# Telegram Bot
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_WEBHOOK_SECRET=your_random_webhook_secret

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/gitwatch

# App URL (for OAuth callback)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Cron Job Security (generate with: openssl rand -base64 32)
CRON_SECRET=your_random_cron_secret
```

#### Generate Secrets

```bash
# Generate GITHUB_WEBHOOK_SECRET
openssl rand -base64 32

# Generate CRON_SECRET
openssl rand -base64 32
```

### Step 7: Initialize Database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) Open Prisma Studio to view database
npx prisma studio
```

### Step 8: Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Step 9: Set Telegram Webhook (Development)

For local development, you'll need to expose your local server using a tunnel service like [ngrok](https://ngrok.com/):

```bash
# Install ngrok
brew install ngrok

# Start tunnel
ngrok http 3000
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`) and set the webhook:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://abc123.ngrok.io/api/telegram/webhook"}'
```

**Expected response:**
```json
{"ok":true,"result":true,"description":"Webhook was set"}
```

### Step 10: Test the Bot

1. Open Telegram and find your bot
2. Send `/start` command
3. Click the OAuth button to connect GitHub
4. Try watching a repository: `/watch facebook/react`
5. Check your watchlist: `/watchlist`

---

## 🗄️ Database Schema

GitWatch uses PostgreSQL with Prisma ORM. The schema consists of two main models:

### User Model

Stores Telegram users and their GitHub authentication:

```prisma
model User {
  id               String   @id @default(cuid())
  telegramId       BigInt   @unique
  telegramUsername String?
  githubToken      String?
  githubUsername   String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  watchedRepos WatchedRepo[]
}
```

**Fields:**
- `id`: Unique identifier (CUID)
- `telegramId`: Telegram user ID (unique)
- `telegramUsername`: Telegram username (optional)
- `githubToken`: GitHub OAuth access token (encrypted)
- `githubUsername`: GitHub username
- `createdAt`: Account creation timestamp
- `updatedAt`: Last update timestamp

### WatchedRepo Model

Stores repositories being watched by users:

```prisma
model WatchedRepo {
  id             String    @id @default(cuid())
  userId         String
  owner          String
  repo           String
  webhookId      BigInt?
  watchMode      WatchMode @default(webhook)
  lastPolled     DateTime?
  active         Boolean   @default(true)
  notifyIssues   Boolean   @default(true)
  notifyPRs      Boolean   @default(true)
  notifyCommits  Boolean   @default(true)
  notifyComments Boolean   @default(true)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, owner, repo])
}

enum WatchMode {
  webhook
  polling
}
```

**Fields:**
- `id`: Unique identifier
- `userId`: Reference to User
- `owner`: Repository owner (e.g., "facebook")
- `repo`: Repository name (e.g., "react")
- `webhookId`: GitHub webhook ID (if webhook mode)
- `watchMode`: `webhook` or `polling`
- `lastPolled`: Last polling timestamp
- `active`: Whether watch is active
- `notifyIssues`: Enable issue notifications
- `notifyPRs`: Enable PR notifications
- `notifyCommits`: Enable commit notifications
- `notifyComments`: Enable comment notifications

---

## ✨ Key Features

### Implemented Features ✅

1. **GitHub OAuth Authentication**
   - Per-user authentication
   - Secure token storage
   - Easy disconnect/reconnect

2. **Repository Watching**
   - Watch any public repository
   - Automatic webhook creation (if admin access)
   - Fallback to polling mode
   - Multiple repositories per user

3. **Real-time Notifications**
   - New issues
   - Pull requests
   - Commits (pushes)
   - Comments on issues/PRs
   - Issue state changes (closed/merged)

4. **Notification Preferences**
   - Toggle issues, PRs, commits, comments
   - Per-repository settings

5. **Hybrid Notification System**
   - Webhook mode for owned repos (instant)
   - Polling mode for external repos (5-minute intervals)

### Planned Features ⏳

See the [README.md](README.md) for the complete roadmap including:
- Role-based filtering
- Two-way interaction (comment, assign, label from Telegram)
- Team mode (group chat integration)
- AI-powered features
- Analytics and insights

---

## 🔌 API Routes

### Authentication

#### `GET/POST /api/auth/github`
Handles GitHub OAuth flow.

**Flow:**
1. User clicks "Connect GitHub" button in Telegram
2. Redirects to GitHub OAuth authorization
3. GitHub redirects back with authorization code
4. Exchange code for access token
5. Store token in database
6. Redirect back to Telegram

### Webhooks

#### `POST /api/webhooks/github`
Receives GitHub webhook events.

**Supported Events:**
- `issues` (opened, closed, reopened)
- `pull_request` (opened, closed, merged)
- `push` (commits)
- `issue_comment` (created)
- `pull_request_review_comment` (created)

**Security:**
- Validates webhook signature using `GITHUB_WEBHOOK_SECRET`
- Verifies payload integrity

#### `POST /api/telegram/webhook`
Receives Telegram bot updates.

**Handles:**
- Text messages
- Commands
- Callback queries (inline buttons)

### Cron Jobs

#### `GET /api/cron/poll-repos`
Scheduled job that polls repositories in polling mode.

**Frequency:** Every 5 minutes (configured in `vercel.json`)

**Authentication:** Requires `Authorization: Bearer <CRON_SECRET>` header

**Process:**
1. Fetch all watched repos in polling mode
2. For each repo, check for new issues/PRs/commits
3. Compare with last polled timestamp
4. Send notifications for new items
5. Update `lastPolled` timestamp

---

## 🤖 Bot Commands

### User Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/start` | Initialize bot and connect GitHub | `/start` |
| `/watch` | Watch a repository | `/watch facebook/react` |
| `/unwatch` | Stop watching a repository | `/unwatch facebook/react` |
| `/watchlist` | Show all watched repositories | `/watchlist` |
| `/help` | Show available commands | `/help` |
| `/disconnect` | Disconnect GitHub and clear data | `/disconnect` |

### Command Details

#### `/start`
- Welcomes the user
- Shows inline button to connect GitHub
- Initiates OAuth flow

#### `/watch <owner/repo>`
- Validates repository exists
- Checks user's access level
- Creates webhook if admin access
- Falls back to polling mode if no admin access
- Stores in database
- Shows notification preferences menu

#### `/unwatch <owner/repo>`
- Removes repository from watchlist
- Deletes webhook if exists
- Confirms removal

#### `/watchlist`
- Lists all watched repositories
- Shows watch mode (⚡ webhook or 🔄 polling)
- Displays notification preferences
- Provides inline buttons to manage each repo

#### `/disconnect`
- Revokes GitHub access
- Deletes all watched repositories
- Removes webhooks
- Clears user data
- Requires confirmation

---

## 💻 Development Workflow

### Running Locally

```bash
# Start development server
npm run dev

# In another terminal, start ngrok (for webhook testing)
ngrok http 3000

# Set Telegram webhook to ngrok URL
./setup-webhook.sh
```

### Code Structure

#### Adding a New Bot Command

1. Create a new file in `lib/telegram/commands/`:

```typescript
// lib/telegram/commands/mycommand.ts
import { Context } from 'telegraf';
import prisma from '@/lib/prisma';

export async function handleMyCommand(ctx: Context) {
  const telegramId = ctx.from?.id;
  
  if (!telegramId) {
    return ctx.reply('Unable to identify user.');
  }

  // Your command logic here
  await ctx.reply('Command executed!');
}
```

2. Register the command in `lib/telegram/bot.ts`:

```typescript
import { handleMyCommand } from './commands/mycommand';

bot.command('mycommand', handleMyCommand);
```

#### Adding a New API Route

Create a new route file in `src/app/api/`:

```typescript
// src/app/api/myroute/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Your logic here
  return NextResponse.json({ success: true });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  // Your logic here
  return NextResponse.json({ success: true });
}
```

### Database Migrations

When you modify the Prisma schema:

```bash
# Create a new migration
npx prisma migrate dev --name description_of_change

# Apply migrations in production
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

### Testing

#### Manual Testing

See [TESTING_GUIDE.md](markdowns/TESTING_GUIDE.md) for comprehensive testing instructions.

**Quick test checklist:**
- [ ] `/start` command works
- [ ] GitHub OAuth flow completes
- [ ] `/watch` adds repository
- [ ] Notifications are received
- [ ] `/watchlist` shows correct data
- [ ] `/unwatch` removes repository
- [ ] `/disconnect` clears data

#### Testing Webhooks Locally

```bash
# Test GitHub webhook
./test-webhook.sh

# Test polling endpoint
./test-polling.sh

# Debug polling
./debug-polling.sh
```

---

## 🚀 Deployment

### Deploying to Vercel

#### 1. Push to GitHub

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

#### 2. Import to Vercel

1. Go to [vercel.com](https://vercel.com/)
2. Click "Import Project"
3. Select your GitHub repository
4. Click "Deploy"

#### 3. Configure Environment Variables

In Vercel dashboard: **Project → Settings → Environment Variables**

Add all variables from your `.env` file:

```env
TELEGRAM_BOT_TOKEN=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_WEBHOOK_SECRET=...
DATABASE_URL=...
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
CRON_SECRET=...
```

#### 4. Update GitHub OAuth App

Go to [GitHub Developer Settings](https://github.com/settings/developers) and update:
- **Homepage URL**: `https://your-project.vercel.app`
- **Callback URL**: `https://your-project.vercel.app/api/auth/github/callback`

#### 5. Set Telegram Webhook

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-project.vercel.app/api/telegram/webhook"}'
```

#### 6. Verify Deployment

1. Open your bot in Telegram
2. Send `/start`
3. Complete OAuth flow
4. Test watching a repository

For detailed deployment instructions, see [DEPLOYMENT.md](markdowns/DEPLOYMENT.md)

### Vercel Cron Configuration

The `vercel.json` file configures the polling cron job:

```json
{
  "crons": [{
    "path": "/api/cron/poll-repos",
    "schedule": "*/5 * * * *"
  }]
}
```

This runs the polling job every 5 minutes automatically.

---

## 🧪 Testing

### Testing Polling Endpoint

```bash
# Test the cron endpoint
curl -X GET http://localhost:3000/api/cron/poll-repos \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Testing GitHub Webhooks

```bash
# Use the test script
./test-webhook.sh

# Or manually
curl -X POST http://localhost:3000/api/webhooks/github \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=..." \
  -d @test-payload.json
```

### Debugging

#### View Logs

```bash
# Vercel logs (production)
vercel logs

# Local logs
# Check terminal where `npm run dev` is running
```

#### Database Inspection

```bash
# Open Prisma Studio
npx prisma studio

# View database directly
psql $DATABASE_URL
```

#### Check Telegram Webhook Status

```bash
curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo
```

---

## 🐛 Troubleshooting

### Bot Not Responding

**Possible causes:**
1. Webhook not set correctly
2. Server not running
3. Environment variables missing

**Solutions:**
```bash
# Check webhook status
curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo

# Delete webhook (for local development with polling)
curl https://api.telegram.org/bot<TOKEN>/deleteWebhook

# Verify environment variables
cat .env
```

### OAuth Flow Fails

**Possible causes:**
1. Callback URL mismatch
2. Invalid client credentials
3. NEXT_PUBLIC_APP_URL not set

**Solutions:**
1. Verify GitHub OAuth app callback URL matches your app URL
2. Check `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`
3. Ensure `NEXT_PUBLIC_APP_URL` is set correctly

### Database Connection Errors

**Possible causes:**
1. Invalid `DATABASE_URL`
2. Database not running
3. Migrations not applied

**Solutions:**
```bash
# Test database connection
npx prisma db pull

# Apply migrations
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

### Webhooks Not Received

**Possible causes:**
1. Webhook not created on GitHub
2. Webhook secret mismatch
3. Server not accessible from internet

**Solutions:**
1. Check repository webhooks in GitHub settings
2. Verify `GITHUB_WEBHOOK_SECRET` matches
3. Use ngrok for local development

### Polling Not Working

**Possible causes:**
1. Cron job not configured
2. `CRON_SECRET` mismatch
3. GitHub API rate limit exceeded

**Solutions:**
```bash
# Test polling endpoint manually
curl -X GET http://localhost:3000/api/cron/poll-repos \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Check GitHub rate limit
curl -H "Authorization: token YOUR_GITHUB_TOKEN" \
  https://api.github.com/rate_limit
```

---

## 📚 Additional Resources

### Documentation Files

- [README.md](README.md) - Project overview and features
- [SETUP_GUIDE.md](SETUP_GUIDE.md) - Quick setup instructions
- [DEPLOYMENT.md](markdowns/DEPLOYMENT.md) - Deployment checklist
- [GITHUB_OAUTH_SETUP.md](markdowns/GITHUB_OAUTH_SETUP.md) - OAuth configuration
- [POLLING_VS_WEBHOOKS.md](markdowns/POLLING_VS_WEBHOOKS.md) - Notification modes explained
- [TESTING_GUIDE.md](markdowns/TESTING_GUIDE.md) - Testing procedures

### External Resources

- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Telegraf Documentation](https://telegraf.js.org/)
- [GitHub REST API](https://docs.github.com/en/rest)
- [GitHub Webhooks](https://docs.github.com/en/webhooks)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Vercel Documentation](https://vercel.com/docs)

---

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Test thoroughly
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write clear commit messages
- Update documentation for new features
- Test before submitting PR
- Keep PRs focused and small

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 💬 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/gitwatch/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/gitwatch/discussions)

---

**Built with ❤️ by developers, for developers**

*Last updated: January 2026*
