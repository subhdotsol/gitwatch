import { Telegraf } from 'telegraf';
import { prisma } from '../../prisma';
import { canUserAddRepo, getPlatformStats } from '../../subscription/check-limits';
import { PLAN_LIMITS } from '../../config/limits';

export function registerStatusCommand(bot: Telegraf) {
  bot.command('status', async (ctx) => {
    const telegramId = BigInt(ctx.from.id);

    try {
      const user = await prisma.user.findUnique({
        where: { telegramId },
        include: {
          watchedRepos: {
            where: { active: true },
          },
        },
      });

      if (!user) {
        return ctx.reply(
          '⚠️ You haven\'t registered yet.\n\nUse /start to get started!'
        );
      }

      // Get repo limit info using user's actual plan
      const plan = user.plan as 'free' | 'premium';
      const repoLimit = await canUserAddRepo(user.id, plan);
      const planInfo = PLAN_LIMITS[plan];

      // Build status message
      const githubStatus = user.githubToken 
        ? `✅ Connected (@${user.githubUsername})`
        : '❌ Not connected';

      const repoList = user.watchedRepos.length > 0
        ? user.watchedRepos.map(r => `  • ${r.owner}/${r.repo}`).join('\n')
        : '  None yet';

      await ctx.reply(
        `📊 **Your GitWatch Status**\n\n` +
        `**Plan:** ${planInfo.displayName}\n` +
        `**Repositories:** ${repoLimit.current}/${repoLimit.limit}\n` +
        `**GitHub:** ${githubStatus}\n\n` +
        `**Watched Repos:**\n${repoList}\n\n` +
        `${repoLimit.current >= repoLimit.limit 
          ? '💎 Upgrade to Premium for 5 repos: /upgrade' 
          : `You can add ${repoLimit.limit - repoLimit.current} more repos`}`,
        { parse_mode: 'Markdown' }
      );
    } catch (error) {
      console.error('Error in status command:', error);
      await ctx.reply('❌ An error occurred. Please try again.');
    }
  });
}
