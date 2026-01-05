# Changelog

All notable changes to GitWatch will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

---

## [0.3.0] - 2026-01-05

### Added
- **Subscription System**
  - Free plan: 2 repos per user
  - Premium plan: 5 repos per user ($5/month)
  - Plan field added to User model in database

- **Admin Commands** (admin only via `ADMIN_TELEGRAM_ID`)
  - `/approve @user` - Upgrade user to Premium
  - `/downgrade @user [reason]` - Remove Premium with notification
  - `/stats` - View platform statistics
  - `/reject @user reason` - Send rejection message

- **User Commands**
  - `/status` - Shows plan, repo count, watched repos
  - `/upgrade` - Shows pricing with real-time USD→INR conversion
  - `/confirm` - Placeholder for future self-service payments

- **Platform Limits**
  - Max 100 users (configurable in `limits.ts`)
  - New users blocked when at capacity with waitlist message
  - Repo limits enforced on `/watch` command

- **Push Notifications Enhancement**
  - Commit messages now shown in push notifications (up to 3)

- **Admin Scripts**
  - `scripts/broadcast.ts` - Send message to all users
  - `scripts/upgrade-user.ts` - Upgrade user via command line

### Changed
- `/upgrade` now fetches real-time exchange rate for INR pricing
- Switched to HTML parse mode in several commands for better compatibility

### Fixed
- Markdown parsing errors with special characters in usernames/repos

---

## [0.2.0] - 2026-01-05

### Added
- **Parallel polling** - 10x throughput improvement
  - Repos now processed in batches of 10 concurrently
  - `Promise.allSettled()` for error isolation
  - Processing time tracking in API response

### Changed
- `MAX_REPOS_PER_CRON` limit (500) to prevent timeouts
- Polling order now prioritizes oldest-polled repos (fair scheduling)

### Performance
- Before: ~50-100 polling users
- After: ~500-1000 polling users

---

## [0.1.0] - 2026-01-04

### Added
- Initial release
- GitHub OAuth integration
- Telegram bot commands: `/start`, `/watch`, `/unwatch`, `/watchlist`, `/disconnect`, `/help`
- Webhook mode for repos with admin access
- Polling mode for public repos without admin access
- Per-repo notification preferences (issues, PRs, commits, comments)
- Rate limiting on bot commands and OAuth flow
- HMAC-signed OAuth state for security

### Security
- Webhook signature verification (GitHub → GitWatch)
- HMAC-signed OAuth state with expiry
- Basic rate limiting (in-memory)

---

## How to Update This File

When making changes, add an entry under `[Unreleased]` using these categories:

- **Added** - New features
- **Changed** - Changes to existing functionality
- **Deprecated** - Features that will be removed
- **Removed** - Features that were removed
- **Fixed** - Bug fixes
- **Security** - Security-related changes
- **Performance** - Performance improvements

### When Releasing

1. Move items from `[Unreleased]` to a new version section
2. Add the date: `## [X.Y.Z] - YYYY-MM-DD`
3. Follow semantic versioning:
   - **MAJOR** (1.0.0): Breaking changes
   - **MINOR** (0.2.0): New features, backwards compatible
   - **PATCH** (0.1.1): Bug fixes, backwards compatible

---

## Version History

| Version | Date | Highlights |
|---------|------|------------|
| 0.3.0 | 2026-01-05 | Subscription system, admin commands |
| 0.2.0 | 2026-01-05 | Parallel polling (10x capacity) |
| 0.1.0 | 2026-01-04 | Initial release |

