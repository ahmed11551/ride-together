import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Validate environment variables
if (!SUPABASE_URL) {
  const error = new Error(
    'Missing VITE_SUPABASE_URL environment variable. ' +
    'Please check your .env file and ensure VITE_SUPABASE_URL is set.'
  );
  console.error(error);
  // In production, we should still try to continue, but log the error
  if (import.meta.env.PROD) {
    console.error('Supabase URL is missing. The application may not work correctly.');
  } else {
    throw error;
  }
}

if (!SUPABASE_PUBLISHABLE_KEY) {
  const error = new Error(
    'Missing VITE_SUPABASE_PUBLISHABLE_KEY environment variable. ' +
    'Please check your .env file and ensure VITE_SUPABASE_PUBLISHABLE_KEY is set.'
  );
  console.error(error);
  // In production, we should still try to continue, but log the error
  if (import.meta.env.PROD) {
    console.error('Supabase Publishable Key is missing. The application may not work correctly.');
  } else {
    throw error;
  }
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});