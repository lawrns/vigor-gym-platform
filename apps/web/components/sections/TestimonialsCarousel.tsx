'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Icons } from '../../lib/icons/registry';

// Static import for reliable avatar fallback
import logo1Image from '@/public/images/logo-1.webp';

type Testimonial = {
  name: string;
  role: string;
  company: string;
  content: string;
  avatar?: string;
  rating: number;
};

type TestimonialsCarouselProps = {
  title: string;
  subtitle?: string;
  testimonials: Testimonial[];
};

export function TestimonialsCarousel({ title, subtitle, testimonials }: TestimonialsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const liveRegionRef = useRef<HTMLDivElement>(null);

  // Auto-advance testimonials every 6 seconds
  useEffect(() => {
    if (!isAutoPlaying || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [testimonials.length, isAutoPlaying, isPaused]);

  // Update live region for screen readers when testimonial changes
  useEffect(() => {
    if (liveRegionRef.current && testimonials[currentIndex]) {
      const testimonial = testimonials[currentIndex];
      liveRegionRef.current.textContent = `Testimonio ${currentIndex + 1} de ${testimonials.length}. ${testimonial.content} - ${testimonial.name}, ${testimonial.role} en ${testimonial.company}`;
    }
  }, [currentIndex, testimonials]);

  const handleTestimonialClick = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    // Resume auto-play after 15 seconds
    setTimeout(() => setIsAutoPlaying(true), 15000);
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 15000);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 15000);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Icons.Star
        key={i}
        className={`w-5 h-5 ${
          i < rating 
            ? 'text-yellow-400 fill-current' 
            : 'text-gray-300 dark:text-gray-600'
        }`}
      />
    ));
  };

  if (!testimonials.length) return null;

  return (
    <section 
      className="bg-white dark:bg-gray-900 py-16"
      data-evt="section.view"
      data-section="testimonials-carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {title}
          </h2>
          {subtitle && (
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              {subtitle}
            </p>
          )}
        </div>

        {/* Main Testimonial Display */}
        <div className="relative max-w-4xl mx-auto">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 md:p-12 shadow-lg">
            {/* Quote Icon */}
            <div className="flex justify-center mb-6">
              <Icons.Quote className="w-12 h-12 text-blue-500 opacity-50" />
            </div>

            {/* Testimonial Content */}
            <blockquote className="text-xl md:text-2xl text-gray-900 dark:text-white text-center mb-8 leading-relaxed">
              "{testimonials[currentIndex]?.content}"
            </blockquote>

            {/* Rating */}
            <div className="flex justify-center mb-6">
              {renderStars(testimonials[currentIndex]?.rating || 5)}
            </div>

            {/* Author Info */}
            <div className="flex items-center justify-center space-x-4">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {testimonials[currentIndex]?.avatar ? (
                  <div className="relative w-16 h-16 rounded-full overflow-hidden">
                    <Image
                      src={
                        testimonials[currentIndex].avatar === 'static-import' ||
                        testimonials[currentIndex].avatar.startsWith('/images/')
                          ? logo1Image
                          : testimonials[currentIndex].avatar
                      }
                      alt={`${testimonials[currentIndex].name} avatar`}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">
                      {testimonials[currentIndex]?.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              {/* Author Details */}
              <div className="text-center">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {testimonials[currentIndex]?.name}
                </h4>
                <p className="text-gray-600 dark:text-gray-300">
                  {testimonials[currentIndex]?.role}
                </p>
                <p className="text-blue-600 dark:text-blue-400 font-medium">
                  {testimonials[currentIndex]?.company}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={handlePrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow duration-200 z-10"
            aria-label="Testimonio anterior"
          >
            <Icons.ChevronLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </button>
          
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow duration-200 z-10"
            aria-label="Siguiente testimonio"
          >
            <Icons.ChevronRight className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Testimonial Indicators */}
        <div className="flex justify-center mt-8 space-x-2">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => handleTestimonialClick(index)}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                index === currentIndex
                  ? 'bg-blue-500 scale-125'
                  : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
              }`}
              aria-label={`Ir al testimonio ${index + 1} de ${testimonials.length}`}
            />
          ))}
        </div>

        {/* Auto-play Controls */}
        <div className="flex justify-center mt-6">
          <button
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
          >
            {isAutoPlaying ? (
              <>
                <Icons.Pause className="w-4 h-4" />
                <span>Pausar rotación automática</span>
              </>
            ) : (
              <>
                <Icons.Play className="w-4 h-4" />
                <span>Reanudar rotación automática</span>
              </>
            )}
          </button>
        </div>

        {/* Accessibility: Live region for screen readers */}
        <div
          ref={liveRegionRef}
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        />

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <a
            href="/casos-de-exito"
            data-evt="cta.click"
            data-cta="testimonials-case-studies"
            className="inline-flex items-center px-6 py-3 border border-blue-600 text-blue-600 font-medium rounded-md hover:bg-blue-600 hover:text-white transition-colors duration-200"
          >
            <Icons.Users className="w-5 h-5 mr-2" />
            Ver más casos de éxito
          </a>
        </div>
      </div>
    </section>
  );
}
