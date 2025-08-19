export function FAQ() {
  const items = [
    {
      q: '¿Cómo funcionan las membresías?',
      a: 'Los colaboradores se registran con su correo corporativo y acceden a la red de gimnasios y clases con una sola cuota mensual.',
    },
    {
      q: '¿Incluye facturación CFDI?',
      a: 'Sí, emitimos CFDI 4.0 con RFC, usoCFDI y régimen fiscal. Puedes descargar las facturas desde el panel.',
    },
    {
      q: '¿Qué métodos de pago aceptan?',
      a: 'Tarjetas, SPEI y OXXO con Stripe/Mercado Pago. Soportamos recordatorios y dunning.',
    },
  ];
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h3 className="font-display text-2xl">Preguntas frecuentes</h3>
      <div className="mt-6 space-y-3">
        {items.map(it => (
          <details key={it.q} className="rounded-lg border border-neutral-200 bg-white p-4">
            <summary className="cursor-pointer text-neutral-900">{it.q}</summary>
            <div className="mt-2 text-neutral-700 text-sm">{it.a}</div>
          </details>
        ))}
      </div>
    </div>
  );
}
