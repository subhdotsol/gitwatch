#!/bin/bash

# GitWatch Quick Setup Script
# This script automates the initial setup process

set -e  # Exit on error

echo "🚀 GitWatch Setup Script"
echo "========================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node --version) detected"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Generate secrets
echo "🔐 Generating secrets..."
WEBHOOK_SECRET=$(openssl rand -base64 32)
CRON_SECRET=$(openssl rand -base64 32)

echo ""
echo "✅ Generated secrets (save these!):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "GITHUB_WEBHOOK_SECRET=$WEBHOOK_SECRET"
echo "CRON_SECRET=$CRON_SECRET"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Create .env file
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cat > .env << EOF
# Telegram Bot (Get from @BotFather)
TELEGRAM_BOT_TOKEN=

# GitHub OAuth (Get from https://github.com/settings/developers)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_WEBHOOK_SECRET=$WEBHOOK_SECRET

# App URL (for local development)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database (use local PostgreSQL or Neon)
DATABASE_URL=postgresql://localhost:5432/gitwatch

# Cron Secret (auto-generated)
CRON_SECRET=$CRON_SECRET

# Admin (optional - your Telegram user ID)
ADMIN_TELEGRAM_ID=
EOF
    echo "✅ .env file created!"
else
    echo "⚠️  .env file already exists, skipping creation..."
fi

echo ""

# Generate Prisma client
echo "🗄️  Generating Prisma client..."
npx prisma generate
echo "✅ Prisma client generated"
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1️⃣  Fill in your .env file with:"
echo "   • TELEGRAM_BOT_TOKEN (from @BotFather)"
echo "   • GITHUB_CLIENT_ID (from GitHub OAuth app)"
echo "   • GITHUB_CLIENT_SECRET (from GitHub OAuth app)"
echo "   • DATABASE_URL (if not using local PostgreSQL)"
echo ""
echo "2️⃣  Set up your database:"
echo "   npx prisma migrate dev"
echo ""
echo "3️⃣  Start the development server:"
echo "   npm run dev"
echo ""
echo "4️⃣  Set up ngrok for local webhook testing:"
echo "   brew install ngrok"
echo "   ngrok http 3000"
echo ""
echo "📚 For detailed instructions, see:"
echo "   • SETUP_COMMANDS.md"
echo "   • PROJECT_GUIDE.md"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
