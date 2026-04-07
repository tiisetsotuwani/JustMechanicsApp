import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import * as kv from "./kv_store.tsx";
import { authRoutes, requireAuth } from "./auth.tsx";
import { bookingRoutes } from "./bookings.tsx";
import { profileRoutes } from "./profile.tsx";
import { storageRoutes, initStorage } from "./storage.tsx";
import { providerRoutes } from "./provider.tsx";
import { adminRoutes, requireAdmin } from "./admin.tsx";
import { chatRoutes } from "./chat.tsx";
import { paymentRoutes } from "./payments.tsx";
import { onboardingRoutes } from "./onboarding.tsx";
import { invoiceRoutes } from "./invoices.tsx";
import { disputeRoutes } from "./disputes.tsx";
import { trackingRoutes } from "./tracking.tsx";
import { dispatchRoutes } from "./dispatch.tsx";
import { crmRoutes } from "./crm.tsx";
import { marketingRoutes } from "./marketing.tsx";
import { notificationRoutes } from "./notifications.tsx";
import { mapRoutes } from "./maps.tsx";
import { rateLimit } from "./rateLimit.tsx";
import { log } from "./logger.tsx";

const app = new Hono();
const ALLOWED_ORIGINS = Deno.env.get('ALLOWED_ORIGINS')?.split(',') || ['*'];

app.use('*', async (c, next) => {
  const startedAt = Date.now();
  await next();
  log('info', 'request', {
    route: c.req.path,
    method: c.req.method,
    status: c.res.status,
    durationMs: Date.now() - startedAt,
    userId: c.get('userId') || null,
  });
});

