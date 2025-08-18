import { Inter } from 'next/font/google';
import { Metadata } from 'next';
import '../globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Vigor Kiosk',
  description: 'Vigor Gym Member Check-in Kiosk',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Vigor Kiosk',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'Vigor Kiosk',
    'application-name': 'Vigor Kiosk',
    'msapplication-TileColor': '#1f2937',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#1f2937',
};

export default function KioskLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-gray-50 dark:bg-gray-900`}>
        {/* Kiosk layout without AuthProvider to avoid 401 errors */}
        <div className="h-full">
          {children}
        </div>
      </body>
    </html>
  );
}
