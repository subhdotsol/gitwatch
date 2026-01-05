# Changelog

All notable changes to GitWatch will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- FAQ.md with capacity and scaling documentation
- CHANGELOG.md for tracking updates

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

### Example Entry

```markdown
## [0.2.1] - 2026-01-10

### Fixed
- Duplicate notifications when webhook and polling both active (#23)

### Changed
- Increased `MAX_REPOS_PER_CRON` from 500 to 750
```

---

## Version History

| Version | Date | Highlights |
|---------|------|------------|
| 0.2.0 | 2026-01-05 | Parallel polling (10x capacity) |
| 0.1.0 | 2026-01-04 | Initial release |
