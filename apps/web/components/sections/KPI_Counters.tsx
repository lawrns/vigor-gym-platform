import { Icons } from '../../lib/icons/registry';

type Item = {
  icon: keyof typeof Icons;
  label: string;
  value: number;
  suffix?: string;
  animate?: boolean;
};

export function KPI_Counters({ items }: { items: Item[] }) {
  return (
    <section className="max-w-6xl mx-auto px-4 py-8" style={{ background: 'var(--surface)' }}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map(it => {
          const Icon = (Icons as any)[it.icon] || Icons.Activity;
          return (
            <div
              key={it.label}
              className="rounded-xl border border-[var(--outline)] bg-white p-6 shadow-[0_4px_14px_rgba(0,0,0,0.06)]"
            >
              <div className="flex items-center gap-2 text-[#4B5563]">
                <Icon className="h-5 w-5 text-[color:#1E5BFF]" />
                <div className="text-sm">{it.label}</div>
              </div>
              <div className="mt-2 font-display text-2xl text-[color:#0B0F19]">
                {Intl.NumberFormat('es-MX').format(it.value)}
                {it.suffix || ''}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
