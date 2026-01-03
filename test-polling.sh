#!/bin/bash

# Test Polling Endpoint Locally
# This script simulates the cron job calling the polling endpoint

echo "🧪 Testing GitWatch Polling Endpoint"
echo "======================================"
echo ""

# Load environment variables
source .env 2>/dev/null || source .env.local 2>/dev/null

if [ -z "$CRON_SECRET" ]; then
  echo "❌ CRON_SECRET not found in .env"
  echo "Run: echo 'CRON_SECRET=your-secret-here' >> .env"
  exit 1
fi

echo "✅ CRON_SECRET found"
echo ""

# Check if Next.js dev server is running
if ! curl -s http://localhost:3000 > /dev/null; then
  echo "❌ Next.js dev server not running"
  echo "Start it with: npm run dev"
  exit 1
fi

echo "✅ Next.js dev server is running"
echo ""

# Call the polling endpoint
echo "🔄 Calling /api/cron/poll-repos..."
echo ""

response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/cron/poll-repos)

http_status=$(echo "$response" | grep "HTTP_STATUS" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_STATUS/d')

echo "Status Code: $http_status"
echo "Response:"
echo "$body" | jq '.' 2>/dev/null || echo "$body"
echo ""

if [ "$http_status" = "200" ]; then
  echo "✅ Polling endpoint working!"
  echo ""
  echo "💡 Tip: Watch a repo and wait 5 minutes to receive notifications"
else
  echo "❌ Polling endpoint returned error"
fi
