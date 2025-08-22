'use client';

import { useEffect, useState } from 'react';

export const dynamic = 'force-dynamic';
import { useAuth } from '../../../../lib/auth/context';
import { Card, CardContent, CardHeader } from '../../../../components/ui/card';
import { Icons } from '../../../../lib/icons/registry';

interface MetricsData {
  auth: {
    totalUsers: number;
    activeUsers: number;
    recentLogins: number;
    lockedUsers: number;
    timeframe: string;
  };
  billing: {
    activeSubscriptions: number;
    totalPaymentMethods: number;
    recentRevenue: number;
    successfulPayments: number;
    failedPayments: number;
    paymentSuccessRate: string;
    timeframe: string;
  };
  api: {
    webhooks: {
      total: number;
      processed: number;
      failed: number;
      successRate: string;
    };
    responseTime: {
      p50: number;
      p95: number;
      p99: number;
    };
    timeframe: string;
  };
  health: {
    status: string;
    uptime: number;
    memory: {
      used: number;
      total: number;
      external: number;
    };
    database: string;
    timestamp: string;
  };
}

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: keyof typeof Icons;
  description?: string;
  status?: 'good' | 'warning' | 'error';
}

function MetricCard({ title, value, icon, description, status = 'good' }: MetricCardProps) {
  const IconComponent = Icons[icon];

  const statusColors = {
    good: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    error: 'text-red-600 dark:text-red-400',
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <IconComponent className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
              <p className={`text-2xl font-bold ${statusColors[status]}`}>{value}</p>
            </div>
          </div>
        </div>
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function ObservabilityPage() {
  const { user, status: authStatus } = useAuth();
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authStatus === 'loading') return;

    if (!user || (user.role !== 'owner' && user.role !== 'manager')) {
      setError('Access denied. Only owners and managers can view observability metrics.');
      setLoading(false);
      return;
    }

    fetchMetrics();
  }, [user, authStatus]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all metrics in parallel
      const [authRes, billingRes, apiRes, healthRes] = await Promise.all([
        fetch('/api/v1/metrics/auth'),
        fetch('/api/v1/metrics/billing'),
        fetch('/api/v1/metrics/api'),
        fetch('/api/v1/metrics/health'),
      ]);

      if (!authRes.ok || !billingRes.ok || !apiRes.ok || !healthRes.ok) {
        throw new Error('Failed to fetch metrics');
      }

      const [auth, billing, api, health] = await Promise.all([
        authRes.json(),
        billingRes.json(),
        apiRes.json(),
        healthRes.json(),
      ]);

      setMetrics({ auth, billing, api, health });
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
    } finally {
      setLoading(false);
    }
  };

  if (authStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
            <Icons.Activity className="h-6 w-6 text-blue-600 dark:text-blue-400 animate-pulse" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Cargando métricas...
          </h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900 mb-4">
            <Icons.AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Error al cargar métricas
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchMetrics}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getHealthStatus = (status: string): 'good' | 'warning' | 'error' => {
    return status === 'healthy' ? 'good' : 'error';
  };

  const getSuccessRateStatus = (rate: string): 'good' | 'warning' | 'error' => {
    const numRate = parseFloat(rate);
    if (numRate >= 95) return 'good';
    if (numRate >= 90) return 'warning';
    return 'error';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Observabilidad</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Métricas del sistema y monitoreo en tiempo real
          </p>
          <button
            onClick={fetchMetrics}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Icons.TimerReset className="h-4 w-4" />
            Actualizar
          </button>
        </div>

        {/* System Health */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Estado del Sistema
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Estado"
              value={metrics.health.status}
              icon="Shield"
              status={getHealthStatus(metrics.health.status)}
            />
            <MetricCard
              title="Tiempo Activo"
              value={formatUptime(metrics.health.uptime)}
              icon="Clock3"
            />
            <MetricCard
              title="Memoria Usada"
              value={`${metrics.health.memory.used}MB`}
              icon="Building2"
              description={`de ${metrics.health.memory.total}MB total`}
            />
            <MetricCard
              title="Base de Datos"
              value={metrics.health.database}
              icon="FileDigit"
              status={metrics.health.database === 'connected' ? 'good' : 'error'}
            />
          </div>
        </section>

        {/* Authentication Metrics */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Autenticación ({metrics.auth.timeframe})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard title="Usuarios Totales" value={metrics.auth.totalUsers} icon="Users" />
            <MetricCard
              title="Usuarios Activos"
              value={metrics.auth.activeUsers}
              icon="CheckCircle"
            />
            <MetricCard
              title="Logins Recientes"
              value={metrics.auth.recentLogins}
              icon="ArrowLeft"
            />
            <MetricCard
              title="Usuarios Bloqueados"
              value={metrics.auth.lockedUsers}
              icon="AlertCircle"
              status={metrics.auth.lockedUsers > 0 ? 'warning' : 'good'}
            />
          </div>
        </section>

        {/* Billing Metrics */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Facturación ({metrics.billing.timeframe})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Suscripciones Activas"
              value={metrics.billing.activeSubscriptions}
              icon="CreditCard"
            />
            <MetricCard
              title="Métodos de Pago"
              value={metrics.billing.totalPaymentMethods}
              icon="Wallet"
            />
            <MetricCard
              title="Ingresos Recientes"
              value={`$${(metrics.billing.recentRevenue / 100).toLocaleString()}`}
              icon="Banknote"
            />
            <MetricCard
              title="Tasa de Éxito"
              value={`${metrics.billing.paymentSuccessRate}%`}
              icon="TrendingUp"
              status={getSuccessRateStatus(metrics.billing.paymentSuccessRate)}
            />
          </div>
        </section>

        {/* API Metrics */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            API y Webhooks ({metrics.api.timeframe})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Webhooks Totales"
              value={metrics.api.webhooks.total}
              icon="MessageSquare"
            />
            <MetricCard
              title="Tasa de Éxito Webhooks"
              value={`${metrics.api.webhooks.successRate}%`}
              icon="CheckCircle"
              status={getSuccessRateStatus(metrics.api.webhooks.successRate)}
            />
            <MetricCard
              title="Tiempo Respuesta P95"
              value={`${metrics.api.responseTime.p95}ms`}
              icon="Activity"
              status={metrics.api.responseTime.p95 < 500 ? 'good' : 'warning'}
            />
            <MetricCard
              title="Tiempo Respuesta P99"
              value={`${metrics.api.responseTime.p99}ms`}
              icon="TimerReset"
              status={metrics.api.responseTime.p99 < 1000 ? 'good' : 'warning'}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
