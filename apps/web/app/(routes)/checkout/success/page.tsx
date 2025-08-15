"use client";

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../../lib/auth/context';
import { Icons } from '../../../../lib/icons/registry';

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const membershipId = searchParams.get('membershipId');
  const provider = searchParams.get('provider');

  useEffect(() => {
    // Track successful checkout
    if (typeof window !== 'undefined' && membershipId && provider) {
      import('posthog-js').then(({ default: posthog }) => {
        posthog.capture('checkout.success', {
          membershipId,
          provider,
          companyId: user?.company?.id,
        });
      });
    }
  }, [membershipId, provider, user?.company?.id]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center">
          {/* Success Icon */}
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <Icons.Users className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>

          {/* Success Message */}
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            ¡Pago Exitoso!
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Tu suscripción ha sido activada correctamente
          </p>

          {/* Details */}
          <div className="mt-8 bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Detalles de la Suscripción
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Empresa:</span>
                <span className="text-gray-900 dark:text-white">{user?.company?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Método de pago:</span>
                <span className="text-gray-900 dark:text-white">
                  {provider === 'stripe' ? 'Tarjeta de Crédito' : 'Mercado Pago'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">ID de Membresía:</span>
                <span className="text-gray-900 dark:text-white font-mono text-xs">
                  {membershipId?.slice(0, 8)}...
                </span>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">
              ¿Qué sigue?
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 text-left">
              <li>• Recibirás un email de confirmación</li>
              <li>• Tu plan estará activo inmediatamente</li>
              <li>• Puedes comenzar a usar todas las funciones</li>
              <li>• El soporte técnico está disponible 24/7</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 space-y-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Ir al Dashboard
            </button>
            <button
              onClick={() => router.push('/planes')}
              className="w-full flex justify-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Ver Otros Planes
            </button>
          </div>

          {/* Support */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              ¿Necesitas ayuda? Contacta a nuestro{' '}
              <a href="mailto:soporte@vigor.mx" className="text-blue-600 dark:text-blue-400 hover:underline">
                equipo de soporte
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
