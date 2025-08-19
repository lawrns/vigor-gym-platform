'use client';

import React, { useState } from 'react';
import { Icons } from '../../lib/icons/registry';
import { QuickActions } from './QuickActions';

/**
 * HeaderBar - Dashboard header with location switcher, date picker, and quick actions
 */
export function HeaderBar() {
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('7d');

  // Mock locations - would come from API
  const locations = [
    { id: 'all', name: 'Todas las ubicaciones' },
    { id: 'mx-cmx-001', name: 'Ciudad de México - Centro' },
    { id: 'mx-cmx-002', name: 'Ciudad de México - Polanco' },
    { id: 'mx-gdl-001', name: 'Guadalajara - Providencia' },
  ];

  const dateRanges = [
    { value: '7d', label: 'Últimos 7 días' },
    { value: '14d', label: 'Últimos 14 días' },
    { value: '30d', label: 'Últimos 30 días' },
  ];

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Location and Date controls */}
          <div className="flex items-center space-x-4">
            {/* Location Switcher */}
            <div className="relative">
              <label htmlFor="location-select" className="sr-only">
                Seleccionar ubicación
              </label>
              <select
                id="location-select"
                value={selectedLocation}
                onChange={e => setSelectedLocation(e.target.value)}
                className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 pr-8 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                data-testid="header-location-switcher"
              >
                {locations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <Icons.ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
            </div>

            {/* Date Range Picker */}
            <div className="relative">
              <label htmlFor="range-select" className="sr-only">
                Seleccionar rango de fechas
              </label>
              <select
                id="range-select"
                value={dateRange}
                onChange={e => setDateRange(e.target.value)}
                className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 pr-8 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                data-testid="header-range-picker"
              >
                {dateRanges.map(range => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <Icons.ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Center - Dashboard Title */}
          <div className="flex-1 flex justify-center">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
          </div>

          {/* Right side - Quick Actions and Menu */}
          <div className="flex items-center space-x-4">
            <QuickActions />

            {/* Help Menu */}
            <button
              type="button"
              className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
              aria-label="Ayuda"
            >
              <Icons.HelpCircle className="h-5 w-5" />
            </button>

            {/* Notifications */}
            <button
              type="button"
              className="relative p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
              aria-label="Notificaciones"
            >
              <Icons.Bell className="h-5 w-5" />
              {/* Notification badge */}
              <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white dark:ring-gray-800"></span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

/**
 * Mobile-friendly header for smaller screens
 */
export function MobileHeaderBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 lg:hidden">
      <div className="px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Dashboard Title */}
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Dashboard</h1>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
            aria-label="Abrir menú"
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <Icons.X className="h-6 w-6" /> : <Icons.Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="pb-4 space-y-4">
            {/* Location Switcher */}
            <div>
              <label
                htmlFor="mobile-location-select"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Ubicación
              </label>
              <select
                id="mobile-location-select"
                className="w-full appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todas las ubicaciones</option>
                <option value="mx-cmx-001">Ciudad de México - Centro</option>
                <option value="mx-cmx-002">Ciudad de México - Polanco</option>
                <option value="mx-gdl-001">Guadalajara - Providencia</option>
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label
                htmlFor="mobile-range-select"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Período
              </label>
              <select
                id="mobile-range-select"
                className="w-full appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="7d">Últimos 7 días</option>
                <option value="14d">Últimos 14 días</option>
                <option value="30d">Últimos 30 días</option>
              </select>
            </div>

            {/* Quick Actions */}
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <QuickActions mobile />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
