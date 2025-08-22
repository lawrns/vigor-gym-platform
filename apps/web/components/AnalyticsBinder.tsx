'use client';
import React, { useEffect } from 'react';
import { initPostHog, bindCtaTracking, bindPlanTracking, bindSectionViewTracking } from '../lib/analytics/posthog';

export function AnalyticsBinder() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
      // Defer analytics init to idle to minimize impact on TBT
      const run = () => {
        initPostHog();
        bindCtaTracking();
        bindPlanTracking();
        const timer = setTimeout(() => {
          bindSectionViewTracking();
        }, 100);
        return () => clearTimeout(timer);
      };
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(run);
      } else {
        setTimeout(run, 200);
      }
      return;
    }
    // In non-production, keep existing behavior
    initPostHog();
    bindCtaTracking();
    bindPlanTracking();
    const timer = setTimeout(() => {
      bindSectionViewTracking();
    }, 100);
    return () => clearTimeout(timer);
  }, []);
  return null;
}

