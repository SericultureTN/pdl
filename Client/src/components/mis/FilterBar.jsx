import { Filter } from "lucide-react";

export const MONTHS = [
  "April", "May", "June", "July", "August", "September",
  "October", "November", "December", "January", "February", "March"
];

export const YEARS = ["2025-26", "2024-25", "2023-24", "2022-23"];

export const REGIONS_MAP = {
  "All Regions": [],
  "Dharmapuri Region": [
    "AD Dharmapuri", "AD Pennagaram", "AD Krishnagiri", "AD Krishnagiri Grainage",
    "AD Denkanikottai", "AD Hosur", "AD Hosur Grainage"
  ],
  "Erode Region": [
    "AD Salem", "AD Erode", "AD Talavady", "AD Madhahalli",
    "AD Coimbatore", "AD Udumalaipettai", "AD Coonoor"
  ],
  "Vellore Region": ["AD Vaniyambadi", "AD Villupuram", "AD Tiruvannamalai"],
  "Trichy Region": ["AD Trichy", "AD Namakkal"],
  "Madurai Region": ["AD Dindigul", "AD Theni", "AD Tenkasi"],
  "Seed Coordination, Hosur": ["AD Avalapalli", "AD Kalkondapalli", "AD Kollatti"],
  "Govt. Anna Silk Exchange, Kancheepuram": ["AD Kancheepuram"],
  "TNSTI, Hosur": ["AD TNSTI, Hosur"],
};

export const ALL_AD_OFFICES = Object.values(REGIONS_MAP).flat();

export default function FilterBar({ filters, onChange }) {
  const regionOffices = filters.region === "All Regions"
    ? ALL_AD_OFFICES
    : (REGIONS_MAP[filters.region] || []);

  const handleRegionChange = (region) => {
    const offices = REGIONS_MAP[region] || [];
    onChange({ ...filters, region, ad: offices.length > 0 ? "All AD Offices" : "All AD Offices" });
  };

  return (
    <div className="gov-filter-bar">
      <div className="gov-filter-icon"><Filter size={15} /></div>

      <select value={filters.region} onChange={e => handleRegionChange(e.target.value)}>
        {Object.keys(REGIONS_MAP).map(r => <option key={r}>{r}</option>)}
      </select>

      <select value={filters.ad} onChange={e => onChange({ ...filters, ad: e.target.value })}>
        <option>All AD Offices</option>
        {regionOffices.map(o => <option key={o}>{o}</option>)}
      </select>

      <select value={filters.year} onChange={e => onChange({ ...filters, year: e.target.value })}>
        {YEARS.map(y => <option key={y}>{y}</option>)}
      </select>

      <select value={filters.month} onChange={e => onChange({ ...filters, month: e.target.value })}>
        {MONTHS.map(m => <option key={m}>{m}</option>)}
      </select>
    </div>
  );
}
