import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { env } from '@/lib/env';

// Environment variables are validated in @/lib/env
// If validation fails, env will have fallback values
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Additional runtime check (should not happen if env validation works)
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  const error = new Error(
    'Missing required Supabase environment variables. ' +
    'Please check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are set.'
  );
  console.error(error);
  
  if (import.meta.env.PROD) {
    console.error('Supabase configuration is missing. The application may not work correctly.');
  } else {
    throw error;
  }
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(
  SUPABASE_URL || '',
  SUPABASE_PUBLISHABLE_KEY || '',
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);