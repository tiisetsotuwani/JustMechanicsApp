import { Context } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { audit } from "./audit.tsx";
import { log } from "./logger.tsx";

const ensureProvider = async (c: Context) => {
  const userId = c.get('userId');
  const user = c.get('user');
  const metadata = (user?.user_metadata || {}) as Record<string, unknown>;
  const profile = await kv.get(`user:${userId}`);
  const userType = profile?.userType || metadata.userType;
  if (userType !== 'provider') {
    return { ok: false as const, response: c.json({ error: 'Provider access required' }, 403) };
  }
  return { ok: true as const, userId };
};

export const crmRoutes = {
  getCustomers: async (c: Context) => {
    try {
      const providerCheck = await ensureProvider(c);
      if (!providerCheck.ok) {
        return providerCheck.response;
      }
      const providerId = providerCheck.userId;

      const bookingIds = ((await kv.get(`provider:bookings:${providerId}`)) || []) as string[];
      const bookings = await kv.mget(bookingIds);
      const byCustomer = new Map<string, { totalJobs: number; totalSpent: number; lastServiceAt: string | null }>();

      for (const booking of bookings) {
        if (!booking?.customerId) {
          continue;
        }
        const existing =
          byCustomer.get(booking.customerId as string) || {
            totalJobs: 0,
            totalSpent: 0,
            lastServiceAt: null,
          };
        existing.totalJobs += 1;
        existing.totalSpent += typeof booking.price === 'number' ? booking.price : 0;
        const completedAt =
          typeof booking.completedAt === 'string'
            ? booking.completedAt
            : typeof booking.updatedAt === 'string'
              ? booking.updatedAt
              : null;
        if (completedAt && (!existing.lastServiceAt || completedAt > existing.lastServiceAt)) {
          existing.lastServiceAt = completedAt;
        }
        byCustomer.set(booking.customerId as string, existing);
      }

      const customers = [];
      for (const [customerId, summary] of byCustomer.entries()) {
        const profile = await kv.get(`user:${customerId}`);
        customers.push({
          customerId,
          name: profile?.name || 'Customer',
          email: profile?.email || '',
          phone: profile?.phone || '',
          totalJobs: summary.totalJobs,
          totalSpent: parseFloat(summary.totalSpent.toFixed(2)),
          lastServiceAt: summary.lastServiceAt,
        });
      }

      customers.sort((a, b) => (b.lastServiceAt || '').localeCompare(a.lastServiceAt || ''));
      return c.json({ customers });
    } catch (error) {
      log('error', 'CRM get customers error', { error: String(error) });
      return c.json({ error: 'Internal server error getting CRM customers' }, 500);
    }
  },

  getCustomerNotes: async (c: Context) => {
    try {
      const providerCheck = await ensureProvider(c);
      if (!providerCheck.ok) {
        return providerCheck.response;
      }
      const providerId = providerCheck.userId;
      const customerId = c.req.param('customerId');
      const notes = ((await kv.get(`crm:notes:${providerId}:${customerId}`)) || []) as Array<Record<string, unknown>>;
      return c.json({ notes });
    } catch (error) {
      log('error', 'CRM get notes error', { error: String(error) });
      return c.json({ error: 'Internal server error getting notes' }, 500);
    }
  },

  addCustomerNote: async (c: Context) => {
    try {
      const providerCheck = await ensureProvider(c);
      if (!providerCheck.ok) {
        return providerCheck.response;
      }
      const providerId = providerCheck.userId;
      const customerId = c.req.param('customerId');
      const body = (await c.req.json()) as { text?: string; tag?: string };
      if (!body.text || !body.text.trim()) {
        return c.json({ error: 'Note text is required' }, 400);
      }

      const notes = ((await kv.get(`crm:notes:${providerId}:${customerId}`)) || []) as Array<Record<string, unknown>>;
      const note = {
        id: `crm-note:${Date.now()}:${providerId}`,
        providerId,
        customerId,
        text: body.text.trim(),
        tag: body.tag || '',
        createdAt: new Date().toISOString(),
      };
      notes.unshift(note);
      await kv.set(`crm:notes:${providerId}:${customerId}`, notes);

      await audit.log({
        action: 'crm.note_added',
        userId: providerId,
        targetId: customerId,
        details: { noteId: note.id, tag: body.tag || '' },
      });

      return c.json({ note, message: 'CRM note added' });
    } catch (error) {
      log('error', 'CRM add note error', { error: String(error) });
      return c.json({ error: 'Internal server error adding note' }, 500);
    }
  },

  getReminders: async (c: Context) => {
    try {
      const providerCheck = await ensureProvider(c);
      if (!providerCheck.ok) {
        return providerCheck.response;
      }
      const providerId = providerCheck.userId;
      const reminders = ((await kv.get(`crm:reminders:${providerId}`)) || []) as Array<Record<string, unknown>>;
      return c.json({ reminders });
    } catch (error) {
      log('error', 'CRM get reminders error', { error: String(error) });
      return c.json({ error: 'Internal server error getting reminders' }, 500);
    }
  },

  createReminder: async (c: Context) => {
    try {
      const providerCheck = await ensureProvider(c);
      if (!providerCheck.ok) {
        return providerCheck.response;
      }
      const providerId = providerCheck.userId;
      const body = (await c.req.json()) as {
        customerId?: string;
        title?: string;
        dueAt?: string;
        channel?: string;
      };

      if (!body.customerId || !body.title || !body.dueAt) {
        return c.json({ error: 'customerId, title, and dueAt are required' }, 400);
      }

      const reminders = ((await kv.get(`crm:reminders:${providerId}`)) || []) as Array<Record<string, unknown>>;
      const reminder = {
        id: `crm-reminder:${Date.now()}:${providerId}`,
        providerId,
        customerId: body.customerId,
        title: body.title,
        dueAt: body.dueAt,
        channel: body.channel || 'in_app',
        status: 'scheduled',
        createdAt: new Date().toISOString(),
      };
      reminders.unshift(reminder);
      await kv.set(`crm:reminders:${providerId}`, reminders);

      await audit.log({
        action: 'crm.reminder_created',
        userId: providerId,
        targetId: body.customerId,
        details: { reminderId: reminder.id, channel: reminder.channel },
      });

      return c.json({ reminder, message: 'Reminder created' });
    } catch (error) {
      log('error', 'CRM create reminder error', { error: String(error) });
      return c.json({ error: 'Internal server error creating reminder' }, 500);
    }
  },
};
