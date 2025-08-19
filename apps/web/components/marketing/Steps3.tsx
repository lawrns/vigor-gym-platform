'use client';

import { motion } from 'framer-motion';
import { motionPresets } from '../../lib/motion/presets';

interface Step {
  step: string;
  title: string;
  desc: string;
}

interface Steps3Props {
  steps: Step[];
  testId?: string;
}

export function Steps3({ steps, testId = 'how-it-works' }: Steps3Props) {
  return (
    <section data-testid={testId} className="bg-surface py-16">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          {...motionPresets['enter.fadeUp']}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl font-bold text-heading mb-4">¿Cómo funciona?</h2>
          <p className="text-text/80 text-lg">Tres pasos simples para comenzar tu experiencia</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.step}
              {...motionPresets['enter.fadeUp']}
              transition={{ delay: index * 0.2 }}
              viewport={{ once: true, margin: '0px 0px -10% 0px' }}
              className="relative text-center"
            >
              {/* Step Number */}
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary text-white font-bold text-lg rounded-full mb-6">
                {step.step}
              </div>

              {/* Connecting Line (except for last step) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-6 left-1/2 w-full h-0.5 bg-outline transform translate-x-6 -translate-y-1/2 z-0" />
              )}

              {/* Content */}
              <div className="relative z-10 space-y-3">
                <h3 className="font-display text-xl font-semibold text-heading">{step.title}</h3>
                <p className="text-text/80 leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
