import { Link, useLocation } from 'react-router-dom';
import { LayoutGrid, ChevronRight } from 'lucide-react';
import {
  MIS_REPORT_ITEMS,
  MIS_REPORTS_DASHBOARD,
  misFullPath,
} from './misNavConfig.js';

export default function MISReportsSidebar() {
  const location = useLocation();
  const dashboardPath = misFullPath(MIS_REPORTS_DASHBOARD.path);

  const isActive = (path) => location.pathname === misFullPath(path);

  return (
    <aside className="mis-reports-subsidebar">
      <div className="mis-reports-subsidebar-head">
        <h2>Reports</h2>
        <p>6 modules</p>
      </div>

      <nav className="mis-reports-subsidebar-nav">
        <Link
          to={dashboardPath}
          className={`mis-reports-subsidebar-item ${location.pathname === dashboardPath ? 'active' : ''}`}
        >
          <LayoutGrid size={16} />
          <span>Reports Dashboard</span>
        </Link>

        {MIS_REPORT_ITEMS.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={misFullPath(item.path)}
              className={`mis-reports-subsidebar-item ${active ? 'active' : ''}`}
            >
              {active ? <ChevronRight size={14} /> : <span className="mis-reports-subsidebar-dot" />}
              <span>{item.label}</span>
              {item.placeholder && (
                <span className="mis-reports-subsidebar-tag">Soon</span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
