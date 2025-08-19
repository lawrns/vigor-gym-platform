'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingWizard } from '../../../components/onboarding/Wizard';
import { OnboardingProgress } from '../../../components/onboarding/Progress';
import { useAuth } from '../../../hooks/useAuth';

interface OnboardingStatus {
  completed: {
    brand: boolean;
    locations: boolean;
    plans: boolean;
    staff: boolean;
  };
  progress: number;
  nextStep: string | null;
  canComplete: boolean;
}

interface OnboardingData {
  brand?: {
    gymName: string;
    logoUrl?: string;
    primaryColor?: string;
  };
  locations?: {
    locations: Array<{
      name: string;
      address: string;
      capacity: number;
      hours: Record<string, { open: string; close: string }>;
    }>;
  };
  plans?: {
    plans: Array<{
      name: 'Basic' | 'Pro' | 'VIP';
      priceMxnCents: number;
      billing: 'monthly' | 'quarterly' | 'yearly';
      features?: string[];
    }>;
  };
  staff?: {
    importMethod: 'CSV' | 'Manual';
    staff?: Array<{
      firstName: string;
      lastName: string;
      email: string;
      role: 'MANAGER' | 'RECEPTIONIST' | 'TRAINER';
      phone?: string;
    }>;
    csvData?: string;
  };
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({});
  const [currentStep, setCurrentStep] = useState<string>('brand');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Load onboarding status
  useEffect(() => {
    if (user) {
      loadOnboardingStatus();
    }
  }, [user]);

  const loadOnboardingStatus = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/onboarding/status');

      if (!response.ok) {
        throw new Error('Failed to load onboarding status');
      }

      const data = await response.json();
      setStatus(data.status);

      // Set current step based on status
      if (data.status.nextStep) {
        setCurrentStep(data.status.nextStep);
      } else if (data.status.canComplete) {
        // All steps completed, redirect to dashboard
        router.push('/dashboard-v2');
        return;
      }
    } catch (err) {
      console.error('Failed to load onboarding status:', err);
      setError('Failed to load onboarding status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStepComplete = (step: string, data: any) => {
    setOnboardingData(prev => ({
      ...prev,
      [step]: data,
    }));

    // Move to next step
    const steps = ['brand', 'locations', 'plans', 'staff'];
    const currentIndex = steps.indexOf(step);

    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    } else {
      // All steps completed, submit onboarding
      submitOnboarding();
    }
  };

  const submitOnboarding = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/onboarding/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(onboardingData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to complete onboarding');
      }

      // Success! Redirect to dashboard
      router.push('/dashboard-v2?onboarding=complete');
    } catch (err) {
      console.error('Failed to submit onboarding:', err);
      setError(err instanceof Error ? err.message : 'Failed to complete onboarding');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStepChange = (step: string) => {
    setCurrentStep(step);
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Configuración Inicial
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Configura tu gimnasio en 4 pasos simples
          </p>
        </div>

        {/* Progress Indicator */}
        {status && (
          <OnboardingProgress
            currentStep={currentStep}
            completedSteps={status.completed}
            progress={status.progress}
          />
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Error en la configuración
                </h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Onboarding Wizard */}
        <OnboardingWizard
          currentStep={currentStep}
          onStepComplete={handleStepComplete}
          onStepChange={handleStepChange}
          initialData={onboardingData}
          isSubmitting={isLoading}
        />

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            ¿Necesitas ayuda? Contacta a nuestro{' '}
            <a href="mailto:soporte@vigor.mx" className="text-blue-600 hover:text-blue-500">
              equipo de soporte
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
