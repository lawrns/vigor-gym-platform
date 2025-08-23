/**
 * Revenue Sparkline Widget
 *
 * Displays revenue trends with sparkline visualization, MRR, and key financial metrics
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Icons } from '../../lib/icons/registry';
import { Widget, WidgetEmpty } from './DashboardShell';
import { apiClient } from '../../lib/api/client';
import type { RevenueAnalytics } from '@gogym/shared';

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

      const result = await apiClient.dashboard.revenue({
        period: selectedPeriod,
        locationId: locationId || undefined,
      });

      // Handle the Railway API response format which has a different structure
      // Railway API returns: { dailyRevenue: [...], summary: {...}, sparklineData: [...], period: "7d", dateRange: {...} }
      // But the frontend expects: { totalRevenue: number, dataPoints: [...], growth: {...}, ... }
      let adaptedData: RevenueAnalytics;

      if ('dailyRevenue' in result) {
        // New Railway API format - adapt to expected format
        const railwayData = result as any;
        adaptedData = {
          totalRevenue: railwayData.summary?.totalRevenue || 0,
          currency: 'MXN',
          period: {
            start: railwayData.dateRange?.from || new Date().toISOString(),
            end: railwayData.dateRange?.to || new Date().toISOString(),
          },
          dataPoints: railwayData.dailyRevenue?.map((day: any) => ({
            date: day.date,
            amount: day.amount,
            currency: 'MXN',
          })) || [],
          growth: railwayData.summary?.growthPercent !== undefined ? {
            percentage: railwayData.summary.growthPercent,
            trend: railwayData.summary.growthPercent > 0 ? 'up' as const :
                   railwayData.summary.growthPercent < 0 ? 'down' as const : 'stable' as const,
          } : undefined,
        };
      } else {
        // Legacy format (already in expected format)
        adaptedData = result as RevenueAnalytics;
      }

      setData(adaptedData);
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

  // Format currency (values are already in MXN)
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format large numbers (K, M)
  const formatLargeNumber = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K`;
    }
    return amount.toFixed(0);
  };

  // Get growth color
  const getGrowthColor = (percent: number) => {
    if (percent > 0) return 'text-green-600 dark:text-green-400';
    if (percent < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  // Get growth icon
  const getGrowthIcon = (percent: number) => {
    if (percent > 0) return <Icons.TrendingUp className="w-3 h-3" />;
    if (percent < 0) return <Icons.TrendingUp className="w-3 h-3 rotate-180" />;
    return <span className="w-3 h-3 flex items-center justify-center text-xs">—</span>;
  };

  if (loading) {
    return (
      <Widget
        title="Ingresos y Tendencias"
        icon={<Icons.Banknote className="h-5 w-5 text-gray-600 dark:text-gray-400" />}
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
        icon={<Icons.Banknote className="h-5 w-5 text-gray-600 dark:text-gray-400" />}
        className={className}
        error={error}
        onRetry={fetchData}
      >
        {/* Error content is handled by the Widget component */}
      </Widget>
    );
  }

  if (!data) {
    return (
      <Widget
        title="Ingresos y Tendencias"
        icon={<Icons.Banknote className="h-5 w-5 text-gray-600 dark:text-gray-400" />}
        className={className}
      >
        <WidgetEmpty
          title="Sin datos de ingresos"
          description="Los datos aparecerán cuando haya transacciones registradas"
          action={{
            label: 'Ver Facturación',
            href: '/billing',
          }}
          icon={<Icons.Banknote className="h-6 w-6 text-gray-400" />}
        />
      </Widget>
    );
  }

  const growthPercent = data.growth?.percentage || 0;
  const growthIcon = getGrowthIcon(growthPercent);

  return (
    <Widget
      title="Ingresos y Tendencias"
      icon={<Icons.Banknote className="h-5 w-5 text-gray-600 dark:text-gray-400" />}
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
            <div className={`flex items-center space-x-1 ${getGrowthColor(growthPercent)}`}>
              {growthIcon}
              <span className="font-medium">{Math.abs(growthPercent)}%</span>
            </div>
          </div>
        </div>

        {/* Sparkline Chart */}
        <div className="h-16 w-full">
          {data.dataPoints && data.dataPoints.length > 0 ? (
            <div className="w-full h-full flex items-center justify-center text-blue-500">
              <span className="text-xs">📈 Gráfico de tendencias</span>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <span className="text-xs">Sin datos suficientes</span>
            </div>
          )}
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
              {formatLargeNumber(
                data.dataPoints && data.dataPoints.length > 0 ? data.totalRevenue / data.dataPoints.length : 0
              )}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Promedio diario</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {data.dataPoints ? data.dataPoints.length : 0}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Días con datos</div>
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
