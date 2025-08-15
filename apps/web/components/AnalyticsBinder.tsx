"use client";
import { useEffect } from 'react';
import { initPostHog, bindCtaTracking, bindPlanTracking } from '../lib/analytics/posthog';

export function AnalyticsBinder() {
  useEffect(() => {
    initPostHog();
    bindCtaTracking();
    bindPlanTracking();
  }, []);
  return null;
}



