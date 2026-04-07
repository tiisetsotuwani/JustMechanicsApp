import { Context } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { audit } from "./audit.tsx";
import { log } from "./logger.tsx";

type Coordinates = { lat: number; lng: number };

interface DispatchOffer {
  id: string;
  bookingId: string;
  providerId: string;
  customerId: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';
  rank: number;
  distanceKm: number;
  createdAt: string;
  expiresAt: string;
  respondedAt: string | null;
}

interface DispatchState {
  bookingId: string;
  customerId: string;
  candidateProviderIds: string[];
  nextIndex: number;
  currentOfferId: string | null;
  status: 'idle' | 'offered' | 'assigned' | 'exhausted';
  updatedAt: string;
}

const OFFER_TTL_MS = 45_000;

const nowIso = () => new Date().toISOString();

const parseCoordinates = (value: unknown): Coordinates | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const record = value as Record<string, unknown>;
  const lat = typeof record.lat === 'number' ? record.lat : null;
  const lng = typeof record.lng === 'number' ? record.lng : null;
  if (lat === null || lng === null) {
    return null;
  }
  return { lat, lng };
};

const toRadians = (value: number) => (value * Math.PI) / 180;

const distanceKm = (a: Coordinates, b: Coordinates) => {
  const earthRadiusKm = 6371;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const startLat = toRadians(a.lat);
  const endLat = toRadians(b.lat);

  const inner =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(startLat) * Math.cos(endLat);
  const c = 2 * Math.atan2(Math.sqrt(inner), Math.sqrt(1 - inner));
  return earthRadiusKm * c;
};

const removeFromPendingQueue = async (bookingId: string) => {
  const queue = ((await kv.get('bookings:pending')) || []) as string[];
  await kv.set(
    'bookings:pending',
    queue.filter((id) => id !== bookingId),
  );
};

const getActiveProviderJobCount = async (providerId: string) => {
  const bookingIds = ((await kv.get(`provider:bookings:${providerId}`)) || []) as string[];
  if (!bookingIds.length) {
    return 0;
  }
  const bookings = await kv.mget(bookingIds);
  return bookings.filter((booking) =>
    ['assigned', 'en_route', 'arrived', 'in_progress'].includes(booking?.status as string),
  ).length;
};

const cancelOtherOffers = async (bookingId: string, acceptedOfferId: string) => {
  const offerIds = ((await kv.get(`booking:offers:${bookingId}`)) || []) as string[];
  for (const offerId of offerIds) {
    if (offerId === acceptedOfferId) {
      continue;
    }
    const offer = (await kv.get(offerId)) as DispatchOffer | null;
    if (!offer || offer.status !== 'pending') {
      continue;
    }
    offer.status = 'cancelled';
    offer.respondedAt = nowIso();
    await kv.set(offerId, offer);
  }
};

const getDispatchState = async (bookingId: string) =>
  ((await kv.get(`dispatch:booking:${bookingId}`)) as DispatchState | null);

const setDispatchState = async (state: DispatchState) => {
  await kv.set(`dispatch:booking:${state.bookingId}`, state);
};

const registerActiveDispatch = async (bookingId: string) => {
  const active = ((await kv.get('dispatch:active')) || []) as string[];
  if (!active.includes(bookingId)) {
    active.unshift(bookingId);
    await kv.set('dispatch:active', active);
  }
};

const unregisterActiveDispatch = async (bookingId: string) => {
  const active = ((await kv.get('dispatch:active')) || []) as string[];
  await kv.set(
    'dispatch:active',
    active.filter((id) => id !== bookingId),
  );
};

const processExpiredCurrentOffer = async (bookingId: string) => {
  const state = await getDispatchState(bookingId);
  if (!state || !state.currentOfferId) {
    return { processed: false, reason: 'no_active_offer' };
  }

  const offer = (await kv.get(state.currentOfferId)) as DispatchOffer | null;
  if (!offer || offer.status !== 'pending') {
    return { processed: false, reason: 'offer_not_pending' };
  }

  if (new Date(offer.expiresAt).getTime() > Date.now()) {
    return { processed: false, reason: 'offer_not_expired' };
  }

  offer.status = 'expired';
  offer.respondedAt = nowIso();
  await kv.set(offer.id, offer);
  const fallback = await assignNextProvider(bookingId);
  return { processed: true, expiredOfferId: offer.id, fallback };
};

