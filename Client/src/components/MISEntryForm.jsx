import { useState } from 'react';
import { X, Building2, User, Calendar, MapPin, FileText, Save } from 'lucide-react';
import './MISEntryForm.css';

// Sections that users can add data to
const SECTIONS = [
  { value: 'MIS', label: 'MIS', color: '#3b82f6' },
  { value: 'PLS', label: 'PLS', color: '#10b981' },
  { value: 'PRC', label: 'PRC', color: '#f59e0b' },
  { value: 'POC', label: 'POC', color: '#ef4444' }
];

export default function MISEntryForm({ user, onClose, onSave }) {
  const [formData, setFormData] = useState({
    section: 'MIS',
    farmerName: '',
    farmerId: '',
    address: '',
    phone: '',
    district: user?.ad_office || '',
    registrationDate: new Date().toISOString().split('T')[0],
    landArea: '',
    variety: '',
    plantationDate: '',
    expectedYield: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.section) newErrors.section = 'Section is required';
    if (!formData.farmerName.trim()) newErrors.farmerName = 'Farmer name is required';
    if (!formData.farmerId.trim()) newErrors.farmerId = 'Farmer ID is required';
    if (!formData.district.trim()) newErrors.district = 'District is required';
    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = 'Phone must be 10 digits';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('http://localhost:4000/api/mis/entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          createdBy: user?.id,
          adOffice: user?.ad_office
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save entry');
      }

      const result = await response.json();
      onSave(result.entry);
      onClose();
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content mis-entry-form">
        <div className="modal-header">
          <h2>
            <FileText size={20} />
            MIS Data Entry Form
          </h2>
          <button onClick={onClose} className="btn-close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Section Selector - All users can select any section */}
          <div className="form-section-selector">
            <label>
              <Building2 size={16} />
              Select Section
            </label>
            <div className="section-buttons">
              {SECTIONS.map(section => (
                <button
                  key={section.value}
                  type="button"
                  className={`section-btn ${formData.section === section.value ? 'active' : ''}`}
                  style={{ 
                    backgroundColor: formData.section === section.value ? section.color : 'transparent',
                    borderColor: section.color
                  }}
                  onClick={() => handleChange({ target: { name: 'section', value: section.value } })}
                >
                  {section.label}
                </button>
              ))}
            </div>
            <input type="hidden" name="section" value={formData.section} />
            {errors.section && <span className="error">{errors.section}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                <User size={16} />
                Farmer Name *
              </label>
              <input
                type="text"
                name="farmerName"
                value={formData.farmerName}
                onChange={handleChange}
                placeholder="Enter farmer name"
              />
              {errors.farmerName && <span className="error">{errors.farmerName}</span>}
            </div>

            <div className="form-group">
              <label>
                Farmer ID *
              </label>
              <input
                type="text"
                name="farmerId"
                value={formData.farmerId}
                onChange={handleChange}
                placeholder="Enter farmer ID"
              />
              {errors.farmerId && <span className="error">{errors.farmerId}</span>}
            </div>
          </div>

          <div className="form-row">
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
                Phone (10 digits)
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter 10-digit phone"
                maxLength={10}
              />
              {errors.phone && <span className="error">{errors.phone}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                District / AD Office *
              </label>
              <input
                type="text"
                name="district"
                value={formData.district}
                onChange={handleChange}
                placeholder="Enter district"
              />
              {errors.district && <span className="error">{errors.district}</span>}
            </div>

            <div className="form-group">
              <label>
                <Calendar size={16} />
                Registration Date
              </label>
              <input
                type="date"
                name="registrationDate"
                value={formData.registrationDate}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                Land Area (acres)
              </label>
              <input
                type="number"
                name="landArea"
                value={formData.landArea}
                onChange={handleChange}
                placeholder="Enter land area"
                step="0.01"
              />
            </div>

            <div className="form-group">
              <label>
                Variety
              </label>
              <input
                type="text"
                name="variety"
                value={formData.variety}
                onChange={handleChange}
                placeholder="Enter variety"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                Plantation Date
              </label>
              <input
                type="date"
                name="plantationDate"
                value={formData.plantationDate}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>
                Expected Yield (kg)
              </label>
              <input
                type="number"
                name="expectedYield"
                value={formData.expectedYield}
                onChange={handleChange}
                placeholder="Enter expected yield"
              />
            </div>
          </div>

          <div className="form-group">
            <label>
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Enter any additional notes"
              rows={3}
            />
          </div>

          {errors.submit && (
            <div className="error-message">{errors.submit}</div>
          )}

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Entry'}
            </button>
          </div>

          <div className="form-info">
            <small>
              * This data will be visible to {formData.section} Section Admin and Super Admin
            </small>
          </div>
        </form>
      </div>
    </div>
  );
}
