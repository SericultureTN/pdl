import MISEntryTemplate from "./MISEntryTemplate.jsx";

const SECTIONS = [
  {
    title: "Acre",
    rows: [
      { key: "acre_new",      label: "New Plantation" },
      { key: "acre_maintain", label: "Maintenance" },
      { key: "acre_rejuv",    label: "Rejuvenation" },
    ],
  },
  {
    title: "Farmer",
    rows: [
      { key: "farmer_new",      label: "New Farmers" },
      { key: "farmer_maintain", label: "Maintenance" },
      { key: "farmer_rejuv",    label: "Rejuvenation" },
    ],
  },
];

const DEFAULT_DATA = {
  acre_new:       { ulm: 180 },
  acre_maintain:  { ulm: 240 },
  acre_rejuv:     { ulm: 60  },
  farmer_new:     { ulm: 90  },
  farmer_maintain:{ ulm: 120 },
  farmer_rejuv:   { ulm: 30  },
};

export default function PlantationSchemePage({ year, user, onBack }) {
  const navId    = year === "2024-25" ? "scheme-2024" : "scheme-2025";
  const title    = `Plantation Scheme ${year}`;

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
    />
  );
}
