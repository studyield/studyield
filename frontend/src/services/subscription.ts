import api from './api';
import { ENDPOINTS } from '@/config/api';
import type { BillingCycle } from '@/config/pricing';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  yearlyPrice: number;
  features: string[];
  limits: {
    ai_requests: number;
    documents: number;
    study_sets: number;
    storage_mb: number;
  };
  popular?: boolean;
}

export interface Subscription {
  id: string;
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  plan: 'free' | 'monthly' | 'yearly';
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UsageData {
  [feature: string]: {
    allowed: boolean;
    remaining: number;
  };
}

export const subscriptionService = {
  async getCurrent(): Promise<Subscription> {
    const res = await api.get(ENDPOINTS.subscription.current);
    return res.data;
  },

  async getUsage(): Promise<UsageData> {
    const res = await api.get(ENDPOINTS.subscription.usage);
    return res.data;
  },

  async createCheckout(_plan: string, cycle: BillingCycle): Promise<string> {
    const res = await api.post(ENDPOINTS.subscription.checkout, { plan: cycle });
    return res.data.url;
  },

  async createPortal(): Promise<string> {
    const res = await api.post(ENDPOINTS.subscription.portal);
    return res.data.url;
  },

  async cancel(): Promise<void> {
    await api.post(ENDPOINTS.subscription.cancel);
  },

  async verifySession(sessionId: string): Promise<{ status: string; plan: string }> {
    const res = await api.get(ENDPOINTS.subscription.verifySession, { params: { session_id: sessionId } });
    return res.data;
  },
};
