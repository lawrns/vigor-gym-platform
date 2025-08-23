import Image from 'next/image';

// Static import for reliable image loading
import heroFitnessImage from '@/public/images/hero-fitness.webp';

export function AppPromo({
  title,
  subtitle,
  appBadges = true,
}: {
  title: string;
  subtitle: string;
  appBadges?: boolean;
}) {
  return (
    <section className="max-w-6xl mx-auto px-4 py-12 grid md:grid-cols-2 gap-6 items-center">
      <div className="rounded-xl border border-[var(--outline)] bg-[var(--surface)] p-6">
        <h3 className="font-display text-2xl text-heading">{title}</h3>
        <p className="text-text/85 mt-2">{subtitle}</p>
        {appBadges && (
          <div className="mt-4 flex gap-3">
            <a
              href="#"
              className="inline-flex items-center gap-2 rounded-md bg-black text-white px-3 py-2 text-sm"
            >
              App Store
            </a>
            <a
              href="#"
              className="inline-flex items-center gap-2 rounded-md bg-black text-white px-3 py-2 text-sm"
            >
              Google Play
            </a>
          </div>
        )}
      </div>
      <div className="relative h-[420px] rounded-xl border border-[var(--outline)] bg-card overflow-hidden">
        <Image
          src={heroFitnessImage}
          alt="Entrenamiento corporativo"
          fill
          sizes="(min-width:1024px) 600px, 90vw"
          className="object-cover"
        />
      </div>
    </section>
  );
}
