"use client";

import { motion } from 'framer-motion';
import { Icons } from '../../lib/icons/registry';
import { motionPresets } from '../../lib/motion/presets';

interface CTAProps {
  label_es: string;
  href: string;
}

interface FeatureCalloutProps {
  badge: string;
  title: string;
  bullets: string[];
  cta: CTAProps;
  testId?: string;
}

export function FeatureCallout({
  badge,
  title,
  bullets,
  cta,
  testId = 'ai-banner'
}: FeatureCalloutProps) {
  return (
    <section 
      data-testid={testId}
      className="max-w-6xl mx-auto px-4 py-16"
    >
      <motion.div
        {...motionPresets['enter.fadeUp']}
        viewport={{ once: true }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-accent/10 to-primary/10 border border-outline p-8 md:p-12"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-4 right-4">
            <Icons.Sparkles className="h-24 w-24 text-primary" />
          </div>
          <div className="absolute bottom-4 left-4">
            <Icons.Activity className="h-16 w-16 text-accent" />
          </div>
        </div>

        <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            {/* Badge */}
            <div className="inline-flex items-center px-3 py-1 bg-accent text-white text-sm font-medium rounded-full">
              <Icons.Sparkles className="h-4 w-4 mr-2" />
              {badge}
            </div>

            {/* Title */}
            <h2 className="font-display text-2xl md:text-3xl font-bold text-heading">
              {title}
            </h2>

            {/* Bullets */}
            <ul className="space-y-3">
              {bullets.map((bullet, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-start gap-3"
                >
                  <div className="flex-shrink-0 w-5 h-5 bg-accent rounded-full flex items-center justify-center mt-0.5">
                    <Icons.Check className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-text/80 leading-relaxed">
                    {bullet}
                  </span>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Right CTA */}
          <div className="text-center md:text-right">
            <motion.a
              href={cta.href}
              data-cta="feature"
              data-section="ai-banner"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center px-8 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-emph transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 shadow-lg"
            >
              {cta.label_es}
              <Icons.ChevronRight className="h-5 w-5 ml-2" />
            </motion.a>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
