import {
  Activity,
  BarChart3,
  Clock3,
  Headphones,
  PauseCircle,
  PhoneCall,
  RefreshCw,
  TimerReset,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const PERIOD_OPTIONS = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annually", label: "Annually" },
  { value: "custom", label: "Custom" },
];

function isUnavailable(value) {
  return value === null || value === undefined || value === "";
}

function formatNumber(value) {
  if (isUnavailable(value)) return "N/A";

  const number = Number(value);
  if (!Number.isFinite(number)) return "N/A";

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(number);
}

function formatSeconds(value) {
  if (isUnavailable(value)) return "N/A";

  const number = Number(value);
  if (!Number.isFinite(number)) return "N/A";

  return `${formatNumber(number)}s`;
}

function getMetricCards(summary = {}) {
  const cards = [
    {
      key: "handledCalls",
      label: "Handled Calls",
      value: formatNumber(summary.handledCalls),
      icon: PhoneCall,
      tone: "sky",
    },
    {
      key: "averageHandleSeconds",
      label: "AHT",
      value: formatSeconds(summary.averageHandleSeconds),
      icon: Clock3,
      tone: "emerald",
    },
    {
      key: "totalTalkSeconds",
      label: "Talk Time",
      value: formatSeconds(summary.totalTalkSeconds),
      icon: Headphones,
      tone: "indigo",
    },
    {
      key: "totalHoldSeconds",
      label: "Hold Time",
      value: formatSeconds(summary.totalHoldSeconds),
      icon: PauseCircle,
      tone: "amber",
    },
    {
      key: "averageHoldSeconds",
      label: "Average Hold",
      value: formatSeconds(summary.averageHoldSeconds),
      icon: TimerReset,
      tone: "rose",
    },
    {
      key: "holdCount",
      label: "Hold Count",
      value: formatNumber(summary.holdCount),
      icon: Activity,
      tone: "cyan",
    },
  ];

  return cards.filter((card) => Object.prototype.hasOwnProperty.call(summary, card.key));
}

const CARD_TONES = {
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  cyan: "border-cyan-200 bg-cyan-50 text-cyan-700",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  indigo: "border-indigo-200 bg-indigo-50 text-indigo-700",
  rose: "border-rose-200 bg-rose-50 text-rose-700",
  sky: "border-sky-200 bg-sky-50 text-sky-700",
};

