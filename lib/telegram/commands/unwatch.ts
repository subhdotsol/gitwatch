import { Telegraf } from 'telegraf';
import { prisma } from '../../prisma';

export function registerUnwatchCommand(bot: Telegraf) {
  bot.command('unwatch', async (ctx) => {
    try {
      const telegramId = BigInt(ctx.from?.id);
      const args = ctx.message?.text.split(' ').slice(1);

      if (!args || args.length === 0) {
        return ctx.reply(
          '❌ Please provide a repository to unwatch.\n\n' +
          'Usage: `/unwatch owner/repo`\n' +
          'Example: `/unwatch facebook/react`',
          { parse_mode: 'Markdown' }
        );
      }

      const input = args.join(' ');
      let owner: string;
      let repo: string;

      // Parse owner/repo from input
      if (input.includes('github.com')) {
        const match = input.match(/github\.com\/([^\/]+)\/([^\/\s]+)/);
        if (!match) {
          return ctx.reply('❌ Invalid GitHub URL format.');
        }
        owner = match[1];
        repo = match[2].replace(/\.git$/, '');
      } else {
        const parts = input.split('/');
        if (parts.length !== 2) {
          return ctx.reply('❌ Invalid format. Use: owner/repo');
        }
        owner = parts[0];
        repo = parts[1];
      }

      // Find user
      const user = await prisma.user.findUnique({
        where: { telegramId },
      });

      if (!user) {
        return ctx.reply('❌ User not found. Please use /start first.');
      }

      // Find the watched repo
      const watchedRepo = await prisma.watchedRepo.findUnique({
        where: {
          userId_owner_repo: {
            userId: user.id,
            owner,
            repo,
          },
        },
      });

      if (!watchedRepo) {
        return ctx.reply(
          `❌ You're not watching **${owner}/${repo}**.`,
          { parse_mode: 'Markdown' }
        );
      }

      // Delete webhook if it exists
      if (watchedRepo.webhookId && user.githubToken) {
        try {
          await fetch(
            `https://api.github.com/repos/${owner}/${repo}/hooks/${watchedRepo.webhookId}`,
            {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${user.githubToken}`,
                'Accept': 'application/vnd.github.v3+json',
              },
            }
          );
        } catch (error) {
          console.error('Error deleting webhook:', error);
          // Continue anyway - the DB record will be deleted
        }
      }

      // Delete from database
      await prisma.watchedRepo.delete({
        where: {
          userId_owner_repo: {
            userId: user.id,
            owner,
            repo,
          },
        },
      });

      await ctx.reply(
        `**Stopped watching ${owner}/${repo}**`,
        { parse_mode: 'Markdown' }
      );
    } catch (error) {
      console.error('Error in unwatch command:', error);
      await ctx.reply('❌ An error occurred. Please try again.');
    }
  });
}
