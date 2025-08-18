"use client";

import { useState } from 'react';
// Simple inline components to avoid import issues
const Button = ({ children, className = '', ...props }: any) => (
  <button
    className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 ${className}`}
    {...props}
  >
    {children}
  </button>
);

const LoadingIcon = () => (
  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

interface DeviceSession {
  deviceToken: string;
  device: {
    id: string;
    name: string;
    companyId: string;
  };
  expiresIn: number;
}

interface DeviceLoginProps {
  onLogin: (session: DeviceSession) => void;
}

export function DeviceLogin({ onLogin }: DeviceLoginProps) {
  const [deviceId, setDeviceId] = useState('');
  const [deviceSecret, setDeviceSecret] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/proxy/devices/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceId: deviceId.trim(),
          deviceSecret: deviceSecret.trim(),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        // Enhanced error handling with specific error codes
        const errorMessage = data?.error || data?.message || `Authentication failed (${response.status})`;
        const errorCode = data?.error || 'DEVICE_AUTH_FAILED';

        console.error('Device authentication failed:', {
          status: response.status,
          error: errorCode,
          message: errorMessage,
          deviceId: deviceId.substring(0, 8) + '...'
        });

        // User-friendly error messages
        let userMessage = errorMessage;
        switch (errorCode) {
          case 'DEVICE_NOT_FOUND':
          case 'INVALID_CREDENTIALS':
            userMessage = 'Invalid device credentials. Please check your Device ID and Secret.';
            break;
          case 'DEVICE_CREDENTIALS_REQUIRED':
            userMessage = 'Please enter both Device ID and Device Secret.';
            break;
          case 'CONTENT_TYPE_JSON_REQUIRED':
          case 'INVALID_JSON':
            userMessage = 'Request format error. Please try again.';
            break;
          case 'RATE_LIMITED':
            userMessage = 'Too many attempts. Please wait a moment and try again.';
            break;
          case 'PROXY_INTERNAL_ERROR':
            userMessage = 'Connection error. Please check your internet connection.';
            break;
          default:
            if (response.status >= 500) {
              userMessage = 'Server error. Please try again in a moment.';
            }
        }

        setError(userMessage);
        return;
      }

      // Validate response data
      if (!data.deviceToken) {
        console.error('Invalid response: missing deviceToken');
        setError('Authentication response invalid. Please try again.');
        return;
      }

      console.log('Device authentication successful');

      // Store device token for subsequent requests
      if (typeof window !== 'undefined') {
        localStorage.setItem('kioskDeviceToken', data.deviceToken);
      }

      const session: DeviceSession = data;
      onLogin(session);
    } catch (err: any) {
      console.error('Device login network error:', err);
      setError(err?.message || 'Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a1 1 0 001-1V4a1 1 0 00-1-1H8a1 1 0 00-1 1v16a1 1 0 001 1z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Device Login
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Enter your device credentials to access the kiosk
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="deviceId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Device ID
            </label>
            <input
              type="text"
              id="deviceId"
              data-testid="device-id-input"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              placeholder="Enter device ID"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="deviceSecret" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Device Secret
            </label>
            <input
              type="password"
              id="deviceSecret"
              data-testid="device-secret-input"
              value={deviceSecret}
              onChange={(e) => setDeviceSecret(e.target.value)}
              placeholder="Enter device secret"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              required
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
              <div className="flex">
                <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div className="ml-3">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          <Button
            type="submit"
            data-testid="device-login-submit"
            className="w-full"
            disabled={isLoading || !deviceId.trim() || !deviceSecret.trim()}
          >
            {isLoading ? (
              <>
                <LoadingIcon />
                Authenticating...
              </>
            ) : (
              <>
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Login
              </>
            )}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Need device credentials?
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Contact your gym administrator to register this device
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
