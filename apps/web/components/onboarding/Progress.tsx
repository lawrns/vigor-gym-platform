'use client';

interface OnboardingProgressProps {
  currentStep: string;
  completedSteps: {
    brand: boolean;
    locations: boolean;
    plans: boolean;
    staff: boolean;
  };
  progress: number;
}

const steps = [
  { id: 'brand', title: 'Marca', icon: '🎨' },
  { id: 'locations', title: 'Ubicaciones', icon: '📍' },
  { id: 'plans', title: 'Planes', icon: '💳' },
  { id: 'staff', title: 'Personal', icon: '👥' },
];

export function OnboardingProgress({
  currentStep,
  completedSteps,
  progress,
}: OnboardingProgressProps) {
  return (
    <div className="mb-8">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Progreso de configuración
          </span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{progress}%</span>
        </div>
        <div
          className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Onboarding progress: ${progress}% complete`}
        >
          <div
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = completedSteps[step.id as keyof typeof completedSteps];
          const isCurrent = step.id === currentStep;
          const isUpcoming = !isCompleted && !isCurrent;

          return (
            <div key={step.id} className="flex flex-col items-center">
              {/* Step Circle */}
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300
                  ${
                    isCompleted
                      ? 'bg-green-500 text-white shadow-lg'
                      : isCurrent
                        ? 'bg-blue-500 text-white shadow-lg ring-4 ring-blue-200 dark:ring-blue-800'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }
                `}
              >
                {isCompleted ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <span>{step.icon}</span>
                )}
              </div>

              {/* Step Label */}
              <div className="mt-2 text-center">
                <div
                  className={`
                    text-xs font-medium transition-colors duration-300
                    ${
                      isCompleted
                        ? 'text-green-600 dark:text-green-400'
                        : isCurrent
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-500 dark:text-gray-400'
                    }
                  `}
                >
                  {step.title}
                </div>
                {isCompleted && (
                  <div className="text-xs text-green-500 dark:text-green-400 mt-1">
                    ✓ Completado
                  </div>
                )}
                {isCurrent && (
                  <div className="text-xs text-blue-500 dark:text-blue-400 mt-1">En progreso</div>
                )}
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={`
                    absolute top-5 left-1/2 w-full h-0.5 -z-10 transition-colors duration-300
                    ${
                      isCompleted
                        ? 'bg-green-300 dark:bg-green-600'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }
                  `}
                  style={{
                    transform: 'translateX(50%)',
                    width: 'calc(100% / 4 - 2.5rem)',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Progress Summary */}
      <div className="mt-6 text-center">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {progress === 100 ? (
            <span className="text-green-600 dark:text-green-400 font-medium">
              🎉 ¡Configuración completada! Redirigiendo al dashboard...
            </span>
          ) : (
            <>
              {Object.values(completedSteps).filter(Boolean).length} de {steps.length} pasos
              completados
            </>
          )}
        </div>
      </div>
    </div>
  );
}
