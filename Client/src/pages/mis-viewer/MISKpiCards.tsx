import type { AcreFarmer, DflsBlock } from '../../types/misReport';

function fmtPair(v: AcreFarmer | undefined) {
  if (!v) return '—';
  return `${v.acre?.toLocaleString() ?? 0} / ${v.farmer?.toLocaleString() ?? 0}`;
}

function fmtDfls(v: DflsBlock | undefined) {
  if (!v) return '—';
  if (v.grandTotal != null) return v.grandTotal.toLocaleString();
  const bv = Object.values(v.bv || {}).reduce((a, b) => a + (Number(b) || 0), 0);
  const cb = Object.values(v.cb || {}).reduce((a, b) => a + (Number(b) || 0), 0);
  return (bv + cb + (v.p1?.value || 0)).toLocaleString();
}

interface Props {
  sheetType: string;
  kpis: { ulm: unknown; dm: unknown; um: unknown } | null;
  unit: string;
}

export default function MISKpiCards({ sheetType, kpis, unit }: Props) {
  const isPlantation = sheetType === 'plantation-overall' || sheetType === 'plantation-scheme';

  const cards = [
    { key: 'ulm', label: 'Total ULM', bg: 'bg-[#E6F1FB]', text: 'text-[#0C447C]', hint: 'Read only (carry forward)' },
    { key: 'dm', label: 'Total DM', bg: 'bg-[#EAF3DE]', text: 'text-[#27500A]', hint: 'During month entry' },
    { key: 'um', label: 'Total UM', bg: 'bg-[#EEEDFE]', text: 'text-[#3C3489]', hint: 'Auto calculated (ULM + DM)' },
  ] as const;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((card) => {
        const value = kpis?.[card.key];
        const display = isPlantation
          ? fmtPair(value as AcreFarmer)
          : fmtDfls(value as DflsBlock);

        return (
          <div key={card.key} className={`rounded-xl border border-slate-200 ${card.bg} p-4 shadow-sm`}>
            <p className={`text-xs font-bold uppercase tracking-wide ${card.text}`}>{card.label}</p>
            <p className={`mt-2 text-2xl font-bold ${card.text}`}>{display}</p>
            <p className="mt-1 text-xs text-slate-600">{unit} · {card.hint}</p>
          </div>
        );
      })}
    </div>
  );
}
