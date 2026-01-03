import { Telegraf } from 'telegraf';

export function registerHelpCommand(bot: Telegraf) {
  bot.command('help', async (ctx) => {
    const helpMessage = `
🤖 **GitWatch Bot Commands**

📊 **Repository Management**
/watch \`owner/repo\` - Watch a repository
/unwatch \`owner/repo\` - Stop watching
/watchlist - View all watched repos

🔗 **Account**
/start - Connect your GitHub account
/disconnect - Remove GitHub connection

ℹ️ **Info**
/help - Show this help message

---

**Examples:**
\`/watch facebook/react\`
\`/watch your-username/your-repo\`

💡 **Tip:** After watching a repo, you'll receive notifications for issues, PRs, and commits!
    `.trim();

    await ctx.reply(helpMessage, { parse_mode: 'Markdown' });
  });
}
