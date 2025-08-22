'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Icons } from '../../lib/icons/registry';
import { Button } from '@/components/ui/Button';

interface BodyScanCameraProps {
  onCapture: (imageData: string) => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

export function BodyScanCamera({ onCapture, onCancel, isProcessing = false }: BodyScanCameraProps) {
  const [isActive, setIsActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);

      // Request camera access with specific constraints for body scanning
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment', // Use back camera on mobile
        },
        audio: false,
      });

      setStream(mediaStream);
      setIsActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('No se pudo acceder a la cámara. Verifica los permisos.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsActive(false);
  }, [stream]);

  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to base64
    const imageData = canvas.toDataURL('image/jpeg', 0.8);

    // Stop camera and return image data
    stopCamera();
    onCapture(imageData);
  }, [stopCamera, onCapture]);

  const handleCancel = useCallback(() => {
    stopCamera();
    onCancel();
  }, [stopCamera, onCancel]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <Icons.AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400 mb-4" />
        <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
          Error de Cámara
        </h3>
        <p className="text-red-700 dark:text-red-300 text-center mb-4">{error}</p>
        <div className="flex gap-2">
          <Button onClick={startCamera} variant="outline">
            Reintentar
          </Button>
          <Button onClick={onCancel} variant="ghost">
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  if (!isActive) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <Icons.CameraIcon className="h-16 w-16 text-blue-600 dark:text-blue-400 mb-4" />
        <h3 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-2">
          Escaneo Corporal con IA
        </h3>
        <p className="text-blue-700 dark:text-blue-300 text-center mb-6 max-w-md">
          Utiliza la cámara de tu dispositivo para obtener un análisis completo de composición
          corporal.
        </p>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg mb-6 max-w-md">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Instrucciones:</h4>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>• Párate frente a la cámara con buena iluminación</li>
            <li>• Mantén los brazos ligeramente separados del cuerpo</li>
            <li>• Usa ropa ajustada para mejores resultados</li>
            <li>• Asegúrate de que todo tu cuerpo sea visible</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <Button onClick={startCamera} className="flex items-center gap-2">
            <Icons.CameraIcon className="h-4 w-4" />
            Iniciar Escaneo
          </Button>
          <Button onClick={onCancel} variant="outline">
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Video feed */}
      <div className="relative bg-black rounded-lg overflow-hidden">
        <video ref={videoRef} className="w-full h-auto max-h-96 object-cover" playsInline muted />

        {/* Overlay guide */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Body outline guide */}
          <div className="absolute inset-4 border-2 border-white/50 rounded-full opacity-30" />

          {/* Center crosshair */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-8 h-8 border-2 border-white rounded-full opacity-60" />
          </div>

          {/* Instructions overlay */}
          <div className="absolute top-4 left-4 right-4">
            <div className="bg-black/60 text-white p-3 rounded-lg text-sm">
              <p className="font-medium mb-1">Posiciónate correctamente:</p>
              <p>Mantén todo tu cuerpo visible en el marco</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4 mt-4">
        <Button
          onClick={captureImage}
          disabled={isProcessing}
          className="flex items-center gap-2 px-6 py-3"
        >
          {isProcessing ? (
            <>
              <Icons.Loader2 className="h-4 w-4 animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <Icons.CameraIcon className="h-4 w-4" />
              Capturar
            </>
          )}
        </Button>

        <Button onClick={handleCancel} variant="outline" disabled={isProcessing}>
          Cancelar
        </Button>
      </div>

      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

// CameraIcon is now available in the registry
