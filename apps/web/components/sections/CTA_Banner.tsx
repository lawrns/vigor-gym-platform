export function CTA_Banner({ title, desc, cta, secondary }: { title: string; desc: string; cta: { label: string; href: string }; secondary?: { label: string; href: string } }) {
  return (
    <section className="max-w-6xl mx-auto px-4 pb-16">
      <div className="rounded-lg border border-[var(--outline)] bg-[var(--surface)] p-6">
        <div className="md:flex items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-xl text-heading">{title}</h3>
            <p className="text-text/85">{desc}</p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-3">
            <a data-cta="cta-primary" data-variant="primary" href={cta.href}>{cta.label}</a>
            {secondary && (
              <a data-cta="cta-secondary" data-variant="ghost" href={secondary.href}>{secondary.label}</a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}


