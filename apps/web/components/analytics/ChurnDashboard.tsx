'use client';

import React, { useState, useEffect } from 'react';
import { Icons } from '../../lib/icons/registry';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '../ui/card';

interface ChurnAnalytics {
  totalMembers: number;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  averageChurnProbability: number;
  riskFactors: Record<string, number>;
}

interface ChurnDashboardState {
  status: 'loading' | 'ready' | 'error';
  analytics?: ChurnAnalytics;
  error?: string;
}

export function ChurnDashboard() {
  const [state, setState] = useState<ChurnDashboardState>({ status: 'loading' });

  useEffect(() => {
    loadChurnAnalytics();
  }, []);

  const loadChurnAnalytics = async () => {
    try {
      setState(prev => ({ ...prev, status: 'loading' }));

      const response = await fetch('/api/v1/ai/analytics/churn-overview', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to load churn analytics');
      }

      const result = await response.json();

      setState({
        status: 'ready',
        analytics: result.analytics,
      });
    } catch (error) {
      console.error('Error loading churn analytics:', error);
      setState({
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to load churn analytics',
      });
    }
  };

  const getRiskColor = (risk: 'high' | 'medium' | 'low') => {
    switch (risk) {
      case 'high':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'low':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20';
    }
  };

  const getRiskIcon = (risk: 'high' | 'medium' | 'low') => {
    switch (risk) {
      case 'high':
        return <Icons.AlertCircle className="h-5 w-5" />;
      case 'medium':
        return <Icons.AlertCircle className="h-5 w-5" />;
      case 'low':
        return <Icons.CheckCircle className="h-5 w-5" />;
    }
  };

  if (state.status === 'loading') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Análisis de Retención
          </h2>
          <Icons.Activity className="h-6 w-6 text-blue-500 animate-pulse" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Análisis de Retención
          </h2>
          <Icons.AlertCircle className="h-6 w-6 text-red-500" />
        </div>

        <Card>
          <CardContent className="p-6 text-center">
            <Icons.AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Error al cargar análisis
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{state.error}</p>
            <Button onClick={loadChurnAnalytics}>Reintentar</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const analytics = state.analytics!;
  const totalAtRisk = analytics.highRisk + analytics.mediumRisk;
  const retentionRate =
    ((analytics.totalMembers - analytics.highRisk) / analytics.totalMembers) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Análisis de Retención con IA
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Predicción de riesgo de cancelación basada en machine learning
          </p>
        </div>
        <Button onClick={loadChurnAnalytics} variant="outline" size="sm">
          <Icons.Activity className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total de Miembros
            </h3>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {analytics.totalMembers.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Tasa de Retención
            </h3>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{retentionRate.toFixed(1)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">En Riesgo</h3>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalAtRisk}</div>
            <div className="text-sm text-gray-500">
              {((totalAtRisk / analytics.totalMembers) * 100).toFixed(1)}% del total
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Probabilidad Promedio
            </h3>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {(analytics.averageChurnProbability * 100).toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Distribución de Riesgo
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { level: 'high' as const, count: analytics.highRisk, label: 'Alto Riesgo' },
                { level: 'medium' as const, count: analytics.mediumRisk, label: 'Riesgo Medio' },
                { level: 'low' as const, count: analytics.lowRisk, label: 'Bajo Riesgo' },
              ].map(({ level, count, label }) => {
                const percentage = (count / analytics.totalMembers) * 100;
                return (
                  <div key={level} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${getRiskColor(level)}`}>
                        {getRiskIcon(level)}
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">{label}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900 dark:text-white">{count}</div>
                      <div className="text-sm text-gray-500">{percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Risk Factors */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Principales Factores de Riesgo
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analytics.riskFactors)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([factor, count]) => (
                  <div key={factor} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{factor}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(count / analytics.totalMembers) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white w-8">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Items */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Acciones Recomendadas
          </h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icons.AlertCircle className="h-5 w-5 text-red-600" />
                <span className="font-medium text-red-900 dark:text-red-100">Urgente</span>
              </div>
              <p className="text-sm text-red-800 dark:text-red-200">
                {analytics.highRisk} miembros requieren atención inmediata
              </p>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icons.AlertCircle className="h-5 w-5 text-yellow-600" />
                <span className="font-medium text-yellow-900 dark:text-yellow-100">
                  Seguimiento
                </span>
              </div>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                {analytics.mediumRisk} miembros necesitan engagement
              </p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icons.CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-900 dark:text-green-100">Estables</span>
              </div>
              <p className="text-sm text-green-800 dark:text-green-200">
                {analytics.lowRisk} miembros en buen estado
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
