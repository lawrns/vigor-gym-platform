import Link from 'next/link';
import Image from 'next/image';
import { getServerSession } from '../../lib/auth/session';
import { UserMenu } from '../UserMenu';
import { ClientNavigation } from './ClientNavigation';

// Static import for reliable logo loading
import logoImage from '@/public/images/gogym.png';

interface EnhancedNavbarProps {
  // No logo prop needed - we'll use the GoGym logo directly
}

export async function EnhancedNavbar({}: EnhancedNavbarProps) {
  let session = null;

  try {
    session = await getServerSession();
    console.log('[EnhancedNavbar] Server session result:', session ? { email: session.email, role: session.role } : 'null');
  } catch (error) {
    console.warn('[EnhancedNavbar] Session error:', error);
    // Continue with null session - navigation will show public links
  }

  return (
    <nav className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 supports-[backdrop-filter]:bg-white/70 dark:supports-[backdrop-filter]:bg-gray-900/70 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        {/* Top bar with logo and user menu */}
        <div className="h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image
              src={logoImage}
              alt="GoGym"
              width={120}
              height={40}
              className="h-8 w-auto"
              priority
            />
          </Link>

          <div className="flex items-center gap-6">
            {/* Session Chip for debugging */}
            {session && (
              <div
                data-testid="session-chip"
                className="hidden lg:flex items-center px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-blue-700 dark:text-blue-300"
              >
                {session.email} • {session.role}
              </div>
            )}

            {/* Public navigation for unauthenticated users */}
            {!session && (
              <div className="hidden md:flex gap-6 text-sm">
                <Link
                  href="/planes"
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Planes
                </Link>
                <Link
                  href="/contacto"
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Contacto
                </Link>
                <Link
                  href="/demo"
                  className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors font-medium"
                >
                  Solicitar Demo
                </Link>
              </div>
            )}

            {/* CTA or User Menu */}
            {session ? (
              <UserMenu user={session} />
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium text-sm transition-colors"
              >
                Iniciar Sesión
              </Link>
            )}
          </div>
        </div>

        {/* Navigation bar for authenticated users - client-side rendered */}
        <ClientNavigation />
      </div>
    </nav>
  );
}
