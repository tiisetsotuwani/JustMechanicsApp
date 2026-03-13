import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { authRoutes, requireAuth } from "./auth.tsx";
import { bookingRoutes } from "./bookings.tsx";
import { profileRoutes } from "./profile.tsx";
import { storageRoutes, initStorage } from "./storage.tsx";
import { providerRoutes } from "./provider.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Initialize storage on server start
initStorage();

// Health check endpoint
app.get("/make-server-dd7ceef7/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ========== AUTH ROUTES (Public) ==========
app.post("/make-server-dd7ceef7/auth/signup", authRoutes.signup);
app.post("/make-server-dd7ceef7/auth/signin", authRoutes.signin);
app.get("/make-server-dd7ceef7/auth/session", authRoutes.getSession);
app.post("/make-server-dd7ceef7/auth/signout", authRoutes.signout);

// ========== PROFILE ROUTES (Protected) ==========
app.get("/make-server-dd7ceef7/profile", requireAuth, profileRoutes.get);
app.put("/make-server-dd7ceef7/profile", requireAuth, profileRoutes.update);

// Address management
app.get("/make-server-dd7ceef7/profile/addresses", requireAuth, profileRoutes.getAddresses);
app.post("/make-server-dd7ceef7/profile/addresses", requireAuth, profileRoutes.addAddress);
app.put("/make-server-dd7ceef7/profile/addresses", requireAuth, profileRoutes.updateAddress);
app.delete("/make-server-dd7ceef7/profile/addresses", requireAuth, profileRoutes.deleteAddress);

// Vehicle management
app.get("/make-server-dd7ceef7/profile/vehicles", requireAuth, profileRoutes.getVehicles);
app.post("/make-server-dd7ceef7/profile/vehicles", requireAuth, profileRoutes.addVehicle);
app.put("/make-server-dd7ceef7/profile/vehicles", requireAuth, profileRoutes.updateVehicle);
app.delete("/make-server-dd7ceef7/profile/vehicles", requireAuth, profileRoutes.deleteVehicle);

// ========== BOOKING ROUTES (Protected) ==========
app.post("/make-server-dd7ceef7/bookings", requireAuth, bookingRoutes.create);
app.get("/make-server-dd7ceef7/bookings", requireAuth, bookingRoutes.getMyBookings);
app.get("/make-server-dd7ceef7/bookings/pending", requireAuth, bookingRoutes.getPending);
app.get("/make-server-dd7ceef7/bookings/:id", requireAuth, bookingRoutes.getById);
app.post("/make-server-dd7ceef7/bookings/accept", requireAuth, bookingRoutes.accept);
app.put("/make-server-dd7ceef7/bookings/status", requireAuth, bookingRoutes.updateStatus);
app.post("/make-server-dd7ceef7/bookings/cancel", requireAuth, bookingRoutes.cancel);

// ========== PROVIDER ROUTES (Protected) ==========
app.put("/make-server-dd7ceef7/provider/availability", requireAuth, providerRoutes.updateAvailability);
app.get("/make-server-dd7ceef7/provider/stats", requireAuth, providerRoutes.getStats);
app.get("/make-server-dd7ceef7/provider/earnings", requireAuth, providerRoutes.getEarnings);
app.put("/make-server-dd7ceef7/provider/services", requireAuth, providerRoutes.updateServices);
app.get("/make-server-dd7ceef7/providers/online", requireAuth, providerRoutes.getOnlineProviders);

// ========== STORAGE ROUTES (Protected) ==========
app.post("/make-server-dd7ceef7/storage/upload", requireAuth, storageRoutes.upload);
app.post("/make-server-dd7ceef7/storage/url", requireAuth, storageRoutes.getSignedUrl);
app.delete("/make-server-dd7ceef7/storage/delete", requireAuth, storageRoutes.delete);
app.get("/make-server-dd7ceef7/storage/list", requireAuth, storageRoutes.list);

// ========== REAL-TIME TRACKING ROUTE (Protected) ==========
app.get("/make-server-dd7ceef7/tracking/:bookingId", requireAuth, async (c) => {
  try {
    const bookingId = c.req.param('bookingId');
    const booking = await kv.get(bookingId);
    
    if (!booking) {
      return c.json({ error: 'Booking not found' }, 404);
    }

    // In production, this would get real-time GPS data from provider's device
    // For now, simulate movement
    const location = await kv.get(`tracking:${bookingId}`) || {
      lat: -26.2041,
      lng: 28.0473,
      timestamp: Date.now(),
      speed: 40,
      heading: 90,
    };

    return c.json({ location });
  } catch (error) {
    console.log(`Tracking error: ${error}`);
    return c.json({ error: 'Internal server error getting tracking data' }, 500);
  }
});

// Update location (called by provider)
app.post("/make-server-dd7ceef7/tracking/update", requireAuth, async (c) => {
  try {
    const { bookingId, lat, lng, speed, heading } = await c.req.json();
    
    const locationData = {
      lat,
      lng,
      timestamp: Date.now(),
      speed,
      heading,
    };
    
    await kv.set(`tracking:${bookingId}`, locationData);
    
    return c.json({ success: true, location: locationData });
  } catch (error) {
    console.log(`Update tracking error: ${error}`);
    return c.json({ error: 'Failed to update location' }, 500);
  }
});

// ========== MESSAGING ROUTES (Protected) ==========
app.get("/make-server-dd7ceef7/messages/:bookingId", requireAuth, async (c) => {
  try {
    const bookingId = c.req.param('bookingId');
    const messages = await kv.get(`messages:${bookingId}`) || [];
    
    return c.json({ messages });
  } catch (error) {
    console.log(`Get messages error: ${error}`);
    return c.json({ error: 'Failed to get messages' }, 500);
  }
});

app.post("/make-server-dd7ceef7/messages", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const user = c.get('user');
    const { bookingId, text } = await c.req.json();
    
    const messages = await kv.get(`messages:${bookingId}`) || [];
    
    const newMessage = {
      id: `msg_${Date.now()}`,
      senderId: userId,
      senderName: user.user_metadata?.name || 'User',
      text,
      timestamp: Date.now(),
      read: false,
      type: 'text',
    };
    
    messages.push(newMessage);
    await kv.set(`messages:${bookingId}`, messages);
    
    return c.json({ message: newMessage });
  } catch (error) {
    console.log(`Send message error: ${error}`);
    return c.json({ error: 'Failed to send message' }, 500);
  }
});

