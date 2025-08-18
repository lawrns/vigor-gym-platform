import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | GoGym',
    default: 'GoGym - Gym Management Platform',
  },
  description: 'Transform your gym management with GoGym - the complete platform for modern fitness businesses',
  robots: {
    index: true,
    follow: true,
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
