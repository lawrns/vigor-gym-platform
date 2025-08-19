'use client';

import Link from 'next/link';
import { useAuth } from '../lib/auth/context';
import { Icons } from '../lib/icons/registry';
import React, { useState } from 'react';

type NavLink = { href: string; label: string; roles?: string[] };

interface AuthNavbarProps {
  logo?: string;
  links?: NavLink[];
  cta?: { label: string; href: string };
}

export function AuthNavbar({ logo = 'Vigor', links = [], cta }: AuthNavbarProps) {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Filter links based on user role
  const visibleLinks = links.filter(l => !l.roles || (user && l.roles.includes(user.role)));

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
  };

  return (
    <nav className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 supports-[backdrop-filter]:bg-white/70 dark:supports-[backdrop-filter]:bg-gray-900/70 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="max-w-7xl mx-auto h-16 flex items-center justify-between px-4">
        <Link href="/" className="font-display text-xl font-bold text-gray-900 dark:text-white">
          {logo}
        </Link>

        <div className="flex items-center gap-6">
          {/* Navigation Links */}
          <div className="hidden md:flex gap-6 text-sm">
            {user ? (
              // Authenticated user links
              visibleLinks.map(l => (
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

          {/* User Menu or CTA */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full px-3 py-2 transition-colors"
              >
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                  {user.firstName?.[0] || user.fullName?.[0] || 'U'}
                  {user.lastName?.[0] || user.fullName?.split(' ')[1]?.[0] || ''}
                </div>
                <span className="hidden sm:block text-gray-700 dark:text-gray-300">
                  {user.firstName || user.fullName?.split(' ')[0] || 'User'}
                </span>
                <Icons.Users className="w-4 h-4 text-gray-500" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2">
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                    {user.company && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {user.company.name} • {user.role}
                      </p>
                    )}
                  </div>

                  <div className="py-1">
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <div className="flex items-center">
                        <Icons.Activity className="w-4 h-4 mr-2" />
                        Dashboard
                      </div>
                    </Link>

                    {(user.role === 'owner' ||
                      user.role === 'manager' ||
                      user.role === 'staff') && (
                      <Link
                        href="/admin/members"
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <div className="flex items-center">
                          <Icons.Users className="w-4 h-4 mr-2" />
                          Gestión de Miembros
                        </div>
                      </Link>
                    )}

                    {user.role === 'partner_admin' && (
                      <Link
                        href="/partner"
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <div className="flex items-center">
                          <Icons.Building2 className="w-4 h-4 mr-2" />
                          Portal de Gimnasio
                        </div>
                      </Link>
                    )}
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 py-1">
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <div className="flex items-center">
                        <Icons.Activity className="w-4 h-4 mr-2" />
                        Cerrar Sesión
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
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

      {/* Mobile menu overlay */}
      {showUserMenu && (
        <div className="fixed inset-0 z-30 md:hidden" onClick={() => setShowUserMenu(false)} />
      )}
    </nav>
  );
}
