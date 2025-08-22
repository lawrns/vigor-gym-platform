import type { ReactNode } from 'react';

type Tone = 'default' | 'alt' | 'emphasis';
type Size = 'sm' | 'md' | 'lg';

const toneToBg: Record<Tone, string> = {
  default: 'bg-bg',
  alt: 'bg-surface',
  emphasis: 'bg-blue-50 dark:bg-blue-900/20',
};

const sizeToPy: Record<Size, string> = {
  sm: 'py-8',
  md: 'py-12',
  lg: 'py-16',
};

export function Section({ tone = 'default', size = 'md', className = '', children }: { tone?: Tone; size?: Size; className?: string; children: ReactNode }) {
  return <section className={`${toneToBg[tone]} ${sizeToPy[size]} ${className}`}>{children}</section>;
}


