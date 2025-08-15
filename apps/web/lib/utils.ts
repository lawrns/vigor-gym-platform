import { type ClassValue } from 'clsx';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function trackCtaClicks() {
  if (typeof window === 'undefined') return;
  import('posthog-js').then(({ default: posthog }) => {
    try {
      // @ts-ignore private
      if (!posthog.__loaded) {
        const key = process.env.NEXT_PUBLIC_POSTHOG_KEY || '';
        if (key) posthog.init(key, { api_host: 'https://app.posthog.com' });
      }
      document.querySelectorAll('[data-cta]').forEach((el) => {
        el.addEventListener('click', (e) => {
          const target = e.currentTarget as HTMLElement;
          // @ts-ignore types liberal
          posthog.capture('cta.click', {
            placement: target.getAttribute('data-cta') || 'unknown',
            label: target.textContent?.trim() || '',
            path: window.location.pathname
          });
        });
      });
    } catch {}
  });
}


