/**
 * Web Vitals & OpenTelemetry Registration for Browser
 * 
 * Collects Core Web Vitals and sends them to our telemetry endpoint.
 * Only runs in browser environment.
 */

export async function registerOTel() {
  // Only run in browser
  if (typeof window === 'undefined') {
    console.debug('[OTEL] Skipping browser instrumentation in server environment');
    return;
  }

  try {
    // Dynamic import to avoid SSR issues
    const { onCLS, onINP, onLCP, onTTFB, onFCP } = await import('web-vitals');
    
    console.debug('[OTEL] Registering Web Vitals monitoring...');

    // Send metrics to our telemetry endpoint
    const sendMetric = (metric: any) => {
      const payload = {
        metric: metric.name,
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        id: metric.id,
        url: window.location.href,
        timestamp: Date.now(),
        // Add context
        userAgent: navigator.userAgent,
        connection: (navigator as any).connection?.effectiveType || 'unknown',
      };

      // Use sendBeacon for reliability, fallback to fetch
      const data = JSON.stringify(payload);
      
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/telemetry/vitals', data);
      } else {
        fetch('/api/telemetry/vitals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: data,
          keepalive: true,
        }).catch(err => {
          console.debug('[OTEL] Failed to send metric:', err);
        });
      }
    };

    // Register Core Web Vitals
    onTTFB(sendMetric);  // Time to First Byte
    onFCP(sendMetric);   // First Contentful Paint  
    onLCP(sendMetric);   // Largest Contentful Paint
    onCLS(sendMetric);   // Cumulative Layout Shift
    onINP(sendMetric);   // Interaction to Next Paint

    console.debug('[OTEL] Web Vitals monitoring registered');

    // Add custom performance marks for key user flows
    if ('performance' in window && 'mark' in performance) {
      // Mark auth initialization
      window.addEventListener('auth-initialized', () => {
        performance.mark('auth-initialized');
      });

      // Mark widget ready
      window.addEventListener('widget-ready', () => {
        performance.mark('widget-ready');
        
        // Measure widget init time
        try {
          performance.measure('widget-init', 'navigationStart', 'widget-ready');
          const measure = performance.getEntriesByName('widget-init')[0];
          if (measure) {
            sendMetric({
              name: 'widget-init',
              value: measure.duration,
              rating: measure.duration < 400 ? 'good' : measure.duration < 800 ? 'needs-improvement' : 'poor',
              delta: measure.duration,
              id: `widget-init-${Date.now()}`,
            });
          }
        } catch (err) {
          console.debug('[OTEL] Failed to measure widget init:', err);
        }
      });
    }

  } catch (error) {
    console.error('[OTEL] Failed to register Web Vitals:', error);
  }
}
