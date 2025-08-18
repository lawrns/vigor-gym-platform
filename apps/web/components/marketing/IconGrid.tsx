"use client";

import { motion } from 'framer-motion';
import { Icons } from '../../lib/icons/registry';
import { motionPresets } from '../../lib/motion/presets';

interface BenefitItem {
  icon: string;
  title: string;
  desc: string;
}

interface IconGridProps {
  items: BenefitItem[];
  disclaimer?: string;
  testId?: string;
}

export function IconGrid({ items, disclaimer, testId = 'benefits' }: IconGridProps) {
  return (
    <section 
      data-testid={testId}
      className="max-w-6xl mx-auto px-4 py-16"
    >
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map((item, index) => {
          const IconComponent = Icons[item.icon as keyof typeof Icons] || Icons.Activity;
          
          return (
            <motion.div
              key={item.title}
              {...motionPresets['enter.fadeUp']}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true, margin: '0px 0px -10% 0px' }}
              className="text-center space-y-4"
            >
              {/* Icon Container */}
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl">
                <IconComponent className="h-8 w-8 text-primary" />
              </div>
              
              {/* Content */}
              <div className="space-y-2">
                <h3 className="font-display text-lg font-semibold text-heading">
                  {item.title}
                </h3>
                <p className="text-text/80 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {/* Disclaimer */}
      {disclaimer && (
        <motion.div
          {...motionPresets['enter.fadeUp']}
          transition={{ delay: 0.5 }}
          viewport={{ once: true }}
          className="mt-8 text-center"
        >
          <p className="text-xs text-muted italic">
            {disclaimer}
          </p>
        </motion.div>
      )}
    </section>
  );
}
