'use client';

import { useState } from 'react';
import { useAuth } from '../../../../lib/auth/context';
import { ChurnDashboard } from '../../../../components/analytics/ChurnDashboard';
import { VisitsByDay } from '../../../../components/dashboard/VisitsByDay';
import { Button } from '@/components/ui/Button';
import { Icons } from '../../../../lib/icons/registry';

type AnalyticsTab = 'overview' | 'churn' | 'revenue' | 'engagement';

export default function AnalyticsPage() {
  const { user, status } = useAuth();
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview');

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
            <Icons.Activity className="h-6 w-6 text-blue-600 dark:text-blue-400 animate-pulse" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Cargando analytics...
          </h2>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900 mb-4">
            <Icons.AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Acceso denegado
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Necesitas iniciar sesión para ver los analytics.
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview' as const, label: 'Resumen', icon: Icons.Activity },
    { id: 'churn' as const, label: 'Retención IA', icon: Icons.AlertCircle },
    { id: 'revenue' as const, label: 'Ingresos', icon: Icons.CreditCard },
    { id: 'engagement' as const, label: 'Engagement', icon: Icons.Users },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Analytics Avanzados
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Insights impulsados por inteligencia artificial para optimizar tu gimnasio
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors
                    ${
                      isActive
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <VisitsByDay />

                {/* Quick Stats */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Métricas Rápidas
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Miembros Activos</span>
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">247</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Visitas Hoy</span>
                      <span className="text-2xl font-bold text-blue-600">32</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Ingresos del Mes</span>
                      <span className="text-2xl font-bold text-green-600">$45,230</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Tasa de Retención</span>
                      <span className="text-2xl font-bold text-green-600">94.2%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Insights Preview */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      🤖 Insights con IA Disponibles
                    </h3>
                    <p className="text-blue-800 dark:text-blue-200">
                      Descubre patrones de retención, predice cancelaciones y optimiza el engagement
                      de tus miembros.
                    </p>
                  </div>
                  <Button
                    onClick={() => setActiveTab('churn')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Ver Análisis IA
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'churn' && <ChurnDashboard />}

          {activeTab === 'revenue' && (
            <div className="text-center py-12">
              <Icons.CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Analytics de Ingresos
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Próximamente: Análisis detallado de ingresos, proyecciones y tendencias.
              </p>
              <Button variant="outline">Solicitar Acceso Anticipado</Button>
            </div>
          )}

          {activeTab === 'engagement' && (
            <div className="text-center py-12">
              <Icons.Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Analytics de Engagement
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Próximamente: Métricas de participación, uso de clases y patrones de actividad.
              </p>
              <Button variant="outline">Solicitar Acceso Anticipado</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
