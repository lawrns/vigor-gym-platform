"use client";
import { useState } from 'react';

type Item = { q: string; a: string };

export function FAQAccordion({ title, items }: { title?: string; items: Item[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  return (
    <section className="max-w-6xl mx-auto px-4 py-12">
      {title && <h3 className="font-display text-2xl text-heading">{title}</h3>}
      <div className="mt-6 space-y-3">
        {items.map((it, idx) => {
          const open = openIdx === idx;
          return (
            <div key={it.q} className="rounded-lg border border-[var(--outline)] bg-card">
              <button
                className="w-full text-left px-4 py-3 text-text/95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                onClick={() => setOpenIdx(open ? null : idx)}
                aria-expanded={open}
                aria-controls={`faq-panel-${idx}`}
                id={`faq-button-${idx}`}
              >
                {it.q}
              </button>
              {open && (
                <div id={`faq-panel-${idx}`} role="region" aria-labelledby={`faq-button-${idx}`} className="px-4 pb-4 text-sm text-text/80">
                  {it.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}



