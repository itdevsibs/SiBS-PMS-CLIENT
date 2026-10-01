import { ClipboardCheck } from "lucide-react";
import { ChartShell } from "./CallKpiDashboard.jsx";
import { getCallAxisTicks } from "./callKpiDashboardUtils.js";

function formatNumber(value, digits = 0) {
  const number = Number(value || 0);
  return number.toLocaleString(undefined, {
    useGrouping: false,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function EmptyChart({ message }) {
  return (
    <div className="flex min-h-64 items-center justify-center rounded-xl border border-dashed border-sibs-tertiary-8 bg-sibs-tertiary-10/30 px-4 text-center text-xs font-semibold text-sibs-tertiary-5">
      {message}
    </div>
  );
}

function getTooltipPositionClass(index, total) {
  if (index === 0) return "left-0";
  if (index >= total - 1) return "right-0";
  return "left-1/2 -translate-x-1/2";
}

function QaTransactionsChart({ series = [] }) {
  if (!series.length) {
    return <EmptyChart message="No Quality Audit transactions are available for this reporting range." />;
  }

  const maxValue = Math.max(1, ...series.map((item) => Number(item.qaTransactions || 0)));
  const axisTicks = getCallAxisTicks(maxValue, 4);
  const axisMax = Math.max(1, axisTicks[0] || maxValue);

  return (
    <div className="w-full min-w-0 select-none">
      <div className="flex w-full min-w-0">
        <div className="relative h-[300px] w-11 shrink-0 border-r border-sibs-tertiary-8 pr-1.5">
          {axisTicks.map((tick, index) => (
            <span
              key={`${tick}-${index}`}
              className="absolute right-1.5 -translate-y-1/2 text-[10px] font-semibold text-sibs-tertiary-5"
              style={{ top: `${(index / Math.max(axisTicks.length - 1, 1)) * 100}%` }}
            >
              {formatNumber(tick)}
            </span>
          ))}
        </div>

        <div className="relative min-w-0 flex-1">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[300px]">
            {axisTicks.map((tick, index) => (
              <div
                key={`${tick}-${index}`}
                className="absolute left-0 right-0 border-t border-sibs-tertiary-9"
                style={{ top: `${(index / Math.max(axisTicks.length - 1, 1)) * 100}%` }}
              />
            ))}
          </div>

          <div className="relative flex h-[300px] min-w-0 items-end gap-2 border-b border-sibs-tertiary-8 px-2 sm:gap-3">
            {series.map((item, index) => {
              const value = Number(item.qaTransactions || 0);
              const height = value > 0 ? Math.max(2, (value / axisMax) * 100) : 0;
              const isInside = height > 11;

              return (
                <div key={item.key || index} className="group/bar relative flex h-full min-w-0 flex-1 items-end justify-center">
                  {value > 0 ? (
                    <span
                      className={`pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 whitespace-nowrap text-[9px] font-semibold transition-all group-hover/bar:-translate-y-0.5 ${
                        isInside ? "text-white drop-shadow-xs" : "text-sibs-primary-1"
                      }`}
                      style={{ bottom: isInside ? `calc(${height}% - 18px)` : `calc(${height}% + 4px)` }}
                    >
                      {formatNumber(value)}
                    </span>
                  ) : null}

                  <div
                    className={`pointer-events-none absolute top-3 z-40 hidden w-44 rounded-xl border border-sibs-tertiary-10/80 bg-white/95 p-2.5 shadow-xl backdrop-blur-md group-hover/bar:block ${getTooltipPositionClass(index, series.length)}`}
                  >
                    <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-1">
                      <span className="truncate text-xs font-black text-sibs-primary-1">{item.label}</span>
                      <span className="text-[10px] font-bold text-sibs-tertiary-5">QA Transactions</span>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-600">Audits:</span>
                      <span className="font-extrabold text-sibs-primary-1">{formatNumber(value)}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between border-t border-slate-100 pt-1 text-[11px]">
                      <span className="font-semibold text-slate-500">QA Score:</span>
                      <span className="font-extrabold text-sibs-primary-1">{formatNumber(item.qaScorePct, 2)}%</span>
                    </div>
                  </div>

                  <div
                    className="w-full max-w-[70px] rounded-t-[5px] bg-[#174f7f] shadow-xs transition-all duration-200 group-hover/bar:-translate-y-0.5 group-hover/bar:brightness-110"
                    style={{ height: `${height}%` }}
                  />
                </div>
              );
            })}
          </div>

          <div className="flex min-w-0 gap-2 px-1 sm:gap-3">
            {series.map((item, index) => (
              <div key={item.key || index} className="mt-2 min-w-0 flex-1 text-center">
                <p className="m-0 truncate text-[10.5px] font-extrabold text-sibs-primary-1" title={item.label}>{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function QaScoreChart({ series = [] }) {
  if (!series.length) {
    return <EmptyChart message="No Quality Audit score is available for this reporting range." />;
  }

  return (
    <div className="flex min-h-[330px] flex-col justify-center gap-2.5 py-1">
      {series.map((item, index) => {
        const score = Math.max(0, Math.min(100, Number(item.qaScorePct || 0)));
        return (
          <div key={item.key || index} className="group/score grid grid-cols-[72px_minmax(0,1fr)] items-center gap-2">
            <span className="truncate text-[10.5px] font-extrabold text-sibs-primary-1" title={item.label}>{item.label}</span>
            <div className="relative h-8 overflow-visible rounded-sm bg-slate-100">
              <div
                className="flex h-full min-w-0 items-center justify-end rounded-sm bg-[#557da4] px-2 transition-all duration-300 group-hover/score:brightness-105"
                style={{ width: `${score}%` }}
              >
                {score >= 18 ? (
                  <span className="whitespace-nowrap text-[10px] font-semibold text-white drop-shadow-xs">{formatNumber(score, 2)}%</span>
                ) : null}
              </div>
              {score < 18 ? (
                <span
                  className="absolute top-1/2 -translate-y-1/2 whitespace-nowrap text-[10px] font-semibold text-sibs-primary-1"
                  style={{ left: `calc(${score}% + 6px)` }}
                >
                  {formatNumber(score, 2)}%
                </span>
              ) : null}
              <div className="pointer-events-none absolute inset-0 hidden items-center justify-center rounded-lg border border-slate-200 bg-white/95 text-[11px] font-bold text-sibs-primary-1 shadow-lg group-hover/score:flex">
                {item.label}: {formatNumber(score, 2)}% · {formatNumber(item.qaTransactions)} audits
              </div>
            </div>
          </div>
        );
      })}

      <div className="ml-[80px] grid grid-cols-6 text-[9px] font-semibold text-sibs-tertiary-5">
        {[0, 20, 40, 60, 80, 100].map((tick) => (
          <span key={tick} className={tick === 100 ? "text-right" : ""}>{tick}%</span>
        ))}
      </div>
    </div>
  );
}

export default function QualityAuditKpiDashboard({ data = {} }) {
  const series = Array.isArray(data.series) ? data.series : [];

  return (
    <section className="space-y-2.5">
      <div className="flex items-center justify-center gap-2 rounded-md bg-[#063d72] px-3 py-1.5 text-center text-[11px] font-black uppercase tracking-[0.45em] text-white shadow-xs">
        <ClipboardCheck size={14} className="shrink-0" />
        <span>Quality Audit</span>
      </div>

      <div className="grid grid-cols-1 gap-3.5 2xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <ChartShell title="QA Transactions" subtitle="Number of accepted Quality Audit records by reporting period">
          <QaTransactionsChart series={series} />
        </ChartShell>
        <ChartShell title="QA Score" subtitle="Average Total Audit Score (%) by reporting period">
          <QaScoreChart series={series} />
        </ChartShell>
      </div>
    </section>
  );
}
