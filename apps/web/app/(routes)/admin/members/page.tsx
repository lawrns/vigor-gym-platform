"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../../../lib/auth/context';
import { apiClient, isAPIError } from '../../../../lib/api/client';
import { Icons } from '../../../../lib/icons/registry';
import { MembersTable } from '../../../../components/admin/MembersTable';
import { MemberForm } from '../../../../components/admin/MemberForm';
import { ImportCsvDialog } from '../../../../components/admin/ImportCsvDialog';

interface Member {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: 'active' | 'invited' | 'paused' | 'cancelled';
  createdAt: string;
  _count: {
    memberships: number;
  };
}

interface MembersResponse {
  members: Member[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export default function MembersPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  const fetchMembers = async (page = 1, searchTerm = search, status = statusFilter) => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        page: page.toString(),
        pageSize: pagination.pageSize.toString(),
      };

      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      if (status) {
        params.status = status;
      }

      const response = await apiClient.get<MembersResponse>('/v1/members', params);

      if (isAPIError(response)) {
        throw new Error(response.message);
      }

      setMembers(response.members);
      setPagination(response.pagination);
    } catch (err) {
      console.error('Error fetching members:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load members';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleSearch = (searchTerm: string) => {
    setSearch(searchTerm);
    fetchMembers(1, searchTerm, statusFilter);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    fetchMembers(1, search, status);
  };

  const handlePageChange = (page: number) => {
    fetchMembers(page, search, statusFilter);
  };

  const handleCreateMember = () => {
    setEditingMember(null);
    setShowCreateForm(true);
  };

  const handleEditMember = (member: Member) => {
    setEditingMember(member);
    setShowCreateForm(true);
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este miembro?')) {
      return;
    }

    try {
      const response = await apiClient.delete(`/v1/members/${memberId}`);

      if (isAPIError(response)) {
        throw new Error(response.message);
      }

      // Refresh the list
      fetchMembers(pagination.page, search, statusFilter);

      // Track analytics
      if (typeof window !== 'undefined') {
        import('posthog-js').then(({ default: posthog }) => {
          posthog.capture('member.deleted', {
            memberId,
            companyId: user?.company?.id,
          });
        });
      }
    } catch (err) {
      console.error('Error deleting member:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete member';
      alert(errorMessage);
    }
  };

  const handleFormSuccess = () => {
    setShowCreateForm(false);
    setEditingMember(null);
    fetchMembers(pagination.page, search, statusFilter);
  };

  const handleImportSuccess = () => {
    setShowImportDialog(false);
    fetchMembers(1, search, statusFilter); // Go to first page to see new members
  };

  if (!user?.company) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Icons.AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Acceso Denegado
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Necesitas estar asociado a una empresa para gestionar miembros.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white">
              Gestión de Miembros
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Administra los miembros de {user.company.name}
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowImportDialog(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Icons.Upload className="h-4 w-4 mr-2" />
              Importar CSV
            </button>
            <button
              onClick={handleCreateMember}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Icons.Plus className="h-4 w-4 mr-2" />
              Nuevo Miembro
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Icons.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div className="sm:w-48">
          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todos los estados</option>
            <option value="active">Activo</option>
            <option value="invited">Invitado</option>
            <option value="paused">Pausado</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>
      </div>

      {/* Members Table */}
      <MembersTable
        members={members}
        pagination={pagination}
        loading={loading}
        error={error}
        onPageChange={handlePageChange}
        onEdit={handleEditMember}
        onDelete={handleDeleteMember}
      />

      {/* Create/Edit Member Form Modal */}
      {showCreateForm && (
        <MemberForm
          member={editingMember}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowCreateForm(false);
            setEditingMember(null);
          }}
        />
      )}

      {/* Import CSV Dialog */}
      {showImportDialog && (
        <ImportCsvDialog
          onSuccess={handleImportSuccess}
          onCancel={() => setShowImportDialog(false)}
        />
      )}
    </div>
  );
}