const assignNextProvider = async (bookingId: string) => {
  const booking = await kv.get(bookingId);
  if (!booking || booking.status !== 'pending') {
    await unregisterActiveDispatch(bookingId);
    return { assigned: false, exhausted: true, reason: 'booking_not_pending' };
  }

  const state = await getDispatchState(bookingId);
  if (!state) {
    return { assigned: false, exhausted: true, reason: 'missing_dispatch_state' };
  }

  while (state.nextIndex < state.candidateProviderIds.length) {
    const providerId = state.candidateProviderIds[state.nextIndex];
    state.nextIndex += 1;

    const availability = (await kv.get(`provider:availability:${providerId}`)) || {};
    const profile = await kv.get(`user:${providerId}`);
    const activeJobs = await getActiveProviderJobCount(providerId);
    const capacity =
      typeof availability.activeCapacity === 'number' && availability.activeCapacity > 0
        ? availability.activeCapacity
        : 3;
    if (!availability.isOnline || profile?.suspended || activeJobs >= capacity) {
      continue;
    }

    const offerIds = ((await kv.get(`booking:offers:${bookingId}`)) || []) as string[];
    const offer: DispatchOffer = {
      id: `offer:${Date.now()}:${providerId}`,
      bookingId,
      providerId,
      customerId: booking.customerId as string,
      status: 'pending',
      rank: state.nextIndex,
      distanceKm: 0,
      createdAt: nowIso(),
      expiresAt: new Date(Date.now() + OFFER_TTL_MS).toISOString(),
      respondedAt: null,
    };

    await kv.set(offer.id, offer);
    offerIds.unshift(offer.id);
    await kv.set(`booking:offers:${bookingId}`, offerIds);

    const providerOfferIds = ((await kv.get(`provider:offers:${providerId}`)) || []) as string[];
    providerOfferIds.unshift(offer.id);
    await kv.set(`provider:offers:${providerId}`, providerOfferIds);

    state.currentOfferId = offer.id;
    state.status = 'offered';
    state.updatedAt = nowIso();
    await setDispatchState(state);
    await registerActiveDispatch(bookingId);

    await audit.log({
      action: 'dispatch.offer_created',
      userId: booking.customerId as string,
      targetId: bookingId,
      details: { providerId, offerId: offer.id },
    });
    return { assigned: true, offer };
  }

  state.status = 'exhausted';
  state.currentOfferId = null;
  state.updatedAt = nowIso();
  await setDispatchState(state);
  await unregisterActiveDispatch(bookingId);
  return { assigned: false, exhausted: true, reason: 'no_more_providers' };
};

export const dispatchEngine = {
  autoOfferNearestProviders: async (bookingId: string) => {
    const booking = await kv.get(bookingId);
    if (!booking || booking.status !== 'pending') {
      return { dispatched: false, reason: 'booking_not_pending' };
    }

    const bookingCoordinates = parseCoordinates(booking.coordinates);
    if (!bookingCoordinates) {
      return { dispatched: false, reason: 'missing_coordinates' };
    }

    const allProfiles = await kv.getByPrefix('user:');
    const candidates: Array<{ providerId: string; distance: number }> = [];
    for (const profile of allProfiles) {
      if (!profile || profile.userType !== 'provider' || !profile.isOnline || profile.suspended) {
        continue;
      }
      const providerId = profile.id as string;
      const availability = (await kv.get(`provider:availability:${providerId}`)) || {};
      const providerCoordinates = parseCoordinates({
        lat: availability.lat,
        lng: availability.lng,
      });
      if (!providerCoordinates) {
        continue;
      }
      const activeJobs = await getActiveProviderJobCount(providerId);
      const capacity =
        typeof availability.activeCapacity === 'number' && availability.activeCapacity > 0
          ? availability.activeCapacity
          : 3;
      if (activeJobs >= capacity) {
        continue;
      }

      const maxRadiusKm =
        typeof availability.serviceRadius === 'number' && availability.serviceRadius > 0
          ? availability.serviceRadius
          : 25;
      const distance = distanceKm(bookingCoordinates, providerCoordinates);
      if (distance <= maxRadiusKm) {
        candidates.push({ providerId, distance });
      }
    }

    candidates.sort((a, b) => a.distance - b.distance);
    if (!candidates.length) {
      return { dispatched: false, reason: 'no_available_provider_in_radius' };
    }

    const state: DispatchState = {
      bookingId,
      customerId: booking.customerId as string,
      candidateProviderIds: candidates.map((item) => item.providerId),
      nextIndex: 0,
      currentOfferId: null,
      status: 'idle',
      updatedAt: nowIso(),
    };
    await setDispatchState(state);
    return assignNextProvider(bookingId);
  },
};

