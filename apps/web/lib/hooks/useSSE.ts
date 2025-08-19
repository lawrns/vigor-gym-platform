/**
 * Server-Sent Events Hook
 *
 * Provides real-time event streaming with retry/backoff strategy and visibility pause
 */

import { useEffect, useRef, useState, useCallback } from 'react';

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

        const error = new Error('SSE connection failed');
        updateState({ status: 'error', error });
        onError?.(error);
        onConnectionChange?.('error');

        // Retry logic
        if (state.retryCount < maxRetries) {
          const delay = calculateRetryDelay(state.retryCount);
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
