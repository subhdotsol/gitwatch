import { Telegraf } from 'telegraf';
import { prisma } from '../../prisma';
import { getPlatformStats } from '../../subscription/check-limits';

const ADMIN_TELEGRAM_ID = process.env.ADMIN_TELEGRAM_ID || '';

/**
 * Check if the user is an admin
 */
function checkAdmin(telegramId: bigint): boolean {
  if (!ADMIN_TELEGRAM_ID) return false;
  return telegramId.toString() === ADMIN_TELEGRAM_ID;
}

export function registerAdminCommands(bot: Telegraf) {
  
  // /approve @username or /approve 123456789
  bot.command('approve', async (ctx) => {
    const telegramId = BigInt(ctx.from.id);
    
    if (!checkAdmin(telegramId)) {
      return ctx.reply('❌ This command is only available to admins.');
    }

    const args = ctx.message.text.split(' ').slice(1);
    if (args.length === 0) {
      return ctx.reply(
        '❌ Usage: /approve @username or /approve telegram_id\n\n' +
        'Example: /approve @PrakharBizz'
      );
    }

    const input = args[0];
    
    try {
      // Find user by username or telegram ID
      let user;
      if (input.startsWith('@')) {
        const username = input.slice(1);
        user = await prisma.user.findFirst({
          where: { telegramUsername: username },
        });
      } else {
        user = await prisma.user.findUnique({
          where: { telegramId: BigInt(input) },
        });
      }

      if (!user) {
        return ctx.reply(`❌ User not found: ${input}`);
      }

      // Set expiry to 30 days from now
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      // Update user to premium
      await prisma.user.update({
        where: { id: user.id },
        data: {
          plan: 'premium',
          planExpiresAt: expiresAt,
        },
      });

      // Notify the user
      const message = `🎉 <b>Congratulations!</b>

You've been upgraded to <b>GitWatch Premium</b> by @subhdotsol the great! ✨

<b>Your new benefits:</b>
• Watch up to <b>5 repositories</b>
• Priority notifications
• Premium support

<b>Plan expires:</b> ${expiresAt.toDateString()}

Thank you for being part of GitWatch! 🚀

Use /status to see your updated plan.`;

      try {
        await ctx.telegram.sendMessage(user.telegramId.toString(), message, {
          parse_mode: 'HTML',
        });
      } catch (e) {
        // User might have blocked the bot
      }

      await ctx.reply(
        `✅ Upgraded @${user.telegramUsername || user.telegramId} to Premium!\n` +
        `Expires: ${expiresAt.toDateString()}`
      );
    } catch (error) {
      console.error('Error in approve command:', error);
      await ctx.reply('❌ An error occurred. Please try again.');
    }
  });

  // /downgrade @username or /downgrade 123456789
  bot.command('downgrade', async (ctx) => {
    const telegramId = BigInt(ctx.from.id);
    
    if (!checkAdmin(telegramId)) {
      return ctx.reply('❌ This command is only available to admins.');
    }

    const args = ctx.message.text.split(' ').slice(1);
    if (args.length === 0) {
      return ctx.reply(
        '❌ Usage: /downgrade @username [reason]\n\n' +
        'Example: /downgrade @user Policy violation'
      );
    }

    const input = args[0];
    const reason = args.slice(1).join(' ') || 'Policy violation';
    
    try {
      // Find user
      let user;
      if (input.startsWith('@')) {
        const username = input.slice(1);
        user = await prisma.user.findFirst({
          where: { telegramUsername: username },
        });
      } else {
        user = await prisma.user.findUnique({
          where: { telegramId: BigInt(input) },
        });
      }

      if (!user) {
        return ctx.reply(`❌ User not found: ${input}`);
      }

      if (user.plan === 'free') {
        return ctx.reply(`⚠️ User @${user.telegramUsername} is already on Free plan.`);
      }

      // Downgrade to free
      await prisma.user.update({
        where: { id: user.id },
        data: {
          plan: 'free',
          planExpiresAt: null,
        },
      });

      // Notify the user
      const message = `⚠️ <b>Premium Subscription Removed</b>

Your GitWatch Premium subscription has been removed.

<b>Reason:</b> ${reason}

You are now on the <b>Free plan</b> (2 repos max).

If you have more than 2 watched repos, you'll need to /unwatch some or upgrade again with /upgrade.

Questions? Reply to this message.`;

      try {
        await ctx.telegram.sendMessage(user.telegramId.toString(), message, {
          parse_mode: 'HTML',
        });
      } catch (e) {
        // User might have blocked the bot
      }

      await ctx.reply(`✅ Downgraded @${user.telegramUsername || user.telegramId} to Free.`);
    } catch (error) {
      console.error('Error in downgrade command:', error);
      await ctx.reply('❌ An error occurred. Please try again.');
    }
  });

  // /stats - Platform statistics
  bot.command('stats', async (ctx) => {
    const telegramId = BigInt(ctx.from.id);
    
    if (!checkAdmin(telegramId)) {
      return ctx.reply('❌ This command is only available to admins.');
    }

    try {
      const stats = await getPlatformStats();
      
      // Get premium user count
      const premiumUsers = await prisma.user.count({
        where: { plan: 'premium' },
      });

      await ctx.reply(
        `📊 <b>GitWatch Platform Stats</b>\n\n` +
        `<b>Users:</b> ${stats.totalUsers}/${stats.maxUsers} (${stats.usagePercent}%)\n` +
        `<b>Premium Users:</b> ${premiumUsers}\n` +
        `<b>Free Users:</b> ${stats.totalUsers - premiumUsers}\n\n` +
        `<b>Repositories:</b>\n` +
        `  Total: ${stats.totalRepos}\n` +
        `  Active: ${stats.activeRepos}`,
        { parse_mode: 'HTML' }
      );
    } catch (error) {
      console.error('Error in stats command:', error);
      await ctx.reply('❌ An error occurred. Please try again.');
    }
  });

  // /reject @username reason
  bot.command('reject', async (ctx) => {
    const telegramId = BigInt(ctx.from.id);
    
    if (!checkAdmin(telegramId)) {
      return ctx.reply('❌ This command is only available to admins.');
    }

    const args = ctx.message.text.split(' ').slice(1);
    if (args.length < 2) {
      return ctx.reply(
        '❌ Usage: /reject @username reason\n\n' +
        'Example: /reject @user Payment not received'
      );
    }

    const input = args[0];
    const reason = args.slice(1).join(' ');
    
    try {
      // Find user
      let user;
      if (input.startsWith('@')) {
        const username = input.slice(1);
        user = await prisma.user.findFirst({
          where: { telegramUsername: username },
        });
      } else {
        user = await prisma.user.findUnique({
          where: { telegramId: BigInt(input) },
        });
      }

      if (!user) {
        return ctx.reply(`❌ User not found: ${input}`);
      }

      // Notify the user
      const message = `❌ <b>Payment Rejected</b>

Your payment/upgrade request has been rejected.

<b>Reason:</b> ${reason}

If you believe this is an error, please contact us.

You can try again with /upgrade.`;

      try {
        await ctx.telegram.sendMessage(user.telegramId.toString(), message, {
          parse_mode: 'HTML',
        });
      } catch (e) {
        // User might have blocked the bot
      }

      await ctx.reply(`✅ Rejection sent to @${user.telegramUsername || user.telegramId}`);
    } catch (error) {
      console.error('Error in reject command:', error);
      await ctx.reply('❌ An error occurred. Please try again.');
    }
  });
}
