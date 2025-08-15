import { Icons } from '../../lib/icons/registry';

type Props = {
  name: string;
  price: string;
  features: string[];
  highlight?: boolean;
  cta: { label: string; href: string };
};

export function PlanCard({ name, price, features, highlight, cta }: Props) {
  return (
    <div
      role="listitem"
      className={`rounded-xl border ${highlight ? 'border-primary/40 shadow-elevated' : 'border-[var(--outline)] shadow-card'} bg-card p-5`}
    >
      {highlight && <div className="text-xs text-primary">Recomendado</div>}
      <div className="mt-1 font-medium text-heading text-lg">{name}</div>
      <div className="text-muted text-sm">{price}</div>
      <ul className="mt-3 space-y-2 text-sm text-text/90">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2">
            <Icons.Check className="h-4 w-4 text-primary" /> {f}
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <a data-cta="plan" data-plan={name} data-variant={highlight ? 'primary' : 'ghost'} href={cta.href}>
          {cta.label}
        </a>
      </div>
    </div>
  );
}


