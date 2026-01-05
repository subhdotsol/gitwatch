import { Telegraf } from 'telegraf';
import { prisma } from '../../prisma';
import { canUserAddRepo } from '../../subscription/check-limits';
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

      // Get repo limit info using user's actual plan (default to 'free' for safety)
      const plan = (user.plan || 'free') as 'free' | 'premium';
      const repoLimit = await canUserAddRepo(user.id, plan);
      const planInfo = PLAN_LIMITS[plan];

      // Build status message (using HTML for safety with special chars)
      const githubStatus = user.githubToken 
        ? `✅ Connected (@${user.githubUsername || 'unknown'})`
        : '❌ Not connected';

      const repoList = user.watchedRepos.length > 0
        ? user.watchedRepos.map(r => `  • ${r.owner}/${r.repo}`).join('\n')
        : '  None yet';

      // Only show upgrade hint for free users
      let upgradeHint = `You can add ${repoLimit.limit - repoLimit.current} more repos`;
      if (plan === 'free' && repoLimit.current >= repoLimit.limit) {
        upgradeHint = '💎 Upgrade to Premium for 5 repos: /upgrade';
      } else if (plan === 'premium') {
        upgradeHint = repoLimit.current >= repoLimit.limit 
          ? '✨ You\'re at your Premium limit (5 repos)'
          : `✨ Premium: You can add ${repoLimit.limit - repoLimit.current} more repos`;
      }

      await ctx.reply(
        `📊 <b>Your GitWatch Status</b>\n\n` +
        `<b>Plan:</b> ${planInfo.displayName}\n` +
        `<b>Repositories:</b> ${repoLimit.current}/${repoLimit.limit}\n` +
        `<b>GitHub:</b> ${githubStatus}\n\n` +
        `<b>Watched Repos:</b>\n${repoList}\n\n` +
        upgradeHint,
        { parse_mode: 'HTML' }
      );
    } catch (error) {
      console.error('Error in status command:', error);
      await ctx.reply('❌ An error occurred. Please try again.');
    }
  });
}
