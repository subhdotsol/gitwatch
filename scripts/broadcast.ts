#!/usr/bin/env npx tsx

/**
 * Broadcast a message to all GitWatch users
 * 
 * Usage: npx tsx scripts/broadcast.ts
 */

import { config } from 'dotenv';
import { Telegraf } from 'telegraf';

// Load environment variables
config({ path: '.env' });
config({ path: '.env.local' });

// Dynamically import Prisma (to avoid issues with ESM)
async function main() {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  
  const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

  // The announcement message
  const message = `📢 <b>Important Update from GitWatch</b>

Hey there! 👋

We're excited to announce that GitWatch is introducing <b>Premium Plans</b> to help us keep improving!

<b>What's changing?</b>
• Free plan: Watch up to <b>2 repositories</b>
• Premium plan: Watch up to <b>5 repositories</b> for just <b>$5/month</b>

<b>Current users:</b>
You're currently on the <b>Free Trial</b>. If you have more than 2 repos, you'll need to upgrade to keep all of them active.

<b>How to upgrade:</b>
Use /upgrade to see payment options (USDC or Bank Transfer)

<b>Questions?</b>
Reply to this message or use /help

Thank you for being part of GitWatch! 🚀`;

  console.log('📢 Broadcasting message to all users...\n');
  console.log('Message preview:');
  console.log('─'.repeat(50));
  console.log(message.replace(/<[^>]+>/g, '')); // Strip HTML for preview
  console.log('─'.repeat(50));
  console.log('\n');

  // Ask for confirmation
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const confirm = await new Promise<string>((resolve) => {
    rl.question('Send this message to all users? (yes/no): ', resolve);
  });
  rl.close();

  if (confirm.toLowerCase() !== 'yes') {
    console.log('❌ Broadcast cancelled.');
    process.exit(0);
  }

  // Get all users
  const users = await prisma.user.findMany({
    select: {
      id: true,
      telegramId: true,
      telegramUsername: true,
    },
  });

  console.log(`\n📤 Sending to ${users.length} users...\n`);

  let sent = 0;
  let failed = 0;

  for (const user of users) {
    try {
      await bot.telegram.sendMessage(user.telegramId.toString(), message, {
        parse_mode: 'HTML',
      });
      console.log(`✅ Sent to @${user.telegramUsername || user.telegramId}`);
      sent++;
      
      // Rate limit: Telegram allows 30 messages/second
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error: any) {
      console.log(`❌ Failed for @${user.telegramUsername || user.telegramId}: ${error.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Broadcast complete!`);
  console.log(`   ✅ Sent: ${sent}`);
  console.log(`   ❌ Failed: ${failed}`);

  await prisma.$disconnect();
}

main().catch(console.error);
