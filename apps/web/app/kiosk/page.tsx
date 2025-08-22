'use client';

import React, { useState, useEffect } from 'react';
import { DeviceLogin } from '../../components/kiosk/DeviceLogin';
import { ConfigView } from '../../components/kiosk/ConfigView';
import { ScanPanel } from '../../components/kiosk/ScanPanel';

interface DeviceSession {
  deviceToken: string;
  device: {
    id: string;
    name: string;
    companyId: string;
  };
  expiresIn: number;
}

interface KioskConfig {
  gymId: string;
  gymName: string;
}

type KioskStep = 'login' | 'config' | 'scan';

export default function KioskPage() {
  const [currentStep, setCurrentStep] = useState<KioskStep>('login');
  const [session, setSession] = useState<DeviceSession | null>(null);
  const [config, setConfig] = useState<KioskConfig | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize kiosk session - check for existing valid session
  useEffect(() => {
    const restoreSession = async () => {
      const existingToken = localStorage.getItem('kioskDeviceToken');
      const existingConfig = localStorage.getItem('kioskConfig');

      if (!existingToken) {
        // No token, stay on login step
        return;
      }

      try {
        // Validate the existing token
        const response = await fetch('/api/proxy/devices/validate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ deviceToken: existingToken }),
        });

        if (!response.ok) {
          // Token is invalid, clear storage and stay on login
          console.log('Stored device token is invalid, clearing...');
          localStorage.removeItem('kioskDeviceToken');
          localStorage.removeItem('kioskConfig');
          return;
        }

        const data = await response.json();

        // Token is valid, restore session
        const deviceSession: DeviceSession = {
          deviceToken: existingToken,
          device: data.device,
          expiresIn: data.expiresIn || 86400, // Default 24 hours
        };

        setSession(deviceSession);

        // If we also have valid config, go directly to scan panel
        if (existingConfig) {
          try {
            const config: KioskConfig = JSON.parse(existingConfig);
            if (config.gymId && config.gymName) {
              setConfig(config);
              setCurrentStep('scan');
              console.log('Session restored - going directly to scan panel');
              return;
            }
          } catch (err) {
            console.error('Invalid stored config:', err);
            localStorage.removeItem('kioskConfig');
          }
        }

        // Valid session but no config, go to config step
        setCurrentStep('config');
        console.log('Session restored - going to config step');

      } catch (error) {
        console.error('Error validating device token:', error);
        // Clear invalid storage and stay on login
        localStorage.removeItem('kioskDeviceToken');
        localStorage.removeItem('kioskConfig');
      }
    };

    restoreSession();
  }, []);

  // Handle device login completion
  const handleDeviceLogin = (deviceSession: DeviceSession) => {
    setSession(deviceSession);
    setCurrentStep('config');
  };

  // Handle configuration completion
  const handleConfigComplete = (kioskConfig: KioskConfig) => {
    setConfig(kioskConfig);
    setCurrentStep('scan');
  };

  // Handle scan operations
  const handleScanStart = () => {
    setIsProcessing(true);
  };

  const handleScanSuccess = (visit: any) => {
    setIsProcessing(false);
    // TODO: Show success feedback
    console.log('Check-in successful:', visit);
  };

  const handleScanError = (error: string) => {
    setIsProcessing(false);
    // TODO: Show error feedback
    console.error('Check-in error:', error);
  };

  // Handle logout - reset to login step
  const handleLogout = () => {
    localStorage.removeItem('kioskDeviceToken');
    localStorage.removeItem('kioskConfig');
    setSession(null);
    setConfig(null);
    setCurrentStep('login');
  };

  // Render the appropriate step in the kiosk flow
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'login':
        return <DeviceLogin onLogin={handleDeviceLogin} />;

      case 'config':
        return session ? (
          <ConfigView
            session={session}
            onConfigComplete={handleConfigComplete}
          />
        ) : null;

      case 'scan':
        return session && config ? (
          <ScanPanel
            session={session}
            config={config}
            isProcessing={isProcessing}
            onScanStart={handleScanStart}
            onScanSuccess={handleScanSuccess}
            onScanError={handleScanError}
          />
        ) : null;

      default:
        return <DeviceLogin onLogin={handleDeviceLogin} />;
    }
  };

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900" data-testid="kiosk-container">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {currentStep === 'login' ? 'Vigor Kiosk' :
                 currentStep === 'config' ? 'Kiosk Setup' :
                 session?.device.name || 'Vigor Kiosk'}
              </h1>
              <span className="ml-4 text-sm text-gray-500 dark:text-gray-400">
                {isOnline ? '🟢 Online' : '🔴 Offline'}
              </span>
            </div>

            {/* Show logout button when authenticated */}
            {session && (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Device: {session.device.id.substring(0, 8)}...
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-red-600 hover:text-red-700 dark:text-red-400"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Render current step */}
      <div className="max-w-4xl mx-auto py-8 px-4">
        {renderCurrentStep()}
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Vigor Gym Management Platform • Kiosk Mode
            {session && ` • Device: ${session.device.name}`}
            {config && ` • Location: ${config.gymName}`}
          </p>
        </div>
      </div>
    </div>
  );
}
