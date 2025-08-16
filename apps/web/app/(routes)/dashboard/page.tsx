import { KpiCards } from '../../../components/dashboard/KpiCards';
import { DashboardFilterBar } from '../../../components/dashboard/DashboardFilterBar';
import { VisitsByDay } from '../../../components/dashboard/VisitsByDay';
import { requireSession } from '../../../lib/auth/session';
import { KPIOverview } from '../../../lib/api/types';

async function fetchInitialKPIs(searchParams: URLSearchParams): Promise<KPIOverview | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:7777';
    const queryString = searchParams.toString();
    const url = `${baseUrl}/api/kpi/overview${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch initial KPIs:', response.status, response.statusText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching initial KPIs:', error);
    return null;
  }
}

interface DashboardPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await requireSession();

  // Convert searchParams to URLSearchParams for KPI fetching
  const urlSearchParams = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (typeof value === 'string') {
      urlSearchParams.set(key, value);
    } else if (Array.isArray(value)) {
      urlSearchParams.set(key, value[0]);
    }
  });

  // Fetch initial KPI data on the server
  const initialKPIs = await fetchInitialKPIs(urlSearchParams);

  return (
    <main className="max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Bienvenido, {session.email}. Aquí tienes un resumen de tu plataforma.
        </p>
        {process.env.NEXT_PUBLIC_DEBUG === '1' && (
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Email: {session.email} • Rol: {session.role} • ID: {session.userId}
          </div>
        )}
      </div>

      <div className="space-y-8">
        {/* Dashboard Filters */}
        <DashboardFilterBar />

        {/* KPI Cards */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Métricas Principales
          </h2>
          <KpiCards initialData={initialKPIs} />
        </section>

        {/* Charts Section */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Actividad
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <VisitsByDay />

            {/* Placeholder for future charts */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Próximo Gráfico
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Más visualizaciones próximamente.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}




