"use client";

import { KpiCards } from '../../../components/dashboard/KpiCards';
import { useAuth } from '../../../lib/auth/context';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <main className="max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Bienvenido, {user?.firstName} {user?.lastName}. Aquí tienes un resumen de {user?.company?.name || 'tu plataforma'}.
        </p>
        {user?.company && (
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="font-medium">{user.company.name}</span> • RFC: {user.company.rfc} • Rol: {user.role}
          </div>
        )}
      </div>

      <div className="space-y-8">
        {/* KPI Cards */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Métricas Principales
          </h2>
          <KpiCards />
        </section>

        {/* Future sections can be added here */}
        <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Próximamente
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Gráficos de actividad, reportes de uso, y más métricas detalladas.
          </p>
        </section>
      </div>
    </main>
  );
}




