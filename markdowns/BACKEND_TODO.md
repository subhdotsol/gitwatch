# GitWatch Backend - Task Tracking

## ✅ Completed
- [x] Telegram Bot Setup
  - [x] `/start` command implementation
  - [x] User storage (in-memory Map)
  - [x] OAuth flow initiation
  
- [x] GitHub OAuth Integration
  - [x] OAuth initiation route (`/api/auth/github/route.ts`)
  - [x] OAuth callback handler (`/api/auth/github/callback/route.ts`)
  - [x] Success page (`/app/auth/success/page.tsx`)
  - [x] Token storage in user map
  
- [x] Watch Command
  - [x] `/watch` command implementation
  - [x] Repository validation
  - [x] Webhook creation
  - [x] Telegram notifications

## 📋 Next Steps (TODO)
- [ ] Set up GitHub OAuth App (follow `GITHUB_OAUTH_SETUP.md`)
- [ ] Add environment variables to `.env.local`
- [ ] Test `/start` command
- [ ] Test OAuth flow
- [ ] Test `/watch` command
- [ ] Implement webhook receiver (`/api/webhooks/github/route.ts`)
- [ ] Add database (Prisma) for persistent storage
- [ ] Add `/list` command to show watched repos
- [ ] Add `/unwatch` command to remove repos
