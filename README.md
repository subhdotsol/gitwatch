<div align="center">

# 🔔 GitWatch

### **Your GitHub Command Center in Telegram**

*Never miss an issue, PR, or commit. Stay connected to your repositories without leaving Telegram.*

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?style=flat-square&logo=postgresql)](https://www.postgresql.org/)

<br/>

[![Try It Now](https://img.shields.io/badge/🚀_Try_GitWatch-Telegram-26A5E4?style=for-the-badge)](https://t.me/Gitwtch_bot)

</div>

---

## 🎯 The Problem

As developers, we're constantly context-switching:
- Checking GitHub for new issues
- Waiting for PR reviews
- Missing important assignments
- Refreshing to see if someone commented on our issue

**GitWatch solves this** by bringing GitHub to where you already are — **Telegram**.

---

## ✨ What GitWatch Does

GitWatch is a Telegram bot that monitors GitHub repositories and sends you instant notifications:

| Event | What You Get |
|-------|-------------|
| 🆕 **New Issue** | Title, author, and direct link |
| 🔀 **Pull Request** | PR opened, merged, or closed alerts |
| 📝 **New Commits** | Push notifications with commit count |
| 💬 **Comments** | Discussion updates on issues/PRs |
| ✅ **Assigned to You** | Personalized "You were assigned" alerts |
| ❌ **Issue Closed** | Know when issues are resolved |

**Watch any public repository** — not just your own. Track popular open-source projects, your team's repos, or projects you're contributing to.

---

## 🔧 How It Works

GitWatch uses a **smart hybrid notification system** to deliver updates:

### For Repositories You Own
```
GitHub Repo → Webhook → GitWatch → Telegram (Instant)
```
When you add a repo you own, GitWatch automatically creates a GitHub webhook. Events are delivered in **real-time** — typically within 1-2 seconds.

### For Repositories You Don't Own
```
GitHub Repo ← GitWatch (polls every 2 min) → Telegram
```
For repos without webhook access, GitWatch polls the GitHub Events API every 2 minutes. You'll get notifications within a short delay.

### The Technical Flow

```mermaid
sequenceDiagram
    participant User as You (Telegram)
    participant Bot as GitWatch Bot
    participant DB as Database
    participant GH as GitHub

    User->>Bot: /watch facebook/react
    Bot->>GH: Check repo exists
    GH-->>Bot: ✓ Repo found
    Bot->>GH: Try create webhook
    alt Can create webhook
        GH-->>Bot: Webhook created
        Bot->>DB: Save (mode: webhook)
    else No permission
        Bot->>DB: Save (mode: polling)
    end
    Bot-->>User: ✅ Now watching!
    
    Note over GH,Bot: When event occurs...
    GH->>Bot: Webhook/Poll detects event
    Bot->>User: 📬 Notification
```

---

## 🚀 Quick Start

### Step 1: Start the Bot
Open Telegram and start a chat with **[@Gitwtch_bot](https://t.me/Gitwtch_bot)**

```
/start
```

### Step 2: Connect Your GitHub
Click the authorization link the bot sends. This allows GitWatch to:
- Access public repositories
- Create webhooks on your repos
- Read events from the GitHub API

### Step 3: Watch a Repository
```
/watch vercel/next.js
```
or
```
/watch https://github.com/facebook/react
```

### Step 4: Customize Notifications
After adding a repo, use the interactive menu to toggle:
- ✅ Issues
- ✅ Pull Requests  
- ✅ Commits
- ✅ Comments

---

## 📋 Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/start` | Initialize & connect GitHub | — |
| `/watch <repo>` | Watch a repository | `/watch owner/repo` |
| `/unwatch <repo>` | Stop watching | `/unwatch owner/repo` |
| `/watchlist` | List all watched repos | — |
| `/disconnect` | Remove GitHub connection & all data | — |
| `/help` | Show help message | — |

---

## 🏗️ Architecture

GitWatch is built as a **Next.js application** with these key components:

```
gitwatch/
├── src/
│   └── app/
│       └── api/
│           ├── telegram/webhook/    # Telegram bot updates
│           ├── webhooks/github/     # GitHub webhook receiver
│           ├── cron/poll-repos/     # Polling fallback system
│           └── auth/github/         # OAuth flow
├── lib/
│   ├── telegram/
│   │   └── commands/               # Bot commands (watch, help, etc.)
│   ├── prisma.ts                   # Database client
│   └── rate-limiter.ts             # Request rate limiting
└── prisma/
    └── schema.prisma               # Database schema
```

### Data Flow

1. **User sends command** → Telegram sends update to `/api/telegram/webhook`
2. **Bot processes command** → Validates input, checks GitHub, saves to DB
3. **Event occurs on GitHub** → 
   - Webhook mode: GitHub POSTs to `/api/webhooks/github`
   - Polling mode: Cron job hits `/api/cron/poll-repos`
4. **Notification sent** → Bot formats message and sends to Telegram


---

## 🔐 Security

GitWatch implements multiple security layers:

| Security Feature | Description |
|-----------------|-------------|
| **HMAC-Signed OAuth** | OAuth state is cryptographically signed to prevent manipulation |
| **State Expiration** | OAuth links expire after 10 minutes |
| **Webhook Verification** | All GitHub webhooks are signature-verified using SHA-256 |
| **Rate Limiting** | Per-user limits prevent abuse (5 watches/min, 3 OAuth attempts/5min) |
| **No Hardcoded Secrets** | All secrets loaded from environment variables |

---


## 🖥️ Self-Hosting

### Prerequisites

- Node.js 20+
- PostgreSQL database (Neon, Supabase, or local)
- Telegram Bot Token from [@BotFather](https://t.me/botfather)
- GitHub OAuth App credentials

### Setup

```bash
# Clone
git clone https://github.com/subhdotsol/gitwatch.git
cd gitwatch

# Install
npm install

# Configure
cp .env.example .env.local
# Edit .env.local with your credentials

# Database
npx prisma db push

# Run
npm run dev
```

### Environment Variables

```env
# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token

# GitHub OAuth
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
GITHUB_WEBHOOK_SECRET=your_webhook_secret

# Database
DATABASE_URL=postgresql://user:pass@host:5432/gitwatch

# App
NEXT_PUBLIC_APP_URL=https://your-domain.com
CRON_SECRET=random_secret_for_cron_auth
```

### Deploy to Vercel

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Set up Telegram webhook: `https://your-domain.com/api/telegram/webhook`
5. Configure cron job for polling (cron-jobs.org or Vercel Cron)

---

## 📊 Feature Status

| Category | Completed | Planned |
|----------|:---------:|:-------:|
| Core Notifications | 14 | 1 |
| Security | 4 | 3 |
| UX | 4 | 2 |
| Architecture | 4 | 3 |
| **More features...** | | |

See **[FEATURES.md](./FEATURES.md)** for the complete roadmap with 118 planned features.

---

## 🤝 Contributing

Contributions are welcome! This project is in active development.

```bash
# Fork → Clone → Branch → Commit → Push → PR
git checkout -b feature/amazing-feature
git commit -m 'Add amazing feature'
git push origin feature/amazing-feature
```

---

## 📬 Support

- **Bot:** [@Gitwtch_bot](https://t.me/Gitwtch_bot)
- **Issues:** [GitHub Issues](https://github.com/subhdotsol/gitwatch/issues)
- **Author:** [@subhdotsol](https://github.com/subhdotsol)

---

<div align="center">

**Built with ❤️ for the open-source community**

[⭐ Star this repo](https://github.com/subhdotsol/gitwatch) • [🐛 Report Bug](https://github.com/subhdotsol/gitwatch/issues) • [✨ Request Feature](https://github.com/subhdotsol/gitwatch/issues)

</div>
