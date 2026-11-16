import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle, ArrowRight, CalendarDays, CheckCircle2, ChevronDown,
  ChevronRight, GitCompare, Globe2, Info, Layers, Loader2,
  RefreshCw, SlidersHorizontal, X,
} from 'lucide-react';

const METRICS = {
  CALLS_WOW: [
    ['callsOffered', 'Offered'],
    ['callsHandled', 'Handled'],
    ['serviceLevelPct', 'Service Level'],
    ['ahtSeconds', 'Documented AHT'],
  ],
  CHAT_WOW: [
    ['chatsReceived', 'Chats Received'],
    ['chatsAnswered', 'Chats Answered'],
    ['slaPct', 'Chat SLA'],
    ['ahtSeconds', 'Average AHT'],
  ],
};
const QUALITY_HIGHER_IS_BETTER = new Set(['serviceLevelPct', 'answerRatePct', 'slaPct']);
const QUALITY_LOWER_IS_BETTER = new Set(['ahtSeconds', 'callsAbandoned', 'chatsAbandoned', 'noResponse']);

const numberText = (value) => Number(value).toLocaleString('en-US', {
  maximumFractionDigits: 2,
});
const isChanged = (metric) => metric?.delta != null && Number.isFinite(Number(metric.delta)) &&
  Math.abs(Number(metric.delta)) > 0.000001;

function formatMetric(value, metric) {
  if (metric?.unavailableReason) return 'N/A';
  if (value == null || !Number.isFinite(Number(value))) return '—';
  const suffix = metric?.unit === 'percentage_points' ? '%' : metric?.unit === 'seconds' ? 's' : '';
  return `${numberText(value)}${suffix}`;
}
function formatDifference(metric) {
  if (metric?.unavailableReason) return 'N/A';
  if (metric?.delta == null || !Number.isFinite(Number(metric.delta))) return '—';
  const delta = Number(metric.delta);
  const prefix = delta > 0 ? '+' : delta < 0 ? '−' : '';
  const suffix = metric.unit === 'percentage_points' ? ' pp' : metric.unit === 'seconds' ? 's' : '';
  return `${prefix}${numberText(Math.abs(delta))}${suffix}`;
}
function changeTone(key, metric) {
  if (!isChanged(metric)) return 'text-slate-500';
  const favorable = QUALITY_HIGHER_IS_BETTER.has(key) ? metric.delta > 0 :
    QUALITY_LOWER_IS_BETTER.has(key) ? metric.delta < 0 : null;
  return favorable === true ? 'text-emerald-700' : favorable === false ? 'text-rose-700' : 'text-slate-700';
}
function readableList(items) {
  if (Array.isArray(items)) return items.length ? items.join(', ') : 'All';
  if (items == null || String(items).trim() === '') return 'All';
  return String(items);
}
function movementLabel(type) {
  if (type === 'TRANSFERRED') return 'Transferred';
  if (type === 'ADDED') return 'Added';
  if (type === 'REMOVED') return 'Removed';
  return 'Changed';
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[#052e53]">
        <Icon size={17} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <div className="text-xl font-extrabold tabular-nums leading-none text-[#052e53] sm:text-2xl">{value}</div>
        <div className="mt-1.5 text-[11px] font-medium leading-tight text-slate-500">{label}</div>
      </div>
    </div>
  );
}

