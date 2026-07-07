import { Leaf, Printer, FileSpreadsheet, RotateCcw } from 'lucide-react';

interface Props {
  onPrint: () => void;
  onExport: () => void;
  onRollover?: () => void;
  showRollover?: boolean;
  exporting?: boolean;
}

export default function MISViewerNav({ onPrint, onExport, onRollover, showRollover, exporting }: Props) {
  return (
    <header className="mis-viewer-no-print sticky top-0 z-40 bg-[#1a3d2b] text-white shadow-lg">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
            <Leaf size={22} className="text-[#c8e6c9]" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-wide text-[#c8e6c9]">Silk Samagra MIS</p>
            <h1 className="text-lg font-bold leading-tight sm:text-xl">
              Sericulture Department, Tamil Nadu
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {showRollover && (
            <button
              type="button"
              onClick={onRollover}
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium hover:bg-white/20"
            >
              <RotateCcw size={16} />
              Monthly Rollover
            </button>
          )}
          <button
            type="button"
            onClick={onPrint}
            className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium hover:bg-white/20"
          >
            <Printer size={16} />
            Print
          </button>
          <button
            type="button"
            onClick={onExport}
            disabled={exporting}
            className="inline-flex items-center gap-2 rounded-lg bg-[#c8e6c9] px-3 py-2 text-sm font-semibold text-[#1a3d2b] hover:bg-[#a5d6a7] disabled:opacity-60"
          >
            <FileSpreadsheet size={16} />
            {exporting ? 'Exporting…' : 'Export Excel'}
          </button>
        </div>
      </div>
    </header>
  );
}
