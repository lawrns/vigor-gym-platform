import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Staff Management',
  description: 'Manage your gym staff, schedules, and certifications',
};

export default function StaffPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Staff Management</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Manage your gym staff, schedules, and certifications
        </p>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="h-8 w-8 text-blue-600 dark:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Staff Management Coming Soon
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            This feature is currently under development. You'll be able to manage staff members,
            schedules, and certifications here.
          </p>
        </div>
      </div>
    </div>
  );
}
