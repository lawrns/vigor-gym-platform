import contentV2 from '../lib/content/home.v2.json';
import { LogoMarquee as LogoMarqueeSection } from '../components/sections/LogoMarquee';
import { PlansSection } from '../components/sections/Plans';
import { FAQAccordion } from '../components/sections/FAQAccordion';
import { HowItWorks } from '../components/sections/HowItWorks';
import { CTA_Banner } from '../components/sections/CTA_Banner';
import { HeroCinematic } from '../components/sections/HeroCinematic';
import { KPI_Counters } from '../components/sections/KPI_Counters';
import { FeatureGridLight } from '../components/sections/FeatureGridLight';
import { ActivityCarousel } from '../components/sections/ActivityCarousel';
import { AppPromo } from '../components/sections/AppPromo';

export default function HomePage() {
  return (
    <main>
      {/* Render new cinematic hero from v2 content */}
      <HeroCinematic config={contentV2.HeroCinematic as any} />
      <KPI_Counters items={(contentV2 as any).KPI_Counters?.items || []} />
      <FeatureGridLight
        intro={(contentV2 as any).FeatureGridLight?.intro}
        cards={(contentV2 as any).FeatureGridLight?.cards || []}
      />
      {/* Switch LogoMarquee to v2 content (light variant) */}
      <LogoMarqueeSection
        title={(contentV2 as any).LogoMarquee?.title}
        logos={(contentV2 as any).LogoMarquee?.logos || []}
      />
      <ActivityCarousel
        title={(contentV2 as any).ActivityCarousel?.title || 'Más de 250 actividades'}
        items={(contentV2 as any).ActivityCarousel?.items || []}
      />
      <AppPromo
        title={(contentV2 as any).AppPromo?.title || 'Todo en la palma de tu mano'}
        subtitle={
          (contentV2 as any).AppPromo?.subtitle ||
          'Reserva, accede y gestiona tu membresía desde la app.'
        }
        appBadges={(contentV2 as any).AppPromo?.appBadges !== false}
      />
      <PlansSection
        title={(contentV2 as any).PlansV2?.title || 'Planes para colaboradores'}
        tiers={((contentV2 as any).PlansV2?.tiers as any) || []}
      />
      <HowItWorks
        title={(contentV2 as any).HowItWorks?.title || '¿Cómo funciona Vigor?'}
        steps={((contentV2 as any).HowItWorks?.steps as any) || []}
        cta={(contentV2 as any).HowItWorks?.cta}
      />
      <CTA_Banner
        title={(contentV2 as any).FinalCTA?.title || 'Comienza hoy'}
        desc={
          (contentV2 as any).FinalCTA?.desc ||
          'Activa tu prueba y configura membresías, clases y facturación en minutos.'
        }
        cta={(contentV2 as any).FinalCTA?.cta || { label: 'Crear cuenta', href: '/registro' }}
        secondary={
          (contentV2 as any).FinalCTA?.secondary || { label: 'Ver planes', href: '/planes' }
        }
      />
      <FAQAccordion
        title={(contentV2 as any).FAQAccordion?.title || 'Preguntas frecuentes'}
        items={(contentV2 as any).FAQAccordion?.items || []}
      />
    </main>
  );
}
