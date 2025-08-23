'use client';
import Image from 'next/image';

// Static imports for reliable activity image loading
import activityA from '@/public/images/activity-a.webp';
import activityB from '@/public/images/activity-b.webp';
import activityC from '@/public/images/activity-c.webp';
import React, { useRef } from 'react';

type Item = { label: string; image: string };

export function ActivityCarousel({ title, items }: { title: string; items: Item[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const scrollBy = (dir: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.9), behavior: 'smooth' });
  };
  return (
    <section className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between">
        <h2 id="activities-heading" className="font-display text-2xl text-heading">
          {title}
        </h2>
        <div className="hidden md:flex gap-2" aria-label="Controles del carrusel" role="group">
          <button
            aria-label="Anterior"
            onClick={() => scrollBy(-1)}
            className="rounded-md border border-[var(--outline)] px-3 py-1.5 text-sm hover:bg-[var(--surface-alt)]"
          >
            Prev
          </button>
          <button
            aria-label="Siguiente"
            onClick={() => scrollBy(1)}
            className="rounded-md border border-[var(--outline)] px-3 py-1.5 text-sm hover:bg-[var(--surface-alt)]"
          >
            Next
          </button>
        </div>
      </div>
      <div
        ref={scrollerRef}
        className="mt-4 flex gap-4 overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none]"
        style={{ WebkitOverflowScrolling: 'touch' }}
        aria-labelledby="activities-heading"
        aria-live="polite"
      >
        {items.map((it, i) => (
          <div
            key={it.label}
            className="min-w-[75%] md:min-w-[32%] snap-start rounded-xl border border-[var(--outline)] bg-card overflow-hidden"
          >
            <div className="relative aspect-[4/3]">
              <Image
                src={
                  it.image ||
                  (i % 3 === 0
                    ? activityA
                    : i % 3 === 1
                      ? activityB
                      : activityC)
                }
                alt={it.label}
                fill
                sizes="(max-width: 768px) 75vw, 33vw"
                className="object-cover"
              />
            </div>
            <div className="p-3 text-sm text-text/90">{it.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
