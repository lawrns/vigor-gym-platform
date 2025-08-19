'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Icons } from '../../lib/icons/registry';
import { motionPresets } from '../../lib/motion/presets';
import { trackEvent } from '../../hooks/useTracking';

interface DemoProgressMiniProps {
  streakDays: number;
  monthlyVisits: number;
  trendUp: boolean;
  testId?: string;
}

export function DemoProgressMini({
  streakDays,
  monthlyVisits,
  trendUp,
  testId = 'demo-progress',
}: DemoProgressMiniProps) {
  const [animatedStreak, setAnimatedStreak] = useState(0);
  const [animatedVisits, setAnimatedVisits] = useState(0);
  const [showInsight, setShowInsight] = useState(false);

  useEffect(() => {
    // Track when component is viewed
    trackEvent('demo_progress_view', {
      streakDays,
      monthlyVisits,
      trendUp,
    });

    // Animate numbers
    const streakTimer = setInterval(() => {
      setAnimatedStreak(prev => {
        if (prev >= streakDays) {
          clearInterval(streakTimer);
          return streakDays;
        }
        return prev + 1;
      });
    }, 200);

    const visitsTimer = setInterval(() => {
      setAnimatedVisits(prev => {
        if (prev >= monthlyVisits) {
          clearInterval(visitsTimer);
          return monthlyVisits;
        }
        return prev + 1;
      });
    }, 150);

    // Show insight after animation
    const insightTimer = setTimeout(() => {
      setShowInsight(true);
    }, 2000);

    return () => {
      clearInterval(streakTimer);
      clearInterval(visitsTimer);
      clearTimeout(insightTimer);
    };
  }, [streakDays, monthlyVisits, trendUp]);

  const getStreakMessage = () => {
    if (streakDays >= 7) return '¡Increíble racha! 🔥';
    if (streakDays >= 3) return '¡Vas muy bien! 💪';
    return '¡Sigue así! ⭐';
  };

  const getTrendMessage = () => {
    if (trendUp) {
      return 'Estás visitando más que el mes pasado';
    }
    return 'Intenta mantener tu ritmo de visitas';
  };

  return (
    <section
      data-testid={testId}
      className="bg-white rounded-2xl border border-outline p-8 shadow-sm"
    >
      <div className="text-center mb-8">
        <h2 className="font-display text-2xl font-semibold text-heading mb-2">3. Ve tu progreso</h2>
        <p className="text-text/80">Métricas que te motivan a seguir</p>
      </div>

      <div className="max-w-md mx-auto space-y-6">
        {/* Streak Card */}
        <motion.div
          {...motionPresets['enter.fadeUp']}
          className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Icons.Activity className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <div className="font-medium text-heading">Racha actual</div>
                <div className="text-sm text-text/80">Días consecutivos</div>
              </div>
            </div>
            <motion.div
              key={animatedStreak}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="text-3xl font-bold text-orange-600"
            >
              {animatedStreak}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: animatedStreak === streakDays ? 1 : 0 }}
            transition={{ delay: 0.5 }}
            className="text-sm text-orange-700 font-medium"
          >
            {getStreakMessage()}
          </motion.div>
        </motion.div>

        {/* Monthly Visits Card */}
        <motion.div
          {...motionPresets['enter.fadeUp']}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-blue-50 to-primary-50 border border-blue-200 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Icons.CalendarCheck2 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="font-medium text-heading">Este mes</div>
                <div className="text-sm text-text/80">Visitas totales</div>
              </div>
            </div>
            <div className="text-right">
              <motion.div
                key={animatedVisits}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="text-3xl font-bold text-blue-600"
              >
                {animatedVisits}
              </motion.div>
              <div className="flex items-center gap-1 text-sm">
                {trendUp ? (
                  <Icons.TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <Icons.TrendingUp className="h-4 w-4 text-gray-400 rotate-180" />
                )}
                <span className={trendUp ? 'text-green-600' : 'text-gray-600'}>
                  {trendUp ? '+2' : '-1'}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* AI Insight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: showInsight ? 1 : 0,
            y: showInsight ? 0 : 20,
          }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-purple-50 to-accent-50 border border-purple-200 rounded-xl p-6"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Icons.Sparkles className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <div className="font-medium text-heading mb-1">Consejo de IA</div>
              <p className="text-sm text-text/80 leading-relaxed">
                {getTrendMessage()}. Tu mejor día es martes por la tarde.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: showInsight ? 1 : 0 }}
          transition={{ delay: 1 }}
          className="flex gap-3 pt-4"
        >
          <button className="flex-1 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-medium">
            Ver historial completo
          </button>
          <button className="flex-1 px-4 py-2 border border-outline text-text rounded-lg hover:bg-surface-alt transition-colors text-sm font-medium">
            Compartir progreso
          </button>
        </motion.div>
      </div>
    </section>
  );
}
