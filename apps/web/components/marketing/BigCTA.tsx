"use client";

import { motion } from 'framer-motion';
import { motionPresets } from '../../lib/motion/presets';

interface CTAProps {
  label_es: string;
  href: string;
}

interface BigCTAProps {
  title: string;
  primaryCta: CTAProps;
  secondaryCta: CTAProps;
  testId?: string;
}

export function BigCTA({
  title,
  primaryCta,
  secondaryCta,
  testId = 'final-cta'
}: BigCTAProps) {
  return (
    <section 
      data-testid={testId}
      className="bg-gradient-to-r from-primary to-primary-emph py-16"
    >
      <div className="max-w-4xl mx-auto px-4 text-center">
        <motion.div
          {...motionPresets['enter.fadeUp']}
          viewport={{ once: true }}
          className="space-y-8"
        >
          {/* Title */}
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white">
            {title}
          </h2>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <motion.a
              href={primaryCta.href}
              data-cta="primary"
              data-section="final-cta"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary font-semibold rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary shadow-lg"
            >
              {primaryCta.label_es}
            </motion.a>
            
            <motion.a
              href={secondaryCta.href}
              data-cta="secondary"
              data-section="final-cta"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary"
            >
              {secondaryCta.label_es}
            </motion.a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
