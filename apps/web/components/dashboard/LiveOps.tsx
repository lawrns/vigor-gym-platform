'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../../lib/icons/registry';

interface ActiveVisit {
  id: string;
  memberName: string;
  gymName: string;
  checkInTime: string;
  duration: string;
}

interface RecentCheckin {
  id: string;
  memberName: string;
  gymName: string;
  timestamp: string;
  type: 'checkin' | 'checkout';
  durationMinutes?: number;
}

interface LiveOpsProps {
  className?: string;
}

export function LiveOps({ className = '' }: LiveOpsProps) {
  const [activeVisitsCount, setActiveVisitsCount] = useState(0);
  const [recentCheckins, setRecentCheckins] = useState<RecentCheckin[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Load initial data
    loadInitialData();

    // Set up real-time connection
    setupEventSource();

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const loadInitialData = async () => {
    try {
      setError(null);

      // Load active visits count and recent check-ins
      const [visitsResponse, todayResponse] = await Promise.all([
        fetch('/api/proxy/visits/active'),
        fetch('/api/proxy/visits/today'),
      ]);

      if (visitsResponse.ok) {
        const visitsData = await visitsResponse.json();
        setActiveVisitsCount(visitsData.count || 0);
      }

      if (todayResponse.ok) {
        const todayData = await todayResponse.json();
        setRecentCheckins(todayData.visits?.slice(0, 10) || []);
      }

      setLastUpdate(new Date());
    } catch (err) {
      console.error('Failed to load initial data:', err);
      setError('Failed to load data');
    }
  };

  const setupEventSource = () => {
    try {
      const eventSource = new EventSource('/api/proxy/events/subscribe');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        setError(null);

        // Clear polling fallback if SSE is working
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      };

      eventSource.onmessage = event => {
        try {
          const data = JSON.parse(event.data);
          handleRealtimeEvent(data);
        } catch (error) {
          console.error('Failed to parse event data:', error);
        }
      };

      eventSource.onerror = error => {
        console.error('EventSource error:', error);
        setIsConnected(false);
        setError('Connection lost');

        // Start polling fallback
        startPollingFallback();

        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
            setupEventSource();
          }
        }, 5000);
      };
    } catch (error) {
      console.error('Failed to setup EventSource:', error);
      setError('Failed to establish real-time connection');
      startPollingFallback();
    }
  };

  const startPollingFallback = () => {
    if (pollIntervalRef.current) return; // Already polling

    pollIntervalRef.current = setInterval(() => {
      loadInitialData();
    }, 30000); // Poll every 30 seconds
  };

  const handleRealtimeEvent = (event: any) => {
    switch (event.type) {
      case 'visit:created':
        handleVisitCreated(event.data);
        break;
      case 'visit:checked_out':
        handleVisitCheckedOut(event.data);
        break;
      case 'connection':
        console.log('Connected to real-time events');
        break;
      default:
        console.log('Unknown event type:', event.type);
    }
  };

  const handleVisitCreated = (data: any) => {
    // Increment active visits count
    setActiveVisitsCount(prev => prev + 1);

    // Add to recent check-ins
    const newCheckin: RecentCheckin = {
      id: data.visitId,
      memberName: data.memberName,
      gymName: data.gymName,
      timestamp: data.timestamp,
      type: 'checkin',
    };

    setRecentCheckins(prev => [newCheckin, ...prev.slice(0, 9)]);
    setLastUpdate(new Date());
  };

  const handleVisitCheckedOut = (data: any) => {
    // Decrement active visits count
    setActiveVisitsCount(prev => Math.max(0, prev - 1));

    // Add checkout to recent activity
    const checkoutActivity: RecentCheckin = {
      id: data.visitId,
      memberName: data.memberName,
      gymName: '',
      timestamp: data.timestamp,
      type: 'checkout',
      durationMinutes: data.durationMinutes,
    };

    setRecentCheckins(prev => [checkoutActivity, ...prev.slice(0, 9)]);
    setLastUpdate(new Date());
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Live Operations</h3>
        <div className="flex items-center space-x-3">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {isConnected ? 'Live' : 'Offline'}
          </span>
          {lastUpdate && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {formatTime(lastUpdate.toISOString())}
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">{error}</p>
        </div>
      )}

      {/* Active Visits Counter */}
      <div className="mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Active Visits</p>
              <p
                className="text-3xl font-bold text-blue-900 dark:text-blue-100"
                data-testid="today-checkins-count"
              >
                {activeVisitsCount}
              </p>
            </div>
            <Icons.Users className="h-8 w-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Recent Activity
        </h4>

        {recentCheckins.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            No recent activity
          </p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {recentCheckins.map((activity, index) => (
              <div
                key={`${activity.id}-${activity.type}-${index}`}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      activity.type === 'checkin' ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.memberName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {activity.type === 'checkin'
                        ? `Checked in at ${activity.gymName}`
                        : `Checked out (${formatDuration(activity.durationMinutes || 0)})`}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {formatTime(activity.timestamp)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              /* TODO: Implement manual checkout */
            }}
            className="flex items-center justify-center py-2 px-3 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Icons.LogOut className="h-4 w-4 mr-2" />
            Manual Checkout
          </button>
          <button
            onClick={() => {
              /* TODO: Implement member search */
            }}
            className="flex items-center justify-center py-2 px-3 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Icons.Search className="h-4 w-4 mr-2" />
            Find Member
          </button>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="mt-4 text-center">
        <button
          onClick={loadInitialData}
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          disabled={isConnected} // Only show when not live
        >
          <Icons.RotateCcw className="h-4 w-4 inline mr-1" />
          Refresh
        </button>
      </div>
    </div>
  );
}
