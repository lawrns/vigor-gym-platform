import { Icons } from '../../lib/icons/registry';
import Image from 'next/image';

// Static imports for reliable image loading
import heroDashboard from '@/public/images/hero-dashboard.webp';
import heroApp from '@/public/images/hero-app.webp';
import adonisImage from '@/public/images/adonis.png';

type Cta = { label: string; href: string; variant?: 'primary' | 'ghost'; ['data-cta']?: string };
type Trust = { icon: keyof typeof Icons; label: string };

type HeroConfig = {
  bg?: string; // token alias or gradient string (e.g. '@color.gradient.hero.primary' or a literal)
  image?: { src: string; alt: string };
  left: {
    eyebrow?: string;
    title: string;
    subtitle?: string;
    primaryCta?: Cta;
    secondaryCta?: Cta;
    trustBadges?: Trust[];
  };
};

export function HeroCinematic({ config }: { config: HeroConfig }) {
  const { left } = config;
  const gradient = (() => {
    const luminous = 'linear-gradient(135deg, #E9F0FF 0%, #F8FBFF 50%, #EAF7FF 100%)';
    if (!config?.bg) return luminous;
    if (config.bg.startsWith('linear-gradient')) return config.bg;
    if (config.bg.includes('gradient') || config.bg.includes('hero')) return luminous;
    return luminous;
  })();

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0" style={{ backgroundImage: gradient }} />
      <div className="relative max-w-6xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-10 items-center">
        <div>
          {left.eyebrow && (
            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors border-[var(--outline)] bg-[var(--surface-alt)]/40 text-text/90">
              {left.eyebrow}
            </div>
          )}
          <h1 className="mt-4 font-display text-[clamp(34px,4vw,48px)] leading-[1.2] tracking-[0] text-heading">
            {left.title}
          </h1>
          {left.subtitle && (
            <p className="mt-4 text-[clamp(16px,2vw,20px)] leading-[1.5] text-[#374151] font-normal">
              {left.subtitle}
            </p>
          )}
          <div className="mt-6 flex gap-3">
            {left.primaryCta && (
              <a
                data-cta={left.primaryCta['data-cta'] || 'hero'}
                data-variant="primary"
                href={left.primaryCta.href}
              >
                {left.primaryCta.label}
              </a>
            )}
            {left.secondaryCta && (
              <a
                data-cta={left.secondaryCta['data-cta'] || 'hero-secondary'}
                data-variant="secondary"
                href={left.secondaryCta.href}
              >
                {left.secondaryCta.label}
              </a>
            )}
          </div>
          {left.trustBadges && left.trustBadges.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-3 text-text/80">
              {left.trustBadges.map(b => {
                const Icon = (Icons as any)[b.icon] || Icons.ShieldCheck;
                return (
                  <div key={b.label} className="inline-flex items-center gap-2 text-sm">
                    <Icon className="h-4 w-4 text-primary" />
                    <span>{b.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="grid gap-4">
          <div className="relative h-[340px] md:h-[440px] rounded-xl border border-[var(--outline)] bg-card overflow-hidden">
            <Image
              src={
                config.image?.src === 'static-import' || !config.image?.src || config.image?.src.startsWith('/images/')
                  ? adonisImage
                  : config.image.src
              }
              alt={config.image?.alt || 'Vista del dashboard de GoGym'}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority
              unoptimized
            />
          </div>
          <div className="hidden md:block relative h-[180px] rounded-xl border border-[var(--outline)] bg-card overflow-hidden">
            <Image
              src={heroApp}
              alt={'App móvil de GoGym'}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              unoptimized
              className="object-cover"
              priority={false}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
