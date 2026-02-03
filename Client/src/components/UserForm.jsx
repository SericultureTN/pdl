import { useState } from 'react';
import { X, User, Mail, Phone, MapPin, Calendar, CheckCircle } from 'lucide-react';
import { sericulturistService } from '../services/sericulturist.js';
import './UserForm.css';

export default function UserForm({ user, onClose, onSave, mode = 'create' }) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: user?.password || '',
    phone: user?.phone || '',
    address: user?.address || '',
    role: user?.role || '',
    ad_office: user?.ad_office || '',
    status: user?.status || 'active'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let result;
      if (mode === 'create') {
        result = await sericulturistService.create(formData);
      } else {
        console.log('Updating user:', user.id, 'with data:', formData);
        result = await sericulturistService.update(user.id, formData);
        console.log('Update result:', result);
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

  return (
    <div className="user-form-overlay">
      <div className="user-form-modal">
        <div className="user-form-header">
          <h2>
            {mode === 'create' ? 'Add New Sericulturist' : 'Edit Sericulturist'}
          </h2>
          <button onClick={onClose} className="close-btn">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="user-form">
          <div className="form-grid">
            <div className="form-group">
              <label>
                <User size={16} />
                Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter full name"
              />
            </div>

            <div className="form-group">
              <label>
                <Mail size={16} />
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter email address"
              />
            </div>

            <div className="form-group">
              <label>
                <Phone size={16} />
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
              />
            </div>

            <div className="form-group">
              <label>
                <Phone size={16} />
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter password"
              />
            </div>

            <div className="form-group">
              <label>
                <MapPin size={16} />
                Address
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter address"
              />
            </div>

            <div className="form-group">
              <label>
                <Calendar size={16} />
                Role
              </label>

                <select
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

            <div className="form-group">
              <label>
                <MapPin size={16} />
                Section
              </label>
              <select
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

            <div className="form-group">
              <label>
                <CheckCircle size={16} />
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="">Select status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : (mode === 'create' ? 'Create' : 'Update')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
