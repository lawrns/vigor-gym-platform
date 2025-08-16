"use client";

import { useState, useEffect } from 'react';
import { getAuthMetrics, getRecentAuthMetrics } from '../../lib/monitoring/auth-metrics';

interface AuthMetrics {
  loginAttempts: number;
  loginSuccesses: number;
  loginFailures: number;
  averageLoginTime: number;
  averageSessionDuration: number;
  redirectPerformance: number;
  errorPatterns: Record<string, number>;
}

export function AuthMetricsDashboard() {
  const [metrics, setMetrics] = useState<AuthMetrics | null>(null);
  const [recentMetrics, setRecentMetrics] = useState<AuthMetrics | null>(null);
  const [timeframe, setTimeframe] = useState<number>(60); // minutes

  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(getAuthMetrics());
      setRecentMetrics(getRecentAuthMetrics(timeframe));
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [timeframe]);

  if (!metrics || !recentMetrics) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  const successRate = metrics.loginAttempts > 0 
    ? ((metrics.loginSuccesses / metrics.loginAttempts) * 100).toFixed(1)
    : '0';

  const recentSuccessRate = recentMetrics.loginAttempts > 0 
    ? ((recentMetrics.loginSuccesses / recentMetrics.loginAttempts) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Auth Performance Metrics
        </h2>
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(Number(e.target.value))}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value={15}>Last 15 minutes</option>
          <option value={60}>Last hour</option>
          <option value={240}>Last 4 hours</option>
          <option value={1440}>Last 24 hours</option>
        </select>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Success Rate"
          value={`${recentSuccessRate}%`}
          subtitle={`${recentMetrics.loginSuccesses}/${recentMetrics.loginAttempts} attempts`}
          trend={Number(recentSuccessRate) >= 95 ? 'good' : Number(recentSuccessRate) >= 85 ? 'warning' : 'danger'}
        />
        
        <MetricCard
          title="Avg Login Time"
          value={`${Math.round(recentMetrics.averageLoginTime)}ms`}
          subtitle="Response time"
          trend={recentMetrics.averageLoginTime < 1000 ? 'good' : recentMetrics.averageLoginTime < 3000 ? 'warning' : 'danger'}
        />
        
        <MetricCard
          title="Avg Session Duration"
          value={formatDuration(recentMetrics.averageSessionDuration)}
          subtitle="User engagement"
          trend={recentMetrics.averageSessionDuration > 300000 ? 'good' : 'neutral'} // 5+ minutes
        />
        
        <MetricCard
          title="Redirect Performance"
          value={`${Math.round(recentMetrics.redirectPerformance)}ms`}
          subtitle="Navigation speed"
          trend={recentMetrics.redirectPerformance < 500 ? 'good' : recentMetrics.redirectPerformance < 1000 ? 'warning' : 'danger'}
        />
      </div>

      {/* Historical vs Recent Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Historical Overview (All Time)
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Total Login Attempts:</span>
              <span className="font-medium text-gray-900 dark:text-white">{metrics.loginAttempts}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Success Rate:</span>
              <span className="font-medium text-gray-900 dark:text-white">{successRate}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Avg Login Time:</span>
              <span className="font-medium text-gray-900 dark:text-white">{Math.round(metrics.averageLoginTime)}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Avg Session Duration:</span>
              <span className="font-medium text-gray-900 dark:text-white">{formatDuration(metrics.averageSessionDuration)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Error Patterns
          </h3>
          <div className="space-y-2">
            {Object.entries(metrics.errorPatterns).length > 0 ? (
              Object.entries(metrics.errorPatterns)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([error, count]) => (
                  <div key={error} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400 truncate flex-1 mr-2">
                      {error}
                    </span>
                    <span className="text-sm font-medium text-red-600 dark:text-red-400">
                      {count}
                    </span>
                  </div>
                ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm">No errors recorded</p>
            )}
          </div>
        </div>
      </div>

      {/* Performance Alerts */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Performance Alerts
        </h3>
        <div className="space-y-2">
          {getPerformanceAlerts(recentMetrics).map((alert, index) => (
            <div
              key={index}
              className={`p-3 rounded-md ${
                alert.type === 'danger' 
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
                  : alert.type === 'warning'
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800'
                  : 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800'
              }`}
            >
              <div className="flex items-center">
                <span className="text-sm font-medium">{alert.message}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  trend: 'good' | 'warning' | 'danger' | 'neutral';
}

function MetricCard({ title, value, subtitle, trend }: MetricCardProps) {
  const trendColors = {
    good: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    danger: 'text-red-600 dark:text-red-400',
    neutral: 'text-gray-600 dark:text-gray-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
        {title}
      </h3>
      <div className={`text-2xl font-bold mb-1 ${trendColors[trend]}`}>
        {value}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-500">
        {subtitle}
      </p>
    </div>
  );
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
  return `${Math.round(ms / 3600000)}h`;
}

function getPerformanceAlerts(metrics: AuthMetrics): Array<{type: 'good' | 'warning' | 'danger', message: string}> {
  const alerts = [];

  if (metrics.loginAttempts === 0) {
    alerts.push({ type: 'warning' as const, message: 'No login attempts in selected timeframe' });
    return alerts;
  }

  const successRate = (metrics.loginSuccesses / metrics.loginAttempts) * 100;

  if (successRate < 85) {
    alerts.push({ type: 'danger' as const, message: `Low success rate: ${successRate.toFixed(1)}% (target: >95%)` });
  } else if (successRate < 95) {
    alerts.push({ type: 'warning' as const, message: `Success rate below target: ${successRate.toFixed(1)}% (target: >95%)` });
  } else {
    alerts.push({ type: 'good' as const, message: `Success rate healthy: ${successRate.toFixed(1)}%` });
  }

  if (metrics.averageLoginTime > 3000) {
    alerts.push({ type: 'danger' as const, message: `Slow login performance: ${Math.round(metrics.averageLoginTime)}ms (target: <1000ms)` });
  } else if (metrics.averageLoginTime > 1000) {
    alerts.push({ type: 'warning' as const, message: `Login performance degraded: ${Math.round(metrics.averageLoginTime)}ms (target: <1000ms)` });
  }

  if (metrics.redirectPerformance > 1000) {
    alerts.push({ type: 'danger' as const, message: `Slow redirects: ${Math.round(metrics.redirectPerformance)}ms (target: <500ms)` });
  } else if (metrics.redirectPerformance > 500) {
    alerts.push({ type: 'warning' as const, message: `Redirect performance degraded: ${Math.round(metrics.redirectPerformance)}ms (target: <500ms)` });
  }

  if (alerts.length === 1 && alerts[0].type === 'good') {
    alerts.push({ type: 'good' as const, message: 'All performance metrics within target ranges' });
  }

  return alerts;
}
