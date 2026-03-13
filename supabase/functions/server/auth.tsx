import { Context } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { supabaseServiceRole, supabaseAnon } from "./supabase-client.tsx";

export const authRoutes = {
  // Sign up new user
  signup: async (c: Context) => {
    try {
      const body = await c.req.json();
      const { email, password, name, userType, phone } = body;

      if (!email || !password || !name || !userType) {
        return c.json({ error: 'Missing required fields: email, password, name, userType' }, 400);
      }

      // Create user with Supabase Auth
      const { data, error } = await supabaseServiceRole.auth.admin.createUser({
        email,
        password,
        user_metadata: { 
          name, 
          userType, // 'customer' or 'provider'
          phone: phone || '',
        },
        // Automatically confirm email since email server hasn't been configured
        email_confirm: true,
      });

      if (error) {
        console.log(`Signup error for ${email}: ${error.message}`);
        return c.json({ error: `Failed to create user: ${error.message}` }, 400);
      }

      // Store user profile in KV store
      const userId = data.user?.id;
      if (userId) {
        await kv.set(`user:${userId}`, {
          id: userId,
          email,
          name,
          userType,
          phone: phone || '',
          createdAt: new Date().toISOString(),
          profileImage: '',
          rating: userType === 'provider' ? 5.0 : null,
          completedJobs: userType === 'provider' ? 0 : null,
          isOnline: userType === 'provider' ? false : null,
        });

        // Initialize user-specific data
        if (userType === 'customer') {
          await kv.set(`addresses:${userId}`, []);
          await kv.set(`vehicles:${userId}`, []);
        } else if (userType === 'provider') {
          await kv.set(`provider:services:${userId}`, []);
          await kv.set(`provider:availability:${userId}`, {
            isOnline: false,
            serviceRadius: 10,
          });
        }
      }

      return c.json({ 
        user: data.user,
        message: 'User created successfully. Please sign in.',
      });
    } catch (error) {
      console.log(`Signup error: ${error}`);
      return c.json({ error: 'Internal server error during signup' }, 500);
    }
  },

  // Sign in user
  signin: async (c: Context) => {
    try {
      const body = await c.req.json();
      const { email, password } = body;

      if (!email || !password) {
        return c.json({ error: 'Missing email or password' }, 400);
      }

      const { data, error } = await supabaseAnon.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.log(`Sign in error for ${email}: ${error.message}`);
        return c.json({ error: `Sign in failed: ${error.message}` }, 401);
      }

      // Get user profile
      const userProfile = await kv.get(`user:${data.user.id}`);

      return c.json({ 
        session: data.session,
        user: data.user,
        profile: userProfile,
      });
    } catch (error) {
      console.log(`Sign in error: ${error}`);
      return c.json({ error: 'Internal server error during sign in' }, 500);
    }
  },

  // Get current session
  getSession: async (c: Context) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      
      if (!accessToken) {
        return c.json({ error: 'No access token provided' }, 401);
      }

      const { data: { user }, error } = await supabaseServiceRole.auth.getUser(accessToken);

      if (error || !user) {
        return c.json({ error: 'Invalid or expired token' }, 401);
      }

      // Get user profile
      const userProfile = await kv.get(`user:${user.id}`);

      return c.json({ 
        user,
        profile: userProfile,
      });
    } catch (error) {
      console.log(`Get session error: ${error}`);
      return c.json({ error: 'Internal server error getting session' }, 500);
    }
  },

  // Sign out
  signout: async (c: Context) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];

      if (!accessToken) {
        return c.json({ error: 'No access token provided' }, 401);
      }

      const { error } = await supabaseAnon.auth.signOut();

      if (error) {
        console.log(`Sign out error: ${error.message}`);
        return c.json({ error: `Sign out failed: ${error.message}` }, 400);
      }

      return c.json({ message: 'Signed out successfully' });
    } catch (error) {
      console.log(`Sign out error: ${error}`);
      return c.json({ error: 'Internal server error during sign out' }, 500);
    }
  },
};

// Middleware to verify authenticated user
export const requireAuth = async (c: Context, next: () => Promise<void>) => {
  const accessToken = c.req.header('Authorization')?.split(' ')[1];
  
  if (!accessToken) {
    return c.json({ error: 'Unauthorized: No access token provided' }, 401);
  }

  const { data: { user }, error } = await supabaseServiceRole.auth.getUser(accessToken);

  if (error || !user) {
    return c.json({ error: 'Unauthorized: Invalid or expired token' }, 401);
  }

  // Store user in context for later use
  c.set('userId', user.id);
  c.set('user', user);
  
  await next();
};