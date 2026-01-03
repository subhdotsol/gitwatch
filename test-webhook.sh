#!/bin/bash

# Test the webhook endpoint directly

echo "🧪 Testing Webhook Endpoint"
echo "============================"
echo ""

# Get Vercel URL
echo "📝 Enter your Vercel URL (e.g., gitwaatch.vercel.app):"
read -r VERCEL_URL

VERCEL_URL=$(echo "$VERCEL_URL" | sed 's|https://||g' | sed 's|http://||g')

echo ""
echo "🔍 Testing: https://${VERCEL_URL}/api/telegram/webhook"
echo ""

# Test with a sample update
response=$(curl -s -X POST "https://${VERCEL_URL}/api/telegram/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "update_id": 123456789,
    "message": {
      "message_id": 1,
      "from": {
        "id": 123456789,
        "is_bot": false,
        "first_name": "Test"
      },
      "chat": {
        "id": 123456789,
        "type": "private"
      },
      "date": 1234567890,
      "text": "/start"
    }
  }')

echo "Response:"
echo "$response" | jq '.' 2>/dev/null || echo "$response"

if echo "$response" | grep -q '"ok":true'; then
  echo ""
  echo "✅ Webhook endpoint is responding"
else
  echo ""
  echo "❌ Webhook endpoint error"
  echo "Check Vercel logs for details"
fi
