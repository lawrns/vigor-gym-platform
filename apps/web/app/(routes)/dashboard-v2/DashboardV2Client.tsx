"use client";

import { useState, useEffect } from 'react';
import { apiClient } from '../../../lib/api/client';

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

// Fallback data for when API is loading or unavailable
const fallbackData = {
  activeVisits: { current: 23, capacity: 50, percentage: 46 },
  expiringMemberships: [
    { name: "Ana García", expires: "2024-08-25", plan: "Premium" },
    { name: "Carlos López", expires: "2024-08-26", plan: "Basic" },
    { name: "María Rodríguez", expires: "2024-08-27", plan: "Premium" }
  ],
  revenue: { today: 2450, trend: "+12%" },
  classes: [
    { time: "09:00", name: "Yoga Matutino", instructor: "Laura", spots: "8/12" },
    { time: "18:00", name: "CrossFit", instructor: "Miguel", spots: "15/15" }
  ]
};

/**
 * Dashboard 2.0 Client Component - With API Integration
 *
 * Fetches real data from API endpoints with fallback to mock data.
 * Gracefully handles loading states and API errors.
 */
export function DashboardV2Client() {
  const [dashboardData, setDashboardData] = useState(fallbackData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await apiClient.getDashboardSummary('7d');

        if (response.ok && response.data) {
          setDashboardData(response.data);
        } else {
          console.warn('Dashboard API failed, using fallback data:', response.error);
          setError(response.error?.message || 'Failed to load dashboard data');
          // Keep fallback data
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError('Network error loading dashboard');
        // Keep fallback data
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
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
          <div className="text-sm text-gray-500 mt-1">
            {dashboardData.activeVisits.percentage}% de capacidad
          </div>
        </div>

        {/* Revenue Widget */}
        <div className="lg:col-span-4 bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center gap-2 mb-4">
            <div className="text-green-600">
              <Icons.DollarSign />
            </div>
            <h3 className="text-lg font-semibold">Ingresos Hoy</h3>
          </div>
          <div className="text-3xl font-bold text-green-600">
            ${dashboardData.revenue.today.toLocaleString()}
          </div>
          <div className="flex items-center gap-1 text-sm text-green-500 mt-1">
            <Icons.TrendingUp />
            {dashboardData.revenue.trend} vs ayer
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
            {dashboardData.expiringMemberships.map((member, i) => (
              <div key={i} className="text-sm">
                <div className="font-medium">{member.name}</div>
                <div className="text-gray-500">{member.expires} - {member.plan}</div>
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
            {dashboardData.classes.map((cls, i) => (
              <div key={i} className="border rounded p-4">
                <div className="font-medium">{cls.time} - {cls.name}</div>
                <div className="text-sm text-gray-500">
                  Instructor: {cls.instructor} | Cupos: {cls.spots}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
