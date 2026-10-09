import {
  Users,
  TrendingUp,
  UserCheck,
  Gauge,
  BarChart3,
} from "lucide-react";
import { ChartShell } from "./CallKpiDashboard.jsx";
import { getCallAxisTicks } from "./callKpiDashboardUtils.js";

function formatNumber(value, digits = 0) {
  const number = Number(value || 0);
  return number.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/**
 * OccupancySummaryCards
 * Uses the exact same design and structure as Calls summary cards:
 * - Top title header with thin line and icon
 * - Compact KpiCard layout: `sibs-card rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2`
 * - Label in `text-[9px] xl:text-[9.5px] font-extrabold uppercase tracking-wider text-sibs-tertiary-5`
 * - Enclosed icon in `text-sibs-tertiary-5/80`
 * - Big bold value in `text-base sm:text-lg xl:text-[19px] font-black text-sibs-primary-1`
 * - Status badge pill
 * - Descriptive hint
 */
export function OccupancySummaryCards({
  summary = {},
  title = "Occupancy & Headcount",
  onCardClick = null,
} = {}) {
  const cards = [
    {
      label: "Occupancy Rate",
      value: summary?.occupancyPct != null ? `${formatNumber(summary.occupancyPct, 2)}%` : "0%",
      hint: "Total work time ÷ productive time",
      icon: Gauge,
      status: {
        label: "Target ≥70%",
        className:
          (summary?.occupancyPct || 0) >= 70
            ? "bg-green-100 text-green-700"
            : "bg-amber-100 text-amber-700",
      },
    },
    {
      label: "Utilization Rate",
      value: summary?.utilizationPct != null ? `${formatNumber(summary.utilizationPct, 2)}%` : "0%",
      hint: "Productive working time",
      icon: TrendingUp,
      status: {
        label: "Target 90%",
        className: "bg-amber-100 text-amber-700",
      },
    },
    {
      label: "Active Headcount",
      value: summary?.actualHeadcount != null ? formatNumber(summary.actualHeadcount, 0) : "0",
      hint: "Rostered / Scheduled",
      icon: Users,
      status: {
        label: "Rostered",
        className: "bg-slate-100 text-slate-700",
      },
    },
    {
      label: "Adherence / Shrinkage",
      value: summary?.adherencePct != null ? `${formatNumber(summary.adherencePct, 2)}%` : "0%",
      hint: "Schedule adherence tracking",
      icon: UserCheck,
      status: {
        label: "Target met",
        className: "bg-green-100 text-green-700",
      },
    },
  ];

  return (
    <div>
      {title ? (
        <div className="flex items-center gap-1.5 mb-1 px-0.5">
          <span className="flex items-center gap-1 text-[10px] sm:text-[10.5px] font-black uppercase tracking-wider text-sibs-primary-1">
            <Users size={11} className="text-sibs-primary-1" />
            {title}
          </span>
          <div className="h-px flex-1 bg-slate-200/70" />
        </div>
      ) : null}

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-1 sm:gap-1.5">
        {cards.map(({ label, value, icon: Icon, hint, status }) => (
          <article
            key={label}
            onClick={onCardClick || undefined}
            className={`sibs-card rounded-xl min-w-0 px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-2xs flex flex-col justify-between gap-1 transition-all duration-150 hover:border-sibs-primary-1/30 ${
              onCardClick ? "cursor-pointer" : ""
            }`}
          >
            {/* Header: Label + Icon */}
            <div className="flex items-center justify-between gap-1 min-w-0">
              <span
                className="m-0 text-[9px] xl:text-[9.5px] font-extrabold uppercase tracking-wider text-sibs-tertiary-5 leading-none truncate"
                title={label}
              >
                {label}
              </span>
              <div className="rounded p-0.5 text-sibs-tertiary-5/80 shrink-0">
                <Icon size={12} />
              </div>
            </div>

            {/* Value + Badge & Hint */}
            <div className="flex flex-col gap-0.5 min-w-0">
              <div className="flex items-baseline justify-between gap-1 min-w-0">
                <span className="text-base sm:text-lg xl:text-[19px] font-black text-sibs-primary-1 leading-none tracking-tight shrink-0">
                  {value}
                </span>

                {status ? (
                  <span
                    className={`inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[8.5px] font-bold leading-none ${status.className}`}
                  >
                    {status.label}
                  </span>
                ) : null}
              </div>

              {hint ? (
                <p
                  className="m-0 text-[9px] xl:text-[9.5px] font-bold text-sibs-tertiary-5 leading-tight truncate"
                  title={hint}
                >
                  {hint}
                </p>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

/**
 * Standard Chart Canvas Grid with exact same responsive height clamping as Calls
 * so the entire viewport fits cleanly without forcing page scrollbars.
 */
function ChartCanvasGrid({
  yAxisLabels = ["100%", "75%", "50%", "25%", "0%"],
  xAxisLabels = ["Week 18", "Week 19", "Week 20", "Week 21", "Week 22", "Week 23"],
  footerNotes = [],
  isSubmodule = false,
  showFilters = true,
  targetLine = null,
  series = [],
  barKey = null,
  barColor = "bg-[#0b3b68]",
  maxAxisValue = 100,
  formatValue = null,
  tooltipLabel = "",
}) {
  const chartHeightStyle = isSubmodule
    ? {
        height: showFilters
          ? "clamp(180px, calc((100vh - 350px) / 2), 340px)"
          : "clamp(240px, calc((100vh - 200px) / 2), 440px)",
      }
    : undefined;

  const maxTickCharLength = Math.max(
    ...yAxisLabels.map((t) => String(t).length),
    1,
  );

  return (
    <div className={`w-full min-w-0 select-none ${!isSubmodule ? "flex-1 min-h-0 flex flex-col" : ""}`}>
      <div className={`flex w-full min-w-0 ${!isSubmodule ? "flex-1 min-h-0" : ""}`}>
        {/* Fixed Left Y-Axis */}
        <div className={`flex flex-col shrink-0 ${!isSubmodule ? "h-full" : ""}`}>
          <div
            className={`relative ${!isSubmodule ? "" : "w-10 sm:w-11"} shrink-0 border-r border-sibs-tertiary-8 pr-1 bg-white z-10 overflow-visible transition-all duration-300 ease-in-out ${!isSubmodule ? "flex-1 min-h-0" : ""}`}
            style={{
              ...chartHeightStyle,
              width: !isSubmodule
                ? `${Math.max(22, Math.ceil(maxTickCharLength * 7.5 + 8))}px`
                : undefined,
            }}
          >
            {yAxisLabels.map((tick, index) => (
              <span
                key={`${tick}-${index}`}
                className={`absolute right-1 ${
                  index === 0
                    ? "translate-y-0"
                    : index === yAxisLabels.length - 1
                    ? "-translate-y-full"
                    : "-translate-y-1/2"
                } whitespace-nowrap ${isSubmodule ? "text-[10px] font-semibold" : "text-[8.5px] font-bold"} text-sibs-tertiary-5 leading-none`}
                style={{
                  top: `${(index / Math.max(yAxisLabels.length - 1, 1)) * 100}%`,
                }}
              >
                {tick}
              </span>
            ))}
          </div>
          {!isSubmodule && <div className="shrink-0 h-5 border-r border-sibs-tertiary-8" />}
        </div>

        {/* Drawing Area */}
        <div className={`relative min-w-0 flex-1 overflow-visible ${!isSubmodule ? "h-full flex flex-col" : ""}`}>
          <div
            className={`relative flex min-w-0 items-end border-b border-sibs-tertiary-8 px-1 transition-all duration-300 ease-in-out ${!isSubmodule ? "flex-1 min-h-0" : ""}`}
            style={chartHeightStyle}
          >
            {/* Horizontal Gridlines */}
            <div className="pointer-events-none absolute inset-0">
              {yAxisLabels.map((tick, index) => (
                <div
                  key={`line-${tick}-${index}`}
                  className="absolute left-0 right-0 border-t border-sibs-tertiary-9"
                  style={{
                    top: `${(index / Math.max(yAxisLabels.length - 1, 1)) * 100}%`,
                  }}
                />
              ))}

              {/* Optional Target Reference Line */}
              {targetLine !== null ? (
                <div
                  className="absolute left-0 right-0 border-t border-dashed border-red-500 z-10"
                  style={{
                    top: `${100 - Number(targetLine)}%`,
                  }}
                />
              ) : null}
            </div>

            {/* Dynamic Bars */}
            {series && series.length > 0 && barKey ? (
              series.map((item, index) => {
                const rawVal = item[barKey];
                const value = rawVal != null ? Number(rawVal) : 0;
                const maxValue = maxAxisValue || 100;
                const height =
                  maxValue > 0 ? Math.min(100, Math.max(0, (value / maxValue) * 100)) : 0;
                const isInside = height > (isSubmodule ? 7 : 10);

                return (
                  <div
                    key={item.key || index}
                    className="group/period relative z-10 hover:z-50 flex h-full min-w-0 flex-1 items-end justify-center px-0.5"
                  >
                    <div className="group/bar relative hover:z-50 flex h-full w-full max-w-[48px] items-end justify-center">
                      {value > 0 ? (
                        <span
                          className={`pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 whitespace-nowrap ${
                            isSubmodule
                              ? "text-[8px] sm:text-[8.5px] font-bold tracking-tight"
                              : "text-[7.5px] sm:text-[8px] font-bold tracking-tight"
                          } transition-all group-hover/bar:-translate-y-0.5 sibs-graph-number-in ${
                            isInside ? "text-white" : "text-sibs-primary-1"
                          }`}
                          style={{
                            bottom: isInside
                              ? `calc(${height}% - ${isSubmodule ? 13 : 12}px)`
                              : `calc(${height}% + 3px)`,
                            animationDelay: `${Math.min(index * 60, 500)}ms`,
                          }}
                        >
                          {formatValue ? formatValue(value) : value}
                        </span>
                      ) : null}

                      {value > 0 ? (
                        <div
                          className={`w-full max-w-[42px] rounded-t-[3px] ${barColor} transition-all duration-200 ease-out group-hover/bar:-translate-y-0.5 group-hover/bar:brightness-110 shadow-xs sibs-graph-bar-rise`}
                          style={{
                            height: `${height}%`,
                            animationDelay: `${Math.min(index * 60, 500)}ms`,
                          }}
                        />
                      ) : null}

                      {/* Tooltip */}
                      {value > 0 ? (
                        <div
                          className={`pointer-events-none absolute top-2 z-50 hidden min-w-36 rounded-xl border border-sibs-tertiary-10/80 bg-white/95 p-2 shadow-xl backdrop-blur-md group-hover/bar:block ${
                            index <= 1
                              ? "left-0"
                              : index >= series.length - 2
                              ? "right-0"
                              : "left-1/2 -translate-x-1/2"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1">
                            <span className="truncate text-xs font-black text-sibs-primary-1">
                              {item.label}
                            </span>
                            {tooltipLabel ? (
                              <span className="text-[10px] font-bold text-sibs-tertiary-5">
                                {tooltipLabel}
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-1 flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-600">
                              {tooltipLabel || "Value"}:
                            </span>
                            <span className="font-extrabold text-sibs-primary-1">
                              {formatValue ? formatValue(value) : value}
                            </span>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })
            ) : null}
          </div>
        </div>
      </div>

      {/* X-Axis Labels */}
      <div className="shrink-0 flex w-full min-w-full pl-10 sm:pl-11 gap-1 px-1 select-none h-5 pt-0.5">
        {xAxisLabels.map((xLabel, idx) => (
          <div
            key={`${xLabel}-${idx}`}
            className="mt-0.5 min-w-0 flex-1 px-0.5 text-center"
          >
            <p className={`m-0 truncate ${isSubmodule ? "text-xs sm:text-[13px] font-extrabold" : "text-[10px] font-extrabold"} text-sibs-primary-1 leading-tight`}>
              {xLabel}
            </p>
          </div>
        ))}
      </div>

      {/* Optional Footnotes / Formulas (e.g. ACTUAL FTE, ATTRITED) */}
      {footerNotes.length > 0 ? (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 text-[9px] font-bold text-red-600 select-none border-t border-slate-100 pt-1.5 pl-10 sm:pl-11">
          {footerNotes.map((note, idx) => (
            <span key={idx} className="tracking-tight uppercase">
              {note}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * OccupancyKpiDashboard
 * - 4 Summary KPI Cards at the top
 * - Section 1: OCCUPANCY & UTILIZATION (Full-width standard ChartShell)
 * - Section 2: HEADCOUNT VS PEOPLE METRICS (Side-by-side standard ChartShells)
 */
export default function OccupancyKpiDashboard({
  data = {},
  showSummaryCards = true,
  isSubmodule = false,
  showFilters = true,
  onSectionClick = null,
} = {}) {
  const summary = data?.summary || {};
  const series = data?.series || [];

  const xAxisLabels =
    series.length > 0
      ? series.map((item) => item.label)
      : ["Week 18", "Week 19", "Week 20", "Week 21", "Week 22", "Week 23"];

  // Dynamic Headcount axis ticks if data exists
  const hasHcData = series.some((item) => Number(item.actualHeadcount || 0) > 0);
  const maxHc = hasHcData
    ? Math.max(1, ...series.map((item) => Number(item.actualHeadcount || 0)))
    : 100;
  const hcTicks = hasHcData
    ? getCallAxisTicks(maxHc, 4).map(String)
    : ["100", "80", "60", "40", "20", "0"];
  const hcMax = hasHcData
    ? Math.max(1, Number(hcTicks[0]))
    : 100;

  return (
    <div className={isSubmodule ? (showFilters ? "space-y-1.5 sm:space-y-2" : "space-y-2.5") : "flex-1 min-h-0 flex flex-col"}>
      {/* 1. Summary Cards */}
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
          showSummaryCards ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 pointer-events-none"
        }`}
      >
        <div className="overflow-hidden pb-1">
          <OccupancySummaryCards
            summary={summary}
            onCardClick={!isSubmodule ? onSectionClick : undefined}
          />
        </div>
      </div>

      {/* 2. Charts Section */}
      {isSubmodule ? (
        <>
          {/* Top Block: OCCUPANCY & UTILIZATION (Full-width for dedicated module view) */}
          <div
            className={`grid grid-cols-1 ${
              showFilters ? "gap-2 sm:gap-2.5" : "gap-3 sm:gap-3.5"
            } w-full min-w-0 transition-all duration-300 ease-in-out`}
          >
            <div className="col-span-1">
              <ChartShell
                title="Occupancy & Utilization"
                legend={
                  <>
                    <span className="inline-flex items-center gap-1 font-bold text-[#0b3b68]">
                      <i className="h-2 w-2 rounded-full bg-[#0b3b68]" />
                      Occupancy
                    </span>
                    <span className="inline-flex items-center gap-1 font-bold text-[#557da4]">
                      <i className="h-2 w-2 rounded-full bg-[#557da4]" />
                      Utilization
                    </span>
                  </>
                }
              >
                <ChartCanvasGrid
                  yAxisLabels={["100%", "80%", "60%", "40%", "20%", "0%"]}
                  xAxisLabels={xAxisLabels}
                  isSubmodule={isSubmodule}
                  showFilters={showFilters}
                  targetLine={85}
                  series={series}
                  barKey="occupancyPct"
                  barColor="bg-[#0b3b68]"
                  maxAxisValue={100}
                  formatValue={(val) => `${formatNumber(val, 2)}%`}
                  tooltipLabel="Occupancy"
                />
              </ChartShell>
            </div>
          </div>

          {/* Bottom Block: HEADCOUNT VS PEOPLE METRICS */}
          <div
            className={`grid grid-cols-1 lg:grid-cols-2 ${
              showFilters ? "gap-2 sm:gap-2.5" : "gap-3 sm:gap-3.5"
            } w-full min-w-0 transition-all duration-300 ease-in-out`}
          >
            {/* Left: Headcount Breakdown */}
            <div className="col-span-1">
              <ChartShell
                title="Headcount Metrics"
                legend={
                  <>
                    <span className="inline-flex items-center gap-1 font-bold text-[#0b3b68]">
                      <i className="h-2 w-2 rounded-full bg-[#0b3b68]" />
                      Required FTE
                    </span>
                    <span className="inline-flex items-center gap-1 font-bold text-[#2f6f9f]">
                      <i className="h-2 w-2 rounded-full bg-[#2f6f9f]" />
                      Actual HC
                    </span>
                    <span className="inline-flex items-center gap-1 font-bold text-[#557da4]">
                      <i className="h-2 w-2 rounded-full bg-[#557da4]" />
                      Buffer
                    </span>
                    <span className="inline-flex items-center gap-1 font-bold text-[#8faecb]">
                      <i className="h-2 w-2 rounded-full bg-[#8faecb]" />
                      Attrited
                    </span>
                  </>
                }
              >
                <ChartCanvasGrid
                  yAxisLabels={hcTicks}
                  xAxisLabels={xAxisLabels}
                  footerNotes={[]}
                  isSubmodule={isSubmodule}
                  showFilters={showFilters}
                  series={series}
                  barKey="actualHeadcount"
                  barColor="bg-[#2f6f9f]"
                  maxAxisValue={hcMax}
                  formatValue={(val) => `${formatNumber(val, 0)}`}
                  tooltipLabel="Actual HC"
                />
              </ChartShell>
            </div>

            {/* Right: People Metrics */}
            <div className="col-span-1">
              <ChartShell
                title="People Metrics"
                legend={
                  <>
                    <span className="inline-flex items-center gap-1 font-bold text-[#0b3b68]">
                      <i className="h-2 w-2 rounded-full bg-[#0b3b68]" />
                      Absenteeism %
                    </span>
                    <span className="inline-flex items-center gap-1 font-bold text-[#2f6f9f]">
                      <i className="h-2 w-2 rounded-full bg-[#2f6f9f]" />
                      Attrition %
                    </span>
                  </>
                }
              >
                <ChartCanvasGrid
                  yAxisLabels={["20%", "15%", "10%", "5%", "0%"]}
                  xAxisLabels={xAxisLabels}
                  footerNotes={[]}
                  isSubmodule={isSubmodule}
                  showFilters={showFilters}
                  series={series}
                  barKey={null}
                />
              </ChartShell>
            </div>
          </div>
        </>
      ) : (
        /* Unified 3-column row for Wow Report (All 4 Modules view) */
        <div
          style={!isSubmodule && showFilters ? { height: "200px", minHeight: "200px" } : undefined}
          className="grid grid-cols-1 md:grid-cols-3 grid-rows-1 gap-1 sm:gap-1.5 w-full min-w-0 flex-1 min-h-0 transition-all duration-300 ease-in-out"
        >
          {/* Chart 1: Occupancy & Utilization */}
          <div className="col-span-1 h-full min-h-0 flex flex-col">
            <ChartShell
              title="Occupancy & Utilization"
              tightLeft={!isSubmodule}
              onClick={!isSubmodule ? onSectionClick : undefined}
              legend={
                <>
                  <span className="inline-flex items-center gap-1 font-bold text-[#0b3b68]">
                    <i className="h-2 w-2 rounded-full bg-[#0b3b68]" />
                    Occupancy
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold text-[#557da4]">
                    <i className="h-2 w-2 rounded-full bg-[#557da4]" />
                    Utilization
                  </span>
                </>
              }
            >
              <ChartCanvasGrid
                yAxisLabels={["100%", "80%", "60%", "40%", "20%", "0%"]}
                xAxisLabels={xAxisLabels}
                isSubmodule={false}
                showFilters={showFilters}
                targetLine={85}
                series={series}
                barKey="occupancyPct"
                barColor="bg-[#0b3b68]"
                maxAxisValue={100}
                formatValue={(val) => `${formatNumber(val, 2)}%`}
                tooltipLabel="Occupancy"
              />
            </ChartShell>
          </div>

          {/* Chart 2: Headcount Metrics */}
          <div className="col-span-1 h-full min-h-0 flex flex-col">
            <ChartShell
              title="Headcount Metrics"
              tightLeft={!isSubmodule}
              onClick={!isSubmodule ? onSectionClick : undefined}
              legend={
                <>
                  <span className="inline-flex items-center gap-1 font-bold text-[#0b3b68]">
                    <i className="h-2 w-2 rounded-full bg-[#0b3b68]" />
                    Required FTE
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold text-[#2f6f9f]">
                    <i className="h-2 w-2 rounded-full bg-[#2f6f9f]" />
                    Actual HC
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold text-[#557da4]">
                    <i className="h-2 w-2 rounded-full bg-[#557da4]" />
                    Buffer
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold text-[#8faecb]">
                    <i className="h-2 w-2 rounded-full bg-[#8faecb]" />
                    Attrited
                  </span>
                </>
              }
            >
              <ChartCanvasGrid
                yAxisLabels={hcTicks}
                xAxisLabels={xAxisLabels}
                footerNotes={[]}
                isSubmodule={false}
                showFilters={showFilters}
                series={series}
                barKey="actualHeadcount"
                barColor="bg-[#2f6f9f]"
                maxAxisValue={hcMax}
                formatValue={(val) => `${formatNumber(val, 0)}`}
                tooltipLabel="Actual HC"
              />
            </ChartShell>
          </div>

          {/* Chart 3: People Metrics */}
          <div className="col-span-1 h-full min-h-0 flex flex-col">
            <ChartShell
              title="People Metrics"
              tightLeft={!isSubmodule}
              onClick={!isSubmodule ? onSectionClick : undefined}
              legend={
                <>
                  <span className="inline-flex items-center gap-1 font-bold text-[#0b3b68]">
                    <i className="h-2 w-2 rounded-full bg-[#0b3b68]" />
                    Absenteeism %
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold text-[#2f6f9f]">
                    <i className="h-2 w-2 rounded-full bg-[#2f6f9f]" />
                    Attrition %
                  </span>
                </>
              }
            >
              <ChartCanvasGrid
                yAxisLabels={["20%", "15%", "10%", "5%", "0%"]}
                xAxisLabels={xAxisLabels}
                footerNotes={[]}
                isSubmodule={false}
                showFilters={showFilters}
                series={series}
                barKey={null}
              />
            </ChartShell>
          </div>
        </div>
      )}
    </div>
  );
}
