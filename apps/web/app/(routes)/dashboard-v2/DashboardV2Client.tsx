"use client";

import { useState } from 'react';
import { DashboardShell } from '../../../components/dashboard/DashboardShell';
import { ActiveVisitsWidget } from '../../../components/dashboard/widgets/ActiveVisitsWidget';
import { ExpiringMembershipsWidget } from '../../../components/dashboard/widgets/ExpiringMembershipsWidget';
import { LiveActivityFeed } from '../../../components/dashboard/LiveActivityFeed';
import { ClassRosterToday } from '../../../components/dashboard/ClassRosterToday';
import { StaffCoverageTimeline } from '../../../components/dashboard/StaffCoverageTimeline';
import { RevenueSparkline } from '../../../components/dashboard/RevenueSparkline';

/**
 * Dashboard 2.0 Client Component
 * 
 * Features:
 * - 2-column responsive grid layout
 * - Mobile-first stacking
 * - Real-time widgets with SSE updates
 * - Role-based widget visibility
 * - Accessibility compliant (WCAG 2.1 AA)
 */
export function DashboardV2Client() {
  const [selectedLocation, setSelectedLocation] = useState<string | undefined>(undefined);

  return (
    <DashboardShell>
      {/* Row 1: Primary KPIs */}
      <ActiveVisitsWidget 
        locationId={selectedLocation}
        className="lg:col-span-3"
      />
      
      <ExpiringMembershipsWidget 
        locationId={selectedLocation}
        className="lg:col-span-4"
      />

      {/* Live Activity Feed */}
      <LiveActivityFeed
        locationId={selectedLocation}
        className="lg:col-span-5"
        maxEvents={25}
      />

      {/* Row 2: Secondary Widgets */}
      {/* Class Roster Today */}
      <ClassRosterToday
        locationId={selectedLocation}
        className="lg:col-span-7"
      />

      {/* Revenue Sparkline */}
      <RevenueSparkline
        locationId={selectedLocation}
        className="lg:col-span-5"
      />

      {/* Row 3: Staff Coverage (Full Width) */}
      <StaffCoverageTimeline
        locationId={selectedLocation}
        className="lg:col-span-12"
      />
    </DashboardShell>
  );
}
