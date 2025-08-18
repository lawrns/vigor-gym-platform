"use client";

import { useEffect, useRef } from 'react';

export function ServiceWorkerRegistration() {
  const registeredRef = useRef(false);

  useEffect(() => {
    // Prevent duplicate registrations
    if (registeredRef.current || !('serviceWorker' in navigator)) {
      return;
    }

    registeredRef.current = true;

    // Check if service worker is already registered
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      const existingRegistration = registrations.find(reg =>
        reg.active?.scriptURL.includes('/sw.js')
      );

      if (existingRegistration) {
        console.log('Service Worker already registered:', existingRegistration);
        setupServiceWorkerListeners(existingRegistration);
        return;
      }

      // Register new service worker
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration);
          setupServiceWorkerListeners(registration);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
          registeredRef.current = false; // Allow retry
        });
    });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'OFFLINE_CHECKIN_PROCESSED') {
        // Handle offline check-in processing results
        console.log('Offline check-in processed:', event.data);
      }
    });
  }, []);

  const setupServiceWorkerListeners = (registration: ServiceWorkerRegistration) => {
    // Check for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New content is available, prompt user to refresh
            if (confirm('A new version is available. Refresh to update?')) {
              window.location.reload();
            }
          }
        });
      }
    });
  };

  return null; // This component doesn't render anything
}
