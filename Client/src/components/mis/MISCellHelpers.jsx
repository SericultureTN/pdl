import { Lock, Calculator, Target } from "lucide-react";

/** Read-only Target cell — light blue */
export function TargetCell({ value }) {
  return (
    <td className="gov-td-target">
      <div className="gov-cell-readonly gov-cell-target">
        <Target size={10} className="gov-cell-target-icon" />
        <span>{value === "" || value === undefined ? "—" : value}</span>
      </div>
    </td>
  );
}

/** Read-only ULM cell — grey, locked */
export function ULMCell({ value }) {
  return (
    <td className="gov-td-ulm">
      <div className="gov-cell-readonly gov-cell-ulm">
        <Lock size={10} className="gov-cell-lock" />
        <span>{value === "" || value === undefined ? "—" : value}</span>
      </div>
    </td>
  );
}

/** Editable DM cell — white, user input */
export function DMCell({ value, onChange }) {
  return (
    <td className="gov-td-dm">
      <input
        type="number"
        className="gov-cell-input gov-cell-dm-input"
        value={value}
        onChange={e => onChange(e.target.value)}
        min={0}
        step="any"
        placeholder="0"
      />
    </td>
  );
}

/** Auto-calculated UM cell — green, readonly */
export function UMCell({ value }) {
  const display = value === "" || value === undefined ? "—" : (parseFloat(value) || 0);
  return (
    <td className="gov-td-um">
      <div className="gov-cell-readonly gov-cell-um">
        <Calculator size={10} className="gov-cell-calc-icon" />
        <span>{display}</span>
      </div>
    </td>
  );
}

/** Formula info banner */
export function MISFormulaBanner() {
  return (
    <div className="gov-formula-banner">
      <div className="gov-formula-left">
        <div className="gov-formula-pill gov-formula-ulm">
          <Lock size={11} />
          <span>ULM = Prev Month UM &nbsp;<em>(auto, read-only)</em></span>
        </div>
        <span className="gov-formula-op">+</span>
        <div className="gov-formula-pill gov-formula-dm">
          <span>✏ DM = User Entry</span>
        </div>
        <span className="gov-formula-op">=</span>
        <div className="gov-formula-pill gov-formula-um">
          <Calculator size={11} />
          <span>UM = ULM + DM &nbsp;<em>(auto, read-only)</em></span>
        </div>
      </div>
      <div className="gov-formula-note">
        ℹ Previous Month UM Acre &amp; Farmer are automatically carried forward to current month ULM
      </div>
    </div>
  );
}
