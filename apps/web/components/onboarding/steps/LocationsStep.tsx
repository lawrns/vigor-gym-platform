'use client';

import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const hoursSchema = z.object({
  monday: z.object({ open: z.string(), close: z.string() }),
  tuesday: z.object({ open: z.string(), close: z.string() }),
  wednesday: z.object({ open: z.string(), close: z.string() }),
  thursday: z.object({ open: z.string(), close: z.string() }),
  friday: z.object({ open: z.string(), close: z.string() }),
  saturday: z.object({ open: z.string(), close: z.string() }),
  sunday: z.object({ open: z.string(), close: z.string() }),
});

const locationSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100),
  address: z.string().min(1, 'La dirección es requerida').max(200),
  capacity: z.number().int().min(1, 'Mínimo 1 persona').max(1000, 'Máximo 1000 personas'),
  hours: hoursSchema,
});

const locationsSchema = z.object({
  locations: z.array(locationSchema).min(1, 'Agrega al menos una ubicación'),
});

type LocationsFormData = z.infer<typeof locationsSchema>;

interface LocationsStepProps {
  initialData?: LocationsFormData;
  onSubmit: (data: LocationsFormData) => void;
  isSubmitting: boolean;
}

const defaultHours = {
  monday: { open: '06:00', close: '22:00' },
  tuesday: { open: '06:00', close: '22:00' },
  wednesday: { open: '06:00', close: '22:00' },
  thursday: { open: '06:00', close: '22:00' },
  friday: { open: '06:00', close: '22:00' },
  saturday: { open: '08:00', close: '20:00' },
  sunday: { open: '08:00', close: '20:00' },
};

const dayLabels = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo',
};

export function LocationsStep({ initialData, onSubmit, isSubmitting }: LocationsStepProps) {
  const [expandedLocation, setExpandedLocation] = useState<number | null>(0);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LocationsFormData>({
    resolver: zodResolver(locationsSchema),
    defaultValues: {
      locations: initialData?.locations || [
        {
          name: '',
          address: '',
          capacity: 100,
          hours: defaultHours,
        },
      ],
    },
    mode: 'onChange',
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'locations',
  });

  const addLocation = () => {
    append({
      name: '',
      address: '',
      capacity: 100,
      hours: defaultHours,
    });
    setExpandedLocation(fields.length);
  };

  const removeLocation = (index: number) => {
    remove(index);
    if (expandedLocation === index) {
      setExpandedLocation(null);
    } else if (expandedLocation !== null && expandedLocation > index) {
      setExpandedLocation(expandedLocation - 1);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
          >
            {/* Location Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => setExpandedLocation(expandedLocation === index ? null : index)}
                className="flex items-center space-x-2 text-left"
              >
                <span className="text-lg font-medium text-gray-900 dark:text-white">
                  Ubicación {index + 1}
                </span>
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform ${
                    expandedLocation === index ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeLocation(index)}
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

            {/* Location Details */}
            {expandedLocation === index && (
              <div className="space-y-4">
                {/* Name and Address */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nombre *
                    </label>
                    <input
                      {...register(`locations.${index}.name`)}
                      type="text"
                      placeholder="Ej: Sucursal Centro"
                      className={`
                        w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                        dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400
                        ${errors.locations?.[index]?.name ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'}
                      `}
                    />
                    {errors.locations?.[index]?.name && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errors.locations[index]?.name?.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Capacidad *
                    </label>
                    <input
                      {...register(`locations.${index}.capacity`, { valueAsNumber: true })}
                      type="number"
                      min="1"
                      max="1000"
                      placeholder="100"
                      className={`
                        w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                        dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400
                        ${errors.locations?.[index]?.capacity ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'}
                      `}
                    />
                    {errors.locations?.[index]?.capacity && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errors.locations[index]?.capacity?.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Dirección *
                  </label>
                  <textarea
                    {...register(`locations.${index}.address`)}
                    rows={2}
                    placeholder="Calle, número, colonia, ciudad, estado"
                    className={`
                      w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                      dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400
                      ${errors.locations?.[index]?.address ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'}
                    `}
                  />
                  {errors.locations?.[index]?.address && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.locations[index]?.address?.message}
                    </p>
                  )}
                </div>

                {/* Hours */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Horarios de Operación
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(dayLabels).map(([day, label]) => (
                      <div key={day} className="flex items-center space-x-2">
                        <span className="w-20 text-sm text-gray-600 dark:text-gray-400">
                          {label}:
                        </span>
                        <input
                          {...register(
                            `locations.${index}.hours.${day as keyof typeof dayLabels}.open`
                          )}
                          type="time"
                          className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                        />
                        <span className="text-gray-500">-</span>
                        <input
                          {...register(
                            `locations.${index}.hours.${day as keyof typeof dayLabels}.close`
                          )}
                          type="time"
                          className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Location Button */}
      <button
        type="button"
        onClick={addLocation}
        className="w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
      >
        + Agregar Otra Ubicación
      </button>

      {/* Errors */}
      {errors.locations && (
        <p className="text-sm text-red-600 dark:text-red-400">{errors.locations.message}</p>
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
