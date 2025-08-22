'use client';

import { useState, useEffect, useRef } from 'react';
import { Icons } from '../../lib/icons/registry';
import { Stack } from '../primitives/Stack';

type Metric = {
  value: string;
  label: string;
  description?: string;
};

type TrustAndResultsProps = {
  complianceTitle: string;
  compliancePoints: string[];
  resultsTitle: string;
  resultsSubtitle?: string;
  metrics: Metric[];
};

export function TrustAndResults({ 
  complianceTitle, 
  compliancePoints, 
  resultsTitle, 
  resultsSubtitle, 
  metrics 
}: TrustAndResultsProps) {
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

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
  };

  const navigateMetric = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev' 
      ? (currentIndex - 1 + metrics.length) % metrics.length
      : (currentIndex + 1) % metrics.length;
    setCurrentIndex(newIndex);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  return (
    <Stack gap="16">
      {/* Compliance Section */}
      <div className="bg-blue-600 dark:bg-blue-700 py-12 rounded-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">
              {complianceTitle}
            </h2>
          </div>

          {/* Compliance Points */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {compliancePoints.map((point, index) => (
              <div
                key={index}
                className="flex items-center justify-center text-center"
              >
                <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3 w-full">
                  <div className="flex-shrink-0">
                    {point.toLowerCase().includes('cfdi') || point.toLowerCase().includes('facturación') ? (
                      <Icons.FileText className="w-6 h-6 text-white" />
                    ) : point.toLowerCase().includes('seguridad') || point.toLowerCase().includes('cifrado') ? (
                      <Icons.Shield className="w-6 h-6 text-white" />
                    ) : point.toLowerCase().includes('datos') || point.toLowerCase().includes('privacidad') ? (
                      <Icons.Lock className="w-6 h-6 text-white" />
                    ) : point.toLowerCase().includes('auditoría') || point.toLowerCase().includes('certificación') ? (
                      <Icons.Award className="w-6 h-6 text-white" />
                    ) : point.toLowerCase().includes('respaldo') || point.toLowerCase().includes('backup') ? (
                      <Icons.Database className="w-6 h-6 text-white" />
                    ) : point.toLowerCase().includes('soporte') || point.toLowerCase().includes('disponibilidad') ? (
                      <Icons.Clock className="w-6 h-6 text-white" />
                    ) : (
                      <Icons.CheckCircle className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <span className="text-white font-medium text-sm">
                    {point}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-80">
            <div className="flex items-center space-x-2">
              <Icons.Shield className="w-5 h-5 text-white" />
              <span className="text-white text-sm font-medium">SOC 2 Type II</span>
            </div>
            <div className="flex items-center space-x-2">
              <Icons.Globe className="w-5 h-5 text-white" />
              <span className="text-white text-sm font-medium">GDPR Compliant</span>
            </div>
            <div className="flex items-center space-x-2">
              <Icons.Award className="w-5 h-5 text-white" />
              <span className="text-white text-sm font-medium">ISO 27001</span>
            </div>
            <div className="flex items-center space-x-2">
              <Icons.MapPin className="w-5 h-5 text-white" />
              <span className="text-white text-sm font-medium">Datos en México</span>
            </div>
            <div className="flex items-center space-x-2">
              <Icons.Activity className="w-5 h-5 text-white" />
              <span className="text-white text-sm font-medium">99.9% Uptime</span>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {resultsTitle}
          </h2>
          {resultsSubtitle && (
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              {resultsSubtitle}
            </p>
          )}
        </div>

        {/* Current Metric Display */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-between bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 min-w-[400px]">
            <button
              onClick={() => navigateMetric('prev')}
              className="p-2 rounded-full hover:bg-surface transition-colors"
              aria-label="Métrica anterior"
            >
              <Icons.ChevronLeft className="w-6 h-6 text-muted" />
            </button>
            
            <div className="text-center px-6">
              <div className="text-4xl font-bold text-primary mb-2">
                {metrics[currentIndex]?.value}
              </div>
              <h3 className="text-xl font-semibold text-heading mb-2">
                {metrics[currentIndex]?.label}
              </h3>
              {metrics[currentIndex]?.description && (
                <p className="text-muted text-sm max-w-xs">
                  {metrics[currentIndex].description}
                </p>
              )}
            </div>
            
            <button
              onClick={() => navigateMetric('next')}
              className="p-2 rounded-full hover:bg-surface transition-colors"
              aria-label="Siguiente métrica"
            >
              <Icons.ChevronRight className="w-6 h-6 text-muted" />
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {metrics.map((metric, index) => (
            <button
              key={index}
              onClick={() => handleMetricClick(index)}
              className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                index === currentIndex
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className={`text-2xl font-bold mb-1 ${
                index === currentIndex ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'
              }`}>
                {metric.value}
              </div>
              <h4 className={`text-sm font-medium ${
                index === currentIndex ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
              }`}>
                {metric.label}
              </h4>
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex justify-center items-center gap-4">
          <button
            onClick={toggleAutoPlay}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            aria-label={isAutoPlaying ? 'Pausar rotación automática' : 'Reanudar rotación automática'}
          >
            {isAutoPlaying ? (
              <Icons.Pause className="w-4 h-4" />
            ) : (
              <Icons.Play className="w-4 h-4" />
            )}
            <span className="sr-only">
              {isAutoPlaying ? 'Pausar rotación automática' : 'Reanudar rotación automática'}
            </span>
          </button>
          
          <a
            href="/demo"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Icons.ExternalLink className="w-4 h-4" />
            Ver estos resultados en acción
          </a>
        </div>
      </div>
    </Stack>
  );
}
