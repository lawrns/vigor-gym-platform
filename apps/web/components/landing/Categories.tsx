import { Icons } from '../../lib/icons/registry';

const items = [
  { icon: Icons.Dumbbell, label: 'Ejercicio' },
  { icon: Icons.Activity, label: 'Fitness' },
  { icon: Icons.Wallet, label: 'Natación' },
  { icon: Icons.TrendingUp, label: 'Cross Training' },
  { icon: Icons.Brain, label: 'Bienestar' }
];

export function Categories() {
  return (
    <section className="max-w-6xl mx-auto px-4 py-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {items.map(({ icon: Icon, label }) => (
          <div key={label} className="rounded-xl border border-neutral-200 bg-white p-4 flex items-center gap-3">
            <Icon className="h-5 w-5 text-primary" />
            <div className="text-sm font-medium">{label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}


