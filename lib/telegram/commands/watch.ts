import { Telegraf } from 'telegraf';

export function registerWatchCommand(bot: Telegraf, users: Map<number, { telegramId: number; githubToken?: string }>) {
  bot.command('watch', async (ctx) => {
    const telegramId = ctx.from.id;
    const user = users.get(telegramId);

    if (!user?.githubToken) {
      return ctx.reply(
        '⚠️ Please connect your GitHub account first using /start'
      );
    }

    // Parse repo from command: /watch owner/repo
    const match = ctx.message.text.match(/\/watch\s+(.+)/);
    if (!match) {
      return ctx.reply(
        '❌ Invalid format. Use: /watch owner/repo\n\n' +
        'Example: /watch facebook/react'
      );
    }

    const [owner, repo] = match[1].split('/');
    if (!owner || !repo) {
      return ctx.reply('❌ Invalid repository format. Use: owner/repo');
    }

    try {
      // Verify repo exists and user has access
      const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: {
          'Authorization': `Bearer ${user.githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!repoResponse.ok) {
        return ctx.reply('❌ Repository not found or you don\'t have access.');
      }

      const repoData = await repoResponse.json();

      // Create webhook
      const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/github`;
      const webhookResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/hooks`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${user.githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: 'web',
            active: true,
            events: ['issues', 'pull_request', 'push', 'issue_comment'],
            config: {
              url: webhookUrl,
              content_type: 'json',
              secret: process.env.GITHUB_WEBHOOK_SECRET,
            },
          }),
        }
      );

      if (!webhookResponse.ok) {
        const error = await webhookResponse.json();
        console.error('Webhook creation failed:', error);
        return ctx.reply('❌ Failed to create webhook. Make sure you have admin access.');
      }

      const webhook = await webhookResponse.json();

      // TODO: Store in database
      // await prisma.watchedRepo.create({
      //   data: {
      //     telegramId,
      //     owner,
      //     repo,
      //     webhookId: webhook.id,
      //   },
      // });

      await ctx.reply(
        `✅ Now watching **${owner}/${repo}**!\n\n` +
        `⭐️ Stars: ${repoData.stargazers_count}\n` +
        `📝 Description: ${repoData.description || 'N/A'}\n\n` +
        `You'll receive notifications for:\n` +
        `• Issues\n` +
        `• Pull Requests\n` +
        `• Pushes\n` +
        `• Comments`,
        { parse_mode: 'Markdown' }
      );
    } catch (error) {
      console.error('Error watching repo:', error);
      await ctx.reply('❌ An error occurred. Please try again.');
    }
  });
}
