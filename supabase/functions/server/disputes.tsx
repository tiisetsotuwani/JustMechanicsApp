import { Context } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { audit } from "./audit.tsx";

export const disputeRoutes = {
  create: async (c: Context) => {
    const userId = c.get('userId');
    const { bookingId, type, description, photos } = await c.req.json();
    const disputeId = `dispute:${Date.now()}:${bookingId}`;
    const dispute = {
      id: disputeId,
      bookingId,
      reportedBy: userId,
      type,
      description,
      photos: photos || [],
      status: 'open',
      resolution: null,
      messages: [{ from: userId, text: description, date: new Date().toISOString() }],
      createdAt: new Date().toISOString(),
    };
    await kv.set(disputeId, dispute);

    const payment = await kv.get(`payment:${bookingId}`);
    if (payment && payment.status === 'held') {
      payment.status = 'disputed';
      await kv.set(`payment:${bookingId}`, payment);
    }

    const queue = (await kv.get('admin:disputes')) || [];
    queue.unshift(disputeId);
    await kv.set('admin:disputes', queue);

    const userDisputes = (await kv.get(`disputes:${userId}`)) || [];
    userDisputes.unshift(disputeId);
    await kv.set(`disputes:${userId}`, userDisputes);

    await audit.log({
      action: 'dispute.created',
      userId,
      targetId: bookingId,
      details: { type },
    });
    return c.json({ dispute, message: 'Dispute created' });
  },

  getMyDisputes: async (c: Context) => {
    const userId = c.get('userId');
    const disputeIds = (await kv.get(`disputes:${userId}`)) || [];
    const disputes = await kv.mget(disputeIds);
    return c.json({ disputes: disputes.filter(Boolean) });
  },

  getById: async (c: Context) => {
    const disputeId = c.req.param('id');
    const dispute = (await kv.get(`dispute:${disputeId}`)) || (await kv.get(disputeId));
    if (!dispute) {
      return c.json({ error: 'Dispute not found' }, 404);
    }
    return c.json({ dispute });
  },

  respond: async (c: Context) => {
    const userId = c.get('userId');
    const disputeId = c.req.param('id');
    const { response } = await c.req.json();
    const dispute = await kv.get(disputeId);

    if (!dispute) {
      return c.json({ error: 'Not found' }, 404);
    }

    dispute.messages.push({ from: userId, text: response, date: new Date().toISOString() });
    dispute.updatedAt = new Date().toISOString();
    await kv.set(disputeId, dispute);
    return c.json({ dispute });
  },

  resolve: async (c: Context) => {
    const adminId = c.get('userId');
    const { disputeId, resolution, action } = await c.req.json();
    const dispute = await kv.get(disputeId);

    if (!dispute) {
      return c.json({ error: 'Not found' }, 404);
    }

    dispute.status = 'resolved';
    dispute.resolution = resolution;
    dispute.resolvedAction = action;
    dispute.resolvedAt = new Date().toISOString();
    await kv.set(disputeId, dispute);

    const payment = await kv.get(`payment:${dispute.bookingId}`);
    if (payment) {
      if (action === 'refund_full') {
        payment.status = 'refunded';
      } else if (action === 'refund_partial') {
        payment.status = 'partially_refunded';
      } else if (action === 'no_refund') {
        payment.status = 'released';
      }
      await kv.set(`payment:${dispute.bookingId}`, payment);
    }

    await audit.log({
      action: 'dispute.resolved',
      userId: adminId,
      targetId: dispute.bookingId,
      details: { action },
    });
    return c.json({ dispute });
  },
};
