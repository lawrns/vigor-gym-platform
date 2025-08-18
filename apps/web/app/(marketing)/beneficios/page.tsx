import { Metadata } from 'next';
import { HeroSplit } from '../../../components/marketing/HeroSplit';
import { IconGrid } from '../../../components/marketing/IconGrid';
import { Steps3 } from '../../../components/marketing/Steps3';
import { FeatureCallout } from '../../../components/marketing/FeatureCallout';
import { FAQ } from '../../../components/marketing/FAQ';
import { BigCTA } from '../../../components/marketing/BigCTA';
import { TrackingProvider } from '../../../components/marketing/TrackingProvider';
import content from '../../../lib/content/beneficios.json';

export const metadata: Metadata = {
  title: 'GoGym: Tu gimnasio, más inteligente',
  description: 'Reserva clases, accede con código QR, paga sin fricción y recibe coaching inteligente.',
  keywords: ['gimnasio', 'reservar clases', 'app gimnasio', 'beneficios', 'IA', 'México'],
  openGraph: {
    title: 'GoGym: Tu gimnasio, más inteligente',
    description: 'Reserva clases, accede con código QR, paga sin fricción y recibe coaching inteligente.',
    images: ['/img/og/gogym-beneficios.png'],
    type: 'website',
    locale: 'es_MX',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GoGym: Tu gimnasio, más inteligente',
    description: 'Reserva clases, accede con código QR, paga sin fricción y recibe coaching inteligente.',
    images: ['/img/og/gogym-beneficios.png'],
  },
};

// Enable ISR with 1 hour revalidation
export const revalidate = 3600;

export default function BeneficiosPage() {
  return (
    <TrackingProvider>
      <main>
      {/* Hero Section */}
      <HeroSplit
        headline={content.hero.headline_es}
        subtitle={content.hero.sub_es}
        primaryCta={content.hero.primary_cta}
        secondaryCta={content.hero.secondary_cta}
        visual={content.hero.visual as { type: 'deviceStack' | 'inlineVideo'; assets: string[] }}
        testId="hero-split"
      />

      {/* Benefits Grid */}
      <IconGrid
        items={content.benefits.items_es}
        testId="benefits-grid"
      />

      {/* How It Works */}
      <Steps3
        steps={content.how_it_works.steps_es}
        testId="how-it-works"
      />

      {/* AI Feature Banner */}
      <FeatureCallout
        badge={content.ai_banner.badge}
        title={content.ai_banner.title_es}
        bullets={content.ai_banner.bullets_es}
        cta={content.ai_banner.cta}
        testId="ai-callout"
      />

      {/* FAQ Section */}
      <FAQ
        items={content.faq.items_es}
        testId="faq"
      />

      {/* Final CTA */}
      <BigCTA
        title={content.cta.title_es}
        primaryCta={content.cta.primary_cta}
        secondaryCta={content.cta.secondary_cta}
        testId="cta-bottom"
      />
      </main>
    </TrackingProvider>
  );
}
