'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icons } from '@/lib/icons/registry';

interface ClassSchedule {
  id: string;
  name: string;
  instructor: string;
  time: string;
  duration: number;
  capacity: number;
  booked: number;
  day: string;
  description: string;
  level: 'Principiante' | 'Intermedio' | 'Avanzado';
  status: 'active' | 'cancelled' | 'full';
}

interface Instructor {
  id: string;
  name: string;
  specialties: string[];
  experience: string;
  rating: number;
  avatar: string;
}

export default function ClassesPage() {

  const [activeTab, setActiveTab] = useState<'schedule' | 'instructors' | 'analytics'>('schedule');
  const [selectedDay, setSelectedDay] = useState<string>('Lunes');
  const [loading, setLoading] = useState(true);

  const [classes, setClasses] = useState<ClassSchedule[]>([
    {
      id: '1',
      name: 'Spinning Matutino',
      instructor: 'María González',
      time: '07:00',
      duration: 45,
      capacity: 20,
      booked: 18,
      day: 'Lunes',
      description: 'Clase de spinning de alta intensidad para empezar el día con energía',
      level: 'Intermedio',
      status: 'active'
    },
    {
      id: '2',
      name: 'Yoga Relajante',
      instructor: 'Ana Martínez',
      time: '09:00',
      duration: 60,
      capacity: 15,
      booked: 12,
      day: 'Lunes',
      description: 'Sesión de yoga para relajación y flexibilidad',
      level: 'Principiante',
      status: 'active'
    },
    {
      id: '3',
      name: 'CrossFit Intenso',
      instructor: 'Carlos Rodríguez',
      time: '18:00',
      duration: 50,
      capacity: 12,
      booked: 12,
      day: 'Lunes',
      description: 'Entrenamiento funcional de alta intensidad',
      level: 'Avanzado',
      status: 'full'
    },
    {
      id: '4',
      name: 'Pilates Core',
      instructor: 'Laura Sánchez',
      time: '19:30',
      duration: 45,
      capacity: 16,
      booked: 14,
      day: 'Lunes',
      description: 'Fortalecimiento del core y mejora de la postura',
      level: 'Intermedio',
      status: 'active'
    },
    {
      id: '5',
      name: 'HIIT Cardio',
      instructor: 'Diego López',
      time: '06:30',
      duration: 30,
      capacity: 25,
      booked: 22,
      day: 'Martes',
      description: 'Entrenamiento de intervalos de alta intensidad',
      level: 'Intermedio',
      status: 'active'
    },
    {
      id: '6',
      name: 'Zumba Fitness',
      instructor: 'Sofia Herrera',
      time: '20:00',
      duration: 55,
      capacity: 30,
      booked: 28,
      day: 'Martes',
      description: 'Baile fitness lleno de energía y diversión',
      level: 'Principiante',
      status: 'active'
    }
  ]);

  const [instructors, setInstructors] = useState<Instructor[]>([
    {
      id: '1',
      name: 'María González',
      specialties: ['Spinning', 'Ciclismo Indoor', 'Cardio'],
      experience: '5 años',
      rating: 4.8,
      avatar: '👩‍🏫'
    },
    {
      id: '2',
      name: 'Ana Martínez',
      specialties: ['Yoga', 'Pilates', 'Meditación'],
      experience: '7 años',
      rating: 4.9,
      avatar: '🧘‍♀️'
    },
    {
      id: '3',
      name: 'Carlos Rodríguez',
      specialties: ['CrossFit', 'Funcional', 'Fuerza'],
      experience: '6 años',
      rating: 4.7,
      avatar: '💪'
    },
    {
      id: '4',
      name: 'Laura Sánchez',
      specialties: ['Pilates', 'Core', 'Flexibilidad'],
      experience: '4 años',
      rating: 4.6,
      avatar: '🤸‍♀️'
    },
    {
      id: '5',
      name: 'Diego López',
      specialties: ['HIIT', 'Cardio', 'Funcional'],
      experience: '3 años',
      rating: 4.5,
      avatar: '🏃‍♂️'
    },
    {
      id: '6',
      name: 'Sofia Herrera',
      specialties: ['Zumba', 'Baile', 'Aeróbicos'],
      experience: '8 años',
      rating: 4.9,
      avatar: '💃'
    }
  ]);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  const getClassesForDay = (day: string) => {
    return classes.filter(cls => cls.day === day).sort((a, b) => a.time.localeCompare(b.time));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50';
      case 'full': return 'text-red-600 bg-red-50';
      case 'cancelled': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Disponible';
      case 'full': return 'Lleno';
      case 'cancelled': return 'Cancelado';
      default: return 'Desconocido';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Principiante': return 'text-green-600 bg-green-50';
      case 'Intermedio': return 'text-yellow-600 bg-yellow-50';
      case 'Avanzado': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white">
            Gestión de Clases
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Administra horarios, instructores y reservas de clases.
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Cargando clases...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white">
          Gestión de Clases
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Administra horarios, instructores y reservas de clases.
        </p>
      </div>

      {/* Action Bar */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex gap-2">
              <Button>
                <Icons.Plus className="h-4 w-4 mr-2" />
                Nueva Clase
              </Button>
              <Button variant="outline">
                <Icons.Calendar className="h-4 w-4 mr-2" />
                Programar
              </Button>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Icons.Download className="h-4 w-4 mr-2" />
                Exportar Horarios
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'schedule', label: 'Horarios', icon: 'Calendar' },
              { id: 'instructors', label: 'Instructores', icon: 'Users' },
              { id: 'analytics', label: 'Análisis', icon: 'BarChart3' },
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
                {React.createElement(Icons[tab.icon as keyof typeof Icons], { className: "h-4 w-4 mr-2" })}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Schedule Tab */}
      {activeTab === 'schedule' && (
        <div className="space-y-6">
          {/* Day Selector */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-2">
                {days.map(day => (
                  <Button
                    key={day}
                    variant={selectedDay === day ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedDay(day)}
                  >
                    {day}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Classes for Selected Day */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {getClassesForDay(selectedDay).map(classItem => (
              <Card key={classItem.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {classItem.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {classItem.instructor} • {classItem.time} • {classItem.duration} min
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getLevelColor(classItem.level)}`}>
                        {classItem.level}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(classItem.status)}`}>
                        {getStatusText(classItem.status)}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {classItem.description}
                  </p>

                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Ocupación: {classItem.booked}/{classItem.capacity}
                    </span>
                    <span className="text-sm font-medium">
                      {((classItem.booked / classItem.capacity) * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
                    <div
                      className={`h-2 rounded-full ${
                        classItem.status === 'full' ? 'bg-red-500' :
                        (classItem.booked / classItem.capacity) > 0.8 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${(classItem.booked / classItem.capacity) * 100}%` }}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Icons.Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button size="sm" variant="outline">
                      <Icons.Users className="h-4 w-4 mr-1" />
                      Ver Reservas
                    </Button>
                    {classItem.status === 'active' && (
                      <Button size="sm" variant="outline">
                        <Icons.X className="h-4 w-4 mr-1" />
                        Cancelar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {getClassesForDay(selectedDay).length === 0 && (
              <div className="col-span-2 text-center py-12">
                <Icons.Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No hay clases programadas
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  No hay clases programadas para {selectedDay}.
                </p>
                <Button>
                  <Icons.Plus className="h-4 w-4 mr-2" />
                  Programar Clase
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instructors Tab */}
      {activeTab === 'instructors' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {instructors.map(instructor => (
              <Card key={instructor.id}>
                <CardContent className="p-6">
                  <div className="text-center mb-4">
                    <div className="text-4xl mb-2">{instructor.avatar}</div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {instructor.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {instructor.experience} de experiencia
                    </p>
                  </div>

                  <div className="flex items-center justify-center mb-4">
                    <div className="flex items-center">
                      {React.createElement(Icons.CheckCircle, { className: "h-4 w-4 text-yellow-400" })}
                      <span className="ml-1 text-sm font-medium">{instructor.rating}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Especialidades:
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {instructor.specialties.map((specialty, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Icons.Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Icons.Calendar className="h-4 w-4 mr-1" />
                      Horarios
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Add New Instructor Card */}
            <Card className="border-dashed border-2 border-gray-300 dark:border-gray-600">
              <CardContent className="p-6 text-center">
                <Icons.Plus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Agregar Instructor
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Añade un nuevo instructor al equipo.
                </p>
                <Button>
                  <Icons.Plus className="h-4 w-4 mr-2" />
                  Nuevo Instructor
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {classes.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Clases Activas</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {instructors.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Instructores</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {classes.reduce((sum, cls) => sum + cls.booked, 0)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Reservas Totales</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {Math.round((classes.reduce((sum, cls) => sum + (cls.booked / cls.capacity), 0) / classes.length) * 100)}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Ocupación Promedio</div>
              </CardContent>
            </Card>
          </div>

          {/* Class Performance */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Rendimiento por Clase
              </h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {classes.map(classItem => {
                  const utilization = (classItem.booked / classItem.capacity) * 100;
                  return (
                    <div key={classItem.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">{classItem.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {classItem.instructor} • {classItem.day} {classItem.time}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {classItem.booked}/{classItem.capacity} reservas
                          </div>
                          <div className={`text-sm font-medium px-2 py-1 rounded ${
                            utilization >= 90 ? 'text-red-600 bg-red-50' :
                            utilization >= 75 ? 'text-yellow-600 bg-yellow-50' :
                            'text-green-600 bg-green-50'
                          }`}>
                            {utilization.toFixed(1)}% ocupación
                          </div>
                        </div>
                      </div>

                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${
                            utilization >= 90 ? 'bg-red-500' :
                            utilization >= 75 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${utilization}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}