app.use(
  "/*",
  cors({
    origin: (origin) => {
      if (ALLOWED_ORIGINS.includes('*')) {
        return origin || '*';
      }
      return origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
    },
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

initStorage();

app.get("/make-server-dd7ceef7/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.post("/make-server-dd7ceef7/auth/signup", rateLimit(5, 15 * 60 * 1000), authRoutes.signup);
app.post("/make-server-dd7ceef7/auth/signin", rateLimit(10, 15 * 60 * 1000), authRoutes.signin);
app.get("/make-server-dd7ceef7/auth/session", authRoutes.getSession);
app.post("/make-server-dd7ceef7/auth/signout", authRoutes.signout);
app.post("/make-server-dd7ceef7/auth/ensure-profile", requireAuth, authRoutes.ensureProfile);

app.get("/make-server-dd7ceef7/profile", requireAuth, profileRoutes.get);
app.put("/make-server-dd7ceef7/profile", requireAuth, profileRoutes.update);
app.get("/make-server-dd7ceef7/profile/addresses", requireAuth, profileRoutes.getAddresses);
app.post("/make-server-dd7ceef7/profile/addresses", requireAuth, profileRoutes.addAddress);
app.put("/make-server-dd7ceef7/profile/addresses", requireAuth, profileRoutes.updateAddress);
app.delete("/make-server-dd7ceef7/profile/addresses", requireAuth, profileRoutes.deleteAddress);
app.get("/make-server-dd7ceef7/profile/vehicles", requireAuth, profileRoutes.getVehicles);
app.post("/make-server-dd7ceef7/profile/vehicles", requireAuth, profileRoutes.addVehicle);
app.put("/make-server-dd7ceef7/profile/vehicles", requireAuth, profileRoutes.updateVehicle);
app.delete("/make-server-dd7ceef7/profile/vehicles", requireAuth, profileRoutes.deleteVehicle);

// Booking routes: Order from most specific to least specific
app.post("/make-server-dd7ceef7/bookings", requireAuth, bookingRoutes.create);
app.get("/make-server-dd7ceef7/bookings", requireAuth, bookingRoutes.getMyBookings);

// Specific booking actions (must come before :id wildcard)
app.post("/make-server-dd7ceef7/bookings/accept", requireAuth, bookingRoutes.accept);
app.post("/make-server-dd7ceef7/bookings/decline", requireAuth, bookingRoutes.decline);
app.put("/make-server-dd7ceef7/bookings/status", requireAuth, bookingRoutes.updateStatus);
app.post("/make-server-dd7ceef7/bookings/cancel", requireAuth, bookingRoutes.cancel);
app.post("/make-server-dd7ceef7/bookings/rate", requireAuth, bookingRoutes.rate);

// Specific booking paths (must come before :id wildcard)
app.get("/make-server-dd7ceef7/bookings/pending", requireAuth, bookingRoutes.getPending);
app.get("/make-server-dd7ceef7/bookings/offers", requireAuth, dispatchRoutes.getMyOffers);
app.post("/make-server-dd7ceef7/bookings/offers/respond", requireAuth, dispatchRoutes.respond);

// Booking sub-resources (must come before :id wildcard)
app.post("/make-server-dd7ceef7/bookings/:id/photos", requireAuth, bookingRoutes.addJobPhoto);
app.get("/make-server-dd7ceef7/bookings/:id/photos", requireAuth, bookingRoutes.getJobPhotos);

// Catch-all booking by ID (least specific)
app.get("/make-server-dd7ceef7/bookings/:id", requireAuth, bookingRoutes.getById);

app.put("/make-server-dd7ceef7/provider/availability", requireAuth, providerRoutes.updateAvailability);
app.get("/make-server-dd7ceef7/provider/stats", requireAuth, providerRoutes.getStats);
app.get("/make-server-dd7ceef7/provider/earnings", requireAuth, providerRoutes.getEarnings);
app.put("/make-server-dd7ceef7/provider/services", requireAuth, providerRoutes.updateServices);
app.get("/make-server-dd7ceef7/providers/online", requireAuth, providerRoutes.getOnlineProviders);

// Admin routes: Order from most specific to least specific
app.get("/make-server-dd7ceef7/admin/overview", requireAuth, requireAdmin, adminRoutes.overview);
app.get("/make-server-dd7ceef7/admin/users", requireAuth, requireAdmin, adminRoutes.listUsers);

// Specific admin user actions (must come before :id wildcard)
app.post("/make-server-dd7ceef7/admin/users/suspend", requireAuth, requireAdmin, adminRoutes.suspendUser);

// Admin user sub-resources (must come before :id wildcard)
app.get("/make-server-dd7ceef7/admin/users/:id/audit", requireAuth, requireAdmin, adminRoutes.getAuditForUser);

// Catch-all admin user by ID (least specific)
app.get("/make-server-dd7ceef7/admin/users/:id", requireAuth, requireAdmin, adminRoutes.getUser);

// Specific admin resources
app.get("/make-server-dd7ceef7/admin/bookings", requireAuth, requireAdmin, adminRoutes.listBookings);
app.get("/make-server-dd7ceef7/admin/debug", requireAuth, requireAdmin, adminRoutes.debugLookup);
app.get("/make-server-dd7ceef7/admin/config/platform", requireAuth, requireAdmin, adminRoutes.getPlatformConfig);
app.put("/make-server-dd7ceef7/admin/config/platform", requireAuth, requireAdmin, adminRoutes.updatePlatformConfig);
app.post("/make-server-dd7ceef7/admin/seed", requireAuth, adminRoutes.seedAdmin);
app.post("/make-server-dd7ceef7/admin/onboarding/review", requireAuth, requireAdmin, onboardingRoutes.adminReview);

// Dispute actions
app.post("/make-server-dd7ceef7/disputes/:id/resolve", requireAuth, requireAdmin, disputeRoutes.resolve);

app.get("/make-server-dd7ceef7/onboarding/status", requireAuth, onboardingRoutes.getStatus);
app.post("/make-server-dd7ceef7/onboarding/step", requireAuth, onboardingRoutes.saveStep);
app.post("/make-server-dd7ceef7/onboarding/submit", requireAuth, onboardingRoutes.submit);
app.get("/make-server-dd7ceef7/onboarding/queue", requireAuth, requireAdmin, onboardingRoutes.getQueue);

app.post("/make-server-dd7ceef7/chat/send", requireAuth, chatRoutes.send);
app.post("/make-server-dd7ceef7/chat/read", requireAuth, chatRoutes.markRead);
app.get("/make-server-dd7ceef7/chat/:bookingId", requireAuth, chatRoutes.getMessages);

// Payment routes: specific actions before generic collections
app.post("/make-server-dd7ceef7/payments/confirm", requireAuth, paymentRoutes.confirm);
app.get("/make-server-dd7ceef7/payments/booking/:bookingId", requireAuth, paymentRoutes.getForBooking);
app.post("/make-server-dd7ceef7/payments", requireAuth, paymentRoutes.record);
app.get("/make-server-dd7ceef7/payments", requireAuth, paymentRoutes.getMyPayments);

// Invoice routes: specific paths before generic collection
app.post("/make-server-dd7ceef7/invoices/generate", requireAuth, invoiceRoutes.generate);
app.get("/make-server-dd7ceef7/invoices/booking/:bookingId", requireAuth, invoiceRoutes.getForBooking);
app.get("/make-server-dd7ceef7/invoices", requireAuth, invoiceRoutes.getMyInvoices);

// Dispute routes: Order from most specific to least specific
app.post("/make-server-dd7ceef7/disputes", requireAuth, disputeRoutes.create);
app.get("/make-server-dd7ceef7/disputes", requireAuth, disputeRoutes.getMyDisputes);

// Specific dispute actions (must come before :id wildcard)
app.post("/make-server-dd7ceef7/disputes/:id/respond", requireAuth, disputeRoutes.respond);

// Catch-all dispute by ID (least specific)
app.get("/make-server-dd7ceef7/disputes/:id", requireAuth, disputeRoutes.getById);

app.post("/make-server-dd7ceef7/storage/upload", requireAuth, storageRoutes.upload);
app.post("/make-server-dd7ceef7/storage/url", requireAuth, storageRoutes.getSignedUrl);
app.delete("/make-server-dd7ceef7/storage/delete", requireAuth, storageRoutes.delete);
app.get("/make-server-dd7ceef7/storage/list", requireAuth, storageRoutes.list);

app.get("/make-server-dd7ceef7/tracking/:bookingId", requireAuth, trackingRoutes.get);
app.post("/make-server-dd7ceef7/tracking/update", requireAuth, trackingRoutes.update);
app.post("/make-server-dd7ceef7/dispatch/tick", requireAuth, dispatchRoutes.tick);
app.get("/make-server-dd7ceef7/dispatch/status/:bookingId", requireAuth, dispatchRoutes.getStatus);

app.get("/make-server-dd7ceef7/crm/customers", requireAuth, crmRoutes.getCustomers);
app.get("/make-server-dd7ceef7/crm/customers/:customerId/notes", requireAuth, crmRoutes.getCustomerNotes);
app.post("/make-server-dd7ceef7/crm/customers/:customerId/notes", requireAuth, crmRoutes.addCustomerNote);
app.get("/make-server-dd7ceef7/crm/reminders", requireAuth, crmRoutes.getReminders);
app.post("/make-server-dd7ceef7/crm/reminders", requireAuth, crmRoutes.createReminder);

app.get("/make-server-dd7ceef7/marketing/accounts", requireAuth, marketingRoutes.getAccounts);
app.post("/make-server-dd7ceef7/marketing/accounts/connect", requireAuth, marketingRoutes.connectAccount);
app.get("/make-server-dd7ceef7/marketing/posts", requireAuth, marketingRoutes.getPosts);
app.post("/make-server-dd7ceef7/marketing/posts", requireAuth, marketingRoutes.createPost);
app.post("/make-server-dd7ceef7/marketing/posts/publish", requireAuth, marketingRoutes.publishPost);
app.get("/make-server-dd7ceef7/marketing/analytics", requireAuth, marketingRoutes.analytics);

app.get("/make-server-dd7ceef7/analytics/overview", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const user = c.get('user');
    const bookingIds =
      user.user_metadata?.userType === 'customer'
        ? (await kv.get(`customer:bookings:${userId}`)) || []
        : (await kv.get(`provider:bookings:${userId}`)) || [];
    const bookings = await kv.mget(bookingIds);

    return c.json({
      analytics: {
        totalBookings: bookings.length,
        completed: bookings.filter((booking) => booking?.status === 'completed').length,
        pending: bookings.filter((booking) => booking?.status === 'pending').length,
        cancelled: bookings.filter((booking) => booking?.status === 'cancelled').length,
        inProgress: bookings.filter((booking) => booking?.status === 'in_progress').length,
      },
    });
  } catch (error) {
    log('error', 'Analytics error', { error: String(error) });
    return c.json({ error: 'Internal server error getting analytics' }, 500);
  }
});

app.post("/make-server-dd7ceef7/notifications/subscribe", requireAuth, notificationRoutes.subscribe);
app.post("/make-server-dd7ceef7/notifications/unsubscribe", requireAuth, notificationRoutes.unsubscribe);
app.get("/make-server-dd7ceef7/notifications/preferences", requireAuth, notificationRoutes.getPreferences);
app.put("/make-server-dd7ceef7/notifications/preferences", requireAuth, notificationRoutes.updatePreferences);
app.get("/make-server-dd7ceef7/maps/geocode", requireAuth, mapRoutes.geocode);
app.get("/make-server-dd7ceef7/maps/reverse", requireAuth, mapRoutes.reverse);
app.post("/make-server-dd7ceef7/maps/eta", requireAuth, mapRoutes.eta);

Deno.serve(app.fetch);
