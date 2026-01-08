
import { Telegraf } from 'telegraf';
import { prisma } from '../../prisma';

export function registerClearCommand(bot: Telegraf) {
  bot.command('clear', async (ctx) => {
    const telegramId = BigInt(ctx.from.id);

    try {
      // Get user from database
      const user = await prisma.user.findUnique({
        where: { telegramId },
      });

      if (!user?.githubToken) {
        return ctx.reply(
          '⚠️ You are not connected to GitHub.\n\n' +
          'Use /start to connect your account.'
        );
      }

      //fetch the messages from the user
      const messages = ctx.message;
      console.log("bot info")
      console.log(messages)

      //delete all the messages :
      //await ctx.telegram.deleteMessage(messages.chat.id, messages.message_id)

      // await ctx.reply(
      //   '✅ **Successfully disconnected!**\n\n' +
      //   `• GitHub connection removed\n` +
      //   `• ${user.watchedRepos.length} watched ${user.watchedRepos.length === 1 ? 'repository' : 'repositories'} removed\n` +
      //   `• All webhooks deleted\n\n` +
      //   'Use /start anytime to reconnect your GitHub account.',
      //   { parse_mode: 'Markdown' }
      // );

    } catch (error) {
      console.error('Error disconnecting:', error);
      await ctx.reply('❌ An error occurred while disconnecting. Please try again.');
    }
  });
}



