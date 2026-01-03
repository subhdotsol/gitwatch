import { Telegraf } from "telegraf";
import { registerWatchCommand } from "./commands/watch";
import dotenv from "dotenv";

// Load environment variables from .env
dotenv.config({ path: '.env' });

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

// store mapping of telegram use database in production
const users = new Map<number, { telegramId: number; githubToken?: string }>();


bot.start(async (ctx) => {
    const telegramId = ctx.from?.id;
    const username = ctx.from?.username || ctx.from?.first_name;

    // store the user 
    if (!users.has(telegramId)) {
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
})

// Register commands
registerWatchCommand(bot, users);

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

export { bot, users };
