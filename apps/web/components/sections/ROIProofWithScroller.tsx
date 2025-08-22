'use client';

import { useState, useEffect, useRef } from 'react';
import { Icons } from '../../lib/icons/registry';

type Metric = {
  value: string;
  label: string;
  description?: string;
};

type ROIProofWithScrollerProps = {
  title: string;
  subtitle?: string;
  metrics: Metric[];
};

export function ROIProofWithScroller({ title, subtitle, metrics }: ROIProofWithScrollerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Auto-advance metrics every 4 seconds
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % metrics.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [metrics.length, isAutoPlaying]);

  // Scroll to current metric
  useEffect(() => {
    if (scrollerRef.current) {
      const metricWidth = scrollerRef.current.scrollWidth / metrics.length;
      scrollerRef.current.scrollTo({
        left: currentIndex * metricWidth,
        behavior: 'smooth'
      });
    }
  }, [currentIndex, metrics.length]);

  const handleMetricClick = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    // Resume auto-play after 10 seconds
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + metrics.length) % metrics.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % metrics.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  return (
    <section 
      className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 py-16"
      data-evt="section.view"
      data-section="roi-proof-scroller"
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

        {/* Main Metric Display */}
        <div className="relative mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
            <div className="text-6xl font-bold text-green-600 dark:text-green-400 mb-4">
              {metrics[currentIndex]?.value}
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              {metrics[currentIndex]?.label}
            </h3>
            {metrics[currentIndex]?.description && (
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                {metrics[currentIndex].description}
              </p>
            )}
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={handlePrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow duration-200"
            aria-label="Métrica anterior"
          >
            <Icons.ChevronLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </button>
          
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow duration-200"
            aria-label="Siguiente métrica"
          >
            <Icons.ChevronRight className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Metrics Scroller */}
        <div className="relative">
          <div
            ref={scrollerRef}
            className="flex overflow-x-auto scrollbar-hide space-x-4 pb-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {metrics.map((metric, index) => (
              <div
                key={index}
                onClick={() => handleMetricClick(index)}
                className={`flex-shrink-0 w-64 p-6 rounded-lg cursor-pointer transition-all duration-200 ${
                  index === currentIndex
                    ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-500 scale-105'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-md'
                }`}
              >
                <div className={`text-3xl font-bold mb-2 ${
                  index === currentIndex 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-gray-900 dark:text-white'
                }`}>
                  {metric.value}
                </div>
                <h4 className={`font-semibold mb-1 ${
                  index === currentIndex 
                    ? 'text-green-800 dark:text-green-300' 
                    : 'text-gray-900 dark:text-white'
                }`}>
                  {metric.label}
                </h4>
                {metric.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                    {metric.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Progress Indicators */}
        <div className="flex justify-center mt-6 space-x-2">
          {metrics.map((_, index) => (
            <button
              key={index}
              onClick={() => handleMetricClick(index)}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                index === currentIndex
                  ? 'bg-green-500 scale-125'
                  : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
              }`}
              aria-label={`Ir a métrica ${index + 1}`}
            />
          ))}
        </div>

        {/* Auto-play indicator */}
        <div className="flex justify-center mt-4">
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

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <a
            href="/demo"
            data-evt="cta.click"
            data-cta="roi-proof-demo"
            className="inline-flex items-center px-8 py-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
          >
            <Icons.TrendingUp className="w-5 h-5 mr-2" />
            Ver estos resultados en acción
          </a>
        </div>
      </div>
    </section>
  );
}
