"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth/context';
import { apiClient, isAPIError } from '../../../lib/api/client';
import { Plan } from '../../../lib/api/types';
import { Icons } from '../../../lib/icons/registry';

export default function PlanesPage() {
  const router = useRouter();
  const { user, status } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    // IMPORTANT: Do not redirect authenticated users off this page.
    // /planes is a public route that should be accessible to both authenticated and unauthenticated users.
    // If you need onboarding checks, only apply them on protected areas, not here.

    // Track page view for analytics
    if (typeof window !== 'undefined') {
      import('posthog-js').then(({ default: posthog }) => {
        posthog.capture('route.view', {
          path: '/planes',
          authed: !!user,
          routeType: 'public'
        });
      });
    }

    // Load plans when auth status is determined (not loading)
    if (status !== 'loading') {
      loadPlans();
    }
  }, [user, status]);

  const loadPlans = async () => {
    try {
      setLoading(true);

      // Use different endpoints based on authentication status
      const response = user
        ? await apiClient.plans.list()        // Authenticated endpoint
        : await apiClient.plans.listPublic();  // Public endpoint

      if (isAPIError(response)) {
        setError(response.message);
        return;
      }

      setPlans(response.plans);
    } catch (err) {
      console.error('Error loading plans:', err);
      if (err instanceof Error && err.message.includes('Network request failed')) {
        setError('No se puede conectar con el servidor. Verifica que el API esté ejecutándose.');
      } else if (err instanceof Error && err.message.includes('Authentication required')) {
        // If auth fails for authenticated user, fall back to public endpoint
        if (user) {
          try {
            const publicResponse = await apiClient.plans.listPublic();
            if (!isAPIError(publicResponse)) {
              setPlans(publicResponse.plans);
              setError(null);
              return;
            }
          } catch (fallbackErr) {
            console.error('Fallback to public plans also failed:', fallbackErr);
          }
        }
        setError('Error de autenticación. Mostrando planes básicos.');
      } else {
        setError('Error al cargar los planes');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (planId: string) => {
    if (selectedPlan === planId) return; // Prevent double-clicks

    setSelectedPlan(planId);

    try {
      // Track analytics
      if (typeof window !== 'undefined') {
        import('posthog-js').then(({ default: posthog }) => {
          const plan = plans.find(p => p.id === planId);
          posthog.capture('plan.select', {
            plan: plan?.code,
            planName: plan?.name,
            placement: 'plans_page',
            companyId: user?.company?.id,
          });
        });
      }

      // Redirect to checkout with plan ID
      router.push(`/checkout?planId=${planId}`);
    } catch (err) {
      console.error('Error selecting plan:', err);
      setError('Error al seleccionar el plan');
      setSelectedPlan(null);
    }
  };

  const formatPrice = (price: number | null) => {
    if (price === null) return 'Precio personalizado';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando planes...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show static plans for unauthenticated users
  if (!user) {
    const staticPlans = [
      {
        id: 'tp-on',
        name: 'TP ON',
        description: 'Plan básico para comenzar tu rutina',
        price: 'Desde $299',
        features: ['Acceso a gimnasios', 'Clases grupales básicas', 'App móvil'],
        popular: false
      },
      {
        id: 'tp-pro',
        name: 'TP PRO',
        description: 'El plan más popular con beneficios adicionales',
        price: 'Desde $499',
        features: ['Todo lo de TP ON', 'Clases premium', 'Entrenador personal', 'Nutrición'],
        popular: true
      },
      {
        id: 'tp-plus',
        name: 'TP+',
        description: 'Acceso completo a toda la red',
        price: 'Desde $799',
        features: ['Todo lo de TP PRO', 'Acceso ilimitado', 'Servicios wellness', 'Prioridad en reservas'],
        popular: false
      }
    ];

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl">
              Elige tu Plan
            </h1>
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
              Encuentra el plan perfecto para tu estilo de vida
            </p>
            <div className="mt-8">
              <button
                onClick={() => router.push('/login?next=%2Fplanes')}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Iniciar Sesión para Contratar
              </button>
            </div>
          </div>

          {/* Static Plans Grid */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {staticPlans.map((plan) => (
              <div
                key={plan.id}
                className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 transition-all duration-200 ${
                  plan.popular
                    ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Más Popular
                    </span>
                  </div>
                )}

                <div className="p-8">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {plan.name}
                    </h3>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                      {plan.description}
                    </p>
                    <div className="mt-4">
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">
                        {plan.price}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">/mes</span>
                    </div>
                  </div>

                  <ul className="mt-8 space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <Icons.Check className="h-5 w-5 text-green-500 mr-3" />
                        <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8">
                    <button
                      onClick={() => router.push('/login?next=%2Fplanes')}
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                        plan.popular
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      Seleccionar Plan
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <Icons.Activity className="h-12 w-12 text-red-500 mx-auto" />
            <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
              Error al cargar planes
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">{error}</p>
            <button
              onClick={loadPlans}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl">
            Elige tu Plan
          </h1>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
            Selecciona el plan perfecto para {user?.company?.name || 'tu empresa'}
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <div
              key={plan.id}
              className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 transition-all duration-200 ${
                plan.code === 'TP_PRO' 
                  ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
              }`}
            >
              {/* Popular Badge */}
              {plan.code === 'TP_PRO' && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Más Popular
                  </span>
                </div>
              )}

              <div className="p-8">
                {/* Plan Header */}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {plan.name}
                  </h3>
                  <div className="mt-4">
                    <span className="text-4xl font-extrabold text-gray-900 dark:text-white">
                      {formatPrice(plan.priceMXNFrom)}
                    </span>
                    {plan.priceMXNFrom && (
                      <span className="text-gray-600 dark:text-gray-400 ml-2">
                        /{plan.billingCycle === 'monthly' ? 'mes' : plan.billingCycle}
                      </span>
                    )}
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Icons.Users className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={selectedPlan === plan.id}
                  className={`w-full py-3 px-6 rounded-lg font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    plan.code === 'TP_PRO'
                      ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:bg-blue-400'
                      : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 focus:ring-gray-500 disabled:bg-gray-400'
                  } disabled:cursor-not-allowed`}
                  data-cta={plan.code === 'TP_PRO' ? 'primary' : 'secondary'}
                >
                  {selectedPlan === plan.id ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Procesando...
                    </div>
                  ) : (
                    `Elegir ${plan.name}`
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
            Preguntas Frecuentes
          </h2>
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                ¿Puedo cambiar de plan después?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Sí, puedes actualizar o cambiar tu plan en cualquier momento desde tu panel de administración.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                ¿Hay período de prueba?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Todos los planes incluyen un período de prueba de 14 días para que puedas evaluar la plataforma.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                ¿Qué métodos de pago aceptan?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Aceptamos tarjetas de crédito y débito, transferencias bancarias y pagos con Mercado Pago.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
