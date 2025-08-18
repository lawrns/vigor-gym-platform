'use client';

import { useState } from 'react';
import { BrandStep } from './steps/BrandStep';
import { LocationsStep } from './steps/LocationsStep';
import { PlansStep } from './steps/PlansStep';
import { StaffStep } from './steps/StaffStep';

interface OnboardingWizardProps {
  currentStep: string;
  onStepComplete: (step: string, data: any) => void;
  onStepChange: (step: string) => void;
  initialData: any;
  isSubmitting: boolean;
}

const steps = [
  {
    id: 'brand',
    title: 'Marca y Estilo',
    description: 'Configura el nombre y la identidad visual de tu gimnasio',
    icon: '🎨',
  },
  {
    id: 'locations',
    title: 'Ubicaciones',
    description: 'Agrega las ubicaciones de tu gimnasio',
    icon: '📍',
  },
  {
    id: 'plans',
    title: 'Planes de Membresía',
    description: 'Define los planes y precios para tus miembros',
    icon: '💳',
  },
  {
    id: 'staff',
    title: 'Personal',
    description: 'Agrega a tu equipo de trabajo',
    icon: '👥',
  },
];

export function OnboardingWizard({
  currentStep,
  onStepComplete,
  onStepChange,
  initialData,
  isSubmitting,
}: OnboardingWizardProps) {
  const [stepData, setStepData] = useState<Record<string, any>>(initialData);

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);
  const currentStepInfo = steps[currentStepIndex];

  const handleStepSubmit = (data: any) => {
    setStepData(prev => ({
      ...prev,
      [currentStep]: data,
    }));
    onStepComplete(currentStep, data);
  };

  const canNavigateToStep = (stepId: string): boolean => {
    const stepIndex = steps.findIndex(step => step.id === stepId);
    const currentIndex = steps.findIndex(step => step.id === currentStep);
    
    // Can navigate to current step or previous steps
    return stepIndex <= currentIndex;
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'brand':
        return (
          <BrandStep
            initialData={stepData.brand}
            onSubmit={handleStepSubmit}
            isSubmitting={isSubmitting}
          />
        );
      case 'locations':
        return (
          <LocationsStep
            initialData={stepData.locations}
            onSubmit={handleStepSubmit}
            isSubmitting={isSubmitting}
          />
        );
      case 'plans':
        return (
          <PlansStep
            initialData={stepData.plans}
            onSubmit={handleStepSubmit}
            isSubmitting={isSubmitting}
          />
        );
      case 'staff':
        return (
          <StaffStep
            initialData={stepData.staff}
            onSubmit={handleStepSubmit}
            isSubmitting={isSubmitting}
            isLastStep={true}
          />
        );
      default:
        return <div>Paso no encontrado</div>;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* Step Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8 px-6 py-4" aria-label="Onboarding steps" role="tablist">
          {steps.map((step, index) => {
            const isActive = step.id === currentStep;
            const isCompleted = index < currentStepIndex;
            const canNavigate = canNavigateToStep(step.id);

            return (
              <button
                key={step.id}
                onClick={() => canNavigate && onStepChange(step.id)}
                disabled={!canNavigate}
                role="tab"
                aria-selected={isActive}
                aria-controls={`step-panel-${step.id}`}
                id={`step-tab-${step.id}`}
                aria-label={`${step.title}: ${isCompleted ? 'completed' : isActive ? 'current step' : 'not started'}`}
                className={`
                  flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  ${isActive
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : isCompleted
                    ? 'border-green-500 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300'
                    : canNavigate
                    ? 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                    : 'border-transparent text-gray-300 dark:text-gray-600 cursor-not-allowed'
                  }
                `}
              >
                <span className="text-lg">{step.icon}</span>
                <span>{step.title}</span>
                {isCompleted && (
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Step Content */}
      <div
        className="p-6"
        role="tabpanel"
        id={`step-panel-${currentStep}`}
        aria-labelledby={`step-tab-${currentStep}`}
      >
        {/* Step Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <span className="text-2xl" aria-hidden="true">{currentStepInfo?.icon}</span>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {currentStepInfo?.title}
            </h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            {currentStepInfo?.description}
          </p>
        </div>

        {/* Step Form */}
        <div className="max-w-2xl">
          {renderStepContent()}
        </div>
      </div>

      {/* Step Indicator */}
      <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>
            Paso {currentStepIndex + 1} de {steps.length}
          </span>
          <span>
            {Math.round(((currentStepIndex + 1) / steps.length) * 100)}% completado
          </span>
        </div>
        <div className="mt-2 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
