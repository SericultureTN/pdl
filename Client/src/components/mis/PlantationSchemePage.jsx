import { useState } from "react";
import { ChevronDown } from "lucide-react";
import MISEntryTemplate from "./MISEntryTemplate.jsx";

/* -----------------------------------------------------------
   FILTER CONSTANTS
----------------------------------------------------------- */
const SUB_OFFICES = [
  "Extension",
  "Grainage",
  "Anna Silk Exchange",
  "TNSTI, Hosur",
  "Seed Farm",
];

const REGION_AD_MAP = {
  "Dharmapuri Region": [
    "AD Dharmapuri","AD Pennagaram","AD Krishnagiri",
    "AD Denkanikottai","AD Hosur",
  ],
  "Erode Region": [
    "AD Salem","AD Erode","AD Talavady",
    "AD Coimbatore","AD Udumalaipettai","AD Coonoor",
  ],
  "Vellore Region": [
    "AD Vaniyambadi","AD Villupuram","AD Tiruvannamalai",
  ],
  "Trichy Region": [
    "AD Trichy","AD Namakkal",
  ],
  "Madurai Region": [
    "AD Dindigul","AD Theni","AD Tenkasi",
  ],
};

const REGIONS     = Object.keys(REGION_AD_MAP);
const FIN_YEARS   = ["2024–25","2025–26","2023–24","2022–23"];
const ALL_MONTHS  = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

/* -----------------------------------------------------------
   DATA SECTIONS — Acre + Farmer
   Each section has rows for every plantation category
----------------------------------------------------------- */
const SECTIONS = [
  {
    title: "Acre",
    rows: [
      { key: "acre_new",       label: "New Plantation" },
      { key: "acre_maintain",  label: "Maintenance" },
      { key: "acre_rejuv",     label: "Rejuvenation" },
      { key: "acre_replant",   label: "Replanting" },
    ],
  },
  {
    title: "Farmer",
    rows: [
      { key: "farmer_new",      label: "New Farmers" },
      { key: "farmer_maintain", label: "Maintenance" },
      { key: "farmer_rejuv",    label: "Rejuvenation" },
      { key: "farmer_replant",  label: "Replanting" },
    ],
  },
];

const DEFAULT_DATA = {
  acre_new:       { ulm: 180 },
  acre_maintain:  { ulm: 240 },
  acre_rejuv:     { ulm: 60  },
  acre_replant:   { ulm: 45  },
  farmer_new:     { ulm: 90  },
  farmer_maintain:{ ulm: 120 },
  farmer_rejuv:   { ulm: 30  },
  farmer_replant: { ulm: 22  },
};

/* -----------------------------------------------------------
   CUSTOM FILTER COMPONENT
   Rendered inside the shared "Office & Period Details" card
----------------------------------------------------------- */
function PlantationFilters() {
  const [subOffice, setSubOffice] = useState("Extension");
  const [region,    setRegion]    = useState("Dharmapuri Region");
  const [adOffice,  setAdOffice]  = useState(REGION_AD_MAP["Dharmapuri Region"][0]);
  const [finYear,   setFinYear]   = useState("2024–25");
  const [month,     setMonth]     = useState("April");

  const showRegion = subOffice === "Extension";

  function handleRegionChange(r) {
    setRegion(r);
    setAdOffice(REGION_AD_MAP[r][0]);
  }

  const SelectField = ({ label, value, onChange, opts }) => (
    <div className="dfls-filter-field">
      <label>{label}</label>
      <div className="dfls-select-wrap">
        <select value={value} onChange={e => onChange(e.target.value)}>
          {opts.map(o => <option key={o}>{o}</option>)}
        </select>
        <ChevronDown size={13} />
      </div>
    </div>
  );

  return (
    <div className="dfls-filter-row" style={{ flexWrap: "wrap" }}>
      {/* Field 1 — Subordinate Office (always visible) */}
      <SelectField
        label="Subordinate Office"
        value={subOffice}
        onChange={setSubOffice}
        opts={SUB_OFFICES}
      />

      {/* Field 2 — Region (only when Extension) */}
      {showRegion && (
        <SelectField
          label="Region"
          value={region}
          onChange={handleRegionChange}
          opts={REGIONS}
        />
      )}

      {/* Field 3 — AD Office (only when Extension) */}
      {showRegion && (
        <SelectField
          label="AD Office"
          value={adOffice}
          onChange={setAdOffice}
          opts={REGION_AD_MAP[region]}
        />
      )}

      {/* Field 4 — Financial Year */}
      <SelectField
        label="Financial Year"
        value={finYear}
        onChange={setFinYear}
        opts={FIN_YEARS}
      />

      {/* Field 5 — Month */}
      <SelectField
        label="Month"
        value={month}
        onChange={setMonth}
        opts={ALL_MONTHS}
      />
    </div>
  );
}

/* -----------------------------------------------------------
   EXPORTED PAGE
----------------------------------------------------------- */
export default function PlantationSchemePage({ year, user, onBack }) {
  const navId = year === "2024-25" ? "scheme-2024" : "scheme-2025";
  const title = `Plantation Scheme ${year}`;

  return (
    <MISEntryTemplate
      pageTitle={title}
      breadcrumb={title}
      unit="Acre / Farmer"
      sections={SECTIONS}
      defaultData={DEFAULT_DATA}
      activeNavId={navId}
      user={user}
      onBack={onBack}
      renderFilters={() => <PlantationFilters />}
    />
  );
}
