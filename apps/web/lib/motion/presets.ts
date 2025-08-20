export type MotionVariant = Record<string, any>;

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function maybeDisable<T extends MotionVariant>(variant: T): T {
  if (!prefersReducedMotion) return variant;
  const clone = JSON.parse(JSON.stringify(variant));
  if (clone.initial) {
    clone.initial.opacity = 1;
    clone.initial.y = 0;
    clone.initial.scale = 1;
  }
  if (clone.animate) {
    clone.animate.opacity = 1;
    clone.animate.y = 0;
    clone.animate.scale = 1;
  }
  if (clone.whileHover) {
    clone.whileHover = {};
  }
  return clone;
}

export const motionPresets = {
  'enter.fadeUp': maybeDisable({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.24, ease: [0.2, 0.8, 0.2, 1] },
  }),
  'enter.scaleIn': maybeDisable({
    initial: { opacity: 0, scale: 0.97 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.24, ease: [0.2, 0.8, 0.2, 1] },
  }),
  'hover.lift': maybeDisable({
    whileHover: { y: -4 },
  }),
  'stagger.children': {
    transition: { staggerChildren: 0.08, delayChildren: 0.12 },
  },
} as const;

