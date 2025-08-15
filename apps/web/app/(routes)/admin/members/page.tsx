import { MembersTable } from '../../../../components/admin/MembersTable';

// TODO: Get this from auth context or company selection
const DEMO_COMPANY_ID = '994c79bc-a072-4237-a2a7-75662d6e1c87';

export default function MembersPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white">
          Gestión de Miembros
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Administra los miembros de tu empresa y sus membresías.
        </p>
      </div>

      <MembersTable companyId={DEMO_COMPANY_ID} />
    </div>
  );
}


