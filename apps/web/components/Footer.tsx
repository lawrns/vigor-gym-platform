type Column = { title: string; links: [string, string][] };

export function Footer({ columns, bottom }: { columns?: Column[]; bottom?: string }) {
  return (
    <footer className="border-t border-[var(--outline)] mt-16">
      <div className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-4 gap-8 text-sm">
        <div>
          <div className="font-display text-lg">Vigor</div>
          <div className="text-text/80">Plataforma de gestión de gimnasios para México</div>
        </div>
        {columns?.map(col => (
          <div key={col.title}>
            <div className="text-heading font-medium mb-3">{col.title}</div>
            <ul className="space-y-2">
              {col.links.map(([label, href]) => (
                <li key={href}>
                  <a href={href} className="text-text/85 hover:text-text">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-[var(--outline)]">
        <div className="max-w-6xl mx-auto px-4 py-6 text-xs text-text/70">
          {bottom ?? '© Vigor'}
        </div>
      </div>
    </footer>
  );
}
