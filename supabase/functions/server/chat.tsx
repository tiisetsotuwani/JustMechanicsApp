import { Context } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { audit } from "./audit.tsx";

const getBooking = async (bookingId: string) => kv.get(bookingId);

export const chatRoutes = {
  send: async (c: Context) => {
    const userId = c.get('userId');
    const { bookingId, message } = await c.req.json();

    if (!bookingId || !message) {
      return c.json({ error: 'Missing bookingId or message' }, 400);
    }

    const booking = await getBooking(bookingId);
    if (!booking) {
      return c.json({ error: 'Booking not found' }, 404);
    }
    if (booking.customerId !== userId && booking.mechanicId !== userId) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const chatKey = `chat:${bookingId}`;
    const messages = (await kv.get(chatKey)) || [];
    const newMessage = {
      id: `msg:${Date.now()}`,
      bookingId,
      senderId: userId,
      text: message,
      createdAt: new Date().toISOString(),
      read: false,
    };
    messages.push(newMessage);
    await kv.set(chatKey, messages);
    await audit.log({
      action: 'chat.message_sent',
      userId,
      targetId: bookingId,
      details: {},
    });
    return c.json({ message: newMessage });
  },

  getMessages: async (c: Context) => {
    const userId = c.get('userId');
    const bookingId = c.req.param('bookingId');
    const booking = await getBooking(bookingId);

    if (!booking) {
      return c.json({ error: 'Booking not found' }, 404);
    }
    if (booking.customerId !== userId && booking.mechanicId !== userId) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const messages = (await kv.get(`chat:${bookingId}`)) || [];
    return c.json({ messages });
  },

  markRead: async (c: Context) => {
    const userId = c.get('userId');
    const { bookingId } = await c.req.json();
    const messages = (await kv.get(`chat:${bookingId}`)) || [];
    const updatedMessages = messages.map((message: Record<string, unknown>) => {
      if (message.senderId !== userId) {
        return { ...message, read: true };
      }
      return message;
    });
    await kv.set(`chat:${bookingId}`, updatedMessages);
    return c.json({ success: true });
  },
};
