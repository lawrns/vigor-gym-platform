import Link from 'next/link';
import { getServerSession } from '../lib/auth/session';
import { UserMenu } from './UserMenu';

type NavLink = { href: string; label: string; roles?: string[] };

interface ServerNavbarProps {
  logo?: string;
  links?: NavLink[];
  cta?: { label: string; href: string };
}

export async function ServerNavbar({ logo = 'Vigor', links = [], cta }: ServerNavbarProps) {
  const session = await getServerSession();

  // Filter links based on user role
  const visibleLinks = links.filter((l) => !l.roles || (session && l.roles.includes(session.role)));

  return (
    <nav className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 supports-[backdrop-filter]:bg-white/70 dark:supports-[backdrop-filter]:bg-gray-900/70 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="max-w-7xl mx-auto h-16 flex items-center justify-between px-4">
        <Link href="/" className="font-display text-xl font-bold text-gray-900 dark:text-white">
          {logo}
        </Link>
        
        <div className="flex items-center gap-6">
          {/* Navigation Links */}
          <div className="hidden md:flex gap-6 text-sm">
            {session ? (
              // Authenticated user links
              visibleLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  {l.label}
                </Link>
              ))
            ) : (
              // Public navigation links for unauthenticated users
              <>
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
              </>
            )}
          </div>

          {/* Session Chip for debugging */}
          {session && (
            <div
              data-testid="session-chip"
              className="hidden lg:flex items-center px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-blue-700 dark:text-blue-300"
            >
              {session.email} • {session.role}
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
    </nav>
  );
}
