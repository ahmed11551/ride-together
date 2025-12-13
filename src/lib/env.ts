/**
 * Environment variables validation using Zod
 * Ensures all required environment variables are present and valid
 */

import { z } from 'zod';

/**
 * Schema for environment variables
 */
const envSchema = z.object({
  // Supabase (required)
  VITE_SUPABASE_URL: z.string().url('VITE_SUPABASE_URL must be a valid URL'),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().min(1, 'VITE_SUPABASE_PUBLISHABLE_KEY is required'),

  // Optional API keys
  VITE_YANDEX_MAPS_API_KEY: z.string().optional(),
  VITE_MAPBOX_TOKEN: z.string().optional(),
  VITE_GEOAPIFY_API_KEY: z.string().optional(),
  VITE_TELEGRAM_BOT_TOKEN: z.string().optional(),
  VITE_VAPID_PUBLIC_KEY: z.string().optional(),

  // Monitoring and Analytics (optional)
  VITE_SENTRY_DSN: z.string().url().optional().or(z.literal('')),
  VITE_GA_MEASUREMENT_ID: z.string().optional(),
  VITE_APP_VERSION: z.string().optional(),

  // Environment mode
  MODE: z.enum(['development', 'production', 'test']).default('development'),
  DEV: z.boolean().default(true),
  PROD: z.boolean().default(false),
});

/**
 * Validated environment variables
 */
type Env = z.infer<typeof envSchema>;

/**
 * Cached validated environment variables
 */
let cachedEnv: Env | null = null;

/**
 * Validates and returns environment variables
 * Throws error if required variables are missing
 * Uses lazy evaluation to avoid issues during build
 */
function validateEnv(): Env {
  // Return cached value if already validated
  if (cachedEnv !== null) {
    return cachedEnv;
  }

  const rawEnv = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    VITE_YANDEX_MAPS_API_KEY: import.meta.env.VITE_YANDEX_MAPS_API_KEY,
    VITE_MAPBOX_TOKEN: import.meta.env.VITE_MAPBOX_TOKEN,
    VITE_GEOAPIFY_API_KEY: import.meta.env.VITE_GEOAPIFY_API_KEY,
    VITE_TELEGRAM_BOT_TOKEN: import.meta.env.VITE_TELEGRAM_BOT_TOKEN,
    VITE_VAPID_PUBLIC_KEY: import.meta.env.VITE_VAPID_PUBLIC_KEY,
    MODE: import.meta.env.MODE,
    DEV: import.meta.env.DEV,
    PROD: import.meta.env.PROD,
  };

  try {
    cachedEnv = envSchema.parse(rawEnv);
    return cachedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .filter((e) => e.code === 'invalid_type' && e.received === 'undefined')
        .map((e) => e.path.join('.'));

      if (missingVars.length > 0) {
        const errorMessage = `Missing required environment variables:\n${missingVars.map((v) => `  - ${v}`).join('\n')}\n\nPlease check your .env file.`;
        console.error(errorMessage);
        
        if (import.meta.env.PROD) {
          // In production, log but don't throw to prevent app crash
          console.error('Application may not work correctly without these variables.');
          // Return partial env as fallback
          cachedEnv = rawEnv as Env;
          return cachedEnv;
        } else {
          // In development, throw to catch issues early
          throw new Error(errorMessage);
        }
      } else {
        const errorMessage = `Invalid environment variables:\n${error.errors.map((e) => `  - ${e.path.join('.')}: ${e.message}`).join('\n')}`;
        console.error(errorMessage);
        
        if (import.meta.env.PROD) {
          console.error('Application may not work correctly with invalid variables.');
          // Return partial env as fallback
          cachedEnv = rawEnv as Env;
          return cachedEnv;
        } else {
          throw new Error(errorMessage);
        }
      }
    }
    
    // Return partial env if validation fails in production
    cachedEnv = rawEnv as Env;
    return cachedEnv;
  }
}

/**
 * Validated environment variables
 * Use this instead of import.meta.env directly
 * Lazy evaluation - validates only when first accessed
 */
let envInstance: Env | null = null;

export const env = {
  get VITE_SUPABASE_URL() {
    return validateEnv().VITE_SUPABASE_URL;
  },
  get VITE_SUPABASE_PUBLISHABLE_KEY() {
    return validateEnv().VITE_SUPABASE_PUBLISHABLE_KEY;
  },
  get VITE_YANDEX_MAPS_API_KEY() {
    return validateEnv().VITE_YANDEX_MAPS_API_KEY;
  },
  get VITE_MAPBOX_TOKEN() {
    return validateEnv().VITE_MAPBOX_TOKEN;
  },
  get VITE_GEOAPIFY_API_KEY() {
    return validateEnv().VITE_GEOAPIFY_API_KEY;
  },
  get VITE_TELEGRAM_BOT_TOKEN() {
    return validateEnv().VITE_TELEGRAM_BOT_TOKEN;
  },
  get VITE_VAPID_PUBLIC_KEY() {
    return validateEnv().VITE_VAPID_PUBLIC_KEY;
  },
  get MODE() {
    return validateEnv().MODE;
  },
  get DEV() {
    return validateEnv().DEV;
  },
  get PROD() {
    return validateEnv().PROD;
  },
} as Env;

/**
 * Type-safe access to environment variables
 */
export const getEnv = (): Env => {
  return validateEnv();
};

/**
 * Check if all required environment variables are set
 */
export function validateRequiredEnv(): boolean {
  try {
    validateEnv();
    return true;
  } catch {
    return false;
  }
}

