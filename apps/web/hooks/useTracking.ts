'use client';

import { useEffect } from 'react';

// PostHog tracking events for the benefits landing page and demo
export interface TrackingEvents {
  lp_benefits_viewed: {
    utm?: string;
    lang?: string;
  };
  lp_cta_click: {
    cta: string;
    section: string;
    href?: string;
    label?: string;
  };
  lp_faq_toggle: {
    question: string;
    action: 'open' | 'close';
  };
  demo_checkin_started: {
    method?: 'qr' | 'biometric';
  };
  demo_checkin_success: {
    method?: 'qr' | 'biometric';
  };
  demo_class_view: {
    classId: string;
  };
  demo_class_booked: {
    classId: string;
    className?: string;
  };
  demo_progress_view: {
    streakDays: number;
    monthlyVisits: number;
    trendUp: boolean;
  };
}

// Initialize PostHog if not already done
function initPostHog() {
  if (typeof window === 'undefined') return null;

  try {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return null;

    // Dynamic import to avoid SSR issues
    return import('posthog-js').then(({ default: posthog }) => {
      if (!posthog.__loaded) {
        posthog.init(key, {
          api_host: 'https://app.posthog.com',
          capture_pageview: false, // We'll handle this manually
          persistence: 'localStorage',
        });
      }
      return posthog;
    });
  } catch (error) {
    console.warn('PostHog initialization failed:', error);
    return null;
  }
}

// Track a specific event
export function trackEvent<K extends keyof TrackingEvents>(
  eventName: K,
  properties: TrackingEvents[K]
) {
  if (typeof window === 'undefined') return;

  initPostHog()?.then(posthog => {
    if (posthog) {
      posthog.capture(eventName, properties);
    }
  });
}

// Track page view with UTM parameters
export function trackPageView(pageName: string) {
  if (typeof window === 'undefined') return;

  const searchParams = new URLSearchParams(window.location.search);
  const utmParams = {
    utm_source: searchParams.get('utm_source'),
    utm_medium: searchParams.get('utm_medium'),
    utm_campaign: searchParams.get('utm_campaign'),
    utm_term: searchParams.get('utm_term'),
    utm_content: searchParams.get('utm_content'),
  };

  // Filter out null values
  const cleanUtmParams = Object.fromEntries(
    Object.entries(utmParams).filter(([_, value]) => value !== null)
  );

  trackEvent('lp_benefits_viewed', {
    utm: Object.keys(cleanUtmParams).length > 0 ? JSON.stringify(cleanUtmParams) : undefined,
    lang: 'es-MX',
  });
}

// Track CTA clicks
export function trackCTAClick(cta: string, section: string, href?: string, label?: string) {
  trackEvent('lp_cta_click', {
    cta,
    section,
    href,
    label,
  });
}

// Track FAQ toggles
export function trackFAQToggle(question: string, action: 'open' | 'close') {
  trackEvent('lp_faq_toggle', {
    question,
    action,
  });
}

// Main tracking hook for the benefits page
export function useTracking() {
  useEffect(() => {
    // Track page view on mount
    trackPageView('benefits');
  }, []);

  useEffect(() => {
    // Set up automatic CTA tracking
    const handleCTAClick = (event: Event) => {
      const target = event.target as HTMLElement;
      const ctaElement = target.closest('[data-cta]') as HTMLElement;

      if (ctaElement) {
        const cta = ctaElement.getAttribute('data-cta') || 'unknown';
        const section = ctaElement.getAttribute('data-section') || 'unknown';
        const href =
          (ctaElement as HTMLAnchorElement).href || ctaElement.getAttribute('href') || undefined;
        const label = ctaElement.textContent?.trim();

        trackCTAClick(cta, section, href, label);
      }
    };

    document.addEventListener('click', handleCTAClick);
    return () => document.removeEventListener('click', handleCTAClick);
  }, []);

  return {
    trackEvent,
    trackPageView,
    trackCTAClick,
    trackFAQToggle,
  };
}
