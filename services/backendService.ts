import { PlanType, UserStatus, WebhookEvent, ApiKey } from '../types.ts';

/**
 * ARCHITECT.IO BACKEND SERVICE
 * Communicates with the live Node.js server on Render.
 */

const RENDER_URL = 'https://architect-io.onrender.com'; 
const API_URL = `${RENDER_URL}/api`;

export const backendService = {
  async checkHealth(): Promise<string> {
    try {
      const response = await fetch(`${RENDER_URL}/health`);
      if (response.ok) return await response.text();
      return 'FAIL';
    } catch (e) {
      return 'FAIL';
    }
  },

  async createCheckoutSession(plan: PlanType, price: number) {
    try {
      const response = await fetch(`${API_URL}/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, price })
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with ${response.status}`);
      }
      const data = await response.json();
      if (data.url) return data;
      throw new Error("No checkout URL returned from server.");
    } catch (e: any) {
      console.error("Backend error:", e);
      throw e;
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