"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Icons } from '../../lib/icons/registry';
import { useAuth } from '../../lib/auth/context';

interface QuickAction {
  id: string;
  label: string;
  href: string;
  icon: keyof typeof Icons;
  description: string;
  permissions: string[];
}

const quickActions: QuickAction[] = [
  {
    id: 'qa-checkin',
    label: 'Registrar visita',
    href: '/kiosk',
    icon: 'UserCheck',
    description: 'Registrar entrada de un miembro',
    permissions: ['staff', 'manager', 'owner'],
  },
  {
    id: 'qa-new-member',
    label: 'Nuevo miembro',
    href: '/members/new',
    icon: 'UserPlus',
    description: 'Agregar un nuevo miembro',
    permissions: ['staff', 'manager', 'owner'],
  },
  {
    id: 'qa-new-class',
    label: 'Crear clase',
    href: '/clases/new',
    icon: 'Calendar',
    description: 'Programar una nueva clase',
    permissions: ['manager', 'owner'],
  },
];

interface QuickActionsProps {
  mobile?: boolean;
}

/**
 * QuickActions - Header quick action buttons for common tasks
 */
export function QuickActions({ mobile = false }: QuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  // Filter actions based on user permissions
  const availableActions = quickActions.filter(action => 
    user?.role && action.permissions.includes(user.role)
  );

  if (mobile) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Acciones rápidas
        </h3>
        <div className="grid grid-cols-1 gap-2">
          {availableActions.map((action) => {
            const IconComponent = Icons[action.icon];
            return (
              <Link
                key={action.id}
                href={action.href}
                className="flex items-center p-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                <IconComponent className="h-5 w-5 mr-3 text-gray-400" />
                <div>
                  <div className="font-medium">{action.label}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {action.description}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Quick Actions Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Icons.Plus className="h-4 w-4 mr-2" />
        Acciones
        <Icons.ChevronDown className="h-4 w-4 ml-2" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Menu Panel */}
          <div className="absolute right-0 z-20 mt-2 w-72 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="py-1">
              <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Acciones rápidas
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Tareas comunes del gimnasio
                </p>
              </div>

              <div className="py-2">
                {availableActions.map((action) => {
                  const IconComponent = Icons[action.icon];
                  return (
                    <Link
                      key={action.id}
                      href={action.href}
                      onClick={() => setIsOpen(false)}
                      className="flex items-start px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      data-testid={action.id}
                    >
                      <IconComponent className="h-5 w-5 mr-3 mt-0.5 text-gray-400" />
                      <div>
                        <div className="font-medium">{action.label}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {action.description}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {availableActions.length === 0 && (
                <div className="px-4 py-6 text-center">
                  <Icons.Lock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No tienes permisos para realizar acciones rápidas
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Individual Quick Action Button (for use outside dropdown)
 */
interface QuickActionButtonProps {
  action: QuickAction;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

export function QuickActionButton({ 
  action, 
  variant = 'secondary',
  size = 'md' 
}: QuickActionButtonProps) {
  const IconComponent = Icons[action.icon];

  const baseClasses = "inline-flex items-center font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors";
  
  const variantClasses = {
    primary: "text-white bg-blue-600 hover:bg-blue-700",
    secondary: "text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600",
  };

  const sizeClasses = {
    sm: "px-2.5 py-1.5 text-xs",
    md: "px-3 py-2 text-sm",
    lg: "px-4 py-2 text-base",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4", 
    lg: "h-5 w-5",
  };

  return (
    <Link
      href={action.href}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`}
      data-testid={action.id}
      title={action.description}
    >
      <IconComponent className={`${iconSizes[size]} mr-2`} />
      {action.label}
    </Link>
  );
}
