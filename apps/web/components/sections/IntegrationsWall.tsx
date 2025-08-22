import { Icons } from '../../lib/icons/registry';
import Image from 'next/image';

type Integration = {
  name: string;
  logo: string;
  category: string;
  status?: 'available' | 'coming_soon';
};

type IntegrationsWallProps = {
  title: string;
  subtitle?: string;
  integrations: Integration[];
};

export function IntegrationsWall({ title, subtitle, integrations }: IntegrationsWallProps) {
  // Group integrations by category
  const groupedIntegrations = integrations.reduce((acc, integration) => {
    if (!acc[integration.category]) {
      acc[integration.category] = [];
    }
    acc[integration.category].push(integration);
    return acc;
  }, {} as Record<string, Integration[]>);

  return (
    <section 
      className="bg-gray-50 dark:bg-gray-800 py-16"
      data-evt="section.view"
      data-section="integrations-wall"
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

        {/* Integrations Grid */}
        <div className="space-y-12">
          {Object.entries(groupedIntegrations).map(([category, categoryIntegrations]) => (
            <div key={category}>
              {/* Category Header */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {category}
                </h3>
                <div className="h-px bg-gray-200 dark:bg-gray-700"></div>
              </div>

              {/* Category Integrations */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {categoryIntegrations.map((integration) => (
                  <div
                    key={integration.name}
                    className={`relative group bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 ${
                      integration.status === 'coming_soon' 
                        ? 'opacity-60' 
                        : 'hover:scale-105'
                    }`}
                  >
                    {/* Integration Logo */}
                    <div className="flex items-center justify-center h-12 mb-3">
                      {integration.logo.startsWith('/') ? (
                        <Image
                          src={integration.logo}
                          alt={`${integration.name} logo`}
                          width={48}
                          height={48}
                          sizes="48px"
                          className="object-contain"
                        />
                      ) : (
                        <img
                          src={integration.logo}
                          alt={`${integration.name} logo`}
                          className="max-h-full max-w-full object-contain"
                        />
                      )}
                    </div>

                    {/* Integration Name */}
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white text-center mb-2">
                      {integration.name}
                    </h4>

                    {/* Status Badge */}
                    {integration.status === 'coming_soon' && (
                      <div className="absolute top-2 right-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          Próximamente
                        </span>
                      </div>
                    )}

                    {/* Available Badge */}
                    {integration.status === 'available' && (
                      <div className="absolute top-2 right-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          <Icons.Check className="w-3 h-3 mr-1" />
                          Disponible
                        </span>
                      </div>
                    )}

                    {/* Hover Effect */}
                    <div className="absolute inset-0 rounded-lg bg-blue-500 opacity-0 group-hover:opacity-5 transition-opacity duration-200"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-8 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              ¿No encuentras la integración que necesitas?
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Nuestro equipo puede desarrollar integraciones personalizadas para tu empresa.
            </p>
            <a
              href="/contacto"
              data-evt="cta.click"
              data-cta="integrations-custom"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
            >
              <Icons.MessageSquare className="w-5 h-5 mr-2" />
              Solicitar integración personalizada
            </a>
          </div>
        </div>

        {/* Integration Stats */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              {integrations.filter(i => i.status === 'available').length}+
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Integraciones disponibles
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">
              {integrations.filter(i => i.status === 'coming_soon').length}+
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Próximamente
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
              24h
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Tiempo promedio de configuración
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
