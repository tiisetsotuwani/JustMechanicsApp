import { Context } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { audit } from "./audit.tsx";

export const paymentRoutes = {
  record: async (c: Context) => {
    const userId = c.get('userId');
    const { bookingId, method, amount } = await c.req.json();
    const booking = await kv.get(bookingId);

    if (!booking) {
      return c.json({ error: 'Booking not found' }, 404);
    }
    if (!method || typeof amount !== 'number') {
      return c.json({ error: 'Missing method or amount' }, 400);
    }

    const payment = {
      id: `payment:${Date.now()}`,
      bookingId,
      customerId: booking.customerId,
      mechanicId: booking.mechanicId,
      amount,
      method,
      status: method === 'cash' ? 'completed' : 'pending',
      platformFee: parseFloat((amount * 0.15).toFixed(2)),
      providerEarning: parseFloat((amount * 0.85).toFixed(2)),
      createdAt: new Date().toISOString(),
      completedAt: method === 'cash' ? new Date().toISOString() : null,
      confirmedAt: null,
    };

    await kv.set(payment.id, payment);
    await kv.set(`payment:booking:${bookingId}`, payment);
    await kv.set(`payment:${bookingId}`, payment);

    const customerPayments = (await kv.get(`payments:${booking.customerId}`)) || [];
    customerPayments.unshift(payment.id);
    await kv.set(`payments:${booking.customerId}`, customerPayments);

    if (booking.mechanicId) {
      const providerPayments = (await kv.get(`payments:${booking.mechanicId}`)) || [];
      providerPayments.unshift(payment.id);
      await kv.set(`payments:${booking.mechanicId}`, providerPayments);
    }

    booking.paymentId = payment.id;
    booking.paymentStatus = payment.status;
    booking.price = amount;
    booking.platformFee = payment.platformFee;
    await kv.set(bookingId, booking);

    await audit.log({
      action: 'payment.recorded',
      userId,
      targetId: bookingId,
      details: { method, amount },
    });
    return c.json({ payment, message: 'Payment recorded' });
  },

  getForBooking: async (c: Context) => {
    const bookingId = c.req.param('bookingId');
    const payment = await kv.get(`payment:booking:${bookingId}`);
    return c.json({ payment });
  },

  getMyPayments: async (c: Context) => {
    const userId = c.get('userId');
    const paymentIds = (await kv.get(`payments:${userId}`)) || [];
    const payments = await kv.mget(paymentIds);
    return c.json({ payments: payments.filter(Boolean) });
  },

  confirm: async (c: Context) => {
    const userId = c.get('userId');
    const { bookingId } = await c.req.json();
    const payment = await kv.get(`payment:booking:${bookingId}`);

    if (!payment) {
      return c.json({ error: 'Payment not found' }, 404);
    }

    payment.status = 'completed';
    payment.confirmedAt = new Date().toISOString();
    payment.completedAt = payment.completedAt || payment.confirmedAt;
    await kv.set(payment.id, payment);
    await kv.set(`payment:booking:${bookingId}`, payment);
    await kv.set(`payment:${bookingId}`, payment);

    const booking = await kv.get(bookingId);
    if (booking) {
      booking.paymentStatus = payment.status;
      await kv.set(bookingId, booking);
    }

    await audit.log({
      action: 'payment.confirmed',
      userId,
      targetId: bookingId,
      details: {},
    });
    return c.json({ payment, message: 'Payment confirmed' });
  },
};
