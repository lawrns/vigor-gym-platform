'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../../../lib/auth/context';
import { apiClient, isAPIError } from '../../../../../../lib/api/client';
import { Member } from '../../../../../../lib/api/types';
import { Button } from '../../../../../../components/ui/Button';
import { Icons } from '../../../../../../lib/icons/registry';
import { BodyScanCamera } from '../../../../../../components/ai/BodyScanCamera';
import { BodyScanResults } from '../../../../../../components/ai/BodyScanResults';

interface BodyScanState {
  status: 'loading' | 'form' | 'camera' | 'processing' | 'results' | 'error';
  member?: Member;
  scanResult?: any;
  error?: string;
}

interface BodyScanForm {
  height: number;
  weight: number;
  age: number;
  gender: 'male' | 'female';
}

export default function BodyScanPage() {
  const params = useParams();
  const router = useRouter();
  const { user, status: authStatus } = useAuth();
  const [state, setState] = useState<BodyScanState>({ status: 'loading' });
  const [formData, setFormData] = useState<BodyScanForm>({
    height: 170,
    weight: 70,
    age: 30,
    gender: 'male',
  });
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const memberId = params.id as string;

  useEffect(() => {
    if (authStatus === 'loading') return;

    if (!user) {
      router.push('/login');
      return;
    }

    loadMember();
  }, [user, authStatus, router, memberId]);

  const loadMember = async () => {
    try {
      setState(prev => ({ ...prev, status: 'loading' }));

      const response = await apiClient.members.get(memberId);

      if (isAPIError(response)) {
        throw new Error(response.message);
      }

      setState({
        status: 'form',
        member: response.member,
      });
    } catch (error) {
      console.error('Error loading member:', error);
      setState({
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to load member',
      });
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setState(prev => ({ ...prev, status: 'camera' }));
  };

  const handleImageCapture = async (imageData: string) => {
    setCapturedImage(imageData);
    setState(prev => ({ ...prev, status: 'processing' }));

    try {
      // Call AI body scan API
      const response = await fetch('/api/v1/ai/body-scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memberId,
          imageData,
          height: formData.height,
          weight: formData.weight,
          age: formData.age,
          gender: formData.gender,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to process body scan');
      }

      const result = await response.json();

      setState(prev => ({
        ...prev,
        status: 'results',
        scanResult: result.scan,
      }));

      // Track successful scan
      if (typeof window !== 'undefined') {
        import('posthog-js').then(({ default: posthog }) => {
          posthog.capture('ai.body_scan_completed', {
            memberId,
            poseQuality: result.scan.poseQuality,
            confidence: result.scan.confidence,
          });
        });
      }
    } catch (error) {
      console.error('Error processing body scan:', error);
      setState(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to process body scan',
      }));
    }
  };

  const handleCameraCancel = () => {
    setState(prev => ({ ...prev, status: 'form' }));
  };

  const handleResultsClose = () => {
    setState(prev => ({ ...prev, status: 'form' }));
    setCapturedImage(null);
  };

  const handleSaveToProfile = async () => {
    // In a real implementation, this would save the scan results to the member's profile
    console.log('Saving scan results to profile...');

    // For now, just show success and redirect
    router.push(`/admin/members/${memberId}`);
  };

  if (authStatus === 'loading' || state.status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
            <Icons.CameraIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 animate-pulse" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Cargando escaneo corporal...
          </h2>
        </div>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900 mb-4">
            <Icons.AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Error en el Escaneo
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{state.error}</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={loadMember}>Reintentar</Button>
            <Button onClick={() => router.back()} variant="outline">
              Volver
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (state.status === 'results' && state.scanResult) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <BodyScanResults
          result={state.scanResult}
          memberName={`${state.member?.firstName} ${state.member?.lastName}`}
          onClose={handleResultsClose}
          onSaveToProfile={handleSaveToProfile}
        />
      </div>
    );
  }

  if (state.status === 'camera' || state.status === 'processing') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCameraCancel}
              className="mb-4"
              disabled={state.status === 'processing'}
            >
              <Icons.ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Escaneo Corporal - {state.member?.firstName} {state.member?.lastName}
            </h1>
          </div>

          <BodyScanCamera
            onCapture={handleImageCapture}
            onCancel={handleCameraCancel}
            isProcessing={state.status === 'processing'}
          />
        </div>
      </div>
    );
  }

  // Form view
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="mb-4">
            <Icons.ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Escaneo Corporal con IA
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {state.member?.firstName} {state.member?.lastName} • {state.member?.email}
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-4">
            <Icons.CameraIcon className="h-8 w-8 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Análisis Avanzado de Composición Corporal
              </h3>
              <p className="text-blue-800 dark:text-blue-200 mb-4">
                Utiliza inteligencia artificial para analizar la composición corporal a través de la
                cámara del dispositivo.
              </p>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Estimación de porcentaje de grasa corporal</li>
                <li>• Cálculo de masa muscular</li>
                <li>• Medidas corporales aproximadas</li>
                <li>• Recomendaciones personalizadas</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleFormSubmit}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Información Básica
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Altura (cm)
              </label>
              <input
                type="number"
                min="100"
                max="250"
                value={formData.height}
                onChange={e =>
                  setFormData(prev => ({ ...prev, height: parseInt(e.target.value) || 170 }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Peso (kg)
              </label>
              <input
                type="number"
                min="30"
                max="300"
                value={formData.weight}
                onChange={e =>
                  setFormData(prev => ({ ...prev, weight: parseInt(e.target.value) || 70 }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Edad
              </label>
              <input
                type="number"
                min="13"
                max="100"
                value={formData.age}
                onChange={e =>
                  setFormData(prev => ({ ...prev, age: parseInt(e.target.value) || 30 }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Género
              </label>
              <select
                value={formData.gender}
                onChange={e =>
                  setFormData(prev => ({ ...prev, gender: e.target.value as 'male' | 'female' }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              >
                <option value="male">Masculino</option>
                <option value="female">Femenino</option>
              </select>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" className="flex items-center gap-2">
              <Icons.CameraIcon className="h-4 w-4" />
              Iniciar Escaneo
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
