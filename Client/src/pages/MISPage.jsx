import { useState, useEffect } from "react";
import { ArrowLeft, FileText, Home, Users, Settings, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./mispage.css";

export default function MISPage() {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('dashboard');

  const handleBackToMain = () => {
    console.log('Navigating back to main dashboard in same tab');
    navigate('/');
  };

  const handleSidebarClick = (view) => {
    console.log('Sidebar clicked, switching to view:', view);
    setActiveView(view);
  };

  const renderContent = () => {
    switch(activeView) {
      case 'dashboard':
        return (
          <div className="mis-content-area">
            <h1 className="mis-accent">MIS Dashboard</h1>
            <p>Management Information System - Dashboard View</p>
          </div>
        );
      case 'reports':
        return (
          <div className="mis-content-area">
            <h1 className="mis-accent">MIS Reports</h1>
            <p>Management Information System - Reports Section</p>
          </div>
        );
      case 'users':
        return (
          <div className="mis-content-area">
            <h1 className="mis-accent">MIS Users</h1>
            <p>Management Information System - User Management</p>
          </div>
        );
      case 'settings':
        return (
          <div className="mis-content-area">
            <h1 className="mis-accent">MIS Settings</h1>
            <p>Management Information System - Settings Configuration</p>
          </div>
        );
      default:
        return (
          <div className="mis-content-area">
            <h1 className="mis-accent">MIS</h1>
            <p>Management Information System</p>
          </div>
        );
    }
  };

  return (
    <div className="mis-page-container">
      {/* Sidebar */}
      <div className="mis-sidebar">
        <div className="mis-sidebar-header">
          <h2>
            <FileText size={24} />
            MIS
          </h2>
          <p>Management Information System</p>
        </div>
        
        <div className="mis-sidebar-nav">
          <a 
            href="#" 
            className={`mis-sidebar-item ${activeView === 'dashboard' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              console.log('Dashboard sidebar item clicked');
              handleSidebarClick('dashboard');
            }}
          >
            <Home size={18} />
            Dashboard
          </a>
          <a 
            href="#" 
            className={`mis-sidebar-item ${activeView === 'reports' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              console.log('Reports sidebar item clicked');
              handleSidebarClick('reports');
            }}
          >
            <BarChart3 size={18} />
            Reports
          </a>
          <a 
            href="#" 
            className={`mis-sidebar-item ${activeView === 'users' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              console.log('Users sidebar item clicked');
              handleSidebarClick('users');
            }}
          >
            <Users size={18} />
            Users
          </a>
          <a 
            href="#" 
            className={`mis-sidebar-item ${activeView === 'settings' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              console.log('Settings sidebar item clicked');
              handleSidebarClick('settings');
            }}
          >
            <Settings size={18} />
            Settings
          </a>
        </div>
      </div>

      {/* Main Content */}
      <div className="mis-main-content">
        <div className="mis-page-header">
          <div className="mis-page-header-left">
            <h1>MIS<p>-</p><p>Management Information System</p>
            </h1>
          </div>
          <button onClick={handleBackToMain} className="mis-back-btn">
            <ArrowLeft size={16} />
            Back to Main Dashboard
          </button>
        </div>
        
        {renderContent()}
      </div>
    </div>
  );
}
