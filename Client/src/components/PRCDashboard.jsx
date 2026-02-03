import { useState, useEffect } from "react";
import { Cpu, TrendingUp, Users, Calendar, Download, Filter } from "lucide-react";
import "./report-dashboard.css";

export default function PRCDashboard({ user }) {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    // Simulate loading PRC data
    setTimeout(() => {
      setReportData({
        totalProcessing: 189,
        pendingProcessing: 15,
        completedProcessing: 174,
        monthlyTrend: [38, 42, 45, 48, 52, 55, 58, 62, 65, 68, 72, 75],
        recentProcessing: [
          { id: 1, title: "Silk Reeling Process", date: "2024-01-15", status: "completed", units: "250kg" },
          { id: 2, title: "Thread Processing", date: "2024-01-14", status: "in-progress", units: "180kg" },
          { id: 3, title: "Quality Processing", date: "2024-01-13", status: "completed", units: "320kg" }
        ]
      });
      setLoading(false);
    }, 1000);
  }, []);

  const handleGenerateReport = () => {
    console.log("Generating PRC Report...");
  };

  const handleDownloadPDF = () => {
    console.log("Downloading PRC Report PDF...");
  };

  if (loading) {
    return (
      <div className="report-dashboard-loading">
        <div className="spinner"></div>
        <p>Loading PRC Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="report-dashboard">
      <div className="dashboard-header">
        <div className="header-left">
          <h1>
            <Cpu size={28} />
            PRC Dashboard
          </h1>
          <p>Processing System Reports</p>
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
        <div className="stat-card red">
          <div className="stat-icon">
            <Cpu size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Processing</h3>
            <div className="stat-value">{reportData.totalProcessing}</div>
            <div className="stat-change positive">+22% from last month</div>
          </div>
        </div>

        <div className="stat-card orange">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3>In Progress</h3>
            <div className="stat-value">{reportData.pendingProcessing}</div>
            <div className="stat-change negative">-8% from last month</div>
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <h3>Completed Processing</h3>
            <div className="stat-value">{reportData.completedProcessing}</div>
            <div className="stat-change positive">+28% from last month</div>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="chart-section">
          <h2>Monthly Processing Trend</h2>
          <div className="chart-placeholder">
            <TrendingUp size={48} />
            <p>Processing chart visualization will be displayed here</p>
          </div>
        </div>

        <div className="recent-reports">
          <h2>Recent Processing</h2>
          <div className="reports-list">
            {reportData.recentProcessing.map(processing => (
              <div key={processing.id} className="report-item">
                <div className="report-info">
                  <h4>{processing.title}</h4>
                  <p>{processing.date} • {processing.units}</p>
                </div>
                <span className={`status-badge ${processing.status}`}>
                  {processing.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
