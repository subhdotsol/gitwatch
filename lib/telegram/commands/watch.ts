import { Telegraf, Markup } from 'telegraf';
import { prisma } from '../../prisma';

export function registerWatchCommand(bot: Telegraf) {
  bot.command('watch', async (ctx) => {
    const telegramId = BigInt(ctx.from.id);

    try {
      // Get user from database
      let user = await prisma.user.findUnique({
        where: { telegramId },
      });

      if (!user?.githubToken) {
        return ctx.reply(
          '⚠️ Please connect your GitHub account first using /start'
        );
      }

      // Parse repo from command: /watch owner/repo OR /watch https://github.com/owner/repo
      const match = ctx.message.text.match(/\/watch\s+(.+)/);
      if (!match) {
        return ctx.reply(
          '❌ Invalid format. Use one of:\n' +
          '• /watch owner/repo\n' +
          '• /watch https://github.com/owner/repo\n\n' +
          'Example: /watch facebook/react'
        );
      }

      let owner: string;
      let repo: string;

      const input = match[1].trim();
      
      // Check if input is a GitHub URL
      const urlMatch = input.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([^\/]+)\/([^\/\s]+)/);
      if (urlMatch) {
        // Extract from URL: https://github.com/owner/repo
        owner = urlMatch[1];
        repo = urlMatch[2];
      } else {
        // Parse as owner/repo format
        const parts = input.split('/');
        if (parts.length !== 2) {
          return ctx.reply(
            '❌ Invalid repository format. Use one of:\n' +
            '• /watch owner/repo\n' +
            '• /watch https://github.com/owner/repo'
          );
        }
        owner = parts[0];
        repo = parts[1];
      }

      // Clean up repo name (remove .git suffix if present)
      repo = repo.replace(/\.git$/, '');

      if (!owner || !repo) {
        return ctx.reply('❌ Invalid repository format. Please check the owner and repo name.');
      }

      // Send immediate acknowledgment
      const processingMsg = await ctx.reply(`Processing **${owner}/${repo}**...`, {
        parse_mode: 'Markdown',
      });

      try {
        // Check if already watching
        const existing = await prisma.watchedRepo.findUnique({
          where: {
            userId_owner_repo: {
              userId: user.id,
              owner,
              repo,
            },
          },
        });

        if (existing) {
          await ctx.telegram.editMessageText(
            ctx.chat!.id,
            processingMsg.message_id,
            undefined,
            `**Already watching ${owner}/${repo}**`,
            {
              parse_mode: 'Markdown',
              ...Markup.inlineKeyboard([
                [Markup.button.callback('Manage Notifications', `manage:${existing.id}`)]
              ])
            }
          );
          return;
        }

        // Verify repo exists and get repo data
        const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
          headers: {
            'Authorization': `Bearer ${user.githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        });

        if (!repoResponse.ok) {
          if (repoResponse.status === 404) {
            await ctx.telegram.editMessageText(
              ctx.chat!.id,
              processingMsg.message_id,
              undefined,
              '❌ Repository not found or is private. GitWatch only supports public repositories.'
            );
            return;
          }
          await ctx.telegram.editMessageText(
            ctx.chat!.id,
            processingMsg.message_id,
            undefined,
            '❌ Failed to access repository. Please try again.'
          );
          return;
        }

        const repoData = await repoResponse.json();

        // Check if repo is private
        if (repoData.private) {
          await ctx.telegram.editMessageText(
            ctx.chat!.id,
            processingMsg.message_id,
            undefined,
            '❌ This is a private repository. GitWatch only supports watching public repositories.'
          );
          return;
        }

        // Check if user has admin/push access (required for webhooks)
        const hasAdminAccess = repoData.permissions?.admin || repoData.permissions?.push;

        let webhookId: bigint | null = null;
        let watchMode: 'webhook' | 'polling' = 'polling';

        if (hasAdminAccess) {
          // Try to create webhook for repos with admin access
          try {
            const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/github`;
            const webhookResponse = await fetch(
              `https://api.github.com/repos/${owner}/${repo}/hooks`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${user.githubToken}`,
                  'Accept': 'application/vnd.github.v3+json',
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  name: 'web',
                  active: true,
                  events: ['issues', 'pull_request', 'push', 'issue_comment'],
                  config: {
                    url: webhookUrl,
                    content_type: 'json',
                    secret: process.env.GITHUB_WEBHOOK_SECRET,
                  },
                }),
              }
            );

            if (webhookResponse.ok) {
              const webhook = await webhookResponse.json();
              webhookId = BigInt(webhook.id);
              watchMode = 'webhook';
            } else {
              console.log(`Webhook creation failed for ${owner}/${repo}, falling back to polling`);
            }
          } catch (error) {
            console.error('Error creating webhook:', error);
            // Fall back to polling mode
          }
        } else {
          // User doesn't have admin access - use polling mode
          console.log(`User lacks admin access for ${owner}/${repo}, using polling mode`);
        }


        // Save to database
        const watchedRepo = await prisma.watchedRepo.create({
          data: {
            userId: user.id,
            owner,
            repo,
            webhookId,
            watchMode,
            active: true,
            notifyIssues: true,
            notifyPRs: true,
            notifyCommits: true,
            notifyComments: true,
          },
        });

        // Send success message with preferences keyboard
        const modeText = watchMode === 'webhook' ? 'Real-time' : 'Polling';
        const message = `**Now watching ${owner}/${repo}** (${modeText})\n\n` +
                        `Select notification preferences below:`;

        await ctx.telegram.editMessageText(
          ctx.chat!.id,
          processingMsg.message_id,
          undefined,
          message,
          {
            parse_mode: 'Markdown',
            ...getPreferencesKeyboard(watchedRepo)
          }
        );

      } catch (error) {
        console.error('Error watching repo:', error);
        await ctx.telegram.editMessageText(
          ctx.chat!.id,
          processingMsg.message_id,
          undefined,
          'An error occurred. Please try again.'
        );
      }
    } catch (error) {
      console.error('Error watching repo:', error);
      await ctx.reply('An error occurred. Please try again.');
    }
  });

  // Handle preference toggles
  bot.action(/^notify:(issues|prs|commits|comments):(.+)$/, async (ctx) => {
    const [, type, repoId] = ctx.match;
    
    try {
      const repo = await prisma.watchedRepo.findUnique({
        where: { id: repoId },
      });

      if (!repo) {
        return ctx.answerCbQuery('Repository not found');
      }

      // Update preference
      const updateData: any = {};
      const field = `notify${type.charAt(0).toUpperCase() + type.slice(1).replace('prs', 'PRs')}` as any;
      // Special case for PRs because of naming
      const finalField = type === 'prs' ? 'notifyPRs' : field;
      
      updateData[finalField] = !repo[finalField as keyof typeof repo];

      const updated = await prisma.watchedRepo.update({
        where: { id: repoId },
        data: updateData,
      });

      // Update message with new keyboard
      await ctx.editMessageReplyMarkup(getPreferencesKeyboard(updated).reply_markup);
      
      const status = updated[finalField as keyof typeof updated] ? 'Enabled' : 'Disabled';
      await ctx.answerCbQuery(`${type.charAt(0).toUpperCase() + type.slice(1)} notifications ${status}`);

    } catch (error) {
      console.error('Error toggling preference:', error);
      await ctx.answerCbQuery('Failed to update preference');
    }
  });

  // Handle manage button from existing repo
  bot.action(/^manage:(.+)$/, async (ctx) => {
    const repoId = ctx.match[1];
    try {
      const repo = await prisma.watchedRepo.findUnique({
        where: { id: repoId },
      });

      if (!repo) {
        return ctx.answerCbQuery('Repository not found');
      }

      await ctx.editMessageText(
        `**Notification Preferences**\nRepo: ${repo.owner}/${repo.repo}\n\nSelect to toggle:`,
        {
          parse_mode: 'Markdown',
          ...getPreferencesKeyboard(repo)
        }
      );
    } catch (error) {
      console.error('Error opening management menu:', error);
      await ctx.answerCbQuery('Failed to open settings');
    }
  });
}

function getPreferencesKeyboard(repo: any) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(`${repo.notifyIssues ? '✅' : '❌'} Issues`, `notify:issues:${repo.id}`),
      Markup.button.callback(`${repo.notifyPRs ? '✅' : '❌'} PRs`, `notify:prs:${repo.id}`)
    ],
    [
      Markup.button.callback(`${repo.notifyCommits ? '✅' : '❌'} Commits`, `notify:commits:${repo.id}`),
      Markup.button.callback(`${repo.notifyComments ? '✅' : '❌'} Comments`, `notify:comments:${repo.id}`)
    ]
  ]);
}
