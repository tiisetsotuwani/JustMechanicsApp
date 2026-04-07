import { Context } from "hono";
import * as kv from "./kv_store.tsx";
import { audit } from "./audit.tsx";
import { log } from "./logger.tsx";
import { dispatchEngine } from "./dispatch.tsx";

const VALID_STATUSES = new Set([
  'pending',
  'assigned',
  'en_route',
  'arrived',
  'in_progress',
  'completed',
  'cancelled',
  'disputed',
]);

const readBooking = async (bookingId: string) => {
  if (!bookingId) {
    return null;
  }

  const booking = await kv.get(bookingId);
  if (booking) {
    return booking;
  }

  if (!bookingId.startsWith('booking:')) {
    return kv.get(`booking:${bookingId}`);
  }

  return null;
};

const removeFromPendingQueue = async (bookingId: string) => {
  const pendingBookings = (await kv.get('bookings:pending')) || [];
  const updatedPending = pendingBookings.filter((id: string) => id !== bookingId);
  await kv.set('bookings:pending', updatedPending);
};

const isParticipant = (booking: Record<string, unknown>, userId: string) =>
  booking.customerId === userId || booking.mechanicId === userId;

export const bookingRoutes = {
  create: async (c: Context) => {
    try {
      const userId = c.get('userId');
      const body = await c.req.json();
      const { service, vehicle, location, description, coordinates } = body;

      if (!service || !vehicle || !location) {
        return c.json({ error: 'Missing required fields: service, vehicle, location' }, 400);
      }

      const bookingId = `booking:${Date.now()}:${userId}`;
      const now = new Date().toISOString();
      const booking = {
        id: bookingId,
        customerId: userId,
        service,
        vehicle,
        location,
        description: description || '',
        coordinates: coordinates || null,
        status: 'pending',
        mechanicId: null,
        mechanicName: null,
        mechanicImage: null,
        estimatedArrival: null,
        price: null,
        laborCost: null,
        partsCost: null,
        platformFee: null,
        totalCost: null,
        paymentId: null,
        paymentStatus: null,
        invoiceId: null,
        rated: false,
        rating: null,
        date: now,
        createdAt: now,
        updatedAt: now,
        acceptedAt: null,
        arrivedAt: null,
        startedAt: null,
        completedAt: null,
        cancelledAt: null,
        cancellationReason: null,
      };

      await kv.set(bookingId, booking);

      const customerBookings = (await kv.get(`customer:bookings:${userId}`)) || [];
      customerBookings.unshift(bookingId);
      await kv.set(`customer:bookings:${userId}`, customerBookings);

      const pendingBookings = (await kv.get('bookings:pending')) || [];
      pendingBookings.unshift(bookingId);
      await kv.set('bookings:pending', pendingBookings);

      const dispatchResult = await dispatchEngine.autoOfferNearestProviders(bookingId);

      await audit.log({
        action: 'booking.created',
        userId,
        targetId: bookingId,
        details: { service, vehicle, location },
      });
      log('info', 'Booking created', { bookingId, userId });

      return c.json({
        booking,
        dispatch: dispatchResult,
        message: 'Booking created successfully',
      });
    } catch (error) {
      log('error', 'Create booking error', { error: String(error) });
      return c.json({ error: 'Internal server error creating booking' }, 500);
    }
  },

  getMyBookings: async (c: Context) => {
    try {
      const userId = c.get('userId');
      const user = c.get('user');
      const userType = user.user_metadata?.userType;

      let bookingIds: string[] = [];
      if (userType === 'customer') {
        bookingIds = (await kv.get(`customer:bookings:${userId}`)) || [];
      } else if (userType === 'provider') {
        bookingIds = (await kv.get(`provider:bookings:${userId}`)) || [];
      }

      const bookings = await kv.mget(bookingIds);
      return c.json({ bookings: bookings.filter(Boolean) });
    } catch (error) {
      log('error', 'Get my bookings error', { error: String(error) });
      return c.json({ error: 'Internal server error getting bookings' }, 500);
    }
  },

  getPending: async (c: Context) => {
    try {
      const userId = c.get('userId');
      const user = c.get('user');
      if (user.user_metadata?.userType !== 'provider') {
        return c.json({ error: 'Only providers can view pending bookings' }, 403);
      }

      const pendingIds = (await kv.get('bookings:pending')) || [];
      const bookings = await kv.mget(pendingIds);
      const visibleBookings = [];
      for (const booking of bookings) {
        if (!booking || booking.status !== 'pending') {
          continue;
        }
        const declinedBy = ((await kv.get(`booking:declines:${booking.id}`)) || []) as string[];
        if (declinedBy.includes(userId)) {
          continue;
        }
        visibleBookings.push(booking);
      }
      return c.json({ bookings: visibleBookings });
    } catch (error) {
      log('error', 'Get pending bookings error', { error: String(error) });
      return c.json({ error: 'Internal server error getting pending bookings' }, 500);
    }
  },

  accept: async (c: Context) => {
    try {
      const userId = c.get('userId');
      const user = c.get('user');
      const { bookingId } = await c.req.json();

      if (user.user_metadata?.userType !== 'provider') {
        return c.json({ error: 'Only providers can accept bookings' }, 403);
      }

      const booking = await readBooking(bookingId);
      if (!booking) {
        return c.json({ error: 'Booking not found' }, 404);
      }

      if (booking.status !== 'pending') {
        return c.json({ error: 'Booking is no longer available' }, 400);
      }

      const providerProfile = await kv.get(`user:${userId}`);
      const now = new Date().toISOString();
      booking.status = 'assigned';
      booking.mechanicId = userId;
      booking.mechanicName = providerProfile?.name || 'Mechanic';
      booking.mechanicImage = providerProfile?.profileImage || '';
      booking.estimatedArrival = '15-20 min';
      booking.acceptedAt = now;
      booking.updatedAt = now;

      await kv.set(booking.id, booking);

      const providerBookings = (await kv.get(`provider:bookings:${userId}`)) || [];
      if (!providerBookings.includes(booking.id)) {
        providerBookings.unshift(booking.id);
        await kv.set(`provider:bookings:${userId}`, providerBookings);
      }

      await removeFromPendingQueue(booking.id);
      await audit.log({
        action: 'booking.accepted',
        userId,
        targetId: booking.id,
        details: { customerId: booking.customerId },
      });
      log('info', 'Booking accepted', { bookingId: booking.id, userId });

      return c.json({ booking, message: 'Booking accepted successfully' });
    } catch (error) {
      log('error', 'Accept booking error', { error: String(error) });
      return c.json({ error: 'Internal server error accepting booking' }, 500);
    }
  },

  decline: async (c: Context) => {
    try {
      const userId = c.get('userId');
      const user = c.get('user');
      const { bookingId } = await c.req.json();

      if (user.user_metadata?.userType !== 'provider') {
        return c.json({ error: 'Only providers can decline bookings' }, 403);
      }

      const booking = await readBooking(bookingId);
      if (!booking) {
        return c.json({ error: 'Booking not found' }, 404);
      }
      if (booking.status !== 'pending') {
        return c.json({ error: 'Booking is no longer pending' }, 400);
      }

      const key = `booking:declines:${booking.id}`;
      const declinedBy = ((await kv.get(key)) || []) as string[];
      if (!declinedBy.includes(userId)) {
        declinedBy.push(userId);
        await kv.set(key, declinedBy);
      }

      await audit.log({
        action: 'booking.declined',
        userId,
        targetId: booking.id,
        details: {},
      });

      return c.json({ success: true, message: 'Booking declined' });
    } catch (error) {
      log('error', 'Decline booking error', { error: String(error) });
      return c.json({ error: 'Internal server error declining booking' }, 500);
    }
  },

  updateStatus: async (c: Context) => {
    try {
      const userId = c.get('userId');
      const { bookingId, status, price } = await c.req.json();

      if (!bookingId || !status || !VALID_STATUSES.has(status)) {
        return c.json({ error: 'Invalid bookingId or status' }, 400);
      }

      const booking = await readBooking(bookingId);
      if (!booking) {
        return c.json({ error: 'Booking not found' }, 404);
      }

      if (!isParticipant(booking, userId)) {
        return c.json({ error: 'Unauthorized to update this booking' }, 403);
      }

      const now = new Date().toISOString();
      booking.status = status;
      booking.updatedAt = now;

      if (typeof price === 'number') {
        booking.price = price;
        booking.totalCost = price;
      }

      if (status === 'arrived') {
        booking.arrivedAt = now;
      }
      if (status === 'in_progress') {
        booking.startedAt = now;
      }
      if (status === 'completed') {
        booking.completedAt = now;
        if (booking.mechanicId) {
          const providerProfile = await kv.get(`user:${booking.mechanicId}`);
          if (providerProfile) {
            providerProfile.completedJobs = (providerProfile.completedJobs || 0) + 1;
            await kv.set(`user:${booking.mechanicId}`, providerProfile);
          }
        }
      }

      await kv.set(booking.id, booking);
      await audit.log({
        action: 'booking.status_updated',
        userId,
        targetId: booking.id,
        details: { status, price: price ?? null },
      });
      log('info', 'Booking status updated', { bookingId: booking.id, status, userId });

      return c.json({ booking, message: 'Booking updated successfully' });
    } catch (error) {
      log('error', 'Update booking status error', { error: String(error) });
      return c.json({ error: 'Internal server error updating booking' }, 500);
    }
  },

  getById: async (c: Context) => {
    try {
      const userId = c.get('userId');
      const booking = await readBooking(c.req.param('id'));

      if (!booking) {
        return c.json({ error: 'Booking not found' }, 404);
      }

      if (!isParticipant(booking, userId)) {
        return c.json({ error: 'Unauthorized to view this booking' }, 403);
      }

      return c.json({ booking });
    } catch (error) {
      log('error', 'Get booking error', { error: String(error) });
      return c.json({ error: 'Internal server error getting booking' }, 500);
    }
  },

  cancel: async (c: Context) => {
    try {
      const userId = c.get('userId');
      const { bookingId, reason } = await c.req.json();
      const booking = await readBooking(bookingId);

      if (!booking) {
        return c.json({ error: 'Booking not found' }, 404);
      }

      if (booking.customerId !== userId) {
        return c.json({ error: 'Only the customer can cancel this booking' }, 403);
      }

      if (booking.status === 'completed') {
        return c.json({ error: 'Cannot cancel completed booking' }, 400);
      }

      const previousStatus = booking.status;
      booking.status = 'cancelled';
      booking.cancelledAt = new Date().toISOString();
      booking.cancellationReason = reason || '';
      booking.updatedAt = booking.cancelledAt;
      await kv.set(booking.id, booking);

      if (previousStatus === 'pending') {
        await removeFromPendingQueue(booking.id);
      }

      await audit.log({
        action: 'booking.cancelled',
        userId,
        targetId: booking.id,
        details: { previousStatus, reason: reason || '' },
      });
      log('info', 'Booking cancelled', { bookingId: booking.id, userId, previousStatus });

      return c.json({ booking, message: 'Booking cancelled successfully' });
    } catch (error) {
      log('error', 'Cancel booking error', { error: String(error) });
      return c.json({ error: 'Internal server error cancelling booking' }, 500);
    }
  },

  rate: async (c: Context) => {
    try {
      const userId = c.get('userId');
      const { bookingId, rating, review } = await c.req.json();

      if (typeof rating !== 'number' || rating < 1 || rating > 5) {
        return c.json({ error: 'Rating must be between 1 and 5' }, 400);
      }

      const booking = await readBooking(bookingId);
      if (!booking || booking.status !== 'completed') {
        return c.json({ error: 'Booking not completed' }, 400);
      }
      if (booking.customerId !== userId) {
        return c.json({ error: 'Only customer can rate' }, 403);
      }
      if (booking.rated) {
        return c.json({ error: 'Already rated' }, 400);
      }

      const ratingId = `rating:${booking.id}`;
      const ratingRecord = {
        id: ratingId,
        bookingId: booking.id,
        fromUserId: userId,
        toUserId: booking.mechanicId,
        score: rating,
        comment: review || '',
        createdAt: new Date().toISOString(),
      };
      await kv.set(ratingId, ratingRecord);

      booking.rated = true;
      booking.rating = rating;
      await kv.set(booking.id, booking);

      if (booking.mechanicId) {
        const mechanicRatings = (await kv.get(`provider:ratings:${booking.mechanicId}`)) || [];
        mechanicRatings.push(rating);
        await kv.set(`provider:ratings:${booking.mechanicId}`, mechanicRatings);

        const average =
          mechanicRatings.reduce((sum: number, value: number) => sum + value, 0) /
          mechanicRatings.length;
        const profile = await kv.get(`user:${booking.mechanicId}`);
        if (profile) {
          profile.rating = parseFloat(average.toFixed(1));
          await kv.set(`user:${booking.mechanicId}`, profile);
        }
      }

      await audit.log({
        action: 'booking.rated',
        userId,
        targetId: booking.id,
        details: { rating },
      });
      return c.json({ rating: ratingRecord, message: 'Rating submitted' });
    } catch (error) {
      log('error', 'Rate booking error', { error: String(error) });
      return c.json({ error: 'Internal server error submitting rating' }, 500);
    }
  },

  addJobPhoto: async (c: Context) => {
    try {
      const userId = c.get('userId');
      const bookingId = c.req.param('id');
      const { photoUrl, type, caption } = await c.req.json();
      const booking = await readBooking(bookingId);

      if (!booking) {
        return c.json({ error: 'Booking not found' }, 404);
      }
      if (booking.mechanicId !== userId && booking.customerId !== userId) {
        return c.json({ error: 'Unauthorized' }, 403);
      }
      if (!photoUrl || !type) {
        return c.json({ error: 'Missing photoUrl or type' }, 400);
      }

      const photos = (await kv.get(`booking:photos:${booking.id}`)) || [];
      const photo = {
        id: `photo:${Date.now()}`,
        url: photoUrl,
        type,
        caption: caption || '',
        uploadedBy: userId,
        uploadedAt: new Date().toISOString(),
      };
      photos.push(photo);
      await kv.set(`booking:photos:${booking.id}`, photos);

      await audit.log({
        action: 'booking.photo_added',
        userId,
        targetId: booking.id,
        details: { type },
      });
      return c.json({ photo, message: 'Photo added' });
    } catch (error) {
      log('error', 'Add job photo error', { error: String(error) });
      return c.json({ error: 'Internal server error adding photo' }, 500);
    }
  },

  getJobPhotos: async (c: Context) => {
    try {
      const userId = c.get('userId');
      const booking = await readBooking(c.req.param('id'));
      if (!booking) {
        return c.json({ error: 'Booking not found' }, 404);
      }
      if (!isParticipant(booking, userId)) {
        return c.json({ error: 'Unauthorized' }, 403);
      }

      const photos = (await kv.get(`booking:photos:${booking.id}`)) || [];
      return c.json({ photos });
    } catch (error) {
      log('error', 'Get job photos error', { error: String(error) });
      return c.json({ error: 'Internal server error getting photos' }, 500);
    }
  },
};
