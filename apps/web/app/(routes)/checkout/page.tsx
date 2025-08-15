"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../lib/auth/context';
import { apiClient, isAPIError } from '../../../lib/api/client';
import { Membership } from '../../../lib/api/types';
import { Icons } from '../../../lib/icons/registry';

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [membership, setMembership] = useState<Membership | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingProvider, setProcessingProvider] = useState<string | null>(null);

  const membershipId = searchParams.get('membershipId');

  useEffect(() => {
    if (!membershipId) {
      setError('ID de membresía no proporcionado');
      setLoading(false);
      return;
    }

    loadMembership();
  }, [membershipId]);

  const loadMembership = async () => {
    if (!membershipId) return;

    try {
      setLoading(true);
      const response = await apiClient.memberships.get(membershipId);
      
      if (isAPIError(response)) {
        setError(response.message);
        return;
      }

      if (response.membership.status !== 'draft') {
        setError('Esta membresía ya ha sido procesada');
        return;
      }

      setMembership(response.membership);
    } catch (err) {
      console.error('Error loading membership:', err);
      setError('Error al cargar la membresía');
    } finally {
      setLoading(false);
    }
  };

  const handleProviderSelect = async (provider: 'stripe' | 'mp') => {
    if (!membership || processingProvider) return;

    setProcessingProvider(provider);

    try {
      // Track analytics
      if (typeof window !== 'undefined') {
        import('posthog-js').then(({ default: posthog }) => {
          posthog.capture('checkout.start', {
            provider,
            planCode: membership.plan?.code,
            membershipId: membership.id,
            companyId: user?.company?.id,
          });
        });
      }

      // For now, simulate the checkout process
      // In a real implementation, this would call the billing API
      console.log(`Starting ${provider} checkout for membership ${membership.id}`);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For demo purposes, redirect to a success page
      router.push(`/checkout/success?membershipId=${membership.id}&provider=${provider}`);
      
    } catch (err) {
      console.error('Error starting checkout:', err);
      setError('Error al iniciar el proceso de pago');
      setProcessingProvider(null);
    }
  };

  const formatPrice = (price: number | null) => {
    if (price === null) return 'Precio personalizado';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(price / 100); // Convert from cents
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando información de pago...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !membership) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="text-center">
            <Icons.Activity className="h-12 w-12 text-red-500 mx-auto" />
            <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
              Error en el Checkout
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {error || 'Membresía no encontrada'}
            </p>
            <button
              onClick={() => router.push('/planes')}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Volver a Planes
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <Icons.Users className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            Finalizar Compra
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Completa tu suscripción a Vigor
          </p>
        </div>

        {/* Order Summary */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-8">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Resumen del Pedido
            </h3>
          </div>
          <div className="px-6 py-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  {membership.plan?.name}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Plan para {user?.company?.name}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatPrice(membership.plan?.priceMxnCents || null)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  por mes
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Método de Pago
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Selecciona tu método de pago preferido
            </p>
          </div>
          <div className="px-6 py-4 space-y-4">
            {/* Stripe Option */}
            <button
              onClick={() => handleProviderSelect('stripe')}
              disabled={!!processingProvider}
              className="w-full flex items-center justify-between p-4 border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center">
                <div className="w-12 h-8 bg-blue-600 rounded flex items-center justify-center mr-4">
                  <span className="text-white text-xs font-bold">STRIPE</span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Tarjeta de Crédito/Débito
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Visa, Mastercard, American Express
                  </p>
                </div>
              </div>
              {processingProvider === 'stripe' && (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              )}
            </button>

            {/* Mercado Pago Option */}
            <button
              onClick={() => handleProviderSelect('mp')}
              disabled={!!processingProvider}
              className="w-full flex items-center justify-between p-4 border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center">
                <div className="w-12 h-8 bg-blue-500 rounded flex items-center justify-center mr-4">
                  <span className="text-white text-xs font-bold">MP</span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Mercado Pago
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Tarjetas, transferencias, efectivo
                  </p>
                </div>
              </div>
              {processingProvider === 'mp' && (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              )}
            </button>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            🔒 Tus datos están protegidos con cifrado SSL de 256 bits
          </p>
        </div>

        {/* Back Button */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/planes')}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            ← Volver a planes
          </button>
        </div>
      </div>
    </div>
  );
}
