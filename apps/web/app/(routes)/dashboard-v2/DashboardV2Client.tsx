"use client";

import { useState, useEffect } from 'react';
import { dashboardDataService, type DashboardMetrics } from '../../../lib/dashboard/data-service';
import { RevenueSparkline } from '../../../components/charts/RevenueSparkline';

// Simple inline SVG icons to avoid import complexity
const Icons = {
  Users: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  DollarSign: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
    </svg>
  ),
  TrendingUp: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  Clock: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Calendar: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
};

// Fallback data for when data service is unavailable
const fallbackData: DashboardMetrics = {
  activeVisits: { current: 23, capacity: 50, percentage: 46, trend: '+8%' },
  revenue: {
    today: 2450,
    yesterday: 2200,
    trend: '+12%',
    percentage: 12,
    sparklineData: [2100, 2200, 2150, 2300, 2250, 2200, 2450],
    weekTotal: 15650
  },
  memberships: {
    total: 150,
    active: 142,
    expiring: [
      { id: '1', memberName: "Ana García", expiresAt: "2024-08-25", planName: "Premium", daysLeft: 3 },
      { id: '2', memberName: "Carlos López", expiresAt: "2024-08-26", planName: "Basic", daysLeft: 4 },
      { id: '3', memberName: "María Rodríguez", expiresAt: "2024-08-27", planName: "Premium", daysLeft: 5 }
    ]
  },
  classes: {
    today: [
      { id: '1', time: "09:00", name: "Yoga Matutino", instructor: "Laura", capacity: 12, booked: 8, spotsLeft: 4 },
      { id: '2', time: "18:00", name: "CrossFit", instructor: "Miguel", capacity: 15, booked: 15, spotsLeft: 0 }
    ],
    upcoming: 3
  }
};

/**
 * Dashboard 2.0 Client Component - With API Integration
 *
 * Fetches real data from API endpoints with fallback to mock data.
 * Gracefully handles loading states and API errors.
 */
export function DashboardV2Client() {
  const [dashboardData, setDashboardData] = useState<DashboardMetrics>(fallbackData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setIsLoading(true);
        setError(null);

        const metrics = await dashboardDataService.getAllMetrics();
        setDashboardData(metrics);

      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError('Failed to load live data');
        // Keep fallback data
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();

    // Refresh data every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard 2.0
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Gym operations cockpit with real-time insights
          {isLoading && <span className="ml-2 text-blue-500">⟳ Loading...</span>}
          {error && <span className="ml-2 text-orange-500">⚠ Using cached data</span>}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Active Visits Widget */}
        <div className="lg:col-span-4 bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center gap-2 mb-4">
            <div className="text-blue-600">
              <Icons.Users />
            </div>
            <h3 className="text-lg font-semibold">Visitas Activas</h3>
          </div>
          <div className="text-3xl font-bold text-blue-600">
            {dashboardData.activeVisits.current}/{dashboardData.activeVisits.capacity}
          </div>
          <div className="flex items-center gap-2 text-sm mt-1">
            <span className="text-gray-500">{dashboardData.activeVisits.percentage}% de capacidad</span>
            <span className="text-green-500 text-xs">{dashboardData.activeVisits.trend}</span>
          </div>
        </div>

        {/* Revenue Widget */}
        <div className="lg:col-span-4 bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="text-green-600">
                <Icons.DollarSign />
              </div>
              <h3 className="text-lg font-semibold">Ingresos Hoy</h3>
            </div>
            <RevenueSparkline
              data={dashboardData.revenue.sparklineData}
              width={80}
              height={30}
              className="opacity-75"
            />
          </div>
          <div className="text-3xl font-bold text-green-600">
            ${dashboardData.revenue.today.toLocaleString()}
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1 text-sm text-green-500">
              <Icons.TrendingUp />
              {dashboardData.revenue.trend} vs ayer
            </div>
            <div className="text-xs text-gray-500">
              Semana: ${dashboardData.revenue.weekTotal.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Expiring Memberships */}
        <div className="lg:col-span-4 bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center gap-2 mb-4">
            <div className="text-orange-600">
              <Icons.Clock />
            </div>
            <h3 className="text-lg font-semibold">Membresías por Vencer</h3>
          </div>
          <div className="space-y-2">
            {dashboardData.memberships.expiring.map((member) => (
              <div key={member.id} className="text-sm">
                <div className="font-medium">{member.memberName}</div>
                <div className="text-gray-500">
                  {member.expiresAt} - {member.planName}
                  <span className="ml-2 text-orange-500">({member.daysLeft} días)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Classes Today */}
        <div className="lg:col-span-12 bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center gap-2 mb-4">
            <div className="text-purple-600">
              <Icons.Calendar />
            </div>
            <h3 className="text-lg font-semibold">Clases de Hoy</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dashboardData.classes.today.map((cls) => (
              <div key={cls.id} className="border rounded p-4">
                <div className="font-medium">{cls.time} - {cls.name}</div>
                <div className="text-sm text-gray-500">
                  Instructor: {cls.instructor}
                </div>
                <div className="text-sm mt-1">
                  <span className="text-blue-600">{cls.booked}/{cls.capacity} reservados</span>
                  {cls.spotsLeft > 0 ? (
                    <span className="ml-2 text-green-600">({cls.spotsLeft} disponibles)</span>
                  ) : (
                    <span className="ml-2 text-red-600">(Lleno)</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
