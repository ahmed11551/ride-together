/**
 * Analytics component for tracking page views
 * Loaded lazily to not block initial render
 */
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function Analytics() {
  const location = useLocation();

  useEffect(() => {
    // Initialize analytics asynchronously to not block initial load
    const initAnalytics = async () => {
      const { initAnalytics: init, trackPageView: track } = await import("@/lib/analytics");
      init();
      track(location.pathname + location.search, document.title);
    };
    
    // Delay initialization slightly to prioritize critical rendering
    const timer = setTimeout(() => {
      initAnalytics();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Track page view on route change (async)
    const trackPage = async () => {
      const { trackPageView } = await import("@/lib/analytics");
      trackPageView(location.pathname + location.search, document.title);
    };
    trackPage();
  }, [location]);

  return null;
}

