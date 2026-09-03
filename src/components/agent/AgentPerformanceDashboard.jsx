import {
  Activity,
  BarChart3,
  Clock,
  Clock3,
  Headphones,
  PauseCircle,
  PhoneCall,
  TimerReset,
} from "lucide-react";

import WfmKpiDatePicker from "@/components/workForceManagement/kpi/WfmKpiDatePicker";
import { getCallAxisTicks } from "@/components/workForceManagement/kpi/wfmCallKpiDashboardUtils";
import {
  ChartShell,
  LineChart,
  AhtChart,
} from "@/components/workForceManagement/kpi/WfmCallKpiDashboard";
import {
  getAgentCountryOptions,
  getAgentSkillOptions,
  isAgentSkillAvailableForCountry,
} from "./agentPerformanceFilterUtils";

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
  return [
    {
      key: "handledCalls",
      label: "Handled Calls",
      value: formatNumber(summary?.handledCalls),
      icon: PhoneCall,
    },
    {
      key: "averageHandleSeconds",
      label: "AHT",
      value: formatSeconds(summary?.averageHandleSeconds),
      icon: Clock3,
    },
    {
      key: "totalTalkSeconds",
      label: "Talk Time",
      value: formatSeconds(summary?.totalTalkSeconds),
      icon: Headphones,
    },
    {
      key: "totalHoldSeconds",
      label: "Hold Time",
      value: formatSeconds(summary?.totalHoldSeconds),
      icon: PauseCircle,
    },
    {
      key: "averageHoldSeconds",
      label: "Average Hold",
      value: formatSeconds(summary?.averageHoldSeconds),
      icon: TimerReset,
    },
    {
      key: "holdCount",
      label: "Hold Count",
      value: formatNumber(summary?.holdCount),
      icon: Activity,
    },
  ];
}

const CARD_TONES = {
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  cyan: "border-cyan-200 bg-cyan-50 text-cyan-700",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  indigo: "border-indigo-200 bg-indigo-50 text-indigo-700",
  rose: "border-rose-200 bg-rose-50 text-rose-700",
  sky: "border-sky-200 bg-sky-50 text-sky-700",
};

function MetricCard({ icon: Icon, label, value }) {
  return (
    <article className="sibs-card min-w-0 px-3.5 py-2.5 shadow-xs flex flex-col justify-between gap-1 h-full">
      <div className="flex items-center justify-between gap-1.5">
        <p className="m-0 text-[10.5px] font-extrabold uppercase tracking-wider text-sibs-tertiary-5 truncate">
          {label}
        </p>
        <div className="rounded-md bg-sibs-primary-3/50 p-1.5 text-sibs-primary-1 shrink-0">
          <Icon size={14} />
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-1.5 min-w-0">
        <div className="flex items-baseline gap-1.5 min-w-0 truncate">
          <span className="text-2xl font-black text-sibs-primary-1 leading-none shrink-0">
            {value}
          </span>
        </div>
      </div>
    </article>
  );
}

