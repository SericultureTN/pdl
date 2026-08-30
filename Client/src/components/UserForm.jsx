import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Mail, Phone, Lock, MapPin, CheckCircle, ShieldCheck } from 'lucide-react';
import { userService } from '../services/user.js';
import SectionGroupOfficeSelect from './SectionGroupOfficeSelect.jsx';
import './UserForm.css';

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'secondary_admin', label: 'Secondary Admin' },
  { value: 'user', label: 'User' },
];

export default function UserForm({ user, onClose, onSave, mode = 'create' }) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    phone: user?.phone || '',
    address: user?.address || '',
    role: user?.role || 'user',
    designation: user?.designation || '',
    section_id: user?.section_id || null,
    group_id: user?.group_id || null,
    office_id: user?.office_id || null,
    status: user?.status || 'active',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError('');
  };

  const handleRoleChange = (e) => {
    const role = e.target.value;
    setFormData((prev) => ({
      ...prev,
      role,
      // Section/Group/Office only apply to role=user — clear them for admin/secondary_admin.
      ...(role === 'user' ? {} : { section_id: null, group_id: null, office_id: null }),
    }));
    if (error) setError('');
  };

  const handleHierarchyChange = ({ sectionId, groupId, officeId }) => {
    setFormData((prev) => ({ ...prev, section_id: sectionId, group_id: groupId, office_id: officeId }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = { ...formData };
      if (mode === 'edit' && !payload.password) {
        delete payload.password;
      }

      let result;
      if (mode === 'create') {
        result = await userService.create(payload);
      } else {
        result = await userService.update(user.id, payload);
      }

      if (result.ok) {
        onSave(result.user);
        onClose();
      } else {
        setError(result.error || 'Failed to save user');
      }
    } catch (err) {
      console.error('Form submission error:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const isUserRole = formData.role === 'user';

  const modal = (
    <div
      className="user-form-overlay"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="user-form-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-form-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="user-form-header">
          <h2 id="user-form-title">
            {mode === 'create' ? 'Add New User' : 'Edit User'}
          </h2>
          <button type="button" onClick={onClose} className="user-form-close-btn" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="user-form">
          <div className="user-form-body">
            <div className="user-form-grid">
              <div className="user-form-group user-form-group-full">
                <label htmlFor="user-name">
                  <User size={16} />
                  Name *
                </label>
                <input
                  id="user-name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter full name"
                />
              </div>

              <div className="user-form-group user-form-group-full">
                <label htmlFor="user-email">
                  <Mail size={16} />
                  Email *
                </label>
                <input
                  id="user-email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="off"
                  placeholder="Enter email address"
                />
              </div>

              <div className="user-form-group">
                <label htmlFor="user-phone">
                  <Phone size={16} />
                  Phone
                </label>
                <input
                  id="user-phone"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                />
              </div>

              <div className="user-form-group">
                <label htmlFor="user-password">
                  <Lock size={16} />
                  Password{mode === 'create' ? ' *' : ''}
                </label>
                <input
                  id="user-password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required={mode === 'create'}
                  autoComplete="new-password"
                  placeholder={mode === 'create' ? 'Enter password' : 'Leave blank to keep current'}
                />
              </div>

              <div className="user-form-group user-form-group-full">
                <label htmlFor="user-address">
                  <MapPin size={16} />
                  Address
                </label>
                <input
                  id="user-address"
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter address"
                />
              </div>

              <div className="user-form-group">
                <label htmlFor="user-role">
                  <ShieldCheck size={16} />
                  Role *
                </label>
                <select
                  id="user-role"
                  name="role"
                  value={formData.role}
                  onChange={handleRoleChange}
                  required
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="user-form-group">
                <label htmlFor="user-status">
                  <CheckCircle size={16} />
                  Status
                </label>
                <select
                  id="user-status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {isUserRole && (
                <div className="user-form-group user-form-group-full">
                  <label>
                    <MapPin size={16} />
                    Section / Region / Office *
                  </label>
                  <SectionGroupOfficeSelect
                    sectionId={formData.section_id}
                    groupId={formData.group_id}
                    officeId={formData.office_id}
                    onChange={handleHierarchyChange}
                    required
                  />
                </div>
              )}
            </div>

            {error && <div className="user-form-error">{error}</div>}
          </div>

          <div className="user-form-actions">
            <button
              type="button"
              onClick={onClose}
              className="user-form-btn user-form-btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="user-form-btn user-form-btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : mode === 'create' ? 'Create User' : 'Update User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