/** A portal keeps comparison results out of the report's clipped/scrolling filter container. */
export default function TaskOrderVersionComparisonModal({
  onClose, onRefresh, loading, error, result, canRefresh,
  baseLabel, targetLabel, reportType, periodLabel, reportDates,
  sourceSystem, taskOrder, country, skill,
}) {
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const [showChangedOnly, setShowChangedOnly] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState({});

  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeRef.current?.();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = [...(dialogRef.current?.querySelectorAll(
        'a[href], button:not([disabled]), select:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) || [])].filter((element) => element.getClientRects().length > 0);
      if (!focusable.length) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialogRef.current?.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialogRef.current?.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected && typeof previousFocus.focus === 'function') previousFocus.focus();
    };
  }, []);

  const rows = result?.rows || [];
  const metrics = METRICS[reportType] || METRICS.CALLS_WOW;
  const allGroups = rows.map((row) => {
    const entries = metrics.map(([key, title]) => ({ key, title, value: row.delta?.[key] || null }));
    const changedEntries = entries.filter((entry) => isChanged(entry.value));
    return { taskOrder: row.taskOrder, entries, changedEntries };
  });
  const visibleGroups = showChangedOnly
    ? allGroups.filter((group) => group.changedEntries.length)
    : allGroups;
  const changedMetricCount = allGroups.reduce((total, group) => total + group.changedEntries.length, 0);
  const affectedOrderCount = allGroups.filter((group) => group.changedEntries.length).length;
  const movements = result?.countryMovements || [];
  const sourceMovements = result?.sourceMovements || [];
  const identicalSelection = result && String(result.baseVersion?.id) === String(result.targetVersion?.id);
  const noKpiChanges = Boolean(result && changedMetricCount === 0);
  const unavailableMetrics = result?.unavailableMetrics || [];
  const generatedAt = result?.dataAsOf?.generatedAt;
  const displayedBase = result?.baseVersion?.label || baseLabel;
  const displayedTarget = result?.targetVersion?.label || targetLabel;
  const dateText = result?.filters?.dateFrom && result?.filters?.dateTo
    ? `${result.filters.dateFrom} – ${result.filters.dateTo}`
    : reportDates;

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 p-0 backdrop-blur-[2px] sm:p-4"
      onMouseDown={(event) => { if (event.currentTarget === event.target) closeRef.current?.(); }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-order-comparison-heading"
        aria-describedby="task-order-comparison-description"
        tabIndex={-1}
        className="flex h-[100dvh] max-h-[100dvh] w-full min-w-0 flex-col overflow-hidden bg-[#f5f8fb] text-slate-700 shadow-2xl sm:h-[90dvh] sm:max-h-[94dvh] sm:w-[94vw] sm:max-w-[1480px] sm:rounded-2xl"
      >
        <header className="flex shrink-0 items-center justify-between gap-3 bg-[#052e53] px-4 py-4 text-white sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 sm:flex">
              <GitCompare size={20} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 id="task-order-comparison-heading" className="text-sm font-extrabold sm:text-lg">
                Task Order Version Comparison
              </h2>
              <p id="task-order-comparison-description" className="mt-1 truncate text-[11px] text-blue-100 sm:text-xs">
                {displayedBase} <span aria-hidden="true">→</span> {displayedTarget}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              disabled={!canRefresh || loading}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/25 bg-white/10 px-2.5 text-[11px] font-bold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50 sm:px-3 sm:text-xs"
            >
              {loading ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <RefreshCw size={14} aria-hidden="true" />}
              <span className="hidden sm:inline">Regenerate</span>
              <span className="sm:hidden">Refresh</span>
            </button>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              aria-label="Close version comparison"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/25 bg-white/10 text-white transition hover:bg-white/20"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="sibs-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto p-3.5 sm:space-y-5 sm:p-6">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3.5">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
              <span className="inline-flex items-center gap-2 font-bold text-[#052e53]">
                <CalendarDays size={15} aria-hidden="true" /> {periodLabel} · {dateText}
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-500">
                <SlidersHorizontal size={14} aria-hidden="true" /> Inherited from active report filters
              </span>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-x-4 gap-y-1.5 border-t border-slate-100 pt-3 text-[11px] sm:grid-cols-2 xl:grid-cols-4">
              {[
                ['Source system', ['US_VISA','US VISA','ALL'].includes(String(sourceSystem || '').toUpperCase()) ? 'US Visa (All Sources)' : sourceSystem],
                ['Task Order', taskOrder],
                ['Country', country],
                ['Skill', skill],
              ].map(([label, value]) => (
                <p key={label} className="min-w-0 break-words text-slate-500">
                  <span className="font-bold text-slate-600">{label}:</span> {readableList(value)}
                </p>
              ))}
            </div>
          </div>

          {loading && (
            <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-5 text-center" role="status" aria-live="polite">
              <Loader2 className="animate-spin text-[#052e53]" size={30} aria-hidden="true" />
              <p className="text-sm font-bold text-[#052e53]">Comparing published mappings</p>
              <p className="max-w-md text-xs text-slate-500">Using the same report dates and operational data for both versions.</p>
            </div>
          )}

          {!loading && error && (
            <div className="rounded-xl border border-rose-200 bg-white p-4" role="alert">
              <p className="flex items-center gap-2 text-sm font-bold text-rose-700"><AlertTriangle size={17} aria-hidden="true" /> Comparison unavailable</p>
              <p className="mt-2 text-xs text-slate-600">{error}</p>
              <button type="button" disabled={!canRefresh} onClick={onRefresh} className="mt-4 rounded-lg bg-[#052e53] px-4 py-2 text-xs font-bold text-white disabled:opacity-50">Try again</button>
            </div>
          )}

          {!loading && !error && !result && (
            <div className="flex min-h-44 flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-6 text-center" role="status">
              <Info size={24} className="text-slate-400" aria-hidden="true" />
              <p className="text-sm font-bold text-[#052e53]">Comparison needs to be refreshed</p>
              <p className="max-w-lg text-xs text-slate-500">The selected report filters or versions changed. Regenerate to view results for the current selection.</p>
            </div>
          )}

          {!loading && result && (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Stat icon={Globe2} label="Country ownership changes" value={movements.length} />
                <Stat icon={Layers} label="Task Orders with KPI changes" value={affectedOrderCount} />
                <Stat icon={GitCompare} label="Changed KPI metrics" value={changedMetricCount} />
              </div>

              {(identicalSelection || (!movements.length && !sourceMovements.length && noKpiChanges && result?.identical)) && (
                <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4" role="status">
                  <CheckCircle2 size={21} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-bold text-[#052e53]">
                      {identicalSelection ? 'Both selections resolve to the same published version' : 'No mapping or KPI differences detected'}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                      {identicalSelection
                        ? 'Select a different target or base version in the report filters to examine ownership changes.'
                        : 'The selected mappings produce identical country ownership and supported KPI results for this reporting period.'}
                    </p>
                  </div>
                </div>
              )}

              <section aria-labelledby="country-movements-title" className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3.5 sm:px-5">
                  <div>
                    <h3 id="country-movements-title" className="text-sm font-extrabold text-[#052e53]">Country Ownership Changes</h3>
                    <p className="mt-0.5 text-[11px] text-slate-500">Across published mappings; KPI impact below follows the report filters</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                    {movements.length} {movements.length === 1 ? 'change' : 'changes'}
                  </span>
                </div>
                {movements.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] border-collapse text-xs">
                      <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                        <tr>
                          <th scope="col" className="px-5 py-3 text-left font-bold">Country</th>
                          <th scope="col" className="px-5 py-3 text-left font-bold">Base mapping</th>
                          <th scope="col" className="px-5 py-3 text-center font-bold">Change</th>
                          <th scope="col" className="px-5 py-3 text-left font-bold">Target mapping</th>
                        </tr>
                      </thead>
                      <tbody>
                        {movements.map((movement, index) => (
                          <tr key={`${movement.countryKey || movement.country || index}`} className="border-t border-slate-100">
                            <td className="px-5 py-3 font-bold text-[#052e53]">{movement.country || movement.countryKey || 'Unknown'}</td>
                            <td className="px-5 py-3">{movement.previousTaskOrder || 'Unmapped'}</td>
                            <td className="px-5 py-3 text-center">
                              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">
                                <ArrowRight size={12} aria-hidden="true" />{movementLabel(movement.changeType)}
                              </span>
                            </td>
                            <td className="px-5 py-3 font-semibold text-[#052e53]">{movement.newTaskOrder || 'Unmapped'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="px-5 py-5 text-xs text-slate-500">No country ownership changes between the selected mappings.</div>
                )}
              </section>

              {sourceMovements.length > 0 && <section aria-labelledby="source-movements-title" className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="border-b border-slate-100 px-5 py-3.5"><h3 id="source-movements-title" className="text-sm font-extrabold text-[#052e53]">Source System Changes ({sourceMovements.length})</h3></div>
                <div className="space-y-2 px-5 py-4 text-xs">{sourceMovements.map((move) => <div key={move.profileId} className="rounded-lg bg-slate-50 p-3"><strong>{move.taskOrder}</strong>: {move.previousSource} → {move.newSource}</div>)}</div>
              </section>}
              <section aria-labelledby="kpi-impact-title" className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3.5 sm:px-5">
                  <div>
                    <h3 id="kpi-impact-title" className="text-sm font-extrabold text-[#052e53]">KPI Impact by Task Order</h3>
                    <p className="mt-0.5 text-[11px] text-slate-500">Same operational period; different country ownership mappings</p>
                  </div>
                  <label className="flex cursor-pointer items-center gap-2 text-[11px] font-semibold text-slate-600">
                    <input
                      type="checkbox"
                      checked={showChangedOnly}
                      onChange={(event) => setShowChangedOnly(event.target.checked)}
                      className="h-4 w-4 accent-[#052e53]"
                    />
                    Show changed only
                  </label>
                </div>
                {unavailableMetrics.length > 0 && (
                  <div className="flex items-start gap-2 border-b border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-900 sm:px-5" role="note">
                    <Info size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
                    <div>
                      <strong>Partial KPI comparison.</strong> {unavailableMetrics.map((entry) => entry.reason).join(' ')}
                      {' '}Affected metrics are shown as N/A when “Show changed only” is off; verified metrics remain comparable.
                    </div>
                  </div>
                )}
                {!visibleGroups.length ? (
                  <div className="flex items-start gap-2 px-5 py-5 text-xs text-slate-500">
                    <Info size={16} className="shrink-0" aria-hidden="true" />
                    <p>
                      {noKpiChanges
                        ? `There are no differences among the comparable KPIs in this reporting period.${unavailableMetrics.length ? ' Some metrics are unavailable for the selected filters.' : ''} Turn off “Show changed only” to inspect the available Task Orders and metrics.`
                        : 'No Task Orders match the current display filter.'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {visibleGroups.map((group, index) => {
                      const expanded = expandedOrders[group.taskOrder] ?? index === 0;
                      const shownEntries = showChangedOnly ? group.changedEntries : group.entries;
                      return (
                        <div key={group.taskOrder}>
                          <button
                            type="button"
                            onClick={() => setExpandedOrders((previous) => ({ ...previous, [group.taskOrder]: !expanded }))}
                            aria-expanded={expanded}
                            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-slate-50 sm:px-5"
                          >
                            <span className="flex min-w-0 items-center gap-2">
                              {expanded ? <ChevronDown size={16} className="shrink-0 text-slate-400" aria-hidden="true" /> : <ChevronRight size={16} className="shrink-0 text-slate-400" aria-hidden="true" />}
                              <span className="font-extrabold text-[#052e53]">{group.taskOrder}</span>
                              <span className="text-[11px] text-slate-500">{group.changedEntries.length} changed {group.changedEntries.length === 1 ? 'metric' : 'metrics'}</span>
                            </span>
                            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${group.changedEntries.length ? 'bg-amber-50 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
                              {group.changedEntries.length ? 'Changed' : 'Unchanged'}
                            </span>
                          </button>
                          {expanded && (
                            <div className="overflow-x-auto border-t border-slate-100">
                              <table className="w-full min-w-[570px] border-collapse text-xs">
                                <thead className="bg-slate-50 text-[11px] text-slate-500">
                                  <tr>
                                    <th scope="col" className="w-[36%] px-5 py-2.5 text-left font-bold">Metric</th>
                                    <th scope="col" className="px-5 py-2.5 text-right font-bold">Base</th>
                                    <th scope="col" className="px-5 py-2.5 text-right font-bold">Target</th>
                                    <th scope="col" className="px-5 py-2.5 text-right font-bold">Difference</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {shownEntries.map((entry) => (
                                    <tr key={entry.key} title={entry.value?.unavailableReason || undefined} className="border-t border-slate-100 first:border-t-0">
                                      <th scope="row" className="px-5 py-2.5 text-left font-medium text-slate-700">{entry.title}</th>
                                      <td className="px-5 py-2.5 text-right tabular-nums text-slate-600">{formatMetric(entry.value?.base, entry.value)}</td>
                                      <td className="px-5 py-2.5 text-right tabular-nums text-slate-600">{formatMetric(entry.value?.target, entry.value)}</td>
                                      <td className={`px-5 py-2.5 text-right font-extrabold tabular-nums ${changeTone(entry.key, entry.value)}`}>
                                        {formatDifference(entry.value)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                <p className="border-t border-slate-100 px-5 py-3 text-[11px] leading-relaxed text-slate-500">
                  Changes to Offered or Handled volumes are neutral. Higher Service Level/SLA is favorable; higher AHT is unfavorable. Volume movement due to remapping does not establish a change in agent performance.
                </p>
              </section>

              <details className="rounded-xl border border-slate-200 bg-white">
                <summary className="flex cursor-pointer items-center gap-2 px-4 py-3.5 text-xs font-bold text-[#052e53] sm:px-5">
                  <Info size={16} aria-hidden="true" /> Data integrity and comparison details
                  <ChevronDown size={14} className="ml-auto text-slate-400" aria-hidden="true" />
                </summary>
                <div className="space-y-3 border-t border-slate-100 px-4 py-4 text-xs text-slate-600 sm:px-5">
                  <p><strong>Base mapping:</strong> {result.baseVersion?.label || baseLabel} (ID {result.baseVersion?.id ?? '—'})</p>
                  <p><strong>Target mapping:</strong> {result.targetVersion?.label || targetLabel} (ID {result.targetVersion?.id ?? '—'})</p>
                  <p><strong>Generated at:</strong> {generatedAt ? new Date(generatedAt).toLocaleString('en-PH', { timeZone: 'Asia/Manila' }) : '—'} (Manila time)</p>
                  <p><strong>Latest import batch ID:</strong> {result.dataAsOf?.lastImportBatchId ?? 'None'}</p>
                  {(result.coverageWarnings || []).map((warning, index) => (
                    <p key={index} className="flex items-start gap-2 leading-relaxed text-amber-800">
                      <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden="true" /> {warning}
                    </p>
                  ))}
                </div>
              </details>
            </>
          )}
        </div>

        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
          <p className="max-w-xl text-[11px] text-slate-500">Read-only comparison · Published mappings remain unchanged</p>
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50">
            Close comparison
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
