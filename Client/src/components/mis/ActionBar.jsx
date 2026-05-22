import { Save, Send, RotateCcw, Printer, FileSpreadsheet } from "lucide-react";

export default function ActionBar({ onSaveDraft, onSubmit, onReset, onExport, onPrint }) {
  return (
    <div className="gov-action-bar">
      <div className="gov-action-left">
        <button className="gov-btn gov-btn-ghost" onClick={onPrint}>
          <Printer size={15} /> Print
        </button>
        <button className="gov-btn gov-btn-ghost" onClick={onExport}>
          <FileSpreadsheet size={15} /> Export Excel
        </button>
      </div>
      <div className="gov-action-right">
        <button className="gov-btn gov-btn-reset" onClick={onReset}>
          <RotateCcw size={15} /> Reset
        </button>
        <button className="gov-btn gov-btn-draft" onClick={onSaveDraft}>
          <Save size={15} /> Save Draft
        </button>
        <button className="gov-btn gov-btn-submit" onClick={onSubmit}>
          <Send size={15} /> Submit
        </button>
      </div>
    </div>
  );
}
