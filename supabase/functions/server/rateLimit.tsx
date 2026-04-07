import { Context } from "npm:hono";
import * as kv from "./kv_store.tsx";

export const rateLimit = (maxRequests: number, windowMs: number) => {
  return async (c: Context, next: () => Promise<void>) => {
    const ip = c.req.header('x-forwarded-for') || 'unknown';
    const key = `ratelimit:${ip}:${Math.floor(Date.now() / windowMs)}`;
    const current = (await kv.get(key)) || 0;

    if (current >= maxRequests) {
      return c.json({ error: 'Too many requests' }, 429);
    }

    await kv.set(key, current + 1);
    await next();
  };
};
