import { Context } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { audit } from "./audit.tsx";

export const invoiceRoutes = {
  generate: async (c: Context) => {
    const userId = c.get('userId');
    const { bookingId, lineItems } = await c.req.json();
    const booking = await kv.get(bookingId);

    if (!booking) {
      return c.json({ error: 'Booking not found' }, 404);
    }
    if (!Array.isArray(lineItems) || lineItems.length === 0) {
      return c.json({ error: 'Line items are required' }, 400);
    }

    const subtotal = lineItems.reduce(
      (sum: number, item: { laborCost: number; partsCost: number; quantity: number }) =>
        sum + (item.laborCost + item.partsCost) * item.quantity,
      0,
    );
    const calloutFee = 0;
    const platformFee = subtotal * 0.15;
    const total = subtotal + calloutFee;

    const invoice = {
      id: `invoice:${Date.now()}`,
      bookingId,
      invoiceNumber: `INV-${Date.now()}`,
      customerId: booking.customerId,
      mechanicId: booking.mechanicId,
      lineItems,
      subtotal,
      calloutFee,
      platformFee: parseFloat(platformFee.toFixed(2)),
      providerEarning: parseFloat((subtotal - platformFee).toFixed(2)),
      total,
      status: 'issued',
      createdAt: new Date().toISOString(),
    };

    await kv.set(invoice.id, invoice);
    await kv.set(`invoice:booking:${bookingId}`, invoice);

    const customerInvoices = (await kv.get(`invoices:customer:${booking.customerId}`)) || [];
    customerInvoices.unshift(invoice.id);
    await kv.set(`invoices:customer:${booking.customerId}`, customerInvoices);

    if (booking.mechanicId) {
      const mechanicInvoices = (await kv.get(`invoices:mechanic:${booking.mechanicId}`)) || [];
      mechanicInvoices.unshift(invoice.id);
      await kv.set(`invoices:mechanic:${booking.mechanicId}`, mechanicInvoices);
    }

    booking.invoiceId = invoice.id;
    await kv.set(bookingId, booking);
    await audit.log({
      action: 'invoice.generated',
      userId,
      targetId: bookingId,
      details: { invoiceId: invoice.id },
    });
    return c.json({ invoice, message: 'Invoice generated' });
  },

  getForBooking: async (c: Context) => {
    const bookingId = c.req.param('bookingId');
    const invoice = await kv.get(`invoice:booking:${bookingId}`);
    return c.json({ invoice });
  },

  getMyInvoices: async (c: Context) => {
    const userId = c.get('userId');
    const user = c.get('user');
    const key =
      user.user_metadata?.userType === 'customer'
        ? `invoices:customer:${userId}`
        : `invoices:mechanic:${userId}`;
    const invoiceIds = (await kv.get(key)) || [];
    const invoices = await kv.mget(invoiceIds);
    return c.json({ invoices: invoices.filter(Boolean) });
  },
};
