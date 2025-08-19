'use client';

import React, { useState, useEffect } from 'react';
import { DeviceLogin } from '../../components/kiosk/DeviceLogin';

interface DeviceSession {
  deviceToken: string;
  device: {
    id: string;
    name: string;
    companyId: string;
  };
  expiresIn: number;
}

export default function KioskPage() {
  const [session, setSession] = useState<DeviceSession | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  // Hide navbar and footer for kiosk mode
  useEffect(() => {
    // Add kiosk mode class to body
    document.body.classList.add('kiosk-mode');

    // Hide navbar, footer, and theme toggle
    const navbar = document.querySelector('nav');
    const footer = document.querySelector('footer');
    const themeToggle = document.querySelector('.fixed.bottom-4.right-4');

    if (navbar) navbar.style.display = 'none';
    if (footer) footer.style.display = 'none';
    if (themeToggle) (themeToggle as HTMLElement).style.display = 'none';

    // Check for existing device token
    const existingToken = localStorage.getItem('kioskDeviceToken');
    if (existingToken) {
      // TODO: Validate token and restore session
      // For now, just clear it to force re-authentication
      localStorage.removeItem('kioskDeviceToken');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('kiosk-mode');
      if (navbar) navbar.style.display = '';
      if (footer) footer.style.display = '';
      if (themeToggle) (themeToggle as HTMLElement).style.display = '';
    };
  }, []);

  const handleDeviceLogin = (deviceSession: DeviceSession) => {
    setSession(deviceSession);
  };

  // If not authenticated, show device login
  if (!session) {
    return (
      <div className="h-screen bg-gray-50 dark:bg-gray-900" data-testid="kiosk-container">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Vigor Kiosk</h1>
                <span className="ml-4 text-sm text-gray-500 dark:text-gray-400">
                  {isOnline ? '🟢 Online' : '🔴 Offline'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Device Login */}
        <div className="max-w-2xl mx-auto py-8 px-4">
          <DeviceLogin onLogin={handleDeviceLogin} />
        </div>

        {/* Footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Vigor Gym Management Platform • Kiosk Mode
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated - show kiosk interface
  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900" data-testid="kiosk-container">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {session.device.name}
              </h1>
              <span className="ml-4 text-sm text-gray-500 dark:text-gray-400">
                {isOnline ? '🟢 Online' : '🔴 Offline'}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Device: {session.device.id.substring(0, 8)}...
              </span>
              <button
                onClick={() => {
                  localStorage.removeItem('kioskDeviceToken');
                  setSession(null);
                }}
                className="text-sm text-red-600 hover:text-red-700 dark:text-red-400"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="h-8 w-8 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Member Check-in</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Scan QR code or enter member ID to check in
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* QR Scanner */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                QR Code Scanner
              </h3>
              <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <svg
                    className="h-16 w-16 text-gray-400 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h2M4 4h4m12 0h2M4 20h4m12 0h2"
                    />
                  </svg>
                  <p className="text-gray-500 dark:text-gray-400">Camera access required</p>
                  <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    Enable Camera
                  </button>
                </div>
              </div>
            </div>

            {/* Manual Entry */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Manual Entry</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Member ID
                  </label>
                  <input
                    type="text"
                    placeholder="Enter member ID"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <button className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                  Check In
                </button>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent Check-ins
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Juan Pérez</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Member #12345</p>
                </div>
                <span className="text-sm text-green-600 dark:text-green-400">2 min ago</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">María González</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Member #12346</p>
                </div>
                <span className="text-sm text-green-600 dark:text-green-400">5 min ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Vigor Gym Management Platform • Kiosk Mode • Device: {session.device.name}
          </p>
        </div>
      </div>
    </div>
  );
}
