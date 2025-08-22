import type { ReactNode } from 'react';

type Gap = '0' | '1' | '2' | '3' | '4' | '6' | '8' | '12' | '16' | '24' | '32';

const gapToClass: Record<Gap, string> = {
  '0': 'gap-0',
  '1': 'gap-1',
  '2': 'gap-2',
  '3': 'gap-3',
  '4': 'gap-4',
  '6': 'gap-6',
  '8': 'gap-8',
  '12': 'gap-12',
  '16': 'gap-16',
  '24': 'gap-24',
  '32': 'gap-32',
};

export function Stack({ as: As = 'div', gap = '6', className = '', children }: { as?: any; gap?: Gap; className?: string; children: ReactNode }) {
  return <As className={`flex flex-col ${gapToClass[gap]} ${className}`}>{children}</As>;
}


