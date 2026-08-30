import { Link } from 'react-router-dom';
import { Menu, Bell, ChevronDown, ArrowLeft } from 'lucide-react';

const ROLE_LABELS = { admin: 'Admin', secondary_admin: 'Secondary Admin', user: 'Office User' };

function initials(name) {
  if (!name) return '?';
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
}

export default function POCHeader({ title, breadcrumb, user, onMenuClick }) {
  const displayName = user?.office_name || user?.name || 'User';
  const displayRole = ROLE_LABELS[user?.role] || user?.role || '';

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
        </button>

        <button type="button" className="mis-portal-profile">
          <span className="mis-portal-profile-avatar">{initials(user?.name)}</span>
          <span className="mis-portal-profile-info">
            <span className="mis-portal-profile-name">{displayName}</span>
            <span className="mis-portal-profile-role">{displayRole}</span>
          </span>
          <ChevronDown size={16} />
        </button>
      </div>
    </header>
  );
}
