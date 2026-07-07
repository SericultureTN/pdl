import { Link } from 'react-router-dom';
import { Menu, Bell, ChevronDown, ArrowLeft } from 'lucide-react';

export default function MISHeader({ title, breadcrumb, onMenuClick }) {
  return (
    <header className="mis-portal-header">
      <div className="mis-portal-header-left">
        <button
          type="button"
          className="mis-portal-hamburger"
          aria-label="Open menu"
          onClick={onMenuClick}
        >
          <Menu size={20} />
        </button>
        <div className="mis-portal-header-titles">
          <h1 className="mis-portal-page-title">{title}</h1>
          <p className="mis-portal-breadcrumb">{breadcrumb}</p>
        </div>
      </div>

      <div className="mis-portal-header-right">
        <Link to="/" className="mis-portal-back-btn">
          <ArrowLeft size={16} />
          <span>Back to Main Dashboard</span>
        </Link>

        <button type="button" className="mis-portal-notification" aria-label="Notifications">
          <Bell size={20} />
          <span className="mis-portal-notification-badge">3</span>
        </button>

        <button type="button" className="mis-portal-profile">
          <span className="mis-portal-profile-avatar">AS</span>
          <span className="mis-portal-profile-info">
            <span className="mis-portal-profile-name">AD Salem</span>
            <span className="mis-portal-profile-role">AD Office User</span>
          </span>
          <ChevronDown size={16} />
        </button>
      </div>
    </header>
  );
}
