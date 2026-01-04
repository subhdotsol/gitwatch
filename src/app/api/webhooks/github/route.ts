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
        if (action === 'opened') {
          message = `🔔 **New Issue in ${owner}/${repo}**\n\n` +
                    `**${issue.title}**\n` +
                    `By: @${actor}\n\n` +
                    `[View Issue](${issue.html_url})`;
        } else if (action === 'closed') {
          message = `✅ **Issue Closed in ${owner}/${repo}**\n\n` +
                    `**${issue.title}**\n` +
                    `By: @${actor}\n\n` +
                    `[View Issue](${issue.html_url})`;
        }
      } 
      else if (event === 'pull_request' && watched.notifyPRs) {
        const action = data.action;
        const pr = data.pull_request;
        if (action === 'opened') {
          message = `🔌 **New PR in ${owner}/${repo}**\n\n` +
                    `**${pr.title}**\n` +
                    `By: @${actor}\n\n` +
                    `[View PR](${pr.html_url})`;
        } else if (action === 'closed') {
          const status = pr.merged ? 'Merged' : 'Closed';
          const icon = pr.merged ? '🟣' : '🛑';
          message = `${icon} **PR ${status} in ${owner}/${repo}**\n\n` +
                    `**${pr.title}**\n` +
                    `By: @${actor}\n\n` +
                    `[View PR](${pr.html_url})`;
        }
      }
      else if (event === 'push' && watched.notifyCommits) {
        const commits = data.commits || [];
        if (commits.length > 0) {
          const branch = data.ref.replace('refs/heads/', '');
          const commitText = commits.length === 1 ? '1 new commit' : `${commits.length} new commits`;
          message = `🔨 **New Push to ${owner}/${repo}**\n\n` +
                    `Branch: \`${branch}\`\n` +
                    `${commitText} by @${actor}\n\n` +
                    `[View Changes](${data.compare})`;
        }
      }
      else if (event === 'issue_comment' && watched.notifyComments) {
        const action = data.action;
        if (action === 'created') {
          const comment = data.comment;
          const isPR = !!data.issue.pull_request;
          const type = isPR ? 'PR' : 'Issue';
          message = `💬 **New Comment on ${type} in ${owner}/${repo}**\n\n` +
                    `**${data.issue.title}**\n` +
                    `By: @${actor}\n\n` +
                    `[View Comment](${comment.html_url})`;
        }
      }

      if (message) {
        try {
          await bot.telegram.sendMessage(watched.user.telegramId.toString(), message, {
            parse_mode: 'Markdown',
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
