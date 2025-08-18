"use client";

import { DemoCheckIn } from '../../../../components/marketing/DemoCheckIn';
import { DemoClassPicker } from '../../../../components/marketing/DemoClassPicker';
import { DemoProgressMini } from '../../../../components/marketing/DemoProgressMini';
import { TrackingProvider } from '../../../../components/marketing/TrackingProvider';

// Client-only rendering for interactive demo
export default function DemoPage() {
  return (
    <TrackingProvider>
      <main className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Demo Header */}
          <div className="text-center mb-12">
            <h1 className="font-display text-3xl font-bold text-heading mb-4">
              Prueba Vigor en 60 segundos
            </h1>
            <p className="text-text/80 text-lg">
              Experimenta cómo funciona sin registrarte
            </p>
          </div>

          {/* Demo Modules */}
          <div className="space-y-12">
            {/* Check-in Demo */}
            <DemoCheckIn
              qrMock="/images/hero-app.png"
              biometricMock={true}
              successCopy="¡Listo! Check-in exitoso."
              testId="demo-checkin"
            />

            {/* Class Picker Demo */}
            <DemoClassPicker
              classes={[
                { id: "c1", name: "HIIT 45", spots: 3 },
                { id: "c2", name: "Yoga Flow", spots: 2 },
                { id: "c3", name: "Funcional", spots: 5 }
              ]}
              testId="demo-classes"
            />

            {/* Progress Demo */}
            <DemoProgressMini
              streakDays={4}
              monthlyVisits={8}
              trendUp={true}
              testId="demo-progress"
            />
          </div>

          {/* Demo Footer */}
          <div className="text-center mt-16 pt-8 border-t border-outline">
            <h2 className="font-display text-2xl font-semibold text-heading mb-4">
              ¿Te gustó la experiencia?
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/planes"
                data-cta="primary"
                data-section="demo-footer"
                className="inline-flex items-center justify-center px-8 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-emph transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                Ver planes
              </a>
              <a
                href="/beneficios"
                data-cta="secondary"
                data-section="demo-footer"
                className="inline-flex items-center justify-center px-8 py-3 border border-outline text-text font-semibold rounded-lg hover:bg-surface-alt transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                Volver a beneficios
              </a>
            </div>
          </div>
        </div>
      </main>
    </TrackingProvider>
  );
}
