import { Telegraf } from "telegraf";
import { registerWatchCommand } from "./commands/watch";
import { registerHelpCommand } from "./commands/help";
import { registerWatchlistCommand } from "./commands/watchlist";
import { prisma } from "../prisma";
import dotenv from "dotenv";

// Load environment variables from .env
dotenv.config({ path: '.env' });

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

bot.start(async (ctx) => {
    const telegramId = BigInt(ctx.from?.id);
    const username = ctx.from?.username || ctx.from?.first_name;

    // Create or update user in database
    await prisma.user.upsert({
      where: { telegramId },
      update: { telegramUsername: username },
      create: {
        telegramId,
        telegramUsername: username,
      },
    });

    const authUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/github?telegram_id=${telegramId}`;
    
    await ctx.reply(
      `👋 Welcome to GitWatch, ${username}!\n\n` +
      `To get started, connect your GitHub account.\n\n` +
      `Click this link to authorize:\n${authUrl}\n\n` +
      `Once connected, you can:\n` +
      `• Add repositories to watch\n` +
      `• Get real-time notifications\n` +
      `• Manage issues directly from Telegram`
    );
});

// Register commands
registerWatchCommand(bot);
registerHelpCommand(bot);
registerWatchlistCommand(bot);

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

export { bot };
