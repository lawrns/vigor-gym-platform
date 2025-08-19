'use client';
const Icons = {
  Building2: (props: any) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
      <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
      <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
      <path d="M10 6h4" />
      <path d="M10 10h4" />
      <path d="M10 14h4" />
      <path d="M10 18h4" />
    </svg>
  ),
  Users: (props: any) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Activity: (props: any) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" />
    </svg>
  ),
} as const;

type Step = { icon: keyof typeof Icons; title: string; desc: string };

export function HowItWorks({
  title,
  steps,
  cta,
}: {
  title: string;
  steps: Step[];
  cta?: { label: string; href: string };
}) {
  return (
    <section className="max-w-6xl mx-auto px-4 py-12">
      <h2 className="font-display text-2xl text-heading">{title}</h2>
      <div className="mt-6 grid md:grid-cols-3 gap-4">
        {steps.map(s => {
          const Icon = (Icons as any)[s.icon] ?? Icons.Building2;
          return (
            <div key={s.title} className="rounded-xl border border-[var(--outline)] bg-card p-5">
              <div className="flex items-center gap-2 text-text">
                <Icon className="h-5 w-5 text-primary" />
                <div className="font-medium">{s.title}</div>
              </div>
              <div className="mt-2 text-sm text-text/80">{s.desc}</div>
            </div>
          );
        })}
      </div>
      {cta && (
        <div className="mt-6">
          <a data-cta="how" data-variant="primary" href={cta.href}>
            {cta.label}
          </a>
        </div>
      )}
    </section>
  );
}
