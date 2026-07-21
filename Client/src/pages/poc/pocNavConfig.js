export const POC_BASE = '/poc-dashboard';

export const POC_DATA_ENTRY_ITEMS = [
  {
    path: 'government-reeling-unit',
    label: 'Government Reeling Unit',
    title: 'Government Reeling Unit — MIS-37',
    breadcrumb: 'Dashboard > Data Entry > Government Reeling Unit',
    placeholder: false,
  },
  {
    path: 'private-reeling-unit',
    label: 'Private Reeling Unit',
    title: 'Private Reeling Unit — MIS-40',
    breadcrumb: 'Dashboard > Data Entry > Private Reeling Unit',
    placeholder: false,
  },
  {
    path: 'twisting',
    label: 'Twisting',
    title: 'Government Twisting Unit — MIS-34',
    breadcrumb: 'Dashboard > Data Entry > Twisting',
    placeholder: false,
  },
  {
    path: 'market',
    label: 'Market',
    title: 'Market',
    breadcrumb: 'Dashboard > Data Entry > Market',
    placeholder: true,
  },
];

export const POC_MAIN_NAV_ITEMS = [
  {
    path: 'dashboard',
    label: 'Dashboard',
    title: 'POC Dashboard',
    breadcrumb: 'Dashboard',
    group: 'main',
    placeholder: false,
  },
  {
    path: 'report-viewer',
    label: 'POC Report Viewer',
    title: 'POC Report Viewer',
    breadcrumb: 'Dashboard > POC Report Viewer',
    group: 'main',
    placeholder: true,
  },
  {
    path: 'analytics',
    label: 'POC Analytics',
    title: 'POC Analytics',
    breadcrumb: 'Dashboard > POC Analytics',
    group: 'main',
    placeholder: true,
  },
  {
    path: 'user-management',
    label: 'User Management',
    title: 'User Management',
    breadcrumb: 'Dashboard > User Management',
    group: 'main',
    placeholder: true,
  },
  {
    path: 'settings',
    label: 'Settings',
    title: 'Settings',
    breadcrumb: 'Dashboard > Settings',
    group: 'footer',
    placeholder: true,
  },
  {
    path: 'profile',
    label: 'Profile',
    title: 'Profile',
    breadcrumb: 'Dashboard > Profile',
    group: 'footer',
    placeholder: true,
  },
];

export function pocFullPath(segment) {
  return `${POC_BASE}/${segment}`;
}

export function getPocRouteMeta(pathname) {
  const allItems = [...POC_MAIN_NAV_ITEMS, ...POC_DATA_ENTRY_ITEMS];
  const match = allItems.find((item) => pathname === pocFullPath(item.path));

  if (match) {
    return {
      title: match.title,
      breadcrumb: match.breadcrumb,
      label: match.label,
    };
  }

  return {
    title: 'POC Dashboard',
    breadcrumb: 'Dashboard',
    label: 'Dashboard',
  };
}

export function isPocNavActive(pathname, itemPath) {
  return pathname === pocFullPath(itemPath);
}
