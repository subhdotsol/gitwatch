#!/bin/bash

# Debug polling system

echo "🔍 Debugging GitWatch Polling"
echo "=============================="
echo ""

# Get CRON_SECRET
source .env 2>/dev/null
source .env.local 2>/dev/null

if [ -z "$CRON_SECRET" ]; then
  echo "❌ CRON_SECRET not found"
  exit 1
fi

echo "1️⃣ Testing polling endpoint..."
echo ""

response=$(curl -s -H "Authorization: Bearer $CRON_SECRET" \
  "${NEXT_PUBLIC_APP_URL:-https://gitwaatch.vercel.app}/api/cron/poll-repos")

echo "Response:"
echo "$response" | jq '.' 2>/dev/null || echo "$response"

echo ""
echo "2️⃣ Checking Vercel logs..."
echo "Go to: https://vercel.com/your-project/logs"
echo ""
echo "3️⃣ Check watched repos in database"
echo "Run in your database:"
echo "SELECT * FROM watched_repos WHERE active = true;"
