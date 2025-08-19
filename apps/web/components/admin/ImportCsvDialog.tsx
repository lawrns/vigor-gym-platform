'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '../../lib/auth/context';
import { apiClient, isAPIError } from '../../lib/api/client';
import { Icons } from '../../lib/icons/registry';

interface ImportCsvDialogProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface ParsedMember {
  email: string;
  firstName: string;
  lastName: string;
  status: 'active' | 'invited' | 'paused' | 'cancelled';
}

export function ImportCsvDialog({ onSuccess, onCancel }: ImportCsvDialogProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [parsedMembers, setParsedMembers] = useState<ParsedMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'importing'>('upload');

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    parseCSV(selectedFile);
  };

  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());

        if (lines.length < 2) {
          throw new Error(
            'El archivo debe contener al menos una fila de encabezados y una fila de datos'
          );
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

        // Validate required headers
        const requiredHeaders = ['email', 'firstname', 'lastname'];
        const missingHeaders = requiredHeaders.filter(
          h =>
            !headers.some(header =>
              header.includes(h.replace('firstname', 'first').replace('lastname', 'last'))
            )
        );

        if (missingHeaders.length > 0) {
          throw new Error(`Faltan columnas requeridas: ${missingHeaders.join(', ')}`);
        }

        // Find column indices
        const emailIndex = headers.findIndex(h => h.includes('email'));
        const firstNameIndex = headers.findIndex(h => h.includes('first') || h.includes('nombre'));
        const lastNameIndex = headers.findIndex(h => h.includes('last') || h.includes('apellido'));
        const statusIndex = headers.findIndex(h => h.includes('status') || h.includes('estado'));

        const members: ParsedMember[] = [];

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));

          if (values.length < 3) continue; // Skip incomplete rows

          const email = values[emailIndex]?.toLowerCase();
          const firstName = values[firstNameIndex];
          const lastName = values[lastNameIndex];
          const status = values[statusIndex]?.toLowerCase() || 'active';

          if (!email || !firstName || !lastName) continue;

          // Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            throw new Error(`Email inválido en fila ${i + 1}: ${email}`);
          }

          // Validate status
          const validStatuses = ['active', 'invited', 'paused', 'cancelled'];
          const normalizedStatus =
            status === 'activo'
              ? 'active'
              : status === 'invitado'
                ? 'invited'
                : status === 'pausado'
                  ? 'paused'
                  : status === 'cancelado'
                    ? 'cancelled'
                    : status;

          if (!validStatuses.includes(normalizedStatus)) {
            throw new Error(`Estado inválido en fila ${i + 1}: ${status}`);
          }

          members.push({
            email,
            firstName,
            lastName,
            status: normalizedStatus as ParsedMember['status'],
          });
        }

        if (members.length === 0) {
          throw new Error('No se encontraron miembros válidos en el archivo');
        }

        if (members.length > 1000) {
          throw new Error('El archivo contiene demasiados miembros. Máximo permitido: 1000');
        }

        setParsedMembers(members);
        setStep('preview');
      } catch (err) {
        console.error('Error parsing CSV:', err);
        const errorMessage =
          err instanceof Error ? err.message : 'Error al procesar el archivo CSV';
        setError(errorMessage);
      }
    };

    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (parsedMembers.length === 0) return;

    setLoading(true);
    setError(null);
    setStep('importing');

    try {
      const response = await apiClient.members.import({
        members: parsedMembers,
      });

      if (isAPIError(response)) {
        throw new Error(response.message);
      }

      // Track analytics
      if (typeof window !== 'undefined') {
        import('posthog-js').then(({ default: posthog }) => {
          posthog.capture('members.imported', {
            count: parsedMembers.length,
            companyId: user?.company?.id,
          });
        });
      }

      onSuccess();
    } catch (err) {
      console.error('Error importing members:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al importar miembros';
      setError(errorMessage);
      setStep('preview');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'text/csv') {
      handleFileSelect(droppedFile);
    } else {
      setError('Por favor selecciona un archivo CSV válido');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Importar Miembros desde CSV
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <Icons.X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
              <div className="flex">
                <Icons.AlertCircle className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
                <div className="text-sm text-red-700 dark:text-red-400">{error}</div>
              </div>
            </div>
          )}

          {step === 'upload' && (
            <div className="space-y-4">
              {/* Instructions */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                  Formato del archivo CSV
                </h3>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Columnas requeridas: email, firstName, lastName</li>
                  <li>• Columna opcional: status (active, invited, paused, cancelled)</li>
                  <li>• Primera fila debe contener los encabezados</li>
                  <li>• Máximo 1,000 miembros por importación</li>
                </ul>
              </div>

              {/* File Upload */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
              >
                <Icons.Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Arrastra tu archivo CSV aquí
                </p>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  o haz clic para seleccionar un archivo
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={e => {
                    const selectedFile = e.target.files?.[0];
                    if (selectedFile) handleFileSelect(selectedFile);
                  }}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Seleccionar archivo
                </button>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Vista previa ({parsedMembers.length} miembros)
                </h3>
                <button
                  onClick={() => {
                    setStep('upload');
                    setFile(null);
                    setParsedMembers([]);
                  }}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  Cambiar archivo
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Email
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Nombre
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {parsedMembers.slice(0, 10).map((member, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                          {member.email}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                          {member.firstName} {member.lastName}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                          {member.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {parsedMembers.length > 10 && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Mostrando los primeros 10 de {parsedMembers.length} miembros
                </p>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={onCancel}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleImport}
                  className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Importar {parsedMembers.length} miembros
                </button>
              </div>
            </div>
          )}

          {step === 'importing' && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Importando miembros...
              </h3>
              <p className="text-gray-600 dark:text-gray-400">Esto puede tomar unos momentos</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
