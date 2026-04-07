import { Context } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { log } from "./logger.tsx";

const canAccessBooking = (booking: Record<string, unknown>, userId: string, isAdmin: boolean) =>
  booking.customerId === userId || booking.mechanicId === userId || isAdmin;

export const trackingRoutes = {
  get: async (c: Context) => {
    try {
      const bookingId = c.req.param('bookingId');
      const userId = c.get('userId');
      const user = c.get('user');
      const isAdmin = user?.user_metadata?.userType === 'admin';

      const booking = await kv.get(bookingId);
      if (!booking) {
        return c.json({ error: 'Booking not found' }, 404);
      }
      if (!canAccessBooking(booking, userId, isAdmin)) {
        return c.json({ error: 'Unauthorized' }, 403);
      }

      const location = (await kv.get(`tracking:${bookingId}`)) || {
        lat: -26.2041,
        lng: 28.0473,
        timestamp: Date.now(),
        speed: 0,
        heading: 0,
      };

      return c.json({ location });
    } catch (error) {
      log('error', 'Tracking get error', { error: String(error) });
      return c.json({ error: 'Internal server error getting tracking' }, 500);
    }
  },

  update: async (c: Context) => {
    try {
      const userId = c.get('userId');
      const user = c.get('user');
      const isAdmin = user?.user_metadata?.userType === 'admin';
      const { bookingId, lat, lng, speed, heading } = await c.req.json();

      if (!bookingId || typeof lat !== 'number' || typeof lng !== 'number') {
        return c.json({ error: 'Invalid bookingId, lat, or lng' }, 400);
      }

      const booking = await kv.get(bookingId);
      if (!booking) {
        return c.json({ error: 'Booking not found' }, 404);
      }
      if (booking.mechanicId !== userId && !isAdmin) {
        return c.json({ error: 'Only assigned mechanic or admin can update tracking' }, 403);
      }

      const locationData = {
        lat,
        lng,
        timestamp: Date.now(),
        speed: typeof speed === 'number' ? speed : 0,
        heading: typeof heading === 'number' ? heading : 0,
      };
      await kv.set(`tracking:${bookingId}`, locationData);
      return c.json({ success: true, location: locationData });
    } catch (error) {
      log('error', 'Tracking update error', { error: String(error) });
      return c.json({ error: 'Internal server error updating tracking' }, 500);
    }
  },
};
