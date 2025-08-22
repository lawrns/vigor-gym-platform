import type { ReactNode } from 'react';

export function Container({ className = '', children }: { className?: string; children: ReactNode }) {
  return <div className={`max-w-6xl mx-auto px-4 ${className}`}>{children}</div>;
}


