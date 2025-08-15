"use client";
import { motion } from 'framer-motion';
import { motionPresets } from '../../lib/motion/presets';
import { Icons } from '../../lib/icons/registry';

type Props = {
  iconName?: keyof typeof Icons;
  title: string;
  desc: string;
  cta?: { label: string; href: string };
};

export function FeatureCard({ iconName, title, desc, cta }: Props) {
  const Icon = (iconName && (Icons as any)[iconName]) || Icons.Dumbbell;
  return (
    <motion.div
      {...motionPresets['enter.fadeUp']}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      className="rounded-xl border border-[var(--outline)] bg-card p-5 hover:shadow-elevated"
    >
      <div className="inline-flex items-center rounded-full border border-[var(--outline)] bg-[var(--surface-alt)] px-2.5 py-0.5 text-xs text-text/90">
        <Icon className="h-4 w-4 text-primary mr-1" />
        {title}
      </div>
      <div className="mt-3 text-text/90 text-sm">{desc}</div>
      {cta && (
        <div className="mt-4">
          <a data-cta="feature" href={cta.href} className="text-sm text-primary hover:underline">
            {cta.label}
          </a>
        </div>
      )}
    </motion.div>
  );
}


