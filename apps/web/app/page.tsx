import contentV2 from '../lib/content/home.v2.json';
import { FAQAccordion } from '../components/sections/FAQAccordion';
import { HowItWorks } from '../components/sections/HowItWorks';
import { HeroCinematic } from '../components/sections/HeroCinematic';
import { KPIStatsWithLogos } from '../components/sections/KPIStatsWithLogos';
import { FeaturesAndActivitiesShowcase } from '../components/sections/FeaturesAndActivitiesShowcase';
import { AppPromo } from '../components/sections/AppPromo';
import { PlansAndComparison } from '../components/sections/PlansAndComparison';
import dynamic from 'next/dynamic';

// Lazy load below-the-fold components for better performance
const IntegrationsWall = dynamic(() => import('../components/sections/IntegrationsWall').then(m => ({ default: m.IntegrationsWall })), {
  ssr: true,
  loading: () => <div className="h-96 bg-surface animate-pulse rounded-lg" />
});

const TrustAndResults = dynamic(() => import('../components/sections/TrustAndResults').then(m => ({ default: m.TrustAndResults })), {
  ssr: true,
  loading: () => <div className="h-96 bg-surface animate-pulse rounded-lg" />
});

const SocialProofAndCTA = dynamic(() => import('../components/sections/SocialProofAndCTA').then(m => ({ default: m.SocialProofAndCTA })), {
  ssr: true,
  loading: () => <div className="h-96 bg-surface animate-pulse rounded-lg" />
});

// Layout primitives
import { Section } from '../components/primitives/Section';
import { Container } from '../components/primitives/Container';
import { Stack } from '../components/primitives/Stack';

export const revalidate = 86400;

export default function HomePage() {
  return (
    <Stack as="main" gap="0" className="min-h-screen">
      {/* Hero Section - No wrapper needed, component handles its own layout */}
      <HeroCinematic config={contentV2.HeroCinematic as any} />

      {/* KPI Stats + Logo Marquee Combined Section */}
      <Section tone="alt" size="lg">
        <Container>
          <KPIStatsWithLogos
            kpiItems={(contentV2 as any).KPI_Counters?.items || []}
            logoTitle={(contentV2 as any).LogoMarquee?.title}
            logos={(contentV2 as any).LogoMarquee?.logos || []}
          />
        </Container>
      </Section>

      {/* Features & Activities Showcase Section */}
      <Section tone="default" size="lg">
        <Container>
          <FeaturesAndActivitiesShowcase
            featuresIntro={(contentV2 as any).FeatureGridLight?.intro}
            featureCards={(contentV2 as any).FeatureGridLight?.cards || []}
            activitiesTitle={(contentV2 as any).ActivityCarousel?.title || 'Más de 250 actividades'}
            activityItems={(contentV2 as any).ActivityCarousel?.items || []}
          />
        </Container>
      </Section>

      {/* App Promo Section */}
      <Section tone="alt" size="lg">
        <Container>
          <AppPromo
            title={(contentV2 as any).AppPromo?.title || 'Todo en la palma de tu mano'}
            subtitle={
              (contentV2 as any).AppPromo?.subtitle ||
              'Reserva, accede y gestiona tu membresía desde la app.'
            }
            appBadges={(contentV2 as any).AppPromo?.appBadges !== false}
          />
        </Container>
      </Section>

      {/* Plans & Comparison Combined Section */}
      <Section tone="default" size="lg">
        <Container>
          <PlansAndComparison
            plansTitle={(contentV2 as any).PlansV2?.title || 'Planes para colaboradores'}
            plans={((contentV2 as any).PlansV2?.tiers as any) || []}
            comparisonTitle={(contentV2 as any).ComparisonTable?.title || 'Compara nuestros planes'}
            comparisonSubtitle={(contentV2 as any).ComparisonTable?.subtitle}
            comparisonPlans={((contentV2 as any).ComparisonTable?.plans as any) || []}
            comparisonFeatures={((contentV2 as any).ComparisonTable?.features as any) || []}
          />
        </Container>
      </Section>

      {/* How It Works Section */}
      <Section tone="default" size="lg">
        <Container>
          <HowItWorks
            title={(contentV2 as any).HowItWorks?.title || '¿Cómo funciona GoGym?'}
            steps={((contentV2 as any).HowItWorks?.steps as any) || []}
            cta={(contentV2 as any).HowItWorks?.cta}
          />
        </Container>
      </Section>

      {/* Integrations Wall Section */}
      <Section tone="alt" size="lg">
        <Container>
          <IntegrationsWall
            title={(contentV2 as any).IntegrationsWall?.title || 'Integraciones que potencian tu gimnasio'}
            subtitle={(contentV2 as any).IntegrationsWall?.subtitle}
            integrations={((contentV2 as any).IntegrationsWall?.integrations as any) || []}
          />
        </Container>
      </Section>

      {/* Trust & Results Combined Section */}
      <Section tone="default" size="lg">
        <Container>
          <TrustAndResults
            complianceTitle={(contentV2 as any).ComplianceRibbon?.title || 'Seguridad y cumplimiento de clase mundial'}
            compliancePoints={((contentV2 as any).ComplianceRibbon?.points as any) || []}
            resultsTitle={(contentV2 as any).ROIProofWithScroller?.title || 'Resultados reales que puedes medir'}
            resultsSubtitle={(contentV2 as any).ROIProofWithScroller?.subtitle}
            metrics={((contentV2 as any).ROIProofWithScroller?.metrics as any) || []}
          />
        </Container>
      </Section>

      {/* Social Proof & CTA Combined Section */}
      <Section tone="default" size="lg">
        <Container>
          <SocialProofAndCTA
            testimonialsTitle={(contentV2 as any).TestimonialsCarousel?.title || 'Lo que dicen nuestros clientes'}
            testimonialsSubtitle={(contentV2 as any).TestimonialsCarousel?.subtitle}
            testimonials={((contentV2 as any).TestimonialsCarousel?.testimonials as any) || []}
            ctaTitle={(contentV2 as any).FinalCTA?.title || 'Comienza hoy'}
            ctaDescription={
              (contentV2 as any).FinalCTA?.desc ||
              'Activa tu prueba y configura membresías, clases y facturación en minutos.'
            }
            primaryCTA={(contentV2 as any).FinalCTA?.cta || { label: 'Crear cuenta', href: '/registro' }}
            secondaryCTA={(contentV2 as any).FinalCTA?.secondary || { label: 'Ver planes', href: '/planes' }}
          />
        </Container>
      </Section>

      {/* FAQ Section */}
      <Section tone="default" size="md">
        <Container>
          <FAQAccordion
            title={(contentV2 as any).FAQAccordion?.title || 'Preguntas frecuentes'}
            items={(contentV2 as any).FAQAccordion?.items || []}
          />
        </Container>
      </Section>
    </Stack>
  );
}
