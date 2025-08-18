"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Icons } from '../../lib/icons/registry';

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

interface ScanPanelProps {
  session: DeviceSession;
  config: KioskConfig;
  isProcessing: boolean;
  onScanStart: () => void;
  onScanSuccess: (visit: any) => void;
  onScanError: (error: string) => void;
}

type ScanMode = 'qr' | 'manual';

export function ScanPanel({ 
  session, 
  config, 
  isProcessing, 
  onScanStart, 
  onScanSuccess, 
  onScanError 
}: ScanPanelProps) {
  const [scanMode, setScanMode] = useState<ScanMode>('qr');
  const [manualInput, setManualInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [retryCount, setRetryCount] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Start camera for QR scanning
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment', // Use back camera on mobile
        },
        audio: false,
      });

      setStream(mediaStream);
      setIsScanning(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setCameraError('Unable to access camera. Please check permissions or use manual input.');
      setScanMode('manual');
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsScanning(false);
  }, [stream]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Handle scan submission with retry logic
  const handleScan = async (memberIdentifier: string) => {
    if (!memberIdentifier.trim()) {
      onScanError('Please provide a member ID or QR code');
      return;
    }

    if (isOffline) {
      onScanError('Device is offline. Please check your internet connection and try again.');
      return;
    }

    onScanStart();

    const attemptScan = async (attempt: number = 1): Promise<void> => {
      try {
        const response = await fetch('/api/proxy/checkins/scan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.deviceToken}`,
          },
          body: JSON.stringify({
            [scanMode === 'qr' ? 'qrCode' : 'memberId']: memberIdentifier.trim(),
            gymId: config.gymId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Check-in failed');
        }

        const result = await response.json();
        setRetryCount(0); // Reset retry count on success
        onScanSuccess(result);
      } catch (err) {
        console.error(`Scan attempt ${attempt} failed:`, err);

        // Retry logic for network errors
        if (attempt < 3 && (err instanceof TypeError || err.message.includes('fetch'))) {
          setRetryCount(attempt);
          setTimeout(() => attemptScan(attempt + 1), 2000 * attempt); // Exponential backoff
        } else {
          setRetryCount(0);
          onScanError(err instanceof Error ? err.message : 'Check-in failed');
        }
      }
    };

    await attemptScan();
  };

  // Simulate QR code scan (for demo purposes)
  const handleSimulateQRScan = () => {
    // In a real implementation, this would use a QR code library
    const mockQRCode = "123e4567-e89b-12d3-a456-426614174000"; // Mock member ID
    handleScan(mockQRCode);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleScan(manualInput);
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Offline Banner */}
      {isOffline && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg" role="alert">
          <div className="flex items-center">
            <Icons.AlertTriangle className="h-5 w-5 text-red-400 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Device Offline
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                Check your internet connection. Check-ins will be unavailable until connection is restored.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Retry Banner */}
      {retryCount > 0 && (
        <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg" role="alert">
          <div className="flex items-center">
            <Icons.Loader2 className="h-5 w-5 text-yellow-400 mr-3 animate-spin" />
            <div>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Retrying check-in... (Attempt {retryCount}/3)
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Member Check-in
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Scan QR code or enter member ID
          </p>
        </div>

        {/* Scan Mode Toggle */}
        <div className="flex rounded-lg bg-gray-100 dark:bg-gray-700 p-1 mb-6">
          <button
            onClick={() => setScanMode('qr')}
            data-testid="scan-mode-qr"
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              scanMode === 'qr'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
            disabled={isProcessing}
          >
            <Icons.QrCode className="h-4 w-4 inline mr-2" />
            QR Code
          </button>
          <button
            onClick={() => setScanMode('manual')}
            data-testid="scan-mode-manual"
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              scanMode === 'manual'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
            disabled={isProcessing}
          >
            <Icons.Keyboard className="h-4 w-4 inline mr-2" />
            Manual
          </button>
        </div>

        {/* QR Scanner */}
        {scanMode === 'qr' && (
          <div className="space-y-4">
            {!isScanning && !cameraError && (
              <div className="text-center">
                <div className="w-48 h-48 mx-auto bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-4">
                  <Icons.QrCode className="h-16 w-16 text-gray-400" />
                </div>
                <Button
                  onClick={startCamera}
                  disabled={isProcessing}
                  className="w-full"
                >
                  <Icons.Camera className="h-4 w-4 mr-2" />
                  Start Camera
                </Button>
              </div>
            )}

            {isScanning && (
              <div className="space-y-4">
                <div className="relative w-full h-64 bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    autoPlay
                    playsInline
                    muted
                  />
                  <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none">
                    <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-blue-500"></div>
                    <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-blue-500"></div>
                    <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-blue-500"></div>
                    <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-blue-500"></div>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <Button
                    onClick={handleSimulateQRScan}
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <>
                        <Icons.Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Icons.Scan className="h-4 w-4 mr-2" />
                        Simulate Scan
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={stopCamera}
                    variant="outline"
                    disabled={isProcessing}
                  >
                    <Icons.X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {cameraError && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
                <div className="flex">
                  <Icons.AlertTriangle className="h-5 w-5 text-yellow-400" />
                  <div className="ml-3">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      {cameraError}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Manual Input */}
        {scanMode === 'manual' && (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label htmlFor="memberId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Member ID
              </label>
              <input
                type="text"
                id="memberId"
                data-testid="member-id-input"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Enter member ID"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                required
                disabled={isProcessing}
              />
            </div>
            <Button
              type="submit"
              data-testid="scan-submit"
              className="w-full"
              disabled={isProcessing || !manualInput.trim()}
            >
              {isProcessing ? (
                <>
                  <Icons.Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Icons.UserCheck className="h-4 w-4 mr-2" />
                  Check In
                </>
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
