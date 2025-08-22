'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../../../lib/auth/context';
import { MemberInsights } from '../../../../../../lib/api/types';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '../../../../../../components/ui/card';
import { Icons } from '../../../../../../lib/icons/registry';

interface MemberInsightsState {
  status: 'loading' | 'ready' | 'error';
  insights?: MemberInsights;
  error?: string;
}

export default function MemberInsightsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, status: authStatus } = useAuth();
  const [state, setState] = useState<MemberInsightsState>({ status: 'loading' });

  const memberId = params.id as string;

  useEffect(() => {
    if (authStatus === 'loading') return;

    if (!user) {
      router.push('/login');
      return;
    }

    loadMemberInsights();
  }, [user, authStatus, router, memberId]);

  const loadMemberInsights = async () => {
    try {
      setState(prev => ({ ...prev, status: 'loading' }));

      const response = await fetch(`/api/v1/ai/member-insights/${memberId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to load member insights');
      }

      const result = await response.json();

      setState({
        status: 'ready',
        insights: result.insights,
      });
    } catch (error) {
      console.error('Error loading member insights:', error);
      setState({
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to load member insights',
      });
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'low':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'high':
        return <Icons.AlertCircle className="h-5 w-5" />;
      case 'medium':
        return <Icons.AlertCircle className="h-5 w-5" />;
      case 'low':
        return <Icons.CheckCircle className="h-5 w-5" />;
      default:
        return <Icons.Activity className="h-5 w-5" />;
    }
  };

  if (authStatus === 'loading' || state.status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
            <Icons.Activity className="h-6 w-6 text-blue-600 dark:text-blue-400 animate-pulse" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Analizando insights del miembro...
          </h2>
        </div>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900 mb-4">
            <Icons.AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Error al cargar insights
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{state.error}</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={loadMemberInsights}>Reintentar</Button>
            <Button onClick={() => router.back()} variant="outline">
              Volver
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const insights = state.insights!;
  const churn = insights.churnPrediction;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="mb-4">
            <Icons.ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Insights con IA - {insights.member.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {insights.member.email} • Estado: {insights.member.status}
              </p>
            </div>
            <Button onClick={loadMemberInsights} variant="outline" size="sm">
              <Icons.Activity className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Churn Risk Alert */}
        <div className={`border rounded-lg p-6 mb-6 ${getRiskColor(churn.churnRisk)}`}>
          <div className="flex items-center gap-4">
            {getRiskIcon(churn.churnRisk)}
            <div className="flex-1">
              <h2 className="text-lg font-semibold mb-1">
                Riesgo de Cancelación:{' '}
                {churn.churnRisk === 'high'
                  ? 'Alto'
                  : churn.churnRisk === 'medium'
                    ? 'Medio'
                    : 'Bajo'}
              </h2>
              <p className="text-sm opacity-90">
                Probabilidad: {(churn.churnProbability * 100).toFixed(1)}% • Próxima acción
                predicha: {churn.nextPredictedAction}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{(churn.churnProbability * 100).toFixed(0)}%</div>
              <div className="text-sm opacity-75">Probabilidad</div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Actividad Reciente
              </h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Visitas este mes:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {insights.engagement.visitsThisMonth}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Última visita:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {insights.engagement.daysSinceLastVisit !== null
                      ? `${insights.engagement.daysSinceLastVisit} días`
                      : 'Nunca'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Miembro desde:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {insights.engagement.membershipDuration} días
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Factores de Riesgo
              </h3>
            </CardHeader>
            <CardContent>
              {churn.riskFactors.length > 0 ? (
                <div className="space-y-2">
                  {churn.riskFactors.map((factor, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Icons.AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{factor}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-green-600">
                  <Icons.CheckCircle className="h-4 w-4" />
                  <span className="text-sm">Sin factores de riesgo identificados</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Último Escaneo Corporal
              </h3>
            </CardHeader>
            <CardContent>
              {insights.lastBodyScan ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">BMI:</span>
                    <span className="font-semibold">{insights.lastBodyScan.bmi}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Grasa corporal:</span>
                    <span className="font-semibold">
                      {insights.lastBodyScan.bodyFatPercentage}%
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-2"
                    onClick={() => router.push(`/admin/members/${memberId}/body-scan`)}
                  >
                    Nuevo Escaneo
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <Icons.CameraIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 mb-3">No hay escaneos corporales</p>
                  <Button
                    size="sm"
                    onClick={() => router.push(`/admin/members/${memberId}/body-scan`)}
                  >
                    Realizar Escaneo
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recomendaciones de Retención
            </h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.recommendations.map((recommendation, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                >
                  <Icons.CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-blue-900 dark:text-blue-100 text-sm">{recommendation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/members/${memberId}/billing`)}
          >
            Ver Facturación
          </Button>
          <Button onClick={() => router.push(`/admin/members/${memberId}/body-scan`)}>
            <Icons.CameraIcon className="h-4 w-4 mr-2" />
            Escaneo Corporal
          </Button>
        </div>
      </div>
    </div>
  );
}
