import { PlanType, UserStatus, WebhookEvent, ApiKey } from '../types';

/**
 * ARCHITECT.IO BACKEND SERVICE
 * Communicates with the live Node.js server on Render.
 */

const RENDER_URL = 'https://architect-io.onrender.com'; 
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
      console.error("Backend error:", e);
      // Fallback for UI if backend is not yet fully configured with keys
      return { url: '#error' };
    }
  },

  async getWebhookLogs(): Promise<WebhookEvent[]> {
    try {
      const response = await fetch(`${API_URL}/logs`);
      if (!response.ok) return [];
      return await response.json();
    } catch (e) {
      return [];
    }
  },

  async getApiKeys(): Promise<ApiKey[]> {
    try {
      const response = await fetch(`${API_URL}/keys`);
      if (!response.ok) return [];
      return await response.json();
    } catch (e) {
      return [];
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
  }
};