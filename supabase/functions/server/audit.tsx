import * as kv from "./kv_store.tsx";

interface AuditEvent {
  action: string;
  userId: string;
  targetId?: string;
  details?: Record<string, unknown>;
  ip?: string;
}

export const audit = {
  log: async (event: AuditEvent) => {
    const auditId = `audit:${Date.now()}:${event.userId}`;
    const entry = {
      id: auditId,
      ...event,
      details: event.details ?? {},
      timestamp: new Date().toISOString(),
    };
    await kv.set(auditId, entry);

    const userAuditKey = `audit:user:${event.userId}`;
    const userAudit = (await kv.get(userAuditKey)) || [];
    userAudit.unshift(auditId);
    if (userAudit.length > 500) {
      userAudit.length = 500;
    }
    await kv.set(userAuditKey, userAudit);
    return entry;
  },

  getForUser: async (userId: string) => {
    const auditIds = (await kv.get(`audit:user:${userId}`)) || [];
    return kv.mget(auditIds);
  },

  getForTarget: async (targetId: string) => {
    const entries = await kv.getByPrefix('audit:');
    return entries.filter((entry) => entry?.targetId === targetId);
  },
};
