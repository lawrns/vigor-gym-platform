"use client";
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Widget } from './DashboardShell';
import { Icons } from '../../lib/icons/registry';

interface RevenueData {
  date: string;
  revenue: number;
  formattedDate: string;
}

interface RevenueTrendProps {
  className?: string;
}

export function RevenueTrend({ className }: RevenueTrendProps = {}) {
  const [data, setData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();

  useEffect(() => {
    // Generate sample revenue data for the last 30 days
    const generateSampleData = () => {
      const data: RevenueData[] = [];
      const today = new Date();

      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        // Generate realistic revenue data with some variation
        const baseRevenue = 2500;
        const variation = Math.random() * 1000 - 500; // ±500
        const weekendMultiplier = date.getDay() === 0 || date.getDay() === 6 ? 1.3 : 1; // Higher on weekends

        data.push({
          date: date.toISOString().split('T')[0],
          revenue: Math.max(0, Math.round((baseRevenue + variation) * weekendMultiplier)),
          formattedDate: date.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })
        });
      }

      return data;
    };

    // Simulate API call
    setTimeout(() => {
      setData(generateSampleData());
      setLoading(false);
    }, 500);
  }, [searchParams]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const averageRevenue = data.length > 0 ? Math.round(totalRevenue / data.length) : 0;

  return (
    <Widget
      title="Tendencia de Ingresos"
      icon={<Icons.TrendingUp className="h-5 w-5 text-gray-600 dark:text-gray-400" />}
      className={className}
      action={{
        label: 'Ver Detalles',
        href: '/billing/analytics',
      }}
    >
      <div className="space-y-4">
        {/* Revenue Summary */}
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(totalRevenue)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Total últimos 30 días
          </div>
        </div>

        {loading ? (
          <div className="h-48 flex items-center justify-center">
            <div className="text-sm text-gray-500">Cargando datos...</div>
          </div>
        ) : data.length === 0 ? (
          <div className="h-48 flex items-center justify-center">
            <div className="text-sm text-gray-500">Sin datos disponibles</div>
          </div>
        ) : (
          <>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <XAxis
                    dataKey="formattedDate"
                    tick={{ fontSize: 10 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), 'Ingresos']}
                    labelFormatter={(label) => `Fecha: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, stroke: '#2563eb', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
              <span>Promedio: {formatCurrency(averageRevenue)}/día</span>
              <span>30 días</span>
            </div>
          </>
        )}
      </div>
    </Widget>
  );
}
