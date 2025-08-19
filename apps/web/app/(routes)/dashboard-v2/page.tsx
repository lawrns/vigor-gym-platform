import { Metadata } from 'next';
import { DashboardV2Client } from './DashboardV2Client';

export const metadata: Metadata = {
  title: 'Dashboard 2.0 - GoGym',
  description: 'Gym operations cockpit with real-time insights and actionable data',
};

/**
 * Dashboard 2.0 - Server Component
 *
 * This is the new orientative, gym-ops cockpit dashboard that provides:
 * - Real-time active visits and capacity monitoring
 * - Expiring memberships with renewal actions
 * - Live activity feed
 * - Today's class schedule
 * - Revenue insights
 * - Staff coverage overview
 */
export default function DashboardV2Page() {
  return <DashboardV2Client />;
}
