export function Testimonials() {
  const items = [
    {
      name: 'María López',
      role: 'Dueña de Sportia',
      quote: 'Reducimos el churn 25% y aumentamos asistencia con recordatorios y escaneos.',
    },
    {
      name: 'Carlos Pérez',
      role: 'Gerente en FuerzaFit',
      quote: 'CFDI y pagos integrados nos ahorran horas cada semana.',
    },
  ];
  return (
    <div className="max-w-6xl mx-auto px-4 py-12 grid md:grid-cols-2 gap-6">
      {items.map(t => (
        <div key={t.name} className="rounded-lg border border-neutral-200 bg-white p-6">
          <div className="text-neutral-700">“{t.quote}”</div>
          <div className="mt-3 text-sm text-neutral-500">
            {t.name} • {t.role}
          </div>
        </div>
      ))}
    </div>
  );
}

