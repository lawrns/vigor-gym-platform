/**
 * Live Activity Feed Widget
 *
 * Shows real-time events with virtualized list, aria-live announcements,
 * and fallback to polling when SSE is unavailable
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSSE, SSEEvent } from '../../lib/hooks/useSSE';
import { useAuth } from '../../lib/auth/context';
import { Icons } from '../../lib/icons/registry';
import { api } from '../../lib/api/client';

interface ActivityEvent {
  id: string;
  type: 'visit.checkin' | 'visit.checkout' | 'membership.expiring' | 'payment.failed';
  timestamp: string;
  title: string;
  description: string;
  icon: keyof typeof Icons;
  severity: 'info' | 'warning' | 'error';
  memberName?: string;
  gymName?: string;
}

interface LiveActivityFeedProps {
  locationId?: string | null;
  maxEvents?: number;
  className?: string;
}

export function LiveActivityFeed({
  locationId,
  maxEvents = 25,
  className = '',
}: LiveActivityFeedProps) {
  const { user } = useAuth();
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const [lastPolledAt, setLastPolledAt] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const announcementRef = useRef<HTMLDivElement>(null);

  // Convert SSE event to activity event
  const convertSSEEvent = useCallback((sseEvent: SSEEvent): ActivityEvent => {
    const baseEvent = {
      id: sseEvent.id,
      type: sseEvent.type as ActivityEvent['type'],
      timestamp: sseEvent.at,
    };

    switch (sseEvent.type) {
      case 'visit.checkin':
        return {
          ...baseEvent,
          title: 'Member Check-in',
          description: `${sseEvent.payload.memberName} checked in at ${sseEvent.payload.gymName}`,
          icon: 'UserCheck',
          severity: 'info',
          memberName: sseEvent.payload.memberName,
          gymName: sseEvent.payload.gymName,
        };

      case 'visit.checkout':
        return {
          ...baseEvent,
          title: 'Member Check-out',
          description: `${sseEvent.payload.memberName} checked out after ${sseEvent.payload.durationMinutes} minutes`,
          icon: 'LogOut',
          severity: 'info',
          memberName: sseEvent.payload.memberName,
          gymName: sseEvent.payload.gymName,
        };

      case 'membership.expiring':
        return {
          ...baseEvent,
          title: 'Membership Expiring',
          description: `${sseEvent.payload.memberName}'s ${sseEvent.payload.planName} expires in ${sseEvent.payload.daysLeft} days`,
          icon: 'AlertTriangle',
          severity: 'warning',
          memberName: sseEvent.payload.memberName,
        };

      case 'payment.failed':
        return {
          ...baseEvent,
          title: 'Payment Failed',
          description: `Payment failed for ${sseEvent.payload.memberName} - ${sseEvent.payload.reason}`,
          icon: 'XCircle',
          severity: 'error',
          memberName: sseEvent.payload.memberName,
        };

      default:
        return {
          ...baseEvent,
          title: 'Unknown Event',
          description: 'An unknown event occurred',
          icon: 'Bell',
          severity: 'info',
        };
    }
  }, []);

  // Handle new SSE events
  const handleSSEEvent = useCallback(
    (sseEvent: SSEEvent) => {
      const activityEvent = convertSSEEvent(sseEvent);

      setEvents(prev => {
        const newEvents = [activityEvent, ...prev].slice(0, maxEvents);

        // Announce new event to screen readers
        if (announcementRef.current) {
          announcementRef.current.textContent = `New activity: ${activityEvent.title} - ${activityEvent.description}`;
        }

        return newEvents;
      });
    },
    [convertSSEEvent, maxEvents]
  );

  // SSE connection
  const sseState = useSSE({
    orgId: user?.company?.id || '',
    locationId,
    onEvent: handleSSEEvent,
    onConnectionChange: status => {
      console.log('[LiveActivityFeed] SSE status:', status);

      // Start polling if SSE fails
      if (status === 'error' || status === 'disconnected') {
        setIsPolling(true);
        startPolling();
      } else if (status === 'connected') {
        setIsPolling(false);
        stopPolling();
      }
    },
    maxRetries: 3,
    retryDelay: 2000,
    maxRetryDelay: 10000,
  });

  // Polling fallback
  const fetchRecentActivity = useCallback(async () => {
    if (!user?.company?.id) return;

    try {
      const params = new URLSearchParams({
        orgId: user.company.id,
        limit: maxEvents.toString(),
      });

      if (locationId) {
        params.set('locationId', locationId);
      }

      if (lastPolledAt) {
        params.set('since', lastPolledAt);
      }

      const data = await api.get<{ events: any[] }>(`/v1/dashboard/activity?${params}`);
      const newEvents = data.events?.map(convertSSEEvent) || [];

      if (newEvents.length > 0) {
        setEvents(prev => {
          const combined = [...newEvents, ...prev];
          const unique = combined.filter(
            (event, index, arr) => arr.findIndex(e => e.id === event.id) === index
          );
          return unique.slice(0, maxEvents);
        });
      }

      setLastPolledAt(new Date().toISOString());
    } catch (error) {
      console.error('[LiveActivityFeed] Polling failed:', error);
    }
  }, [user?.company?.id, locationId, maxEvents, lastPolledAt, convertSSEEvent]);

  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) return;

    console.log('[LiveActivityFeed] Starting polling fallback');
    pollingIntervalRef.current = setInterval(fetchRecentActivity, 5000); // Poll every 5 seconds
    fetchRecentActivity(); // Initial fetch
  }, [fetchRecentActivity]);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      console.log('[LiveActivityFeed] Stopped polling fallback');
    }
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  // Get status indicator
  const getStatusIndicator = () => {
    if (sseState.status === 'connected') {
      return (
        <div className="flex items-center text-green-600 dark:text-green-400">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
          <span className="text-xs">Live</span>
        </div>
      );
    }

    if (isPolling) {
      return (
        <div className="flex items-center text-yellow-600 dark:text-yellow-400">
          <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
          <span className="text-xs">Polling</span>
        </div>
      );
    }

    return (
      <div className="flex items-center text-red-600 dark:text-red-400">
        <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
        <span className="text-xs">Disconnected</span>
      </div>
    );
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Live Activity Feed
          </h3>
          {getStatusIndicator()}
        </div>
        {sseState.status === 'error' && (
          <div className="mt-2 text-sm text-red-600 dark:text-red-400">
            Connection failed. Using polling fallback.
            <button
              onClick={() => (sseState as any).reconnect?.()}
              className="ml-2 text-blue-600 dark:text-blue-400 hover:underline"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Activity List */}
      <div className="max-h-96 overflow-y-auto">
        {events.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <Icons.Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No recent activity</p>
            <p className="text-sm mt-1">Events will appear here as they happen</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {events.map(event => {
              const IconComponent = Icons[event.icon];
              return (
                <div
                  key={event.id}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        event.severity === 'error'
                          ? 'bg-red-100 dark:bg-red-900'
                          : event.severity === 'warning'
                            ? 'bg-yellow-100 dark:bg-yellow-900'
                            : 'bg-blue-100 dark:bg-blue-900'
                      }`}
                    >
                      <IconComponent
                        className={`w-4 h-4 ${
                          event.severity === 'error'
                            ? 'text-red-600 dark:text-red-400'
                            : event.severity === 'warning'
                              ? 'text-yellow-600 dark:text-yellow-400'
                              : 'text-blue-600 dark:text-blue-400'
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {event.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTimestamp(event.timestamp)}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {event.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Screen reader announcements */}
      <div ref={announcementRef} className="sr-only" aria-live="polite" aria-atomic="true" />
    </div>
  );
}
