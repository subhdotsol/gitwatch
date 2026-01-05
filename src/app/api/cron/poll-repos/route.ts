import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { Telegraf } from 'telegraf';

// Create a simple Telegram client for sending messages (no command handlers)
const telegram = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!).telegram;

// Utility: Split array into chunks for parallel processing
function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// Configuration for parallel processing
const BATCH_SIZE = 10; // Process 10 repos concurrently
const MAX_REPOS_PER_CRON = 500; // Safety limit to prevent timeout

// This endpoint should be called by a cron job (e.g., Vercel Cron, GitHub Actions)
// Recommended: every 5-10 minutes
export async function GET(request: Request) {
  const startTime = Date.now();
  
  try {
    // Verify this is a legitimate cron request (basic auth check)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all repos in polling mode (with safety limit)
    const pollingRepos = await prisma.watchedRepo.findMany({
      where: {
        watchMode: 'polling',
        active: true,
      },
      include: {
        user: true,
      },
      take: MAX_REPOS_PER_CRON, // Limit to prevent timeout
      orderBy: {
        lastPolled: 'asc', // Oldest first - ensures fair polling
      },
    });

    if (pollingRepos.length === 0) {
      return NextResponse.json({ message: 'No polling repos to check' });
    }

    const results = {
      checked: 0,
      notifications: 0,
      errors: 0,
      totalRepos: pollingRepos.length,
      processingTimeMs: 0,
    };

    // Split repos into batches for parallel processing
    const batches = chunk(pollingRepos, BATCH_SIZE);
    console.log(`Processing ${pollingRepos.length} repos in ${batches.length} batches of ${BATCH_SIZE}`);

    // Process each batch in parallel
    for (const batch of batches) {
      const batchResults = await Promise.allSettled(
        batch.map(watchedRepo => pollSingleRepo(watchedRepo))
      );

      // Aggregate results
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.checked += result.value.checked;
          results.notifications += result.value.notifications;
          results.errors += result.value.errors;
        } else {
          results.errors++;
          console.error('Batch item failed:', result.reason);
        }
      }
    }

    results.processingTimeMs = Date.now() - startTime;
    console.log(`Completed polling in ${results.processingTimeMs}ms`);

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error) {
    console.error('Error in poll-repos cron:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Process a single repo - returns stats for aggregation
async function pollSingleRepo(watchedRepo: any): Promise<{ checked: number; notifications: number; errors: number }> {
  const stats = { checked: 0, notifications: 0, errors: 0 };
  
  try {
    const { owner, repo, user, lastPolled } = watchedRepo;

    if (!user.githubToken) {
      console.log(`Skipping ${owner}/${repo}: No GitHub token for user`);
      return stats;
    }

    // Calculate since timestamp (last poll or 10 minutes ago)
    const since = lastPolled || new Date(Date.now() - 10 * 60 * 1000);
    const sinceISO = since.toISOString();

    console.log(`[${owner}/${repo}] Checking events since: ${sinceISO}`);

    // Fetch events from GitHub API
    const eventsResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/events?per_page=10`,
      {
        headers: {
          'Authorization': `Bearer ${user.githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );

    if (!eventsResponse.ok) {
      console.error(`Failed to fetch events for ${owner}/${repo}: ${eventsResponse.status}`);
      stats.errors++;
      return stats;
    }

    const events = await eventsResponse.json();
    console.log(`[${owner}/${repo}] Found ${events.length} total events`);

    // Filter events that happened after lastPolled
    const newEvents = events.filter((event: any) => {
      const eventDate = new Date(event.created_at);
      return eventDate > since;
    });

    console.log(`[${owner}/${repo}] ${newEvents.length} new events to notify`);

    // Send notifications for new events
    for (const event of newEvents) {
      // Check if user wants this notification type
      if (!shouldNotify(event, watchedRepo)) {
        console.log(`  Skipping ${event.type} - disabled in preferences`);
        continue;
      }

      const message = formatEventMessage(event, owner, repo, user.githubUsername || undefined);
      if (message) {
        try {
          console.log(`Sending notification for ${event.type} to ${user.telegramId}`);
          await telegram.sendMessage(user.telegramId.toString(), message, {
            parse_mode: 'HTML',
            link_preview_options: { is_disabled: true },
          });
          stats.notifications++;
        } catch (error) {
          console.error(`Failed to send notification to ${user.telegramId}:`, error);
        }
      } else {
        console.log(`  Skipping ${event.type} - no message formatter`);
      }
    }

    // Update lastPolled timestamp
    await prisma.watchedRepo.update({
      where: { id: watchedRepo.id },
      data: { lastPolled: new Date() },
    });

    stats.checked++;
  } catch (error) {
    console.error(`Error processing ${watchedRepo.owner}/${watchedRepo.repo}:`, error);
    stats.errors++;
  }

  return stats;
}

// Check if user wants notification for this event type
function shouldNotify(event: any, watchedRepo: any): boolean {
  switch (event.type) {
    case 'IssuesEvent':
      return watchedRepo.notifyIssues;
    case 'PullRequestEvent':
      return watchedRepo.notifyPRs;
    case 'PushEvent':
      return watchedRepo.notifyCommits;
    case 'IssueCommentEvent':
      return watchedRepo.notifyComments;
    default:
      return false;
  }
}

// Format GitHub event into a readable Telegram message (HTML format)
function formatEventMessage(event: any, owner: string, repo: string, currentUser?: string): string | null {
  const actor = event.actor?.login || 'Someone';
  // HTML escape function for special characters
  const escHtml = (text: string) => text ? text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
  
  console.log(`Formatting event for ${owner}/${repo}`);

  switch (event.type) {
    case 'IssuesEvent':
      const issue = event.payload.issue;
      const issueAction = event.payload.action;
      if (issueAction === 'opened' || issueAction === 'closed') {
        const issueStatus = issueAction === 'opened' ? 'New Issue' : 'Issue Closed';
        return (
          `<b>${issueStatus}</b>\n` +
          `Repo: ${escHtml(owner)}/${escHtml(repo)}\n` +
          `Issue: ${escHtml(issue.title)}\n` +
          `By: @${escHtml(actor)}\n\n` +
          `<a href="${issue.html_url}">View Issue</a>`
        );
      } else if (issueAction === 'assigned') {
        const assignee = event.payload.assignee.login;
        const target = currentUser === assignee ? 'You have' : `@${escHtml(assignee)} has`;
        return (
          `<b>Issue Assigned</b>\n` +
          `Repo: ${escHtml(owner)}/${escHtml(repo)}\n` +
          `Issue: ${escHtml(issue.title)}\n` +
          `${target} been assigned by @${escHtml(actor)}\n\n` +
          `<a href="${issue.html_url}">View Issue</a>`
        );
      }
      return null;

    case 'PullRequestEvent':
      const pr = event.payload.pull_request;
      const prAction = event.payload.action;
      if (prAction === 'opened' || prAction === 'closed') {
        let prStatus = 'New Pull Request';
        if (prAction === 'closed') {
          prStatus = pr.merged ? 'PR Merged' : 'PR Closed';
        }

        return (
          `<b>${prStatus}</b>\n` +
          `Repo: ${escHtml(owner)}/${escHtml(repo)}\n` +
          `PR: ${escHtml(pr.title)}\n` +
          `By: @${escHtml(actor)}\n\n` +
          `<a href="${pr.html_url}">View PR</a>`
        );
      } else if (prAction === 'assigned') {
        const assignee = event.payload.assignee.login;
        const target = currentUser === assignee ? 'You have' : `@${escHtml(assignee)} has`;
        return (
          `<b>PR Assigned</b>\n` +
          `Repo: ${escHtml(owner)}/${escHtml(repo)}\n` +
          `PR: ${escHtml(pr.title)}\n` +
          `${target} been assigned by @${escHtml(actor)}\n\n` +
          `<a href="${pr.html_url}">View PR</a>`
        );
      }
      return null;

    case 'PushEvent':
      const branch = event.payload.ref ? event.payload.ref.replace('refs/heads/', '') : 'unknown';
      const commits = event.payload.commits || [];
      const commitCount = event.payload.size ?? commits.length ?? 0;
      
      if (commitCount === 0) return null;
      
      const commitText = commitCount === 1 ? '1 new commit' : `${commitCount} new commits`;
      
      // Get commit messages (up to 3)
      const commitMessages = commits
        .slice(0, 3)
        .map((c: any) => `• ${escHtml(c.message.split('\n')[0].substring(0, 50))}`)
        .join('\n');
      const moreCommits = commitCount > 3 ? `\n... and ${commitCount - 3} more` : '';
      
      return (
        `<b>New Push</b>\n` +
        `Repo: ${escHtml(owner)}/${escHtml(repo)}\n` +
        `Branch: <code>${escHtml(branch)}</code>\n` +
        `${commitText} by @${escHtml(actor)}\n\n` +
        `<b>Commits:</b>\n${commitMessages}${moreCommits}\n\n` +
        `<a href="https://github.com/${owner}/${repo}/compare/${event.payload.before}...${event.payload.head}">View Changes</a>`
      );

    case 'IssueCommentEvent':
      if (event.payload.action !== 'created') return null;
      const comment = event.payload.comment;
      const commentIssue = event.payload.issue;
      const type = !!commentIssue.pull_request ? 'PR' : 'Issue';
      
      return (
        `<b>New Comment (${type})</b>\n` +
        `Repo: ${escHtml(owner)}/${escHtml(repo)}\n` +
        `On: ${escHtml(commentIssue.title)}\n` +
        `By: @${escHtml(actor)}\n\n` +
        `<a href="${comment.html_url}">View Comment</a>`
      );

    default:
      return null;
  }
}
