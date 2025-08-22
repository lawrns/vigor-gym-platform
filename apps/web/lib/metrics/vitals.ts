'use client';

import { onCLS, onINP, onLCP, Metric } from 'web-vitals';
import posthog from 'posthog-js';

function send(metric: Metric) {
  try {
    // Log to console for lab capture
    // eslint-disable-next-line no-console
    console.log('[web-vitals]', metric.name, metric.value, {
      id: metric.id,
      rating: (metric as any).rating,
    });
    if (Math.random() < 0.2) {
      posthog?.capture?.('web_vital', {
        name: metric.name,
        value: metric.value,
        id: metric.id,
        rating: (metric as any).rating,
        path: typeof window !== 'undefined' ? window.location.pathname : '',
      });
    }
  } catch {}
}

export function bindWebVitals() {
  if (typeof window === 'undefined') return;
  // Defer registration slightly to avoid main-thread contention
  const run = () => {
    onLCP(send);
    onCLS(send);
    onINP(send);
  };
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(run);
  } else {
    setTimeout(run, 0);
  }
}


