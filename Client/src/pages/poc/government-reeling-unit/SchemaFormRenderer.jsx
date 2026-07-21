import clsx from 'clsx';

function getNestedValue(obj, path) {
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

function FieldInput({ name, register, errors, field, readOnly }) {
  const error = getNestedValue(errors, name);
  const baseClass = 'w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-emerald-primary/30';
  const inputClass = readOnly || field.computed
    ? `${baseClass} border-slate-200 bg-slate-50 text-slate-600`
    : `${baseClass} border-slate-300 bg-white`;

  if (field.type === 'select') {
    return (
      <div>
        <select
          {...register(name, { required: field.required })}
          className={inputClass}
          disabled={readOnly}
        >
          <option value="">Select {field.label}</option>
          {(field.options || []).map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        {error && <p className="mt-1 text-xs text-red-600">{error.message}</p>}
      </div>
    );
  }

  return (
    <div>
      <input
        type={field.type === 'number' ? 'number' : 'text'}
        step={field.type === 'number' ? 'any' : undefined}
        min={field.type === 'number' ? '0' : undefined}
        {...register(name, { required: field.required })}
        className={inputClass}
        readOnly={readOnly || field.computed}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error.message}</p>}
    </div>
  );
}

function FieldGridSection({ section, register, errors, watch }) {
  const values = watch(section.path.split('.')[0]) || {};
  const cols = section.columns || 3;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-emerald-secondary">{section.title}</h3>
      <div className={clsx('grid gap-4', cols === 1 ? 'grid-cols-1' : cols === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3')}>
        {section.fields.map((field) => {
          const fieldPath = `${section.path}.${field.key}`;
          const displayValue = field.computed
            ? getNestedValue(watch(), fieldPath)
            : undefined;

          return (
            <label key={field.key} className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                {field.label}
                {field.computed && <span className="ml-1 text-emerald-primary">(auto)</span>}
              </span>
              {field.computed ? (
                <input
                  type="text"
                  readOnly
                  value={displayValue ?? ''}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
                />
              ) : (
                <FieldInput
                  name={fieldPath}
                  register={register}
                  errors={errors}
                  field={{ ...field, type: field.type || 'number' }}
                />
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}

function MatrixSection({ section, register, errors }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-emerald-secondary">{section.title}</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-emerald-muted">
              <th className="border border-slate-200 px-3 py-2 text-left font-semibold text-emerald-secondary">Particulars</th>
              {section.columns.map((col) => (
                <th key={col.key} className="border border-slate-200 px-3 py-2 text-center font-semibold text-emerald-secondary">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {section.rows.map((row) => (
              <tr key={row.key}>
                <td className="border border-slate-200 px-3 py-2 font-medium text-slate-700">{row.label}</td>
                {section.columns.map((col) => {
                  const name = `${section.path}.${row.key}.${col.key}`;
                  const error = getNestedValue(errors, name);
                  return (
                    <td key={col.key} className="border border-slate-200 px-2 py-1">
                      {col.input !== false ? (
                        <input
                          type="number"
                          min="0"
                          step="any"
                          {...register(name)}
                          className="w-full rounded border border-slate-300 px-2 py-1 text-right text-sm"
                        />
                      ) : (
                        <span className="block px-2 py-1 text-right text-slate-600">—</span>
                      )}
                      {error && <p className="text-xs text-red-600">{error.message}</p>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StockParticularsSection({ section, register, errors, watch }) {
  const data = getNestedValue(watch(), section.path) || {};

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-emerald-secondary">{section.title}</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-emerald-muted">
              <th className="border border-slate-200 px-3 py-2 text-left">Item</th>
              {section.columns.map((col) => (
                <th key={col.key} className="border border-slate-200 px-3 py-2 text-center">{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {section.items.map((item) => (
              <tr key={item.key}>
                <td className="border border-slate-200 px-3 py-2 font-medium">{item.label}</td>
                {section.columns.map((col) => {
                  const name = `${section.path}.${item.key}.${col.key}`;
                  const value = data?.[item.key]?.[col.key] ?? '';
                  return (
                    <td key={col.key} className="border border-slate-200 px-2 py-1">
                      {col.readOnly ? (
                        <input
                          type="text"
                          readOnly
                          value={value}
                          className="w-full rounded border border-slate-200 bg-slate-50 px-2 py-1 text-right"
                        />
                      ) : (
                        <input
                          type="number"
                          min="0"
                          step="any"
                          {...register(name)}
                          className="w-full rounded border border-slate-300 px-2 py-1 text-right"
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReceiptsSection({ section, register }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-emerald-secondary">{section.title}</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-emerald-muted">
              <th className="border border-slate-200 px-3 py-2 text-left">Particulars</th>
              <th className="border border-slate-200 px-3 py-2 text-center">Value (Rs)</th>
              <th className="border border-slate-200 px-3 py-2 text-center">Cash</th>
            </tr>
          </thead>
          <tbody>
            {section.items.map((item) => (
              <tr key={item.key}>
                <td className="border border-slate-200 px-3 py-2">{item.label}</td>
                <td className="border border-slate-200 px-2 py-1">
                  <input type="number" min="0" step="any" {...register(`${section.path}.${item.key}.valueRs`)} className="w-full rounded border border-slate-300 px-2 py-1 text-right" />
                </td>
                <td className="border border-slate-200 px-2 py-1">
                  <input type="number" min="0" step="any" {...register(`${section.path}.${item.key}.cash`)} className="w-full rounded border border-slate-300 px-2 py-1 text-right" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SilkSalesSection({ section, register, watch }) {
  const data = getNestedValue(watch(), section.path) || {};

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-emerald-secondary">{section.title}</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-emerald-muted">
              <th className="border border-slate-200 px-3 py-2 text-left" rowSpan={2}>Particulars</th>
              <th className="border border-slate-200 px-3 py-2 text-center" colSpan={2}>D.M</th>
              <th className="border border-slate-200 px-3 py-2 text-center" colSpan={2}>U.M</th>
            </tr>
            <tr className="bg-emerald-muted">
              <th className="border border-slate-200 px-2 py-1 text-center">Qty</th>
              <th className="border border-slate-200 px-2 py-1 text-center">Value</th>
              <th className="border border-slate-200 px-2 py-1 text-center">Qty</th>
              <th className="border border-slate-200 px-2 py-1 text-center">Value</th>
            </tr>
          </thead>
          <tbody>
            {section.rows.map((row) => (
              <tr key={row.key}>
                <td className="border border-slate-200 px-3 py-2 font-medium">{row.label}</td>
                {['qtyDm', 'valueDm', 'qtyUm', 'valueUm'].map((fieldKey) => (
                  <td key={fieldKey} className="border border-slate-200 px-2 py-1">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      {...register(`${section.path}.${row.key}.${fieldKey}`)}
                      className="w-full rounded border border-slate-300 px-2 py-1 text-right"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CocoonStockSection({ section, register }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-emerald-secondary">{section.title}</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-emerald-muted">
              <th className="border border-slate-200 px-3 py-2 text-left" rowSpan={2}>Particulars</th>
              {section.columnGroups.map((group) => (
                <th key={group.label} className="border border-slate-200 px-3 py-2 text-center" colSpan={group.columns.length}>
                  {group.label}
                </th>
              ))}
            </tr>
            <tr className="bg-emerald-muted">
              {section.columnGroups.flatMap((group) =>
                group.columns.map((col) => (
                  <th key={`${group.label}-${col.key}`} className="border border-slate-200 px-2 py-1 text-center text-xs">
                    {col.label}
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            {section.rows.map((row) => (
              <tr key={row.key}>
                <td className="border border-slate-200 px-3 py-2 font-medium">{row.label}</td>
                {section.columnGroups.flatMap((group) =>
                  group.columns.map((col) => (
                    <td key={`${row.key}-${col.key}`} className="border border-slate-200 px-2 py-1">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        {...register(`${section.path}.${row.key}.${col.key}`)}
                        className="w-full min-w-[80px] rounded border border-slate-300 px-2 py-1 text-right"
                      />
                    </td>
                  ))
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SingleColumnSection({ section, register, watch }) {
  const data = getNestedValue(watch(), section.path) || {};

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-emerald-secondary">{section.title}</h3>
      <div className="space-y-2">
        {section.rows.map((row) => (
          <div key={row.key} className="flex items-center justify-between gap-4 rounded-lg border border-slate-100 px-3 py-2">
            <span className="text-sm font-medium text-slate-700">{row.label}</span>
            {row.computed || row.input === false ? (
              <input
                type="text"
                readOnly
                value={data[row.key] ?? ''}
                className="w-40 rounded border border-slate-200 bg-slate-50 px-3 py-1.5 text-right text-sm"
              />
            ) : (
              <input
                type="number"
                min="0"
                step="any"
                {...register(`${section.path}.${row.key}`)}
                className="w-40 rounded border border-slate-300 px-3 py-1.5 text-right text-sm"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AssessedActualSection({ section, register }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-emerald-secondary">{section.title}</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-emerald-muted">
              <th className="border border-slate-200 px-3 py-2 text-left">Particulars</th>
              <th className="border border-slate-200 px-3 py-2 text-center">Assessed</th>
              <th className="border border-slate-200 px-3 py-2 text-center">Actual</th>
            </tr>
          </thead>
          <tbody>
            {section.fields.map((field) => (
              <tr key={field.key}>
                <td className="border border-slate-200 px-3 py-2">{field.label}</td>
                <td className="border border-slate-200 px-2 py-1">
                  <input type="number" min="0" step="any" {...register(`${section.path}.${field.assessedKey}`)} className="w-full rounded border border-slate-300 px-2 py-1 text-right" />
                </td>
                <td className="border border-slate-200 px-2 py-1">
                  {field.key === 'rendita' ? (
                    <input type="text" readOnly {...register(`${section.path}.${field.actualKey}`)} className="w-full rounded border border-slate-200 bg-slate-50 px-2 py-1 text-right" />
                  ) : (
                    <input type="number" min="0" step="any" {...register(`${section.path}.${field.actualKey}`)} className="w-full rounded border border-slate-300 px-2 py-1 text-right" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StockKgsSection({ section, register, watch }) {
  const data = getNestedValue(watch(), section.path) || {};

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-emerald-secondary">{section.title}</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-emerald-muted">
              <th className="border border-slate-200 px-3 py-2 text-left">Item</th>
              {section.columns.map((col) => (
                <th key={col.key} className="border border-slate-200 px-3 py-2 text-center">{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {section.items.map((item) => (
              <tr key={item.key}>
                <td className="border border-slate-200 px-3 py-2 font-medium">{item.label}</td>
                {section.columns.map((col) => {
                  const name = `${section.path}.${item.key}.${col.key}`;
                  const value = data?.[item.key]?.[col.key] ?? '';
                  return (
                    <td key={col.key} className="border border-slate-200 px-2 py-1">
                      {col.readOnly ? (
                        <input type="text" readOnly value={value} className="w-full rounded border border-slate-200 bg-slate-50 px-2 py-1 text-right" />
                      ) : (
                        <input type="number" min="0" step="any" {...register(name)} className="w-full rounded border border-slate-300 px-2 py-1 text-right" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PeriodMatrixSection({ section, register, watch }) {
  const data = getNestedValue(watch(), section.path) || {};

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-emerald-secondary">{section.title}</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-emerald-muted">
              <th className="border border-slate-200 px-3 py-2 text-left">Particulars</th>
              {section.periods.map((period) => (
                <th key={period.key} className="border border-slate-200 px-3 py-2 text-center">{period.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {section.rows.map((row) => (
              <tr key={row.key}>
                <td className="border border-slate-200 px-3 py-2 font-medium">{row.label}</td>
                {section.periods.map((period) => {
                  const name = `${section.path}.${row.key}.${period.key}`;
                  const value = data?.[row.key]?.[period.key] ?? '';
                  return (
                    <td key={period.key} className="border border-slate-200 px-2 py-1">
                      {row.computed ? (
                        <input type="text" readOnly value={value} className="w-full rounded border border-slate-200 bg-slate-50 px-2 py-1 text-right" />
                      ) : (
                        <input type="number" min="0" step="any" {...register(name)} className="w-full rounded border border-slate-300 px-2 py-1 text-right" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ActualReceiptsSection({ section, register, watch }) {
  const data = getNestedValue(watch(), section.path) || {};

  const renderQtyValueTable = (title, rows, basePath) => (
    <div className="mb-4">
      <h4 className="mb-2 text-sm font-semibold text-slate-700">{title}</h4>
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr className="bg-slate-50">
            <th className="border border-slate-200 px-3 py-2 text-left">Period</th>
            <th className="border border-slate-200 px-3 py-2 text-center">Qty</th>
            <th className="border border-slate-200 px-3 py-2 text-center">Value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <td className="border border-slate-200 px-3 py-2">{row.label}</td>
              <td className="border border-slate-200 px-2 py-1">
                {row.computed ? (
                  <input type="text" readOnly value={getNestedValue(data, `${basePath}.${row.key}.qty`) ?? ''} className="w-full rounded border border-slate-200 bg-slate-50 px-2 py-1 text-right" />
                ) : (
                  <input type="number" min="0" step="any" {...register(`${section.path}.${basePath}.${row.key}.qty`)} className="w-full rounded border border-slate-300 px-2 py-1 text-right" />
                )}
              </td>
              <td className="border border-slate-200 px-2 py-1">
                {row.computed ? (
                  <input type="text" readOnly value={getNestedValue(data, `${basePath}.${row.key}.value`) ?? ''} className="w-full rounded border border-slate-200 bg-slate-50 px-2 py-1 text-right" />
                ) : (
                  <input type="number" min="0" step="any" {...register(`${section.path}.${basePath}.${row.key}.value`)} className="w-full rounded border border-slate-300 px-2 py-1 text-right" />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-emerald-secondary">{section.title}</h3>
      {renderQtyValueTable('Silk Sold', section.silkRows, 'silkSold')}
      {renderQtyValueTable('Bye Products Sold', section.byeRows, 'byeProductsSold')}
      <div>
        <h4 className="mb-2 text-sm font-semibold text-slate-700">Amount Pending with Exchange / Sales Centre</h4>
        <div className="space-y-2">
          {section.pendingRows.map((row) => (
            <div key={row.key} className="flex items-center justify-between gap-4 rounded-lg border border-slate-100 px-3 py-2">
              <span className="text-sm">{row.label}</span>
              <input type="number" min="0" step="any" {...register(`${section.path}.pendingWithExchange.${row.key}`)} className="w-40 rounded border border-slate-300 px-3 py-1.5 text-right text-sm" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProfitLossSection({ watch }) {
  const profitLoss = watch('tab3.profitLoss') || {};

  const cards = [
    {
      label: 'D.M Profit / Loss',
      value: profitLoss.dm,
      isProfit: profitLoss.dmIsProfit,
      formula: 'Total NSC Expenditure − Estimated Total Sale Value (D.M)',
    },
    {
      label: 'U.M Profit / Loss',
      value: profitLoss.um,
      isProfit: profitLoss.umIsProfit,
      formula: 'Total NSC Expenditure − (Silk Sold + Bye Products + Pending)',
    },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-emerald-secondary">Profit / Loss</h3>
      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((card) => (
          <div
            key={card.label}
            className={clsx(
              'rounded-xl border-2 p-4',
              card.isProfit ? 'border-emerald-400 bg-emerald-50' : 'border-red-400 bg-red-50'
            )}
          >
            <p className="text-xs uppercase tracking-wide text-slate-500">{card.label}</p>
            <p className={clsx('mt-2 text-2xl font-bold', card.isProfit ? 'text-emerald-700' : 'text-red-700')}>
              {card.isProfit ? 'Profit' : 'Loss'}: Rs {Math.abs(Number(card.value) || 0)}
            </p>
            <p className="mt-2 text-xs text-slate-500">{card.formula}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReceiptsWithTotalSection({ section, register, watch }) {
  const data = getNestedValue(watch(), section.path) || {};
  const items = section.items.filter((item) => !item.computed);
  const totalValue = items.reduce((acc, item) => acc + (Number(data[item.key]?.valueRs) || 0), 0);
  const totalCash = items.reduce((acc, item) => acc + (Number(data[item.key]?.cash) || 0), 0);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-emerald-secondary">{section.title}</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-emerald-muted">
              <th className="border border-slate-200 px-3 py-2 text-left">Particulars</th>
              <th className="border border-slate-200 px-3 py-2 text-center">Value (Rs)</th>
              <th className="border border-slate-200 px-3 py-2 text-center">Cash</th>
            </tr>
          </thead>
          <tbody>
            {section.items.map((item) => (
              <tr key={item.key} className={item.computed ? 'bg-amber-50 font-semibold' : ''}>
                <td className="border border-slate-200 px-3 py-2">{item.label}</td>
                <td className="border border-slate-200 px-2 py-1">
                  {item.computed ? (
                    <input type="text" readOnly value={totalValue} className="w-full rounded border border-slate-200 bg-slate-50 px-2 py-1 text-right" />
                  ) : (
                    <input type="number" min="0" step="any" {...register(`${section.path}.${item.key}.valueRs`)} className="w-full rounded border border-slate-300 px-2 py-1 text-right" />
                  )}
                </td>
                <td className="border border-slate-200 px-2 py-1">
                  {item.computed ? (
                    <input type="text" readOnly value={totalCash} className="w-full rounded border border-slate-200 bg-slate-50 px-2 py-1 text-right" />
                  ) : (
                    <input type="number" min="0" step="any" {...register(`${section.path}.${item.key}.cash`)} className="w-full rounded border border-slate-300 px-2 py-1 text-right" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PeriodRowMatrixSection({ section, register, watch }) {
  const data = getNestedValue(watch(), section.path) || {};

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-emerald-secondary">{section.title}</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-emerald-muted">
              <th className="border border-slate-200 px-3 py-2 text-left">Particulars</th>
              {section.periods.map((period) => (
                <th key={period.key} className="border border-slate-200 px-3 py-2 text-center">{period.label}</th>
              ))}
              {section.extraColumn && (
                <th className="border border-slate-200 px-3 py-2 text-center">{section.extraColumn.label}</th>
              )}
            </tr>
          </thead>
          <tbody>
            {section.rows.map((row) => (
              <tr key={row.key} className={row.computed ? 'bg-slate-50' : ''}>
                <td className="border border-slate-200 px-3 py-2 font-medium">{row.label}</td>
                {section.periods.map((period) => {
                  const name = `${section.path}.${row.key}.${period.key}`;
                  const value = data?.[row.key]?.[period.key] ?? '';
                  return (
                    <td key={period.key} className="border border-slate-200 px-2 py-1">
                      {row.computed || row.readOnly ? (
                        <input type="text" readOnly value={value} className="w-full rounded border border-slate-200 bg-slate-50 px-2 py-1 text-right" />
                      ) : (
                        <input type="number" min="0" step="any" {...register(name)} className="w-full rounded border border-slate-300 px-2 py-1 text-right" />
                      )}
                    </td>
                  );
                })}
                {section.extraColumn && (
                  <td className="border border-slate-200 px-2 py-1">
                    {row.key === section.extraColumn.rowKey ? (
                      <input type="text" {...register(`${section.path}.${row.key}.${section.extraColumn.key}`)} className="w-full rounded border border-slate-300 px-2 py-1 text-sm" />
                    ) : (
                      <span className="block px-2 py-1 text-center text-slate-400">—</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function WarpWeftPeriodSection({ section, register, watch }) {
  const data = getNestedValue(watch(), section.path) || {};

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-emerald-secondary">{section.title}</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-xs">
          <thead>
            <tr className="bg-emerald-muted">
              <th className="border border-slate-200 px-2 py-2 text-left" rowSpan={2}>Particulars</th>
              {section.periods.map((period) => (
                <th key={period.key} className="border border-slate-200 px-2 py-2 text-center" colSpan={2}>{period.label}</th>
              ))}
            </tr>
            <tr className="bg-emerald-muted">
              {section.periods.flatMap((period) => [
                <th key={`${period.key}-warp`} className="border border-slate-200 px-1 py-1 text-center">Warp</th>,
                <th key={`${period.key}-weft`} className="border border-slate-200 px-1 py-1 text-center">Weft</th>,
              ])}
            </tr>
          </thead>
          <tbody>
            {section.rows.map((row) => (
              <tr key={row.key}>
                <td className="border border-slate-200 px-2 py-1 font-medium">{row.label}</td>
                {section.periods.flatMap((period) => {
                  const warpName = `${section.path}.${row.key}.${period.key}.warp`;
                  const weftName = `${section.path}.${row.key}.${period.key}.weft`;
                  const warpVal = data?.[row.key]?.[period.key]?.warp ?? '';
                  const weftVal = data?.[row.key]?.[period.key]?.weft ?? '';
                  const readOnly = row.computed || row.readOnly;
                  return [
                    <td key={`${row.key}-${period.key}-warp`} className="border border-slate-200 px-1 py-1">
                      {readOnly ? (
                        <input type="text" readOnly value={warpVal} className="w-full rounded border border-slate-200 bg-slate-50 px-1 py-1 text-right" />
                      ) : (
                        <input type="number" min="0" step="any" {...register(warpName)} className="w-full rounded border border-slate-300 px-1 py-1 text-right" />
                      )}
                    </td>,
                    <td key={`${row.key}-${period.key}-weft`} className="border border-slate-200 px-1 py-1">
                      {readOnly ? (
                        <input type="text" readOnly value={weftVal} className="w-full rounded border border-slate-200 bg-slate-50 px-1 py-1 text-right" />
                      ) : (
                        <input type="number" min="0" step="any" {...register(weftName)} className="w-full rounded border border-slate-300 px-1 py-1 text-right" />
                      )}
                    </td>,
                  ];
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NscExpenditurePeriodSection({ section, register, watch }) {
  const data = getNestedValue(watch(), section.path) || {};

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-emerald-secondary">{section.title}</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-emerald-muted">
              <th className="border border-slate-200 px-3 py-2 text-left">Particulars</th>
              <th className="border border-slate-200 px-3 py-2 text-center">During Month (Rs)</th>
              <th className="border border-slate-200 px-3 py-2 text-center">Upto Month (Rs)</th>
            </tr>
          </thead>
          <tbody>
            {section.rows.map((row) => (
              <tr key={row.key} className={row.computed ? 'bg-amber-50 font-semibold' : ''}>
                <td className="border border-slate-200 px-3 py-2">{row.label}</td>
                <td className="border border-slate-200 px-2 py-1">
                  {row.computed ? (
                    <input type="text" readOnly value={data[row.key]?.duringMonth ?? ''} className="w-full rounded border border-slate-200 bg-slate-50 px-2 py-1 text-right" />
                  ) : (
                    <input type="number" min="0" step="any" {...register(`${section.path}.${row.key}.duringMonth`)} className="w-full rounded border border-slate-300 px-2 py-1 text-right" />
                  )}
                </td>
                <td className="border border-slate-200 px-2 py-1">
                  {row.computed ? (
                    <input type="text" readOnly value={data[row.key]?.uptoMonth ?? ''} className="w-full rounded border border-slate-200 bg-slate-50 px-2 py-1 text-right" />
                  ) : (
                    <input type="number" min="0" step="any" {...register(`${section.path}.${row.key}.uptoMonth`)} className="w-full rounded border border-slate-300 px-2 py-1 text-right" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TwistingActualReceiptsSection({ section, register, watch }) {
  const data = getNestedValue(watch(), section.path) || {};

  const renderAmountRows = (title, rows, basePath) => (
    <div className="mb-4">
      <h4 className="mb-2 text-sm font-semibold text-slate-700">{title}</h4>
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr className="bg-slate-50">
            <th className="border border-slate-200 px-3 py-2 text-left">Particulars</th>
            <th className="border border-slate-200 px-3 py-2 text-center">Amount (Rs)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className={row.computed ? 'bg-amber-50 font-semibold' : ''}>
              <td className="border border-slate-200 px-3 py-2">{row.label}</td>
              <td className="border border-slate-200 px-2 py-1">
                {row.computed ? (
                  <input type="text" readOnly value={getNestedValue(data, `${basePath}.${row.key}`) ?? ''} className="w-full rounded border border-slate-200 bg-slate-50 px-2 py-1 text-right" />
                ) : (
                  <input type="number" min="0" step="any" {...register(`${section.path}.${basePath}.${row.key}`)} className="w-full rounded border border-slate-300 px-2 py-1 text-right" />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-emerald-secondary">{section.title}</h3>
      {renderAmountRows('Ready Silk Sold', section.readySilkRows, 'readySilkSold')}
      {renderAmountRows('Throwster Twisted Waste Sold', section.wasteRows, 'twistedWasteSold')}
      {renderAmountRows('Pending with Tansilk', section.pendingReadyRows, 'pendingReadySilk')}
      {renderAmountRows('Pending — Throwster Twisted Waste', section.pendingWasteRows, 'pendingTwistedWaste')}
      <div className="mt-4">
        <h4 className="mb-2 text-sm font-semibold text-slate-700">Present Ready Silk Rate/Kg</h4>
        <div className="grid gap-3 md:grid-cols-2">
          {section.rateFields.map((field) => (
            <label key={field.key} className="block">
              <span className="mb-1 block text-xs text-slate-500">{field.label}</span>
              <input type="number" min="0" step="any" {...register(`${section.path}.presentRates.${field.key}`)} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProfitLossSingleSection({ section, watch }) {
  const profitLoss = getNestedValue(watch(), section.path) || {};

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-emerald-secondary">{section.title || 'Profit / Loss'}</h3>
      <div
        className={clsx(
          'rounded-xl border-2 p-6 max-w-lg',
          profitLoss.isProfit ? 'border-emerald-400 bg-emerald-50' : 'border-red-400 bg-red-50'
        )}
      >
        <p className="text-xs uppercase tracking-wide text-slate-500">Net Result</p>
        <p className={clsx('mt-2 text-3xl font-bold', profitLoss.isProfit ? 'text-emerald-700' : 'text-red-700')}>
          {profitLoss.isProfit ? 'Profit' : 'Loss'}: Rs {Math.abs(Number(profitLoss.amount) || 0)}
        </p>
        <p className="mt-2 text-xs text-slate-500">
          {section.formula || 'Total Actual Receipts − Net NSC Expenditure'}
        </p>
      </div>
    </div>
  );
}

const SECTION_RENDERERS = {
  fieldGrid: FieldGridSection,
  matrix: MatrixSection,
  stockParticulars: StockParticularsSection,
  receipts: ReceiptsSection,
  receiptsWithTotal: ReceiptsWithTotalSection,
  silkSales: SilkSalesSection,
  cocoonStock: CocoonStockSection,
  singleColumn: SingleColumnSection,
  assessedActual: AssessedActualSection,
  stockKgs: StockKgsSection,
  periodMatrix: PeriodMatrixSection,
  periodRowMatrix: PeriodRowMatrixSection,
  warpWeftPeriod: WarpWeftPeriodSection,
  nscExpenditurePeriod: NscExpenditurePeriodSection,
  twistingActualReceipts: TwistingActualReceiptsSection,
  actualReceipts: ActualReceiptsSection,
  profitLoss: ProfitLossSection,
  profitLossSingle: ProfitLossSingleSection,
};

export function SchemaSectionRenderer({ section, register, errors, watch }) {
  const Renderer = SECTION_RENDERERS[section.type];
  if (!Renderer) return null;
  return <Renderer section={section} register={register} errors={errors} watch={watch} />;
}

export function SharedHeaderRenderer({
  section,
  register,
  errors,
  reportTitle = 'Government Silk Reeling Unit Monthly Report',
  formCode = 'PDL MIS-37',
}) {
  return (
    <div className="sticky top-0 z-10 rounded-xl border border-emerald-primary/20 bg-white/95 p-4 shadow-md backdrop-blur">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-emerald-secondary">{reportTitle}</h2>
        <span className="rounded-full bg-gold-muted px-3 py-1 text-xs font-semibold text-emerald-secondary">{formCode}</span>
      </div>
      <FieldGridSection section={section} register={register} errors={errors} watch={() => ({})} />
    </div>
  );
}
