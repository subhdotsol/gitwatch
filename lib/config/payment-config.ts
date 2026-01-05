// Payment configuration - loaded from environment variables
// Never commit actual values to git!

export const PAYMENT_CONFIG = {
  usdc: {
    /** Blockchain for USDC payments */
    chain: 'solana' as const,
    
    /** Wallet address for USDC payments */
    address: process.env.USDC_WALLET_ADDRESS || '',
    
    /** Whether USDC payments are enabled */
    enabled: !!process.env.USDC_WALLET_ADDRESS,
  },
  
  bank: {
    /** Bank account holder name */
    name: process.env.BANK_ACCOUNT_NAME || '',
    
    /** Bank account number */
    accountNumber: process.env.BANK_ACCOUNT_NUMBER || '',
    
    /** Bank IFSC code */
    ifsc: process.env.BANK_IFSC || '',
    
    /** UPI ID for quick payments */
    upi: process.env.UPI_ID || '',
    
    /** Whether bank transfer payments are enabled */
    enabled: !!process.env.UPI_ID || !!process.env.BANK_ACCOUNT_NUMBER,
  },
  
  /** Telegram ID of the admin who can approve/reject payments */
  adminTelegramId: process.env.ADMIN_TELEGRAM_ID || '',
};

/**
 * Check if the current user is an admin
 */
export function isAdmin(telegramId: string | bigint): boolean {
  if (!PAYMENT_CONFIG.adminTelegramId) return false;
  return telegramId.toString() === PAYMENT_CONFIG.adminTelegramId;
}

/**
 * Check if any payment methods are configured
 */
export function hasPaymentMethodsConfigured(): boolean {
  return PAYMENT_CONFIG.usdc.enabled || PAYMENT_CONFIG.bank.enabled;
}
