'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
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

interface Gym {
  id: string;
  name: string;
  city: string;
  state: string;
}

interface ConfigViewProps {
  session: DeviceSession;
  onConfigComplete: (config: KioskConfig) => void;
}

export function ConfigView({ session, onConfigComplete }: ConfigViewProps) {
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [selectedGymId, setSelectedGymId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load gyms on component mount
  useEffect(() => {
    loadGyms();
  }, []);

  const loadGyms = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // For now, use mock data. In a real implementation, this would fetch from API
      const mockGyms: Gym[] = [
        { id: '1', name: 'Vigor Gym Centro', city: 'Mexico City', state: 'CDMX' },
        { id: '2', name: 'Vigor Gym Norte', city: 'Mexico City', state: 'CDMX' },
        { id: '3', name: 'Vigor Gym Sur', city: 'Mexico City', state: 'CDMX' },
      ];

      setGyms(mockGyms);

      // Auto-select first gym if only one available
      if (mockGyms.length === 1) {
        setSelectedGymId(mockGyms[0].id);
      }
    } catch (err) {
      console.error('Error loading gyms:', err);
      setError('Failed to load gym locations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedGym = gyms.find(gym => gym.id === selectedGymId);
    if (!selectedGym) {
      setError('Please select a gym location');
      return;
    }

    // Save config to localStorage for persistence
    const config: KioskConfig = {
      gymId: selectedGym.id,
      gymName: selectedGym.name,
    };

    localStorage.setItem('kioskConfig', JSON.stringify(config));
    onConfigComplete(config);
  };

  // Load saved config on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('kioskConfig');
    if (savedConfig) {
      try {
        const config: KioskConfig = JSON.parse(savedConfig);
        setSelectedGymId(config.gymId);
      } catch (err) {
        console.error('Error loading saved config:', err);
      }
    }
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="text-center">
            <Icons.Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading gym locations...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icons.MapPin className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Select Location</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Choose the gym location for this kiosk
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="gymSelect"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3"
            >
              Gym Location
            </label>
            <div className="space-y-2">
              {gyms.map(gym => (
                <label
                  key={gym.id}
                  className={`block p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedGymId === gym.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  <input
                    type="radio"
                    name="gym"
                    value={gym.id}
                    checked={selectedGymId === gym.id}
                    onChange={e => setSelectedGymId(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{gym.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {gym.city}, {gym.state}
                      </div>
                    </div>
                    {selectedGymId === gym.id && (
                      <Icons.CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
              <div className="flex">
                <Icons.AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              </div>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={!selectedGymId}>
            <Icons.ArrowRight className="h-4 w-4 mr-2" />
            Continue to Scan
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Device: {session.device.name}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
