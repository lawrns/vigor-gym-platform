import { Icons } from '../../lib/icons/registry';

type ComplianceRibbonProps = {
  title: string;
  points: string[];
};

export function ComplianceRibbon({ title, points }: ComplianceRibbonProps) {
  return (
    <section 
      className="bg-blue-600 dark:bg-blue-700 py-8"
      data-evt="section.view"
      data-section="compliance-ribbon"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            {title}
          </h2>
        </div>

        {/* Compliance Points */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {points.map((point, index) => (
            <div
              key={index}
              className="flex items-center justify-center text-center"
            >
              <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3 w-full">
                {/* Icon based on content */}
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
                
                {/* Point Text */}
                <span className="text-white font-medium text-sm">
                  {point}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Trust Indicators */}
        <div className="mt-8 flex flex-wrap justify-center items-center gap-8 opacity-80">
          {/* SOC 2 Badge */}
          <div className="flex items-center space-x-2">
            <Icons.Shield className="w-5 h-5 text-white" />
            <span className="text-white text-sm font-medium">SOC 2 Type II</span>
          </div>

          {/* GDPR Badge */}
          <div className="flex items-center space-x-2">
            <Icons.Globe className="w-5 h-5 text-white" />
            <span className="text-white text-sm font-medium">GDPR Compliant</span>
          </div>

          {/* ISO Badge */}
          <div className="flex items-center space-x-2">
            <Icons.Award className="w-5 h-5 text-white" />
            <span className="text-white text-sm font-medium">ISO 27001</span>
          </div>

          {/* Mexico Badge */}
          <div className="flex items-center space-x-2">
            <Icons.MapPin className="w-5 h-5 text-white" />
            <span className="text-white text-sm font-medium">Datos en México</span>
          </div>

          {/* Uptime Badge */}
          <div className="flex items-center space-x-2">
            <Icons.Activity className="w-5 h-5 text-white" />
            <span className="text-white text-sm font-medium">99.9% Uptime</span>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-8 text-center">
          <a
            href="/seguridad"
            data-evt="cta.click"
            data-cta="compliance-learn-more"
            className="inline-flex items-center px-6 py-3 border-2 border-white text-white font-medium rounded-md hover:bg-white hover:text-blue-600 transition-colors duration-200"
          >
            <Icons.Shield className="w-5 h-5 mr-2" />
            Conoce más sobre nuestra seguridad
          </a>
        </div>
      </div>
    </section>
  );
}
