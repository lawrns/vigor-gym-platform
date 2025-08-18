"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Icons } from '../../lib/icons/registry';
import { motionPresets } from '../../lib/motion/presets';
import { trackEvent } from '../../hooks/useTracking';

interface DemoCheckInProps {
  qrMock: string;
  biometricMock: boolean;
  successCopy: string;
  testId?: string;
}

export function DemoCheckIn({
  qrMock,
  biometricMock,
  successCopy,
  testId = 'demo-checkin'
}: DemoCheckInProps) {
  const [step, setStep] = useState<'choose' | 'qr' | 'biometric' | 'success'>('choose');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'qr' | 'biometric' | null>(null);

  const handleMethodSelect = (method: 'qr' | 'biometric') => {
    trackEvent('demo_checkin_started', { method });
    setSelectedMethod(method);
    setStep(method);
  };

  const handleCheckIn = async () => {
    setIsProcessing(true);

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    setIsProcessing(false);
    setStep('success');
    if (selectedMethod) {
      trackEvent('demo_checkin_success', { method: selectedMethod });
    }
  };

  const resetDemo = () => {
    setStep('choose');
    setIsProcessing(false);
    setSelectedMethod(null);
  };

  return (
    <section 
      data-testid={testId}
      className="bg-white rounded-2xl border border-outline p-8 shadow-sm"
    >
      <div className="text-center mb-8">
        <h2 className="font-display text-2xl font-semibold text-heading mb-2">
          1. Entra al gimnasio
        </h2>
        <p className="text-text/80">
          Elige tu método de acceso preferido
        </p>
      </div>

      <div className="max-w-md mx-auto">
        <AnimatePresence mode="wait">
          {step === 'choose' && (
            <motion.div
              key="choose"
              {...motionPresets['enter.fadeUp']}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <button
                onClick={() => handleMethodSelect('qr')}
                className="w-full p-4 border border-outline rounded-lg hover:bg-surface-alt transition-colors text-left flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Icons.QrCode className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="font-medium text-heading">Código QR</div>
                  <div className="text-sm text-text/80">Escanea desde tu app</div>
                </div>
              </button>

              {biometricMock && (
                <button
                  onClick={() => handleMethodSelect('biometric')}
                  className="w-full p-4 border border-outline rounded-lg hover:bg-surface-alt transition-colors text-left flex items-center gap-4"
                >
                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                    <Icons.Shield className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <div className="font-medium text-heading">Biometría</div>
                    <div className="text-sm text-text/80">Rostro o huella</div>
                  </div>
                </button>
              )}
            </motion.div>
          )}

          {step === 'qr' && (
            <motion.div
              key="qr"
              {...motionPresets['enter.fadeUp']}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-6"
            >
              <div className="relative w-48 h-48 mx-auto bg-white border border-outline rounded-lg p-4">
                <Image
                  src={qrMock}
                  alt="Código QR de demo"
                  fill
                  className="object-contain"
                />
              </div>
              
              <div>
                <p className="text-text/80 mb-4">
                  Escanea este código con tu app
                </p>
                <button
                  onClick={handleCheckIn}
                  disabled={isProcessing}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-emph disabled:opacity-50 transition-colors"
                >
                  {isProcessing ? 'Procesando...' : 'Simular escaneo'}
                </button>
              </div>
            </motion.div>
          )}

          {step === 'biometric' && (
            <motion.div
              key="biometric"
              {...motionPresets['enter.fadeUp']}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-6"
            >
              <div className="relative w-32 h-32 mx-auto bg-gradient-to-br from-accent/20 to-primary/20 rounded-full flex items-center justify-center">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Icons.Shield className="h-16 w-16 text-accent" />
                </motion.div>
              </div>
              
              <div>
                <p className="text-text/80 mb-4">
                  Coloca tu rostro frente al sensor
                </p>
                <button
                  onClick={handleCheckIn}
                  disabled={isProcessing}
                  className="px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 transition-colors"
                >
                  {isProcessing ? 'Verificando...' : 'Simular verificación'}
                </button>
              </div>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="success"
              {...motionPresets['enter.fadeUp']}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center"
              >
                <Icons.Check className="h-10 w-10 text-green-600" />
              </motion.div>
              
              <div>
                <h3 className="font-semibold text-heading text-lg mb-2">
                  {successCopy}
                </h3>
                <p className="text-text/80 mb-4">
                  Bienvenido al gimnasio. ¡Que tengas un gran entrenamiento!
                </p>
                <button
                  onClick={resetDemo}
                  className="px-6 py-2 border border-outline text-text rounded-lg hover:bg-surface-alt transition-colors"
                >
                  Probar de nuevo
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
