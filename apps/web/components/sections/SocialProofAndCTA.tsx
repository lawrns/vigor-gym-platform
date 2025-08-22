'use client';
import { useState, useEffect } from 'react';
import { Icons } from '../../lib/icons/registry';
import { Stack } from '../primitives/Stack';

type Testimonial = {
  name: string;
  role: string;
  company: string;
  content: string;
  avatar?: string;
  rating?: number;
};

type CTA = {
  label: string;
  href: string;
};

type SocialProofAndCTAProps = {
  testimonialsTitle: string;
  testimonialsSubtitle?: string;
  testimonials: Testimonial[];
  ctaTitle: string;
  ctaDescription: string;
  primaryCTA: CTA;
  secondaryCTA?: CTA;
};

export function SocialProofAndCTA({
  testimonialsTitle,
  testimonialsSubtitle,
  testimonials,
  ctaTitle,
  ctaDescription,
  primaryCTA,
  secondaryCTA
}: SocialProofAndCTAProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-advance testimonials
  useEffect(() => {
    if (!isAutoPlaying || testimonials.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, testimonials.length]);

  const goToTestimonial = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    // Resume auto-play after 10 seconds
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const navigateTestimonial = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev' 
      ? (currentIndex - 1 + testimonials.length) % testimonials.length
      : (currentIndex + 1) % testimonials.length;
    goToTestimonial(newIndex);
  };

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
  };

  const currentTestimonial = testimonials[currentIndex];

  return (
    <Stack gap="16">
      {/* Testimonials Section */}
      <div>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-heading mb-4">
            {testimonialsTitle}
          </h2>
          {testimonialsSubtitle && (
            <p className="text-lg text-muted max-w-3xl mx-auto">
              {testimonialsSubtitle}
            </p>
          )}
        </div>

        {testimonials.length > 0 && (
          <div className="max-w-4xl mx-auto">
            {/* Main Testimonial Display */}
            <div className="relative bg-card rounded-2xl p-8 md:p-12 shadow-card">
              {/* Navigation Buttons */}
              <div className="flex justify-between items-center mb-8">
                <button
                  onClick={() => navigateTestimonial('prev')}
                  className="p-2 rounded-full hover:bg-surface transition-colors"
                  aria-label="Testimonio anterior"
                >
                  <Icons.ChevronLeft className="w-6 h-6 text-muted" />
                </button>

                <div className="text-center">
                  <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
                    {currentTestimonial?.avatar ? (
                      <img 
                        src={currentTestimonial.avatar} 
                        alt={currentTestimonial.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-primary">
                        {currentTestimonial?.name?.charAt(0) || 'T'}
                      </span>
                    )}
                  </div>
                  
                  <blockquote className="text-xl md:text-2xl text-heading font-medium mb-6 leading-relaxed">
                    "{currentTestimonial?.content}"
                  </blockquote>

                  {/* Rating Stars */}
                  {currentTestimonial?.rating && (
                    <div className="flex justify-center gap-1 mb-4">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Icons.Star
                          key={i}
                          className={`w-5 h-5 ${
                            i < currentTestimonial.rating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Author Info */}
                  <div className="text-center">
                    <div className="font-semibold text-heading">
                      {currentTestimonial?.name}
                    </div>
                    <div className="text-muted text-sm">
                      {currentTestimonial?.role}
                    </div>
                    <div className="text-muted text-sm">
                      {currentTestimonial?.company}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => navigateTestimonial('next')}
                  className="p-2 rounded-full hover:bg-surface transition-colors"
                  aria-label="Siguiente testimonio"
                >
                  <Icons.ChevronRight className="w-6 h-6 text-muted" />
                </button>
              </div>
            </div>

            {/* Testimonial Indicators */}
            <div className="flex justify-center items-center gap-4 mt-8">
              <div className="flex gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToTestimonial(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-200 ${
                      index === currentIndex
                        ? 'bg-primary scale-125'
                        : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                    }`}
                    aria-label={`Ir al testimonio ${index + 1} de ${testimonials.length}`}
                  />
                ))}
              </div>

              {/* Auto-play Toggle */}
              <button
                onClick={toggleAutoPlay}
                className="flex items-center gap-2 px-3 py-1 text-sm text-muted hover:text-heading transition-colors"
                aria-label={`${isAutoPlaying ? 'Pausar' : 'Reanudar'} rotación automática`}
              >
                {isAutoPlaying ? (
                  <Icons.Pause className="w-4 h-4" />
                ) : (
                  <Icons.Play className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">
                  {isAutoPlaying ? 'Pausar rotación automática' : 'Reanudar rotación automática'}
                </span>
              </button>
            </div>

            {/* Screen Reader Announcement */}
            <div className="sr-only" aria-live="polite" aria-atomic="true">
              Testimonio {currentIndex + 1} de {testimonials.length}. {currentTestimonial?.content} - {currentTestimonial?.name}, {currentTestimonial?.role} en {currentTestimonial?.company}
            </div>
          </div>
        )}
      </div>

      {/* CTA Section */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-8 md:p-12 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-heading mb-4">
          {ctaTitle}
        </h2>
        <p className="text-lg text-muted mb-8 max-w-2xl mx-auto">
          {ctaDescription}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href={primaryCTA.href}
            className="inline-flex items-center justify-center px-8 py-4 bg-primary text-white rounded-lg font-semibold hover:bg-primary-emph transition-colors shadow-card"
          >
            {primaryCTA.label}
          </a>
          
          {secondaryCTA && (
            <a
              href={secondaryCTA.href}
              className="inline-flex items-center justify-center px-8 py-4 bg-transparent border-2 border-primary text-primary rounded-lg font-semibold hover:bg-primary hover:text-white transition-colors"
            >
              {secondaryCTA.label}
            </a>
          )}
        </div>
      </div>
    </Stack>
  );
}