function MetricCard({ icon: Icon, label, value, tone }) {
  return (
    <div className="min-w-0 rounded-xl border border-sibs-tertiary-10 bg-white p-4 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="m-0 text-[10px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
            {label}
          </p>
          <p className="mt-2 mb-0 break-words text-2xl font-black leading-none text-sibs-primary-1">
            {value}
          </p>
        </div>
        <span
          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${CARD_TONES[tone] || CARD_TONES.sky}`}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
    </div>
  );
}

function EmptyState({ title = "No Agent Level data", message }) {
  return (
    <div className="rounded-xl border border-dashed border-sibs-tertiary-9 bg-white px-5 py-10 text-center">
      <BarChart3 className="mx-auto h-8 w-8 text-sibs-tertiary-5" aria-hidden="true" />
      <p className="mt-3 mb-0 text-sm font-extrabold text-sibs-primary-1">
        {title}
      </p>
      <p className="mx-auto mt-1 mb-0 max-w-xl text-sm text-sibs-tertiary-5">
        {message || "No personal Agent Level KPI records were returned for the selected reporting range."}
      </p>
    </div>
  );
}

function TrendChart({ series = [] }) {
  const chartRows = series.filter((item) => item?.key);
  const maxValue = Math.max(
    1,
    ...chartRows.map((item) => Number(item.handledCalls || 0)),
  );

  if (!chartRows.length) {
    return <EmptyState title="No trend data" />;
  }

  return (
    <div className="rounded-xl border border-sibs-tertiary-10 bg-white p-4 shadow-xs">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="m-0 text-sm font-extrabold text-sibs-primary-1">
            Trend by Reporting Period
          </p>
          <p className="mt-1 mb-0 text-xs text-sibs-tertiary-5">
            Handled calls and AHT from Agent Level data
          </p>
        </div>
      </div>

      <div className="mt-5 flex h-52 items-end gap-2">
        {chartRows.map((item) => {
          const handledCalls = Number(item.handledCalls || 0);
          const height = Math.max(4, Math.round((handledCalls / maxValue) * 100));

          return (
            <div key={item.key} className="flex h-full min-w-0 flex-1 flex-col justify-end gap-2">
              <div className="flex min-h-0 flex-1 items-end rounded-t-lg bg-slate-50 px-1">
                <div
                  className="w-full rounded-t-md bg-sibs-primary-2 transition-all"
                  style={{ height: `${height}%` }}
                  title={`${item.label}: ${formatNumber(item.handledCalls)} handled`}
                />
              </div>
              <div className="min-h-[38px] text-center">
                <p className="m-0 truncate text-[10px] font-bold text-sibs-primary-1" title={item.label}>
                  {item.label}
                </p>
                <p className="m-0 text-[10px] text-sibs-tertiary-5">
                  {formatSeconds(item.averageHandleSeconds)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CallsBySkill({ skills = [] }) {
  if (!skills.length) {
    return <EmptyState title="No skill breakdown" />;
  }

  return (
    <div className="rounded-xl border border-sibs-tertiary-10 bg-white p-4 shadow-xs">
      <p className="m-0 text-sm font-extrabold text-sibs-primary-1">
        Calls by Skill
      </p>
      <div className="mt-4 divide-y divide-sibs-tertiary-10">
        {skills.map((item) => (
          <div key={item.key || item.skillName} className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="m-0 truncate text-sm font-bold text-sibs-primary-1" title={item.skillName || item.label}>
                {item.skillName || item.label || "Unspecified Skill"}
              </p>
              <p className="mt-0.5 mb-0 text-xs text-sibs-tertiary-5">
                AHT {formatSeconds(item.averageHandleSeconds)}
              </p>
            </div>
            <span className="shrink-0 rounded-lg border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-extrabold text-sky-700">
              {formatNumber(item.handledCalls)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AgentPerformanceDashboard({
  data,
  error,
  filters,
  isLoading,
  onFilterChange,
  onRefresh,
}) {
  const performance = data?.performance || {};
  const summary = performance.summary || {};
  const series = Array.isArray(performance.series) ? performance.series : [];
  const skillRows = Array.isArray(data?.skillBreakdown)
    ? data.skillBreakdown.filter((item) => item.skillName)
    : [];
  const metricCards = getMetricCards(summary);
  const isCustom = filters.period === "custom";
  const hasData = Number(summary.interactionCount || summary.handledCalls || 0) > 0;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-sibs-tertiary-10 bg-white p-4 shadow-xs">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="m-0 text-lg font-black text-sibs-primary-1">
              My Performance
            </p>
            <p className="mt-1 mb-0 text-sm text-sibs-tertiary-5">
              Agent Level KPI calculated from your imported interaction records.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-[150px_150px_150px_auto]">
            <select
              value={filters.period}
              onChange={(event) =>
                onFilterChange({
                  period: event.target.value,
                  referenceDate: "",
                  from: "",
                  to: "",
                })
              }
              className="form-input h-10 rounded-lg py-0 text-sm"
              aria-label="Reporting period"
            >
              {PERIOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {isCustom ? (
              <>
                <input
                  type="date"
                  value={filters.from}
                  onChange={(event) => onFilterChange({ from: event.target.value })}
                  className="form-input h-10 rounded-lg py-0 text-sm"
                  aria-label="From date"
                />
                <input
                  type="date"
                  value={filters.to}
                  onChange={(event) => onFilterChange({ to: event.target.value })}
                  className="form-input h-10 rounded-lg py-0 text-sm"
                  aria-label="To date"
                />
              </>
            ) : (
              <>
                <input
                  type="date"
                  value={filters.referenceDate}
                  onChange={(event) => onFilterChange({ referenceDate: event.target.value })}
                  className="form-input h-10 rounded-lg py-0 text-sm"
                  aria-label="Reference date"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onFilterChange({ referenceDate: "" })}
                  className="h-10 rounded-lg px-3 text-xs font-bold"
                >
                  Latest
                </Button>
              </>
            )}

            <Button
              type="button"
              onClick={onRefresh}
              className="h-10 rounded-lg bg-sibs-primary-1 px-3 text-white hover:bg-sibs-tertiary-4"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} aria-hidden="true" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {error ? (
        <EmptyState title="Unable to load performance" message={error} />
      ) : null}

      {!error && !isLoading && !hasData ? (
        <EmptyState />
      ) : null}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {metricCards.map((card) => (
          <MetricCard
            key={card.key}
            icon={card.icon}
            label={card.label}
            value={card.value}
            tone={card.tone}
          />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <TrendChart series={series} />
        <CallsBySkill skills={skillRows} />
      </div>
    </div>
  );
}

export { formatNumber, formatSeconds, getMetricCards };
