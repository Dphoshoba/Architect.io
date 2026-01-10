
import { PlanType, UserStatus, WebhookEvent } from '../types';

/**
 * ARCHITECT.IO BACKEND SIMULATOR
 * In a production environment, this file would be replaced by a Node.js/Express 
 * server or Serverless Functions (Vercel/AWS Lambda).
 */

const MOCK_DB = {
  webhooks: [] as WebhookEvent[],
  apiKeys: [
    { id: '1', key: 'am_live_67...92k1', label: 'Production Key', created: Date.now() }
  ]
};

export const backendService = {
  /**
   * Simulates a secure call to create a Stripe Checkout Session.
   * This would normally happen on the server to hide the Stripe Secret Key.
   */
  async createCheckoutSession(plan: PlanType, price: number) {
    console.log(`[BACKEND] Creating secure Stripe session for plan: ${plan}`);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const sessionId = `sess_${Math.random().toString(36).substr(2, 9)}`;
    return { sessionId, url: `https://checkout.stripe.com/pay/${sessionId}` };
  },

  /**
   * Simulates the Webhook handler that Stripe calls when payment is confirmed.
   */
  async triggerPaymentWebhook(plan: PlanType, price: number, user: UserStatus): Promise<WebhookEvent[]> {
    const events: WebhookEvent[] = [
      {
        id: `evt_${Math.random().toString(36).substr(2, 9)}`,
        type: 'checkout.session.completed',
        timestamp: Date.now(),
        status: 'success',
        payload: { plan, amount_total: price * 100, currency: 'usd', customer: user.stripeCustomerId || 'cus_new' }
      },
      {
        id: `evt_${Math.random().toString(36).substr(2, 9)}`,
        type: 'invoice.paid',
        timestamp: Date.now() + 100,
        status: 'success',
        payload: { amount_paid: price * 100, billing_reason: 'subscription_create' }
      }
    ];

    MOCK_DB.webhooks = [...events, ...MOCK_DB.webhooks].slice(0, 20);
    return events;
  },

  async getWebhookLogs(): Promise<WebhookEvent[]> {
    return MOCK_DB.webhooks;
  },

  async getApiKeys() {
    return MOCK_DB.apiKeys;
  },

  async rotateApiKey(id: string) {
    const index = MOCK_DB.apiKeys.findIndex(k => k.id === id);
    if (index !== -1) {
      MOCK_DB.apiKeys[index].key = `am_live_${Math.random().toString(36).substr(2, 12)}`;
    }
    return MOCK_DB.apiKeys;
  }
};
