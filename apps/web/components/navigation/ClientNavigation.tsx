'use client';

import { useAuth } from '../../lib/auth/context';
import { AppNavigation } from './AppNavigation';
import { MobileNavigation } from './MobileNavigation';
import { getVisibleNavigation } from '../../lib/navigation/config';

export function ClientNavigation() {
  const { user, status } = useAuth();

  console.log('[ClientNavigation] Auth state:', { status, user: user ? { email: user.email, role: user.role, fullUser: user } : null });

  // Render skeleton during loading
  if (status === 'loading') {
    console.log('[ClientNavigation] Rendering skeleton - loading');
    return (
      <div className="border-t border-gray-200 dark:border-gray-700">
        <div className="py-3">
          <div className="hidden md:flex space-x-4 animate-pulse">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-8 w-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('[ClientNavigation] Not rendering - no user');
    return null;
  }

  const isAuthenticated = status === 'authenticated';
  const navigationItems = getVisibleNavigation(user.role as any, isAuthenticated);
  console.log('[ClientNavigation] Navigation items:', navigationItems.length, navigationItems.map(i => i.label));

  // Fallback navigation if authenticated but no items
  if (isAuthenticated && navigationItems.length === 0) {
    console.log('[ClientNavigation] Rendering fallback navigation - authenticated but no items');
    const fallbackItems = [
      { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: 'Activity' as const },
      { id: 'settings', label: 'Configuración', href: '/settings', icon: 'Settings' as const },
    ];

    return (
      <div className="border-t border-gray-200 dark:border-gray-700">
        <div className="py-3">
          <AppNavigation
            items={fallbackItems}
            userRole={user.role as any}
            variant="horizontal"
            className="hidden md:flex"
          />
          <MobileNavigation
            items={fallbackItems}
            userRole={user.role as any}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-700">
      <div className="py-3">
        <AppNavigation 
          items={navigationItems} 
          userRole={user.role as any}
          variant="horizontal"
          className="hidden md:flex"
        />
        
        {/* Mobile navigation */}
        <MobileNavigation 
          items={navigationItems} 
          userRole={user.role as any}
        />
      </div>
    </div>
  );
}
