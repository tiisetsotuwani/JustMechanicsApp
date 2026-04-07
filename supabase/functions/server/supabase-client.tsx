import { createClient } from "npm:@supabase/supabase-js@2";

// Singleton instances for Supabase clients
let serviceRoleClient: ReturnType<typeof createClient> | null = null;
let anonClient: ReturnType<typeof createClient> | null = null;

// Service role client for admin operations
export function getServiceRoleClient() {
  if (!serviceRoleClient) {
    serviceRoleClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );
  }
  return serviceRoleClient;
}

// Anon client for user-level operations
export function getAnonClient() {
  if (!anonClient) {
    anonClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );
  }
  return anonClient;
}

// Export singleton instances
export const supabaseServiceRole = getServiceRoleClient();
export const supabaseAnon = getAnonClient();
