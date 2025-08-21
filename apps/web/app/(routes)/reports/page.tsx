'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/lib/icons/registry';

interface ReportMetrics {
  totalMembers: number;
  activeMembers: number;
  monthlyRevenue: number;
  averageVisitsPerDay: number;
  memberRetentionRate: number;
  classUtilization: number;
  revenueGrowth: number;
  newMembersThisMonth: number;
}

interface MembershipData {
  plan: string;
  count: number;
  revenue: number;
  percentage: number;
}

interface ClassData {
  name: string;
  bookings: number;
  capacity: number;
  utilization: number;
  instructor: string;
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'revenue' | 'classes'>('overview');
  
  const [metrics, setMetrics] = useState<ReportMetrics>({
    totalMembers: 520,
    activeMembers: 485,
    monthlyRevenue: 1360000,
    averageVisitsPerDay: 127,
    memberRetentionRate: 93.2,
    classUtilization: 78.5,
    revenueGrowth: 8.5,
    newMembersThisMonth: 55,
  });

  const [membershipData, setMembershipData] = useState<MembershipData[]>([
    { plan: 'Básico Mensual', count: 180, revenue: 125000, percentage: 34.6 },
    { plan: 'Premium Mensual', count: 140, revenue: 280000, percentage: 26.9 },
    { plan: 'Premium Plus', count: 65, revenue: 195000, percentage: 12.5 },
    { plan: 'Básico Anual', count: 95, revenue: 340000, percentage: 18.3 },
    { plan: 'Premium Anual', count: 75, revenue: 420000, percentage: 14.4 },
  ]);

