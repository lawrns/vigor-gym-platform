'use client';

import { useEffect, useState, Suspense } from 'react';

export const dynamic = 'force-dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../lib/auth/context';
import { apiClient, isAPIError } from '../../../lib/api/client';
import { Icons } from '../../../lib/icons/registry';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, status } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const planId = searchParams.get('planId');

  useEffect(() => {
    if (status === 'loading') return;

    if (!user) {
      // Redirect to login with return URL
      const returnUrl = encodeURIComponent(`/checkout?planId=${planId}`);
      router.push(`/login?next=${returnUrl}`);
      return;
    }

    if (!planId) {
      router.push('/planes');
      return;
    }

    // Auto-start checkout process
    handleCheckout();
  }, [user, status, planId, router]);

  const handleCheckout = async () => {
    if (!planId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.billing.createCheckoutSession(planId);

      if (isAPIError(response)) {
        throw new Error(response.message);
      }

      // Track checkout start
      if (typeof window !== 'undefined') {
        import('posthog-js').then(({ default: posthog }) => {
          posthog.capture('checkout.start', {
            planId,
            provider: response.provider,
            companyId: user?.company?.id,
          });
        });
      }

      // Redirect to payment provider
      window.location.href = response.url;
    } catch (err) {
      console.error('Checkout error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to start checkout';
      setError(errorMessage);

      // Track checkout failure
      if (typeof window !== 'undefined') {
        import('posthog-js').then(({ default: posthog }) => {
          posthog.capture('checkout.failed', {
            planId,
            error: errorMessage,
            companyId: user?.company?.id,
          });
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
            <Icons.CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400 animate-pulse" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Procesando pago...
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Te estamos redirigiendo al procesador de pagos seguro.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900 mb-4">
            <Icons.AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Error en el Checkout
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={handleCheckout}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Intentar de nuevo
            </button>
            <button
              onClick={() => router.push('/planes')}
              className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Volver a Planes
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
