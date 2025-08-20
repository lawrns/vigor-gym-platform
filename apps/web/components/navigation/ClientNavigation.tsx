'use client';

import { useAuth } from '../../lib/auth/context';
import { AppNavigation } from './AppNavigation';
import { MobileNavigation } from './MobileNavigation';
import { getVisibleNavigation } from '../../lib/navigation/config';

export function ClientNavigation() {
  const { user, status } = useAuth();

  console.log('[ClientNavigation] Auth state:', { status, user: user ? { email: user.email, role: user.role, fullUser: user } : null });

  if (status === 'loading' || !user) {
    console.log('[ClientNavigation] Not rendering - loading or no user');
    return null;
  }

  const navigationItems = getVisibleNavigation(user.role as any);
  console.log('[ClientNavigation] Navigation items:', navigationItems.length, navigationItems.map(i => i.label));

  if (navigationItems.length === 0) {
    console.log('[ClientNavigation] Not rendering - no navigation items');
    return null;
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
