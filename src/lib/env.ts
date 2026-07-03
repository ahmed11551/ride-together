/**
 * Environment variables validation using Zod
 */

import { z } from 'zod';

const envSchema = z.object({
  VITE_API_URL: z.string().url('VITE_API_URL must be a valid URL').optional(),
  VITE_WS_URL: z.string().url().optional(),
  VITE_YANDEX_MAPS_API_KEY: z.string().optional(),
  VITE_MAPBOX_TOKEN: z.string().optional(),
  VITE_GEOAPIFY_API_KEY: z.string().optional(),
  VITE_TELEGRAM_BOT_USERNAME: z.string().optional(),
  VITE_VAPID_PUBLIC_KEY: z.string().optional(),
  VITE_SENTRY_DSN: z.string().url().optional().or(z.literal('')),
  VITE_GA_MEASUREMENT_ID: z.string().optional(),
  VITE_APP_VERSION: z.string().optional(),
  MODE: z.enum(['development', 'production', 'test']).default('development'),
  DEV: z.boolean().default(true),
  PROD: z.boolean().default(false),
});

type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

function validateEnv(): Env {
  if (cachedEnv !== null) return cachedEnv;

  const rawEnv = {
    VITE_API_URL: import.meta.env.VITE_API_URL,
    VITE_WS_URL: import.meta.env.VITE_WS_URL,
    VITE_YANDEX_MAPS_API_KEY: import.meta.env.VITE_YANDEX_MAPS_API_KEY,
    VITE_MAPBOX_TOKEN: import.meta.env.VITE_MAPBOX_TOKEN,
    VITE_GEOAPIFY_API_KEY: import.meta.env.VITE_GEOAPIFY_API_KEY,
    VITE_TELEGRAM_BOT_USERNAME: import.meta.env.VITE_TELEGRAM_BOT_USERNAME,
    VITE_VAPID_PUBLIC_KEY: import.meta.env.VITE_VAPID_PUBLIC_KEY,
    VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
    VITE_GA_MEASUREMENT_ID: import.meta.env.VITE_GA_MEASUREMENT_ID,
    VITE_APP_VERSION: import.meta.env.VITE_APP_VERSION,
    MODE: import.meta.env.MODE,
    DEV: import.meta.env.DEV,
    PROD: import.meta.env.PROD,
  };

  cachedEnv = envSchema.parse(rawEnv);
  return cachedEnv;
}

export const env = {
  get VITE_API_URL() {
    return validateEnv().VITE_API_URL || '';
  },
  get VITE_WS_URL() {
    const wsUrl = validateEnv().VITE_WS_URL;
    if (wsUrl) return wsUrl;
    const apiUrl = validateEnv().VITE_API_URL;
    if (apiUrl) return apiUrl.replace(/^https?/, (m) => (m === 'https' ? 'wss' : 'ws'));
    return '';
  },
  get VITE_YANDEX_MAPS_API_KEY() { return validateEnv().VITE_YANDEX_MAPS_API_KEY; },
  get VITE_MAPBOX_TOKEN() { return validateEnv().VITE_MAPBOX_TOKEN; },
  get VITE_GEOAPIFY_API_KEY() { return validateEnv().VITE_GEOAPIFY_API_KEY; },
  get VITE_TELEGRAM_BOT_USERNAME() { return validateEnv().VITE_TELEGRAM_BOT_USERNAME; },
  get VITE_VAPID_PUBLIC_KEY() { return validateEnv().VITE_VAPID_PUBLIC_KEY; },
  get VITE_SENTRY_DSN() { return validateEnv().VITE_SENTRY_DSN; },
  get VITE_GA_MEASUREMENT_ID() { return validateEnv().VITE_GA_MEASUREMENT_ID; },
  get VITE_APP_VERSION() { return validateEnv().VITE_APP_VERSION; },
  get MODE() { return validateEnv().MODE; },
  get DEV() { return validateEnv().DEV; },
  get PROD() { return validateEnv().PROD; },
} as Env;

export const getEnv = (): Env => validateEnv();

export function validateRequiredEnv(): boolean {
  try {
    validateEnv();
    return true;
  } catch {
    return false;
  }
}
