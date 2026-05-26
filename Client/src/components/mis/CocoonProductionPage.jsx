import MISEntryTemplate from "./MISEntryTemplate.jsx";

const SECTIONS = [
  {
    title: "Bivoltine",
    rows: [
      { key: "bv_govt",  label: "Govt" },
      { key: "bv_nsso",  label: "NSSO" },
      { key: "bv_tnpvt", label: "TN Pvt" },
      { key: "bv_other", label: "Other State" },
    ],
  },
  {
    title: "Cross Breed",
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
  bv_govt:  { ulm: 8500  },
  bv_nsso:  { ulm: 12400 },
  bv_tnpvt: { ulm: 9600  },
  bv_other: { ulm: 3200  },
  cb_other: { ulm: 4800  },
  cb_nsso:  { ulm: 2200  },
  p1:       { ulm: 7800  },
};

export default function CocoonProductionPage({ user, onBack }) {
  return (
    <MISEntryTemplate
      pageTitle="Cocoon Production"
      breadcrumb="Cocoon Production"
      unit="Kg"
      sections={SECTIONS}
      defaultData={DEFAULT_DATA}
      activeNavId="cocoon-production"
      user={user}
      onBack={onBack}
    />
  );
}
