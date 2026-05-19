import { useState, useEffect } from 'react';
import { User, Mail, Moon, Sun, Bell, Shield, Save, Check, Settings, ArrowLeft } from 'lucide-react';
import './UserSettings.css';

export default function UserSettings({ user, onBack }) {
  const [settings, setSettings] = useState({
    name: '',
    email: '',
    theme: 'light',
    notifications: true,
    language: 'en'
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load settings from localStorage or user data
    const storedSettings = localStorage.getItem('userSettings');
    const storedTheme = localStorage.getItem('theme') || 'light';
    
    if (storedSettings) {
      setSettings(prev => ({ ...prev, ...JSON.parse(storedSettings), theme: storedTheme }));
    } else if (user) {
      setSettings(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        theme: storedTheme
      }));
    }
    
    // Apply stored theme on mount
    document.documentElement.setAttribute('data-theme', storedTheme);
  }, [user]);

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleThemeChange = (theme) => {
    handleChange('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  };

  const handleSave = async () => {
    setSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Save to localStorage
    localStorage.setItem('userSettings', JSON.stringify(settings));
    localStorage.setItem('theme', settings.theme);
    
    setSaving(false);
    setSaved(true);
    
    // Hide success message after 3 seconds
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <div className="settings-header-top">
          {onBack && (
            <button className="back-btn" onClick={onBack}>
              <ArrowLeft size={20} />
              Back to Dashboard
            </button>
          )}
        </div>
        <h2>
          <Settings className="header-icon" size={24} />
          User Settings
        </h2>
        <p>Manage your profile preferences and application settings</p>
      </div>

      <div className="settings-grid">
        {/* Profile Settings */}
        <div className="settings-card">
          <div className="settings-card-header">
            <User size={20} />
            <h3>Profile Information</h3>
          </div>
          <div className="settings-card-content">
            <div className="form-group">
              <label htmlFor="settings-name">
                <User size={16} />
                Full Name
              </label>
              <input
                type="text"
                id="settings-name"
                value={settings.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Enter your full name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="settings-email">
                <Mail size={16} />
                Email Address
              </label>
              <input
                type="email"
                id="settings-email"
                value={settings.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="Enter your email"
              />
            </div>
          </div>
        </div>

        {/* Appearance Settings */}
        <div className="settings-card">
          <div className="settings-card-header">
            <Moon size={20} />
            <h3>Appearance</h3>
          </div>
          <div className="settings-card-content">
            <div className="form-group">
              <label>Theme Preference</label>
              <div className="theme-selector">
                <button
                  className={`theme-option ${settings.theme === 'light' ? 'active' : ''}`}
                  onClick={() => handleThemeChange('light')}
                >
                  <Sun size={20} />
                  <span>Light</span>
                </button>
                <button
                  className={`theme-option ${settings.theme === 'dark' ? 'active' : ''}`}
                  onClick={() => handleThemeChange('dark')}
                >
                  <Moon size={20} />
                  <span>Dark</span>
                </button>
                <button
                  className={`theme-option ${settings.theme === 'auto' ? 'active' : ''}`}
                  onClick={() => handleThemeChange('auto')}
                >
                  <div className="auto-icon">
                    <Sun size={14} />
                    <Moon size={14} />
                  </div>
                  <span>Auto</span>
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="settings-language">Language</label>
              <select
                id="settings-language"
                value={settings.language}
                onChange={(e) => handleChange('language', e.target.value)}
              >
                <option value="en">English</option>
                <option value="ta">Tamil</option>
                <option value="hi">Hindi</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="settings-card">
          <div className="settings-card-header">
            <Bell size={20} />
            <h3>Notifications</h3>
          </div>
          <div className="settings-card-content">
            <div className="toggle-group">
              <div className="toggle-info">
                <label>Enable Notifications</label>
                <p>Receive updates about your account and activities</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.notifications}
                  onChange={(e) => handleChange('notifications', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="settings-card">
          <div className="settings-card-header">
            <Shield size={20} />
            <h3>Security</h3>
          </div>
          <div className="settings-card-content">
            <div className="security-info">
              <p>Last login: {new Date().toLocaleString()}</p>
              <p>Role: <span className="role-badge">{user?.role || 'Admin'}</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="settings-footer">
        <button
          className={`save-btn ${saving ? 'saving' : ''} ${saved ? 'saved' : ''}`}
          onClick={handleSave}
          disabled={saving}
        >
          {saved ? (
            <>
              <Check size={18} />
              Saved!
            </>
          ) : saving ? (
            <>
              <span className="spinner"></span>
              Saving...
            </>
          ) : (
            <>
              <Save size={18} />
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
}
