
import { PlanType, UserStatus, WebhookEvent, ApiKey } from '../types';

/**
 * ARCHITECT.IO BACKEND SERVICE
 * This service communicates with the real Node.js server.
 * Toggle the API_URL based on your deployment.
 */

const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001/api' 
  : '/api'; // Assuming reverse proxy in production (e.g., Vercel/Nginx)

export const backendService = {
  async createCheckoutSession(plan: PlanType, price: number) {
    try {
      const response = await fetch(`${API_URL}/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, price })
      });
      return await response.json();
    } catch (e) {
      console.error("Backend offline, falling back to simulation...");
      // Fallback for demo purposes if backend isn't running
      return { url: '#simulation-mode' };
    }
  },

  async triggerPaymentWebhook(plan: PlanType, price: number, user: UserStatus): Promise<WebhookEvent[]> {
    // In production, this is triggered automatically by Stripe.
    // This method is now only used for the "Simulate Payment" button in the UI.
    console.info("Simulating payment via local event emission...");
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
        { id: '1', key: 'am_sim_mode_offline', label: 'Offline Mode', created: Date.now() }
      ];
    }
  },

  async rotateApiKey(id: string): Promise<ApiKey[]> {
    const response = await fetch(`${API_URL}/keys/rotate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    return await response.json();
  },

  async clearLogs() {
    // Note: Log clearing would usually be restricted to admins
    return [];
  }
};
