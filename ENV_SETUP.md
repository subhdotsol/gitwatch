# ============================================
# GitWatch Environment Configuration
# ============================================
# This is a template to help you set up your .env file
# Copy the values below to your .env file

# ============================================
# TELEGRAM BOT (REQUIRED)
# ============================================
# Get this from @BotFather on Telegram
# Steps:
#   1. Open Telegram and search for @BotFather
#   2. Send /newbot command
#   3. Follow prompts to create your bot
#   4. Copy the token provided
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz-EXAMPLE

# ============================================
# GITHUB OAUTH (REQUIRED)
# ============================================
# Create a GitHub OAuth App:
#   1. Go to https://github.com/settings/developers
#   2. Click "New OAuth App"
#   3. Fill in:
#      - Application name: GitWatch (or your choice)
#      - Homepage URL: http://localhost:3000
#      - Callback URL: http://localhost:3000/api/auth/github/callback
#   4. Copy Client ID and generate Client Secret

GITHUB_CLIENT_ID=Ov23liXXXXXXXXXXXXXX
GITHUB_CLIENT_SECRET=your_github_client_secret_here

# Generate a random secret for webhook verification
# Run: openssl rand -base64 32
GITHUB_WEBHOOK_SECRET=your_random_webhook_secret_here_use_openssl_command_above

# ============================================
# APPLICATION URL (REQUIRED)
# ============================================
# For local development, use:
NEXT_PUBLIC_APP_URL=http://localhost:3000

# For production (after deploying to Vercel), update to:
# NEXT_PUBLIC_APP_URL=https://your-project.vercel.app

# ============================================
# DATABASE (REQUIRED)
# ============================================
# Option 1: Local PostgreSQL
# DATABASE_URL=postgresql://localhost:5432/gitwatch

# Option 2: Neon (Cloud PostgreSQL - Recommended)
# Get this from https://neon.tech (free tier available)
DATABASE_URL=postgresql://user:password@host.neon.tech/neondb?sslmode=require

# Option 3: Supabase
# DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres

# ============================================
# CRON SECRET (REQUIRED)
# ============================================
# Used to authenticate cron job requests
# Generate with: openssl rand -base64 32
CRON_SECRET=your_random_cron_secret_here_use_openssl_command_above

# ============================================
# ADMIN (OPTIONAL)
# ============================================
# Your Telegram user ID for admin commands
# To get your Telegram ID:
#   1. Message @userinfobot on Telegram
#   2. It will reply with your user ID
ADMIN_TELEGRAM_ID=123456789

# ============================================
# PAYMENT OPTIONS (OPTIONAL - for premium features)
# ============================================
# These are optional and only needed if you want to enable payments

# USDC Payments (Solana)
USDC_WALLET_ADDRESS=

# Bank Transfer (India)
BANK_ACCOUNT_NAME=
BANK_ACCOUNT_NUMBER=
BANK_IFSC=
UPI_ID=
