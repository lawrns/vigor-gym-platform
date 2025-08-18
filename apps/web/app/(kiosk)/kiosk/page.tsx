"use client";

import { useState, useEffect } from 'react';
import { DeviceLogin } from '../../../components/kiosk/DeviceLogin';
import { ScanPanel } from '../../../components/kiosk/ScanPanel';
import { VisitResult } from '../../../components/kiosk/VisitResult';
import { ConfigView } from '../../../components/kiosk/ConfigView';
import { ServiceWorkerRegistration } from '../../../components/kiosk/ServiceWorkerRegistration';

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

type KioskState = 
  | { type: 'login' }
  | { type: 'config'; session: DeviceSession }
  | { type: 'scan'; session: DeviceSession; config: KioskConfig }
  | { type: 'processing'; session: DeviceSession; config: KioskConfig }
  | { type: 'success'; session: DeviceSession; config: KioskConfig; visit: any }
  | { type: 'error'; session: DeviceSession; config: KioskConfig; error: string };

export default function KioskPage() {
  const [state, setState] = useState<KioskState>({ type: 'login' });

  // Auto-logout on token expiration
  useEffect(() => {
    if (state.type !== 'login') {
      const session = 'session' in state ? state.session : null;
      if (session) {
        const timeout = setTimeout(() => {
          setState({ type: 'login' });
        }, session.expiresIn * 1000);

        return () => clearTimeout(timeout);
      }
    }
  }, [state]);

  const handleDeviceLogin = (session: DeviceSession) => {
    setState({ type: 'config', session });
  };

  const handleConfigComplete = (config: KioskConfig) => {
    if (state.type === 'config') {
      setState({ type: 'scan', session: state.session, config });
    }
  };

  const handleScanStart = () => {
    if (state.type === 'scan') {
      setState({ type: 'processing', session: state.session, config: state.config });
    }
  };

  const handleScanSuccess = (visit: any) => {
    if (state.type === 'processing') {
      setState({ type: 'success', session: state.session, config: state.config, visit });
    }
  };

  const handleScanError = (error: string) => {
    if (state.type === 'processing') {
      setState({ type: 'error', session: state.session, config: state.config, error });
    }
  };

  const handleReturnToScan = () => {
    if (state.type === 'success' || state.type === 'error') {
      setState({ type: 'scan', session: state.session, config: state.config });
    }
  };

  const handleLogout = () => {
    setState({ type: 'login' });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ServiceWorkerRegistration />
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Vigor Kiosk
              </h1>
              {state.type !== 'login' && 'session' in state && (
                <span className="ml-4 text-sm text-gray-500 dark:text-gray-400">
                  Device: {state.session.device.name}
                </span>
              )}
            </div>
            {state.type !== 'login' && (
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto py-8 px-4">
        {state.type === 'login' && (
          <DeviceLogin onLogin={handleDeviceLogin} />
        )}

        {state.type === 'config' && (
          <ConfigView 
            session={state.session}
            onConfigComplete={handleConfigComplete}
          />
        )}

        {(state.type === 'scan' || state.type === 'processing') && (
          <div data-testid="kiosk-status" style={{ display: 'none' }}>ONLINE</div>
        )}
        {(state.type === 'scan' || state.type === 'processing') && (
          <ScanPanel
            session={state.session}
            config={state.config}
            isProcessing={state.type === 'processing'}
            onScanStart={handleScanStart}
            onScanSuccess={handleScanSuccess}
            onScanError={handleScanError}
          />
        )}

        {(state.type === 'success' || state.type === 'error') && (
          <VisitResult
            type={state.type}
            visit={state.type === 'success' ? state.visit : undefined}
            error={state.type === 'error' ? state.error : undefined}
            onReturnToScan={handleReturnToScan}
          />
        )}
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Vigor Gym Management Platform • Kiosk Mode
          </p>
          {state.type !== 'login' && 'config' in state && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Location: {state.config.gymName}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
