import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Mail, Phone, MapPin, Calendar, CheckCircle } from 'lucide-react';
import { sericulturistService } from '../services/sericulturist.js';
import './UserForm.css';

export default function UserForm({ user, onClose, onSave, mode = 'create' }) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    phone: user?.phone || '',
    address: user?.address || '',
    role: user?.role || '',
    ad_office: user?.ad_office || '',
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
        result = await sericulturistService.create(payload);
      } else {
        result = await sericulturistService.update(user.id, payload);
      }

      if (result.ok) {
        onSave(result.sericulturist);
        onClose();
      } else {
        setError(result.error || 'Failed to save sericulturist');
      }
    } catch (err) {
      console.error('Form submission error:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

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
            {mode === 'create' ? 'Add New Sericulturist' : 'Edit Sericulturist'}
          </h2>
          <button type="button" onClick={onClose} className="user-form-close-btn" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="user-form">
          <div className="user-form-body">
            <div className="user-form-grid">
              <div className="user-form-group">
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

              <div className="user-form-group">
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
                  <Phone size={16} />
                  Password{mode === 'create' ? ' *' : ''}
                </label>
                <input
                  id="user-password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required={mode === 'create'}
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
                  <Calendar size={16} />
                  Role
                </label>
                <select
                  id="user-role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="">--Select role--</option>
                  <option value="JIS">JIS</option>
                  <option value="AIS">AIS</option>
                  <option value="TA">TA</option>
                </select>
              </div>

              <div className="user-form-group">
                <label htmlFor="user-section">
                  <MapPin size={16} />
                  Section
                </label>
                <select
                  id="user-section"
                  name="ad_office"
                  value={formData.ad_office}
                  onChange={handleChange}
                >
                  <option value="">--Select Section--</option>
                  <option value="Hosur">Hosur</option>
                  <option value="Denkanikkottai">Denkanikkottai</option>
                  <option value="Krishnagiri">Krishnagiri</option>
                  <option value="Dharmapuri">Dharmapuri</option>
                  <option value="Pennagaram">Pennagaram</option>
                  <option value="Salem">Salem</option>
                  <option value="Coimbatore">Coimbatore</option>
                  <option value="Udumalpet">Udumalpet</option>
                  <option value="Erode">Erode</option>
                  <option value="Talavady">Talavady</option>
                  <option value="Coonoor">Coonoor</option>
                  <option value="Vaniyambadi">Vaniyambadi</option>
                  <option value="Tiruvannamalai">Tiruvannamalai</option>
                  <option value="Villuppuram">Villuppuram</option>
                  <option value="Trichy">Trichy</option>
                  <option value="Namakkal">Namakkal</option>
                  <option value="Dindigul">Dindigul</option>
                  <option value="Theni">Theni</option>
                  <option value="Tenkasi">Tenkasi</option>
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
