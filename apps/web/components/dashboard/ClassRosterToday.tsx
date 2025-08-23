/**
 * Class Roster Today Widget
 *
 * Displays today's scheduled classes with timeline, occupancy, and attendance tracking
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Icons } from '../../lib/icons/registry';
import { Widget, WidgetEmpty } from './DashboardShell';
import { apiClient } from '../../lib/api/client';
import type { ClassesToday } from '@gogym/shared';

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
  const [data, setData] = useState<ClassesToday | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Adapter function to convert new API structure to expected format
  const adaptClassData = (classes: ClassesToday): ClassItem[] => {
    return classes.map(cls => {
      const now = new Date();
      const startsAt = new Date(cls.starts_at);
      const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000); // Assume 1 hour duration

      let status: 'upcoming' | 'in-progress' | 'completed' = 'upcoming';
      if (now > endsAt) {
        status = 'completed';
      } else if (now >= startsAt) {
        status = 'in-progress';
      }

      return {
        id: cls.id,
        name: cls.title,
        description: null,
        startsAt: cls.starts_at,
        endsAt: endsAt.toISOString(),
        capacity: cls.capacity,
        booked: cls.booked,
        attended: 0, // Not available in new API
        noShows: 0, // Not available in new API
        pending: cls.booked, // Assume all booked are pending
        utilizationPercent: Math.round((cls.booked / cls.capacity) * 100),
        gym: {
          id: 'gym-1', // Not available in new API
          name: cls.gym_name,
        },
        trainer: {
          id: 'trainer-1', // Not available in new API
          name: cls.instructor,
        },
        bookings: [], // Not available in new API
        status,
      };
    });
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.dashboard.classesToday({
        locationId: locationId || undefined,
      });

      // Handle the Railway API response format which has a different structure
      // Railway API returns: { classes: [...], summary: {...}, date: "...", total: 123 }
      // But the old Supabase format was just an array
      let classesData;
      let summaryData;

      if (Array.isArray(result)) {
        // Legacy format (direct array) - calculate summary
        classesData = result;
        const totalBooked = result.reduce((sum, cls) => sum + cls.booked, 0);
        const totalCapacity = result.reduce((sum, cls) => sum + cls.capacity, 0);
        const averageUtilization = totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0;

        summaryData = {
          totalBooked,
          totalCapacity,
          averageUtilization
        };
      } else {
        // New Railway API format (object with classes property)
        classesData = result.classes || [];
        summaryData = result.summary || {
          totalBooked: 0,
          totalCapacity: 0,
          averageUtilization: 0
        };
      }

      // Set the data in the expected format
      setData({
        classes: classesData,
        summary: summaryData
      });
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
          icon: <Icons.Clock3 className="w-3 h-3" />,
          label: 'Próxima',
        };
      case 'in-progress':
        return {
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-100 dark:bg-green-900',
          icon: <Icons.Play className="w-3 h-3" />,
          label: 'En curso',
        };
      case 'completed':
        return {
          color: 'text-gray-600 dark:text-gray-400',
          bgColor: 'bg-gray-100 dark:bg-gray-900',
          icon: <Icons.CheckSquare className="w-3 h-3" />,
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
      <Widget title="Clases de Hoy" icon={<Icons.Activity className="h-5 w-5 text-gray-600 dark:text-gray-400" />} className={className} loading={true}>
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
        icon={<Icons.Activity className="h-5 w-5 text-gray-600 dark:text-gray-400" />}
        className={className}
        error={error}
        onRetry={fetchData}
      />
    );
  }

  if (!data || !data.classes || data.classes.length === 0) {
    return (
      <Widget
        title="Clases de Hoy"
        icon={<Icons.Activity className="h-5 w-5 text-gray-600 dark:text-gray-400" />}
        className={className}
      >
        <WidgetEmpty
          title="No hay clases programadas"
          description="Las clases aparecerán aquí cuando estén programadas"
          icon={<Icons.Activity className="h-6 w-6 text-gray-400" />}
          action={{
            label: 'Programar Clase',
            href: '/classes/new',
          }}
        />
      </Widget>
    );
  }

  // Adapt the data to the expected format
  const adaptedClasses = adaptClassData(data.classes);

  return (
    <Widget
      title="Clases de Hoy"
      icon={<Icons.Activity className="h-5 w-5 text-gray-600 dark:text-gray-400" />}
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
          {adaptedClasses.map(classItem => {
            const statusDisplay = getStatusDisplay(classItem.status);

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
                    <span className="mr-1">{statusDisplay.icon}</span>
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
