'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../../lib/icons/registry';

interface Visit {
  id: string;
  memberName: string;
  gymName: string;
  timestamp: string;
  type: 'checkin' | 'checkout';
  durationMinutes?: number;
}

interface TodayCheckinsProps {
  className?: string;
}

export function TodayCheckins({ className = '' }: TodayCheckinsProps) {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [todayCount, setTodayCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Load initial data
    loadTodayVisits();

    // Set up real-time connection
    setupEventSource();

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const loadTodayVisits = async () => {
    try {
      const response = await fetch('/api/proxy/visits/today');
      if (response.ok) {
        const data = await response.json();
        setTodayCount(data.count || 0);
        setVisits(data.visits || []);
      }
    } catch (error) {
      console.error('Failed to load today visits:', error);
    }
  };

  const setupEventSource = () => {
    try {
      const eventSource = new EventSource('/api/proxy/events/subscribe');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        setError(null);
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
        setError('Connection lost. Attempting to reconnect...');

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
    }
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
    const newVisit: Visit = {
      id: data.visitId,
      memberName: data.memberName,
      gymName: data.gymName,
      timestamp: data.timestamp,
      type: 'checkin',
    };

    setVisits(prev => [newVisit, ...prev.slice(0, 9)]); // Keep last 10
    setTodayCount(prev => prev + 1);

    // Show toast notification
    showToast(`${data.memberName} checked in`, 'success');
  };

  const handleVisitCheckedOut = (data: any) => {
    const checkoutVisit: Visit = {
      id: data.visitId,
      memberName: data.memberName,
      gymName: '', // Not needed for checkout
      timestamp: data.timestamp,
      type: 'checkout',
      durationMinutes: data.durationMinutes,
    };

    setVisits(prev => [checkoutVisit, ...prev.slice(0, 9)]); // Keep last 10

    // Show toast notification
    showToast(`${data.memberName} checked out (${data.durationMinutes}m)`, 'info');
  };

  const showToast = (message: string, type: 'success' | 'info' | 'error') => {
    // Simple toast implementation - in production, use a proper toast library
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
      type === 'success' ? 'bg-green-500' : type === 'info' ? 'bg-blue-500' : 'bg-red-500'
    } text-white`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      document.body.removeChild(toast);
    }, 3000);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Today's Check-ins</h3>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {isConnected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">{error}</p>
        </div>
      )}

      <div className="mb-6">
        <div className="text-3xl font-bold text-gray-900 dark:text-white">{todayCount}</div>
        <p className="text-sm text-gray-500 dark:text-gray-400">Total check-ins today</p>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Recent Activity</h4>

        {visits.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No recent activity</p>
        ) : (
          <div className="space-y-2">
            {visits.map(visit => (
              <div
                key={`${visit.id}-${visit.type}-${visit.timestamp}`}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      visit.type === 'checkin' ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {visit.memberName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {visit.type === 'checkin'
                        ? `Checked in at ${visit.gymName}`
                        : `Checked out (${visit.durationMinutes}m)`}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {formatTime(visit.timestamp)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={loadTodayVisits}
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
