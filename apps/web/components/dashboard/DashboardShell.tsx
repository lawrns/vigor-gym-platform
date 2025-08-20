'use client';

import React, { ReactNode } from 'react';

interface DashboardShellProps {
  children: ReactNode;
  className?: string;
}

/**
 * DashboardShell - Main layout container for Dashboard 2.0
 *
 * Features:
 * - 2-column responsive grid (lg: 12 cols)
 * - Mobile-first stacking
 * - Header with location/date pickers and quick actions
 * - Proper semantic structure for accessibility
 */
export function DashboardShell({ children, className = '' }: DashboardShellProps) {
  return (
    <div
      className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${className}`}
      data-testid="dashboard-root"
    >
      {/* Header Bar - Temporarily disabled due to icon issues */}
      {/* <HeaderBar /> */}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-4 lg:gap-6">
          {children}
        </div>
      </main>
    </div>
  );
}

/**
 * Widget container with consistent styling
 */
interface WidgetProps {
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  title?: string;
  description?: string;
  actions?: ReactNode;
  loading?: boolean;
  error?: string | null;
  testId?: string;
  icon?: ReactNode;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  onRetry?: () => void;
}

export function Widget({
  children,
  className = '',
  size = 'md',
  title,
  description,
  actions,
  loading = false,
  error = null,
  testId,
  icon,
  action,
  onRetry,
}: WidgetProps) {
  // Size mappings for responsive grid
  const sizeClasses = {
    sm: 'col-span-1 md:col-span-3 lg:col-span-3',
    md: 'col-span-1 md:col-span-3 lg:col-span-4',
    lg: 'col-span-1 md:col-span-6 lg:col-span-5',
    xl: 'col-span-1 md:col-span-6 lg:col-span-7',
    full: 'col-span-1 md:col-span-6 lg:col-span-12',
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`} data-testid={testId}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-full">
        {/* Widget Header */}
        {(title || actions || action) && (
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {icon && <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">{icon}</div>}
                <div>
                  {title && (
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
                  )}
                  {description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {actions}
                {action &&
                  (action.href ? (
                    <a
                      href={action.href}
                      className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                    >
                      {action.label}
                    </a>
                  ) : (
                    <button
                      onClick={action.onClick}
                      className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                    >
                      {action.label}
                    </button>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Widget Content */}
        <div className="p-6">
          {loading ? (
            <WidgetSkeleton />
          ) : error ? (
            <WidgetError error={error} onRetry={onRetry} />
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Loading skeleton for widgets
 */
function WidgetSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
      </div>
    </div>
  );
}

/**
 * Error state for widgets
 */
interface WidgetErrorProps {
  error: string;
  onRetry?: () => void;
}

function WidgetError({ error, onRetry }: WidgetErrorProps) {
  return (
    <div className="text-center py-8">
      <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg
          className="h-6 w-6 text-red-600 dark:text-red-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      </div>
      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
        Error al cargar datos
      </h4>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{error}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}

/**
 * Empty state for widgets
 */
interface WidgetEmptyProps {
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  icon?: ReactNode;
}

export function WidgetEmpty({ title, description, action, icon }: WidgetEmptyProps) {
  return (
    <div className="text-center py-8">
      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
        {icon || (
          <svg
            className="h-6 w-6 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        )}
      </div>
      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">{title}</h4>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{description}</p>
      {action &&
        (action.href ? (
          <a
            href={action.href}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {action.label}
          </a>
        ) : (
          <button
            onClick={action.onClick}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {action.label}
          </button>
        ))}
    </div>
  );
}
