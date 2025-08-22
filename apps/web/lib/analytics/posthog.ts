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

export function bindSectionViewTracking() {
  if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return;

  const observedSections = new Set<string>();

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
          const section = entry.target as HTMLElement;
          const sectionName = section.getAttribute('data-section');

          if (sectionName && !observedSections.has(sectionName)) {
            observedSections.add(sectionName);
            posthog?.capture?.('section.view', {
              section: sectionName,
              path: window.location.pathname
            });
          }
        }
      });
    },
    {
      threshold: 0.5, // Trigger when 50% of section is visible
      rootMargin: '0px 0px -10% 0px' // Slight offset to ensure section is truly in view
    }
  );

  // Observe all sections with data-evt="section.view"
  document.querySelectorAll('[data-evt="section.view"]').forEach((section) => {
    observer.observe(section);
  });

  return observer;
}

