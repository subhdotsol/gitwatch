# Frequently Asked Questions

## Rate Limits & Capacity

### How many API requests does each user get?

GitHub provides **5,000 requests/hour per authenticated user**. Since GitWatch uses each user's own OAuth token, every user has their own independent quota.

```
User A watches 10 repos → uses User A's quota
User B watches 50 repos → uses User B's quota
They don't affect each other.
```

---

### How many users can GitWatch handle?

| Plan | Polling Users | Webhook Users | Total |
|------|---------------|---------------|-------|
| Vercel Hobby (10s timeout) | ~150-250 | Unlimited | ~300-500 |
| Vercel Pro (60s timeout) | ~500-1000 | Unlimited | ~1000+ |

**Note:** Webhook users don't consume polling resources — they receive real-time pushes from GitHub.

---

### How many repos can users watch?

This depends on total user count (polling mode only):

| Users | Repos per User |
|-------|----------------|
| 50 | 10 repos |
| 100 | 5 repos |
| 250 | 2 repos |
| 500 | 1 repo |

**Why the limit?** The cron job must complete within Vercel's 60-second timeout. More users = same pizza, more slices.

---

### Why is there an inverse relationship between users and repos?

The bottleneck is **Vercel's function timeout** (60 seconds for Pro).

```
Fixed time budget (60s) ÷ Time per repo (~40ms with batching) = ~1500 repos max
1500 repos ÷ Number of users = Repos per user
```

The total capacity is fixed — it just gets divided among users.

---

## Architecture

### How does parallel polling work?

Instead of processing repos one-by-one (sequential), we process **10 repos simultaneously** (parallel batches):

```
Before: Repo1 → Repo2 → Repo3 (400ms each = 1200ms)
After:  [Repo1, Repo2, Repo3...Repo10] all at once (400ms total)
```

This gives us **~10x throughput** improvement.

---

### What's the difference between webhook and polling mode?

| Mode | How It Works | Latency | User Requirement |
|------|--------------|---------|------------------|
| **Webhook** | GitHub pushes events to us | Instant (~1s) | Admin access to repo |
| **Polling** | We check GitHub every minute | 1-60 seconds | Any public repo |

Webhook mode is preferred but requires the user to have admin/push access to create webhooks.

---

### Why can't I watch private repos?

GitWatch currently only supports public repositories. Private repos would require:
1. Additional OAuth scopes
2. More complex permission handling
3. Security considerations for token storage

---

## Scaling

### What happens at 50,000 users?

The current architecture would break. You'd see:
- ❌ Cron timeouts (can't poll all repos in 60s)
- ❌ Delayed/missed notifications
- ❌ Database connection exhaustion

**Solutions for massive scale:**
- Queue-based processing (BullMQ, QStash)
- Sharded cron jobs (users A-M, users N-Z)
- Dedicated workers instead of serverless
- Redis for distributed rate limiting

---

### How do I increase capacity?

1. **Quick:** Increase `MAX_REPOS_PER_CRON` in `poll-repos/route.ts` (up to ~1200 is safe)
2. **Medium:** Increase `BATCH_SIZE` from 10 to 20 (slight risk)
3. **Long-term:** Migrate to queue-based architecture

---

## Troubleshooting

### Why are notifications delayed?

Possible causes:
1. **Polling mode:** Notifications come every 1-60 seconds (check interval)
2. **Rate limit exhaustion:** User hit GitHub's 5000/hr limit
3. **Cron timeout:** Too many repos, some get skipped

### Why am I getting duplicate notifications?

Check if the repo has both webhook AND polling active. The cron should skip webhook-mode repos automatically.

---

## Security

See [SECURITY.md](./SECURITY.md) for:
- Authentication flow details
- Token storage information
- Known limitations
- Reporting vulnerabilities
