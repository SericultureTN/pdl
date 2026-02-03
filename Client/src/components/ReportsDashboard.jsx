import { useState } from "react";
import { FileText, Download, Filter, Calendar, Search } from "lucide-react";
import "./ReportsDashboard.css";

const REPORT_CATEGORIES = [
  { id: 'mis', name: 'MIS Reports', description: 'Management Information System', count: 12 },
  { id: 'pls', name: 'PLS Reports', description: 'Procurement System', count: 8 },
  { id: 'prc', name: 'PRC Reports', description: 'Processing System', count: 6 },
  { id: 'poc', name: 'POC Reports', description: 'Production System', count: 10 }
];

export default function ReportsDashboard({ user }) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
  };

  const handleBack = () => {
    setSelectedCategory(null);
  };

  const handleDownloadReport = (reportId) => {
    console.log(`Downloading report ${reportId}...`);
  };

  if (selectedCategory) {
    return (
      <div className="reports-dashboard">
        <div className="reports-header">
          <div className="header-left">
            <button onClick={handleBack} className="back-btn">
              ← Back to Reports
            </button>
            <h1>{selectedCategory.name}</h1>
            <p>{selectedCategory.description}</p>
          </div>
          <div className="header-actions">
            <div className="search-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
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
            </div>
          </div>
        </div>

        <div className="reports-grid">
          {[...Array(selectedCategory.count)].map((_, index) => (
            <div key={index} className="report-card">
              <div className="report-icon">
                <FileText size={24} />
              </div>
              <div className="report-content">
                <h3>{selectedCategory.name} - Report #{index + 1}</h3>
                <p>Generated on {new Date(Date.now() - index * 86400000).toLocaleDateString()}</p>
                <div className="report-meta">
                  <span className="report-type">{selectedCategory.description}</span>
                  <span className="report-size">2.4 MB</span>
                </div>
              </div>
              <div className="report-actions">
                <button className="btn btn-primary" onClick={() => handleDownloadReport(index + 1)}>
                  <Download size={16} />
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="reports-dashboard">
      <div className="reports-header">
        <div className="header-left">
          <h1>
            <FileText size={28} />
            Reports Dashboard
          </h1>
          <p>Manage and download all system reports</p>
        </div>
        <div className="header-actions">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search report categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-primary">
            <Filter size={16} />
            Advanced Filter
          </button>
        </div>
      </div>

      <div className="categories-grid">
        {REPORT_CATEGORIES.filter(category => 
          category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          category.description.toLowerCase().includes(searchTerm.toLowerCase())
        ).map(category => (
          <div key={category.id} className="category-card" onClick={() => handleCategorySelect(category)}>
            <div className="category-icon">
              <FileText size={32} />
            </div>
            <div className="category-content">
              <h3>{category.name}</h3>
              <p>{category.description}</p>
              <div className="category-stats">
                <span className="report-count">{category.count} reports</span>
                <span className="last-updated">Last updated: Today</span>
              </div>
            </div>
            <div className="category-arrow">
              →
            </div>
          </div>
        ))}
      </div>

      <div className="recent-activity">
        <h2>Recent Activity</h2>
        <div className="activity-list">
          <div className="activity-item">
            <div className="activity-icon">
              <Download size={16} />
            </div>
            <div className="activity-content">
              <p>MIS Report #5 downloaded by admin@example.com</p>
              <span className="activity-time">2 minutes ago</span>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">
              <FileText size={16} />
            </div>
            <div className="activity-content">
              <p>PLS Report #3 generated</p>
              <span className="activity-time">1 hour ago</span>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">
              <Download size={16} />
            </div>
            <div className="activity-content">
              <p>POC Report #8 downloaded by user@example.com</p>
              <span className="activity-time">3 hours ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
