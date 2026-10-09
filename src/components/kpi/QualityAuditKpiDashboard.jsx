import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Award, ClipboardCheck, Mail, PhoneCall, Users } from "lucide-react";
import { ChartShell } from "./CallKpiDashboard.jsx";
import { getCallAxisTicks } from "./callKpiDashboardUtils.js";

function formatNumber(value, digits = 0) {
  const number = Number(value || 0);
  return number.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatPercent(value) {
  const number = Number(value || 0);
  if (number >= 100 || number.toFixed(2) === "100.00") return "100%";
  return `${formatNumber(value, 2)}%`;
}

function EmptyChart({ message, isSubmodule = false, showFilters = true }) {
  const emptyHeightStyle = isSubmodule
    ? {
        height: showFilters
          ? "clamp(340px, calc(100vh - 290px), 720px)"
          : "clamp(440px, calc(100vh - 170px), 860px)",
      }
    : undefined;

  return (
    <div
      className={`flex ${!isSubmodule ? "h-[75px] sm:h-[85px]" : ""} items-center justify-center rounded-xl border border-dashed border-sibs-tertiary-8 bg-sibs-tertiary-10/30 px-4 text-center text-xs font-semibold text-sibs-tertiary-5`}
      style={emptyHeightStyle}
    >
      {message}
    </div>
  );
}

function getTooltipPositionClass(index, total) {
  if (index <= 1) return "left-0";
  if (index >= total - 2) return "right-0";
  return "left-1/2 -translate-x-1/2";
}

function QaTransactionsChart({
  series = [],
  period,
  hideLegend = false,
  isSubmodule = false,
  showFilters = true,
}) {
  if (!series.length) {
    return (
      <EmptyChart
        message="No Quality Audit transactions are available for this reporting range."
        isSubmodule={isSubmodule}
        showFilters={showFilters}
      />
    );
  }

  const maxValue = Math.max(1, ...series.map((item) => Number(item.qaTransactions || 0)));
  const axisTicks = getCallAxisTicks(maxValue, 4);
  const axisMax = Math.max(1, axisTicks[0] || maxValue);
  const minPeriodWidth = 86;
  const isScrollable = series.length > 6 || period === "custom";
  const scrollContainerRef = useRef(null);

  useLayoutEffect(() => {
    if (isScrollable && scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
      const timeoutId = setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
        }
      }, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [series, isScrollable]);

  const chartHeightStyle = isSubmodule
    ? {
        height: showFilters
          ? "clamp(340px, calc(100vh - 290px), 720px)"
          : "clamp(440px, calc(100vh - 170px), 860px)",
      }
    : undefined;

  const maxTickCharLength = Math.max(
    ...axisTicks.map((t) => formatNumber(t).length),
    1,
  );

  return (
    <div className={`w-full min-w-0 select-none ${!isSubmodule ? "flex-1 min-h-0 flex flex-col justify-between" : ""}`}>
      {!hideLegend ? (
        <div className="mb-1 flex items-center justify-between gap-2 text-xs font-bold text-sibs-tertiary-5 shrink-0">
          <span className="inline-flex items-center gap-1.5">
            <i className="inline-block h-2.5 w-2.5 rounded-full bg-[#174f7f]" />
            Audits
          </span>
        </div>
      ) : null}

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
            {axisTicks.map((tick, index) => (
              <span
                key={`${tick}-${index}`}
                className={`absolute right-1 ${
                  index === 0
                    ? "translate-y-0"
                    : index === axisTicks.length - 1
                    ? "-translate-y-full"
                    : "-translate-y-1/2"
                } whitespace-nowrap ${isSubmodule ? "text-[11px] sm:text-xs font-bold" : "text-[8.5px] font-bold"} text-sibs-tertiary-5 leading-none`}
                style={{ top: `${(index / Math.max(axisTicks.length - 1, 1)) * 100}%` }}
              >
                {formatNumber(tick)}
              </span>
            ))}
          </div>
          {!isSubmodule && <div className="shrink-0 h-5 border-r border-sibs-tertiary-8" />}
        </div>

        {/* Scrollable Bars Area */}
        <div
          ref={scrollContainerRef}
          className={`relative min-w-0 flex-1 ${isScrollable ? "overflow-x-auto pb-1 sibs-chart-scrollbar" : "overflow-hidden"} overflow-y-hidden ${!isSubmodule ? "h-full flex flex-col" : ""}`}
        >
          <div className={`relative min-w-full ${isScrollable ? "w-max" : "w-full"} ${!isSubmodule ? "flex-1 min-h-0 flex flex-col" : ""}`}>
            <div
              className={`relative flex min-w-0 items-end gap-1.5 border-b border-sibs-tertiary-8 px-2 sm:gap-2 transition-all duration-300 ease-in-out ${!isSubmodule ? "flex-1 min-h-0" : ""}`}
              style={chartHeightStyle}
            >
              {/* Horizontal Gridlines */}
              <div className="pointer-events-none absolute inset-0">
                {axisTicks.map((tick, index) => (
                  <div
                    key={`${tick}-${index}`}
                    className="absolute left-0 right-0 border-t border-sibs-tertiary-9"
                    style={{ top: `${(index / Math.max(axisTicks.length - 1, 1)) * 100}%` }}
                  />
                ))}
              </div>

              {series.map((item, index) => {
                const value = Number(item.qaTransactions || 0);
                const height = value > 0 ? Math.max(2, (value / axisMax) * 100) : 0;
                const isInside = height > (isSubmodule ? 7 : 11);

                return (
                  <div
                    key={item.key || index}
                    className="group/period relative z-10 hover:z-50 flex h-full min-w-0 flex-1 items-end justify-center px-0.5"
                    style={isScrollable ? { minWidth: `${minPeriodWidth}px` } : undefined}
                  >
                    <div className={`group/bar relative hover:z-50 flex h-full w-full ${isSubmodule ? "max-w-[70px]" : "max-w-[50px]"} items-end justify-center`}>
                      {value > 0 ? (
                        <span
                          className={`pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 whitespace-nowrap ${isSubmodule ? "text-[11px] sm:text-xs 2xl:text-[13px] font-extrabold" : "text-[8.5px] sm:text-[9px] font-bold"} transition-all group-hover/bar:-translate-y-0.5 sibs-graph-number-in ${
                            isInside ? "text-white drop-shadow-xs" : "text-sibs-primary-1"
                          }`}
                          style={{
                            bottom: isInside ? `calc(${height}% - ${isSubmodule ? 22 : 17}px)` : `calc(${height}% + 4px)`,
                            animationDelay: `${Math.min(index * 60, 500)}ms`,
                          }}
                        >
                          {formatNumber(value)}
                        </span>
                      ) : null}

                      {/* Tooltip */}
                      <div
                        className={`pointer-events-none absolute top-3 z-50 hidden w-44 rounded-xl border border-sibs-tertiary-10/80 bg-white/95 p-2.5 shadow-xl backdrop-blur-md group-hover/bar:block ${getTooltipPositionClass(index, series.length)}`}
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
                          <span className="semibold text-slate-500">QA Score:</span>
                          <span className="font-extrabold text-sibs-primary-1">{formatNumber(item.qaScorePct, 2)}%</span>
                        </div>
                      </div>

                      <div
                        className={`w-full ${isSubmodule ? "max-w-[70px]" : "max-w-[50px]"} rounded-t-[5px] bg-[#174f7f] shadow-xs transition-all duration-200 group-hover/bar:-translate-y-0.5 group-hover/bar:brightness-110 sibs-graph-bar-rise`}
                        style={{
                          height: `${height}%`,
                          animationDelay: `${Math.min(index * 60, 500)}ms`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Period Labels */}
            <div className="shrink-0 flex w-full min-w-full gap-1.5 px-2">
              {series.map((item, index) => (
                <div
                  key={item.key || index}
                  className="mt-1 min-w-0 flex-1 px-0.5 text-center"
                  style={isScrollable ? { minWidth: `${minPeriodWidth}px` } : undefined}
                >
                  <p className={`m-0 truncate ${isSubmodule ? "text-[10px] sm:text-[11px] font-bold tracking-tight" : "text-[9px] sm:text-[9.5px] font-bold tracking-tight"} text-sibs-primary-1 leading-tight`} title={item.label}>
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function QaScoreChart({
  series = [],
  period,
  hideLegend = false,
  isSubmodule = false,
  showFilters = true,
}) {
  if (!series.length) {
    return (
      <EmptyChart
        message="No Quality Audit score is available for this reporting range."
        isSubmodule={isSubmodule}
        showFilters={showFilters}
      />
    );
  }

  const [hoveredData, setHoveredData] = useState(null);
  const containerRef = useRef(null);
  const displaySeries = useMemo(() => [...series].reverse(), [series]);
  const isScrollable = series.length > 6 || period === "custom";

  const handleMouseEnter = (item, score, e) => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const rowRect = e.currentTarget.getBoundingClientRect();
    const tooltipHeight = 78;

    const spaceAbove = rowRect.top - containerRect.top;
    const spaceBelow = containerRect.bottom - rowRect.bottom;

    let top;
    // Prefer placing tooltip above if there is enough space
    if (spaceAbove >= tooltipHeight + 6) {
      top = spaceAbove - tooltipHeight - 4;
    } 
    // If not enough space above (e.g. top rows like Week 41, Week 40), place it below the hovered row!
    else if (spaceBelow >= tooltipHeight + 6) {
      top = (rowRect.bottom - containerRect.top) + 4;
    } 
    // Fallback: clamp safely within container boundaries
    else {
      top = Math.max(4, Math.min(spaceAbove, containerRect.height - tooltipHeight - 4));
    }

    const left = Math.max(
      8,
      Math.min(rowRect.left - containerRect.left + 75, containerRect.width - 188),
    );

    setHoveredData({
      item,
      score,
      top: Math.max(4, top),
      left,
    });
  };

  const handleMouseLeave = () => {
    setHoveredData(null);
  };

  // Responsive height matching QaTransactionsChart perfectly
  const chartHeightStyle = isSubmodule
    ? {
        height: showFilters
          ? "clamp(340px, calc(100vh - 290px), 720px)"
          : "clamp(440px, calc(100vh - 170px), 860px)",
      }
    : undefined;

  const maxLabelLength = Math.max(
    ...displaySeries.map((s) => (s.label || "").length),
    1,
  );
  const labelWidthPx = isSubmodule
    ? (isScrollable ? 92 : 80)
    : Math.max(48, Math.ceil(maxLabelLength * 7.5 + 4));

  // Dynamic bar height: thick and chunky in submodule, visible and well-proportioned in Wow Report
  const barHeightClass = isSubmodule
    ? isScrollable
      ? "h-12 sm:h-14"
      : series.length <= 4
      ? "h-16 sm:h-20"
      : series.length <= 6
      ? "h-12 sm:h-14 2xl:h-16"
      : "h-10 sm:h-12"
    : "h-4.5 sm:h-5";

  const labelTextClass = isSubmodule ? "text-[10px] sm:text-[11px] font-bold tracking-tight" : "text-[9px] sm:text-[9.5px] font-bold tracking-tight";
  const scoreTextClass = isSubmodule ? "text-xs sm:text-[13px] font-extrabold" : "text-[10px] sm:text-[10.5px] font-extrabold";

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col h-full flex-1 min-h-0 justify-between"
    >
      {!hideLegend ? (
        <div className="mb-1 flex items-center justify-between gap-2 text-xs font-bold text-sibs-tertiary-5 shrink-0">
          <span className="inline-flex items-center gap-1.5">
            <i className="inline-block h-2.5 w-2.5 rounded-full bg-[#42719b]" />
            Audit Score
          </span>
        </div>
      ) : null}

      {/* Floating Hover Tooltip (Styled Same Like The Others) */}
      {hoveredData && (
        <div
          className="pointer-events-none absolute z-50 w-44 rounded-xl border border-sibs-tertiary-10/80 bg-white/95 p-2.5 shadow-xl backdrop-blur-md transition-all duration-75"
          style={{
            top: `${hoveredData.top}px`,
            left: `${hoveredData.left}px`,
          }}
        >
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-1">
            <span className="truncate text-xs font-black text-sibs-primary-1">
              {hoveredData.item.label}
            </span>
            <span className="text-[10px] font-bold text-sibs-tertiary-5">
              QA Score
            </span>
          </div>

          <div className="mt-1.5 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-bold text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-[#42719b]" />
              QA Score:
            </span>
            <span className="font-extrabold text-sibs-primary-1">
              {formatNumber(hoveredData.score, 2)}%
            </span>
          </div>

          <div className="mt-1 flex items-center justify-between border-t border-slate-100 pt-1 text-[11px]">
            <span className="font-semibold text-slate-500">Audits:</span>
            <span className="font-extrabold text-sibs-primary-1">
              {formatNumber(hoveredData.item.qaTransactions)}
            </span>
          </div>
        </div>
      )}

      {/* Bars Area (Expands to fill available space evenly or scrolls if long) */}
      <div
        onScroll={handleMouseLeave}
        className={`relative min-h-0 w-full ${
          isScrollable
            ? "overflow-y-auto overflow-x-hidden pr-1.5 sibs-chart-scrollbar py-0.5"
            : "flex flex-col justify-evenly py-0.5 overflow-visible"
        } flex-1 min-h-0 h-full transition-all duration-300 ease-in-out`}
        style={chartHeightStyle}
      >
        <div
          className={`min-w-0 h-full flex-1 ${
            isScrollable
              ? "flex flex-col gap-2.5 sm:gap-3 pb-2"
              : "flex-1 flex flex-col justify-between py-0.5"
          }`}
        >
          {displaySeries.map((item, index) => {
            const score = Math.max(0, Math.min(100, Number(item.qaScorePct || 0)));
            return (
              <div
                key={item.key || index}
                className="group/score grid items-center gap-2 cursor-pointer shrink-0"
                style={{
                  gridTemplateColumns: `${labelWidthPx}px minmax(0, 1fr)`,
                  ...(isScrollable && isSubmodule
                    ? { minHeight: "clamp(46px, calc((100vh - 450px) / 6.2), 68px)" }
                    : isScrollable
                    ? { minHeight: "34px" }
                    : undefined),
                }}
                onMouseEnter={(e) => handleMouseEnter(item, score, e)}
                onMouseLeave={handleMouseLeave}
              >
                <span
                  className={`whitespace-nowrap ${labelTextClass} text-sibs-primary-1 truncate`}
                  title={item.label}
                >
                  {item.label}
                </span>
                <div className={`relative ${barHeightClass} overflow-hidden rounded-md bg-slate-100 border border-slate-200/70 shadow-inner`}>
                  <div
                    className="flex h-full min-w-0 items-center justify-end rounded-md bg-[#42719b] px-2 transition-all duration-200 group-hover/score:brightness-110 shadow-2xs sibs-graph-bar-grow-x"
                    style={{
                      width: `${score}%`,
                      animationDelay: `${Math.min(index * 60, 500)}ms`,
                    }}
                  >
                    {score >= 20 ? (
                      <span
                        className={`whitespace-nowrap ${scoreTextClass} text-white drop-shadow-xs sibs-graph-number-in`}
                        style={{ animationDelay: `${Math.min(index * 60, 500)}ms` }}
                      >
                        {formatNumber(score, 2)}%
                      </span>
                    ) : null}
                  </div>
                  {score < 20 ? (
                    <span
                      className={`absolute top-1/2 -translate-y-1/2 whitespace-nowrap ${scoreTextClass} text-sibs-primary-1 sibs-graph-number-in`}
                      style={{
                        left: `calc(${score}% + 6px)`,
                        animationDelay: `${Math.min(index * 60, 500)}ms`,
                      }}
                    >
                      {formatNumber(score, 2)}%
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Axis Scale fixed at bottom, aligned with bar start */}
      <div
        className="mt-1 border-t border-slate-200/80 pt-1 shrink-0"
        style={{
          paddingLeft: `${labelWidthPx + 8}px`,
        }}
      >
        <div className="flex justify-between text-[9px] sm:text-[9.5px] font-bold text-sibs-tertiary-5">
          {[0, 20, 40, 60, 80, 100].map((tick) => (
            <span key={tick}>{tick}%</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function QualityAuditSummaryCards({ summary = {}, title = "Quality Audit", onCardClick = null }) {
  const cards = [
    {
      label: "Audit Volume",
      value: formatNumber(summary.qaTransactions),
      icon: ClipboardCheck,
      hint: (
        <span>
          Evaluated by <strong className="font-extrabold text-slate-900">QA Team</strong>
        </span>
      ),
      rawHint: "Evaluated by QA Team",
    },
    {
      label: "Call Audits",
      value: formatNumber(summary.callAudits ?? 0),
      icon: PhoneCall,
      hint: "Voice interactions audited",
    },
    {
      label: "Case Audits",
      value: formatNumber(summary.caseAudits ?? 0),
      icon: Mail,
      hint: "Case & email audits",
    },
    {
      label: "Audited Agents",
      value: formatNumber(summary.auditedAgents ?? 0),
      icon: Users,
      hint: (
        <span>
          Distinct <strong className="font-extrabold text-slate-900">SiBS Employees</strong>
        </span>
      ),
      rawHint: "Distinct SiBS Employees",
    },
    {
      label: "Avg QA Score",
      value: formatPercent(summary.qaScorePct),
      icon: Award,
      hint: "Average Total Audit Score",
    },
  ];

  return (
    <div>
      {title ? (
        <div className="flex items-center gap-1.5 mb-1 px-0.5">
          <span className="flex items-center gap-1 text-[10px] sm:text-[10.5px] font-black uppercase tracking-wider text-sibs-primary-1">
            <ClipboardCheck size={11} className="text-sibs-primary-1" />
            {title}
          </span>
          <div className="h-px flex-1 bg-slate-200/70" />
        </div>
      ) : null}
      <div className="grid grid-cols-2 gap-1.5 sm:gap-2 sm:grid-cols-3 xl:grid-cols-5">
        {cards.map(({ label, value, icon: Icon, hint, rawHint }, idx) => (
          <div key={label} className={idx === cards.length - 1 ? "col-span-2 sm:col-span-1 xl:col-span-1" : ""}>
            <article
              onClick={onCardClick || undefined}
              className={`sibs-card rounded-xl min-w-0 px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-2xs h-full flex flex-col justify-between gap-1 transition-all duration-150 hover:border-sibs-primary-1/30 ${
                onCardClick ? "cursor-pointer" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="truncate text-[9px] xl:text-[9.5px] font-extrabold uppercase tracking-wider text-sibs-tertiary-5 leading-none">{label}</span>
                <span className="rounded p-0.5 text-sibs-tertiary-5/80 shrink-0"><Icon size={12} /></span>
              </div>
              <div className="text-base sm:text-lg xl:text-[19px] font-black text-sibs-primary-1 truncate leading-none">{value}</div>
              <p
                className="m-0 truncate text-[9px] xl:text-[9.5px] font-bold text-sibs-tertiary-5 leading-tight"
                title={rawHint || (typeof hint === "string" ? hint : undefined)}
              >
                {hint}
              </p>
            </article>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function QualityAuditKpiDashboard({
  data = {},
  period,
  showSummaryCards = true,
  isSubmodule = false,
  showFilters = true,
  onSectionClick = null,
}) {
  const series = Array.isArray(data.series) ? data.series : [];
  const currentPeriod = period || data.filters?.period || data.data?.filters?.period;

  return (
    <section className={isSubmodule ? "space-y-1.5 sm:space-y-2" : "flex-1 min-h-0 flex flex-col"}>
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
          showSummaryCards ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 pointer-events-none"
        }`}
      >
        <div className="overflow-hidden pb-1">
          <QualityAuditSummaryCards
            summary={data.summary || {}}
            onCardClick={!isSubmodule ? onSectionClick : undefined}
          />
        </div>
      </div>

      <div
        style={!isSubmodule && showFilters ? { height: "200px", minHeight: "200px" } : undefined}
        className={`grid grid-cols-1 ${!isSubmodule ? "gap-1 sm:gap-1.5 grid-rows-1" : "gap-3.5"} md:grid-cols-2 flex-1 min-h-0 w-full`}
      >
        <div className="col-span-1 h-full min-h-0 flex flex-col">
          <ChartShell
            title="QA Transactions"
            tightLeft={!isSubmodule}
            onClick={!isSubmodule ? onSectionClick : undefined}
            legend={
              <span className="inline-flex items-center gap-1 font-bold text-[#174f7f]">
                <i className="h-2 w-2 rounded-full bg-[#174f7f]" />
                Audits
              </span>
            }
          >
            <QaTransactionsChart
              series={series}
              period={currentPeriod}
              hideLegend={true}
              isSubmodule={isSubmodule}
              showFilters={showFilters}
            />
          </ChartShell>
        </div>
        <div className="col-span-1 h-full min-h-0 flex flex-col">
          <ChartShell
            title="QA Score"
            tightLeft={!isSubmodule}
            onClick={!isSubmodule ? onSectionClick : undefined}
            legend={
              <span className="inline-flex items-center gap-1 font-bold text-[#557da4]">
                <i className="h-2 w-2 rounded-full bg-[#557da4]" />
                Audit Score
              </span>
            }
          >
            <QaScoreChart
              series={series}
              period={currentPeriod}
              hideLegend={true}
              isSubmodule={isSubmodule}
              showFilters={showFilters}
            />
          </ChartShell>
        </div>
      </div>
    </section>
  );
}

export { QualityAuditSummaryCards };
