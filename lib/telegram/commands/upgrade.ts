import { Telegraf } from 'telegraf';

const USD_PRICE = 5; // $5 per month

/**
 * Fetch current USD to INR exchange rate
 */
async function getINRPrice(): Promise<string> {
  try {
    // Using free exchange rate API
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const data = await response.json();
    const rate = data.rates?.INR || 85; // Fallback to ~85 if API fails
    const inrPrice = Math.round(USD_PRICE * rate);
    return `₹${inrPrice}`;
  } catch (error) {
    // Fallback price if API is down
    return '₹420 (approx)';
  }
}

export function registerUpgradeCommand(bot: Telegraf) {
  bot.command('upgrade', async (ctx) => {
    const inrPrice = await getINRPrice();
    
    await ctx.reply(
      `💎 <b>Upgrade to Premium</b>\n\n` +
      `<b>Pricing:</b>\n` +
      `• $${USD_PRICE}/month (USDC on Solana)\n` +
      `• ${inrPrice}/month (UPI)\n\n` +
      `To upgrade, contact @subhdotsol with your preferred payment method.\n\n` +
      `<i>Self-service payments coming soon!</i> 🚀`,
      { parse_mode: 'HTML' }
    );
  });
}
