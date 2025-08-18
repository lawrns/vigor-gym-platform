"use client";

import { useState } from 'react';

export default function KioskPage() {
  const [isOnline, setIsOnline] = useState(true);

  return (
    <>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Vigor Kiosk
              </h1>
              <span className="ml-4 text-sm text-gray-500 dark:text-gray-400">
                {isOnline ? '🟢 Online' : '🔴 Offline'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a1 1 0 001-1V4a1 1 0 00-1-1H8a1 1 0 00-1 1v16a1 1 0 001 1z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Kiosk Mode
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Simplified kiosk interface for gym check-ins
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="font-medium text-blue-900 dark:text-blue-100">Status</h3>
              <p className="text-blue-700 dark:text-blue-300 text-sm mt-1">
                Kiosk is ready for member check-ins
              </p>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h3 className="font-medium text-green-900 dark:text-green-100">Features Available</h3>
              <ul className="text-green-700 dark:text-green-300 text-sm mt-1 space-y-1">
                <li>• QR Code scanning</li>
                <li>• Manual member ID entry</li>
                <li>• Real-time check-in processing</li>
                <li>• Offline mode support</li>
              </ul>
            </div>

            <button
              onClick={() => setIsOnline(!isOnline)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Toggle Online Status (Demo)
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Vigor Gym Management Platform • Kiosk Mode
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Location: Centro Fitness Demo
          </p>
        </div>
      </div>
    </>
  );
}
