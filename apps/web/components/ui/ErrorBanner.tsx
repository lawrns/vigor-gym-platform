import { Icons } from '../../lib/icons/registry';

interface ErrorBannerProps {
  message?: string;
  className?: string;
  testId?: string;
}

/**
 * Standardized error banner component for displaying error messages
 * with consistent styling and accessibility features.
 */
export function ErrorBanner({ 
  message, 
  className = '', 
  testId = 'kpi-error-banner' 
}: ErrorBannerProps) {
  if (!message) return null;

  return (
    <div 
      role="alert"
      data-testid={testId}
      className={`flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg ${className}`}
    >
      <Icons.AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm text-red-800 dark:text-red-200 font-medium">
          {message}
        </p>
      </div>
    </div>
  );
}
