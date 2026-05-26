import MISEntryTemplate from "./MISEntryTemplate.jsx";

const SECTIONS = [
  {
    title: "Acre",
    rows: [
      { key: "acre_target",  label: "Target" },
      { key: "acre_ulm",     label: "ULM Acre" },
      { key: "acre_dm",      label: "DM Acre" },
    ],
  },
  {
    title: "Farmer",
    rows: [
      { key: "farmer_target", label: "Target" },
      { key: "farmer_ulm",    label: "ULM Farmer" },
      { key: "farmer_dm",     label: "DM Farmer" },
    ],
  },
];

const DEFAULT_DATA = {
  acre_target:   { ulm: 500 },
  acre_ulm:      { ulm: 320 },
  acre_dm:       { ulm: 0   },
  farmer_target: { ulm: 200 },
  farmer_ulm:    { ulm: 145 },
  farmer_dm:     { ulm: 0   },
};

export default function PlantationOverallPage({ user, onBack }) {
  return (
    <MISEntryTemplate
      pageTitle="Plantation Overall"
      breadcrumb="Plantation Overall"
      unit="Acre / Farmer"
      sections={SECTIONS}
      defaultData={DEFAULT_DATA}
      activeNavId="plantation-overall"
      user={user}
      onBack={onBack}
    />
  );
}
