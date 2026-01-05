import { Telegraf } from 'telegraf';

export function registerHelpCommand(bot: Telegraf) {
  bot.command('help', async (ctx) => {
    const helpMessage = `
**GitWatch Commands**

**Repository Management**
/watch \`owner/repo\` - Watch a repository
/unwatch \`owner/repo\` - Stop watching
/watchlist - View all watched repos

**Subscription**
/status - Check plan & limit
/upgrade - Get Premium
/confirm - Submit payment proof

**Account**
/start - Connect your GitHub account
/disconnect - Remove GitHub connection

**Info**
/help - Show this help message

**Examples**
\`/watch facebook/react\`
\`/watch your-username/your-repo\`

Tip: After watching a repo, you'll receive notifications for issues, PRs, and commits!`.trim();

    await ctx.reply(helpMessage, { parse_mode: 'Markdown' });
  });
}
