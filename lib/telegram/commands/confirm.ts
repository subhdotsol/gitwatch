import { Telegraf } from 'telegraf';

export function registerConfirmCommand(bot: Telegraf) {
  bot.command('confirm', async (ctx) => {
    await ctx.reply(
      `🔄 <b>Payment Confirmation</b>\n\n` +
      `This feature is coming soon!\n\n` +
      `For now, after making a payment, please contact @subhdotsol with your transaction details.\n\n` +
      `Thank you for your patience! 🙏`,
      { parse_mode: 'HTML' }
    );
  });
}
