'use client';
import { Icons } from '../../lib/icons/registry';
import { useState } from 'react';

type Plan = {
  name: string;
  price: string;
  features: string[];
  highlight?: boolean;
  cta: { 
    label: string; 
    href: string;
    'data-cta'?: string;
  };
};

type Feature = {
  name: string;
  basic: boolean;
  pro: boolean;
  enterprise: boolean;
};

type ComparisonTableProps = {
  title: string;
  subtitle?: string;
  plans: Plan[];
  features: Feature[];
};

export function ComparisonTable({ title, subtitle, plans, features }: ComparisonTableProps) {
  const [showAllFeatures, setShowAllFeatures] = useState(false);

  // Show first 6 features by default, rest are expandable
  const visibleFeatures = showAllFeatures ? features : features.slice(0, 6);
  const hiddenFeaturesCount = Math.max(0, features.length - 6);

  return (
    <div
      data-evt="section.view"
      data-section="comparison-table"
    >
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

        {/* Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-card rounded-lg shadow-card">
            {/* Table Header */}
            <thead>
              <tr className="border-b border-[var(--outline)]">
                <th className="text-left p-6 font-medium text-heading">
                  Características
                </th>
                {plans.map((plan) => (
                  <th 
                    key={plan.name}
                    className={`text-center p-6 ${
                      plan.highlight 
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-r-2 border-blue-500' 
                        : ''
                    }`}
                  >
                    <div className="space-y-2">
                      <h3 className="font-bold text-lg text-heading">
                        {plan.name}
                      </h3>
                      <div className="text-2xl font-bold text-primary">
                        {plan.price}
                      </div>
                      <a
                        href={plan.cta.href}
                        data-evt="cta.click"
                        data-cta={plan.cta['data-cta'] || `comparison-${plan.name.toLowerCase()}`}
                        className={`inline-block px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          plan.highlight
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600'
                        }`}
                      >
                        {plan.cta.label}
                      </a>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {visibleFeatures.map((feature, index) => (
                <tr
                  key={feature.name}
                  className={`border-b border-[var(--outline)] ${
                    index % 2 === 0 ? 'bg-surface' : 'bg-card'
                  }`}
                >
                  <td className="p-6 font-medium text-heading">
                    {feature.name}
                  </td>
                  <td className={`text-center p-6 ${plans[0]?.highlight ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                    {feature.basic ? (
                      <Icons.Check className="w-5 h-5 text-green-500 mx-auto" />
                    ) : (
                      <Icons.X className="w-5 h-5 text-gray-300 dark:text-gray-600 mx-auto" />
                    )}
                  </td>
                  <td className={`text-center p-6 ${plans[1]?.highlight ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                    {feature.pro ? (
                      <Icons.Check className="w-5 h-5 text-green-500 mx-auto" />
                    ) : (
                      <Icons.X className="w-5 h-5 text-gray-300 dark:text-gray-600 mx-auto" />
                    )}
                  </td>
                  <td className={`text-center p-6 ${plans[2]?.highlight ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                    {feature.enterprise ? (
                      <Icons.Check className="w-5 h-5 text-green-500 mx-auto" />
                    ) : (
                      <Icons.X className="w-5 h-5 text-gray-300 dark:text-gray-600 mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Expand/Collapse Button */}
        {hiddenFeaturesCount > 0 && (
          <div className="text-center mt-6">
            <button
              onClick={() => setShowAllFeatures(!showAllFeatures)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              {showAllFeatures ? (
                <>
                  <Icons.ChevronUp className="w-4 h-4" />
                  Ver menos características
                </>
              ) : (
                <>
                  <Icons.ChevronDown className="w-4 h-4" />
                  Ver {hiddenFeaturesCount} características más
                </>
              )}
            </button>
          </div>
        )}

        {/* Mobile-friendly cards for smaller screens */}
        <div className="lg:hidden mt-8 space-y-6">
          {plans.map((plan) => (
            <div 
              key={plan.name}
              className={`border rounded-lg p-6 ${
                plan.highlight
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-[var(--outline)] bg-card'
              }`}
            >
              <div className="text-center mb-4">
                <h3 className="font-bold text-lg text-heading">
                  {plan.name}
                </h3>
                <div className="text-2xl font-bold text-primary mt-2">
                  {plan.price}
                </div>
              </div>
              
              <div className="space-y-3">
                {features.map((feature) => {
                  const hasFeature = plan.name.toLowerCase().includes('basic') ? feature.basic :
                                   plan.name.toLowerCase().includes('pro') ? feature.pro :
                                   feature.enterprise;
                  
                  return (
                    <div key={feature.name} className="flex items-center justify-between">
                      <span className="text-gray-900 dark:text-white">{feature.name}</span>
                      {hasFeature ? (
                        <Icons.Check className="w-5 h-5 text-green-500" />
                      ) : (
                        <Icons.X className="w-5 h-5 text-gray-300 dark:text-gray-600" />
                      )}
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-6 text-center">
                <a
                  href={plan.cta.href}
                  data-evt="cta.click"
                  data-cta={plan.cta['data-cta'] || `comparison-mobile-${plan.name.toLowerCase()}`}
                  className={`inline-block px-6 py-3 rounded-md font-medium transition-colors ${
                    plan.highlight
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600'
                  }`}
                >
                  {plan.cta.label}
                </a>
              </div>
            </div>
          ))}
        </div>
    </div>
  );
}
