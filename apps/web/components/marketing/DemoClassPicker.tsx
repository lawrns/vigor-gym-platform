'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '../../lib/icons/registry';
import { motionPresets } from '../../lib/motion/presets';
import { trackEvent } from '../../hooks/useTracking';

interface ClassOption {
  id: string;
  name: string;
  spots: number;
}

interface DemoClassPickerProps {
  classes: ClassOption[];
  testId?: string;
}

export function DemoClassPicker({ classes, testId = 'demo-classes' }: DemoClassPickerProps) {
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [bookedClass, setBookedClass] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState(false);

  const handleClassSelect = (classId: string) => {
    setSelectedClass(classId);
    trackEvent('demo_class_view', { classId });
  };

  const handleBookClass = async () => {
    if (!selectedClass) return;

    setIsBooking(true);

    // Simulate booking process
    await new Promise(resolve => setTimeout(resolve, 1500));

    const selectedClassData = classes.find(c => c.id === selectedClass);
    setBookedClass(selectedClass);
    setIsBooking(false);

    trackEvent('demo_class_booked', {
      classId: selectedClass,
      className: selectedClassData?.name,
    });
  };

  const resetDemo = () => {
    setSelectedClass(null);
    setBookedClass(null);
    setIsBooking(false);
  };

  const getSpotColor = (spots: number) => {
    if (spots >= 5) return 'text-green-600';
    if (spots >= 2) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSpotText = (spots: number) => {
    if (spots === 0) return 'Lleno';
    if (spots === 1) return '1 lugar';
    return `${spots} lugares`;
  };

  return (
    <section
      data-testid={testId}
      className="bg-white rounded-2xl border border-outline p-8 shadow-sm"
    >
      <div className="text-center mb-8">
        <h2 className="font-display text-2xl font-semibold text-heading mb-2">
          2. Reserva tu clase
        </h2>
        <p className="text-text/80">Elige una clase disponible para hoy</p>
      </div>

      <div className="max-w-md mx-auto">
        <AnimatePresence mode="wait">
          {!bookedClass ? (
            <motion.div key="class-list" {...motionPresets['enter.fadeUp']} className="space-y-4">
              {classes.map(classOption => (
                <motion.button
                  key={classOption.id}
                  onClick={() => handleClassSelect(classOption.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full p-4 border rounded-lg text-left transition-all ${
                    selectedClass === classOption.id
                      ? 'border-primary bg-primary/5'
                      : 'border-outline hover:bg-surface-alt'
                  } ${classOption.spots === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={classOption.spots === 0}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Icons.Activity className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium text-heading">{classOption.name}</div>
                        <div className="text-sm text-text/80">18:00 - 19:00</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`text-sm font-medium ${getSpotColor(classOption.spots)}`}>
                        {getSpotText(classOption.spots)}
                      </div>
                      {selectedClass === classOption.id && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-xs text-primary mt-1"
                        >
                          Seleccionada
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.button>
              ))}

              {selectedClass && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="pt-4 border-t border-outline"
                >
                  <button
                    onClick={handleBookClass}
                    disabled={isBooking}
                    className="w-full px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-emph disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {isBooking ? (
                      <>
                        <Icons.Loader2 className="h-4 w-4 animate-spin" />
                        Reservando...
                      </>
                    ) : (
                      <>
                        <Icons.CalendarCheck2 className="h-4 w-4" />
                        Reservar clase
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="success"
              {...motionPresets['enter.fadeUp']}
              className="text-center space-y-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center"
              >
                <Icons.CalendarCheck2 className="h-10 w-10 text-green-600" />
              </motion.div>

              <div>
                <h3 className="font-semibold text-heading text-lg mb-2">¡Clase reservada!</h3>
                <p className="text-text/80 mb-2">
                  {classes.find(c => c.id === bookedClass)?.name} - 18:00
                </p>
                <p className="text-sm text-text/60 mb-6">
                  Te enviaremos un recordatorio 30 minutos antes
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={resetDemo}
                    className="px-4 py-2 border border-outline text-text rounded-lg hover:bg-surface-alt transition-colors"
                  >
                    Probar de nuevo
                  </button>
                  <button className="px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors">
                    Ver mi agenda
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
