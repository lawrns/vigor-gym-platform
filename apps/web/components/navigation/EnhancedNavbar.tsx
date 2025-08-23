import { ClientNavigation } from './ClientNavigation';
import { ClientTopNavigation } from './ClientTopNavigation';

interface EnhancedNavbarProps {
  // No logo prop needed - we'll use the GoGym logo directly
}

export function EnhancedNavbar({}: EnhancedNavbarProps) {
  return (
    <nav className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 supports-[backdrop-filter]:bg-white/70 dark:supports-[backdrop-filter]:bg-gray-900/70 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="max-w-7xl mx-auto">
        {/* Top Navigation - Client-side for proper auth state detection */}
        <ClientTopNavigation />

        {/* Navigation bar for authenticated users - client-side rendered */}
        <ClientNavigation />
      </div>
    </nav>
  );
}
