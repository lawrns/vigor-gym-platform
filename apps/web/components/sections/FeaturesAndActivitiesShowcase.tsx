'use client';
import Image from 'next/image';
import React, { useRef } from 'react';

// Static imports for reliable activity image loading
import activityA from '@/public/images/activity-a.webp';
import activityB from '@/public/images/activity-b.webp';
import activityC from '@/public/images/activity-c.webp';
import { FeatureCard } from '../ui/FeatureCard';
import { Stack } from '../primitives/Stack';

type FeatureCard = { icon: string; title: string; desc: string };
type ActivityItem = { label: string; image: string };

type FeaturesAndActivitiesShowcaseProps = {
  featuresIntro: string;
  featureCards: FeatureCard[];
  activitiesTitle: string;
  activityItems: ActivityItem[];
};

export function FeaturesAndActivitiesShowcase({ 
  featuresIntro, 
  featureCards, 
  activitiesTitle, 
  activityItems 
}: FeaturesAndActivitiesShowcaseProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  
  const scrollBy = (dir: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.9), behavior: 'smooth' });
  };

  return (
    <Stack gap="12">
      {/* Features Section */}
      <div>
        <h2 className="font-display text-2xl text-heading mb-6">{featuresIntro}</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {featureCards.map(card => (
            <FeatureCard 
              key={card.title} 
              iconName={card.icon as any} 
              title={card.title} 
              desc={card.desc} 
            />
          ))}
        </div>
      </div>

      {/* Activities Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 id="activities-heading" className="font-display text-2xl text-heading">
            {activitiesTitle}
          </h2>
          <div className="hidden md:flex gap-2" aria-label="Controles del carrusel" role="group">
            <button
              aria-label="Anterior"
              onClick={() => scrollBy(-1)}
              className="rounded-md border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Prev
            </button>
            <button
              aria-label="Siguiente"
              onClick={() => scrollBy(1)}
              className="rounded-md border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
        
        <div
          ref={scrollerRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none]"
          style={{ WebkitOverflowScrolling: 'touch' }}
          aria-labelledby="activities-heading"
          aria-live="polite"
        >
          {activityItems.map((item, i) => (
            <div
              key={item.label}
              className="min-w-[75%] md:min-w-[32%] snap-start rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden"
            >
              <div className="relative aspect-[4/3]">
                <Image
                  src={
                    item.image ||
                    (i % 3 === 0
                      ? activityA
                      : i % 3 === 1
                        ? activityB
                        : activityC)
                  }
                  alt={item.label}
                  fill
                  sizes="(max-width: 768px) 75vw, 33vw"
                  className="object-cover"
                />
              </div>
              <div className="p-3 text-sm text-gray-600 dark:text-gray-300">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </Stack>
  );
}
