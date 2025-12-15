/**
 * Google Analytics integration
 * Only initializes if GA_MEASUREMENT_ID is provided
 */

declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string | Date,
      config?: Record<string, unknown>
    ) => void;
    dataLayer?: unknown[];
  }
}

let isInitialized = false;

/**
 * Initialize Google Analytics
 */
export function initAnalytics() {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;

  if (!measurementId) {
    // Silent in production, no need to log
    return;
  }

  if (isInitialized) {
    return;
  }

  try {
    // Create dataLayer
    window.dataLayer = window.dataLayer || [];
    window.gtag = function (...args: unknown[]) {
      window.dataLayer?.push(args);
    };

    // Load GA script
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);

    // Initialize GA
    window.gtag("js", new Date());
    window.gtag("config", measurementId, {
      page_path: window.location.pathname,
    });

    isInitialized = true;
    // Google Analytics initialized successfully (silent)
  } catch (error) {
    // Log to console only in development
    if (import.meta.env.DEV) {
      console.error("Google Analytics: Initialization failed", error);
    }
  }
}

/**
 * Track page view
 */
export function trackPageView(path: string, title?: string) {
  if (!window.gtag || !isInitialized) return;

  window.gtag("config", import.meta.env.VITE_GA_MEASUREMENT_ID, {
    page_path: path,
    page_title: title,
  });
}

/**
 * Track event
 */
export function trackEvent(
  eventName: string,
  eventParams?: Record<string, unknown>
) {
  if (!window.gtag || !isInitialized) return;

  window.gtag("event", eventName, eventParams);
}

/**
 * Track user actions
 */
export const trackUserAction = {
  // Authentication
  signUp: (method: string) => trackEvent("sign_up", { method }),
  signIn: (method: string) => trackEvent("login", { method }),
  signOut: () => trackEvent("logout"),

  // Rides
  createRide: () => trackEvent("create_ride"),
  searchRides: (params: { from?: string; to?: string }) =>
    trackEvent("search_rides", params),
  viewRideDetails: (rideId: string) =>
    trackEvent("view_ride_details", { ride_id: rideId }),

  // Bookings
  createBooking: (rideId: string) =>
    trackEvent("create_booking", { ride_id: rideId }),
  confirmBooking: (bookingId: string) =>
    trackEvent("confirm_booking", { booking_id: bookingId }),
  cancelBooking: (bookingId: string) =>
    trackEvent("cancel_booking", { booking_id: bookingId }),

  // Messages
  sendMessage: (rideId: string) =>
    trackEvent("send_message", { ride_id: rideId }),

  // Reviews
  createReview: (rideId: string, rating: number) =>
    trackEvent("create_review", { ride_id: rideId, rating }),

  // Profile
  updateProfile: () => trackEvent("update_profile"),
};

