import { useEffect, useState } from 'react';
import { listRegions, listMarketOffices } from '../services/regionsApi.js';

/**
 * Region -> Market Office cascading picker. Controlled: the parent owns
 * regionId/marketOfficeId and receives both back together via onChange, so
 * this component alone owns the "changing Region clears Market Office" rule.
 */
export default function RegionMarketOfficeSelect({
  regionId,
  marketOfficeId,
  onChange,
  disabled = false,
  required = false,
  regionLabel = 'Region',
  officeLabel = 'Market Office',
  className = '',
}) {
  const [regions, setRegions] = useState([]);
  const [offices, setOffices] = useState([]);
  const [loadingOffices, setLoadingOffices] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    listRegions()
      .then((data) => { if (!cancelled) setRegions(data); })
      .catch((err) => { if (!cancelled) setError(err.message || 'Failed to load regions'); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!regionId) {
      setOffices([]);
      return undefined;
    }
    let cancelled = false;
    setLoadingOffices(true);
    listMarketOffices(regionId)
      .then((data) => { if (!cancelled) setOffices(data); })
      .catch((err) => { if (!cancelled) setError(err.message || 'Failed to load market offices'); })
      .finally(() => { if (!cancelled) setLoadingOffices(false); });
    return () => { cancelled = true; };
  }, [regionId]);

  const handleRegionChange = (e) => {
    const value = e.target.value ? Number(e.target.value) : null;
    onChange({ regionId: value, marketOfficeId: null });
  };

  const handleOfficeChange = (e) => {
    const value = e.target.value ? Number(e.target.value) : null;
    onChange({ regionId, marketOfficeId: value });
  };

  return (
    <div className={`grid gap-4 sm:grid-cols-2 ${className}`}>
      <label className="block">
        <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
          {regionLabel}{required ? ' *' : ''}
        </span>
        <select
          value={regionId ?? ''}
          onChange={handleRegionChange}
          disabled={disabled}
          required={required}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-600"
        >
          <option value="">-- Select Region --</option>
          {regions.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
          {officeLabel}{required ? ' *' : ''}
        </span>
        <select
          value={marketOfficeId ?? ''}
          onChange={handleOfficeChange}
          disabled={disabled || !regionId || loadingOffices}
          required={required}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-600"
        >
          <option value="">
            {!regionId ? 'Select a region first' : loadingOffices ? 'Loading…' : `-- Select ${officeLabel} --`}
          </option>
          {offices.map((o) => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
      </label>

      {error && <p className="text-xs text-red-600 sm:col-span-2">{error}</p>}
    </div>
  );
}
