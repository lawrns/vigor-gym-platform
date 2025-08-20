'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icons } from '../../../lib/icons/registry';
import { Widget, WidgetEmpty } from '../DashboardShell';
import { apiClient } from '../../../lib/api/client';
import type { DashboardSummary } from '@vigor/shared';

interface ExpiringMember {
  id: string;
  memberName: string;
  plan: string;
  expiresAt: string;
  daysLeft: number;
  email?: string;
  phone?: string;
}

interface ExpiringMembershipsWidgetProps {
  locationId?: string;
  className?: string;
}

/**
 * ExpiringMembershipsWidget - Shows members with expiring memberships
 *
 * Features:
 * - Filter by 7d/14d/30d windows
 * - Member details with expiration dates
 * - Quick actions: send reminder, collect payment
 * - Real-time updates via SSE
 */
export function ExpiringMembershipsWidget({
  locationId,
  className,
}: ExpiringMembershipsWidgetProps) {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'7d' | '14d' | '30d'>('7d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Mock expiring members data - would come from API
  const [expiringMembers] = useState<ExpiringMember[]>([
    {
      id: '1',
      memberName: 'María González',
      plan: 'Premium Mensual',
      expiresAt: '2025-08-24T00:00:00Z',
      daysLeft: 7,
      email: 'maria@example.com',
      phone: '+52 55 1234 5678',
    },
    {
      id: '2',
      memberName: 'Carlos Rodríguez',
      plan: 'Básico Mensual',
      expiresAt: '2025-08-20T00:00:00Z',
      daysLeft: 3,
      email: 'carlos@example.com',
    },
    {
      id: '3',
      memberName: 'Ana Martínez',
      plan: 'Premium Anual',
      expiresAt: '2025-08-30T00:00:00Z',
      daysLeft: 13,
      email: 'ana@example.com',
      phone: '+52 55 9876 5432',
    },
  ]);

  // Fetch dashboard summary data
  const fetchData = async () => {
    try {
      setError(null);
      const summary = await apiClient.dashboard.summary({
        locationId,
        range: selectedFilter,
      });
      setData(summary);
    } catch (err) {
      console.error('Failed to fetch expiring memberships:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [locationId, selectedFilter]);

  // Handle sending renewal reminder
  const handleSendReminder = async (memberId: string) => {
    try {
      setActionLoading(memberId);
      // TODO: Implement API call to send reminder
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock delay
      console.log('Sending reminder to member:', memberId);
      // Show success notification
    } catch (err) {
      console.error('Failed to send reminder:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle initiating payment collection
  const handleInitiatePayment = async (memberId: string) => {
    try {
      setActionLoading(memberId);
      // TODO: Implement API call to initiate payment
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock delay
      console.log('Initiating payment for member:', memberId);
      // Redirect to payment flow or show modal
    } catch (err) {
      console.error('Failed to initiate payment:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Filter members based on selected time window
  const filteredMembers = expiringMembers.filter(member => {
    const days = parseInt(selectedFilter.replace('d', ''));
    return member.daysLeft <= days;
  });

  const filterOptions = [
    { value: '7d' as const, label: '7 días', count: data?.expiringCounts['7d'] || 0 },
    { value: '14d' as const, label: '14 días', count: data?.expiringCounts['14d'] || 0 },
    { value: '30d' as const, label: '30 días', count: data?.expiringCounts['30d'] || 0 },
  ];

  const actions = (
    <div className="flex items-center space-x-2">
      {/* Filter Chips */}
      <div className="flex items-center space-x-1" data-testid="expiring-filter">
        {filterOptions.map(option => (
          <button
            key={option.value}
            onClick={() => setSelectedFilter(option.value)}
            className={`px-2 py-1 text-xs font-medium rounded-full transition-colors ${
              selectedFilter === option.value
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
            }`}
          >
            {option.label} ({option.count})
          </button>
        ))}
      </div>
    </div>
  );

  if (filteredMembers.length === 0 && !loading) {
    return (
      <Widget
        size="md"
        title="Membresías por vencer"
        actions={actions}
        className={className}
        testId="expiring-list"
      >
        <WidgetEmpty
          title="Todo bajo control"
          description={`Ninguna membresía vence en los próximos ${selectedFilter.replace('d', ' días')}.`}
          action={{
            label: 'Ver todas las membresías',
            href: '/memberships',
          }}
          icon={<Icons.CheckCircle className="h-6 w-6 text-green-500" />}
        />
      </Widget>
    );
  }

  return (
    <Widget
      size="md"
      title="Membresías por vencer"
      actions={actions}
      loading={loading}
      error={error}
      className={className}
      testId="expiring-list"
    >
      <div className="space-y-3">
        {filteredMembers.map(member => (
          <div
            key={member.id}
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <Icons.User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {member.memberName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{member.plan}</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <div
                    className={`text-sm font-medium ${
                      member.daysLeft <= 3
                        ? 'text-red-600 dark:text-red-400'
                        : member.daysLeft <= 7
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-blue-600 dark:text-blue-400'
                    }`}
                  >
                    {member.daysLeft === 0
                      ? 'Hoy'
                      : member.daysLeft === 1
                        ? 'Mañana'
                        : `${member.daysLeft} días`}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(member.expiresAt).toLocaleDateString('es-MX', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={() => handleSendReminder(member.id)}
                disabled={actionLoading === member.id}
                className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                title="Enviar recordatorio"
              >
                {actionLoading === member.id ? (
                  <Icons.Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Icons.Mail className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={() => handleInitiatePayment(member.id)}
                disabled={actionLoading === member.id}
                className="p-1.5 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                title="Cobrar ahora"
              >
                <Icons.CreditCard className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}

        {/* View All Link */}
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <Link
            href="/memberships?filter=expiring"
            className="block text-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            Ver todas las membresías por vencer
          </Link>
        </div>
      </div>
    </Widget>
  );
}
