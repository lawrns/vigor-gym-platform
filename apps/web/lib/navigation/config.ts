import { Icons } from '../icons/registry';

export type UserRole = 'owner' | 'manager' | 'trainer' | 'staff' | 'member' | 'superadmin';

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: keyof typeof Icons;
  roles?: UserRole[];
  badge?: string;
  children?: NavigationItem[];
}

export const navigationConfig: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: 'Activity',
    roles: ['owner', 'manager', 'trainer', 'staff', 'member'],
  },
  {
    id: 'members',
    label: 'Miembros',
    href: '/admin/members',
    icon: 'Users',
    roles: ['owner', 'manager', 'staff'],
    children: [
      {
        id: 'members-list',
        label: 'Lista de Miembros',
        href: '/admin/members',
        icon: 'Users',
        roles: ['owner', 'manager', 'staff'],
      },
      {
        id: 'members-analytics',
        label: 'Análisis de Miembros',
        href: '/admin/analytics',
        icon: 'BarChart3',
        roles: ['owner', 'manager'],
      },
    ],
  },
  {
    id: 'classes',
    label: 'Clases',
    href: '/classes',
    icon: 'Calendar',
    roles: ['owner', 'manager', 'trainer', 'staff'],
  },
  {
    id: 'staff',
    label: 'Personal',
    href: '/staff',
    icon: 'UserCheck',
    roles: ['owner', 'manager'],
  },
  {
    id: 'billing',
    label: 'Facturación',
    href: '/billing',
    icon: 'CreditCard',
    roles: ['owner', 'manager'],
    children: [
      {
        id: 'billing-invoices',
        label: 'Facturas',
        href: '/billing/invoices',
        icon: 'FileText',
        roles: ['owner', 'manager'],
      },
    ],
  },
  {
    id: 'reports',
    label: 'Reportes',
    href: '/reports',
    icon: 'BarChart3',
    roles: ['owner', 'manager'],
    children: [
      {
        id: 'reports-analytics',
        label: 'Análisis',
        href: '/admin/analytics',
        icon: 'TrendingUp',
        roles: ['owner', 'manager'],
      },
      {
        id: 'reports-observability',
        label: 'Observabilidad',
        href: '/admin/observability',
        icon: 'Monitor',
        roles: ['owner', 'manager'],
      },
    ],
  },
  {
    id: 'scans',
    label: 'Escaneos',
    href: '/scans',
    icon: 'Scan',
    roles: ['member', 'trainer', 'manager', 'staff'],
  },
  {
    id: 'marketing',
    label: 'Marketing',
    href: '/marketing',
    icon: 'Megaphone',
    roles: ['owner', 'manager'],
    children: [
      {
        id: 'marketing-referrals',
        label: 'Referidos',
        href: '/referrals',
        icon: 'UserPlus',
        roles: ['owner', 'manager'],
      },
      {
        id: 'marketing-campaigns',
        label: 'Campañas',
        href: '/campaigns',
        icon: 'Mail',
        roles: ['owner', 'manager'],
      },
      {
        id: 'marketing-journeys',
        label: 'Journeys',
        href: '/journeys',
        icon: 'GitBranch',
        roles: ['owner', 'manager'],
      },
    ],
  },
  {
    id: 'settings',
    label: 'Configuración',
    href: '/settings',
    icon: 'Settings',
    roles: ['owner', 'manager'],
  },
];

export function getVisibleNavigation(userRole?: UserRole): NavigationItem[] {
  console.log('[getVisibleNavigation] Called with role:', userRole);

  if (!userRole) {
    console.log('[getVisibleNavigation] No role provided, returning basic navigation');
    // Return basic navigation for authenticated users without specific roles
    return [
      {
        id: 'dashboard',
        label: 'Dashboard',
        href: '/dashboard',
        icon: 'Activity',
      },
      {
        id: 'classes',
        label: 'Clases',
        href: '/classes',
        icon: 'Calendar',
      },
      {
        id: 'reports',
        label: 'Reportes',
        href: '/reports',
        icon: 'BarChart3',
      },
      {
        id: 'referrals',
        label: 'Referidos',
        href: '/referrals',
        icon: 'UserPlus',
      },
      {
        id: 'settings',
        label: 'Configuración',
        href: '/settings',
        icon: 'Settings',
      },
    ];
  }

  const filteredItems = navigationConfig
    .filter(item => !item.roles || item.roles.includes(userRole))
    .map(item => ({
      ...item,
      children: item.children?.filter(child => !child.roles || child.roles.includes(userRole)),
    }));

  console.log('[getVisibleNavigation] Filtered items:', filteredItems.length, filteredItems.map(i => i.label));
  return filteredItems;
}
