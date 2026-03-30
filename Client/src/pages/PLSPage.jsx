import { useState, useEffect } from "react";
import { Package, Home, Users, Settings, BarChart3, ArrowLeft, FileText, Menu, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./plspage.css";

export default function PLSPage() {
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
          <div className="pls-content-area">
            <h1 className="pls-accent">PLS Dashboard</h1>
            <p>Plans & Schemes - Dashboard View</p>
          </div>
        );
      case 'reports':
        return (
          <div className="pls-content-area">
            <h1 className="pls-accent">PLS Reports</h1>
            <p>Plans & Schemes - Reports Section</p>
          </div>
        );
      case 'users':
        return (
          <div className="pls-content-area">
            <h1 className="pls-accent">PLS Users</h1>
            <p>Plans & Schemes - User Management</p>
          </div>
        );
      case 'settings':
        return (
          <div className="pls-content-area">
            <h1 className="pls-accent">PLS Settings</h1>
            <p>Plans & Schemes - Settings Configuration</p>
          </div>
        );
      default:
        return (
          <div className="pls-content-area">
            <h1 className="pls-accent">PLS</h1>
            <p>Plans & Schemes</p>
          </div>
        );
    }
  };

  return (
    <div className="pls-page-container">
      {/* Sidebar */}
      <div className="pls-sidebar">
        <div className="pls-sidebar-header">
          <h2>
            <Package size={24} />
            PLS
          </h2>
          <p>Plans & Schemes</p>
        </div>
        
        <div className="pls-sidebar-nav">
          <a 
            href="#" 
            className={`pls-sidebar-item ${activeView === 'dashboard' ? 'active' : ''}`}
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
            className={`pls-sidebar-item ${activeView === 'reports' ? 'active' : ''}`}
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
            className={`pls-sidebar-item ${activeView === 'users' ? 'active' : ''}`}
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
            className={`pls-sidebar-item ${activeView === 'settings' ? 'active' : ''}`}
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
      <div className="pls-main-content">
        <div className="pls-page-header">
          <div className="pls-page-header-left">
            <h1>PLS<p>-</p><p>Plans & Schemes</p></h1>
            
          </div>
          <button onClick={handleBackToMain} className="pls-back-btn">
            <ArrowLeft size={16} />
            Back to Main Dashboard
          </button>
        </div>
        
        {renderContent()}
      </div>
    </div>
  );
}