function EmptyState({ title = "No Agent Level data", message }) {
  return (
    <div className="sibs-card rounded-xl border border-dashed border-sibs-tertiary-9 bg-white px-5 py-10 text-center shadow-xs">
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

function AgentCallsChart({ series = [] }) {
  if (!series.length) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-xl border border-dashed border-sibs-tertiary-8 bg-sibs-tertiary-10/30 px-3 text-center text-xs font-semibold text-sibs-tertiary-5">
        No call volume recorded for this reporting range.
      </div>
    );
  }

  const maxValue = Math.max(
    1,
    ...series.map((item) => Number(item.callsHandled || item.handledCalls || 0)),
  );
  const axisTicks = getCallAxisTicks(maxValue, 4);
  const axisMax = Math.max(1, axisTicks[0] || maxValue);

  return (
    <div className="w-full min-w-0">
      {/* Legend */}
      <div className="mb-3 flex h-5 items-center gap-3 text-xs font-bold text-sibs-tertiary-5">
        <span className="inline-flex items-center gap-1.5">
          <i className="inline-block h-2.5 w-2.5 rounded-full bg-[#0b3b68]" />
          Handled
        </span>
      </div>

      <div className="flex w-full min-w-0">
        {/* Y-Axis */}
        <div className="relative h-[300px] w-12 shrink-0 border-r border-sibs-tertiary-8 pr-1.5">
          {axisTicks.map((tick, index) => (
            <span
              key={`${tick}-${index}`}
              className="absolute right-1.5 -translate-y-1/2 text-[10px] font-semibold text-sibs-tertiary-5"
              style={{
                top: `${(index / (axisTicks.length - 1)) * 100}%`,
              }}
            >
              {formatNumber(tick)}
            </span>
          ))}
        </div>

        {/* Chart Area */}
        <div className="relative min-w-0 flex-1">
          {/* Horizontal Gridlines */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[300px]">
            {axisTicks.map((tick, index) => (
              <div
                key={`${tick}-${index}`}
                className="absolute left-0 right-0 border-t border-sibs-tertiary-9"
                style={{
                  top: `${(index / (axisTicks.length - 1)) * 100}%`,
                }}
              />
            ))}
          </div>

          {/* Single Bar per Period */}
          <div className="relative flex h-[300px] min-w-0 items-end gap-1.5 border-b border-sibs-tertiary-8 px-1 sm:gap-2.5">
            {series.map((item, periodIndex) => {
              const numericValue = Number(item.callsHandled || item.handledCalls || 0);
              const heightPercent =
                numericValue > 0
                  ? Math.max(2, (numericValue / axisMax) * 100)
                  : 0;
              const tooltipIsNearTop = heightPercent >= 70;

              return (
                <div
                  key={item.key}
                  className="group/period flex h-full min-w-0 flex-1 items-end justify-center px-0.5 sm:px-1"
                >
                  <div className="group/bar relative flex h-full w-full max-w-[28px] items-end justify-center">
                    {numericValue > 0 ? (
                      <span
                        className="pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 whitespace-nowrap text-[10px] font-black text-sibs-primary-1 transition-all duration-200 group-hover/bar:-translate-y-0.5"
                        style={{
                          bottom: `calc(${heightPercent}% + 4px)`,
                        }}
                      >
                        {numericValue >= 1000
                          ? `${(numericValue / 1000).toFixed(1)}k`
                          : numericValue}
                      </span>
                    ) : null}

                    {/* Hover Tooltip */}
                    <div
                      className={`pointer-events-none absolute z-30 hidden min-w-[150px] rounded-xl border border-sibs-tertiary-10/80 bg-white/95 p-2.5 shadow-xl backdrop-blur-md group-hover/bar:block ${
                        periodIndex >= series.length - 1
                          ? "right-0 translate-x-0"
                          : periodIndex === 0
                          ? "left-0 translate-x-0"
                          : "left-1/2 -translate-x-1/2"
                      }`}
                      style={
                        tooltipIsNearTop
                          ? { top: "6px" }
                          : { bottom: `calc(${heightPercent}% + 28px)` }
                      }
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                        <span className="text-xs font-black text-sibs-primary-1">
                          {item.label}
                        </span>
                        <span className="text-[10px] font-bold text-sibs-tertiary-5">
                          Period {periodIndex + 1}
                        </span>
                      </div>

                      <div className="mt-1.5 flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 font-bold text-slate-600">
                          <span className="h-2.5 w-2.5 rounded-full bg-[#0b3b68]" />
                          Handled:
                        </span>
                        <span className="font-extrabold text-sibs-primary-1">
                          {formatNumber(numericValue)}
                        </span>
                      </div>

                      {item.ahtSeconds || item.averageHandleSeconds ? (
                        <div className="mt-1 flex items-center justify-between border-t border-slate-100 pt-1 text-[11px]">
                          <span className="font-semibold text-slate-500">
                            AHT:
                          </span>
                          <span className="font-extrabold text-sibs-primary-1">
                            {formatSeconds(item.ahtSeconds || item.averageHandleSeconds)}
                          </span>
                        </div>
                      ) : null}
                    </div>

                    {/* Single Bar Pillar */}
                    <div
                      className="w-full rounded-t-sm bg-[#0b3b68] shadow-xs transition-all duration-200 ease-out group-hover/bar:-translate-y-0.5 group-hover/bar:brightness-110"
                      style={{
                        height: `${heightPercent}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* X-Axis */}
          <div className="flex w-full min-w-0 gap-1.5 px-1 sm:gap-2.5">
            {series.map((item, periodIndex) => (
              <div
                key={item.key}
                className="mt-2 min-w-0 flex-1 px-0.5 text-center"
              >
                <p
                  className="m-0 truncate text-[10.5px] font-extrabold text-sibs-primary-1 leading-tight"
                  title={item.label}
                >
                  {item.label}
                </p>
                <p className="m-0 text-[9px] font-semibold uppercase text-sibs-tertiary-5">
                  Period {periodIndex + 1}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CallsBySkill({ skills = [] }) {
  if (!skills.length) {
    return (
      <article className="sibs-card overflow-hidden flex flex-col h-full shadow-xs">
        <div className="border-b border-sibs-tertiary-10 bg-sibs-primary-3/30 px-4 py-2.5">
          <h3 className="m-0 text-xs font-extrabold uppercase tracking-[0.14em] text-sibs-primary-1">
            Calls by Skill
          </h3>
          <p className="mt-0.5 mb-0 text-[10.5px] text-sibs-tertiary-5 truncate">
            Breakdown of handled interactions by skill
          </p>
        </div>
        <div className="p-4 text-center">
          <EmptyState title="No skill breakdown" />
        </div>
      </article>
    );
  }

  return (
    <article className="sibs-card overflow-hidden flex flex-col h-full shadow-xs">
      <div className="border-b border-sibs-tertiary-10 bg-sibs-primary-3/30 px-4 py-3">
        <h3 className="m-0 text-xs font-extrabold uppercase tracking-[0.14em] text-sibs-primary-1">
          Calls by Skill
        </h3>
        <p className="mt-0.5 mb-0 text-[10.5px] text-sibs-tertiary-5 truncate">
          Breakdown of handled interactions by skill
        </p>
      </div>
      <div className="p-4 max-h-[680px] overflow-y-auto divide-y divide-sibs-tertiary-10">
        {skills.map((item) => (
          <div key={item.key || item.skillName} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 transition hover:bg-slate-50/50 px-1 rounded-lg">
            <div className="min-w-0">
              <p className="m-0 truncate text-xs font-bold text-sibs-primary-1" title={item.skillName || item.label}>
                {item.skillName || item.label || "Unspecified Skill"}
              </p>
              <p className="mt-0.5 mb-0 text-[11px] text-sibs-tertiary-5">
                AHT: <span className="font-semibold text-sibs-primary-1">{formatSeconds(item.averageHandleSeconds)}</span>
              </p>
            </div>
            <span className="shrink-0 rounded-lg border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-extrabold text-sky-700">
              {formatNumber(item.handledCalls)}
            </span>
          </div>
        ))}
      </div>
    </article>
  );
}

export default function AgentPerformanceDashboard({
  data,
  error,
  filters,
  isLoading,
  onFilterChange,
}) {
  const performance = data?.performance || {};
  const summary = performance.summary || {};
  const rawSeries = Array.isArray(performance.series) ? performance.series : [];
  const chartSeries = rawSeries.map((item) => ({
    key: item.key,
    label: item.label,
    callsOffered: Number(item.callsOffered ?? item.interactionCount ?? item.handledCalls ?? 0),
    callsHandled: Number(item.callsHandled ?? item.handledCalls ?? 0),
    handledWithinSla: Number(item.handledWithinSla ?? item.handledCalls ?? 0),
    answerRatePct: Number(
      item.answerRatePct ??
        (Number(item.callsOffered || item.handledCalls || 0) > 0
          ? (Number(item.callsHandled || item.handledCalls || 0) /
              Number(item.callsOffered || item.handledCalls || 1)) *
            100
          : 0),
    ),
    serviceLevelPct: Number(
      item.serviceLevelPct ??
        (Number(item.callsOffered || item.handledCalls || 0) > 0
          ? (Number(item.handledWithinSla || item.handledCalls || 0) /
              Number(item.callsOffered || item.handledCalls || 1)) *
            100
          : 0),
    ),
    ahtSeconds: item.averageHandleSeconds ?? item.ahtSeconds ?? 0,
  }));

  const skillRows = Array.isArray(data?.skillBreakdown)
    ? data.skillBreakdown.filter((item) => item.skillName)
    : [];
  const metricCards = getMetricCards(summary);
  const availableFilters = performance?.availableFilters || {};
  const countryOptions = getAgentCountryOptions(availableFilters);
  const skillOptions = getAgentSkillOptions(availableFilters, filters.country);
  const isCustom = filters.period === "custom";
  const hasData = Number(summary.interactionCount || summary.handledCalls || 0) > 0;

  return (
    <div className="space-y-3">
      <section className="sibs-card relative z-40 overflow-visible shadow-xs">
        <h1 className="sr-only">My Performance</h1>

        <div className="flex flex-wrap items-end gap-2 px-2 pt-3 pb-2.5">
          {/* 1. Country */}
          <label className="block w-full min-w-0 sm:w-52">
            <span className="mb-0.5 block text-[9.5px] font-extrabold uppercase text-sibs-tertiary-5">
              Country
            </span>
            <select
              value={filters.country}
              onChange={(event) => {
                const country = event.target.value;
                const keepSkill = isAgentSkillAvailableForCountry(
                  availableFilters,
                  filters.skill,
                  country,
                );

                onFilterChange({
                  country,
                  ...(keepSkill ? {} : { skill: "" }),
                });
              }}
              disabled={isLoading}
              className="h-8 w-full cursor-pointer rounded-lg border border-sibs-tertiary-8 bg-white px-2.5 text-xs font-semibold text-sibs-primary-1 outline-none transition hover:border-sibs-primary-1 hover:bg-slate-50/50 focus:border-sibs-primary-1 focus:ring-1 focus:ring-sibs-primary-1/20 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Country"
            >
              {countryOptions.map((option) => (
                <option key={option.value || "ALL_COUNTRIES"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {/* 2. Skill */}
          <label className="block w-full min-w-0 sm:w-72">
            <span className="mb-0.5 block text-[9.5px] font-extrabold uppercase text-sibs-tertiary-5">
              Skill
            </span>
            <select
              value={filters.skill}
              onChange={(event) => onFilterChange({ skill: event.target.value })}
              disabled={isLoading}
              className="h-8 w-full cursor-pointer rounded-lg border border-sibs-tertiary-8 bg-white px-2.5 text-xs font-semibold text-sibs-primary-1 outline-none transition hover:border-sibs-primary-1 hover:bg-slate-50/50 focus:border-sibs-primary-1 focus:ring-1 focus:ring-sibs-primary-1/20 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Skill"
            >
              {skillOptions.map((option) => (
                <option key={option.value || "ALL_SKILLS"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {/* 3. Reporting Period */}
          <label className="block w-full min-w-0 sm:w-52">
            <span className="mb-0.5 block text-[9.5px] font-extrabold uppercase text-sibs-tertiary-5">
              Reporting Period
            </span>
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
              className="h-8 w-full cursor-pointer rounded-lg border border-sibs-tertiary-8 bg-white px-2.5 text-xs font-semibold text-sibs-primary-1 outline-none transition hover:border-sibs-primary-1 hover:bg-slate-50/50 focus:border-sibs-primary-1 focus:ring-1 focus:ring-sibs-primary-1/20"
              aria-label="Reporting period"
            >
              {PERIOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {/* 4. Reference Date (or From + To) */}
          {isCustom ? (
            <>
              <div className="w-full min-w-0 sm:w-52">
                <WfmKpiDatePicker
                  label="From"
                  value={filters.from}
                  onChange={(from) => onFilterChange({ from: from || "" })}
                  disabled={isLoading}
                />
              </div>
              <div className="w-full min-w-0 sm:w-52">
                <WfmKpiDatePicker
                  label="To"
                  value={filters.to}
                  onChange={(to) => onFilterChange({ to: to || "" })}
                  disabled={isLoading}
                />
              </div>
            </>
          ) : (
            <>
              <div className="w-full min-w-0 sm:w-56">
                <WfmKpiDatePicker
                  label="Reference Date"
                  value={filters.referenceDate}
                  onChange={(referenceDate) =>
                    onFilterChange({ referenceDate: referenceDate || "" })
                  }
                  disabled={isLoading}
                />
              </div>
              <div className="w-full min-w-0 sm:w-52">
                <button
                  type="button"
                  onClick={() => onFilterChange({ referenceDate: "" })}
                  disabled={isLoading}
                  title="Use the latest available date."
                  className="inline-flex h-8 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-sibs-primary-1 shadow-xs transition hover:border-sibs-primary-1 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Clock size={12} className="shrink-0" />
                  <span>Latest</span>
                </button>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 border-t border-sibs-tertiary-10 px-3.5 py-1 text-[10px] font-semibold text-sibs-tertiary-5">
          <span>Source: Agent Level Interactions</span>
          <span>Period: {PERIOD_OPTIONS.find((opt) => opt.value === filters.period)?.label || filters.period}</span>
          {filters.skill ? <span>Skill: {filters.skill}</span> : null}
          {filters.country ? <span>Country: {filters.country}</span> : null}
          {filters.referenceDate && !isCustom ? <span>Reference date: {filters.referenceDate}</span> : null}
          {filters.from && filters.to && isCustom ? <span>Range: {filters.from} to {filters.to}</span> : null}
        </div>
      </section>

      {error ? (
        <EmptyState title="Unable to load performance" message={error} />
      ) : null}

      {!error && !isLoading && !hasData ? (
        <EmptyState />
      ) : null}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {metricCards.map((card) => (
          <MetricCard
            key={card.key}
            icon={card.icon}
            label={card.label}
            value={card.value}
          />
        ))}
      </div>

      {/* Trend by Reporting Period: 3 KPI Trend Charts */}
      <div className="grid gap-2 xl:grid-cols-3">
        <ChartShell
          title="Calls"
          subtitle="Handled calls by reporting period"
        >
          <AgentCallsChart series={chartSeries} />
        </ChartShell>

        <ChartShell
          title="Answer Rate & Service Level"
          subtitle="Answer % and service level performance against target"
        >
          <LineChart series={chartSeries} target={90} />
        </ChartShell>

        <ChartShell
          title="Average Handling Time"
          subtitle="Call AHT measured in seconds against target"
        >
          <AhtChart series={chartSeries} target={420} />
        </ChartShell>
      </div>

      {/* Calls by Skill Breakdown */}
      {skillRows.length > 0 ? (
        <CallsBySkill skills={skillRows} />
      ) : null}
    </div>
  );
}

export { formatNumber, formatSeconds, getMetricCards };
