'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const staffMemberSchema = z.object({
  firstName: z.string().min(1, 'El nombre es requerido').max(50),
  lastName: z.string().min(1, 'El apellido es requerido').max(50),
  email: z.string().email('Email inválido'),
  role: z.enum(['MANAGER', 'RECEPTIONIST', 'TRAINER'], { required_error: 'Selecciona un rol' }),
  phone: z.string().optional(),
});

const staffSchema = z.object({
  importMethod: z.enum(['CSV', 'Manual']),
  staff: z.array(staffMemberSchema).optional(),
  csvData: z.string().optional(),
});

type StaffFormData = z.infer<typeof staffSchema>;

interface StaffStepProps {
  initialData?: StaffFormData;
  onSubmit: (data: StaffFormData) => void;
  isSubmitting: boolean;
  isLastStep?: boolean;
}

const roleLabels = {
  MANAGER: 'Gerente',
  RECEPTIONIST: 'Recepcionista',
  TRAINER: 'Entrenador',
};

const defaultStaffMembers = [
  {
    firstName: 'Roberto',
    lastName: 'García',
    email: 'roberto@ejemplo.com',
    role: 'MANAGER' as const,
    phone: '+52 55 1234 5678',
  },
];

export function StaffStep({ initialData, onSubmit, isSubmitting, isLastStep }: StaffStepProps) {
  const [importMethod, setImportMethod] = useState<'CSV' | 'Manual'>(
    initialData?.importMethod || 'Manual'
  );

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<StaffFormData>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      importMethod: initialData?.importMethod || 'Manual',
      staff: initialData?.staff || defaultStaffMembers,
      csvData: initialData?.csvData || '',
    },
    mode: 'onChange',
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'staff',
  });

  const addStaffMember = () => {
    append({
      firstName: '',
      lastName: '',
      email: '',
      role: 'RECEPTIONIST',
      phone: '',
    });
  };

  const removeStaffMember = (index: number) => {
    remove(index);
  };

  const handleImportMethodChange = (method: 'CSV' | 'Manual') => {
    setImportMethod(method);
    setValue('importMethod', method, { shouldValidate: true });
  };

  const handleFormSubmit = (data: StaffFormData) => {
    // Clean up data based on import method
    if (data.importMethod === 'CSV') {
      onSubmit({
        importMethod: 'CSV',
        csvData: data.csvData,
      });
    } else {
      onSubmit({
        importMethod: 'Manual',
        staff: data.staff?.filter(member => 
          member.firstName && member.lastName && member.email
        ),
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Import Method Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Método de Importación
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => handleImportMethodChange('Manual')}
            className={`
              p-4 border-2 rounded-lg text-left transition-all
              ${importMethod === 'Manual'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              }
            `}
          >
            <div className="flex items-center space-x-3">
              <div className={`
                w-4 h-4 rounded-full border-2 flex items-center justify-center
                ${importMethod === 'Manual' ? 'border-blue-500' : 'border-gray-300 dark:border-gray-600'}
              `}>
                {importMethod === 'Manual' && (
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                )}
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Manual</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Agrega miembros del personal uno por uno
                </div>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleImportMethodChange('CSV')}
            className={`
              p-4 border-2 rounded-lg text-left transition-all
              ${importMethod === 'CSV'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              }
            `}
          >
            <div className="flex items-center space-x-3">
              <div className={`
                w-4 h-4 rounded-full border-2 flex items-center justify-center
                ${importMethod === 'CSV' ? 'border-blue-500' : 'border-gray-300 dark:border-gray-600'}
              `}>
                {importMethod === 'CSV' && (
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                )}
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">CSV</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Importa desde un archivo CSV
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Manual Entry */}
      {importMethod === 'Manual' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-medium text-gray-900 dark:text-white">
              Miembros del Personal
            </h4>
            <button
              type="button"
              onClick={addStaffMember}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Agregar
            </button>
          </div>

          {fields.map((field, index) => (
            <div
              key={field.id}
              className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h5 className="font-medium text-gray-900 dark:text-white">
                  Persona {index + 1}
                </h5>
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeStaffMember(index)}
                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nombre *
                  </label>
                  <input
                    {...register(`staff.${index}.firstName`)}
                    type="text"
                    placeholder="Roberto"
                    className={`
                      w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                      dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400
                      ${errors.staff?.[index]?.firstName ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'}
                    `}
                  />
                  {errors.staff?.[index]?.firstName && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.staff[index]?.firstName?.message}
                    </p>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Apellido *
                  </label>
                  <input
                    {...register(`staff.${index}.lastName`)}
                    type="text"
                    placeholder="García"
                    className={`
                      w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                      dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400
                      ${errors.staff?.[index]?.lastName ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'}
                    `}
                  />
                  {errors.staff?.[index]?.lastName && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.staff[index]?.lastName?.message}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email *
                  </label>
                  <input
                    {...register(`staff.${index}.email`)}
                    type="email"
                    placeholder="roberto@ejemplo.com"
                    className={`
                      w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                      dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400
                      ${errors.staff?.[index]?.email ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'}
                    `}
                  />
                  {errors.staff?.[index]?.email && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.staff[index]?.email?.message}
                    </p>
                  )}
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Rol *
                  </label>
                  <select
                    {...register(`staff.${index}.role`)}
                    className={`
                      w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                      dark:bg-gray-700 dark:border-gray-600 dark:text-white
                      ${errors.staff?.[index]?.role ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'}
                    `}
                  >
                    <option value="">Seleccionar...</option>
                    {Object.entries(roleLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  {errors.staff?.[index]?.role && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.staff[index]?.role?.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Phone */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Teléfono (opcional)
                </label>
                <input
                  {...register(`staff.${index}.phone`)}
                  type="tel"
                  placeholder="+52 55 1234 5678"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                />
              </div>
            </div>
          ))}

          {fields.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>No hay miembros del personal agregados.</p>
              <button
                type="button"
                onClick={addStaffMember}
                className="mt-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Agregar el primer miembro
              </button>
            </div>
          )}
        </div>
      )}

      {/* CSV Import */}
      {importMethod === 'CSV' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Datos CSV
          </label>
          <textarea
            {...register('csvData')}
            rows={8}
            placeholder="firstName,lastName,email,role,phone&#10;Roberto,García,roberto@ejemplo.com,MANAGER,+52 55 1234 5678&#10;Ana,López,ana@ejemplo.com,TRAINER,+52 55 9876 5432"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 font-mono text-sm"
          />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Formato: firstName,lastName,email,role,phone (una persona por línea)
            <br />
            Roles válidos: MANAGER, RECEPTIONIST, TRAINER
          </p>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className={`
            px-6 py-2 rounded-lg font-medium transition-all
            ${isValid && !isSubmitting
              ? 'bg-green-600 hover:bg-green-700 text-white shadow-sm'
              : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }
          `}
        >
          {isSubmitting ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Completando configuración...</span>
            </div>
          ) : isLastStep ? (
            '🎉 Completar Configuración'
          ) : (
            'Continuar'
          )}
        </button>
      </div>
    </form>
  );
}
