#!/bin/bash

echo "🤖 GitWatch Bot Startup Check"
echo "=============================="
echo ""

# Check environment variables
echo "1️⃣ Checking environment variables..."
if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
  source .env.local 2>/dev/null || source .env 2>/dev/null
fi

if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
  echo "❌ TELEGRAM_BOT_TOKEN not found"
  exit 1
fi
echo "✅ TELEGRAM_BOT_TOKEN found"

if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL not found"
  exit 1
fi
echo "✅ DATABASE_URL found"

if [ -z "$NEXT_PUBLIC_APP_URL" ]; then
  echo "⚠️  NEXT_PUBLIC_APP_URL not found (will use default)"
else
  echo "✅ NEXT_PUBLIC_APP_URL: $NEXT_PUBLIC_APP_URL"
fi

echo ""
echo "2️⃣ Checking database connection..."
npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ Database connection working"
else
  echo "❌ Database connection failed"
  echo "   Make sure your DATABASE_URL is correct"
fi

echo ""
echo "3️⃣ Starting bot..."
echo "   Press Ctrl+C to stop"
echo ""

npx tsx lib/telegram/bot.ts
