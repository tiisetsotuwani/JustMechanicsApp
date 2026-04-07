export const supabase = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    exchangeCodeForSession: async () => ({ data: { session: null }, error: null }),
    signInWithOAuth: async () => ({ data: null, error: null }),
  },
};
