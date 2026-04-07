import { Context } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { audit } from "./audit.tsx";

const getBookings = async () => {
  const allBookings = await kv.getByPrefix('booking:');
  return allBookings.filter(Boolean);
};

export const requireAdmin = async (c: Context, next: () => Promise<void>) => {
  const userId = c.get('userId');
  const user = c.get('user');
  const adminList = (await kv.get('config:admins')) || [];

  if (!adminList.includes(userId) && user?.user_metadata?.role !== 'admin') {
    return c.json({ error: 'Admin access required' }, 403);
  }

  await next();
};

export const adminRoutes = {
  overview: async (c: Context) => {
    const allUsers = await kv.getByPrefix('user:');
    const customers = allUsers.filter((user) => user?.userType === 'customer');
    const providers = allUsers.filter((user) => user?.userType === 'provider');
    const bookings = await getBookings();
    const payments = await kv.getByPrefix('payment:');

    const stats = {
      totalCustomers: customers.length,
      totalProviders: providers.length,
      pendingBookings: bookings.filter((booking) => booking?.status === 'pending').length,
      activeBookings: bookings.filter((booking) =>
        ['assigned', 'en_route', 'arrived', 'in_progress'].includes(booking?.status),
      ).length,
      completedBookings: bookings.filter((booking) => booking?.status === 'completed').length,
      onlineProviders: providers.filter((provider) => provider?.isOnline).length,
      totalRevenue: payments.reduce((sum: number, payment) => sum + (payment?.platformFee || 0), 0),
    };

    return c.json({ stats });
  },

  listUsers: async (c: Context) => {
    const userType = c.req.query('type');
    const users = await kv.getByPrefix('user:');
    return c.json({
      users: userType ? users.filter((user) => user?.userType === userType) : users,
    });
  },

  getUser: async (c: Context) => {
    const userId = c.req.param('id');
    const profile = await kv.get(`user:${userId}`);
    if (!profile) {
      return c.json({ error: 'User not found' }, 404);
    }
    return c.json({ profile });
  },

  suspendUser: async (c: Context) => {
    const adminId = c.get('userId');
    const { userId, suspended, reason } = await c.req.json();
    const profile = await kv.get(`user:${userId}`);

    if (!profile) {
      return c.json({ error: 'User not found' }, 404);
    }

    profile.suspended = Boolean(suspended);
    profile.suspendReason = reason || '';
    profile.suspendedAt = suspended ? new Date().toISOString() : null;

    if (profile.userType === 'provider' && suspended) {
      profile.isOnline = false;
      const availability = (await kv.get(`provider:availability:${userId}`)) || {};
      availability.isOnline = false;
      await kv.set(`provider:availability:${userId}`, availability);
    }

    await kv.set(`user:${userId}`, profile);
    await audit.log({
      action: suspended ? 'admin.user_suspended' : 'admin.user_unsuspended',
      userId: adminId,
      targetId: userId,
      details: { reason: reason || '' },
    });

    return c.json({ profile, message: suspended ? 'User suspended' : 'User unsuspended' });
  },

  listBookings: async (c: Context) => {
    const status = c.req.query('status');
    const bookings = await getBookings();
    return c.json({
      bookings: status ? bookings.filter((booking) => booking?.status === status) : bookings,
    });
  },

  seedAdmin: async (c: Context) => {
    const { userId } = await c.req.json();
    const adminList = (await kv.get('config:admins')) || [];
    if (!adminList.includes(userId)) {
      adminList.push(userId);
      await kv.set('config:admins', adminList);
    }
    return c.json({ message: 'Admin added', admins: adminList });
  },

  getAuditForUser: async (c: Context) => {
    const userId = c.req.param('id');
    const entries = await audit.getForUser(userId);
    return c.json({ entries: entries.filter(Boolean) });
  },

  debugLookup: async (c: Context) => {
    const bookingId = c.req.query('bookingId');
    const userId = c.req.query('userId');

    let booking = null;
    let payment = null;
    let invoice = null;
    let disputeEntries: unknown[] = [];
    let chatMessages: unknown[] = [];
    let auditEntries: unknown[] = [];
    let userProfile = null;

    if (bookingId) {
      booking = await kv.get(bookingId);
      payment = (await kv.get(`payment:booking:${bookingId}`)) || (await kv.get(`payment:${bookingId}`));
      invoice = await kv.get(`invoice:booking:${bookingId}`);
      disputeEntries = (await kv.getByPrefix('dispute:')).filter((entry) => entry?.bookingId === bookingId);
      chatMessages = (await kv.get(`chat:${bookingId}`)) || [];
      auditEntries = await audit.getForTarget(bookingId);
    }

    if (userId) {
      userProfile = await kv.get(`user:${userId}`);
      const userAudit = await audit.getForUser(userId);
      auditEntries = [...auditEntries, ...userAudit.filter(Boolean)];
    }

    return c.json({
      booking,
      payment,
      invoice,
      disputes: disputeEntries,
      chatCount: chatMessages.length,
      audits: auditEntries,
      user: userProfile,
    });
  },

  getPlatformConfig: async (c: Context) => {
    const config = (await kv.get('config:platform')) || {
      promoEnabled: false,
      referralEnabled: false,
      priorityMultiplier: 1,
      serviceFeePercent: 15,
    };
    return c.json({ config });
  },

  updatePlatformConfig: async (c: Context) => {
    const adminId = c.get('userId');
    const updates = await c.req.json();
    const current = (await kv.get('config:platform')) || {
      promoEnabled: false,
      referralEnabled: false,
      priorityMultiplier: 1,
      serviceFeePercent: 15,
    };
    const config = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await kv.set('config:platform', config);
    await audit.log({
      action: 'admin.platform_config_updated',
      userId: adminId,
      details: updates,
    });
    return c.json({ config, message: 'Platform configuration updated' });
  },
};
