import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '../../../../../lib/prisma';
import { Telegraf } from 'telegraf';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text();
    const signature = req.headers.get('x-hub-signature-256');

    if (!process.env.GITHUB_WEBHOOK_SECRET) {
      console.error('GITHUB_WEBHOOK_SECRET is not set');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    if (!signature) {
      return NextResponse.json({ error: 'No signature provided' }, { status: 401 });
    }

    // Verify signature
    const hmac = crypto.createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET);
    const digest = 'sha256=' + hmac.update(payload).digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = req.headers.get('x-github-event');
    const data = JSON.parse(payload);
    const repository = data.repository;

    if (!repository) {
      return NextResponse.json({ ok: true }); // Ping event or similar
    }

    const owner = repository.owner.login;
    const repo = repository.name;

    console.log(`Received GitHub event: ${event} for ${owner}/${repo}`);

    // Find users watching this repo
    const watchedRepos = await prisma.watchedRepo.findMany({
      where: {
        owner,
        repo,
        active: true,
      },
      include: {
        user: true,
      },
    });

    if (watchedRepos.length === 0) {
      return NextResponse.json({ ok: true });
    }

    const actor = data.sender.login;

    for (const watched of watchedRepos) {
      let message = '';

      if (event === 'issues' && watched.notifyIssues) {
        const action = data.action;
        const issue = data.issue;
        // Construct URL manually if missing, add fallback for title
        const issueNumber = data.number || issue?.number;
        const issueUrl = issue?.html_url || (issueNumber ? `https://github.com/${owner}/${repo}/issues/${issueNumber}` : `https://github.com/${owner}/${repo}/issues`);
        const issueTitle = issue?.title || `#${issueNumber || 'unknown'}`;
        
        if (action === 'opened') {
          message = `<b>New Issue</b>\n` +
                    `Repo: ${owner}/${repo}\n` +
                    `Issue: ${issueTitle}\n` +
                    `By: @${actor}\n\n` +
                    `<a href="${issueUrl}">View Issue</a>`;
        } else if (action === 'closed') {
          message = `<b>Issue Closed</b>\n` +
                    `Repo: ${owner}/${repo}\n` +
                    `Issue: ${issueTitle}\n` +
                    `By: @${actor}\n\n` +
                    `<a href="${issueUrl}">View Issue</a>`;
        } else if (action === 'assigned') {
          const assignee = data.assignee?.login;
          if (assignee) {
            const target = watched.user.githubUsername === assignee ? 'You have' : `@${assignee} has`;
            message = `<b>Issue Assigned</b>\n` +
                      `Repo: ${owner}/${repo}\n` +
                      `Issue: ${issueTitle}\n` +
                      `${target} been assigned by @${actor}\n\n` +
                      `<a href="${issueUrl}">View Issue</a>`;
          }
        }
      } 
      else if (event === 'pull_request' && watched.notifyPRs) {
        const action = data.action;
        const pr = data.pull_request;
        // Construct URL manually if missing, add fallback for title
        const prNumber = data.number || pr?.number;
        const prUrl = pr?.html_url || (prNumber ? `https://github.com/${owner}/${repo}/pull/${prNumber}` : `https://github.com/${owner}/${repo}/pulls`);
        const prTitle = pr?.title || `#${prNumber || 'unknown'}`;
        
        if (action === 'opened') {
          message = `<b>New Pull Request</b>\n` +
                    `Repo: ${owner}/${repo}\n` +
                    `PR: ${prTitle}\n` +
                    `By: @${actor}\n\n` +
                    `<a href="${prUrl}">View PR</a>`;
        } else if (action === 'closed') {
          const status = pr?.merged ? 'Merged' : 'Closed';
          message = `<b>PR ${status}</b>\n` +
                    `Repo: ${owner}/${repo}\n` +
                    `PR: ${prTitle}\n` +
                    `By: @${actor}\n\n` +
                    `<a href="${prUrl}">View PR</a>`;
        } else if (action === 'assigned') {
          const assignee = data.assignee?.login;
          if (assignee) {
            const target = watched.user.githubUsername === assignee ? 'You have' : `@${assignee} has`;
            message = `<b>PR Assigned</b>\n` +
                      `Repo: ${owner}/${repo}\n` +
                      `PR: ${prTitle}\n` +
                      `${target} been assigned by @${actor}\n\n` +
                      `<a href="${prUrl}">View PR</a>`;
          }
        }
      }
      else if (event === 'push' && watched.notifyCommits) {
        const commits = data.commits || [];
        if (commits.length > 0) {
          const branch = data.ref?.replace('refs/heads/', '') || 'unknown';
          const commitCount = commits.length;
          const commitText = commitCount === 1 ? '1 new commit' : `${commitCount} new commits`;
          
          // HTML escape function
          const escHtml = (text: string) => text ? text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
          
          // Get commit messages (up to 3)
          const commitMessages = commits
            .slice(0, 3)
            .map((c: any) => `• ${escHtml(c.message?.split('\n')[0]?.substring(0, 50) || 'No message')}`)
            .join('\n');
          const moreCommits = commitCount > 3 ? `\n... and ${commitCount - 3} more` : '';
          
          // Construct compare URL if missing
          const compareUrl = data.compare || 
            (data.before && data.after ? `https://github.com/${owner}/${repo}/compare/${data.before}...${data.after}` : `https://github.com/${owner}/${repo}/commits/${branch}`);
          
          message = `<b>New Push</b>\n` +
                    `Repo: ${escHtml(owner)}/${escHtml(repo)}\n` +
                    `Branch: <code>${escHtml(branch)}</code>\n` +
                    `${commitText} by @${escHtml(actor)}\n\n` +
                    `<b>Commits:</b>\n${commitMessages}${moreCommits}\n\n` +
                    `<a href="${compareUrl}">View Changes</a>`;
        }
      }
      else if (event === 'issue_comment' && watched.notifyComments) {
        const action = data.action;
        if (action === 'created') {
          const comment = data.comment;
          const isPR = !!data.issue?.pull_request;
          const type = isPR ? 'PR' : 'Issue';
          // Construct URL manually if missing
          const commentId = comment?.id;
          const commentIssueNumber = data.issue?.number;
          const commentUrl = comment?.html_url || 
            (commentIssueNumber && commentId 
              ? `https://github.com/${owner}/${repo}/issues/${commentIssueNumber}#issuecomment-${commentId}`
              : commentIssueNumber 
                ? `https://github.com/${owner}/${repo}/issues/${commentIssueNumber}`
                : `https://github.com/${owner}/${repo}`);
          const commentIssueTitle = data.issue?.title || `#${commentIssueNumber || 'unknown'}`;
          
          message = `<b>New Comment (${type})</b>\n` +
                    `Repo: ${owner}/${repo}\n` +
                    `On: ${commentIssueTitle}\n` +
                    `By: @${actor}\n\n` +
                    `<a href="${commentUrl}">View Comment</a>`;
        }
      }

      if (message) {
        try {
          await bot.telegram.sendMessage(watched.user.telegramId.toString(), message, {
            parse_mode: 'HTML',
            link_preview_options: { is_disabled: true },
          });
        } catch (err) {
          console.error(`Failed to send Telegram message to ${watched.user.telegramId}:`, err);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error in GitHub webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
