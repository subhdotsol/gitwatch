# GitWatch - Quick Setup Commands

## 🚀 Complete Setup Guide

Follow these commands in order to get GitWatch running on your machine.

---

## Step 1: Install Dependencies

```bash
npm install
```

---

## Step 2: Set Up Environment Variables

### Option A: Quick Setup (Copy and Edit)

```bash
# Copy the example file
cp .env.example .env

# Edit the .env file with your favorite editor
nano .env
# or
code .env
```

### Option B: Generate Secrets First

```bash
# Generate GITHUB_WEBHOOK_SECRET
echo "GITHUB_WEBHOOK_SECRET=$(openssl rand -base64 32)"

# Generate CRON_SECRET
echo "CRON_SECRET=$(openssl rand -base64 32)"
```

### Required Environment Variables

Fill in your `.env` file with these values:

```env
# 1. TELEGRAM BOT TOKEN
# Get from @BotFather on Telegram
TELEGRAM_BOT_TOKEN=your_bot_token_here

# 2. GITHUB OAUTH CREDENTIALS
# Get from https://github.com/settings/developers
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
GITHUB_WEBHOOK_SECRET=paste_generated_secret_here

# 3. APP URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# 4. DATABASE URL
DATABASE_URL=postgresql://localhost:5432/gitwatch

# 5. CRON SECRET
CRON_SECRET=paste_generated_secret_here
```

---

## Step 3: Set Up Database

### Option A: Local PostgreSQL

```bash
# Install PostgreSQL (macOS)
brew install postgresql@16

# Start PostgreSQL service
brew services start postgresql@16

# Create database
createdb gitwatch

# Your DATABASE_URL will be:
# DATABASE_URL=postgresql://localhost:5432/gitwatch
```

### Option B: Neon (Cloud PostgreSQL - Recommended)

```bash
# 1. Go to https://neon.tech
# 2. Create free account
# 3. Create new project
# 4. Copy connection string
# 5. Paste into .env as DATABASE_URL
```

---

## Step 4: Initialize Database

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# (Optional) View database in browser
npx prisma studio
```

---

## Step 5: Create Telegram Bot

```bash
# 1. Open Telegram
# 2. Search for @BotFather
# 3. Send: /newbot
# 4. Follow prompts
# 5. Copy token to .env as TELEGRAM_BOT_TOKEN
```

---

## Step 6: Create GitHub OAuth App

```bash
# 1. Go to: https://github.com/settings/developers
# 2. Click "New OAuth App"
# 3. Fill in:
#    - Application name: GitWatch
#    - Homepage URL: http://localhost:3000
#    - Callback URL: http://localhost:3000/api/auth/github/callback
# 4. Copy Client ID and Secret to .env
```

---

## Step 7: Start Development Server

```bash
npm run dev
```

The app will be available at: **http://localhost:3000**

---

## Step 8: Set Up Telegram Webhook (for local development)

### Install ngrok (for exposing localhost)

```bash
# Install ngrok
brew install ngrok

# Start ngrok tunnel
ngrok http 3000
```

### Set Telegram Webhook

```bash
# Copy the HTTPS URL from ngrok (e.g., https://abc123.ngrok.io)
# Then run:

curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://YOUR_NGROK_URL.ngrok.io/api/telegram/webhook"}'
```

**Expected response:**
```json
{"ok":true,"result":true,"description":"Webhook was set"}
```

---

## Step 9: Test the Bot

```bash
# 1. Open Telegram
# 2. Find your bot
# 3. Send: /start
# 4. Click "Connect GitHub"
# 5. Complete OAuth
# 6. Try: /watch facebook/react
# 7. Check: /watchlist
```

---

## 🛠️ Useful Commands

### Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

### Database

```bash
# Generate Prisma client
npx prisma generate

# Create migration
npx prisma migrate dev --name description

# Apply migrations
npx prisma migrate deploy

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio
```

### Testing

```bash
# Test webhook endpoint
./test-webhook.sh

# Test polling endpoint
./test-polling.sh

# Debug polling
./debug-polling.sh

# Check Telegram webhook status
curl https://api.telegram.org/bot<YOUR_TOKEN>/getWebhookInfo
```

---

## 🐛 Troubleshooting

### Bot not responding?

```bash
# Check webhook status
curl https://api.telegram.org/bot<YOUR_TOKEN>/getWebhookInfo

# Delete webhook (use polling instead)
curl https://api.telegram.org/bot<YOUR_TOKEN>/deleteWebhook
```

### Database connection error?

```bash
# Test connection
npx prisma db pull

# Check if PostgreSQL is running
brew services list | grep postgresql
```

### OAuth not working?

```bash
# Verify callback URL matches in GitHub OAuth app settings
# Should be: http://localhost:3000/api/auth/github/callback
```

---

## 📦 All Commands in One Script

```bash
#!/bin/bash

# GitWatch Quick Setup Script

echo "🚀 Setting up GitWatch..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate secrets
echo "🔐 Generating secrets..."
WEBHOOK_SECRET=$(openssl rand -base64 32)
CRON_SECRET=$(openssl rand -base64 32)

echo ""
echo "✅ Generated secrets:"
echo "GITHUB_WEBHOOK_SECRET=$WEBHOOK_SECRET"
echo "CRON_SECRET=$CRON_SECRET"
echo ""
echo "⚠️  Add these to your .env file!"
echo ""

# Copy env example
if [ ! -f .env ]; then
  echo "📝 Creating .env file..."
  cp .env.example .env
  echo "✅ .env created! Please fill in your values."
else
  echo "⚠️  .env already exists, skipping..."
fi

# Generate Prisma client
echo "🗄️  Generating Prisma client..."
npx prisma generate

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Fill in your .env file with:"
echo "   - TELEGRAM_BOT_TOKEN"
echo "   - GITHUB_CLIENT_ID"
echo "   - GITHUB_CLIENT_SECRET"
echo "   - DATABASE_URL"
echo "   - The generated secrets above"
echo ""
echo "2. Run database migrations:"
echo "   npx prisma migrate dev"
echo ""
echo "3. Start the dev server:"
echo "   npm run dev"
echo ""
```

Save this as `setup.sh` and run:

```bash
chmod +x setup.sh
./setup.sh
```

---

## 🌐 Production Deployment (Vercel)

See [DEPLOYMENT.md](markdowns/DEPLOYMENT.md) for complete deployment guide.

Quick commands:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Then redeploy
vercel --prod
```

---

**Need help?** Check [PROJECT_GUIDE.md](PROJECT_GUIDE.md) for detailed documentation.
