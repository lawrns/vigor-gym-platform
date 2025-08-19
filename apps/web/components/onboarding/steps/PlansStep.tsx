'use client';

import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const planSchema = z.object({
  name: z.enum(['Basic', 'Pro', 'VIP'], { required_error: 'Selecciona un tipo de plan' }),
  priceMxnCents: z.number().int().min(0, 'El precio debe ser mayor a 0'),
  billing: z.enum(['monthly', 'quarterly', 'yearly']).default('monthly'),
  features: z.array(z.string()).optional(),
});

const plansSchema = z.object({
  plans: z.array(planSchema).min(1, 'Agrega al menos un plan'),
});

type PlansFormData = z.infer<typeof plansSchema>;

interface PlansStepProps {
  initialData?: PlansFormData;
  onSubmit: (data: PlansFormData) => void;
  isSubmitting: boolean;
}

const planTemplates = {
  Basic: {
    name: 'Basic' as const,
    priceMxnCents: 89900, // $899
    billing: 'monthly' as const,
    features: ['Acceso al gimnasio', 'Casilleros', 'Duchas'],
  },
  Pro: {
    name: 'Pro' as const,
    priceMxnCents: 129900, // $1,299
    billing: 'monthly' as const,
    features: [
      'Todo lo de Basic',
      'Clases grupales',
      'Área de pesas',
      'Entrenador personal (1 sesión)',
    ],
  },
  VIP: {
    name: 'VIP' as const,
    priceMxnCents: 189900, // $1,899
    billing: 'monthly' as const,
    features: [
      'Todo lo de Pro',
      'Acceso 24/7',
      'Spa y sauna',
      'Entrenador personal (4 sesiones)',
      'Nutricionista',
    ],
  },
};

const billingLabels = {
  monthly: 'Mensual',
  quarterly: 'Trimestral',
  yearly: 'Anual',
};

export function PlansStep({ initialData, onSubmit, isSubmitting }: PlansStepProps) {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<PlansFormData>({
    resolver: zodResolver(plansSchema),
    defaultValues: {
      plans: initialData?.plans || [planTemplates.Basic],
    },
    mode: 'onChange',
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'plans',
  });

  const addPlan = (template: keyof typeof planTemplates) => {
    append(planTemplates[template]);
  };

  const removePlan = (index: number) => {
    remove(index);
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(cents / 100);
  };

  const handlePriceChange = (index: number, value: string) => {
    const numericValue = parseFloat(value) || 0;
    setValue(`plans.${index}.priceMxnCents`, Math.round(numericValue * 100), {
      shouldValidate: true,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Plan Templates */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-3">
          Plantillas Recomendadas
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Object.entries(planTemplates).map(([key, template]) => (
            <button
              key={key}
              type="button"
              onClick={() => addPlan(key as keyof typeof planTemplates)}
              className="text-left p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
            >
              <div className="font-medium text-gray-900 dark:text-white">{template.name}</div>
              <div className="text-sm text-blue-600 dark:text-blue-400">
                {formatPrice(template.priceMxnCents)}/mes
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {template.features.length} características
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Plans List */}
      <div className="space-y-4">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                Plan {index + 1}
              </h4>
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePlan(index)}
                  className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Plan Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo de Plan *
                </label>
                <select
                  {...register(`plans.${index}.name`)}
                  className={`
                    w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    dark:bg-gray-700 dark:border-gray-600 dark:text-white
                    ${errors.plans?.[index]?.name ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'}
                  `}
                >
                  <option value="">Seleccionar...</option>
                  <option value="Basic">Basic</option>
                  <option value="Pro">Pro</option>
                  <option value="VIP">VIP</option>
                </select>
                {errors.plans?.[index]?.name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.plans[index]?.name?.message}
                  </p>
                )}
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Precio (MXN) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500 dark:text-gray-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="899.00"
                    defaultValue={(watch(`plans.${index}.priceMxnCents`) || 0) / 100}
                    onChange={e => handlePriceChange(index, e.target.value)}
                    className={`
                      w-full pl-8 pr-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                      dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400
                      ${errors.plans?.[index]?.priceMxnCents ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'}
                    `}
                  />
                </div>
                {errors.plans?.[index]?.priceMxnCents && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.plans[index]?.priceMxnCents?.message}
                  </p>
                )}
              </div>

              {/* Billing */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Facturación
                </label>
                <select
                  {...register(`plans.${index}.billing`)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  {Object.entries(billingLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Features */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Características (opcional)
              </label>
              <textarea
                {...register(`plans.${index}.features`)}
                rows={3}
                placeholder="Una característica por línea&#10;Ej: Acceso al gimnasio&#10;Clases grupales&#10;Entrenador personal"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                onChange={e => {
                  const features = e.target.value.split('\n').filter(f => f.trim());
                  setValue(`plans.${index}.features`, features, { shouldValidate: true });
                }}
                defaultValue={watch(`plans.${index}.features`)?.join('\n') || ''}
              />
            </div>

            {/* Preview */}
            <div className="mt-4 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {watch(`plans.${index}.name`) || 'Plan Sin Nombre'}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {billingLabels[watch(`plans.${index}.billing`) || 'monthly']}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {formatPrice(watch(`plans.${index}.priceMxnCents`) || 0)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    por{' '}
                    {watch(`plans.${index}.billing`) === 'yearly'
                      ? 'año'
                      : watch(`plans.${index}.billing`) === 'quarterly'
                        ? 'trimestre'
                        : 'mes'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Errors */}
      {errors.plans && (
        <p className="text-sm text-red-600 dark:text-red-400">{errors.plans.message}</p>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className={`
            px-6 py-2 rounded-lg font-medium transition-all
            ${
              isValid && !isSubmitting
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }
          `}
        >
          {isSubmitting ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Guardando...</span>
            </div>
          ) : (
            'Continuar'
          )}
        </button>
      </div>
    </form>
  );
}
