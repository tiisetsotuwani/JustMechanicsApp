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

    // Simulate real-time location data
    const trackingData = {
      bookingId,
      mechanicLocation: {
        lat: 40.7580 + (Math.random() - 0.5) * 0.01,
        lng: -73.9855 + (Math.random() - 0.5) * 0.01,
      },
      estimatedArrival: booking.estimatedArrival,
      status: booking.status,
      lastUpdated: new Date().toISOString(),
    };

    return c.json({ tracking: trackingData });
  } catch (error) {
    console.log(`Tracking error: ${error}`);
    return c.json({ error: 'Internal server error getting tracking data' }, 500);
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