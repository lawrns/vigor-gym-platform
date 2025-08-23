import Link from 'next/link';
import { Icons } from '../../../lib/icons/registry';

export const metadata = {
  title: 'Registro | GoGym',
  description: 'Crea tu cuenta en GoGym y comienza a gestionar tu gimnasio',
};

export default function RegistroPage() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="text-center mb-8">
        <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
          <Icons.Building2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Crea tu cuenta</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
          Completa tus datos para comenzar a gestionar tu gimnasio con GoGym
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              ¿Por qué elegir GoGym?
            </h2>
            <ul className="space-y-3">
              <li className="flex items-start">
                <Icons.CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">
                  Sistema completo de gestión de miembros
                </span>
              </li>
              <li className="flex items-start">
                <Icons.CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">
                  Check-in automático con códigos QR
                </span>
              </li>
              <li className="flex items-start">
                <Icons.CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Dashboard en tiempo real</span>
              </li>
              <li className="flex items-start">
                <Icons.CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">
                  Gestión de pagos y facturación
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Planes disponibles
            </h2>
            <div className="space-y-3">
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-white">Plan Básico</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Hasta 100 miembros</p>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">$299/mes</p>
              </div>
              <div className="border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-white">Plan Pro</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Hasta 500 miembros</p>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">$599/mes</p>
                <span className="inline-block bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded-full mt-1">
                  Más popular
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center">
        <Link
          href="/register"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <Icons.ArrowRight className="h-5 w-5 mr-2" />
          Comenzar registro
        </Link>

        <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
          ¿Ya tienes cuenta?{' '}
          <Link
            href="/login"
            className="text-blue-600 dark:text-blue-400 underline hover:no-underline font-medium"
          >
            Iniciar sesión
          </Link>
        </p>
      </div>

      <div className="mt-12 border-t border-gray-200 dark:border-gray-700 pt-8">
        <div className="grid md:grid-cols-3 gap-6 text-center">
          <div>
            <Icons.Shield className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
            <h3 className="font-medium text-gray-900 dark:text-white">Seguro</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Datos protegidos con encriptación de nivel bancario
            </p>
          </div>
          <div>
            <Icons.Zap className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
            <h3 className="font-medium text-gray-900 dark:text-white">Rápido</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Configuración en menos de 5 minutos
            </p>
          </div>
          <div>
            <Icons.Headphones className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
            <h3 className="font-medium text-gray-900 dark:text-white">Soporte</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Atención al cliente 24/7 en español
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