  const [classData, setClassData] = useState<ClassData[]>([
    { name: 'Spinning', bookings: 285, capacity: 300, utilization: 95.0, instructor: 'María González' },
    { name: 'Yoga', bookings: 245, capacity: 280, utilization: 87.5, instructor: 'Ana Martínez' },
    { name: 'CrossFit', bookings: 198, capacity: 220, utilization: 90.0, instructor: 'Carlos Rodríguez' },
    { name: 'Pilates', bookings: 165, capacity: 200, utilization: 82.5, instructor: 'Laura Sánchez' },
    { name: 'HIIT', bookings: 142, capacity: 180, utilization: 78.9, instructor: 'Diego López' },
    { name: 'Zumba', bookings: 128, capacity: 160, utilization: 80.0, instructor: 'Sofia Herrera' },
  ]);

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [selectedPeriod]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getUtilizationColor = (rate: number) => {
    if (rate >= 90) return 'text-red-600 bg-red-50';
    if (rate >= 75) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white">
            Reportes y Análisis
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Análisis detallados del rendimiento de tu gimnasio.
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Cargando reportes...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white">
          Reportes y Análisis
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Análisis detallados del rendimiento de tu gimnasio.
        </p>
      </div>

      {/* Period Selector and Export Actions */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex gap-2">
              {(['7d', '30d', '90d'] as const).map(period => (
                <Button
                  key={period}
                  variant={selectedPeriod === period ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPeriod(period)}
                >
                  {period === '7d' ? '7 días' : period === '30d' ? '30 días' : '90 días'}
                </Button>
              ))}
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Icons.Download className="h-4 w-4 mr-2" />
                Exportar PDF
              </Button>
              <Button variant="outline" size="sm">
                <Icons.FileText className="h-4 w-4 mr-2" />
                Exportar Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Resumen General', icon: 'BarChart3' },
              { id: 'members', label: 'Miembros', icon: 'Users' },
              { id: 'revenue', label: 'Ingresos', icon: 'DollarSign' },
              { id: 'classes', label: 'Clases', icon: 'Calendar' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Icons[tab.icon as keyof typeof Icons] className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <Icons.Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Miembros Activos</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.activeMembers}</p>
                    <p className="text-xs text-green-600 dark:text-green-400">+{metrics.newMembersThisMonth} este mes</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <Icons.DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ingresos Mensuales</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(metrics.monthlyRevenue)}</p>
                    <p className="text-xs text-green-600 dark:text-green-400">+{metrics.revenueGrowth}% vs mes anterior</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                    <Icons.Activity className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Retención</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.memberRetentionRate}%</p>
                    <p className="text-xs text-green-600 dark:text-green-400">+2% vs mes anterior</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                    <Icons.Calendar className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Visitas/Día</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.averageVisitsPerDay}</p>
                    <p className="text-xs text-green-600 dark:text-green-400">+15% vs mes anterior</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Resumen de Rendimiento
                </h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Utilización de Clases</span>
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${metrics.classUtilization}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{metrics.classUtilization}%</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Retención de Miembros</span>
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${metrics.memberRetentionRate}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{metrics.memberRetentionRate}%</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Crecimiento de Ingresos</span>
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full" 
                          style={{ width: `${(metrics.revenueGrowth / 20) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">+{metrics.revenueGrowth}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Enlaces Rápidos
                </h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <a
                    href="/admin/analytics"
                    className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Icons.BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Análisis Avanzado</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Métricas detalladas con IA</div>
                    </div>
                  </a>
                  
                  <a
                    href="/admin/observability"
                    className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Icons.Activity className="h-5 w-5 text-green-600 dark:text-green-400 mr-3" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Monitoreo del Sistema</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Observabilidad técnica</div>
                    </div>
                  </a>
                  
                  <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Icons.FileText className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-3" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Reportes Personalizados</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="inline-flex items-center px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 rounded text-xs">
                          Próximamente
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{metrics.totalMembers}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Miembros</div>
                <div className="text-xs text-green-600 dark:text-green-400 mt-1">+{metrics.newMembersThisMonth} este mes</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">{metrics.activeMembers}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Miembros Activos</div>
                <div className="text-xs text-green-600 dark:text-green-400 mt-1">{((metrics.activeMembers / metrics.totalMembers) * 100).toFixed(1)}% del total</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{metrics.memberRetentionRate}%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Retención</div>
                <div className="text-xs text-green-600 dark:text-green-400 mt-1">+2% vs mes anterior</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Distribución por Tipo de Membresía
              </h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {membershipData.map((membership, index) => (
                  <div key={membership.plan} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white">{membership.plan}</h4>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{membership.count} miembros</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2">
                      <div
                        className="bg-blue-600 h-3 rounded-full"
                        style={{ width: `${membership.percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{membership.percentage}% del total</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(membership.revenue)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Revenue Tab */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(metrics.monthlyRevenue)}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Ingresos Mensuales</div>
                <div className="text-xs text-green-600 dark:text-green-400 mt-1">+{metrics.revenueGrowth}% crecimiento</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(Math.round(metrics.monthlyRevenue / metrics.activeMembers))}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Promedio por Miembro</div>
                <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">Mensual</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{formatCurrency(metrics.monthlyRevenue * 12)}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Proyección Anual</div>
                <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">Estimado</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{formatCurrency(Math.round(metrics.monthlyRevenue / 30))}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Promedio Diario</div>
                <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">Últimos 30 días</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Análisis de Ingresos por Plan
              </h3>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Plan</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Miembros</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Ingresos</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Promedio/Miembro</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">% Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {membershipData.map((plan, index) => {
                      const avgPerMember = plan.revenue / plan.count;

                      return (
                        <tr key={plan.plan} className="border-b border-gray-100 dark:border-gray-800">
                          <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{plan.plan}</td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{plan.count}</td>
                          <td className="py-3 px-4 font-semibold text-green-600 dark:text-green-400">
                            {formatCurrency(plan.revenue)}
                          </td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                            {formatCurrency(avgPerMember)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${plan.percentage}%` }}
                                />
                              </div>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {plan.percentage.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Classes Tab */}
      {activeTab === 'classes' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{classData.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Tipos de Clases</div>
                <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">Activas</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">{metrics.classUtilization}%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Utilización Promedio</div>
                <div className="text-xs text-green-600 dark:text-green-400 mt-1">Todas las clases</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{classData.reduce((sum, c) => sum + c.bookings, 0)}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Reservas Totales</div>
                <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">Este mes</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Rendimiento por Clase
              </h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {classData.map((classItem, index) => (
                  <div key={classItem.name} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">{classItem.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Instructor: {classItem.instructor}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {classItem.bookings}/{classItem.capacity} reservas
                        </div>
                        <div className={`text-sm font-medium px-2 py-1 rounded ${getUtilizationColor(classItem.utilization)}`}>
                          {classItem.utilization.toFixed(1)}% utilización
                        </div>
                      </div>
                    </div>

                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${
                          classItem.utilization >= 90 ? 'bg-red-500' :
                          classItem.utilization >= 75 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${classItem.utilization}%` }}
                      />
                    </div>

                    <div className="flex justify-between mt-2 text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Capacidad disponible: {classItem.capacity - classItem.bookings}
                      </span>
                      <span className={`font-semibold ${
                        classItem.utilization >= 90 ? 'text-red-600 dark:text-red-400' :
                        classItem.utilization >= 75 ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-green-600 dark:text-green-400'
                      }`}>
                        {classItem.utilization >= 90 ? 'Sobrecargada' :
                         classItem.utilization >= 75 ? 'Alta demanda' : 'Disponible'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}
