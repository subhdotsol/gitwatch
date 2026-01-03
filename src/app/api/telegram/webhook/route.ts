import { NextRequest, NextResponse } from 'next/server';
import { Telegraf } from 'telegraf';
import { registerWatchCommand } from '../../../../../lib/telegram/commands/watch';

// Initialize bot (without launch - we'll handle updates via webhook)
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

// In-memory user storage (use database in production)
const users = new Map<number, { telegramId: number; githubToken?: string }>();

// Register commands
bot.start(async (ctx) => {
  const telegramId = ctx.from?.id;
  const username = ctx.from?.username || ctx.from?.first_name;

  if (telegramId && !users.has(telegramId)) {
    users.set(telegramId, { telegramId });
  }

  const authUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/github?telegram_id=${telegramId}`;
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

registerWatchCommand(bot, users);

// Export for use in callback route
export { bot, users };

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
