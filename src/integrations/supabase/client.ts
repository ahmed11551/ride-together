// DEPRECATED: Supabase integration is no longer used
// This file is kept for backward compatibility only
// The application now uses custom backend API (see @/lib/api-client)

import type { Database } from './types';

// Supabase is NOT used - application uses custom backend
// This is a dummy client that always returns empty/null data
export const supabase = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: null }, error: null }),
    signInWithPassword: async () => ({ data: { session: null, user: null }, error: { message: 'Supabase is not used. Use custom auth API instead.' } }),
    signUp: async () => ({ data: { session: null, user: null }, error: { message: 'Supabase is not used. Use custom auth API instead.' } }),
  },
  from: () => ({
    select: () => ({ data: null, error: { message: 'Supabase is not used. Use custom backend API instead.' } }),
    insert: () => ({ data: null, error: { message: 'Supabase is not used. Use custom backend API instead.' } }),
    update: () => ({ data: null, error: { message: 'Supabase is not used. Use custom backend API instead.' } }),
    delete: () => ({ data: null, error: { message: 'Supabase is not used. Use custom backend API instead.' } }),
  }),
} as any;

// Supabase is never configured - we use custom backend
export const isSupabaseConfigured = false;