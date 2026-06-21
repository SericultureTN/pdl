import { Lock } from 'lucide-react';

const BV_ROWS = ['Govt', 'NSSO', 'TN Pvt', 'Other State'];
const CB_ROWS = ['Other State', 'NSSO'];

function sumValues(values) {
  return Object.values(values).reduce((acc, val) => acc + (Number(val) || 0), 0);
}

function DataTable({ section, rows, values, onChange, readOnly, singleRow = false }) {
  const total = sumValues(values);

  return (
    <div className="dfls-section">
      <div className="dfls-section-title">{section}</div>
      <table className="dfls-table">
        <thead>
          <tr>
            <th>Category</th>
            <th>Nos</th>
          </tr>
        </thead>
        <tbody>
          {singleRow ? (
            <tr>
              <td>Value</td>
              <td>
                {readOnly ? (
                  <span className="dfls-readonly-value">{values.value ?? 0}</span>
                ) : (
                    <input
                      type="number"
                      className="dfls-input dfls-input-dm"
                      value={values.value ?? ''}
                    onChange={(e) => onChange?.('value', e.target.value)}
                    min="0"
                  />
                )}
              </td>
            </tr>
          ) : (
            <>
              {rows.map((row) => (
                <tr key={row}>
                  <td>{row}</td>
                  <td>
                    {readOnly ? (
                      <span className="dfls-readonly-value">{values[row] ?? 0}</span>
                    ) : (
                      <input
                        type="number"
                        className="dfls-input dfls-input-dm"
                        value={values[row] ?? ''}
                        onChange={(e) => onChange?.(row, e.target.value)}
                        min="0"
                      />
                    )}
                  </td>
                </tr>
              ))}
              <tr className="dfls-total-row">
                <td>Total</td>
                <td>{total}</td>
              </tr>
            </>
          )}
        </tbody>
      </table>
    </div>
  );
}

function computeGrandTotal(data) {
  const bvTotal = sumValues(
    Object.fromEntries(BV_ROWS.map((r) => [r, data.bv[r]]))
  );
  const cbTotal = sumValues(
    Object.fromEntries(CB_ROWS.map((r) => [r, data.cb[r]]))
  );
  const p1Value = Number(data.p1.value) || 0;
  return bvTotal + cbTotal + p1Value;
}

export default function DataEntryColumn({ type, ulmData, dmData, onDmChange }) {
  const configs = {
    ulm: {
      headerClass: 'dfls-card-header-grey',
      title: 'ULM (Up to Last Month)',
      subtitle: 'Read Only',
      showLock: true,
      readOnly: true,
      data: ulmData,
    },
    dm: {
      headerClass: 'dfls-card-header-orange',
      title: 'DM (During Month)',
      subtitle: 'Enter Current Month Data',
      showLock: false,
      readOnly: false,
      data: dmData,
    },
    um: {
      headerClass: 'dfls-card-header-green',
      title: 'UM (Up to Month)',
      subtitle: 'Auto Calculated',
      showLock: false,
      readOnly: true,
      data: {
        bv: Object.fromEntries(BV_ROWS.map((r) => [r, (Number(ulmData.bv[r]) || 0) + (Number(dmData.bv[r]) || 0)])),
        cb: Object.fromEntries(CB_ROWS.map((r) => [r, (Number(ulmData.cb[r]) || 0) + (Number(dmData.cb[r]) || 0)])),
        p1: { value: (Number(ulmData.p1.value) || 0) + (Number(dmData.p1.value) || 0) },
      },
    },
  };

  const config = configs[type];
  const data = config.data;
  const grandTotal = computeGrandTotal(data);

  const handleChange = (section, key, value) => {
    if (type !== 'dm' || !onDmChange) return;
    onDmChange(section, key, value);
  };

  return (
    <div className={`dfls-column-card ${type === 'dm' ? 'dfls-column-card-dm' : ''}`}>
      <div className={`dfls-card-header ${config.headerClass}`}>
        <div>
          <h3>{config.title}</h3>
          <p>{config.subtitle}</p>
        </div>
        {config.showLock && <Lock size={18} className="dfls-lock-icon" />}
      </div>

      <div className="dfls-card-body">
        <DataTable
          section="BV"
          rows={BV_ROWS}
          values={data.bv}
          readOnly={config.readOnly}
          onChange={(key, val) => handleChange('bv', key, val)}
        />
        <DataTable
          section="CB"
          rows={CB_ROWS}
          values={data.cb}
          readOnly={config.readOnly}
          onChange={(key, val) => handleChange('cb', key, val)}
        />
        <DataTable
          section="P1"
          values={data.p1}
          readOnly={config.readOnly}
          singleRow
          onChange={(key, val) => handleChange('p1', key, val)}
        />

        <div className="dfls-grand-total">
          <span>Grand Total</span>
          <span>{grandTotal}</span>
        </div>
      </div>
    </div>
  );
}

export { computeGrandTotal };
