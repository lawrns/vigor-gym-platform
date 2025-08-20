/**
 * Server-Sent Events Hook
 *
 * Provides real-time event streaming with retry/backoff strategy and visibility pause
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { telemetry } from '../telemetry/client';

export interface SSEEvent {
  id: string;
  type: string;
  at: string;
  orgId: string;
  locationId: string | null;
  payload: Record<string, unknown>;
}

export interface SSEOptions {
  orgId: string;
  locationId?: string | null;
  onEvent?: (event: SSEEvent) => void;
  onError?: (error: Error) => void;
  onConnectionChange?: (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void;
  maxRetries?: number;
  retryDelay?: number;
  maxRetryDelay?: number;
  pauseOnVisibilityChange?: boolean;
}

export interface SSEState {
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  error: Error | null;
  retryCount: number;
  lastEventId: string | null;
  eventCount: number;
}

export function useSSE(options: SSEOptions): SSEState {
  const {
    orgId,
    locationId,
    onEvent,
    onError,
    onConnectionChange,
    maxRetries = 5,
    retryDelay = 1000,
    maxRetryDelay = 30000,
    pauseOnVisibilityChange = true,
  } = options;

  const [state, setState] = useState<SSEState>({
    status: 'disconnected',
    error: null,
    retryCount: 0,
    lastEventId: null,
    eventCount: 0,
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isVisibleRef = useRef(true);
  const shouldConnectRef = useRef(true);

  const updateState = useCallback((updates: Partial<SSEState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const calculateRetryDelay = useCallback(
    (retryCount: number): number => {
      // Exponential backoff with jitter
      const baseDelay = Math.min(retryDelay * Math.pow(2, retryCount), maxRetryDelay);
      const jitter = Math.random() * 0.1 * baseDelay;
      return baseDelay + jitter;
    },
    [retryDelay, maxRetryDelay]
  );

  const connect = useCallback(() => {
    if (!shouldConnectRef.current || (!isVisibleRef.current && pauseOnVisibilityChange)) {
      return;
    }

    // HOTFIX: Guard - never connect without orgId
    if (!orgId) {
      console.debug('[SSE] Blocked: missing orgId');
      telemetry.sse.blocked('missing_org');
      updateState({ status: 'disconnected', error: new Error('missing_org') });
      onConnectionChange?.('error');
      return;
    }

    // Client-side UUID format guard (cheap validation)
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!UUID_RE.test(orgId)) {
      console.debug('[SSE] Blocked: invalid orgId format:', orgId);
      telemetry.sse.blocked('invalid_format');
      updateState({ status: 'disconnected', error: new Error('invalid_org_format') });
      onConnectionChange?.('error');
      return;
    }

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    updateState({ status: 'connecting', error: null });
    onConnectionChange?.('connecting');

    try {
      const url = new URL('/api/events', window.location.origin);
      url.searchParams.set('orgId', orgId);
      if (locationId) {
        url.searchParams.set('locationId', locationId);
      }

      const eventSource = new EventSource(url.toString(), {
        withCredentials: true,
      });

      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('[SSE] Connection opened');
        telemetry.sse.opened(orgId);
        updateState({
          status: 'connected',
          error: null,
          retryCount: 0,
        });
        onConnectionChange?.('connected');
      };

      eventSource.onmessage = event => {
        try {
          const data = JSON.parse(event.data) as SSEEvent;
          updateState(prev => ({
            lastEventId: event.lastEventId || data.id,
            eventCount: prev.eventCount + 1,
          }));
          onEvent?.(data);
        } catch (error) {
          console.error('[SSE] Failed to parse event data:', error);
        }
      };

      // Handle specific event types
      eventSource.addEventListener('connection.established', event => {
        console.log('[SSE] Connection established:', event.data);
      });

      eventSource.addEventListener('heartbeat', event => {
        // Heartbeat received - connection is alive
        console.debug('[SSE] Heartbeat received');
      });

      eventSource.addEventListener('visit.checkin', event => {
        try {
          const data = JSON.parse(event.data) as SSEEvent;
          onEvent?.(data);
        } catch (error) {
          console.error('[SSE] Failed to parse visit.checkin event:', error);
        }
      });

      eventSource.addEventListener('visit.checkout', event => {
        try {
          const data = JSON.parse(event.data) as SSEEvent;
          onEvent?.(data);
        } catch (error) {
          console.error('[SSE] Failed to parse visit.checkout event:', error);
        }
      });

      eventSource.addEventListener('membership.expiring', event => {
        try {
          const data = JSON.parse(event.data) as SSEEvent;
          onEvent?.(data);
        } catch (error) {
          console.error('[SSE] Failed to parse membership.expiring event:', error);
        }
      });

      eventSource.addEventListener('payment.failed', event => {
        try {
          const data = JSON.parse(event.data) as SSEEvent;
          onEvent?.(data);
        } catch (error) {
          console.error('[SSE] Failed to parse payment.failed event:', error);
        }
      });

      eventSource.onerror = event => {
        console.error('[SSE] Connection error:', event);

        // Check if this is an HTTP error by examining the readyState
        const isHttpError = eventSource.readyState === EventSource.CLOSED;

        const error = new Error('SSE connection failed');
        updateState({ status: 'error', error });
        onError?.(error);
        onConnectionChange?.('error');

        // Stop retry on 4xx errors (client mistakes)
        // Note: EventSource doesn't expose HTTP status directly, but 4xx errors
        // typically result in immediate CLOSED state
        if (isHttpError && state.retryCount === 0) {
          // Likely a 4xx error on first attempt - don't retry
          console.debug('[SSE] Stopped: likely 4xx error, not retrying');
          telemetry.sse.stopped('4xx');
          updateState({ status: 'disconnected' });
          onConnectionChange?.('disconnected');
          return;
        }

        // Retry logic with bounded exponential backoff
        if (state.retryCount < maxRetries) {
          const delay = Math.min(calculateRetryDelay(state.retryCount), 10000); // Cap at 10s
          console.log(
            `[SSE] Retrying in ${delay}ms (attempt ${state.retryCount + 1}/${maxRetries})`
          );

          retryTimeoutRef.current = setTimeout(() => {
            updateState(prev => ({ retryCount: prev.retryCount + 1 }));
            connect();
          }, delay);
        } else {
          console.error('[SSE] Max retries exceeded');
          updateState({ status: 'disconnected' });
          onConnectionChange?.('disconnected');
        }
      };
    } catch (error) {
      console.error('[SSE] Failed to create EventSource:', error);
      const err = error instanceof Error ? error : new Error('Failed to create SSE connection');
      updateState({ status: 'error', error: err });
      onError?.(err);
      onConnectionChange?.('error');
    }
  }, [
    orgId,
    locationId,
    onEvent,
    onError,
    onConnectionChange,
    maxRetries,
    calculateRetryDelay,
    state.retryCount,
    pauseOnVisibilityChange,
    updateState,
  ]);

  const disconnect = useCallback(() => {
    shouldConnectRef.current = false;

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    updateState({ status: 'disconnected', error: null });
    onConnectionChange?.('disconnected');
  }, [updateState, onConnectionChange]);

  const reconnect = useCallback(() => {
    updateState({ retryCount: 0 });
    shouldConnectRef.current = true;
    connect();
  }, [connect, updateState]);

  // Handle visibility changes
  useEffect(() => {
    if (!pauseOnVisibilityChange) return;

    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;

      if (document.hidden) {
        console.log('[SSE] Page hidden, pausing connection');
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }
      } else {
        console.log('[SSE] Page visible, resuming connection');
        if (shouldConnectRef.current) {
          connect();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [connect, pauseOnVisibilityChange]);

  // Initial connection
  useEffect(() => {
    shouldConnectRef.current = true;
    connect();
    return disconnect;
  }, [connect, disconnect]);

  return {
    ...state,
    // Expose reconnect method for manual retry
    reconnect,
  } as SSEState & { reconnect: () => void };
}
