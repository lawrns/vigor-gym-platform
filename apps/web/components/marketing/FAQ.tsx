'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '../../lib/icons/registry';
import { motionPresets } from '../../lib/motion/presets';
import { trackFAQToggle } from '../../hooks/useTracking';

interface FAQItem {
  q: string;
  a: string;
}

interface FAQProps {
  items: FAQItem[];
  testId?: string;
}

export function FAQ({ items, testId = 'faq' }: FAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number, question: string) => {
    const isOpening = openIndex !== index;
    setOpenIndex(isOpening ? index : null);

    // Track the toggle event
    trackFAQToggle(question, isOpening ? 'open' : 'close');
  };

  return (
    <section data-testid={testId} className="max-w-4xl mx-auto px-4 py-16">
      <motion.div
        {...motionPresets['enter.fadeUp']}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <h2 className="font-display text-3xl font-bold text-heading mb-4">Preguntas frecuentes</h2>
        <p className="text-text/80 text-lg">Resolvemos las dudas más comunes sobre la app</p>
      </motion.div>

      <div className="space-y-4">
        {items.map((item, index) => {
          const isOpen = openIndex === index;

          return (
            <motion.div
              key={item.q}
              {...motionPresets['enter.fadeUp']}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true, margin: '0px 0px -10% 0px' }}
              className="border border-outline rounded-lg bg-card overflow-hidden"
            >
              {/* Question Button */}
              <button
                onClick={() => toggleFAQ(index, item.q)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-surface-alt transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset"
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${index}`}
                id={`faq-question-${index}`}
              >
                <span className="font-medium text-heading pr-4">{item.q}</span>

                <motion.div
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex-shrink-0"
                >
                  <Icons.ChevronDown className="h-5 w-5 text-muted" />
                </motion.div>
              </button>

              {/* Answer */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    id={`faq-answer-${index}`}
                    role="region"
                    aria-labelledby={`faq-question-${index}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-4 text-text/80 leading-relaxed">{item.a}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
