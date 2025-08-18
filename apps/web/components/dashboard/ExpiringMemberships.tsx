"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Icons } from '../../lib/icons/registry';

interface ExpirationSummary {
  expiring7Days: number;
  expiring14Days: number;
  pastDue: number;
  expired: number;
}

interface ExpiringMembershipsProps {
  className?: string;
}

export function ExpiringMemberships({ className = '' }: ExpiringMembershipsProps) {
  const [summary, setSummary] = useState<ExpirationSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadExpirationSummary();
    
    // Refresh every 5 minutes
    const interval = setInterval(loadExpirationSummary, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadExpirationSummary = async () => {
    try {
      setError(null);
      const response = await fetch('/api/proxy/memberships/expiring/summary');
      
      if (!response.ok) {
        throw new Error('Failed to load expiration summary');
      }

      const data = await response.json();
      setSummary(data.summary);
    } catch (err) {
      console.error('Error loading expiration summary:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
        <div className="text-center">
          <Icons.AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={loadExpirationSummary}
            className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const totalCritical = (summary?.expiring7Days || 0) + (summary?.pastDue || 0);
  const hasIssues = totalCritical > 0;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Membership Status
        </h3>
        {hasIssues && (
          <div className="flex items-center text-red-600 dark:text-red-400">
            <Icons.AlertTriangle className="h-4 w-4 mr-1" />
            <span className="text-sm font-medium">Attention Required</span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* Critical Issues */}
        {hasIssues && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-3">
              Immediate Attention
            </h4>
            <div className="space-y-2">
              {summary!.pastDue > 0 && (
                <Link
                  href="/admin/members?filter=past_due"
                  className="flex items-center justify-between p-2 bg-red-100 dark:bg-red-900/30 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                >
                  <div className="flex items-center">
                    <Icons.AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mr-2" />
                    <span className="text-sm text-red-800 dark:text-red-200">
                      Past Due Payments
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-red-800 dark:text-red-200">
                    {summary!.pastDue}
                  </span>
                </Link>
              )}
              
              {summary!.expiring7Days > 0 && (
                <Link
                  href="/admin/members?filter=expiring_7_days"
                  className="flex items-center justify-between p-2 bg-red-100 dark:bg-red-900/30 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                >
                  <div className="flex items-center">
                    <Icons.Clock className="h-4 w-4 text-red-600 dark:text-red-400 mr-2" />
                    <span className="text-sm text-red-800 dark:text-red-200">
                      Expiring in 7 Days
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-red-800 dark:text-red-200">
                    {summary!.expiring7Days}
                  </span>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Warning Issues */}
        {summary!.expiring14Days > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
              Upcoming Expirations
            </h4>
            <Link
              href="/admin/members?filter=expiring_14_days"
              className="flex items-center justify-between p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors"
            >
              <div className="flex items-center">
                <Icons.Calendar className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mr-2" />
                <span className="text-sm text-yellow-800 dark:text-yellow-200">
                  Expiring in 14 Days
                </span>
              </div>
              <span className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                {summary!.expiring14Days}
              </span>
            </Link>
          </div>
        )}

        {/* Expired Count (Informational) */}
        {summary!.expired > 0 && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <Link
              href="/admin/members?filter=expired"
              className="flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-600 rounded p-2 transition-colors"
            >
              <div className="flex items-center">
                <Icons.XCircle className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Expired Memberships
                </span>
              </div>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {summary!.expired}
              </span>
            </Link>
          </div>
        )}

        {/* All Good State */}
        {!hasIssues && summary!.expiring14Days === 0 && (
          <div className="text-center py-4">
            <Icons.CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              All memberships are in good standing
            </p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-3">
          <Link
            href="/admin/members"
            className="flex-1 text-center py-2 px-3 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 border border-blue-200 dark:border-blue-800 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          >
            View All Members
          </Link>
          <button
            onClick={loadExpirationSummary}
            className="py-2 px-3 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            title="Refresh"
          >
            <Icons.RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
