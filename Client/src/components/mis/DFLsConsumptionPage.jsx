import MISEntryTemplate from "./MISEntryTemplate.jsx";

const SECTIONS = [
  {
    title: "BV",
    rows: [
      { key: "bv_govt",  label: "Govt" },
      { key: "bv_nsso",  label: "NSSO" },
      { key: "bv_tnpvt", label: "TN Pvt" },
      { key: "bv_other", label: "Other State" },
    ],
  },
  {
    title: "CB",
    rows: [
      { key: "cb_other", label: "Other State" },
      { key: "cb_nsso",  label: "NSSO" },
    ],
  },
  {
    title: "P1",
    rows: [
      { key: "p1", label: "Value" },
    ],
  },
];

const DEFAULT_DATA = {
  bv_govt:  { ulm: 110 },
  bv_nsso:  { ulm: 190 },
  bv_tnpvt: { ulm: 140 },
  bv_other: { ulm: 35  },
  cb_other: { ulm: 70  },
  cb_nsso:  { ulm: 35  },
  p1:       { ulm: 200 },
};

export default function DFLsConsumptionPage({ user, onBack }) {
  return (
    <MISEntryTemplate
      pageTitle="DFLs Consumption"
      breadcrumb="DFLs Consumption"
      unit="Nos"
      sections={SECTIONS}
      defaultData={DEFAULT_DATA}
      activeNavId="dfls-consumption"
      user={user}
      onBack={onBack}
    />
  );
}
