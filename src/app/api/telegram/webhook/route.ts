import { NextRequest, NextResponse } from 'next/server';
import { Telegraf } from 'telegraf';
import { registerWatchCommand } from '../../../../../lib/telegram/commands/watch';
import { registerHelpCommand } from '../../../../../lib/telegram/commands/help';
import { registerWatchlistCommand } from '../../../../../lib/telegram/commands/watchlist';
import { registerDisconnectCommand } from '../../../../../lib/telegram/commands/disconnect';
import { registerUnwatchCommand } from '../../../../../lib/telegram/commands/unwatch';

// Initialize bot (without launch - we'll handle updates via webhook)
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

// Register commands
bot.start(async (ctx) => {
  const { prisma } = await import('../../../../../lib/prisma');
  const telegramId = BigInt(ctx.from?.id);
  const username = ctx.from?.username || ctx.from?.first_name;

  await prisma.user.upsert({
    where: { telegramId },
    update: { telegramUsername: username },
    create: {
      telegramId,
      telegramUsername: username,
    },
  });

  // Remove trailing slash from app URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || '';
  const authUrl = `${appUrl}/api/auth/github?telegram_id=${telegramId}`;
  
  await ctx.reply(
    `👋 Welcome to GitWatch, ${username}!\n\n` +
    `To get started, connect your GitHub account:\n\n` +
    `🔗 [Authorize GitHub](${authUrl})\n\n` +
    `Once connected, you can:\n` +
    `• Add repositories to watch\n` +
    `• Get real-time notifications\n` +
    `• Manage issues directly from Telegram`,
    { parse_mode: 'Markdown' }
  );
});

registerWatchCommand(bot);
registerHelpCommand(bot);
registerWatchlistCommand(bot);
registerDisconnectCommand(bot);
registerUnwatchCommand(bot);

// Set bot commands for UI suggestions
bot.telegram.setMyCommands([
  { command: 'start', description: 'Connect your GitHub account' },
  { command: 'watch', description: 'Watch a repository' },
  { command: 'watchlist', description: 'View all watched repositories' },
  { command: 'unwatch', description: 'Stop watching a repository' },
  { command: 'disconnect', description: 'Disconnect GitHub and remove all watches' },
  { command: 'help', description: 'Show help message' },
]);

// Export bot
export { bot };

// Webhook handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Process the update
    await bot.handleUpdate(body);
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error processing Telegram webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
