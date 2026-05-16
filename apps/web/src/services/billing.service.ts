import axios from '../lib/axios';

export interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  priceMonthly: number;
  priceAnnual: number;
  currency: string;
  limits: any;
  features: any;
  trialDays: number;
}

export interface Subscription {
  id: string;
  planId: string;
  status: 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED' | 'PAUSED';
  billingCycle: 'MONTHLY' | 'ANNUAL' | 'LIFETIME' | 'TRIAL';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  trialEnd?: string;
}

export const billingService = {
  async getPlans(): Promise<Plan[]> {
    const response = await axios.get('/plans');
    return response.data.data;
  },

  async createCheckoutSession(data: {
    planId: string;
    billingCycle: 'MONTHLY' | 'ANNUAL';
    promoCode?: string;
  }): Promise<{ checkoutUrl: string }> {
    const response = await axios.post('/subscriptions/checkout', data);
    return response.data.data;
  },

  async createPortalSession(): Promise<{ portalUrl: string }> {
    const response = await axios.post('/subscriptions/portal');
    return response.data.data;
  },

  async getSubscription(): Promise<Subscription> {
    const response = await axios.get('/subscriptions/me');
    return response.data.data;
  }
};
