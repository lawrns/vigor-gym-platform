import * as React from 'react';

export function Spotlight({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden className={'pointer-events-none fixed inset-0 -z-10 overflow-hidden ' + className}>
      <div
        className="absolute top-[-20%] left-1/2 -translate-x-1/2 h-[60vh] w-[80vw] rounded-full opacity-30 blur-3xl"
        style={{
          background:
            'radial-gradient(60% 60% at 50% 50%, rgba(0,198,162,0.5) 0%, rgba(0,0,0,0.0) 40%, rgba(17,59,235,0.35) 70%, rgba(0,0,0,0) 100%)',
        }}
      />
    </div>
  );
}


