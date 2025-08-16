"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiClient, isAPIError } from '../../lib/api/client';
import { Icons } from '../../lib/icons/registry';

interface VisitData {
  date: string;
  visits: number;
}

interface VisitsByDayState {
  status: 'loading' | 'ready' | 'error';
  data: VisitData[];
  error?: string;
}

export function VisitsByDay() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<VisitsByDayState>({
    status: 'loading',
    data: [],
  });

  const fetchVisitsData = async () => {
    try {
      setState(prev => ({ ...prev, status: 'loading' }));

      // Get date range from URL parameters
      const from = searchParams.get('from');
      const to = searchParams.get('to');

      // For now, we'll generate mock data based on the date range
      // In a real implementation, you'd call an API endpoint like /api/kpi/visits-by-day
      const mockData = generateMockVisitsData(from, to);

      setState({
        status: 'ready',
        data: mockData,
      });
    } catch (error) {
      console.error('Error fetching visits data:', error);
      setState({
        status: 'error',
        data: [],
        error: error instanceof Error ? error.message : 'Failed to load visits data',
      });
    }
  };

  const generateMockVisitsData = (from?: string | null, to?: string | null): VisitData[] => {
    const endDate = to ? new Date(to) : new Date();
    const startDate = from ? new Date(from) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const data: VisitData[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      // Generate realistic mock data with some variation
      const dayOfWeek = currentDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const baseVisits = isWeekend ? 15 : 25;
      const variation = Math.floor(Math.random() * 10) - 5;
      const visits = Math.max(0, baseVisits + variation);

      data.push({
        date: currentDate.toISOString().split('T')[0],
        visits,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return data;
  };

  useEffect(() => {
    fetchVisitsData();
  }, [searchParams]);

  const maxVisits = Math.max(...state.data.map(d => d.visits), 1);

  if (state.status === 'loading') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Visitas por Día
          </h3>
          <Icons.Activity className="h-5 w-5 text-gray-400 animate-pulse" />
        </div>
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <Icons.Activity className="h-8 w-8 text-gray-400 mx-auto mb-2 animate-pulse" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Cargando datos...</p>
          </div>
        </div>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Visitas por Día
          </h3>
          <Icons.AlertCircle className="h-5 w-5 text-red-500" />
        </div>
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <Icons.AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-red-600 dark:text-red-400 mb-2">{state.error}</p>
            <button
              onClick={fetchVisitsData}
              className="text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-500"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Visitas por Día
        </h3>
        <Icons.Activity className="h-5 w-5 text-blue-500" />
      </div>

      {state.data.length === 0 ? (
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <Icons.Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No hay datos disponibles</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Simple bar chart */}
          <div className="flex items-end justify-between h-48 gap-1">
            {state.data.map((item, index) => {
              const height = (item.visits / maxVisits) * 100;
              const date = new Date(item.date);
              const dayName = date.toLocaleDateString('es-MX', { weekday: 'short' });
              const dayNumber = date.getDate();

              return (
                <div key={item.date} className="flex flex-col items-center flex-1 max-w-12">
                  <div className="flex-1 flex items-end w-full">
                    <div
                      className="w-full bg-blue-500 rounded-t-sm transition-all duration-300 hover:bg-blue-600 relative group"
                      style={{ height: `${height}%`, minHeight: '4px' }}
                    >
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {item.visits} visitas
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-center">
                    <div className="text-xs font-medium text-gray-900 dark:text-white">
                      {dayNumber}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {dayName}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary stats */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total: {state.data.reduce((sum, item) => sum + item.visits, 0)} visitas
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Promedio: {Math.round(state.data.reduce((sum, item) => sum + item.visits, 0) / state.data.length)} por día
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
