import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';
import { Telegraf } from 'telegraf';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code || !state) {
    return NextResponse.json({ error: 'Missing code or state' }, { status: 400 });
  }

  // Decode state to get telegram_id
  const { telegramId } = JSON.parse(Buffer.from(state, 'base64').toString());

  // Exchange code for access token
  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;

  if (!accessToken) {
    return NextResponse.json({ error: 'Failed to get access token' }, { status: 500 });
  }

  // Get GitHub user info
  const userResponse = await fetch('https://api.github.com/user', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/vnd.github.v3+json',
    },
  });

  const githubUser = await userResponse.json();

  // Store in database
  await prisma.user.update({
    where: { telegramId: BigInt(telegramId) },
    data: {
      githubToken: accessToken,
      githubUsername: githubUser.login,
    },
  });

  // Notify user on Telegram
  const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
  await bot.telegram.sendMessage(
    telegramId,
    `✅ Successfully connected to GitHub!\n\n` +
    `Account: ${githubUser.login}\n\n` +
    `You can now add repositories to watch using:\n` +
    `/watch owner/repo`
  );

  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth/success`);
}