export const dispatchRoutes = {
  getMyOffers: async (c: Context) => {
    try {
      const userId = c.get('userId');
      const user = c.get('user');
      if (user.user_metadata?.userType !== 'provider') {
        return c.json({ error: 'Only providers can view dispatch offers' }, 403);
      }

      const offerIds = ((await kv.get(`provider:offers:${userId}`)) || []) as string[];
      const offersRaw = await kv.mget(offerIds);
      const now = Date.now();
      const offers = [];
      for (const raw of offersRaw) {
        const offer = raw as DispatchOffer | null;
        if (!offer || offer.status !== 'pending') {
          continue;
        }
        if (new Date(offer.expiresAt).getTime() <= now) {
          await processExpiredCurrentOffer(offer.bookingId);
          continue;
        }
        const booking = await kv.get(offer.bookingId);
        if (!booking || booking.status !== 'pending') {
          continue;
        }
        offers.push({ ...offer, booking });
      }

      return c.json({ offers });
    } catch (error) {
      log('error', 'Get provider offers error', { error: String(error) });
      return c.json({ error: 'Internal server error getting offers' }, 500);
    }
  },

  respond: async (c: Context) => {
    try {
      const userId = c.get('userId');
      const user = c.get('user');
      if (user.user_metadata?.userType !== 'provider') {
        return c.json({ error: 'Only providers can respond to offers' }, 403);
      }

      const body = (await c.req.json()) as { offerId?: string; decision?: string };
      if (!body.offerId || !['accept', 'decline'].includes(body.decision || '')) {
        return c.json({ error: 'Invalid offerId or decision' }, 400);
      }

      const offer = (await kv.get(body.offerId)) as DispatchOffer | null;
      if (!offer) {
        return c.json({ error: 'Offer not found' }, 404);
      }
      if (offer.providerId !== userId) {
        return c.json({ error: 'Unauthorized for this offer' }, 403);
      }
      if (offer.status !== 'pending') {
        return c.json({ error: 'Offer is no longer active' }, 400);
      }
      if (new Date(offer.expiresAt).getTime() <= Date.now()) {
        offer.status = 'expired';
        offer.respondedAt = nowIso();
        await kv.set(offer.id, offer);
        await assignNextProvider(offer.bookingId);
        return c.json({ error: 'Offer expired' }, 400);
      }

      const booking = await kv.get(offer.bookingId);
      if (!booking || booking.status !== 'pending') {
        offer.status = 'cancelled';
        offer.respondedAt = nowIso();
        await kv.set(offer.id, offer);
        return c.json({ error: 'Booking no longer pending' }, 400);
      }

      if (body.decision === 'decline') {
        offer.status = 'declined';
        offer.respondedAt = nowIso();
        await kv.set(offer.id, offer);
        await audit.log({
          action: 'dispatch.offer_declined',
          userId,
          targetId: offer.bookingId,
          details: { offerId: offer.id },
        });
        const fallback = await assignNextProvider(offer.bookingId);
        return c.json({ offer, fallback, message: 'Offer declined' });
      }

      const providerProfile = await kv.get(`user:${userId}`);
      const timestamp = nowIso();
      booking.status = 'assigned';
      booking.mechanicId = userId;
      booking.mechanicName = providerProfile?.name || 'Mechanic';
      booking.mechanicImage = providerProfile?.profileImage || '';
      booking.acceptedAt = timestamp;
      booking.updatedAt = timestamp;
      booking.estimatedArrival = booking.estimatedArrival || '15-20 min';
      await kv.set(booking.id, booking);

      const providerBookings = ((await kv.get(`provider:bookings:${userId}`)) || []) as string[];
      if (!providerBookings.includes(booking.id)) {
        providerBookings.unshift(booking.id);
        await kv.set(`provider:bookings:${userId}`, providerBookings);
      }

      await removeFromPendingQueue(booking.id as string);

      offer.status = 'accepted';
      offer.respondedAt = timestamp;
      await kv.set(offer.id, offer);
      await cancelOtherOffers(booking.id as string, offer.id);

      const state = await getDispatchState(booking.id as string);
      if (state) {
        state.status = 'assigned';
        state.currentOfferId = offer.id;
        state.updatedAt = timestamp;
        await setDispatchState(state);
      }
      await unregisterActiveDispatch(booking.id as string);

      await audit.log({
        action: 'dispatch.offer_accepted',
        userId,
        targetId: booking.id as string,
        details: { offerId: offer.id },
      });

      return c.json({ booking, offer, message: 'Offer accepted and booking assigned' });
    } catch (error) {
      log('error', 'Respond to dispatch offer error', { error: String(error) });
      return c.json({ error: 'Internal server error responding to offer' }, 500);
    }
  },

  tick: async (c: Context) => {
    try {
      const user = c.get('user');
      const metadata = (user?.user_metadata || {}) as Record<string, unknown>;
      if (metadata.userType !== 'admin' && metadata.userType !== 'provider') {
        return c.json({ error: 'Unauthorized' }, 403);
      }

      const activeBookingIds = ((await kv.get('dispatch:active')) || []) as string[];
      const results: Array<Record<string, unknown>> = [];
      for (const bookingId of activeBookingIds) {
        const processed = await processExpiredCurrentOffer(bookingId);
        if (processed.processed) {
          results.push({
            bookingId,
            expiredOfferId: processed.expiredOfferId,
            fallback: processed.fallback,
          });
        }
      }

      return c.json({ processed: results.length, results });
    } catch (error) {
      log('error', 'Dispatch tick error', { error: String(error) });
      return c.json({ error: 'Internal server error running dispatch tick' }, 500);
    }
  },

  getStatus: async (c: Context) => {
    try {
      const userId = c.get('userId');
      const bookingId = c.req.param('bookingId');
      const booking = await kv.get(bookingId);
      if (!booking) {
        return c.json({ error: 'Booking not found' }, 404);
      }

      const user = c.get('user');
      const metadata = (user?.user_metadata || {}) as Record<string, unknown>;
      const isAdmin = metadata.userType === 'admin';
      if (booking.customerId !== userId && booking.mechanicId !== userId && !isAdmin) {
        return c.json({ error: 'Unauthorized' }, 403);
      }

      await processExpiredCurrentOffer(bookingId);
      const state = await getDispatchState(bookingId);
      const currentOffer =
        state?.currentOfferId ? ((await kv.get(state.currentOfferId)) as DispatchOffer | null) : null;
      const expiresInSeconds =
        currentOffer?.expiresAt && currentOffer.status === 'pending'
          ? Math.max(0, Math.floor((new Date(currentOffer.expiresAt).getTime() - Date.now()) / 1000))
          : 0;

      return c.json({
        bookingId,
        bookingStatus: booking.status,
        dispatch: state || null,
        currentOffer: currentOffer || null,
        expiresInSeconds,
      });
    } catch (error) {
      log('error', 'Get dispatch status error', { error: String(error) });
      return c.json({ error: 'Internal server error getting dispatch status' }, 500);
    }
  },
};
