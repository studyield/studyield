export type BillingCycle = 'monthly' | 'yearly';
export type PlanId = 'free' | 'pro';

export interface PlanPricing {
  monthly: number;      // monthly cost
  yearly: number;       // total annual cost
}

export interface PlanConfig {
  id: PlanId;
  pricing: PlanPricing;
  popular: boolean;
  limits: {
    studySets: number;       // -1 = unlimited
    flashcards: number;
    aiRequests: number;
    knowledgeBases: number;
  };
}

export const PRICING: Record<PlanId, PlanConfig> = {
  free: {
    id: 'free',
    pricing: { monthly: 0, yearly: 0 },
    popular: false,
    limits: {
      studySets: 3,
      flashcards: 50,
      aiRequests: 10,
      knowledgeBases: 0,
    },
  },
  pro: {
    id: 'pro',
    pricing: { monthly: 9.99, yearly: 99.99 },
    popular: true,
    limits: {
      studySets: -1,
      flashcards: -1,
      aiRequests: -1,
      knowledgeBases: -1,
    },
  },
};

export const SOCIAL_PROOF_COUNT = 50_000;

/**
 * Get the display price for a plan.
 */
export function getPrice(planId: PlanId, cycle: BillingCycle): number {
  const plan = PRICING[planId];
  return cycle === 'monthly' ? plan.pricing.monthly : plan.pricing.yearly;
}

/**
 * Get the monthly price for showing savings on yearly.
 */
export function getMonthlyEquivalent(planId: PlanId, cycle: BillingCycle): number {
  const plan = PRICING[planId];
  return cycle === 'yearly' ? plan.pricing.yearly / 12 : plan.pricing.monthly;
}

/**
 * @deprecated Use getMonthlyEquivalent instead
 */
export function getOriginalPrice(planId: PlanId): number {
  return PRICING[planId].pricing.monthly * 12;
}

export interface ComparisonFeature {
  key: string;
  free: string | boolean;
  pro: string | boolean;
}

export const COMPARISON_FEATURES: ComparisonFeature[] = [
  { key: 'studySets', free: '3', pro: 'unlimited' },
  { key: 'flashcards', free: '50', pro: 'unlimited' },
  { key: 'aiRequests', free: '10/mo', pro: 'unlimited' },
  { key: 'quizzes', free: 'basic', pro: 'allPlusLive' },
  { key: 'spacedRepetition', free: true, pro: true },
  { key: 'clozeImageOcclusion', free: true, pro: true },
  { key: 'handwritingOcr', free: true, pro: true },
  { key: 'problemSolver', free: false, pro: true },
  { key: 'batchSolver', free: false, pro: true },
  { key: 'examCloning', free: false, pro: true },
  { key: 'knowledgeBase', free: false, pro: true },
  { key: 'teachBack', free: false, pro: true },
  { key: 'learningPaths', free: false, pro: true },
  { key: 'deepResearch', free: false, pro: true },
  { key: 'advancedAnalytics', free: false, pro: true },
  { key: 'conceptMaps', free: false, pro: true },
  { key: 'formulaCards', free: false, pro: true },
];
