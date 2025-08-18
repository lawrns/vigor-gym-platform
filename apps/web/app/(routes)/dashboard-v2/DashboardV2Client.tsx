"use client";

import { useState } from 'react';

// Mock data for dashboard widgets
const mockData = {
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
 * Dashboard 2.0 Client Component - Simplified with Mocked Data
 *
 * This version uses static mock data to establish the layout and routing
 * without complex dependencies. Real data integration comes in later steps.
 */
export function DashboardV2Client() {
  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard 2.0
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Gym operations cockpit with real-time insights
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Active Visits Widget */}
        <div className="lg:col-span-4 bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h3 className="text-lg font-semibold mb-4">Visitas Activas</h3>
          <div className="text-3xl font-bold text-blue-600">
            {mockData.activeVisits.current}/{mockData.activeVisits.capacity}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {mockData.activeVisits.percentage}% de capacidad
          </div>
        </div>

        {/* Revenue Widget */}
        <div className="lg:col-span-4 bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h3 className="text-lg font-semibold mb-4">Ingresos Hoy</h3>
          <div className="text-3xl font-bold text-green-600">
            ${mockData.revenue.today.toLocaleString()}
          </div>
          <div className="text-sm text-green-500 mt-1">
            {mockData.revenue.trend} vs ayer
          </div>
        </div>

        {/* Expiring Memberships */}
        <div className="lg:col-span-4 bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h3 className="text-lg font-semibold mb-4">Membresías por Vencer</h3>
          <div className="space-y-2">
            {mockData.expiringMemberships.map((member, i) => (
              <div key={i} className="text-sm">
                <div className="font-medium">{member.name}</div>
                <div className="text-gray-500">{member.expires} - {member.plan}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Classes Today */}
        <div className="lg:col-span-12 bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h3 className="text-lg font-semibold mb-4">Clases de Hoy</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockData.classes.map((cls, i) => (
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
