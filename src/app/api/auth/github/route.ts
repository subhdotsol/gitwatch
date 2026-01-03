import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const telegramId = searchParams.get('telegram_id');

  if (!telegramId) {
    return NextResponse.json({ error: 'Missing telegram_id' }, { status: 400 });
  }

  // Store telegram_id in session/cookie for callback
  const state = Buffer.from(JSON.stringify({ telegramId })).toString('base64');

  const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
  githubAuthUrl.searchParams.set('client_id', process.env.GITHUB_CLIENT_ID!);
  githubAuthUrl.searchParams.set('redirect_uri', `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/github/callback`);
  githubAuthUrl.searchParams.set('scope', 'repo,admin:repo_hook');
  githubAuthUrl.searchParams.set('state', state);

  return NextResponse.redirect(githubAuthUrl.toString());
}
