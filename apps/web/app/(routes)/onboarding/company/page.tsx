"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../lib/auth/context';
import { apiClient, isAPIError } from '../../../../lib/api/client';
import { Icons } from '../../../../lib/icons/registry';

interface CompanyFormData {
  name: string;
  rfc: string;
  billingEmail: string;
  timezone: string;
  industry: string;
}

const timezones = [
  { value: 'America/Mexico_City', label: 'Ciudad de México (UTC-6)' },
  { value: 'America/Tijuana', label: 'Tijuana (UTC-8)' },
  { value: 'America/Mazatlan', label: 'Mazatlán (UTC-7)' },
  { value: 'America/Cancun', label: 'Cancún (UTC-5)' },
];

const industries = [
  { value: 'fitness', label: 'Fitness y Gimnasios' },
  { value: 'wellness', label: 'Bienestar y Spa' },
  { value: 'sports', label: 'Deportes y Recreación' },
  { value: 'healthcare', label: 'Salud y Medicina' },
  { value: 'corporate', label: 'Bienestar Corporativo' },
  { value: 'other', label: 'Otro' },
];

export default function CompanyOnboardingPage() {
  const router = useRouter();
  const { user, refreshAuth } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<CompanyFormData>({
    name: '',
    rfc: '',
    billingEmail: user?.email || '',
    timezone: 'America/Mexico_City',
    industry: 'fitness',
  });

  // Redirect if user already has a company
  if (user?.company) {
    router.push('/dashboard');
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateStep1 = () => {
    if (!formData.name.trim()) return 'El nombre de la empresa es requerido';
    if (!formData.rfc.trim()) return 'El RFC es requerido';
    if (!/^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/.test(formData.rfc.toUpperCase())) {
      return 'El RFC debe tener el formato correcto (ej: ABC123456XYZ)';
    }
    if (!formData.billingEmail.trim()) return 'El email de facturación es requerido';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.billingEmail)) {
      return 'El email de facturación debe ser válido';
    }
    return null;
  };

  const handleNext = () => {
    const error = validateStep1();
    if (error) {
      setError(error);
      return;
    }
    setError(null);
    setCurrentStep(2);
  };

  const handleBack = () => {
    setCurrentStep(1);
    setError(null);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.companies.create({
        name: formData.name.trim(),
        rfc: formData.rfc.toUpperCase().trim(),
        billingEmail: formData.billingEmail.toLowerCase().trim(),
        timezone: formData.timezone,
        industry: formData.industry,
      });

      if (isAPIError(response)) {
        setError(response.message);
        return;
      }

      // Refresh auth to get updated user with company
      await refreshAuth();

      // Track completion
      if (typeof window !== 'undefined') {
        import('posthog-js').then(({ default: posthog }) => {
          posthog.capture('company.onboarding.completed', {
            companyId: response.company.id,
            industry: formData.industry,
            timezone: formData.timezone,
          });
        });
      }

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      console.error('Company creation error:', err);
      setError(err instanceof Error ? err.message : 'Error al crear la empresa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
            <Icons.Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            Registra tu Empresa
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Configura tu organización en Vigor
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              {currentStep > 1 ? <Icons.Users className="w-4 h-4" /> : '1'}
            </div>
            <div className={`flex-1 h-1 mx-2 ${
              currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-300'
            }`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              {currentStep > 2 ? <Icons.Users className="w-4 h-4" /> : '2'}
            </div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>Datos de Empresa</span>
            <span>Confirmación</span>
          </div>
        </div>

        {/* Step 1: Company Data */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nombre de la Empresa *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="Mi Gimnasio S.A. de C.V."
              />
            </div>

            <div>
              <label htmlFor="rfc" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                RFC *
              </label>
              <input
                id="rfc"
                name="rfc"
                type="text"
                required
                value={formData.rfc}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white uppercase"
                placeholder="ABC123456XYZ"
                maxLength={13}
              />
              <p className="mt-1 text-xs text-gray-500">
                Formato: 3-4 letras + 6 números + 3 caracteres
              </p>
            </div>

            <div>
              <label htmlFor="billingEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email de Facturación *
              </label>
              <input
                id="billingEmail"
                name="billingEmail"
                type="email"
                required
                value={formData.billingEmail}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="facturacion@migimnasio.com"
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <button
              onClick={handleNext}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Continuar
            </button>
          </div>
        )}

        {/* Step 2: Confirmation */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Zona Horaria
              </label>
              <select
                id="timezone"
                name="timezone"
                value={formData.timezone}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {timezones.map(tz => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="industry" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Industria
              </label>
              <select
                id="industry"
                name="industry"
                value={formData.industry}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {industries.map(ind => (
                  <option key={ind.value} value={ind.value}>{ind.label}</option>
                ))}
              </select>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Resumen de la Empresa
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Nombre:</dt>
                  <dd className="text-gray-900 dark:text-white">{formData.name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">RFC:</dt>
                  <dd className="text-gray-900 dark:text-white">{formData.rfc.toUpperCase()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Email:</dt>
                  <dd className="text-gray-900 dark:text-white">{formData.billingEmail}</dd>
                </div>
              </dl>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={handleBack}
                className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Atrás
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creando...
                  </div>
                ) : (
                  'Crear Empresa'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
