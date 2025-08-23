'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Icons } from '../../../lib/icons/registry';
import { Widget, WidgetEmpty } from '../DashboardShell';
import { apiClient } from '../../../lib/api/client';
import { useSSE, SSEEvent } from '../../../lib/hooks/useSSE';
import { useOrgContext } from '../../../lib/auth/context';
import type { DashboardSummary } from '@gogym/shared';

interface ActiveVisitsWidgetProps {
  locationId?: string;
  className?: string;
}

/**
 * ActiveVisitsWidget - Shows current gym occupancy with capacity and utilization
 *
 * Features:
 * - Real-time active visits count
 * - Capacity limits and utilization percentage
 * - Visual capacity indicator
 * - Link to detailed visits view
 * - SSE updates for real-time data
 */
export function ActiveVisitsWidget({ locationId, className }: ActiveVisitsWidgetProps) {
  const { orgId, ready } = useOrgContext();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const announcementRef = useRef<HTMLDivElement>(null);

  // Fetch dashboard summary data
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const summary = await apiClient.dashboard.summary({
        locationId,
        range: '7d', // Not used for active visits but required for API
      });
      setData(summary);
    } catch (err) {
      console.error('Failed to fetch active visits:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [locationId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle SSE events for real-time updates
  const handleSSEEvent = useCallback(
    (event: SSEEvent) => {
      if (event.type === 'visit.checkin' || event.type === 'visit.checkout') {
        // Refresh data when visits change
        fetchData();
        setLastUpdate(new Date());

        // Announce to screen readers
        if (announcementRef.current) {
          const action = event.type === 'visit.checkin' ? 'checked in' : 'checked out';
          announcementRef.current.textContent = `Member ${action}. Active visits updated.`;
        }
      }
    },
    [fetchData]
  );

  // Auth gate: Don't render real-time features without tenant context
  if (!ready || !orgId) {
    return (
      <Widget size="sm" className={className} testId="kpi-active-now">
        <WidgetEmpty
          title="Autenticación requerida"
          description="Conéctate para ver visitas activas"
          icon={<Icons.Users className="h-6 w-6 text-gray-400" />}
        />
      </Widget>
    );
  }

  // SSE connection for real-time updates (temporarily disabled to fix infinite loop)
  // const sseState = useSSE({
  //   orgId: orgId,
  //   locationId,
  //   onEvent: handleSSEEvent,
  //   onConnectionChange: status => {
  //     console.log('[ActiveVisitsWidget] SSE status:', status);
  //   },
  //   maxRetries: 3,
  //   retryDelay: 2000,
  // });

  // Mock SSE state while disabled
  const sseState = { status: 'disconnected' as const };

  if (!data && !loading) {
    return (
      <Widget size="sm" className={className} testId="kpi-active-now" error={error}>
        <WidgetEmpty
          title="Sin datos de visitas"
          description="No se pudieron cargar los datos de visitas activas"
          action={{
            label: 'Reintentar',
            onClick: fetchData,
          }}
        />
      </Widget>
    );
  }

  const activeVisits = data?.activeVisits || 0;
  const capacityLimit = data?.capacityLimit || 0;
  const utilizationPercent = data?.utilizationPercent || 0;

  // Determine capacity status and color (as per plan requirements)
  const getCapacityStatus = (utilization: number) => {
    if (utilization > 100) return { status: 'critical', color: 'red' };
    if (utilization > 85) return { status: 'high', color: 'amber' };
    if (utilization > 60) return { status: 'moderate', color: 'blue' };
    return { status: 'low', color: 'green' };
  };

  const capacityStatus = getCapacityStatus(utilizationPercent);

  const actions = (
    <Link
      href="/dashboard/visits"
      className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
    >
      Ver flujo
    </Link>
  );

  return (
    <Widget
      size="sm"
      title="En el gimnasio ahora"
      actions={actions}
      loading={loading}
      error={error}
      className={className}
      testId="kpi-active-now"
    >
      <div className="space-y-4">
        {/* Main KPI */}
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {activeVisits.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {activeVisits === 1 ? 'persona activa' : 'personas activas'}
          </div>
        </div>

        {/* Capacity Indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Capacidad</span>
            <span
              className={`font-medium ${
                capacityStatus.color === 'red'
                  ? 'text-red-600 dark:text-red-400'
                  : capacityStatus.color === 'amber'
                    ? 'text-amber-600 dark:text-amber-400'
                    : capacityStatus.color === 'blue'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-green-600 dark:text-green-400'
              }`}
              data-testid="kpi-capacity-badge"
            >
              {utilizationPercent}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                capacityStatus.color === 'red'
                  ? 'bg-red-500'
                  : capacityStatus.color === 'amber'
                    ? 'bg-amber-500'
                    : capacityStatus.color === 'blue'
                      ? 'bg-blue-500'
                      : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
            />
          </div>

          {/* Capacity Details */}
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>
              {activeVisits} de {capacityLimit}
            </span>
            <span className="flex items-center">
              {capacityStatus.status === 'critical' && (
                <>
                  <Icons.AlertTriangle className="h-3 w-3 mr-1 text-red-500" />
                  Capacidad máxima
                </>
              )}
              {capacityStatus.status === 'high' && (
                <>
                  <Icons.AlertCircle className="h-3 w-3 mr-1 text-amber-500" />
                  Ocupación alta
                </>
              )}
              {capacityStatus.status === 'moderate' && (
                <>
                  <Icons.Users className="h-3 w-3 mr-1 text-blue-500" />
                  Ocupación normal
                </>
              )}
              {capacityStatus.status === 'low' && (
                <>
                  <Icons.CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                  Disponible
                </>
              )}
            </span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {capacityLimit - activeVisits}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Espacios libres</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {Math.round((activeVisits / Math.max(capacityLimit, 1)) * 100)}%
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Ocupación</div>
            </div>
          </div>
        </div>

        {/* Real-time Indicator */}
        <div className="flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center">
            <div
              className={`w-2 h-2 rounded-full mr-2 ${
                sseState.status === 'connected'
                  ? 'bg-green-400 animate-pulse'
                  : sseState.status === 'connecting'
                    ? 'bg-yellow-400 animate-pulse'
                    : 'bg-red-400'
              }`}
            />
            {sseState.status === 'connected' && 'Datos en tiempo real'}
            {sseState.status === 'connecting' && 'Conectando...'}
            {sseState.status === 'disconnected' && 'Desconectado'}
            {sseState.status === 'error' && 'Error de conexión'}
            {lastUpdate && (
              <span className="ml-2 text-gray-400">
                • Actualizado {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {/* Screen reader announcements */}
        <div ref={announcementRef} className="sr-only" aria-live="polite" aria-atomic="true" />

        {/* Critical capacity announcement */}
        {capacityStatus.status === 'critical' && (
          <div className="sr-only" aria-live="assertive" aria-atomic="true">
            Atención: El gimnasio está en capacidad máxima con {activeVisits} personas de{' '}
            {capacityLimit} permitidas.
          </div>
        )}
      </div>
    </Widget>
  );
}

/**
 * Compact version for smaller spaces
 */
export function ActiveVisitsCompact({ locationId, className }: ActiveVisitsWidgetProps) {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const summary = await apiClient.dashboard.summary({ locationId });
        setData(summary);
      } catch (err) {
        console.error('Failed to fetch active visits:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [locationId]);

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  const activeVisits = data?.activeVisits || 0;
  const utilizationPercent = data?.utilizationPercent || 0;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Activos ahora</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{activeVisits}</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600 dark:text-gray-400">Ocupación</div>
          <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
            {utilizationPercent}%
          </div>
        </div>
      </div>
    </div>
  );
}
