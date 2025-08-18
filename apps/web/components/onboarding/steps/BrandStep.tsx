'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const brandSchema = z.object({
  gymName: z.string().min(1, 'El nombre del gimnasio es requerido').max(100, 'Máximo 100 caracteres'),
  logoUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Color inválido (formato: #RRGGBB)').optional().or(z.literal('')),
});

type BrandFormData = z.infer<typeof brandSchema>;

interface BrandStepProps {
  initialData?: BrandFormData;
  onSubmit: (data: BrandFormData) => void;
  isSubmitting: boolean;
}

const colorPresets = [
  { name: 'Azul Vigor', value: '#3B82F6' },
  { name: 'Verde Energía', value: '#10B981' },
  { name: 'Naranja Dinámico', value: '#F59E0B' },
  { name: 'Rojo Intenso', value: '#EF4444' },
  { name: 'Púrpura Moderno', value: '#8B5CF6' },
  { name: 'Rosa Vibrante', value: '#EC4899' },
];

export function BrandStep({ initialData, onSubmit, isSubmitting }: BrandStepProps) {
  const [selectedColor, setSelectedColor] = useState(initialData?.primaryColor || '#3B82F6');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<BrandFormData>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      gymName: initialData?.gymName || '',
      logoUrl: initialData?.logoUrl || '',
      primaryColor: initialData?.primaryColor || '#3B82F6',
    },
    mode: 'onChange',
  });

  const watchedColor = watch('primaryColor');

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setValue('primaryColor', color, { shouldValidate: true });
  };

  const handleFormSubmit = (data: BrandFormData) => {
    onSubmit({
      ...data,
      primaryColor: data.primaryColor || undefined,
      logoUrl: data.logoUrl || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Gym Name */}
      <div>
        <label htmlFor="gymName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Nombre del Gimnasio *
        </label>
        <input
          {...register('gymName')}
          type="text"
          id="gymName"
          placeholder="Ej: Vigor Fitness Center"
          className={`
            w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400
            ${errors.gymName ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'}
          `}
        />
        {errors.gymName && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.gymName.message}</p>
        )}
      </div>

      {/* Logo URL */}
      <div>
        <label htmlFor="logoUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          URL del Logo (opcional)
        </label>
        <input
          {...register('logoUrl')}
          type="url"
          id="logoUrl"
          placeholder="https://ejemplo.com/logo.png"
          className={`
            w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400
            ${errors.logoUrl ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'}
          `}
        />
        {errors.logoUrl && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.logoUrl.message}</p>
        )}
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Puedes agregar tu logo más tarde desde la configuración
        </p>
      </div>

      {/* Primary Color */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Color Principal (opcional)
        </label>
        
        {/* Color Presets */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {colorPresets.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => handleColorSelect(preset.value)}
              className={`
                flex items-center space-x-2 p-2 rounded-lg border transition-all
                ${selectedColor === preset.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }
              `}
            >
              <div
                className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                style={{ backgroundColor: preset.value }}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{preset.name}</span>
            </button>
          ))}
        </div>

        {/* Custom Color Input */}
        <div className="flex items-center space-x-3">
          <input
            {...register('primaryColor')}
            type="color"
            className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
            onChange={(e) => handleColorSelect(e.target.value)}
          />
          <input
            {...register('primaryColor')}
            type="text"
            placeholder="#3B82F6"
            className={`
              flex-1 px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400
              ${errors.primaryColor ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'}
            `}
          />
        </div>
        {errors.primaryColor && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.primaryColor.message}</p>
        )}
      </div>

      {/* Preview */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Vista Previa</h4>
        <div className="flex items-center space-x-3">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
            style={{ backgroundColor: watchedColor || '#3B82F6' }}
          >
            {watch('gymName')?.charAt(0)?.toUpperCase() || 'G'}
          </div>
          <div>
            <div className="font-semibold text-gray-900 dark:text-white">
              {watch('gymName') || 'Nombre del Gimnasio'}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Sistema de Gestión
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className={`
            px-6 py-2 rounded-lg font-medium transition-all
            ${isValid && !isSubmitting
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
