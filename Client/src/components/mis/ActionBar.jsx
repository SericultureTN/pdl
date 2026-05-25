import { Save, Send, RotateCcw, Printer, FileSpreadsheet, Loader2 } from "lucide-react";

export default function ActionBar({ onSaveDraft, onSubmit, onReset, onExport, onPrint, disabled }) {
  return (
    <div className="gov-action-bar">
      <div className="gov-action-left">
        <button className="gov-btn gov-btn-ghost" onClick={onPrint} disabled={disabled}>
          <Printer size={15} /> Print
        </button>
        <button className="gov-btn gov-btn-ghost" onClick={onExport} disabled={disabled}>
          <FileSpreadsheet size={15} /> Export Excel
        </button>
      </div>
      <div className="gov-action-right">
        <button className="gov-btn gov-btn-reset" onClick={onReset} disabled={disabled}>
          <RotateCcw size={15} /> Reset
        </button>
        <button className="gov-btn gov-btn-draft" onClick={onSaveDraft} disabled={disabled}>
          {disabled ? <Loader2 size={15} className="gov-spin" /> : <Save size={15} />} Save Draft
        </button>
        <button className="gov-btn gov-btn-submit" onClick={onSubmit} disabled={disabled}>
          {disabled ? <Loader2 size={15} className="gov-spin" /> : <Send size={15} />} Submit
        </button>
      </div>
    </div>
  );
}
