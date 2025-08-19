import { Icons } from '../../lib/icons/registry';

type Plan = {
  name: string;
  price: string;
  features: string[];
  badge?: string;
};

const plans: Plan[] = [
  {
    name: 'TP ON',
    price: '$',
    features: ['Activación simple', 'Cobertura nacional', 'Soporte por chat'],
  },
  {
    name: 'TP GO',
    price: '$$',
    features: ['Beneficios ampliados', 'Control por colaborador', 'Reportes básicos'],
    badge: 'Recomendado',
  },
  {
    name: 'TP ++',
    price: '$$$',
    features: ['Integraciones', 'Analítica avanzada', 'Cuenta ejecutiva dedicada'],
  },
];

export function Plans() {
  return (
    <section className="bg-neutral-50 border-t border-b border-neutral-200">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="font-display text-2xl">Planes para colaboradores</h2>
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          {plans.map(p => (
            <div key={p.name} className="rounded-xl border border-neutral-200 bg-white p-5">
              {p.badge && <div className="text-xs text-brand-700">{p.badge}</div>}
              <div className="mt-1 font-medium text-lg">{p.name}</div>
              <div className="text-neutral-500 text-sm">{p.price}</div>
              <ul className="mt-3 space-y-2 text-sm text-neutral-700">
                {p.features.map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <Icons.Check className="h-4 w-4 text-primary" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
