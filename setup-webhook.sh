#!/bin/bash

# Set Telegram Webhook for Vercel Deployment

echo "🔧 Setting up Telegram Webhook"
echo "=============================="
echo ""

# Load environment variables
source .env.local 2>/dev/null || source .env 2>/dev/null

if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
  echo "❌ TELEGRAM_BOT_TOKEN not found in .env"
  exit 1
fi

# Get Vercel URL from user
echo "📝 Enter your Vercel deployment URL (e.g., gitwatch.vercel.app):"
read -r VERCEL_URL

if [ -z "$VERCEL_URL" ]; then
  echo "❌ No URL provided"
  exit 1
fi

# Remove https:// if user included it, and remove trailing slashes
VERCEL_URL=$(echo "$VERCEL_URL" | sed 's|https://||g' | sed 's|http://||g' | sed 's|/$||g')

WEBHOOK_URL="https://${VERCEL_URL}/api/telegram/webhook"

echo ""
echo "🔗 Setting webhook to: $WEBHOOK_URL"
echo ""

# Set the webhook
response=$(curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook?url=${WEBHOOK_URL}")

echo "Response from Telegram:"
echo "$response" | jq '.' 2>/dev/null || echo "$response"

# Check if successful
if echo "$response" | grep -q '"ok":true'; then
  echo ""
  echo "✅ Webhook set successfully!"
  echo ""
  echo "📋 Next steps:"
  echo "1. Make sure NEXT_PUBLIC_APP_URL is set in Vercel environment variables"
  echo "2. Make sure DATABASE_URL is set in Vercel environment variables"
  echo "3. Test by sending /start to your bot on Telegram"
else
  echo ""
  echo "❌ Failed to set webhook"
  echo "Check the error message above"
fi

echo ""
echo "🔍 Current webhook info:"
curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo" | jq '.' 2>/dev/null
