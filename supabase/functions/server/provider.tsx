import { Context } from "npm:hono";
import * as kv from "./kv_store.tsx";

export const providerRoutes = {
  // Update provider availability (online/offline)
  updateAvailability: async (c: Context) => {
    try {
      const userId = c.get('userId');
      const user = c.get('user');

      if (user.user_metadata?.userType !== 'provider') {
        return c.json({ error: 'Only providers can update availability' }, 403);
      }

      const body = await c.req.json();
      const { isOnline, serviceRadius } = body;

      const availability = await kv.get(`provider:availability:${userId}`) || {};
      
      if (isOnline !== undefined) availability.isOnline = isOnline;
      if (serviceRadius !== undefined) availability.serviceRadius = serviceRadius;
      availability.updatedAt = new Date().toISOString();

      await kv.set(`provider:availability:${userId}`, availability);

      // Update user profile
      const profile = await kv.get(`user:${userId}`);
      if (profile) {
        profile.isOnline = availability.isOnline;
        await kv.set(`user:${userId}`, profile);
      }

      console.log(`Provider ${userId} availability updated: online=${availability.isOnline}`);
      return c.json({ availability, message: 'Availability updated successfully' });
    } catch (error) {
      console.log(`Update availability error: ${error}`);
      return c.json({ error: 'Internal server error updating availability' }, 500);
    }
  },

  // Get provider stats
  getStats: async (c: Context) => {
    try {
      const userId = c.get('userId');
      const user = c.get('user');

      if (user.user_metadata?.userType !== 'provider') {
        return c.json({ error: 'Only providers can view stats' }, 403);
      }

      const profile = await kv.get(`user:${userId}`);
      const bookingIds = await kv.get(`provider:bookings:${userId}`) || [];
      const bookings = await kv.mget(bookingIds);

      const completedBookings = bookings.filter((b: any) => b && b.status === 'completed');
      const totalEarnings = completedBookings.reduce((sum: number, b: any) => {
        return sum + (parseFloat(b.price) || 0) * 0.85; // Provider gets 85%
      }, 0);

      const stats = {
        totalJobs: bookings.length,
        completedJobs: completedBookings.length,
        rating: profile?.rating || 5.0,
        totalEarnings: totalEarnings.toFixed(2),
        pendingJobs: bookings.filter((b: any) => b && b.status === 'assigned').length,
      };

      return c.json({ stats });
    } catch (error) {
      console.log(`Get provider stats error: ${error}`);
      return c.json({ error: 'Internal server error getting stats' }, 500);
    }
  },

  // Get provider earnings
  getEarnings: async (c: Context) => {
    try {
      const userId = c.get('userId');
      const user = c.get('user');

      if (user.user_metadata?.userType !== 'provider') {
        return c.json({ error: 'Only providers can view earnings' }, 403);
      }

      const bookingIds = await kv.get(`provider:bookings:${userId}`) || [];
      const bookings = await kv.mget(bookingIds);

      const earnings = bookings
        .filter((b: any) => b && b.status === 'completed' && b.price)
        .map((b: any) => ({
          bookingId: b.id,
          service: b.service,
          date: b.completedAt,
          amount: parseFloat(b.price),
          providerEarning: (parseFloat(b.price) * 0.85).toFixed(2),
          platformFee: (parseFloat(b.price) * 0.15).toFixed(2),
        }));

      const totalEarnings = earnings.reduce((sum: number, e: any) => sum + parseFloat(e.providerEarning), 0);

      return c.json({ 
        earnings,
        totalEarnings: totalEarnings.toFixed(2),
        currency: 'USD',
      });
    } catch (error) {
      console.log(`Get earnings error: ${error}`);
      return c.json({ error: 'Internal server error getting earnings' }, 500);
    }
  },

  // Update provider services offered
  updateServices: async (c: Context) => {
    try {
      const userId = c.get('userId');
      const user = c.get('user');

      if (user.user_metadata?.userType !== 'provider') {
        return c.json({ error: 'Only providers can update services' }, 403);
      }

      const { services } = await c.req.json();

      if (!Array.isArray(services)) {
        return c.json({ error: 'Services must be an array' }, 400);
      }

      await kv.set(`provider:services:${userId}`, services);

      console.log(`Provider ${userId} services updated`);
      return c.json({ services, message: 'Services updated successfully' });
    } catch (error) {
      console.log(`Update services error: ${error}`);
      return c.json({ error: 'Internal server error updating services' }, 500);
    }
  },

  // Get all online providers (for customer discovery)
  getOnlineProviders: async (c: Context) => {
    try {
      // Get all user keys and filter for providers
      const allUserKeys = await kv.getByPrefix('user:');
      const providers = allUserKeys
        .filter((user: any) => user && user.userType === 'provider' && user.isOnline)
        .map((user: any) => ({
          id: user.id,
          name: user.name,
          rating: user.rating,
          completedJobs: user.completedJobs,
          profileImage: user.profileImage,
        }));

      return c.json({ providers });
    } catch (error) {
      console.log(`Get online providers error: ${error}`);
      return c.json({ error: 'Internal server error getting providers' }, 500);
    }
  },
};
