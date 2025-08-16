"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiClient, isAPIError } from '../../lib/api/client';
import type { KPIOverview } from '../../lib/api/types';
import { Icons } from '../../lib/icons/registry';
import { useAuth } from '../../lib/auth/context';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: keyof typeof Icons;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

function KpiCard({ title, value, icon, description, trend }: KpiCardProps) {
  const IconComponent = Icons[icon];
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <IconComponent className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          </div>
        </div>
        {trend && (
          <div className={`flex items-center space-x-1 text-sm ${
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            <Icons.TrendingUp className={`h-4 w-4 ${trend.isPositive ? '' : 'rotate-180'}`} />
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{description}</p>
      )}
    </div>
  );
}

function KpiSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm animate-pulse">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg">
          <div className="h-6 w-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    </div>
  );
}

function ErrorState({ onRetry, error }: { onRetry: () => void; error: string }) {
  const isNetworkError = error.includes('Network request failed') || error.includes('fetch');
  const isAuthError = error.includes('Authentication required') || error.includes('401');

  return (
    <div className="col-span-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
      <div className="flex items-center space-x-3">
        <Icons.Activity className="h-6 w-6 text-red-600 dark:text-red-400" />
        <div>
          <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
            Error al cargar los KPIs
          </h3>
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">
            {isNetworkError
              ? 'No se puede conectar con el servidor. Verifica que el API esté ejecutándose.'
              : isAuthError
              ? 'Sesión expirada. Por favor, inicia sesión nuevamente.'
              : 'No se pudieron cargar los datos del dashboard. Verifica tu conexión.'
            }
          </p>
          <button
            onClick={onRetry}
            className="mt-3 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300"
          >
            Intentar de nuevo
          </button>
        </div>
      </div>
    </div>
  );
}

export function KpiCards() {
  const { user, status } = useAuth();
  const searchParams = useSearchParams();
  const [state, setState] = useState<{
    status: 'loading' | 'guest' | 'ready' | 'error';
    data?: KPIOverview;
    error?: string;
  }>({ status: 'loading' });

  const fetchKpiData = async () => {
    try {
      setState({ status: 'loading' });

      // Get date range and comparison parameters from URL
      const from = searchParams.get('from') ?? undefined;
      const to = searchParams.get('to') ?? undefined;
      const compareFrom = searchParams.get('compareFrom') ?? undefined;
      const compareTo = searchParams.get('compareTo') ?? undefined;

      const kpiParams: any = {};
      if (from) kpiParams.from = from;
      if (to) kpiParams.to = to;
      if (compareFrom) kpiParams.compareFrom = compareFrom;
      if (compareTo) kpiParams.compareTo = compareTo;

      const response = await apiClient.kpi.overview(kpiParams);

      if (isAPIError(response)) {
        // Handle guest 401s silently
        if ('status' in response && response.status === 401) {
          setState({ status: 'guest' });
          return;
        }
        throw new Error(response.message);
      }

      setState({ status: 'ready', data: response });

      // Track dashboard view
      if (typeof window !== 'undefined') {
        import('posthog-js').then(({ default: posthog }) => {
          posthog.capture('dashboard.view', {
            activeMembers: response.activeMembers,
            gyms: response.gyms,
            wellnessProviders: response.wellnessProviders,
            dateRange: { from, to },
            hasComparison: !!(compareFrom && compareTo)
          });
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';

      // Check if it's an authentication error
      if (errorMessage.includes('Authentication required') || errorMessage.includes('401')) {
        setState({ status: 'guest' });
        // Don't log auth errors for guests - they're expected
        console.debug('[KPI] Guest auth check (expected 401)');
      } else {
        console.error('Failed to fetch KPI data:', err);
        setState({ status: 'error', error: errorMessage });
      }
    }
  };

  useEffect(() => {
    // Only fetch KPI data when user is authenticated
    if (status === 'authenticated' && user) {
      fetchKpiData();
    } else if (status === 'guest') {
      // Set guest state immediately for guests
      setState({ status: 'guest' });
    }
  }, [status, user, searchParams]);

  // Show loading state
  if (state.status === 'loading') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <KpiSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Show login CTA for guest users
  if (state.status === 'guest') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="col-span-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-center">
          <div className="text-blue-600 dark:text-blue-400 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">
            Inicia sesión para ver las métricas
          </h3>
          <p className="text-blue-700 dark:text-blue-300 mb-4">
            Necesitas estar autenticado para acceder a los datos del dashboard.
          </p>
          <a
            href="/login"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Iniciar Sesión
          </a>
        </div>
      </div>
    );
  }

  // Show error state
  if (state.status === 'error') {
    return <ErrorState onRetry={fetchKpiData} error={state.error || 'Unknown error'} />;
  }

  // Show data
  const kpiData = state.data;
  if (!kpiData) return null;

  // Helper function to calculate trend from changes
  const getTrend = (delta?: { delta: number; pct: number }) => {
    if (!delta) return undefined;
    return {
      value: Number(delta.pct.toFixed(1)),
      isPositive: delta.delta >= 0
    };
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <KpiCard
        title="Miembros Activos"
        value={(kpiData.activeMembers || 0).toLocaleString()}
        icon="Users"
        description="Usuarios con membresías activas"
        trend={getTrend(kpiData.changes?.activeMembers)}
      />
      <KpiCard
        title="Ingresos Mensuales"
        value={`$${(kpiData.monthlyRevenue || 0).toLocaleString()}`}
        icon="Wallet"
        description="Ingresos de membresías activas"
        trend={getTrend(kpiData.changes?.monthlyRevenue)}
      />
      <KpiCard
        title="Visitas Totales"
        value={(kpiData.totalVisits || 0).toLocaleString()}
        icon="Activity"
        description="Total de visitas registradas"
        trend={getTrend(kpiData.changes?.totalVisits)}
      />
      <KpiCard
        title="Tiempo Promedio"
        value={`${(kpiData.avgActivationHours || 0).toFixed(1)}h`}
        icon="Clock3"
        description="Duración promedio de visitas"
        trend={getTrend(kpiData.changes?.avgActivationHours)}
      />
    </div>
  );
}
