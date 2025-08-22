import { Icons } from '../../lib/icons/registry';

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
  return (
    <section 
      className="bg-white dark:bg-gray-900 py-16"
      data-evt="section.view"
      data-section="comparison-table"
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

        {/* Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            {/* Table Header */}
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left p-6 font-medium text-gray-900 dark:text-white">
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
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                        {plan.name}
                      </h3>
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
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
              {features.map((feature, index) => (
                <tr 
                  key={feature.name}
                  className={`border-b border-gray-200 dark:border-gray-700 ${
                    index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800/50' : 'bg-white dark:bg-gray-800'
                  }`}
                >
                  <td className="p-6 font-medium text-gray-900 dark:text-white">
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

        {/* Mobile-friendly cards for smaller screens */}
        <div className="lg:hidden mt-8 space-y-6">
          {plans.map((plan) => (
            <div 
              key={plan.name}
              className={`border rounded-lg p-6 ${
                plan.highlight 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              }`}
            >
              <div className="text-center mb-4">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                  {plan.name}
                </h3>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">
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
    </section>
  );
}
