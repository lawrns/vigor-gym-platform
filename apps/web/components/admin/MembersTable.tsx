"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient, isAPIError } from '../../lib/api/client';
import type { Member, PaginatedResponse } from '../../lib/api/types';
import { Icons } from '../../lib/icons/registry';

interface MembersTableProps {
  companyId: string;
}

function MemberRow({ member }: { member: Member }) {
  const statusColors = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    invited: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    paused: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  };

  const statusLabels = {
    active: 'Activo',
    invited: 'Invitado',
    paused: 'Pausado',
    cancelled: 'Cancelado',
  };

  return (
    <tr className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
      <td className="py-3 px-4">
        <div>
          <div className="font-medium text-gray-900 dark:text-white">
            {member.firstName} {member.lastName}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            ID: {member.id.slice(0, 8)}...
          </div>
        </div>
      </td>
      <td className="py-3 px-4 text-gray-900 dark:text-gray-300">
        {member.email}
      </td>
      <td className="py-3 px-4">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[member.status]}`}>
          {statusLabels[member.status]}
        </span>
      </td>
      <td className="py-3 px-4 text-gray-500 dark:text-gray-400">
        {member.memberships && member.memberships.length > 0 
          ? member.memberships.map(m => m.plan?.name).join(', ')
          : 'Sin plan'
        }
      </td>
      <td className="py-3 px-4 text-gray-500 dark:text-gray-400">
        {new Date(member.createdAt).toLocaleDateString('es-MX')}
      </td>
      <td className="py-3 px-4">
        <Link
          href={`/admin/members/${member.id}`}
          className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
        >
          Ver detalles
        </Link>
      </td>
    </tr>
  );
}

function TableSkeleton() {
  return (
    <div className="animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-t border-gray-200 dark:border-gray-700">
          <td className="py-3 px-4">
            <div className="space-y-2">
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </td>
          <td className="py-3 px-4">
            <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </td>
          <td className="py-3 px-4">
            <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          </td>
          <td className="py-3 px-4">
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </td>
          <td className="py-3 px-4">
            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </td>
          <td className="py-3 px-4">
            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </td>
        </tr>
      ))}
    </div>
  );
}

export function MembersTable({ companyId }: MembersTableProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
  });

  const fetchMembers = async (offset = 0) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.members.list(companyId, {
        limit: pagination.limit.toString(),
        offset: offset.toString(),
      });
      
      if (isAPIError(response)) {
        throw new Error(response.message);
      }
      
      setMembers(response.data);
      setPagination({
        total: response.total,
        limit: response.limit,
        offset: response.offset,
      });
    } catch (err) {
      console.error('Failed to fetch members:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      fetchMembers();
    }
  }, [companyId]);

  // Filter members based on search query
  const filteredMembers = members.filter(member => {
    const query = searchQuery.toLowerCase();
    return (
      member.firstName.toLowerCase().includes(query) ||
      member.lastName.toLowerCase().includes(query) ||
      member.email.toLowerCase().includes(query) ||
      member.status.toLowerCase().includes(query)
    );
  });

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <Icons.Activity className="h-6 w-6 text-red-600 dark:text-red-400" />
          <div>
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
              Error al cargar miembros
            </h3>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              {error}
            </p>
            <button
              onClick={() => fetchMembers()}
              className="mt-3 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300"
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Actions */}
      <div className="flex items-center justify-between">
        <div className="relative">
          <Icons.Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar miembros..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <Link
          href="/admin/members/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium"
        >
          <Icons.Users className="h-4 w-4 mr-2" />
          Agregar Miembro
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th scope="col" className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Nombre
              </th>
              <th scope="col" className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Email
              </th>
              <th scope="col" className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Estado
              </th>
              <th scope="col" className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Plan
              </th>
              <th scope="col" className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Registro
              </th>
              <th scope="col" className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton />
            ) : filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 px-4 text-center text-gray-500 dark:text-gray-400">
                  {searchQuery ? 'No se encontraron miembros que coincidan con la búsqueda.' : 'No hay miembros registrados.'}
                </td>
              </tr>
            ) : (
              filteredMembers.map((member) => (
                <MemberRow key={member.id} member={member} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Info */}
      {!loading && filteredMembers.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>
            Mostrando {filteredMembers.length} de {pagination.total} miembros
          </span>
          {pagination.total > pagination.limit && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => fetchMembers(Math.max(0, pagination.offset - pagination.limit))}
                disabled={pagination.offset === 0}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Anterior
              </button>
              <button
                onClick={() => fetchMembers(pagination.offset + pagination.limit)}
                disabled={pagination.offset + pagination.limit >= pagination.total}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
