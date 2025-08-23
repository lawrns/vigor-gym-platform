'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Icons } from '../lib/icons/registry';
import { SessionUser } from '../lib/auth/session';

// Client-side User type from auth context
interface ClientUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  firstName?: string;
  lastName?: string;
  company?: {
    id: string;
    name: string;
    rfc: string;
  } | null;
}

interface UserMenuProps {
  user: SessionUser | ClientUser;
}

export function UserMenu({ user }: UserMenuProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Helper to determine if this is a client-side user or server-side session user
  const isClientUser = (u: SessionUser | ClientUser): u is ClientUser => {
    return 'id' in u && 'fullName' in u;
  };

  const getUserEmail = () => {
    return user.email;
  };

  const getUserRole = () => {
    return user.role;
  };

  const handleLogout = async () => {
    try {
      // Call logout endpoint (use Next.js API route)
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      // Redirect to home page
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if logout fails
      window.location.href = '/';
    }
  };

  return (
    <div className="relative">
      <button
        data-testid="user-menu-button"
        onClick={() => setShowUserMenu(!showUserMenu)}
        className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg p-2"
      >
        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
          <Icons.Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
        <Icons.ChevronRight
          className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-90' : ''}`}
        />
      </button>

      {showUserMenu && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />

          {/* Menu */}
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{getUserEmail()}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{getUserRole()}</p>
            </div>

            <div className="py-2">
              <Link
                href="/dashboard"
                className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setShowUserMenu(false)}
              >
                <Icons.Activity className="w-4 h-4 mr-3" />
                Dashboard
              </Link>

              <Link
                href="/dashboard/perfil"
                className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setShowUserMenu(false)}
              >
                <Icons.Edit className="w-4 h-4 mr-3" />
                Configuración
              </Link>

              <div className="border-t border-gray-200 dark:border-gray-700 my-2" />

              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Icons.X className="w-4 h-4 mr-3" />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
