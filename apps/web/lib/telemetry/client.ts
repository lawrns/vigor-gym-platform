/**
 * Minimal telemetry client for debugging and monitoring
 */

export interface TelemetryEvent {
  name: string;
  payload?: Record<string, unknown>;
  timestamp?: number;
}

export const track = (name: string, payload: Record<string, unknown> = {}) => {
  const event: TelemetryEvent = {
    name,
    payload,
    timestamp: Date.now(),
  };

  // Debug logging for development
  console.debug(`[telemetry] ${name}`, payload);

  // In production, this could send to analytics service
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    // Could integrate with PostHog, Mixpanel, etc.
    // For now, just store in sessionStorage for debugging
    try {
      const events = JSON.parse(sessionStorage.getItem('telemetry_events') || '[]');
      events.push(event);
      // Keep only last 100 events
      if (events.length > 100) {
        events.splice(0, events.length - 100);
      }
      sessionStorage.setItem('telemetry_events', JSON.stringify(events));
    } catch (error) {
      // Ignore storage errors
    }
  }
};

// Specific tracking functions for common events
export const telemetry = {
  auth: {
    ready: (duration: number) => track('auth.ready', { duration_ms: duration }),
    failed: (error: string) => track('auth.failed', { error }),
  },

  org: {
    contextSet: (orgId: string) => track('org.context_set', { orgId }),
    missing: () => track('org.missing', {}),
  },

  sse: {
    opened: (orgId: string, ttfb?: number) => track('sse.opened', { orgId, ttfb_ms: ttfb }),
    error: (httpStatus?: number, code?: string, retryMs?: number) =>
      track('sse.error', { http_status: httpStatus, code, retry_ms: retryMs }),
    blocked: (reason: string) => track('sse.blocked', { reason }),
    stopped: (status: string) => track('sse.stopped', { status }),
    closed: (reason: string) => track('sse.closed', { reason }),
  },

  dashboard: {
    loaded: (widgets: string[]) => track('dashboard.loaded', { widgets }),
    widgetError: (widget: string, error: string) =>
      track('dashboard.widget_error', { widget, error }),
  },
};
