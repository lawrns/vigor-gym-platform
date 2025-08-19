/**
 * Revenue Sparkline Widget
 *
 * Displays revenue trends with sparkline visualization, MRR, and key financial metrics
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Icons } from '../../lib/icons/registry';
import { Widget, WidgetEmpty } from './DashboardShell';
import { api } from '../../lib/api/client';

interface DailyRevenue {
  date: string;
  amount: number;
  paymentsCount: number;
  failedCount: number;
}

// Import the RevenueAnalytics interface from the data service
import type { RevenueAnalytics } from '../../lib/dashboard/supabase-data-service';

interface RevenueSparklineProps {
  locationId?: string | null;
  className?: string;
}

export function RevenueSparkline({ locationId, className }: RevenueSparklineProps) {
  const [data, setData] = useState<RevenueAnalytics | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '14d' | '30d'>('7d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set('period', selectedPeriod);
      if (locationId) {
        params.set('locationId', locationId);
      }

      const result = await api.get<RevenueAnalytics>(`/api/revenue/trends?${params}`);
      setData(result);
    } catch (err) {
      console.error('Error fetching revenue trends:', err);
      setError(err instanceof Error ? err.message : 'Failed to load revenue trends');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedPeriod, locationId]);

  // Format currency (cents to pesos)
  const formatCurrency = (cents: number) => {
    const pesos = cents / 100;
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(pesos);
  };

  // Format large numbers (K, M)
  const formatLargeNumber = (cents: number) => {
    const pesos = cents / 100;
    if (pesos >= 1000000) {
      return `${(pesos / 1000000).toFixed(1)}M`;
    } else if (pesos >= 1000) {
      return `${(pesos / 1000).toFixed(0)}K`;
    }
    return pesos.toFixed(0);
  };

  // Get growth color
  const getGrowthColor = (percent: number) => {
    if (percent > 0) return 'text-green-600 dark:text-green-400';
    if (percent < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  // Get growth icon
  const getGrowthIcon = (percent: number) => {
    if (percent > 0) return Icons.TrendingUp;
    if (percent < 0) return Icons.TrendingDown;
    return Icons.Minus;
  };

  if (loading) {
    return (
      <Widget
        title="Ingresos y Tendencias"
        icon={Icons.DollarSign}
        className={className}
        loading={true}
      >
        <div className="space-y-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </Widget>
    );
  }

  if (error) {
    return (
      <Widget
        title="Ingresos y Tendencias"
        icon={Icons.DollarSign}
        className={className}
        error={error}
        onRetry={fetchData}
      />
    );
  }

  if (!data) {
    return (
      <WidgetEmpty
        title="Ingresos y Tendencias"
        icon={Icons.DollarSign}
        className={className}
        message="No hay datos de ingresos disponibles"
        description="Los datos aparecerán cuando haya transacciones registradas"
      />
    );
  }

  const growthPercent = data.growth?.percentage || 0;
  const GrowthIcon = getGrowthIcon(growthPercent);

  return (
    <Widget
      title="Ingresos y Tendencias"
      icon={Icons.DollarSign}
      className={className}
      action={{
        label: 'Ver Detalles',
        href: '/billing/analytics',
      }}
    >
      <div className="space-y-4">
        {/* Period Selector */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {(['7d', '14d', '30d'] as const).map(period => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  selectedPeriod === period
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        {/* Main Revenue Display */}
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(data.totalRevenue)}
          </div>
          <div className="flex items-center justify-center space-x-2 text-sm">
            <span className="text-gray-500 dark:text-gray-400">
              Ingresos totales ({selectedPeriod})
            </span>
            <div
              className={`flex items-center space-x-1 ${getGrowthColor(growthPercent)}`}
            >
              <GrowthIcon className="w-3 h-3" />
              <span className="font-medium">{Math.abs(growthPercent)}%</span>
            </div>
          </div>
        </div>

        {/* Sparkline Chart */}
        <div className="h-16 w-full">
          <Sparkline
            data={data.dataPoints.map(point => point.revenue)}
            className="w-full h-full"
            color="rgb(59, 130, 246)" // blue-500
          />
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatLargeNumber(data.totalRevenue * 12)} {/* Estimate MRR */}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">MRR Est.</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatLargeNumber(data.dataPoints.length > 0 ? data.totalRevenue / data.dataPoints.length : 0)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Promedio diario</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {data.dataPoints.reduce((sum, point) => sum + point.transactions, 0)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Transacciones</div>
          </div>
        </div>

        {/* Growth Trend */}
        {data.growth && (
          <div className="text-center pt-2">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Tendencia: <span className="font-medium capitalize">{data.growth.trend}</span>
            </div>
          </div>
        )}
      </div>
    </Widget>
  );
}

/**
 * Simple SVG Sparkline Component
 */
interface SparklineProps {
  data: number[];
  className?: string;
  color?: string;
}

function Sparkline({ data, className = '', color = 'rgb(59, 130, 246)' }: SparklineProps) {
  if (!data || data.length === 0) {
    return (
      <div className={`${className} flex items-center justify-center text-gray-400`}>
        <span className="text-xs">Sin datos</span>
      </div>
    );
  }

  const width = 200;
  const height = 60;
  const padding = 4;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1; // Avoid division by zero

  // Generate SVG path
  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((value - min) / range) * (height - 2 * padding);
    return `${x},${y}`;
  });

  const pathData = `M ${points.join(' L ')}`;

  return (
    <div className={className}>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
      >
        {/* Gradient definition */}
        <defs>
          <linearGradient id="sparklineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Fill area */}
        <path
          d={`${pathData} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`}
          fill="url(#sparklineGradient)"
        />

        {/* Line */}
        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
