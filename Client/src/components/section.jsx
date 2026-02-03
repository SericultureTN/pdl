import { useState, useEffect } from "react";
import { Building2, ChevronDown } from "lucide-react";
import "./section.css";

const REPORT_TYPES = [
  "MIS",
  "PLS", 
  "PRC",
  "POC"
];

export default function Section({ user, selectedReport }) {
  const [localSelectedReport, setLocalSelectedReport] = useState(selectedReport || "");

  useEffect(() => {
    setLocalSelectedReport(selectedReport || "");
  }, [selectedReport]);

  const handleReportChange = (e) => {
    setLocalSelectedReport(e.target.value);
  };

  return (
    <div className="section-container">
      <div className="section-header">
        <h2>
          <Building2 size={24} />
          {user.role === 'admin' ? 'Section Reports' : `${user.ad_office} Section`}
        </h2>
      </div>

      <div className="report-selector">
        <label htmlFor="report-type" className="report-label">
          Select Report Type:
        </label>
        <div className="dropdown-wrapper">
          <select
            id="report-type"
            value={localSelectedReport}
            onChange={handleReportChange}
            className="report-dropdown"
          >
            <option value="">-- Select Report --</option>
            {REPORT_TYPES.map(report => (
              <option key={report} value={report}>
                {report}
              </option>
            ))}
          </select>
          <ChevronDown size={20} className="dropdown-icon" />
        </div>
      </div>

      {localSelectedReport && (
        <div className="report-preview">
          <h3>{localSelectedReport} Report</h3>
          <p>Report preview for {localSelectedReport} will be displayed here.</p>
          <div className="report-actions">
            <button className="btn btn-primary">
              Generate Report
            </button>
            <button className="btn btn-secondary">
              Download PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
