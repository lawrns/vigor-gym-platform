'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { Icons } from '../../lib/icons/registry';

interface VisitResultProps {
  type: 'success' | 'error';
  visit?: {
    visit: {
      id: string;
      checkIn: string;
      member: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
      };
      gym: {
        id: string;
        name: string;
      };
    };
    message: string;
  };
  error?: string;
  onReturnToScan: () => void;
}

export function VisitResult({ type, visit, error, onReturnToScan }: VisitResultProps) {
  const [countdown, setCountdown] = useState(4); // 4 seconds countdown

  // Auto-return to scan after success (4 seconds) with countdown
  useEffect(() => {
    if (type === 'success') {
      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            onReturnToScan();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countdownInterval);
    }
  }, [type, onReturnToScan]);

  // Focus management for accessibility
  useEffect(() => {
    // Focus the main result container for screen readers
    const resultContainer = document.getElementById('visit-result');
    if (resultContainer) {
      resultContainer.focus();
    }
  }, []);

  if (type === 'success' && visit) {
    const checkInTime = new Date(visit.visit.checkIn).toLocaleTimeString();

    return (
      <div className="max-w-lg mx-auto">
        <div
          id="visit-result"
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8"
          tabIndex={-1}
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <div className="text-center">
            {/* Success Icon */}
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <Icons.CheckCircle
                className="h-12 w-12 text-green-600 dark:text-green-400"
                aria-hidden="true"
              />
            </div>

            {/* Success Message */}
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome!</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">Check-in successful</p>

            {/* Member Info */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Member</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {visit.visit.member.firstName} {visit.visit.member.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Check-in Time</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {checkInTime}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {visit.visit.gym.name}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <Button onClick={onReturnToScan} className="w-full" size="lg">
              <Icons.ArrowLeft className="h-5 w-5 mr-2" />
              Scan Next Member
            </Button>

            {/* Auto-return countdown */}
            <p className="text-lg text-gray-500 dark:text-gray-400 mt-4" aria-live="polite">
              Returning to scan in {countdown} seconds...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'error') {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="text-center">
            {/* Error Icon */}
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <Icons.XCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
            </div>

            {/* Error Message */}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Check-in Failed
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
              Unable to complete check-in
            </p>

            {/* Error Details */}
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800 dark:text-red-200">
                {error || 'An unexpected error occurred'}
              </p>
            </div>

            {/* Common Issues */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6 text-left">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Common Issues:
              </h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Member ID not found</li>
                <li>• Membership expired or inactive</li>
                <li>• Already checked in</li>
                <li>• Invalid QR code format</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button onClick={onReturnToScan} className="w-full" size="lg">
                <Icons.RotateCcw className="h-5 w-5 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
