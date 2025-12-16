import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { env } from '@/lib/env';

// Environment variables are validated in @/lib/env
// Supabase is OPTIONAL - only initialize if variables are provided
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Check if Supabase is configured
const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";
// Check if configured: import { isSupabaseConfigured } from "@/integrations/supabase/client";

// Create Supabase client only if configured
// Otherwise, create a dummy client that won't crash the app
export const supabase = isSupabaseConfigured
  ? createClient<Database>(
      SUPABASE_URL!,
      SUPABASE_PUBLISHABLE_KEY!,
      {
        auth: {
          storage: localStorage,
          persistSession: true,
          autoRefreshToken: true,
        },
      }
    )
  : // Dummy client that won't crash but will log warnings
    ({
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        signOut: async () => ({ error: null }),
        onAuthStateChange: () => ({ data: { subscription: null }, error: null }),
      },
      from: () => ({
        select: () => ({ data: null, error: { message: 'Supabase is not configured' } }),
        insert: () => ({ data: null, error: { message: 'Supabase is not configured' } }),
        update: () => ({ data: null, error: { message: 'Supabase is not configured' } }),
        delete: () => ({ data: null, error: { message: 'Supabase is not configured' } }),
      }),
    } as any);

// Export flag to check if Supabase is configured
export { isSupabaseConfigured };