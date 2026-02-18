import { Context } from "npm:hono";
import * as kv from "./kv_store.tsx";

export const bookingRoutes = {
  // Create a new booking/service request
  create: async (c: Context) => {
    try {
      const userId = c.get('userId');
      const body = await c.req.json();
      const { service, vehicle, location, description, coordinates } = body;

      if (!service || !vehicle || !location) {
        return c.json({ error: 'Missing required fields: service, vehicle, location' }, 400);
      }

      const bookingId = `booking:${Date.now()}:${userId}`;
      const booking = {
        id: bookingId,
        customerId: userId,
        service,
        vehicle,
        location,
        description: description || '',
        coordinates: coordinates || null,
        status: 'pending', // pending, assigned, in-progress, completed, cancelled
        mechanicId: null,
        mechanicName: null,
        mechanicImage: null,
        price: null,
        estimatedArrival: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: null,
      };

      await kv.set(bookingId, booking);
      
      // Add to customer's bookings list
      const customerBookings = await kv.get(`customer:bookings:${userId}`) || [];
      customerBookings.unshift(bookingId);
      await kv.set(`customer:bookings:${userId}`, customerBookings);

      // Add to pending bookings queue
      const pendingBookings = await kv.get('bookings:pending') || [];
      pendingBookings.unshift(bookingId);
      await kv.set('bookings:pending', pendingBookings);

      console.log(`Booking created: ${bookingId} for customer ${userId}`);
      return c.json({ booking, message: 'Booking created successfully' });
    } catch (error) {
      console.log(`Create booking error: ${error}`);
      return c.json({ error: 'Internal server error creating booking' }, 500);
    }
  },

  // Get all bookings for a user
  getMyBookings: async (c: Context) => {
    try {
      const userId = c.get('userId');
      const user = c.get('user');
      const userType = user.user_metadata?.userType;

      let bookingIds: string[] = [];

      if (userType === 'customer') {
        bookingIds = await kv.get(`customer:bookings:${userId}`) || [];
      } else if (userType === 'provider') {
        bookingIds = await kv.get(`provider:bookings:${userId}`) || [];
      }

      const bookings = await kv.mget(bookingIds);
      
      return c.json({ bookings: bookings.filter(b => b !== null) });
    } catch (error) {
      console.log(`Get my bookings error: ${error}`);
      return c.json({ error: 'Internal server error getting bookings' }, 500);
    }
  },

  // Get pending bookings (for providers)
  getPending: async (c: Context) => {
    try {
      const userId = c.get('userId');
      const user = c.get('user');
      
      if (user.user_metadata?.userType !== 'provider') {
        return c.json({ error: 'Only providers can view pending bookings' }, 403);
      }

      const pendingIds = await kv.get('bookings:pending') || [];
      const bookings = await kv.mget(pendingIds);
      
      return c.json({ bookings: bookings.filter(b => b !== null && b.status === 'pending') });
    } catch (error) {
      console.log(`Get pending bookings error: ${error}`);
      return c.json({ error: 'Internal server error getting pending bookings' }, 500);
    }
  },

  // Accept a booking (provider)
  accept: async (c: Context) => {
    try {
      const userId = c.get('userId');
      const user = c.get('user');
      const { bookingId } = await c.req.json();

      if (user.user_metadata?.userType !== 'provider') {
        return c.json({ error: 'Only providers can accept bookings' }, 403);
      }

      const booking = await kv.get(bookingId);
      
      if (!booking) {
        return c.json({ error: 'Booking not found' }, 404);
      }

      if (booking.status !== 'pending') {
        return c.json({ error: 'Booking is no longer available' }, 400);
      }

      // Get provider profile
      const providerProfile = await kv.get(`user:${userId}`);

      // Update booking
      booking.status = 'assigned';
      booking.mechanicId = userId;
      booking.mechanicName = providerProfile?.name || 'Mechanic';
      booking.mechanicImage = providerProfile?.profileImage || '';
      booking.estimatedArrival = '15-20 min';
      booking.updatedAt = new Date().toISOString();

      await kv.set(bookingId, booking);

      // Add to provider's bookings
      const providerBookings = await kv.get(`provider:bookings:${userId}`) || [];
      providerBookings.unshift(bookingId);
      await kv.set(`provider:bookings:${userId}`, providerBookings);

      // Remove from pending queue
      const pendingBookings = await kv.get('bookings:pending') || [];
      const updatedPending = pendingBookings.filter((id: string) => id !== bookingId);
      await kv.set('bookings:pending', updatedPending);

      console.log(`Booking ${bookingId} accepted by provider ${userId}`);
      return c.json({ booking, message: 'Booking accepted successfully' });
    } catch (error) {
      console.log(`Accept booking error: ${error}`);
      return c.json({ error: 'Internal server error accepting booking' }, 500);
    }
  },

  // Update booking status
  updateStatus: async (c: Context) => {
    try {
      const userId = c.get('userId');
      const { bookingId, status, price } = await c.req.json();

      if (!bookingId || !status) {
        return c.json({ error: 'Missing bookingId or status' }, 400);
      }

      const booking = await kv.get(bookingId);
      
      if (!booking) {
        return c.json({ error: 'Booking not found' }, 404);
      }

      // Check authorization
      if (booking.customerId !== userId && booking.mechanicId !== userId) {
        return c.json({ error: 'Unauthorized to update this booking' }, 403);
      }

      booking.status = status;
      booking.updatedAt = new Date().toISOString();
      
      if (price) {
        booking.price = price;
      }

      if (status === 'completed') {
        booking.completedAt = new Date().toISOString();
        
        // Update provider stats
        if (booking.mechanicId) {
          const providerProfile = await kv.get(`user:${booking.mechanicId}`);
          if (providerProfile) {
            providerProfile.completedJobs = (providerProfile.completedJobs || 0) + 1;
            await kv.set(`user:${booking.mechanicId}`, providerProfile);
          }
        }
      }

      await kv.set(bookingId, booking);

      console.log(`Booking ${bookingId} status updated to ${status}`);
      return c.json({ booking, message: 'Booking updated successfully' });
    } catch (error) {
      console.log(`Update booking status error: ${error}`);
      return c.json({ error: 'Internal server error updating booking' }, 500);
    }
  },

  // Get single booking details
  getById: async (c: Context) => {
    try {
      const userId = c.get('userId');
      const bookingId = c.req.param('id');

      const booking = await kv.get(`booking:${bookingId}`);
      
      if (!booking) {
        return c.json({ error: 'Booking not found' }, 404);
      }

      // Check authorization
      if (booking.customerId !== userId && booking.mechanicId !== userId) {
        return c.json({ error: 'Unauthorized to view this booking' }, 403);
      }

      return c.json({ booking });
    } catch (error) {
      console.log(`Get booking error: ${error}`);
      return c.json({ error: 'Internal server error getting booking' }, 500);
    }
  },

  // Cancel booking
  cancel: async (c: Context) => {
    try {
      const userId = c.get('userId');
      const { bookingId } = await c.req.json();

      const booking = await kv.get(bookingId);
      
      if (!booking) {
        return c.json({ error: 'Booking not found' }, 404);
      }

      // Only customer can cancel
      if (booking.customerId !== userId) {
        return c.json({ error: 'Only the customer can cancel this booking' }, 403);
      }

      if (booking.status === 'completed') {
        return c.json({ error: 'Cannot cancel completed booking' }, 400);
      }

      booking.status = 'cancelled';
      booking.updatedAt = new Date().toISOString();
      await kv.set(bookingId, booking);

      // Remove from pending if applicable
      if (booking.status === 'pending') {
        const pendingBookings = await kv.get('bookings:pending') || [];
        const updatedPending = pendingBookings.filter((id: string) => id !== bookingId);
        await kv.set('bookings:pending', updatedPending);
      }

      console.log(`Booking ${bookingId} cancelled by customer ${userId}`);
      return c.json({ booking, message: 'Booking cancelled successfully' });
    } catch (error) {
      console.log(`Cancel booking error: ${error}`);
      return c.json({ error: 'Internal server error cancelling booking' }, 500);
    }
  },
};
