'use client';

import { useState } from 'react';
import { NavigationItem, UserRole } from '../../lib/navigation/config';
import { AppNavigation } from './AppNavigation';
import { Icons } from '../../lib/icons/registry';
import { cn } from '../../lib/utils';

interface MobileNavigationProps {
  items: NavigationItem[];
  userRole?: UserRole;
}

export function MobileNavigation({ items, userRole }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
      >
        <span>Menú</span>
        <Icons.Menu className="h-4 w-4" />
      </button>

      {/* Mobile menu overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Mobile menu panel */}
          <div className="fixed top-0 left-0 h-full w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-50 transform transition-transform duration-300 ease-in-out">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Navegación</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <Icons.X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto h-full pb-20">
              <AppNavigation 
                items={items} 
                userRole={userRole}
                variant="sidebar"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
