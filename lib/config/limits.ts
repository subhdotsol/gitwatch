// Central configuration for all platform limits
// Change these values and redeploy to adjust capacity

export const PLATFORM_LIMITS = {
  /** Maximum number of users allowed on the platform */
  maxUsers: 100,
  
  /** Whether to show waitlist message when at capacity */
  waitlistEnabled: true,
  
  /** Waitlist URL (shown when at capacity) */
  waitlistUrl: 'https://forms.gle/your-waitlist-form',
};

export const PLAN_LIMITS = {
  free: {
    /** Maximum repos a free user can watch */
    maxRepos: 2,
    
    /** Display name for the plan */
    displayName: 'Free',
  },
  
  premium: {
    /** Maximum repos a premium user can watch */
    maxRepos: 5,
    
    /** Display name for the plan */
    displayName: 'Premium',
  },
};

export const PRICING = {
  premium: {
    /** Price in USD */
    usd: 5,
    
    /** Price in INR */
    inr: 400,
    
    /** Subscription duration in days */
    durationDays: 30,
  },
};

// Helper type for plan names
export type PlanType = 'free' | 'premium';

/**
 * Get the repo limit for a given plan
 */
export function getRepoLimit(plan: PlanType): number {
  return PLAN_LIMITS[plan].maxRepos;
}
