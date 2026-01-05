#!/usr/bin/env npx tsx

/**
 * Upgrade a user to Premium and notify them
 * 
 * Usage: npx tsx scripts/upgrade-user.ts @username
 *        npx tsx scripts/upgrade-user.ts 123456789  (telegram ID)
 */

import { config } from 'dotenv';
import { Telegraf } from 'telegraf';

// Load environment variables
config({ path: '.env' });
config({ path: '.env.local' });

async function main() {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  
  const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

  // Get username from command line
  const input = process.argv[2];
  
  if (!input) {
    console.log('Usage: npx tsx scripts/upgrade-user.ts @username');
    console.log('       npx tsx scripts/upgrade-user.ts 123456789');
    process.exit(1);
  }

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
    console.log(`❌ User not found: ${input}`);
    process.exit(1);
  }

  console.log(`\n👤 Found user:`);
  console.log(`   Telegram: @${user.telegramUsername || 'N/A'}`);
  console.log(`   GitHub: @${user.githubUsername || 'N/A'}`);
  console.log(`   Current plan: ${user.plan}`);
  console.log('');

  if (user.plan === 'premium') {
    console.log('⚠️  User is already Premium!');
    
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const confirm = await new Promise<string>((resolve) => {
      rl.question('Extend their plan by 30 days? (yes/no): ', resolve);
    });
    rl.close();

    if (confirm.toLowerCase() !== 'yes') {
      console.log('❌ Cancelled.');
      process.exit(0);
    }
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

  console.log(`✅ Upgraded to Premium (expires: ${expiresAt.toDateString()})`);

  // Send notification to user
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
    await bot.telegram.sendMessage(user.telegramId.toString(), message, {
      parse_mode: 'HTML',
    });
    console.log(`📤 Notification sent to @${user.telegramUsername}`);
  } catch (error: any) {
    console.log(`❌ Failed to notify user: ${error.message}`);
  }

  await prisma.$disconnect();
}

main().catch(console.error);


// # By username
// npx tsx scripts/upgrade-user.ts @PrakharBizz
// # By Telegram ID
// npx tsx scripts/upgrade-user.ts 123456789