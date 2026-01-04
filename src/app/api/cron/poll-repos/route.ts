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

          const message = formatEventMessage(event, owner, repo, user.githubUsername || undefined);
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
function formatEventMessage(event: any, owner: string, repo: string, currentUser?: string): string | null {
  const actor = event.actor?.login || 'Someone';
  const esc = (text: string) => text ? text.replace(/_/g, '\\_') : '';

  const safeOwner = esc(owner);
  const safeRepo = esc(repo);

  switch (event.type) {
    case 'IssuesEvent':
      const issue = event.payload.issue;
      const issueAction = event.payload.action;
      if (issueAction === 'opened' || issueAction === 'closed') {
        const issueStatus = issueAction === 'opened' ? 'New Issue' : 'Issue Closed';
        return (
          `**${issueStatus}**\n` +
          `Repo: ${safeOwner}/${safeRepo}\n` +
          `Issue: ${esc(issue.title)}\n` +
          `By: @${esc(actor)}\n\n` +
          `[View Issue](${issue.html_url})`
        );
      } else if (issueAction === 'assigned') {
        const assignee = event.payload.assignee.login;
        const target = currentUser === assignee ? 'You have' : `@${esc(assignee)} has`;
        return (
          `**Issue Assigned**\n` +
          `Repo: ${safeOwner}/${safeRepo}\n` +
          `Issue: ${esc(issue.title)}\n` +
          `${target} been assigned by @${esc(actor)}\n\n` +
          `[View Issue](${issue.html_url})`
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
          `**${prStatus}**\n` +
          `Repo: ${safeOwner}/${safeRepo}\n` +
          `PR: ${esc(pr.title)}\n` +
          `By: @${esc(actor)}\n\n` +
          `[View PR](${pr.html_url})`
        );
      } else if (prAction === 'assigned') {
        const assignee = event.payload.assignee.login;
        const target = currentUser === assignee ? 'You have' : `@${esc(assignee)} has`;
        return (
          `**PR Assigned**\n` +
          `Repo: ${safeOwner}/${safeRepo}\n` +
          `PR: ${esc(pr.title)}\n` +
          `${target} been assigned by @${esc(actor)}\n\n` +
          `[View PR](${pr.html_url})`
        );
      }
      return null;

    case 'PushEvent':
      const branch = event.payload.ref ? event.payload.ref.replace('refs/heads/', '') : 'unknown';
      // GitHub API sometimes returns size: 0 but has commits in the payload
      const commitCount = event.payload.size ?? event.payload.commits?.length ?? 0;
      
      // If we still show 0 commits but there's a push, it might be a force push or empty commit
      // We'll show it anyway to be safe, but label it appropriately
      const commitText = commitCount === 1 ? '1 new commit' : `${commitCount} new commits`;
      
      return (
        `**New Push**\n` +
        `Repo: ${safeOwner}/${safeRepo}\n` +
        `Branch: \`${esc(branch)}\`\n` +
        `${commitText} by @${esc(actor)}\n\n` +
        `[View Changes](https://github.com/${owner}/${repo}/compare/${event.payload.before}...${event.payload.head})`
      );

    case 'IssueCommentEvent':
      if (event.payload.action !== 'created') return null;
      const comment = event.payload.comment;
      const commentIssue = event.payload.issue;
      const type = !!commentIssue.pull_request ? 'PR' : 'Issue';
      
      return (
        `**New Comment (${type})**\n` +
        `Repo: ${safeOwner}/${safeRepo}\n` +
        `On: ${esc(commentIssue.title)}\n` +
        `By: @${esc(actor)}\n\n` +
        `[View Comment](${comment.html_url})`
      );

    default:
      return null;
  }
}
