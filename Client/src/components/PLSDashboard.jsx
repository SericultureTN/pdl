import { useState } from "react";
import { Package, TrendingUp, Download } from "lucide-react";
import { sericulturistService } from "../services/sericulturist.js";
import "./report-dashboard.css";

export default function PLSDashboard({ user }) {
  const [showReports, setShowReports] = useState(false);

  const handleGenerateReport = () => {
    setShowReports(true);
  };

  const handleDownloadPDF = () => {
    console.log("Downloading PLS Report PDF...");
  };

  return (
    <div className="report-dashboard">
      <div className="dashboard-header">
        <div className="header-left">
          <h1>
            <Package size={28} />
            PLS Dashboard
          </h1>
          <p>Procurement System Reports</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={handleGenerateReport}>
            <TrendingUp size={16} />
            View Reports
          </button>
          <button className="btn btn-secondary" onClick={handleDownloadPDF}>
            <Download size={16} />
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}
