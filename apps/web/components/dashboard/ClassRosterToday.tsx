/**
 * Class Roster Today Widget
 *
 * Displays today's scheduled classes with timeline, occupancy, and attendance tracking
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Icons } from '../../lib/icons/registry';
import { Widget, WidgetEmpty } from './DashboardShell';
import { api } from '../../lib/api/client';

interface ClassItem {
  id: string;
  name: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
  capacity: number;
  booked: number;
  attended: number;
  noShows: number;
  pending: number;
  utilizationPercent: number;
  gym: {
    id: string;
    name: string;
  };
  trainer: {
    id: string;
    name: string;
  } | null;
  bookings: Array<{
    id: string;
    member: {
      id: string;
      name: string;
    };
    attended: boolean | null;
    bookedAt: string;
  }>;
  status: 'upcoming' | 'in-progress' | 'completed';
}

interface ClassRosterData {
  classes: ClassItem[];
  date: string;
  locationId: string | null;
  total: number;
  summary: {
    totalCapacity: number;
    totalBooked: number;
    totalAttended: number;
    averageUtilization: number;
  };
}

interface ClassRosterTodayProps {
  locationId?: string | null;
  className?: string;
}

export function ClassRosterToday({ locationId, className }: ClassRosterTodayProps) {
  const [data, setData] = useState<ClassRosterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (locationId) {
        params.set('locationId', locationId);
      }

      const result = await api.get<ClassRosterData>(`/api/classes/today?${params}`);
      setData(result);
    } catch (err) {
      console.error('Error fetching class roster:', err);
      setError(err instanceof Error ? err.message : 'Failed to load class roster');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [locationId]);

  // Format time for display
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  // Get status color and icon
  const getStatusDisplay = (status: ClassItem['status']) => {
    switch (status) {
      case 'upcoming':
        return {
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-100 dark:bg-blue-900',
          icon: Icons.Clock3,
          label: 'Próxima',
        };
      case 'in-progress':
        return {
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-100 dark:bg-green-900',
          icon: Icons.Play,
          label: 'En curso',
        };
      case 'completed':
        return {
          color: 'text-gray-600 dark:text-gray-400',
          bgColor: 'bg-gray-100 dark:bg-gray-900',
          icon: Icons.Check,
          label: 'Completada',
        };
    }
  };

  // Get utilization color
  const getUtilizationColor = (percent: number) => {
    if (percent >= 90) return 'text-red-600 dark:text-red-400';
    if (percent >= 75) return 'text-amber-600 dark:text-amber-400';
    if (percent >= 50) return 'text-blue-600 dark:text-blue-400';
    return 'text-green-600 dark:text-green-400';
  };

  if (loading) {
    return (
      <Widget title="Clases de Hoy" icon={Icons.Calendar} className={className} loading={true}>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Widget>
    );
  }

  if (error) {
    return (
      <Widget
        title="Clases de Hoy"
        icon={Icons.Calendar}
        className={className}
        error={error}
        onRetry={fetchData}
      />
    );
  }

  if (!data || data.classes.length === 0) {
    return (
      <WidgetEmpty
        title="Clases de Hoy"
        icon={Icons.Calendar}
        className={className}
        message="No hay clases programadas para hoy"
        description="Las clases aparecerán aquí cuando estén programadas"
        action={{
          label: 'Programar Clase',
          href: '/classes/new',
        }}
      />
    );
  }

  return (
    <Widget
      title="Clases de Hoy"
      icon={Icons.Calendar}
      className={className}
      action={{
        label: 'Ver Todas',
        href: '/classes',
      }}
    >
      <div className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {data.summary.totalBooked}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Reservas</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {data.summary.totalCapacity}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Capacidad</div>
          </div>
          <div className="text-center">
            <div
              className={`text-lg font-semibold ${getUtilizationColor(data.summary.averageUtilization)}`}
            >
              {data.summary.averageUtilization}%
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Ocupación</div>
          </div>
        </div>

        {/* Classes Timeline */}
        <div className="space-y-3">
          {data.classes.map(classItem => {
            const statusDisplay = getStatusDisplay(classItem.status);
            const StatusIcon = statusDisplay.icon;

            return (
              <div
                key={classItem.id}
                className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {/* Time & Status */}
                <div className="flex-shrink-0 text-center">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatTime(classItem.startsAt)}
                  </div>
                  <div
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusDisplay.bgColor} ${statusDisplay.color} mt-1`}
                  >
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {statusDisplay.label}
                  </div>
                </div>

                {/* Class Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {classItem.name}
                    </h4>
                    <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                      <Icons.Users className="w-3 h-3" />
                      <span>
                        {classItem.booked}/{classItem.capacity}
                      </span>
                      <span className={getUtilizationColor(classItem.utilizationPercent)}>
                        ({classItem.utilizationPercent}%)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-1">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {classItem.trainer ? (
                        <span className="flex items-center">
                          <Icons.User className="w-3 h-3 mr-1" />
                          {classItem.trainer.name}
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <Icons.AlertTriangle className="w-3 h-3 mr-1" />
                          Sin instructor asignado
                        </span>
                      )}
                    </div>

                    {classItem.gym && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        <Icons.MapPin className="w-3 h-3 inline mr-1" />
                        {classItem.gym.name}
                      </div>
                    )}
                  </div>

                  {/* Attendance Progress Bar */}
                  {classItem.status === 'in-progress' && classItem.booked > 0 && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <span>Asistencia</span>
                        <span>
                          {classItem.attended}/{classItem.booked}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div
                          className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                          style={{
                            width: `${classItem.booked > 0 ? (classItem.attended / classItem.booked) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                {(classItem.status === 'in-progress' || classItem.status === 'completed') &&
                  classItem.booked > 0 && (
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => {
                          // TODO: Open attendance modal
                          console.log('Open attendance for class:', classItem.id);
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        title="Marcar asistencia"
                      >
                        <Icons.CheckSquare className="w-4 h-4" />
                      </button>
                    </div>
                  )}
              </div>
            );
          })}
        </div>
      </div>
    </Widget>
  );
}
