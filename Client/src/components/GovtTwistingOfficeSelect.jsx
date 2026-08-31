import { useEffect, useMemo, useState } from 'react';
import { listGovtTwistingOffices } from '../services/govtTwistingOfficesApi.js';

/**
 * Region -> Office picker for Government Twisting Unit's own 4-office list —
 * a flat table (no separate regions table), so distinct regions are derived
 * client-side from the one office list. Only regions with at least one
 * Twisting office appear (Vellore/Trichy have none, so they're simply absent
 * rather than shown disabled). Controlled, mirrors GovtReelingOfficeSelect.
 */
export default function GovtTwistingOfficeSelect({
  region,
  officeId,
  onChange,
  disabled = false,
  required = false,
  regionLabel = 'Region',
  officeLabel = 'Office',
  className = '',
}) {
  const [offices, setOffices] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    listGovtTwistingOffices()
      .then((data) => { if (!cancelled) setOffices(data); })
      .catch((err) => { if (!cancelled) setError(err.message || 'Failed to load offices'); });
    return () => { cancelled = true; };
  }, []);

  const regions = useMemo(
    () => [...new Set(offices.map((o) => o.region))],
    [offices]
  );
  const officesInRegion = useMemo(
    () => offices.filter((o) => o.region === region),
    [offices, region]
  );

  const handleRegionChange = (nextRegion) => {
    onChange({ region: nextRegion || '', officeId: '' });
  };

  const handleOfficeChange = (nextOfficeId) => {
    onChange({ region, officeId: nextOfficeId ? Number(nextOfficeId) : '' });
  };

  return (
    <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${className}`}>
      <label className="block">
        <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
          {regionLabel}{required && ' *'}
        </span>
        <select
          value={region || ''}
          onChange={(e) => handleRegionChange(e.target.value)}
          disabled={disabled}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:opacity-70"
        >
          <option value="">Select {regionLabel}</option>
          {regions.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
          {officeLabel}{required && ' *'}
        </span>
        <select
          value={officeId || ''}
          onChange={(e) => handleOfficeChange(e.target.value)}
          disabled={disabled || !region}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:opacity-70"
        >
          <option value="">Select {officeLabel}</option>
          {officesInRegion.map((o) => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
      </label>
      {error && <p className="col-span-full text-xs text-red-600">{error}</p>}
    </div>
  );
}
