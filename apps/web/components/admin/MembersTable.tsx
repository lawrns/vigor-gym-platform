"use client";

import { Icons } from '../../lib/icons/registry';

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

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface MembersTableProps {
  members: Member[];
  pagination: Pagination;
  loading: boolean;
  error: string | null;
  onPageChange: (page: number) => void;
  onEdit: (member: Member) => void;
  onDelete: (memberId: string) => void;
}

function MemberRow({ 
  member, 
  onEdit, 
  onDelete 
}: { 
  member: Member; 
  onEdit: (member: Member) => void;
  onDelete: (memberId: string) => void;
}) {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <tr className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
      <td className="py-3 px-4">
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {member.firstName} {member.lastName}
        </div>
      </td>
      <td className="py-3 px-4 text-gray-500 dark:text-gray-400">
        {member.email}
      </td>
      <td className="py-3 px-4">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[member.status]}`}>
          {statusLabels[member.status]}
        </span>
      </td>
      <td className="py-3 px-4 text-gray-500 dark:text-gray-400">
        {member._count.memberships > 0 
          ? `${member._count.memberships} membresía${member._count.memberships > 1 ? 's' : ''}`
          : 'Sin membresías'
        }
      </td>
      <td className="py-3 px-4 text-gray-500 dark:text-gray-400">
        {formatDate(member.createdAt)}
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(member)}
            className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            <Icons.Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(member.id)}
            className="text-red-600 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300 font-medium"
          >
            <Icons.Trash className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-t border-gray-200 dark:border-gray-700">
          <td className="py-3 px-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </td>
          <td className="py-3 px-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </td>
          <td className="py-3 px-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </td>
          <td className="py-3 px-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </td>
          <td className="py-3 px-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </td>
          <td className="py-3 px-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </td>
        </tr>
      ))}
    </>
  );
}

export function MembersTable({ 
  members, 
  pagination, 
  loading, 
  error, 
  onPageChange, 
  onEdit, 
  onDelete 
}: MembersTableProps) {
  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="p-6 text-center">
          <Icons.AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Error al cargar miembros
          </h3>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Miembro
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Membresías
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Fecha de registro
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <TableSkeleton />
            ) : members.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <Icons.Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No hay miembros
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Comienza agregando tu primer miembro.
                  </p>
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <MemberRow
                  key={member.id}
                  member={member}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
