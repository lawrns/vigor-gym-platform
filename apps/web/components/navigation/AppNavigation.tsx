'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Icons } from '../../lib/icons/registry';
import { NavigationItem, UserRole } from '../../lib/navigation/config';
import { cn } from '../../lib/utils';

interface AppNavigationProps {
  items: NavigationItem[];
  userRole?: UserRole;
  variant?: 'sidebar' | 'horizontal';
  className?: string;
}

export function AppNavigation({ 
  items, 
  userRole, 
  variant = 'horizontal',
  className 
}: AppNavigationProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/dashboard-v2';
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  const renderNavigationItem = (item: NavigationItem, level = 0) => {
    const Icon = Icons[item.icon];
    const active = isActive(item.href);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);

    if (variant === 'sidebar') {
      return (
        <div key={item.id} className="space-y-1">
          <div className="flex items-center">
            <Link
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex-1',
                level > 0 && 'ml-6',
                active
                  ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
              {item.badge && (
                <span className="ml-auto bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
            {hasChildren && (
              <button
                onClick={() => toggleExpanded(item.id)}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Icons.ChevronDown 
                  className={cn(
                    'h-4 w-4 transition-transform',
                    isExpanded && 'rotate-180'
                  )} 
                />
              </button>
            )}
          </div>
          {hasChildren && isExpanded && (
            <div className="space-y-1">
              {item.children?.map(child => renderNavigationItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    // Horizontal variant
    if (hasChildren) {
      return (
        <div key={item.id} className="relative group">
          <button
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              active
                ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
            <Icons.ChevronDown className="h-3 w-3" />
          </button>
          
          {/* Dropdown menu */}
          <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
            <div className="py-1">
              {item.children?.map(child => {
                const ChildIcon = Icons[child.icon];
                return (
                  <Link
                    key={child.id}
                    href={child.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 text-sm transition-colors',
                      isActive(child.href)
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    )}
                  >
                    <ChildIcon className="h-4 w-4" />
                    <span>{child.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    return (
      <Link
        key={item.id}
        href={item.href}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
          active
            ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
        )}
      >
        <Icon className="h-4 w-4" />
        <span>{item.label}</span>
        {item.badge && (
          <span className="ml-auto bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full">
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  if (variant === 'sidebar') {
    return (
      <nav className={cn('space-y-2', className)}>
        {items.map(item => renderNavigationItem(item))}
      </nav>
    );
  }

  return (
    <nav className={cn('flex items-center gap-1', className)}>
      {items.map(item => renderNavigationItem(item))}
    </nav>
  );
}
