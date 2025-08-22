import { z } from 'zod';

// Base schemas for common elements
const LinkSchema = z.object({
  label: z.string(),
  href: z.string(),
  variant: z.string().optional(),
  'data-cta': z.string().optional(),
});

const CTASchema = z.object({
  label: z.string(),
  href: z.string(),
  variant: z.string().optional(),
  'data-cta': z.string().optional(),
});

const BadgeSchema = z.object({
  icon: z.string(),
  label: z.string().optional(),
  text: z.string().optional(),
});

const ImageSchema = z.object({
  src: z.string(),
  alt: z.string(),
});

// Section schemas
const NavbarLightSchema = z.object({
  links: z.array(LinkSchema),
  cta: CTASchema,
});

const HeroCinematicSchema = z.object({
  bg: z.string(),
  image: ImageSchema,
  left: z.object({
    eyebrow: z.string(),
    title: z.string(),
    subtitle: z.string(),
    primaryCta: CTASchema,
    secondaryCta: CTASchema,
    trustBadges: z.array(BadgeSchema),
  }),
});

const KPICountersSchema = z.object({
  items: z.array(z.object({
    value: z.string(),
    label: z.string(),
    icon: z.string().optional(),
  })),
});

const FeatureGridLightSchema = z.object({
  intro: z.string(),
  cards: z.array(z.object({
    icon: z.string(),
    title: z.string(),
    desc: z.string(),
  })),
});

const LogoMarqueeSchema = z.object({
  title: z.string(),
  logos: z.array(z.object({
    name: z.string(),
    src: z.string(),
    alt: z.string().optional(),
  })),
});

const ActivityCarouselSchema = z.object({
  title: z.string(),
  items: z.array(z.object({
    name: z.string(),
    image: z.string(),
    category: z.string().optional(),
  })),
});

const AppPromoSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  appBadges: z.boolean().optional(),
});

const PlansV2Schema = z.object({
  title: z.string(),
  tiers: z.array(z.object({
    name: z.string(),
    price: z.string(),
    features: z.array(z.string()),
    cta: CTASchema,
    badge: z.string().optional(),
    highlight: z.boolean().optional(),
  })),
});

const HowItWorksSchema = z.object({
  title: z.string(),
  steps: z.array(z.object({
    icon: z.string(),
    title: z.string(),
    desc: z.string(),
  })),
  cta: CTASchema.optional(),
});

const FinalCTASchema = z.object({
  title: z.string(),
  desc: z.string(),
  cta: CTASchema,
  secondary: CTASchema.optional(),
});

const FAQAccordionSchema = z.object({
  title: z.string(),
  items: z.array(z.object({
    q: z.string(),
    a: z.string(),
  })),
});

// Missing section schemas that need to be implemented
const ComparisonTableSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  plans: z.array(z.object({
    name: z.string(),
    price: z.string(),
    features: z.array(z.string()),
    highlight: z.boolean().optional(),
    cta: CTASchema,
  })),
  features: z.array(z.object({
    name: z.string(),
    basic: z.boolean(),
    pro: z.boolean(),
    enterprise: z.boolean(),
  })),
});

const IntegrationsWallSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  integrations: z.array(z.object({
    name: z.string(),
    logo: z.string(),
    category: z.string(),
    status: z.enum(['available', 'coming_soon']).optional(),
  })),
});

const ComplianceRibbonSchema = z.object({
  title: z.string(),
  points: z.array(z.string()),
});

const ROIProofWithScrollerSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  metrics: z.array(z.object({
    value: z.string(),
    label: z.string(),
    description: z.string().optional(),
  })),
});

const TestimonialsCarouselSchema = z.object({
  title: z.string(),
  testimonials: z.array(z.object({
    quote: z.string(),
    author: z.string(),
    role: z.string(),
    company: z.string(),
    avatar: z.string().optional(),
  })),
});

// Main content schema
export const HomeContentV2Schema = z.object({
  sections_order: z.array(z.string()),
  NavbarLight: NavbarLightSchema.optional(),
  HeroCinematic: HeroCinematicSchema.optional(),
  KPI_Counters: KPICountersSchema.optional(),
  FeatureGridLight: FeatureGridLightSchema.optional(),
  LogoMarquee: LogoMarqueeSchema.optional(),
  ActivityCarousel: ActivityCarouselSchema.optional(),
  AppPromo: AppPromoSchema.optional(),
  PlansV2: PlansV2Schema.optional(),
  HowItWorks: HowItWorksSchema.optional(),
  FinalCTA: FinalCTASchema.optional(),
  FAQAccordion: FAQAccordionSchema.optional(),
  // Missing sections that need implementation
  ComparisonTable: ComparisonTableSchema.optional(),
  IntegrationsWall: IntegrationsWallSchema.optional(),
  ComplianceRibbon: ComplianceRibbonSchema.optional(),
  ROIProofWithScroller: ROIProofWithScrollerSchema.optional(),
  TestimonialsCarousel: TestimonialsCarouselSchema.optional(),
});

export type HomeContentV2 = z.infer<typeof HomeContentV2Schema>;

// Validation function
export function validateHomeContent(content: unknown): HomeContentV2 {
  return HomeContentV2Schema.parse(content);
}

// Safe validation function
export function safeValidateHomeContent(content: unknown) {
  return HomeContentV2Schema.safeParse(content);
}