app.post("/make-server-dd7ceef7/messages/read", requireAuth, async (c) => {
  try {
    const { messageIds } = await c.req.json();
    
    // Mark messages as read (implementation would update database)
    return c.json({ success: true });
  } catch (error) {
    console.log(`Mark read error: ${error}`);
    return c.json({ error: 'Failed to mark as read' }, 500);
  }
});

// ========== PAYMENT ROUTES (Protected) ==========
app.get("/make-server-dd7ceef7/payment/methods", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const methods = await kv.get(`payment:methods:${userId}`) || [];
    
    return c.json({ methods });
  } catch (error) {
    console.log(`Get payment methods error: ${error}`);
    return c.json({ error: 'Failed to get payment methods' }, 500);
  }
});

app.post("/make-server-dd7ceef7/payment/process", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const { bookingId, amount, paymentMethod, cardDetails } = await c.req.json();
    
    // In production, integrate with Payfast API
    // For demo, simulate successful payment
    const paymentId = `PAY_${Date.now()}`;
    
    const payment = {
      id: paymentId,
      bookingId,
      userId,
      amount,
      method: paymentMethod,
      status: 'completed',
      timestamp: Date.now(),
    };
    
    await kv.set(paymentId, payment);
    
    // Save card if requested
    if (cardDetails?.save) {
      const methods = await kv.get(`payment:methods:${userId}`) || [];
      methods.push({
        id: `card_${Date.now()}`,
        type: 'card',
        last4: cardDetails.number.slice(-4),
        brand: 'Visa', // Detect from card number in production
        expiryMonth: cardDetails.expiry.slice(0, 2),
        expiryYear: cardDetails.expiry.slice(2),
        isDefault: methods.length === 0,
      });
      await kv.set(`payment:methods:${userId}`, methods);
    }
    
    return c.json({ success: true, paymentId, payment });
  } catch (error) {
    console.log(`Payment processing error: ${error}`);
    return c.json({ error: 'Payment failed' }, 500);
  }
});

