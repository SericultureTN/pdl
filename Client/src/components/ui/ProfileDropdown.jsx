import { useEffect, useRef } from 'react';
import { ChevronDown, LogOut, Mail, Shield, User } from 'lucide-react';

export default function ProfileDropdown({
  user,
  isOpen,
  onToggle,
  onClose,
  onLogout,
}) {
  const dropdownRef = useRef(null);
  const roleLabel = user?.role || user?.type || 'Admin';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const initials = user?.email
    ? user.email.charAt(0).toUpperCase()
    : 'A';

  return (
    <div className="profile-dropdown" ref={dropdownRef}>
      <button
        type="button"
        className="profile-trigger"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="profile-avatar">{initials}</div>
        <div className="profile-trigger-info">
          <span className="profile-email">{user?.email}</span>
          <span className="profile-role-badge">{roleLabel}</span>
        </div>
        <ChevronDown
          size={16}
          className={`profile-chevron ${isOpen ? 'open' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="profile-menu animate-fade-in">
          <div className="profile-menu-header">
            <div className="profile-menu-avatar">{initials}</div>
            <div>
              <p className="profile-menu-name">{user?.name || 'Administrator'}</p>
              <p className="profile-menu-email">{user?.email}</p>
            </div>
          </div>

          <div className="profile-menu-divider" />

          <div className="profile-menu-item static">
            <Mail size={16} />
            <span>{user?.email}</span>
          </div>
          <div className="profile-menu-item static">
            <Shield size={16} />
            <span>Role: {roleLabel}</span>
          </div>
          <div className="profile-menu-item static">
            <User size={16} />
            <span>Enterprise Account</span>
          </div>

          <div className="profile-menu-divider" />

          <button type="button" className="profile-menu-logout" onClick={onLogout}>
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
