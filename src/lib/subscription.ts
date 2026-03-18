import { db } from '@/lib/db';

export type SubscriptionLimits = {
  maxEvents: number | null;
  maxTickets: number | null;
  maxAccommodations: number | null;
  maxCategories: number | null;
};

export async function getVendorLimits(vendorId: string): Promise<SubscriptionLimits> {
  const vendor = await db.vendor.findUnique({
    where: { id: vendorId },
    include: { subscriptionPlan: true },
  });

  // No plan assigned: treat as unlimited for local/dev convenience.
  if (!vendor?.subscriptionPlan) {
    return {
      maxEvents: null,
      maxTickets: null,
      maxAccommodations: null,
      maxCategories: null,
    };
  }

  const plan = vendor.subscriptionPlan;
  return {
    maxEvents: plan.maxEvents ?? null,
    maxTickets: plan.maxTickets ?? null,
    maxAccommodations: plan.maxAccommodations ?? null,
    maxCategories: plan.maxCategories ?? null,
  };
}

export function isLimitExceeded(current: number, limit: number | null | undefined) {
  if (limit === null || limit === undefined) return false;
  return current >= limit;
}

