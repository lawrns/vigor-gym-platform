import { Metadata } from 'next';
import { requireSession } from '../../../lib/auth/session';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Reportes - GoGym',
  description: 'Reportes y análisis del gimnasio',
};

export default async function ReportsPage() {
  const session = await requireSession();

  return (
    <main className="max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white">Reportes</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Análisis y reportes detallados de tu gimnasio.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          href="/admin/analytics"
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Análisis General
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Métricas de rendimiento, ingresos y miembros.
          </p>
        </Link>

        <Link
          href="/admin/observability"
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Observabilidad
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Monitoreo del sistema y métricas técnicas.
          </p>
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Reportes Personalizados
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Crea reportes personalizados según tus necesidades.
          </p>
          <div className="inline-flex items-center px-3 py-1 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 rounded text-xs">
            Próximamente
          </div>
        </div>
      </div>
    </main>
  );
}
