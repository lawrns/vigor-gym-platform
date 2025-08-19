import { PlanCard } from '../ui/PlanCard';

type Tier = {
  name: string;
  price: string;
  features: string[];
  highlight?: boolean;
  cta: { label: string; href: string };
};

export function PlansSection({ title, tiers }: { title: string; tiers: Tier[] }) {
  return (
    <section className="bg-[var(--surface)] border-y border-[var(--outline)]">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="font-display text-2xl text-heading">{title}</h2>
        <div role="list" className="mt-6 grid md:grid-cols-3 gap-4">
          {tiers.map(t => (
            <PlanCard key={t.name} {...t} />
          ))}
        </div>
      </div>
    </section>
  );
}
