import { Link } from 'react-router-dom';
import { BarChart3, ChevronRight, FileBarChart } from 'lucide-react';
import { MIS_REPORT_ITEMS, misFullPath } from './misNavConfig.js';

export default function MISReportsDashboard() {
  return (
    <div className="dfls-distribution-view mis-reports-dashboard">
      <div className="dfls-office-card">
        <div className="dfls-office-card-top">
          <h2>Reports Dashboard</h2>
          <span className="dfls-unit-badge">6 Modules</span>
        </div>
        <p className="mis-placeholder-text">
          Choose a report module from the left sidebar. Reports show data entered on the
          matching Data Entry screens.
        </p>
      </div>

      <div className="mis-reports-grid">
        {MIS_REPORT_ITEMS.map((item) => (
          <Link
            key={item.path}
            to={misFullPath(item.path)}
            className="mis-reports-card"
          >
            <div className="mis-reports-card-icon">
              <FileBarChart size={22} />
            </div>
            <div className="mis-reports-card-body">
              <h3>{item.label}</h3>
              <p>{item.description}</p>
            </div>
            <ChevronRight size={18} className="mis-reports-card-arrow" />
            {item.placeholder && (
              <span className="mis-reports-card-badge">Coming soon</span>
            )}
          </Link>
        ))}
      </div>

      <div className="mis-reports-dashboard-note">
        <BarChart3 size={16} />
        <span>Enter data under Data Entry, then open the matching report module to view ULM / DM / UM totals.</span>
      </div>
    </div>
  );
}
