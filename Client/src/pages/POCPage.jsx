import { useState, useEffect } from "react";
import { Factory, Home, Users, Settings, BarChart3, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./pocpage.css";

export default function POCPage() {
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
          <div className="poc-content-area">
            <h1 className="poc-accent">POC Dashboard</h1>
            <p>Post Cocoon - Dashboard View</p>
          </div>
        );
      case 'reports':
        return (
          <div className="poc-content-area">
            <h1 className="poc-accent">POC Reports</h1>
            <p>Post Cocoon - Reports Section</p>
          </div>
        );
      case 'users':
        return (
          <div className="poc-content-area">
            <h1 className="poc-accent">POC Users</h1>
            <p>Post Cocoon - User Management</p>
          </div>
        );
      case 'settings':
        return (
          <div className="poc-content-area">
            <h1 className="poc-accent">POC Settings</h1>
            <p>Post Cocoon - Settings Configuration</p>
          </div>
        );
      default:
        return (
          <div className="poc-content-area">
            <h1 className="poc-accent">POC</h1>
            <p>Post Cocoon</p>
          </div>
        );
    }
  };

  return (
    <div className="poc-page-container">
      {/* Sidebar */}
      <div className="poc-sidebar">
        <div className="poc-sidebar-header">
          <h2>
            <Factory size={24} />
            POC
          </h2>
          <p>Post Cocoon</p>
        </div>
        
        <div className="poc-sidebar-nav">
          <a 
            href="#" 
            className={`poc-sidebar-item ${activeView === 'dashboard' ? 'active' : ''}`}
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
            className={`poc-sidebar-item ${activeView === 'reports' ? 'active' : ''}`}
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
            className={`poc-sidebar-item ${activeView === 'users' ? 'active' : ''}`}
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
            className={`poc-sidebar-item ${activeView === 'settings' ? 'active' : ''}`}
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
      <div className="poc-main-content">
        <div className="poc-page-header">
          <div className="poc-page-header-left">
            <h1>POC</h1>
            <p>Post Cocoon</p>
          </div>
          <button onClick={handleBackToMain} className="poc-back-btn">
            <ArrowLeft size={16} />
            Back to Main Dashboard
          </button>
        </div>
        
        {renderContent()}
      </div>
    </div>
  );
}
