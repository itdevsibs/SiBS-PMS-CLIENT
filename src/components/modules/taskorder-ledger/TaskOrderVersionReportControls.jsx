// Read-only Task Order mapping selector and comparison action.
// The report owns the period and operational filters; comparison never adds its own dates.
import { useEffect, useMemo, useRef, useState } from 'react';
import { GitCompare, Loader2 } from 'lucide-react';
import { getTaskOrderVersions, compareTaskOrderVersions } from '@/lib/axios/kpis';
import TaskOrderVersionComparisonModal from './TaskOrderVersionComparisonModal';

const field = 'h-8 min-w-0 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 focus:border-[#052e53] focus:outline-none focus:ring-2 focus:ring-blue-100';
const periodLabels = {
  weekly: 'Weekly', monthly: 'Monthly', quarterly: 'Quarterly', annually: 'Annually', custom: 'Custom',
};
function versionLabel(version) {
  if (!version) return 'Unknown version';
  const label = String(version.label || '').trim();
  if (/^v\d+\b/i.test(label)) return label;
  return `V${version.version_number}${label ? ` — ${label}` : ''}`;
}

export default function TaskOrderVersionReportControls({
  value = 'current', onChange, reportType = 'CALLS_WOW',
  sourceSystem = 'US_VISA', taskOrder = [], country = [], skill = [],
  reportPeriod = 'weekly', reportReferenceDate = '', reportFrom = '', reportTo = '',
  allowCompare = true,
}) {
  const [versions, setVersions] = useState([]);
  const [currentVersionId, setCurrentVersionId] = useState(null);
  const [optionsError, setOptionsError] = useState('');
  const [comparisonError, setComparisonError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [base, setBase] = useState('1');
  const [target, setTarget] = useState('current');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const requestSequence = useRef(0);
  const comparisonKey = JSON.stringify({
    reportPeriod, reportReferenceDate, reportFrom, reportTo,
    reportType, sourceSystem, taskOrder, country, skill, base, target, value,
  });
  const currentResult = result?.key === comparisonKey ? result.data : null;
  const periodLabel = periodLabels[reportPeriod] || reportPeriod;
  const reportDates = reportPeriod === 'custom'
    ? `${reportFrom || 'Not selected'} – ${reportTo || 'Not selected'}`
    : `Reference date: ${reportReferenceDate || 'Not selected'}`;
  const canCompare = Boolean(versions.length && reportPeriod &&
    (reportPeriod === 'custom' ? reportFrom && reportTo : reportReferenceDate));

  useEffect(() => {
    requestSequence.current += 1;
    setResult(null);
    setBusy(false);
    setComparisonError('');
  }, [comparisonKey]);

  useEffect(() => {
    let active = true;
    getTaskOrderVersions().then((response) => {
      if (!active) return;
      const rows = response?.data?.rows || [];
      setVersions(rows);
      setCurrentVersionId(response?.data?.currentVersionId ?? rows.find((row) => row.isCurrent)?.id ?? null);
      const baseline = rows.find((row) => Number(row.version_number) === 1);
      if (baseline) setBase(String(baseline.id));
    }).catch((error) => {
      if (active) setOptionsError(error?.response?.data?.message || 'Task Order versions are unavailable.');
    });
    return () => { active = false; };
  }, []);

  const currentVersion = versions.find((version) => String(version.id) === String(currentVersionId));
  const options = useMemo(() => [
    { value: 'current', label: currentVersion ? `Current — ${versionLabel(currentVersion)}` : 'Current — Latest Published' },
    ...[...versions].sort((a, b) => Number(b.version_number) - Number(a.version_number))
      .map((version) => ({ value: String(version.id), label: versionLabel(version) })),
  ], [versions, currentVersionId]);
  const selectedLabel = (selected) => {
    if (selected === 'current') return currentVersion ? versionLabel(currentVersion) : 'Current — Latest Published';
    return versionLabel(versions.find((version) => String(version.id) === String(selected)));
  };

  async function compare() {
    const requestId = ++requestSequence.current;
    const requestedKey = comparisonKey;
    setBusy(true);
    setComparisonError('');
    setResult(null);
    try {
      const response = await compareTaskOrderVersions({
        baseVersionId: base, targetVersionId: target,
        period: reportPeriod, referenceDate: reportReferenceDate, from: reportFrom, to: reportTo,
        reportType, sourceSystem, taskOrder, country, skill,
      });
      if (!response?.success) throw new Error(response?.message || 'Comparison failed.');
      if (requestId === requestSequence.current) setResult({ key: requestedKey, data: response.data });
    } catch (error) {
      if (requestId === requestSequence.current) {
        setComparisonError(error?.response?.data?.message || error?.message || 'Comparison failed.');
      }
    } finally {
      if (requestId === requestSequence.current) setBusy(false);
    }
  }

  function viewComparison() {
    if (!canCompare) return;
    setModalOpen(true);
    void compare();
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-xs">
      <div className="flex flex-wrap items-center gap-2.5">
        <label className="flex min-w-[240px] flex-1 items-center gap-2 font-semibold">
          <span className="shrink-0 text-[11px] text-slate-500">Task Order Version</span>
          <select
            className={field}
            value={value}
            onChange={(event) => onChange?.(event.target.value)}
            aria-label="Task Order reporting version"
          >
            {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        {allowCompare && (
          <>
            <div className="hidden h-6 border-l border-slate-200 sm:block" aria-hidden="true" />
            <label className="flex min-w-[200px] flex-1 items-center gap-2 font-semibold">
              <span className="shrink-0 text-[11px] text-slate-500">Base</span>
              <select className={field} value={base} onChange={(event) => setBase(event.target.value)} aria-label="Base mapping version">
                {options.filter((option) => option.value !== 'current').map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label className="flex min-w-[220px] flex-1 items-center gap-2 font-semibold">
              <span className="shrink-0 text-[11px] text-slate-500">Target</span>
              <select className={field} value={target} onChange={(event) => setTarget(event.target.value)} aria-label="Target mapping version">
                {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <button
              type="button"
              onClick={viewComparison}
              disabled={!canCompare || busy}
              title="Comparison uses the active report's reporting period and filters."
              className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#052e53] px-3 text-xs font-bold text-white transition hover:bg-[#07416e] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <GitCompare size={14} aria-hidden="true" />}
              View Comparison
            </button>
          </>
        )}
      </div>
      {optionsError && <p role="alert" className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{optionsError}</p>}
      {allowCompare && modalOpen && (
        <TaskOrderVersionComparisonModal
          onClose={() => setModalOpen(false)}
          onRefresh={compare}
          loading={busy}
          error={comparisonError}
          result={currentResult}
          canRefresh={canCompare}
          baseLabel={selectedLabel(base)}
          targetLabel={selectedLabel(target)}
          reportType={reportType}
          periodLabel={periodLabel}
          reportDates={reportDates}
          sourceSystem={sourceSystem}
          taskOrder={taskOrder}
          country={country}
          skill={skill}
        />
      )}
    </section>
  );
}
