'use client';
import React, { useEffect } from 'react';
import { initPostHog, bindCtaTracking, bindPlanTracking, bindSectionViewTracking } from '../lib/analytics/posthog';

export function AnalyticsBinder() {
  useEffect(() => {
    initPostHog();
    bindCtaTracking();
    bindPlanTracking();

    // Add section view tracking with a small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      bindSectionViewTracking();
    }, 100);

    return () => clearTimeout(timer);
  }, []);
  return null;
}

