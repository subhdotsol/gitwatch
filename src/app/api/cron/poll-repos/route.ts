import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { bot } from '../../../../../lib/telegram/bot';

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

        // Filter events that happened after lastPolled
        const newEvents = events.filter((event: any) => {
          const eventDate = new Date(event.created_at);
          return eventDate > since;
        });

        // Send notifications for new events
        for (const event of newEvents) {
          const message = formatEventMessage(event, owner, repo);
          if (message) {
            try {
              await bot.telegram.sendMessage(user.telegramId.toString(), message, {
                parse_mode: 'Markdown',
                link_preview_options: { is_disabled: true },
              });
              results.notifications++;
            } catch (error) {
              console.error(`Failed to send notification to ${user.telegramId}:`, error);
            }
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

// Format GitHub event into a readable Telegram message
function formatEventMessage(event: any, owner: string, repo: string): string | null {
  const repoUrl = `https://github.com/${owner}/${repo}`;
  const actor = event.actor?.login || 'Someone';

  switch (event.type) {
    case 'IssuesEvent':
      const issue = event.payload.issue;
      return (
        `🔔 **New Issue in ${owner}/${repo}**\n\n` +
        `**${issue.title}**\n` +
        `By: @${actor}\n` +
        `Action: ${event.payload.action}\n\n` +
        `[View Issue](${issue.html_url})`
      );

    case 'PullRequestEvent':
      const pr = event.payload.pull_request;
      return (
        `🔔 **New PR in ${owner}/${repo}**\n\n` +
        `**${pr.title}**\n` +
        `By: @${actor}\n` +
        `Action: ${event.payload.action}\n\n` +
        `[View PR](${pr.html_url})`
      );

    case 'PushEvent':
      const commits = event.payload.commits || [];
      const commitCount = commits.length;
      return (
        `🔔 **New Push to ${owner}/${repo}**\n\n` +
        `By: @${actor}\n` +
        `Branch: ${event.payload.ref.replace('refs/heads/', '')}\n` +
        `Commits: ${commitCount}\n\n` +
        `[View Commits](${repoUrl}/commits)`
      );

    case 'IssueCommentEvent':
      const comment = event.payload.comment;
      const commentIssue = event.payload.issue;
      return (
        `🔔 **New Comment in ${owner}/${repo}**\n\n` +
        `On: ${commentIssue.title}\n` +
        `By: @${actor}\n\n` +
        `[View Comment](${comment.html_url})`
      );

    default:
      // Ignore other event types
      return null;
  }
}
