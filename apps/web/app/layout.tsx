import './globals.css';
import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { defaultSEO } from './next-seo.config';
import { EnhancedNavbar } from '../components/navigation/EnhancedNavbar';
import contentV2 from '../lib/content/home.v2.json';
import { ThemeProvider } from 'next-themes';
import { AnalyticsBinder } from '../components/AnalyticsBinder';
import { ThemeToggle } from '../components/ThemeToggle';
import { Footer } from '../components/Footer';
import { Spotlight } from '../components/Spotlight';
import { AuthProvider } from '../lib/auth/context';
import { Inter, Sora } from 'next/font/google';

const display = Sora({ subsets: ['latin'], weight: ['600', '700'], variable: '--font-display' });
const sans = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: defaultSEO.title,
  description: defaultSEO.description,
  icons: {
    icon: '/icons/icon-64x64.png',
    shortcut: '/icons/icon-64x64.png',
    apple: '/icons/icon-192x192.png',
  },
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
        {/* {process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_FILTER_EXTENSION_NOISE === 'true' && <DevConsoleFilter />} */}
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <Spotlight />
            <EnhancedNavbar />
            <AnalyticsBinder />
            <div className="fixed bottom-4 right-4">
              <ThemeToggle />
            </div>
            {children}
            <Footer
              columns={(contentV2 as any)?.FooterMega?.columns || []}
              bottom={
                (contentV2 as any)?.FooterMega?.bottom ||
                '© GoGym — Plataforma de gestión de gimnasios para México'
              }
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
