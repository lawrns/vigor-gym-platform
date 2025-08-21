'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Icons } from '@/lib/icons/registry';

interface GymSettings {
  profile: {
    name: string;
    address: string;
    phone: string;
    email: string;
    capacity: number;
    timezone: string;
  };
  businessHours: {
    monday: { open: string; close: string; closed: boolean };
    tuesday: { open: string; close: string; closed: boolean };
    wednesday: { open: string; close: string; closed: boolean };
    thursday: { open: string; close: string; closed: boolean };
    friday: { open: string; close: string; closed: boolean };
    saturday: { open: string; close: string; closed: boolean };
    sunday: { open: string; close: string; closed: boolean };
  };
  notifications: {
    emailReminders: boolean;
    smsReminders: boolean;
    whatsappNotifications: boolean;
    membershipExpiry: boolean;
    classReminders: boolean;
    paymentFailures: boolean;
  };
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'hours' | 'notifications' | 'users'>('profile');
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<GymSettings>({
    profile: {
      name: 'GoGym Centro',
      address: 'Av. Insurgentes Sur 1234, Col. Del Valle, CDMX',
      phone: '+52 55 1234 5678',
      email: 'contacto@gogym.mx',
      capacity: 200,
      timezone: 'America/Mexico_City',
    },
    businessHours: {
      monday: { open: '06:00', close: '22:00', closed: false },
      tuesday: { open: '06:00', close: '22:00', closed: false },
      wednesday: { open: '06:00', close: '22:00', closed: false },
      thursday: { open: '06:00', close: '22:00', closed: false },
      friday: { open: '06:00', close: '22:00', closed: false },
      saturday: { open: '08:00', close: '20:00', closed: false },
      sunday: { open: '08:00', close: '18:00', closed: false },
    },
    notifications: {
      emailReminders: true,
      smsReminders: false,
      whatsappNotifications: true,
      membershipExpiry: true,
      classReminders: true,
      paymentFailures: true,
    },
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Settings saved:', settings);
      // TODO: Implement actual API call
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = (field: keyof GymSettings['profile'], value: string | number) => {
    setSettings(prev => ({
      ...prev,
      profile: { ...prev.profile, [field]: value }
    }));
  };

  const updateBusinessHours = (day: keyof GymSettings['businessHours'], field: string, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [day]: { ...prev.businessHours[day], [field]: value }
      }
    }));
  };

  const updateNotifications = (field: keyof GymSettings['notifications'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [field]: value }
    }));
  };

  return (
    <main className="max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white">
          Configuración del Gimnasio
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Administra la configuración y preferencias de tu gimnasio.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'profile', label: 'Perfil del Gimnasio', icon: 'Building' },
              { id: 'hours', label: 'Horarios', icon: 'Clock' },
              { id: 'notifications', label: 'Notificaciones', icon: 'Bell' },
              { id: 'users', label: 'Usuarios', icon: 'Users' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Icons[tab.icon as keyof typeof Icons] className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Información del Gimnasio
              </h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre del Gimnasio
                  </label>
                  <Input
                    value={settings.profile.name}
                    onChange={(e) => updateProfile('name', e.target.value)}
                    placeholder="Nombre del gimnasio"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Capacidad Máxima
                  </label>
                  <Input
                    type="number"
                    value={settings.profile.capacity}
                    onChange={(e) => updateProfile('capacity', parseInt(e.target.value))}
                    placeholder="200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Dirección
                </label>
                <Input
                  value={settings.profile.address}
                  onChange={(e) => updateProfile('address', e.target.value)}
                  placeholder="Dirección completa"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Teléfono
                  </label>
                  <Input
                    value={settings.profile.phone}
                    onChange={(e) => updateProfile('phone', e.target.value)}
                    placeholder="+52 55 1234 5678"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email de Contacto
                  </label>
                  <Input
                    type="email"
                    value={settings.profile.email}
                    onChange={(e) => updateProfile('email', e.target.value)}
                    placeholder="contacto@gimnasio.mx"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Zona Horaria
                </label>
                <select
                  value={settings.profile.timezone}
                  onChange={(e) => updateProfile('timezone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="America/Mexico_City">Ciudad de México (GMT-6)</option>
                  <option value="America/Cancun">Cancún (GMT-5)</option>
                  <option value="America/Tijuana">Tijuana (GMT-8)</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Business Hours Tab */}
      {activeTab === 'hours' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Horarios de Operación
              </h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(settings.businessHours).map(([day, hours]) => (
                  <div key={day} className="flex items-center space-x-4">
                    <div className="w-24">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                        {day === 'monday' ? 'Lunes' :
                         day === 'tuesday' ? 'Martes' :
                         day === 'wednesday' ? 'Miércoles' :
                         day === 'thursday' ? 'Jueves' :
                         day === 'friday' ? 'Viernes' :
                         day === 'saturday' ? 'Sábado' : 'Domingo'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={!hours.closed}
                        onChange={(e) => updateBusinessHours(day as keyof GymSettings['businessHours'], 'closed', !e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Abierto</span>
                    </div>

                    {!hours.closed && (
                      <>
                        <Input
                          type="time"
                          value={hours.open}
                          onChange={(e) => updateBusinessHours(day as keyof GymSettings['businessHours'], 'open', e.target.value)}
                          className="w-32"
                        />
                        <span className="text-gray-500">a</span>
                        <Input
                          type="time"
                          value={hours.close}
                          onChange={(e) => updateBusinessHours(day as keyof GymSettings['businessHours'], 'close', e.target.value)}
                          className="w-32"
                        />
                      </>
                    )}

                    {hours.closed && (
                      <span className="text-gray-500 dark:text-gray-400 italic">Cerrado</span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Preferencias de Notificaciones
              </h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { key: 'emailReminders', label: 'Recordatorios por Email', description: 'Enviar recordatorios de clases y membresías por email' },
                  { key: 'smsReminders', label: 'Recordatorios por SMS', description: 'Enviar recordatorios por mensaje de texto' },
                  { key: 'whatsappNotifications', label: 'Notificaciones WhatsApp', description: 'Enviar notificaciones a través de WhatsApp Business' },
                  { key: 'membershipExpiry', label: 'Vencimiento de Membresías', description: 'Alertas cuando las membresías están por vencer' },
                  { key: 'classReminders', label: 'Recordatorios de Clases', description: 'Recordar a los miembros sobre sus clases reservadas' },
                  { key: 'paymentFailures', label: 'Fallos de Pago', description: 'Notificar cuando los pagos no se procesan correctamente' },
                ].map(({ key, label, description }) => (
                  <div key={key} className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.notifications[key as keyof GymSettings['notifications']]}
                      onChange={(e) => updateNotifications(key as keyof GymSettings['notifications'], e.target.checked)}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Gestión de Usuarios
              </h3>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Icons.Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Gestión de Usuarios
                </h4>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Administra los usuarios del sistema, roles y permisos.
                </p>
                <div className="inline-flex items-center px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 rounded-lg">
                  🚧 Próximamente disponible
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading}>
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Guardando...
            </>
          ) : (
            <>
              <Icons.Save className="h-4 w-4 mr-2" />
              Guardar Configuración
            </>
          )}
        </Button>
      </div>
    </main>
  );
}
