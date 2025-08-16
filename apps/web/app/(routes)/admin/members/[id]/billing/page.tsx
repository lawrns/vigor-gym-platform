"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../../../lib/auth/context';
import { apiClient, isAPIError } from '../../../../../../lib/api/client';
import { PaymentMethod } from '../../../../../../lib/api/types';
import { Button } from '../../../../../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../../../../../components/ui/card';
import { Icons } from '../../../../../../lib/icons/registry';
import { AddCardDialog } from '../../../../../../components/billing/AddCardDialog';

interface MemberBillingState {
  status: 'loading' | 'ready' | 'error';
  paymentMethods: PaymentMethod[];
  error?: string;
}

export default function MemberBillingPage() {
  const params = useParams();
  const router = useRouter();
  const { user, status: authStatus } = useAuth();
  const [state, setState] = useState<MemberBillingState>({
    status: 'loading',
    paymentMethods: [],
  });
  const [showAddCard, setShowAddCard] = useState(false);

  const memberId = params.id as string;

  useEffect(() => {
    if (authStatus === 'loading') return;
    
    if (!user) {
      router.push('/login');
      return;
    }

    loadPaymentMethods();
  }, [user, authStatus, router]);

  const loadPaymentMethods = async () => {
    try {
      setState(prev => ({ ...prev, status: 'loading' }));
      
      const response = await apiClient.billing.getPaymentMethods();
      
      if (isAPIError(response)) {
        throw new Error(response.message);
      }

      setState({
        status: 'ready',
        paymentMethods: response.paymentMethods,
      });
    } catch (error) {
      console.error('Error loading payment methods:', error);
      setState({
        status: 'error',
        paymentMethods: [],
        error: error instanceof Error ? error.message : 'Failed to load payment methods',
      });
    }
  };

  const handleSetDefault = async (paymentMethodId: string) => {
    try {
      const response = await apiClient.billing.setDefaultPaymentMethod(paymentMethodId);

      if (isAPIError(response)) {
        throw new Error(response.message);
      }

      // Refresh payment methods
      await loadPaymentMethods();
    } catch (error) {
      console.error('Error setting default payment method:', error);
      // You could add a toast notification here
    }
  };

  const handleAssignToMember = async (paymentMethodId: string) => {
    try {
      const response = await apiClient.billing.updatePaymentMethod(paymentMethodId, { memberId });

      if (isAPIError(response)) {
        throw new Error(response.message);
      }

      // Refresh payment methods
      await loadPaymentMethods();
    } catch (error) {
      console.error('Error assigning payment method to member:', error);
      // You could add a toast notification here
    }
  };

  const handleDeletePaymentMethod = async (paymentMethodId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este método de pago?')) {
      return;
    }

    try {
      const response = await apiClient.billing.deletePaymentMethod(paymentMethodId);

      if (isAPIError(response)) {
        throw new Error(response.message);
      }

      // Refresh payment methods
      await loadPaymentMethods();
    } catch (error) {
      console.error('Error deleting payment method:', error);
      // You could add a toast notification here
    }
  };

  const handleCreateSubscription = async (paymentMethodId: string) => {
    try {
      // For demo purposes, we'll use a default plan ID
      // In a real app, you'd let the user select a plan
      const response = await apiClient.billing.createSubscription({
        planId: 'default-plan-id', // This should come from plan selection
        paymentMethodId,
        memberId,
      });

      if (isAPIError(response)) {
        throw new Error(response.message);
      }

      console.log('Subscription created:', response);
      // You could redirect to subscription management or show success message
    } catch (error) {
      console.error('Error creating subscription:', error);
      // You could add a toast notification here
    }
  };

  const handleOpenPortal = async () => {
    try {
      const response = await apiClient.billing.createPortalSession();
      
      if (isAPIError(response)) {
        throw new Error(response.message);
      }

      window.location.href = response.url;
    } catch (error) {
      console.error('Error opening portal:', error);
      // You could add a toast notification here
    }
  };

  if (authStatus === 'loading' || state.status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
            <Icons.CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400 animate-pulse" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Cargando información de facturación...
          </h2>
        </div>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900 mb-4">
            <Icons.AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Error al cargar facturación
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {state.error}
          </p>
          <Button onClick={loadPaymentMethods}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
            >
              <Icons.ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Facturación del Miembro
            </h1>
          </div>
        </div>

        {/* Payment Methods Section */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Métodos de Pago
              </h2>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowAddCard(true)}
                  className="flex items-center gap-2"
                >
                  <Icons.Plus className="h-4 w-4" />
                  Agregar Tarjeta
                </Button>
                <Button
                  variant="outline"
                  onClick={handleOpenPortal}
                  className="flex items-center gap-2"
                >
                  <Icons.ExternalLink className="h-4 w-4" />
                  Portal de Stripe
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {state.paymentMethods.length === 0 ? (
              <div className="text-center py-8">
                <Icons.CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No hay métodos de pago
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Agrega una tarjeta para comenzar a procesar pagos.
                </p>
                <Button onClick={() => setShowAddCard(true)}>
                  Agregar Primera Tarjeta
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {state.paymentMethods.map((pm) => (
                  <div
                    key={pm.id}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Icons.CreditCard className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {pm.brand?.toUpperCase()} •••• {pm.last4}
                          </span>
                          {pm.isDefault && (
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                              Predeterminada
                            </span>
                          )}
                          {pm.memberId === memberId && (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                              Asignada
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {pm.type === 'card' ? 'Tarjeta de crédito/débito' : pm.type}
                          {pm.member && pm.memberId !== memberId && (
                            <span className="ml-2">
                              (Asignada a {pm.member.firstName} {pm.member.lastName})
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!pm.isDefault && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetDefault(pm.id)}
                        >
                          Hacer Predeterminada
                        </Button>
                      )}
                      {pm.memberId !== memberId && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAssignToMember(pm.id)}
                        >
                          Asignar a Miembro
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeletePaymentMethod(pm.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Icons.Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Card Dialog */}
        <AddCardDialog
          open={showAddCard}
          onClose={() => setShowAddCard(false)}
          onSuccess={() => {
            setShowAddCard(false);
            loadPaymentMethods();
          }}
          memberId={memberId}
        />
      </div>
    </div>
  );
}
