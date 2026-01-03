import { Telegraf } from 'telegraf';
import { prisma } from '../../prisma';

export function registerDisconnectCommand(bot: Telegraf) {
  bot.command('disconnect', async (ctx) => {
    const telegramId = BigInt(ctx.from.id);

    try {
      // Get user from database
      const user = await prisma.user.findUnique({
        where: { telegramId },
        include: { watchedRepos: true },
      });

      if (!user?.githubToken) {
        return ctx.reply(
          '⚠️ You are not connected to GitHub.\n\n' +
          'Use /start to connect your account.'
        );
      }

      // Delete all webhooks for repos with webhook mode
      const webhookRepos = user.watchedRepos.filter(
        (repo) => repo.watchMode === 'webhook' && repo.webhookId
      );

      for (const repo of webhookRepos) {
        try {
          await fetch(
            `https://api.github.com/repos/${repo.owner}/${repo.repo}/hooks/${repo.webhookId}`,
            {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${user.githubToken}`,
                'Accept': 'application/vnd.github.v3+json',
              },
            }
          );
        } catch (error) {
          console.error(`Failed to delete webhook for ${repo.owner}/${repo.repo}:`, error);
          // Continue with other webhooks even if one fails
        }
      }

      // Delete all watched repos and clear GitHub connection
      await prisma.user.update({
        where: { telegramId },
        data: {
          githubToken: null,
          githubUsername: null,
          watchedRepos: {
            deleteMany: {},
          },
        },
      });

      await ctx.reply(
        '✅ **Successfully disconnected!**\n\n' +
        `• GitHub connection removed\n` +
        `• ${user.watchedRepos.length} watched ${user.watchedRepos.length === 1 ? 'repository' : 'repositories'} removed\n` +
        `• All webhooks deleted\n\n` +
        'Use /start anytime to reconnect your GitHub account.',
        { parse_mode: 'Markdown' }
      );
    } catch (error) {
      console.error('Error disconnecting:', error);
      await ctx.reply('❌ An error occurred while disconnecting. Please try again.');
    }
  });
}