// ========== REVIEW/RATING ROUTES (Protected) ==========
app.post("/make-server-dd7ceef7/reviews", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const user = c.get('user');
    const { bookingId, providerId, rating, review, tags } = await c.req.json();
    
    const reviewData = {
      id: `review_${Date.now()}`,
      bookingId,
      providerId,
      userId,
      userName: user.user_metadata?.name || 'Anonymous',
      userImage: user.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
      rating,
      review,
      tags,
      date: new Date().toISOString(),
      timestamp: Date.now(),
    };
    
    await kv.set(reviewData.id, reviewData);
    
    // Add to provider's reviews list
    const providerReviews = await kv.get(`reviews:provider:${providerId}`) || [];
    providerReviews.push(reviewData.id);
    await kv.set(`reviews:provider:${providerId}`, providerReviews);
    
    return c.json({ success: true, review: reviewData });
  } catch (error) {
    console.log(`Submit review error: ${error}`);
    return c.json({ error: 'Failed to submit review' }, 500);
  }
});

app.get("/make-server-dd7ceef7/reviews/:providerId", async (c) => {
  try {
    const providerId = c.req.param('providerId');
    const reviewIds = await kv.get(`reviews:provider:${providerId}`) || [];
    const reviews = await kv.mget(reviewIds);
    
    return c.json({ reviews: reviews.filter(r => r !== null) });
  } catch (error) {
    console.log(`Get reviews error: ${error}`);
    return c.json({ error: 'Failed to get reviews' }, 500);
  }
});

// ========== PUSH NOTIFICATION ROUTES (Protected) ==========
app.post("/make-server-dd7ceef7/notifications/subscribe", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const { subscription } = await c.req.json();
    
    await kv.set(`push:subscription:${userId}`, subscription);
    
    return c.json({ success: true });
  } catch (error) {
    console.log(`Subscribe notification error: ${error}`);
    return c.json({ error: 'Failed to subscribe' }, 500);
  }
});

app.post("/make-server-dd7ceef7/notifications/unsubscribe", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    
    await kv.del(`push:subscription:${userId}`);
    
    return c.json({ success: true });
  } catch (error) {
    console.log(`Unsubscribe notification error: ${error}`);
    return c.json({ error: 'Failed to unsubscribe' }, 500);
  }
});

app.post("/make-server-dd7ceef7/notifications/send", requireAuth, async (c) => {
  try {
    const { userId, title, body, data } = await c.req.json();
    
    const subscription = await kv.get(`push:subscription:${userId}`);
    
    if (!subscription) {
      return c.json({ error: 'User not subscribed' }, 404);
    }
    
    // In production, use web-push library to send notification
    // For demo, just return success
    return c.json({ success: true });
  } catch (error) {
    console.log(`Send notification error: ${error}`);
    return c.json({ error: 'Failed to send notification' }, 500);
  }
});

// ========== STATISTICS & ANALYTICS ==========
app.get("/make-server-dd7ceef7/analytics/overview", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const user = c.get('user');
    const userType = user.user_metadata?.userType;

    const bookingIds = userType === 'customer' 
      ? await kv.get(`customer:bookings:${userId}`) || []
      : await kv.get(`provider:bookings:${userId}`) || [];

    const bookings = await kv.mget(bookingIds);
    
    const analytics = {
      totalBookings: bookings.length,
      completed: bookings.filter((b: any) => b?.status === 'completed').length,
      pending: bookings.filter((b: any) => b?.status === 'pending').length,
      cancelled: bookings.filter((b: any) => b?.status === 'cancelled').length,
      inProgress: bookings.filter((b: any) => b?.status === 'in-progress').length,
    };

    return c.json({ analytics });
  } catch (error) {
    console.log(`Analytics error: ${error}`);
    return c.json({ error: 'Internal server error getting analytics' }, 500);
  }
});

Deno.serve(app.fetch);