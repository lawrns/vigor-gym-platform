import './globals.css';
import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { defaultSEO } from './next-seo.config';
import { ServerNavbar } from '../components/ServerNavbar';
import contentV2 from '../lib/content/home.v2.json';
import { ThemeProvider } from 'next-themes';
import { AnalyticsBinder } from '../components/AnalyticsBinder';
import { ThemeToggle } from '../components/ThemeToggle';
import { Footer } from '../components/Footer';
import { Spotlight } from '../components/Spotlight';
import { AuthProvider } from '../lib/auth/context';
import { Inter, Sora } from 'next/font/google';

const display = Sora({ subsets: ['latin'], weight: ['600','700'], variable: '--font-display' });
const sans = Inter({ subsets: ['latin'], weight: ['400','500','600','700'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: defaultSEO.title,
  description: defaultSEO.description,
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
    'msapplication-config': '/browserconfig.xml',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#1f2937',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-MX" className={`${display.variable} ${sans.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark')
                } else {
                  document.documentElement.classList.remove('dark')
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="bg-bg text-text font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <Spotlight />
            <ServerNavbar
              logo="/images/gogym.png"
              links={[
                { href: '/dashboard', label: 'Dashboard', roles: ['owner', 'manager', 'staff'] },
                { href: '/admin/members', label: 'Miembros', roles: ['owner', 'manager', 'staff'] },
                { href: '/staff', label: 'Personal', roles: ['owner', 'manager'] },
                { href: '/partner', label: 'Portal Gimnasio', roles: ['partner_admin'] },
              ]}
              cta={{ label: 'Iniciar Sesión', href: '/login' }}
            />
            <AnalyticsBinder />
            <div className="fixed bottom-4 right-4"><ThemeToggle /></div>
            {children}
            <Footer columns={(contentV2 as any)?.FooterMega?.columns || []} bottom={(contentV2 as any)?.FooterMega?.bottom || '© GoGym — Plataforma de gestión de gimnasios para México'} />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}


