import { Metadata } from 'next';
import { requireSession } from '../../../lib/auth/session';

export const metadata: Metadata = {
  title: 'Clases - GoGym',
  description: 'Gestión de clases y horarios del gimnasio',
};

export default async function ClassesPage() {
  const session = await requireSession();

  return (
    <main className="max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white">Clases</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Gestiona las clases y horarios de tu gimnasio.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Gestión de Clases
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Esta funcionalidad estará disponible próximamente. Podrás gestionar horarios, 
            instructores, capacidad y reservas de clases.
          </p>
          <div className="inline-flex items-center px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg">
            🏗️ En desarrollo
          </div>
        </div>
      </div>
    </main>
  );
}
