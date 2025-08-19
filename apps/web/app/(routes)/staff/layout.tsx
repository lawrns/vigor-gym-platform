import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Staff Management',
  description: 'Manage your gym staff, schedules, and certifications',
};

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return children;
}
