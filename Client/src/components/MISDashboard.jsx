import { useState, useEffect } from "react";
import { FileText, TrendingUp, Users, Calendar, Download, Filter } from "lucide-react";
import "./report-dashboard.css";

export default function MISDashboard({ user }) {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    // Simulate loading MIS data
    setTimeout(() => {
      setReportData({
        totalReports: 245,
        pendingReports: 12,
        completedReports: 233,
        monthlyTrend: [45, 52, 48, 58, 62, 55, 67, 72, 68, 75, 82, 88],
        recentReports: [
          { id: 1, title: "Monthly Production Report", date: "2024-01-15", status: "completed" },
          { id: 2, title: "Quality Control Report", date: "2024-01-14", status: "pending" },
          { id: 3, title: "Inventory Analysis", date: "2024-01-13", status: "completed" }
        ]
      });
      setLoading(false);
    }, 1000);
  }, []);

  const handleGenerateReport = () => {
    console.log("Generating MIS Report...");
  };

  const handleDownloadPDF = () => {
    console.log("Downloading MIS Report PDF...");
  };

  if (loading) {
    return (
      <div className="report-dashboard-loading">
        <div className="spinner"></div>
        <p>Loading MIS Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="report-dashboard">
      <div className="dashboard-header">
        <div className="header-left">
          <h1>
            <FileText size={28} />
            MIS Dashboard
          </h1>
          <p>Management Information System Reports</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={handleGenerateReport}>
            <TrendingUp size={16} />
            Generate Report
          </button>
          <button className="btn btn-secondary" onClick={handleDownloadPDF}>
            <Download size={16} />
            Download PDF
          </button>
        </div>
      </div>

      <div className="date-filter">
        <Calendar size={16} />
        <input
          type="date"
          value={dateRange.start}
          onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
        />
        <span>to</span>
        <input
          type="date"
          value={dateRange.end}
          onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
        />
        <button className="btn btn-outline">
          <Filter size={16} />
          Apply Filter
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-icon">
            <FileText size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Reports</h3>
            <div className="stat-value">{reportData.totalReports}</div>
            <div className="stat-change positive">+12% from last month</div>
          </div>
        </div>

        <div className="stat-card orange">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3>Pending Reports</h3>
            <div className="stat-value">{reportData.pendingReports}</div>
            <div className="stat-change negative">-5% from last month</div>
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <h3>Completed Reports</h3>
            <div className="stat-value">{reportData.completedReports}</div>
            <div className="stat-change positive">+18% from last month</div>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="chart-section">
          <h2>Monthly Report Trend</h2>
          <div className="chart-placeholder">
            <TrendingUp size={48} />
            <p>Chart visualization will be displayed here</p>
          </div>
        </div>

        <div className="recent-reports">
          <h2>Recent Reports</h2>
          <div className="reports-list">
            {reportData.recentReports.map(report => (
              <div key={report.id} className="report-item">
                <div className="report-info">
                  <h4>{report.title}</h4>
                  <p>{report.date}</p>
                </div>
                <span className={`status-badge ${report.status}`}>
                  {report.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
