import { Metadata } from 'next';
import { DashboardV2Client } from '../dashboard-v2/DashboardV2Client';

export const metadata: Metadata = {
  title: 'Dashboard - GoGym',
  description: 'Gym operations cockpit with real-time insights and actionable data',
};

/**
 * Dashboard - Server Component
 *
 * This is the main dashboard that provides:
 * - Real-time active visits and capacity monitoring
 * - Expiring memberships with renewal actions
 * - Live activity feed
 * - Today's class schedule
 * - Revenue insights
 * - Staff coverage overview
 */
export default function DashboardPage() {
  return <DashboardV2Client />;
}

