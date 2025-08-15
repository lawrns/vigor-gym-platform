"use client";
import { motion } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { AppStores } from '../AppStores';
import { useEffect } from 'react';
import { trackCtaClicks } from '../../lib/utils';

type Cta = { label: string; href: string; variant?: 'primary' | 'ghost' };
type Stat = { label: string; value: string; delta?: string };
type HeroConfig = {
  left: { eyebrow: string; title: string; subtitle: string; ctas: Cta[]; appBadges?: boolean };
  right?: { media?: string; stats?: Stat[] };
};

export function Hero({ config }: { config: HeroConfig }) {
  const { left, right } = config;
  useEffect(() => { trackCtaClicks(); }, []);
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#0a0f0d] to-[#0a0f0d]" />
      <div className="relative max-w-6xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            {left.eyebrow && (
              <Badge className="border-brand-300 bg-brand-100/30 text-brand-200">{left.eyebrow}</Badge>
            )}
            <h1 className="mt-4 font-display text-5xl leading-tight text-white">{left.title}</h1>
            <p className="mt-4 text-neutral-300 text-lg">{left.subtitle}</p>
            <div className="mt-6 flex gap-3">
              {left.ctas?.map((cta) => (
                <Button
                  key={cta.label}
                  asChild
                  className={cta.variant === 'ghost' ? 'bg-transparent border-neutral-700 text-white hover:bg-white/5' : ''}
                >
                  <a data-cta="hero" href={cta.href}>{cta.label}</a>
                </Button>
              ))}
            </div>
            {left.appBadges && (
              <div className="mt-5">
                <AppStores />
              </div>
            )}
          </motion.div>
        </div>
        <div className="rounded-xl bg-neutral-900/40 border border-neutral-800 aspect-[4/3]" />
      </div>
    </section>
  );
}


