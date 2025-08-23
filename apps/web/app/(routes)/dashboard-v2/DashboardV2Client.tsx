'use client';

import React from 'react';
import { DashboardShell, Widget } from '../../../components/dashboard/DashboardShell';
import { ActiveVisitsWidget } from '../../../components/dashboard/widgets/ActiveVisitsWidget';
import { ExpiringMembershipsWidget } from '../../../components/dashboard/widgets/ExpiringMembershipsWidget';
import { RevenueSparkline } from '../../../components/dashboard/RevenueSparkline';
import { ClassRosterToday } from '../../../components/dashboard/ClassRosterToday';
import { StaffCoverageTimeline } from '../../../components/dashboard/StaffCoverageTimeline';
import { LiveActivityFeed } from '../../../components/dashboard/LiveActivityFeed';
import { useOrgContext } from '../../../lib/auth/context';

interface DashboardV2ClientProps {
  locationId?: string;
}

/**
 * Dashboard 2.0 Client Component - Complete Widget Implementation
 *
 * Features the full "great" dashboard with all 6 widgets:
 * - ActiveVisitsWidget - Real-time occupancy with SSE updates
 * - ExpiringMembershipsWidget - 7/14/30 day filters with actions
 * - RevenueSparkline - SVG sparkline with growth indicators
 * - ClassRosterToday - Today's schedule with capacity
 * - StaffCoverageTimeline - Shift coverage with gap detection
 * - LiveActivityFeed - SSE-powered activity stream
 */
export function DashboardV2Client({ locationId }: DashboardV2ClientProps = {}) {
  const { ready, orgId, status } = useOrgContext();

  console.log('[DashboardV2Client] Auth state:', { ready, orgId, status });

  if (!ready) {
    return (
      <DashboardShell>
        {/* Loading skeleton while auth/tenant context loads */}
        <Widget size="sm" loading={true} title="En el gimnasio ahora" />
        <Widget size="md" loading={true} title="Membresías por vencer" />
        <Widget size="md" loading={true} title="Ingresos" />
        <Widget size="lg" loading={true} title="Clases de hoy" />
        <Widget size="lg" loading={true} title="Cobertura de personal" />
        <Widget size="md" loading={true} title="Actividad en vivo" />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      {/* Top Row - KPI Widgets */}
      <ActiveVisitsWidget locationId={locationId} />
      <ExpiringMembershipsWidget locationId={locationId} />
      <RevenueSparkline locationId={locationId} />

      {/* Middle Row - Class Schedule */}
      <ClassRosterToday locationId={locationId} />

      {/* Bottom Row - Staff Coverage and Activity Feed */}
      <StaffCoverageTimeline locationId={locationId} className="col-span-1 md:col-span-6 lg:col-span-7" />
      <LiveActivityFeed locationId={locationId} className="col-span-1 md:col-span-6 lg:col-span-5" />
    </DashboardShell>
  );
}
