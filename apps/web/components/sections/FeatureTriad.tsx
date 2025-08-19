'use client';
import { FeatureCard } from '../ui/FeatureCard';

type Card = { icon: string; title: string; desc: string; cta?: { label: string; href: string } };

export function FeatureTriad({ intro, cards }: { intro: string; cards: Card[] }) {
  return (
    <section className="max-w-6xl mx-auto px-4 py-10">
      <h2 className="font-display text-2xl text-heading">{intro}</h2>
      <div className="mt-6 grid md:grid-cols-3 gap-4">
        {cards.map(c => (
          <FeatureCard
            key={c.title}
            iconName={c.icon as any}
            title={c.title}
            desc={c.desc}
            cta={c.cta}
          />
        ))}
      </div>
    </section>
  );
}
