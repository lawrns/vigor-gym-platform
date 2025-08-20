/**
 * Staff Coverage Timeline Widget
 *
 * Displays today's staff shifts with gap detection and timeline visualization
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Icons } from '../../lib/icons/registry';
import { Widget, WidgetEmpty } from './DashboardShell';
import { api } from '../../lib/api/client';

interface StaffShift {
  id: string;
  staffId: string;
  staffName: string;
  role: string;
  startTime: string;
  endTime: string;
  gymId: string | null;
  gymName: string | null;
  notes: string | null;
}

interface CoverageGap {
  from: string;
  to: string;
  rolesMissing: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface StaffCoverageData {
  shifts: StaffShift[];
  gaps: CoverageGap[];
  summary: {
    totalStaff: number;
    totalShifts: number;
    totalGaps: number;
    criticalGaps: number;
    totalGapHours: number;
    coverageScore: number;
  };
  date: string;
  locationId: string | null;
  requiredRoles: Record<number, string[]>;
}

interface StaffCoverageTimelineProps {
  locationId?: string | null;
  className?: string;
}

export function StaffCoverageTimeline({ locationId, className }: StaffCoverageTimelineProps) {
  const [data, setData] = useState<StaffCoverageData | null>(null);
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

      const result = await api.get<StaffCoverageData>(`/api/staff-coverage?${params}`);
      setData(result);
    } catch (err) {
      console.error('Error fetching staff coverage:', err);
      setError(err instanceof Error ? err.message : 'Failed to load staff coverage');
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

  // Get role color
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'MANAGER':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'TRAINER':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'RECEPTIONIST':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'MAINTENANCE':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // Get severity color
  const getSeverityColor = (severity: CoverageGap['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-200 dark:border-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800';
    }
  };

  // Get coverage score color
  const getCoverageScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 40) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  if (loading) {
    return (
      <Widget
        title="Cobertura de Personal"
        icon={<Icons.Users className="h-5 w-5 text-gray-600 dark:text-gray-400" />}
        className={className}
        loading={true}
      >
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
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
        title="Cobertura de Personal"
        icon={<Icons.Users className="h-5 w-5 text-gray-600 dark:text-gray-400" />}
        className={className}
        error={error}
        onRetry={fetchData}
      />
    );
  }

  if (!data || data.shifts.length === 0) {
    return (
      <WidgetEmpty
        title="Cobertura de Personal"
        icon={<Icons.Users className="h-6 w-6 text-gray-400" />}
        className={className}
        description="No hay turnos programados para hoy"
        action={{
          label: 'Programar Turno',
          href: '/staff/shifts/new',
        }}
      />
    );
  }

  return (
    <Widget
      title="Cobertura de Personal"
      icon={<Icons.Users className="h-5 w-5 text-gray-600 dark:text-gray-400" />}
      className={className}
      action={{
        label: 'Ver Horarios',
        href: '/staff/shifts',
      }}
    >
      <div className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {data.summary.totalStaff}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Personal</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {data.summary.totalShifts}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Turnos</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-red-600 dark:text-red-400">
              {data.summary.totalGaps}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Huecos</div>
          </div>
          <div className="text-center">
            <div
              className={`text-lg font-semibold ${getCoverageScoreColor(data.summary.coverageScore)}`}
            >
              {data.summary.coverageScore}%
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Cobertura</div>
          </div>
        </div>

        {/* Active Shifts */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">Turnos Activos</h4>
          {data.shifts.map(shift => (
            <div
              key={shift.id}
              className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              {/* Time Range */}
              <div className="flex-shrink-0 text-center">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatTime(shift.startTime)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {formatTime(shift.endTime)}
                </div>
              </div>

              {/* Staff Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h5 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {shift.staffName}
                  </h5>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(shift.role)}`}
                  >
                    {shift.role}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-1">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {shift.gymName || 'Todas las ubicaciones'}
                  </div>
                  {shift.notes && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-32">
                      {shift.notes}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Coverage Gaps */}
        {data.gaps.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
              <Icons.AlertTriangle className="w-4 h-4 mr-2 text-amber-500" />
              Huecos de Cobertura
            </h4>
            {data.gaps.map((gap, index) => (
              <div
                key={index}
                className={`p-3 border rounded-lg ${getSeverityColor(gap.severity)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">
                    {formatTime(gap.from)} - {formatTime(gap.to)}
                  </div>
                  <span className="text-xs font-medium uppercase">{gap.severity}</span>
                </div>
                <div className="text-xs mt-1">Faltan: {gap.rolesMissing.join(', ')}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Widget>
  );
}
