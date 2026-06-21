export const MIS_BASE = '/mis-dashboard';

export const MIS_DATA_ENTRY_ITEMS = [
  {
    path: 'plantation-overall',
    label: 'Plantation Overall',
    title: 'Plantation Overall',
    breadcrumb: 'Dashboard > Data Entry > Plantation Overall',
    placeholder: true,
  },
  {
    path: 'plantation-scheme-2024-25',
    label: 'Plantation Scheme 2024-25',
    title: 'Plantation Scheme 2024–25',
    breadcrumb: 'Dashboard > Data Entry > Plantation Scheme 2024–25',
    placeholder: false,
  },
  {
    path: 'plantation-scheme-2025-26',
    label: 'Plantation Scheme 2025-26',
    title: 'Plantation Scheme 2025–26',
    breadcrumb: 'Dashboard > Data Entry > Plantation Scheme 2025–26',
    placeholder: false,
  },
  {
    path: 'dfls-distribution',
    label: 'DFLs Distribution',
    title: 'DFLs Distribution',
    breadcrumb: 'Dashboard > Data Entry > DFLs Distribution',
    placeholder: false,
  },
  {
    path: 'dfls-consumption',
    label: 'DFLs Consumption',
    title: 'DFLs Consumption',
    breadcrumb: 'Dashboard > Data Entry > DFLs Consumption',
    placeholder: false,
  },
  {
    path: 'cocoon-production',
    label: 'Cocoon Production',
    title: 'Cocoon Production',
    breadcrumb: 'Dashboard > Data Entry > Cocoon Production',
    placeholder: false,
  },
];

export const MIS_REPORT_ITEMS = [
  {
    path: 'reports/plantation-overall',
    label: 'Plantation Overall',
    title: 'Plantation Overall – Report',
    breadcrumb: 'Dashboard > Reports > Plantation Overall',
    description: 'Consolidated plantation overall monthly report',
    placeholder: true,
  },
  {
    path: 'reports/plantation-scheme-2024-25',
    label: 'Plantation Scheme 2024-25',
    title: 'Plantation Scheme 2024-25 – Monthly Report',
    breadcrumb: 'Dashboard > Reports > Plantation Scheme 2024-25',
    description: 'Category-wise acre and farmer achievement report',
    placeholder: false,
  },
  {
    path: 'reports/plantation-scheme-2025-26',
    label: 'Plantation Scheme 2025-26',
    title: 'Plantation Scheme 2025-26 – Monthly Report',
    breadcrumb: 'Dashboard > Reports > Plantation Scheme 2025-26',
    description: 'Category-wise acre and farmer achievement report',
    placeholder: false,
  },
  {
    path: 'reports/dfls-distribution',
    label: 'DFLs Distribution',
    title: 'DFLs Distribution – Report',
    breadcrumb: 'Dashboard > Reports > DFLs Distribution',
    description: 'BV, CB and P1 distribution summary report',
    placeholder: false,
  },
  {
    path: 'reports/dfls-consumption',
    label: 'DFLs Consumption',
    title: 'DFLs Consumption – Report',
    breadcrumb: 'Dashboard > Reports > DFLs Consumption',
    description: 'DFLs consumption summary report',
    placeholder: false,
  },
  {
    path: 'reports/cocoon-production',
    label: 'Cocoon Production',
    title: 'Cocoon Production – Report',
    breadcrumb: 'Dashboard > Reports > Cocoon Production',
    description: 'Cocoon production summary report',
    placeholder: false,
  },
];

export const MIS_MAIN_NAV_ITEMS = [
  {
    path: 'dashboard',
    label: 'Dashboard',
    title: 'MIS Dashboard',
    breadcrumb: 'Dashboard',
    group: 'main',
    placeholder: false,
  },
  {
    path: 'analytics',
    label: 'MIS Analytics',
    title: 'MIS Analytics',
    breadcrumb: 'Dashboard > MIS Analytics',
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

export const MIS_REPORTS_DASHBOARD = {
  path: 'reports',
  label: 'Reports Dashboard',
  title: 'Reports Dashboard',
  breadcrumb: 'Dashboard > Reports',
};

export function misFullPath(segment) {
  return `${MIS_BASE}/${segment}`;
}

export function getMisRouteMeta(pathname) {
  if (pathname === misFullPath(MIS_REPORTS_DASHBOARD.path)) {
    return {
      title: MIS_REPORTS_DASHBOARD.title,
      breadcrumb: MIS_REPORTS_DASHBOARD.breadcrumb,
      label: MIS_REPORTS_DASHBOARD.label,
    };
  }

  const allItems = [
    ...MIS_MAIN_NAV_ITEMS,
    ...MIS_DATA_ENTRY_ITEMS,
    ...MIS_REPORT_ITEMS,
  ];

  const match = allItems.find((item) => pathname === misFullPath(item.path));
  if (match) {
    return {
      title: match.title,
      breadcrumb: match.breadcrumb,
      label: match.label,
    };
  }

  return {
    title: 'MIS Dashboard',
    breadcrumb: 'Dashboard',
    label: 'Dashboard',
  };
}

export function isMisNavActive(pathname, itemPath) {
  return pathname === misFullPath(itemPath);
}

export function isReportsSectionActive(pathname) {
  return pathname === misFullPath('reports') || pathname.startsWith(`${MIS_BASE}/reports/`);
}

export function isDataEntrySectionActive(pathname) {
  return MIS_DATA_ENTRY_ITEMS.some((item) => pathname === misFullPath(item.path));
}
