import { useState } from 'react';
import DataEntryColumn from './DataEntryColumn.jsx';
import DflsPageShell from './DflsPageShell.jsx';
import { INITIAL_ULM, createInitialDmData } from './dflsConstants.js';

function DflsThreeColumnDataEntry({ ulmData, dmData, onDmChange, onReset }) {
  return (
    <>
      <div className="dfls-three-columns">
        <DataEntryColumn type="ulm" ulmData={ulmData} dmData={dmData} />
        <DataEntryColumn type="dm" ulmData={ulmData} dmData={dmData} onDmChange={onDmChange} />
        <DataEntryColumn type="um" ulmData={ulmData} dmData={dmData} />
      </div>

      <div className="dfls-formula-note">
        UM (Up to Month) values are auto calculated as: <strong>UM = ULM + DM</strong>
      </div>

      <div className="dfls-actions">
        <button type="button" className="dfls-btn dfls-btn-reset" onClick={onReset}>
          Reset
        </button>
        <button type="button" className="dfls-btn dfls-btn-submit">
          Submit
        </button>
      </div>
    </>
  );
}

export default function DflsStandardEntryView({
  pageKey,
  idPrefix,
  unitLabel = 'Unit: Nos',
}) {
  const [ulmData] = useState(INITIAL_ULM);
  const [dmData, setDmData] = useState(createInitialDmData);

  const handleDmChange = (section, key, value) => {
    setDmData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  const handleReset = () => {
    setDmData(createInitialDmData());
  };

  return (
    <DflsPageShell
      pageKey={pageKey}
      idPrefix={idPrefix}
      unitLabel={unitLabel}
      persistOptions={{ dmData, setDmData, createInitialDmData }}
    >
      <DflsThreeColumnDataEntry
        ulmData={ulmData}
        dmData={dmData}
        onDmChange={handleDmChange}
        onReset={handleReset}
      />
    </DflsPageShell>
  );
}
