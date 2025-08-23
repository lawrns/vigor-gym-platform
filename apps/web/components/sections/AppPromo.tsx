import Image from 'next/image';

// Static import for reliable image loading
import appImage from '@/public/images/app.png';

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
    <section className="max-w-6xl mx-auto px-4 py-8 grid md:grid-cols-2 gap-6 items-center">
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
      <div className="relative h-[350px] flex items-center justify-center">
        <Image
          src={appImage}
          alt="App móvil de GoGym"
          width={510}
          height={680}
          sizes="(min-width:1024px) 510px, 425px"
          className="object-contain max-h-full"
        />
      </div>
    </section>
  );
}
