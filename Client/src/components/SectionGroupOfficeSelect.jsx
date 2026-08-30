import { useEffect, useState } from 'react';
import { listSections, listGroups, listOffices } from '../services/hierarchyApi.js';
import './SectionGroupOfficeSelect.css';

/**
 * Section -> Group -> Office cascading picker. Controlled: the parent owns
 * sectionId/groupId/officeId and receives all three back together via
 * onChange, so this component alone owns the "changing a parent clears its
 * child" rule. Group/Office labels come from the selected section's own
 * group_label/office_label (e.g. POC: Region / Market Office, MIS:
 * Region/Unit Group / AD Office).
 */
export default function SectionGroupOfficeSelect({
  sectionId,
  groupId,
  officeId,
  onChange,
  disabled = false,
  required = false,
  sectionLabel = 'Section',
  className = '',
}) {
  const [sections, setSections] = useState([]);
  const [groups, setGroups] = useState([]);
  const [offices, setOffices] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingOffices, setLoadingOffices] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    listSections()
      .then((data) => { if (!cancelled) setSections(data); })
      .catch((err) => { if (!cancelled) setError(err.message || 'Failed to load sections'); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!sectionId) {
      setGroups([]);
      return undefined;
    }
    let cancelled = false;
    setLoadingGroups(true);
    listGroups(sectionId)
      .then((data) => { if (!cancelled) setGroups(data); })
      .catch((err) => { if (!cancelled) setError(err.message || 'Failed to load groups'); })
      .finally(() => { if (!cancelled) setLoadingGroups(false); });
    return () => { cancelled = true; };
  }, [sectionId]);

  useEffect(() => {
    if (!groupId) {
      setOffices([]);
      return undefined;
    }
    let cancelled = false;
    setLoadingOffices(true);
    listOffices(groupId)
      .then((data) => { if (!cancelled) setOffices(data); })
      .catch((err) => { if (!cancelled) setError(err.message || 'Failed to load offices'); })
      .finally(() => { if (!cancelled) setLoadingOffices(false); });
    return () => { cancelled = true; };
  }, [groupId]);

  const selectedSection = sections.find((s) => s.id === sectionId) || null;
  const groupLabel = selectedSection?.groupLabel || 'Region';
  const officeLabel = selectedSection?.officeLabel || 'Office';

  const handleSectionChange = (e) => {
    const value = e.target.value ? Number(e.target.value) : null;
    onChange({ sectionId: value, groupId: null, officeId: null });
  };

  const handleGroupChange = (e) => {
    const value = e.target.value ? Number(e.target.value) : null;
    onChange({ sectionId, groupId: value, officeId: null });
  };

  const handleOfficeChange = (e) => {
    const value = e.target.value ? Number(e.target.value) : null;
    onChange({ sectionId, groupId, officeId: value });
  };

  return (
    <div className={`sgo-select grid gap-4 sm:grid-cols-3 ${className}`}>
      {/* label/select as siblings, not nested — a nested <select> inside a
          <label> is vulnerable to ancestor CSS (e.g. `.some-parent label {
          display: flex }`) silently forcing the label text and dropdown onto
          one row instead of stacking them. */}
      <div className="sgo-field">
        <label htmlFor="sgo-section">
          {sectionLabel}{required && <span className="sgo-required">*</span>}
        </label>
        <select
          id="sgo-section"
          value={sectionId ?? ''}
          onChange={handleSectionChange}
          disabled={disabled}
          required={required}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-600"
        >
          <option value="">-- Select Section --</option>
          {sections.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      <div className="sgo-field">
        <label htmlFor="sgo-group">
          {groupLabel}{required && <span className="sgo-required">*</span>}
        </label>
        <select
          id="sgo-group"
          value={groupId ?? ''}
          onChange={handleGroupChange}
          disabled={disabled || !sectionId || loadingGroups}
          required={required}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-600"
        >
          <option value="">
            {!sectionId ? 'Select a section first' : loadingGroups ? 'Loading…' : `-- Select ${groupLabel} --`}
          </option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </div>

      <div className="sgo-field">
        <label htmlFor="sgo-office">
          {officeLabel}{required && <span className="sgo-required">*</span>}
        </label>
        <select
          id="sgo-office"
          value={officeId ?? ''}
          onChange={handleOfficeChange}
          disabled={disabled || !groupId || loadingOffices}
          required={required}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-600"
        >
          <option value="">
            {!groupId ? `Select a ${groupLabel.toLowerCase()} first` : loadingOffices ? 'Loading…' : `-- Select ${officeLabel} --`}
          </option>
          {offices.map((o) => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
      </div>

      {error && <p className="text-xs text-red-600 sm:col-span-3">{error}</p>}
    </div>
  );
}
