import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { Telegraf } from 'telegraf';

// Create a simple Telegram client for sending messages (no command handlers)
const telegram = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!).telegram;

// This endpoint should be called by a cron job (e.g., Vercel Cron, GitHub Actions)
// Recommended: every 5-10 minutes
export async function GET(request: Request) {
  try {
    // Verify this is a legitimate cron request (basic auth check)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all repos in polling mode
    const pollingRepos = await prisma.watchedRepo.findMany({
      where: {
        watchMode: 'polling',
        active: true,
      },
      include: {
        user: true,
      },
    });

    if (pollingRepos.length === 0) {
      return NextResponse.json({ message: 'No polling repos to check' });
    }

    const results = {
      checked: 0,
      notifications: 0,
      errors: 0,
    };

    // Process each repo
    for (const watchedRepo of pollingRepos) {
      try {
        const { owner, repo, user, lastPolled } = watchedRepo;

        if (!user.githubToken) {
          console.log(`Skipping ${owner}/${repo}: No GitHub token for user`);
          continue;
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
          results.errors++;
          continue;
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

          const message = formatEventMessage(event, owner, repo);
          if (message) {
            try {
              console.log(`Sending notification for ${event.type} to ${user.telegramId}`);
              await telegram.sendMessage(user.telegramId.toString(), message, {
                parse_mode: 'Markdown',
                link_preview_options: { is_disabled: true },
              });
              results.notifications++;
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

        results.checked++;
      } catch (error) {
        console.error(`Error processing ${watchedRepo.owner}/${watchedRepo.repo}:`, error);
        results.errors++;
      }
    }

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

// Format GitHub event into a readable Telegram message
function formatEventMessage(event: any, owner: string, repo: string): string | null {
  const actor = event.actor?.login || 'Someone';

  switch (event.type) {
    case 'IssuesEvent':
      const issue = event.payload.issue;
      const issueAction = event.payload.action;
      if (issueAction !== 'opened' && issueAction !== 'closed') return null;
      
      const issueStatus = issueAction === 'opened' ? '🔔 New Issue' : '✅ Issue Closed';
      return (
        `**${issueStatus} in ${owner}/${repo}**\n\n` +
        `**${issue.title}**\n` +
        `By: @${actor}\n\n` +
        `[View Issue](${issue.html_url})`
      );

    case 'PullRequestEvent':
      const pr = event.payload.pull_request;
      const prAction = event.payload.action;
      if (prAction !== 'opened' && prAction !== 'closed') return null;

      let prStatus = '🔌 New PR';
      let prIcon = '🔌';
      if (prAction === 'closed') {
        prStatus = pr.merged ? '🟣 PR Merged' : '🛑 PR Closed';
        prIcon = pr.merged ? '🟣' : '🛑';
      }

      return (
        `**${prStatus} in ${owner}/${repo}**\n\n` +
        `**${pr.title}**\n` +
        `By: @${actor}\n\n` +
        `[View PR](${pr.html_url})`
      );

    case 'PushEvent':
      const branch = event.payload.ref.replace('refs/heads/', '');
      const commitCount = event.payload.size || 0;
      if (commitCount === 0) return null;
      
      const commitText = commitCount === 1 ? '1 new commit' : `${commitCount} new commits`;
      return (
        `🔨 **New Push to ${owner}/${repo}**\n\n` +
        `Branch: \`${branch}\`\n` +
        `${commitText} by @${actor}\n\n` +
        `[View Changes](https://github.com/${owner}/${repo}/compare/${event.payload.before}...${event.payload.head})`
      );

    case 'IssueCommentEvent':
      if (event.payload.action !== 'created') return null;
      const comment = event.payload.comment;
      const commentIssue = event.payload.issue;
      const type = !!commentIssue.pull_request ? 'PR' : 'Issue';
      
      return (
        `💬 **New Comment on ${type} in ${owner}/${repo}**\n\n` +
        `**${commentIssue.title}**\n` +
        `By: @${actor}\n\n` +
        `[View Comment](${comment.html_url})`
      );

    default:
      return null;
  }
}
