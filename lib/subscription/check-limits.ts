import { prisma } from '../prisma';
import { PLATFORM_LIMITS, PLAN_LIMITS, getRepoLimit, PlanType } from '../config/limits';

/**
 * Check if a new user can register on the platform
 * Returns false if we've hit the max user limit
 */
export async function canUserRegister(): Promise<{
  allowed: boolean;
  currentUsers: number;
  maxUsers: number;
  waitlistUrl?: string;
}> {
  const currentUsers = await prisma.user.count();
  const allowed = currentUsers < PLATFORM_LIMITS.maxUsers;
  
  return {
    allowed,
    currentUsers,
    maxUsers: PLATFORM_LIMITS.maxUsers,
    waitlistUrl: !allowed && PLATFORM_LIMITS.waitlistEnabled 
      ? PLATFORM_LIMITS.waitlistUrl 
      : undefined,
  };
}

/**
 * Check if a user can add another repository
 * Uses the user's current plan to determine the limit
 */
export async function canUserAddRepo(userId: string, plan: PlanType = 'free'): Promise<{
  allowed: boolean;
  current: number;
  limit: number;
  planName: string;
}> {
  const currentRepos = await prisma.watchedRepo.count({
    where: { userId, active: true },
  });
  
  const limit = getRepoLimit(plan);
  
  return {
    allowed: currentRepos < limit,
    current: currentRepos,
    limit,
    planName: PLAN_LIMITS[plan].displayName,
  };
}

/**
 * Get current platform stats
 */
export async function getPlatformStats(): Promise<{
  totalUsers: number;
  maxUsers: number;
  usagePercent: number;
  totalRepos: number;
  activeRepos: number;
}> {
  const [totalUsers, totalRepos, activeRepos] = await Promise.all([
    prisma.user.count(),
    prisma.watchedRepo.count(),
    prisma.watchedRepo.count({ where: { active: true } }),
  ]);
  
  return {
    totalUsers,
    maxUsers: PLATFORM_LIMITS.maxUsers,
    usagePercent: Math.round((totalUsers / PLATFORM_LIMITS.maxUsers) * 100),
    totalRepos,
    activeRepos,
  };
}
