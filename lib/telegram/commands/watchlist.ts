import { Telegraf } from 'telegraf';
import { prisma } from '../../prisma';

export function registerWatchlistCommand(bot: Telegraf) {
  bot.command('watchlist', async (ctx) => {
    const telegramId = BigInt(ctx.from.id);

    try {
      // Get user from database
      const user = await prisma.user.findUnique({
        where: { telegramId },
        include: {
          watchedRepos: {
            where: { active: true },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!user) {
        return ctx.reply(
          '⚠️ Please connect your GitHub account first using /start'
        );
      }

      if (user.watchedRepos.length === 0) {
        return ctx.reply(
          '📭 You are not watching any repositories yet.\n\n' +
          'Use `/watch owner/repo` to start watching!',
          { parse_mode: 'Markdown' }
        );
      }

      // Build watchlist message
      let message = `**Your Watchlist** (${user.watchedRepos.length} repositories)\n\n`;

      user.watchedRepos.forEach((repo, index) => {
        const modeText = repo.watchMode === 'webhook' ? 'Real-time' : 'Polling';
        message += `${index + 1}. **${repo.owner}/${repo.repo}**\n`;
        message += `Mode: ${modeText}\n`;
        message += `Added: ${repo.createdAt.toLocaleDateString()}\n\n`;
      });

      message += `Use \`/unwatch owner/repo\` to stop watching a repository.`;

      await ctx.reply(message, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      await ctx.reply('❌ An error occurred. Please try again.');
    }
  });
}
