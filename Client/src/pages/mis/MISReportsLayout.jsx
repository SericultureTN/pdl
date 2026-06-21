import { Outlet } from 'react-router-dom';
import MISReportsSidebar from './MISReportsSidebar.jsx';

export default function MISReportsLayout() {
  return (
    <div className="mis-reports-layout">
      <MISReportsSidebar />
      <div className="mis-reports-content">
        <Outlet />
      </div>
    </div>
  );
}
