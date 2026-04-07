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

export const marketingRoutes = {
  getAccounts: async (c: Context) => {
    try {
      const providerCheck = await ensureProvider(c);
      if (!providerCheck.ok) {
        return providerCheck.response;
      }
      const userId = providerCheck.userId;
      const accounts = ((await kv.get(`provider:social_accounts:${userId}`)) || []) as Array<Record<string, unknown>>;
      return c.json({ accounts });
    } catch (error) {
      log('error', 'Marketing get accounts error', { error: String(error) });
      return c.json({ error: 'Internal server error getting social accounts' }, 500);
    }
  },

  connectAccount: async (c: Context) => {
    try {
      const providerCheck = await ensureProvider(c);
      if (!providerCheck.ok) {
        return providerCheck.response;
      }
      const userId = providerCheck.userId;
      const body = (await c.req.json()) as { platform?: string; accountName?: string; externalId?: string };
      if (!body.platform || !body.accountName) {
        return c.json({ error: 'platform and accountName are required' }, 400);
      }

      const accounts = ((await kv.get(`provider:social_accounts:${userId}`)) || []) as Array<Record<string, unknown>>;
      const account = {
        id: `social:${Date.now()}:${userId}`,
        platform: body.platform,
        accountName: body.accountName,
        externalId: body.externalId || '',
        status: 'connected',
        createdAt: new Date().toISOString(),
      };
      accounts.unshift(account);
      await kv.set(`provider:social_accounts:${userId}`, accounts);
      await audit.log({
        action: 'marketing.account_connected',
        userId,
        details: { platform: body.platform },
      });
      return c.json({ account, message: 'Social account connected' });
    } catch (error) {
      log('error', 'Marketing connect account error', { error: String(error) });
      return c.json({ error: 'Internal server error connecting social account' }, 500);
    }
  },

  createPost: async (c: Context) => {
    try {
      const providerCheck = await ensureProvider(c);
      if (!providerCheck.ok) {
        return providerCheck.response;
      }
      const userId = providerCheck.userId;
      const body = (await c.req.json()) as {
        text?: string;
        platforms?: string[];
        scheduledAt?: string | null;
        mediaUrls?: string[];
      };
      if (!body.text || !body.text.trim()) {
        return c.json({ error: 'Post text is required' }, 400);
      }

      const posts = ((await kv.get(`provider:posts:${userId}`)) || []) as Array<Record<string, unknown>>;
      const post = {
        id: `post:${Date.now()}:${userId}`,
        text: body.text.trim(),
        platforms: Array.isArray(body.platforms) ? body.platforms : [],
        mediaUrls: Array.isArray(body.mediaUrls) ? body.mediaUrls : [],
        status: body.scheduledAt ? 'scheduled' : 'draft',
        scheduledAt: body.scheduledAt || null,
        createdAt: new Date().toISOString(),
        publishedAt: null,
      };
      posts.unshift(post);
      await kv.set(`provider:posts:${userId}`, posts);
      await audit.log({
        action: 'marketing.post_created',
        userId,
        details: { postId: post.id, status: post.status },
      });
      return c.json({ post, message: 'Post created' });
    } catch (error) {
      log('error', 'Marketing create post error', { error: String(error) });
      return c.json({ error: 'Internal server error creating post' }, 500);
    }
  },

  getPosts: async (c: Context) => {
    try {
      const providerCheck = await ensureProvider(c);
      if (!providerCheck.ok) {
        return providerCheck.response;
      }
      const userId = providerCheck.userId;
      const posts = ((await kv.get(`provider:posts:${userId}`)) || []) as Array<Record<string, unknown>>;
      return c.json({ posts });
    } catch (error) {
      log('error', 'Marketing get posts error', { error: String(error) });
      return c.json({ error: 'Internal server error getting posts' }, 500);
    }
  },

  publishPost: async (c: Context) => {
    try {
      const providerCheck = await ensureProvider(c);
      if (!providerCheck.ok) {
        return providerCheck.response;
      }
      const userId = providerCheck.userId;
      const body = (await c.req.json()) as { postId?: string };
      if (!body.postId) {
        return c.json({ error: 'postId is required' }, 400);
      }

      const posts = ((await kv.get(`provider:posts:${userId}`)) || []) as Array<Record<string, unknown>>;
      const index = posts.findIndex((post) => post.id === body.postId);
      if (index < 0) {
        return c.json({ error: 'Post not found' }, 404);
      }
      const post = posts[index];
      post.status = 'published';
      post.publishedAt = new Date().toISOString();
      post.scheduledAt = null;
      posts[index] = post;
      await kv.set(`provider:posts:${userId}`, posts);
      await audit.log({
        action: 'marketing.post_published',
        userId,
        details: { postId: body.postId },
      });
      return c.json({ post, message: 'Post published' });
    } catch (error) {
      log('error', 'Marketing publish post error', { error: String(error) });
      return c.json({ error: 'Internal server error publishing post' }, 500);
    }
  },

  analytics: async (c: Context) => {
    try {
      const providerCheck = await ensureProvider(c);
      if (!providerCheck.ok) {
        return providerCheck.response;
      }
      const userId = providerCheck.userId;
      const posts = ((await kv.get(`provider:posts:${userId}`)) || []) as Array<Record<string, unknown>>;
      const analytics = {
        totalPosts: posts.length,
        publishedPosts: posts.filter((post) => post.status === 'published').length,
        scheduledPosts: posts.filter((post) => post.status === 'scheduled').length,
        draftPosts: posts.filter((post) => post.status === 'draft').length,
      };
      return c.json({ analytics });
    } catch (error) {
      log('error', 'Marketing analytics error', { error: String(error) });
      return c.json({ error: 'Internal server error loading marketing analytics' }, 500);
    }
  },
};
