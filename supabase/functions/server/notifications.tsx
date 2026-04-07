import { Context } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { audit } from "./audit.tsx";
import { log } from "./logger.tsx";

export const notificationRoutes = {
  subscribe: async (c: Context) => {
    try {
      const userId = c.get('userId');
      const { subscription } = await c.req.json();
      if (!subscription) {
        return c.json({ error: 'Missing subscription payload' }, 400);
      }

      await kv.set(`notifications:subscription:${userId}`, {
        userId,
        subscription,
        updatedAt: new Date().toISOString(),
      });

      await audit.log({
        action: 'notifications.subscribed',
        userId,
        details: {},
      });
      return c.json({ success: true });
    } catch (error) {
      log('error', 'Subscribe notifications error', { error: String(error) });
      return c.json({ error: 'Internal server error subscribing notifications' }, 500);
    }
  },

  unsubscribe: async (c: Context) => {
    try {
      const userId = c.get('userId');
      await kv.set(`notifications:subscription:${userId}`, null);
      await audit.log({
        action: 'notifications.unsubscribed',
        userId,
        details: {},
      });
      return c.json({ success: true });
    } catch (error) {
      log('error', 'Unsubscribe notifications error', { error: String(error) });
      return c.json({ error: 'Internal server error unsubscribing notifications' }, 500);
    }
  },

  getPreferences: async (c: Context) => {
    try {
      const userId = c.get('userId');
      const preferences = (await kv.get(`notifications:preferences:${userId}`)) || {
        pushBookingUpdates: true,
        pushPromotions: true,
        pushNewMessages: true,
        pushServiceReminders: true,
        emailBookingUpdates: true,
        emailPromotions: false,
        smsBookingUpdates: false,
      };
      return c.json({ preferences });
    } catch (error) {
      log('error', 'Get notification preferences error', { error: String(error) });
      return c.json({ error: 'Internal server error getting preferences' }, 500);
    }
  },

  updatePreferences: async (c: Context) => {
    try {
      const userId = c.get('userId');
      const preferences = await c.req.json();
      await kv.set(`notifications:preferences:${userId}`, {
        ...preferences,
        updatedAt: new Date().toISOString(),
      });
      await audit.log({
        action: 'notifications.preferences_updated',
        userId,
        details: {},
      });
      return c.json({ preferences, success: true });
    } catch (error) {
      log('error', 'Update notification preferences error', { error: String(error) });
      return c.json({ error: 'Internal server error updating preferences' }, 500);
    }
  },
};
