/**
 * Sentry integration for error monitoring
 * Only initializes in production mode
 */

import * as Sentry from "@sentry/react";

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.MODE;
  const release = import.meta.env.VITE_APP_VERSION || "1.0.0";

  // Only initialize in production or if DSN is provided
  if (!dsn || environment === "development") {
    // Silent in production, no need to log
    return;
  }

  try {
    Sentry.init({
      dsn,
      environment,
      release,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      // Performance Monitoring
      tracesSampleRate: environment === "production" ? 0.1 : 1.0,
      // Session Replay
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      // Filter out common errors
      beforeSend(event, hint) {
        // Ignore errors from browser extensions
        if (
          hint.originalException &&
          typeof hint.originalException === "object" &&
          "message" in hint.originalException &&
          typeof hint.originalException.message === "string" &&
          hint.originalException.message.includes("Receiving end does not exist")
        ) {
          return null;
        }

        // Ignore network errors from extensions
        if (
          event.exception &&
          event.exception.values &&
          event.exception.values[0]?.value?.includes("Could not establish connection")
        ) {
          return null;
        }

        return event;
      },
    });

    // Sentry initialized successfully (silent)
  } catch (error) {
    // Log to console only in development
    if (environment === "development") {
      console.error("Sentry: Initialization failed", error);
    }
  }
}

/**
 * Set user context for Sentry
 */
export function setSentryUser(userId: string, email?: string, username?: string) {
  Sentry.setUser({
    id: userId,
    email,
    username,
  });
}

/**
 * Clear user context
 */
export function clearSentryUser() {
  Sentry.setUser(null);
}

/**
 * Capture exception manually
 */
export function captureException(error: Error, context?: Record<string, unknown>) {
  Sentry.captureException(error, {
    contexts: {
      custom: context || {},
    },
  });
}

/**
 * Capture message manually
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = "info") {
  Sentry.captureMessage(message, level);
}

