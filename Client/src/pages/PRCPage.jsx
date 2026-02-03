import { useState, useEffect } from "react";
import { Cpu, Home, Users, Settings, BarChart3, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./prcpage.css";

export default function PRCPage() {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('dashboard');

  const handleBackToMain = () => {
    console.log('Navigating back to main dashboard in same tab');
    navigate('/');
  };

  const handleSidebarClick = (view) => {
    setActiveView(view);
  };

  const renderContent = () => {
    switch(activeView) {
      case 'dashboard':
        return (
          <div className="prc-content-area">
            <h1 className="prc-accent">PRC Dashboard</h1>
            <p>Pre Cocoon - Dashboard View</p>
          </div>
        );
      case 'reports':
        return (
          <div className="prc-content-area">
            <h1 className="prc-accent">PRC Reports</h1>
            <p>Pre Cocoon - Reports Section</p>
          </div>
        );
      case 'users':
        return (
          <div className="prc-content-area">
            <h1 className="prc-accent">PRC Users</h1>
            <p>Pre Cocoon - User Management</p>
          </div>
        );
      case 'settings':
        return (
          <div className="prc-content-area">
            <h1 className="prc-accent">PRC Settings</h1>
            <p>Pre Cocoon - Settings Configuration</p>
          </div>
        );
      default:
        return (
          <div className="prc-content-area">
            <h1 className="prc-accent">PRC</h1>
            <p>Pre Cocoon</p>
          </div>
        );
    }
  };

  return (
    <div className="prc-page-container">
      {/* Sidebar */}
      <div className="prc-sidebar">
        <div className="prc-sidebar-header">
          <h2>
            <Cpu size={24} />
            PRC
          </h2>
          <p>Pre Cocoon</p>
        </div>
        
        <div className="prc-sidebar-nav">
          <a 
            href="#" 
            className={`prc-sidebar-item ${activeView === 'dashboard' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              handleSidebarClick('dashboard');
            }}
          >
            <Home size={18} />
            Dashboard
          </a>
          <a 
            href="#" 
            className={`prc-sidebar-item ${activeView === 'reports' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              handleSidebarClick('reports');
            }}
          >
            <BarChart3 size={18} />
            Reports
          </a>
          <a 
            href="#" 
            className={`prc-sidebar-item ${activeView === 'users' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              handleSidebarClick('users');
            }}
          >
            <Users size={18} />
            Users
          </a>
          <a 
            href="#" 
            className={`prc-sidebar-item ${activeView === 'settings' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              handleSidebarClick('settings');
            }}
          >
            <Settings size={18} />
            Settings
          </a>
        </div>
      </div>

      {/* Main Content */}
      <div className="prc-main-content">
        <div className="prc-page-header">
          <div className="prc-page-header-left">
            <h1>PRC</h1>
            <p>Pre Cocoon</p>
          </div>
          <button onClick={handleBackToMain} className="prc-back-btn">
            <ArrowLeft size={16} />
            Back to Main Dashboard
          </button>
        </div>
        
        {renderContent()}
      </div>
    </div>
  );
}
