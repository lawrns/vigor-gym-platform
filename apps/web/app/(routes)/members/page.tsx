'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icons } from '@/lib/icons/registry';

interface Member {
  id: string;
  name: string;
  email: string;
  status: string;
  plan: string;
  lastVisit: string;
  attendance30d: number;
  joinDate?: string;
  phone?: string;
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  useEffect(() => {
    // Simulate API call with enhanced mock data
    setTimeout(() => {
      const mockMembers: Member[] = [
        {
          id: 'mem_001',
          name: 'María González López',
          email: 'maria.gonzalez@email.com',
          status: 'Activa',
          plan: 'Premium Mensual',
          lastVisit: '2025-08-20',
          attendance30d: 18,
          joinDate: '2024-03-15',
          phone: '+52 55 1234 5678'
        },
        {
          id: 'mem_002',
          name: 'Carlos Rodríguez Pérez',
          email: 'carlos.rodriguez@email.com',
          status: 'Activa',
          plan: 'Básico Mensual',
          lastVisit: '2025-08-19',
          attendance30d: 12,
          joinDate: '2024-01-20',
          phone: '+52 55 2345 6789'
        },
        {
          id: 'mem_003',
          name: 'Ana Torres Martínez',
          email: 'ana.torres@email.com',
          status: 'En riesgo',
          plan: 'Premium Mensual',
          lastVisit: '2025-08-10',
          attendance30d: 3,
          joinDate: '2024-06-10',
          phone: '+52 55 3456 7890'
        },
        {
          id: 'mem_004',
          name: 'Javier Ruiz Hernández',
          email: 'javier.ruiz@email.com',
          status: 'Inactiva',
          plan: 'Premium Plus',
          lastVisit: '2025-07-15',
          attendance30d: 0,
          joinDate: '2023-11-05',
          phone: '+52 55 4567 8901'
        },
        {
          id: 'mem_005',
          name: 'Laura Sánchez García',
          email: 'laura.sanchez@email.com',
          status: 'Activa',
          plan: 'Básico Anual',
          lastVisit: '2025-08-20',
          attendance30d: 22,
          joinDate: '2024-02-28',
          phone: '+52 55 5678 9012'
        },
        {
          id: 'mem_006',
          name: 'Roberto Morales Cruz',
          email: 'roberto.morales@email.com',
          status: 'Pausada',
          plan: 'Premium Mensual',
          lastVisit: '2025-08-05',
          attendance30d: 8,
          joinDate: '2024-04-12',
          phone: '+52 55 6789 0123'
        }
      ];
      setMembers(mockMembers);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || member.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Activa':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'En riesgo':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'Inactiva':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'Pausada':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getAttendanceColor = (attendance: number) => {
    if (attendance >= 15) return 'text-green-600 dark:text-green-400';
    if (attendance >= 8) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const handleSelectMember = (memberId: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSelectAll = () => {
    if (selectedMembers.length === filteredMembers.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(filteredMembers.map(m => m.id));
    }
  };

  const handleBulkAction = (action: string) => {
    console.log(`Bulk action: ${action} for members:`, selectedMembers);
    // TODO: Implement bulk actions
    setSelectedMembers([]);
  };

  return (
    <main className="max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white">
          Gestión de Miembros
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Administra y monitorea a todos los miembros del gimnasio.
        </p>
      </div>

      {/* Filters and Actions */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Icons.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar por nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los estados</option>
                <option value="Activa">Activa</option>
                <option value="En riesgo">En riesgo</option>
                <option value="Inactiva">Inactiva</option>
                <option value="Pausada">Pausada</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {selectedMembers.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('message')}
                  >
                    <Icons.MessageSquare className="h-4 w-4 mr-2" />
                    Enviar mensaje
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('export')}
                  >
                    <Icons.Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              )}
              <Button>
                <Icons.Plus className="h-4 w-4 mr-2" />
                Nuevo Miembro
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Icons.Users className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Activos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {members.filter(m => m.status === 'Activa').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <Icons.AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">En Riesgo</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {members.filter(m => m.status === 'En riesgo').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Icons.Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Asistencia Promedio</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Math.round(members.reduce((sum, m) => sum + m.attendance30d, 0) / members.length)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Icons.TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Nuevos (30d)</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">12</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Miembros ({filteredMembers.length})
            </h2>
            {selectedMembers.length > 0 && (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedMembers.length} seleccionados
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Cargando miembros...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedMembers.length === filteredMembers.length && filteredMembers.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Miembro</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Estado</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Plan</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Asistencia (30d)</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Última Visita</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((member) => (
                    <tr key={member.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(member.id)}
                          onChange={() => handleSelectMember(member.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{member.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{member.email}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(member.status)}`}>
                          {member.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-900 dark:text-white">{member.plan}</td>
                      <td className="py-3 px-4">
                        <span className={`font-semibold ${getAttendanceColor(member.attendance30d)}`}>
                          {member.attendance30d} visitas
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500 dark:text-gray-400">
                        {new Date(member.lastVisit).toLocaleDateString('es-MX')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            <Icons.Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Icons.Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Icons.MessageSquare className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
