'use client';

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { apiClient, isAPIError } from '../../lib/api/client';
import { Button } from '../ui/Button';
import { Icons } from '../../lib/icons/registry';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

interface AddCardDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  memberId?: string;
}

interface AddCardFormProps {
  onClose: () => void;
  onSuccess: () => void;
  memberId?: string;
}

function AddCardForm({ onClose, onSuccess, memberId }: AddCardFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create SetupIntent
      const setupIntentResponse = await apiClient.billing.createSetupIntent(memberId);

      if (isAPIError(setupIntentResponse)) {
        throw new Error(setupIntentResponse.message);
      }

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Confirm SetupIntent with card
      const { error: stripeError, setupIntent } = await stripe.confirmCardSetup(
        setupIntentResponse.clientSecret,
        {
          payment_method: {
            card: cardElement,
          },
        }
      );

      if (stripeError) {
        throw new Error(stripeError.message || 'Failed to save card');
      }

      if (setupIntent?.status === 'succeeded') {
        // Track successful card addition
        if (typeof window !== 'undefined') {
          import('posthog-js').then(({ default: posthog }) => {
            posthog.capture('billing.card_added', {
              setupIntentId: setupIntent.id,
              memberId,
            });
          });
        }

        onSuccess();
      } else {
        throw new Error('Failed to save card');
      }
    } catch (err) {
      console.error('Error adding card:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to add card';
      setError(errorMessage);

      // Track card addition failure
      if (typeof window !== 'undefined') {
        import('posthog-js').then(({ default: posthog }) => {
          posthog.capture('billing.card_add_failed', {
            error: errorMessage,
            memberId,
          });
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Información de la Tarjeta
        </label>
        <div className="p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#374151',
                  '::placeholder': {
                    color: '#9CA3AF',
                  },
                },
                invalid: {
                  color: '#EF4444',
                },
              },
              hidePostalCode: false,
            }}
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <Icons.AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={!stripe || loading} className="flex items-center gap-2">
          {loading && <Icons.Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? 'Guardando...' : 'Guardar Tarjeta'}
        </Button>
      </div>
    </form>
  );
}

export function AddCardDialog({ open, onClose, onSuccess, memberId }: AddCardDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Agregar Tarjeta</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <Icons.X className="h-4 w-4" />
          </Button>
        </div>

        <Elements stripe={stripePromise}>
          <AddCardForm onClose={onClose} onSuccess={onSuccess} memberId={memberId} />
        </Elements>

        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Icons.Shield className="h-3 w-3" />
            <span>Protegido por Stripe. Tu información está segura.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
