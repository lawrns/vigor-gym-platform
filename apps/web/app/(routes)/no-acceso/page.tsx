import Link from 'next/link';
import { getServerSession } from '../../../lib/auth/session';

export const dynamic = 'force-dynamic';

interface NoAccessPageProps {
  searchParams: { reason?: string };
}

export default async function NoAccessPage({ searchParams }: NoAccessPageProps) {
  const session = await getServerSession();
  const reason = searchParams.reason || 'unknown';

  const getReasonMessage = (reason: string) => {
    switch (reason) {
      case 'role':
        return {
          title: 'Permisos Insuficientes',
          message: 'Tu cuenta no tiene los permisos necesarios para acceder a esta sección.',
          details: 'Contacta a tu administrador para solicitar acceso a esta funcionalidad.',
        };
      case 'tenant':
        return {
          title: 'Organización No Configurada',
          message: 'Tu cuenta no está asociada a ninguna organización.',
          details: 'Necesitas ser asignado a una organización para acceder al sistema.',
        };
      case 'subscription':
        return {
          title: 'Suscripción Requerida',
          message: 'Esta funcionalidad requiere una suscripción activa.',
          details: 'Actualiza tu plan para acceder a todas las características.',
        };
      default:
        return {
          title: 'Acceso Denegado',
          message: 'No tienes autorización para acceder a esta página.',
          details: 'Si crees que esto es un error, contacta al soporte técnico.',
        };
    }
  };

  const reasonInfo = getReasonMessage(reason);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 mb-6">
            <svg
              className="h-6 w-6 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
          </div>

          {/* Content */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {reasonInfo.title}
            </h1>

            <p className="text-gray-600 dark:text-gray-400 mb-4">{reasonInfo.message}</p>

            <p className="text-sm text-gray-500 dark:text-gray-500 mb-8">{reasonInfo.details}</p>

            {/* User Info */}
            {session && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Información de la Cuenta
                </h3>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <p>
                    <span className="font-medium">Email:</span> {session.email}
                  </p>
                  <p>
                    <span className="font-medium">Rol:</span> {session.role}
                  </p>
                  <p>
                    <span className="font-medium">ID:</span> {session.userId}
                  </p>
                  {session.companyId && (
                    <p>
                      <span className="font-medium">Organización:</span> {session.companyId}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              <Link
                href="/dashboard"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Volver al Dashboard
              </Link>

              <Link
                href="/"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Ir al Inicio
              </Link>

              {reason === 'role' && (
                <Link
                  href="/contacto"
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Contactar Administrador
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
