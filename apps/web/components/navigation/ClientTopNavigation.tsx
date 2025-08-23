'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../../lib/auth/context';
import { UserMenu } from '../UserMenu';

// Static import for reliable logo loading
import logoImage from '@/public/images/gogym.png';

export function ClientTopNavigation() {
  const { user, status } = useAuth();

  return (
    <div className="h-16 flex items-center justify-between px-4">
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
        {user && (
          <div
            data-testid="session-chip"
            className="hidden lg:flex items-center px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-blue-700 dark:text-blue-300"
          >
            {user.email} • {user.role}
          </div>
        )}

        {/* Public navigation for unauthenticated users */}
        {!user && status !== 'loading' && (
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

        {/* Loading state */}
        {status === 'loading' && (
          <div className="hidden md:flex gap-6 text-sm">
            <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        )}

        {/* CTA or User Menu */}
        {user ? (
          <UserMenu user={user} />
        ) : status !== 'loading' ? (
          <Link
            href="/login"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium text-sm transition-colors"
          >
            Iniciar Sesión
          </Link>
        ) : (
          <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        )}
      </div>
    </div>
  );
}
