'use client';
import { useState } from 'react';
import { Icons } from '../../lib/icons/registry';
import { Stack } from '../primitives/Stack';

type Plan = {
  name: string;
  price: string;
  description?: string;
  features?: string[];
  highlight?: boolean;
  cta?: { label: string; href: string };
};

type Feature = {
  name: string;
  basic?: boolean | string;
  pro?: boolean | string;
  enterprise?: boolean | string;
};

type PlansAndComparisonProps = {
  plansTitle: string;
  plans: Plan[];
  comparisonTitle: string;
  comparisonSubtitle?: string;
  comparisonPlans: Plan[];
  comparisonFeatures: Feature[];
};

export function PlansAndComparison({
  plansTitle,
  plans,
  comparisonTitle,
  comparisonSubtitle,
  comparisonPlans,
  comparisonFeatures
}: PlansAndComparisonProps) {
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  
  // Show first 6 features by default, rest are expandable
  const visibleFeatures = showAllFeatures ? comparisonFeatures : comparisonFeatures.slice(0, 6);
  const hiddenFeaturesCount = Math.max(0, comparisonFeatures.length - 6);

  const renderFeatureValue = (value: boolean | string | undefined) => {
    if (value === true) {
      return <Icons.Check className="w-5 h-5 text-green-600 dark:text-green-400 mx-auto" />;
    }
    if (value === false || value === undefined) {
      return <Icons.X className="w-5 h-5 text-gray-400 dark:text-gray-500 mx-auto" />;
    }
    return <span className="text-sm text-center text-muted">{value}</span>;
  };

  return (
    <Stack gap="16">
      {/* Plans Section */}
      <div>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-heading mb-4">
            {plansTitle}
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 border-2 transition-all duration-200 ${
                plan.highlight
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-105'
                  : 'border-[var(--outline)] bg-card hover:border-blue-300 dark:hover:border-blue-600'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                    Más popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-heading mb-2">
                  {plan.name}
                </h3>
                <div className="text-3xl font-bold text-primary mb-2">
                  {plan.price}
                </div>
                {plan.description && (
                  <p className="text-muted text-sm">
                    {plan.description}
                  </p>
                )}
              </div>

              {plan.features && (
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <Icons.Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <span className="text-sm text-muted">{feature}</span>
                    </li>
                  ))}
                </ul>
              )}

              {plan.cta && (
                <a
                  href={plan.cta.href}
                  className={`block w-full text-center py-3 px-6 rounded-lg font-medium transition-colors ${
                    plan.highlight
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-surface text-heading hover:bg-[var(--outline)]'
                  }`}
                >
                  {plan.cta.label}
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Comparison Table Section */}
      <div>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-heading mb-4">
            {comparisonTitle}
          </h2>
          {comparisonSubtitle && (
            <p className="text-lg text-muted max-w-3xl mx-auto">
              {comparisonSubtitle}
            </p>
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full border-collapse bg-card rounded-lg shadow-card">
            {/* Table Header */}
            <thead>
              <tr className="border-b border-[var(--outline)]">
                <th className="text-left p-6 font-medium text-heading">
                  Características
                </th>
                {comparisonPlans.map((plan) => (
                  <th key={plan.name} className="text-center p-6">
                    <div>
                      <h3 className="font-bold text-lg text-heading">
                        {plan.name}
                      </h3>
                      <div className="text-2xl font-bold text-primary">
                        {plan.price}
                      </div>
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
                  <td className="p-6 text-center">
                    {renderFeatureValue(feature.basic)}
                  </td>
                  <td className="p-6 text-center">
                    {renderFeatureValue(feature.pro)}
                  </td>
                  <td className="p-6 text-center">
                    {renderFeatureValue(feature.enterprise)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Expand/Collapse Button */}
          {hiddenFeaturesCount > 0 && (
            <div className="text-center mt-6">
              <button
                onClick={() => setShowAllFeatures(!showAllFeatures)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-surface text-heading rounded-lg hover:bg-[var(--outline)] transition-colors"
              >
                {showAllFeatures ? (
                  <>
                    <Icons.ChevronUp className="w-4 h-4" />
                    Mostrar menos características
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
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-6">
          {comparisonPlans.map((plan) => (
            <div
              key={plan.name}
              className={`border rounded-lg p-6 ${
                plan.highlight 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-[var(--outline)] bg-card'
              }`}
            >
              <div className="text-center mb-6">
                <h3 className="font-bold text-lg text-heading">
                  {plan.name}
                </h3>
                <div className="text-2xl font-bold text-primary mt-2">
                  {plan.price}
                </div>
              </div>

              <div className="space-y-3">
                {visibleFeatures.map((feature) => (
                  <div key={feature.name} className="flex justify-between items-center py-2 border-b border-[var(--outline)]">
                    <span className="text-sm font-medium text-heading">
                      {feature.name}
                    </span>
                    <div>
                      {renderFeatureValue(
                        plan.name.toLowerCase().includes('básico') || plan.name.toLowerCase().includes('basic')
                          ? feature.basic
                          : plan.name.toLowerCase().includes('pro')
                          ? feature.pro
                          : feature.enterprise
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Mobile Expand Button */}
          {hiddenFeaturesCount > 0 && (
            <div className="text-center">
              <button
                onClick={() => setShowAllFeatures(!showAllFeatures)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-surface text-heading rounded-lg hover:bg-[var(--outline)] transition-colors"
              >
                {showAllFeatures ? (
                  <>
                    <Icons.ChevronUp className="w-4 h-4" />
                    Mostrar menos
                  </>
                ) : (
                  <>
                    <Icons.ChevronDown className="w-4 h-4" />
                    Ver {hiddenFeaturesCount} más
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </Stack>
  );
}
