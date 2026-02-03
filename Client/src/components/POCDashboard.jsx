import { useState, useEffect } from "react";
import { Factory, TrendingUp, Package, Calendar, Download, Filter } from "lucide-react";
import "./report-dashboard.css";

export default function POCDashboard({ user }) {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    // Simulate loading POC data
    setTimeout(() => {
      setReportData({
        totalProduction: 245,
        activeBatches: 12,
        completedBatches: 233,
        monthlyTrend: [18, 22, 25, 20, 28, 32, 35, 30, 38, 42, 40, 45],
        recentProduction: [
          { id: 1, title: "Silk Production Batch A", date: "2024-01-15", status: "completed", output: "250 kg" },
          { id: 2, title: "Silk Production Batch B", date: "2024-01-14", status: "in-progress", output: "180 kg" },
          { id: 3, title: "Silk Production Batch C", date: "2024-01-13", status: "pending", output: "300 kg" }
        ]
      });
      setLoading(false);
    }, 1000);
  }, []);

  const handleGenerateReport = () => {
    console.log("Generating POC Report...");
  };

  const handleDownloadPDF = () => {
    console.log("Downloading POC Report PDF...");
  };

  if (loading) {
    return (
      <div className="report-dashboard-loading">
        <div className="spinner"></div>
        <p>Loading POC Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="report-dashboard">
      <div className="dashboard-header">
        <div className="header-left">
          <h1>
            <Factory size={28} />
            POC Dashboard
          </h1>
          <p>Production System Reports</p>
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
        <div className="stat-card teal">
          <div className="stat-icon">
            <Factory size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Production</h3>
            <div className="stat-value">{reportData.totalProduction}</div>
            <div className="stat-change positive">+12% from last month</div>
          </div>
        </div>

        <div className="stat-card orange">
          <div className="stat-icon">
            <Package size={24} />
          </div>
          <div className="stat-content">
            <h3>Active Batches</h3>
            <div className="stat-value">{reportData.activeBatches}</div>
            <div className="stat-change positive">+2% from last month</div>
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <h3>Completed Batches</h3>
            <div className="stat-value">{reportData.completedBatches}</div>
            <div className="stat-change positive">+18% from last month</div>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="chart-section">
          <h2>Monthly Production Trend</h2>
          <div className="chart-placeholder">
            <TrendingUp size={48} />
            <p>Production chart visualization will be displayed here</p>
          </div>
        </div>

        <div className="recent-reports">
          <h2>Recent Production</h2>
          <div className="reports-list">
            {reportData.recentProduction.map(production => (
              <div key={production.id} className="report-item">
                <div className="report-info">
                  <h4>{production.title}</h4>
                  <p>{production.date} • {production.output}</p>
                </div>
                <span className={`status-badge ${production.status}`}>
                  {production.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
