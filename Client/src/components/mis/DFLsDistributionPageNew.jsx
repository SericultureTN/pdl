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
  bv_govt:  { ulm: 120 },
  bv_nsso:  { ulm: 200 },
  bv_tnpvt: { ulm: 150 },
  bv_other: { ulm: 40  },
  cb_other: { ulm: 80  },
  cb_nsso:  { ulm: 40  },
  p1:       { ulm: 220 },
};

export default function DFLsDistributionPage({ user, onBack }) {
  return (
    <MISEntryTemplate
      pageTitle="DFLs Distribution"
      breadcrumb="DFLs Distribution"
      unit="Nos"
      sections={SECTIONS}
      defaultData={DEFAULT_DATA}
      activeNavId="dfls-distribution"
      user={user}
      onBack={onBack}
    />
  );
}
