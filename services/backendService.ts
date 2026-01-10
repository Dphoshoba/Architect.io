import { PlanType, UserStatus, WebhookEvent, ApiKey } from '../types';

/**
 * ARCHITECT.IO BACKEND SERVICE
 * Communicates with the external Node.js server hosted on Render.com.
 * 
 * NOTE: Replace the RENDER_URL with your actual Render service URL 
 * (e.g., https://architectio-backend.onrender.com)
 */

const RENDER_URL = 'https://YOUR-APP-NAME.onrender.com'; 
const API_URL = `${RENDER_URL}/api`;

export const backendService = {
  async createCheckoutSession(plan: PlanType, price: number) {
    try {
      const response = await fetch(`${API_URL}/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, price })
      });
      const data = await response.json();
      if (data.url) return data;
      throw new Error("No URL returned");
    } catch (e) {
      console.warn("Backend unavailable, falling back to simulation...");
      return { url: '#simulation-mode' };
    }
  },

  async triggerPaymentWebhook(plan: PlanType, price: number, user: UserStatus): Promise<WebhookEvent[]> {
    return [
      {
        id: `sim_${Math.random().toString(36).substring(2, 10)}`,
        type: 'checkout.session.completed',
        timestamp: Date.now(),
        status: 'success',
        payload: { plan, amount: price * 100 }
      }
    ];
  },

  async getWebhookLogs(): Promise<WebhookEvent[]> {
    try {
      const response = await fetch(`${API_URL}/logs`);
      return await response.json();
    } catch (e) {
      return [];
    }
  },

  async getApiKeys(): Promise<ApiKey[]> {
    try {
      const response = await fetch(`${API_URL}/keys`);
      return await response.json();
    } catch (e) {
      return [
        { id: '1', key: 'am_sim_mode_offline', label: 'Offline Mode (Render Not Connected)', created: Date.now() }
      ];
    }
  },

  async rotateApiKey(id: string): Promise<ApiKey[]> {
    try {
      const response = await fetch(`${API_URL}/keys/rotate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      return await response.json();
    } catch (e) {
      return [];
    }
  },

  async clearLogs() {
    return [];
  }
};