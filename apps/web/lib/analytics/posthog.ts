'use client';
import posthog from 'posthog-js';

let initialized = false;

export function initPostHog() {
  if (initialized) return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;
  posthog.init(key as string, {
    api_host: 'https://app.posthog.com',
    capture_pageview: true,
    persistence: 'localStorage',
  });
  initialized = true;
}

export function bindCtaTracking(root: HTMLElement | Document = document) {
  root.addEventListener('click', e => {
    const target = (e.target as HTMLElement).closest('[data-cta]') as HTMLElement | null;
    if (!target) return;
    const label = target.textContent?.trim() || '';
    const placement = target.getAttribute('data-cta') || '';
    const href = (target as HTMLAnchorElement).href || target.getAttribute('href') || '';
    posthog?.capture?.('cta.click', { placement, label, href });
  });
}

export function bindPlanTracking(root: HTMLElement | Document = document) {
  root.addEventListener('click', e => {
    const target = (e.target as HTMLElement).closest('[data-cta="plan"]') as HTMLElement | null;
    if (!target) return;
    const plan = target.getAttribute('data-plan') || target.getAttribute('aria-label') || '';
    posthog?.capture?.('plan.select', { plan });
  });
}

