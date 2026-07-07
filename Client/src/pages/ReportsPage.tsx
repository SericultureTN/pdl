import { useLocation } from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import ReportsManagementDashboard from '../components/reports/ReportsManagementDashboard';
import { misFullPath } from './mis/misNavConfig.js';

const REPORTS_BACK_KEY = 'pdl-reports-back';

export default function ReportsPage() {
  const location = useLocation();

  useEffect(() => {
    if (location.state?.from === 'mis') {
      sessionStorage.setItem(REPORTS_BACK_KEY, 'mis');
    } else if (location.state?.from === 'dashboard') {
      sessionStorage.setItem(REPORTS_BACK_KEY, 'dashboard');
    }
  }, [location.state]);

  const fromMis = useMemo(
    () =>
      location.state?.from === 'mis' ||
      sessionStorage.getItem(REPORTS_BACK_KEY) === 'mis',
    [location.state]
  );

  const backTo = fromMis ? misFullPath('dashboard') : '/';
  const backLabel = fromMis ? 'Back to MIS' : 'Back to Dashboard';

  return (
    <div className="min-h-screen bg-surface-bg bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(11,93,59,0.06),transparent)]">
      <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-8 sm:py-8">
        <ReportsManagementDashboard
          backLink={{ to: backTo, label: backLabel }}
        />
      </main>
    </div>
  );
}
