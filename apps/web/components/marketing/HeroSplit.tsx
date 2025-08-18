"use client";

import { motion } from 'framer-motion';
import Image from 'next/image';
import { motionPresets } from '../../lib/motion/presets';

interface CTAProps {
  label_es: string;
  href: string;
}

interface VisualProps {
  type: 'deviceStack' | 'inlineVideo';
  assets: string[];
}

interface HeroSplitProps {
  headline: string;
  subtitle: string;
  primaryCta: CTAProps;
  secondaryCta: CTAProps;
  visual: VisualProps;
  testId?: string;
}

export function HeroSplit({
  headline,
  subtitle,
  primaryCta,
  secondaryCta,
  visual,
  testId = 'hero'
}: HeroSplitProps) {
  return (
    <section 
      data-testid={testId}
      className="relative overflow-hidden bg-gradient-to-br from-primary-50 to-white"
    >
      <div className="max-w-6xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-10 items-center">
        {/* Left Content */}
        <motion.div
          {...motionPresets['enter.fadeUp']}
          className="space-y-6"
        >
          <h1 className="font-display text-[clamp(34px,4vw,48px)] leading-[1.2] tracking-[0] text-heading">
            {headline}
          </h1>
          
          <p className="text-[clamp(16px,2vw,20px)] leading-[1.5] text-text/80">
            {subtitle}
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href={primaryCta.href}
              data-cta="primary"
              data-section="hero"
              className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-emph transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              {primaryCta.label_es}
            </a>
            
            <a
              href={secondaryCta.href}
              data-cta="secondary"
              data-section="hero"
              className="inline-flex items-center justify-center px-6 py-3 border border-outline text-text font-semibold rounded-lg hover:bg-surface-alt transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              {secondaryCta.label_es}
            </a>
          </div>
        </motion.div>

        {/* Right Visual */}
        <motion.div
          {...motionPresets['enter.fadeUp']}
          transition={{ delay: 0.2 }}
          className="relative"
        >
          {visual.type === 'deviceStack' ? (
            <div className="relative grid grid-cols-2 gap-4 h-[400px] md:h-[500px]">
              {visual.assets.map((asset, index) => (
                <motion.div
                  key={asset}
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className={`relative rounded-xl overflow-hidden shadow-lg ${
                    index === 0 ? 'col-span-2 h-32' : 'h-40'
                  }`}
                >
                  <Image
                    src={asset}
                    alt={`GoGym UI - ${index === 0 ? 'Check-in QR' : index === 1 ? 'Reserva de clase' : 'Progreso KPI'}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 25vw"
                    className="object-cover"
                    priority={index === 0}
                    placeholder="blur"
                    blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nNDAwJyBoZWlnaHQ9JzUwMCcgeG1sbnM9J2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJz48cmVjdCB3aWR0aD0nNDAwJyBoZWlnaHQ9JzUwMCcgZmlsbD0nI2YyZjRmOCcvPjwvc3ZnPg=="
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-elevated">
              <video
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover"
              >
                <source src={visual.assets[0]} type="video/mp4" />
              </video>
            </div>
          )}
          
          {/* Floating elements for visual interest */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="absolute -top-4 -right-4 bg-accent text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg"
          >
            ¡Nuevo!
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="absolute -bottom-4 -left-4 bg-white border border-outline px-4 py-2 rounded-lg shadow-lg"
          >
            <div className="text-xs text-muted">Última visita</div>
            <div className="text-sm font-semibold text-text">Hace 2 días</div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
