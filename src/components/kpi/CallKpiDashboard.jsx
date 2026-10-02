import { CheckCircle2, Clock3, Gauge, PhoneCall } from "lucide-react";
import {
  buildVolumeBarItems,
  convertDurationToSeconds,
  getCallAxisTicks,
} from "./callKpiDashboardUtils.js";

function formatNumber(value, digits = 0) {
  const number = Number(value || 0);
  return number.toLocaleString(undefined, { maximumFractionDigits: digits });
}

function formatGraphNumber(value, digits = 0) {
  const number = Number(value || 0);
  return digits > 0 ? number.toFixed(digits) : String(Math.round(number));
}

function formatPercent(value) {
  const number = Number(value || 0);
  if (number >= 100 || number.toFixed(2) === "100.00") return "100%";
  return `${formatNumber(value, 2)}%`;
}

function formatDuration(seconds) {
  const value = Number(seconds || 0);
  const minutes = Math.floor(value / 60);
  const remainingSeconds = Math.round(value % 60);

  return minutes > 0
    ? `${minutes}m ${String(remainingSeconds).padStart(2, "0")}s`
    : `${remainingSeconds}s`;
}

function getTooltipPositionClass(periodIndex, seriesLength) {
  if (periodIndex === 0) return "left-0";
  if (periodIndex >= seriesLength - 1) return "right-0";
  return "left-1/2 -translate-x-1/2";
}

function KpiCard({ icon: Icon, label, value, hint, status, title }) {
  return (
    <article className="sibs-card rounded-xl min-w-0 px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-2xs flex flex-col justify-between gap-1 transition-all duration-150 hover:border-sibs-primary-1/30">
      {/* 1. Header: Label + Icon */}
      <div className="flex items-center justify-between gap-1 min-w-0">
        <span
          className="m-0 text-[9px] xl:text-[9.5px] font-extrabold uppercase tracking-wider text-sibs-tertiary-5 leading-none truncate"
          title={title || label}
        >
          {label}
        </span>
        <div className="rounded p-0.5 text-sibs-tertiary-5/80 shrink-0">
          <Icon size={12} />
        </div>
      </div>

      {/* 2. Value + Badge & Hint */}
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
            title={typeof hint === "string" ? hint : undefined}
          >
            {hint}
          </p>
        ) : null}
      </div>
    </article>
  );
}

function ChartShell({ title, subtitle, legend, children }) {
  return (
    <article className="sibs-card relative z-10 flex flex-col h-full shadow-xs">
      <div className="border-b border-sibs-tertiary-10 bg-sibs-primary-3/30 px-3 py-1 sm:px-3 sm:py-1 rounded-t-xl">
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <h3 className="m-0 text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.1em] text-sibs-primary-1 truncate">
            {title}
          </h3>

          {legend ? (
            <div className="inline-flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[9.5px]">
              {legend}
            </div>
          ) : null}
        </div>

        {subtitle ? (
          <div className="mt-0.5 text-[10px] sm:text-[10.5px] text-sibs-tertiary-5 leading-tight">
            <span>{subtitle}</span>
          </div>
        ) : null}
      </div>

      <div className="p-1.5 sm:p-2 pb-1.5 flex-1 flex flex-col min-w-0 overflow-visible relative z-20">
        {children}
      </div>
    </article>
  );
}

function EmptyChart({ message = "No KPI data is available for this reporting range.", isSubmodule = false, showFilters = true }) {
  const emptyHeightStyle = isSubmodule
    ? {
        minHeight: showFilters
          ? "clamp(140px, calc(50vh - 225px), 220px)"
          : "clamp(220px, calc(50vh - 150px), 320px)",
      }
    : { minHeight: "208px" };

  return (
    <div
      className="flex items-center justify-center rounded-xl border border-dashed border-sibs-tertiary-8 bg-sibs-tertiary-10/30 px-3 text-center text-xs font-semibold text-sibs-tertiary-5 transition-all duration-300 ease-in-out"
      style={emptyHeightStyle}
    >
      {message}
    </div>
  );
}

function VolumeChart({ series, period, hideLegend = false, isSubmodule = false, showFilters = true }) {
  if (!series.length) return <EmptyChart message="No call volume recorded for this reporting range." isSubmodule={isSubmodule} showFilters={showFilters} />;

  const totalVolume = series.reduce(
    (acc, item) => acc + Number(item.callsOffered || 0),
    0,
  );

  if (totalVolume === 0) {
    return <EmptyChart message="No call volume recorded for this reporting range." isSubmodule={isSubmodule} showFilters={showFilters} />;
  }

  const maxValue = Math.max(
    1,
    ...series.flatMap((item) => [
      item.callsOffered,
      item.callsHandled,
      item.handledWithinSla,
    ]),
  );

  const axisTicks = getCallAxisTicks(maxValue, 4);
  const axisMax = Math.max(1, axisTicks[0] || maxValue);
  const minPeriodWidth = 84;
  const isScrollable = series.length > 6;

  const chartHeightStyle = isSubmodule
    ? {
        height: showFilters
          ? "clamp(140px, calc(50vh - 225px), 220px)"
          : "clamp(220px, calc(50vh - 150px), 320px)",
      }
    : undefined;

  return (
    <div className="w-full min-w-0 select-none">
      {!hideLegend ? (
        <div className="mb-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs font-bold text-sibs-tertiary-5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1.5">
              <i className="inline-block h-2.5 w-2.5 rounded-full bg-[#0b3b68]" />
              Volume
            </span>

            <span className="inline-flex items-center gap-1.5">
              <i className="inline-block h-2.5 w-2.5 rounded-full bg-[#2f6f9f]" />
              Handled
            </span>

            <span className="inline-flex items-center gap-1.5">
              <i className="inline-block h-2.5 w-2.5 rounded-full bg-[#4c9aca]" />
              Handled w/SLA
            </span>
          </div>
        </div>
      ) : null}

      <div className="flex w-full min-w-0">
        <div
          className={`relative ${!isSubmodule ? "h-[190px] sm:h-[208px]" : ""} w-10 sm:w-11 shrink-0 border-r border-sibs-tertiary-8 pr-1 bg-white z-10 transition-all duration-300 ease-in-out`}
          style={chartHeightStyle}
        >
          {axisTicks.map((tick, index) => (
            <span
              key={`${tick}-${index}`}
              className={`absolute right-1 -translate-y-1/2 ${isSubmodule ? "text-[10px] sm:text-[11px] font-bold" : "text-[10px] font-semibold"} text-sibs-tertiary-5`}
              style={{
                top: `${(index / (axisTicks.length - 1)) * 100}%`,
              }}
            >
              {formatGraphNumber(tick)}
            </span>
          ))}
        </div>

        <div className={`relative min-w-0 flex-1 ${isScrollable ? "overflow-x-auto pb-1 sibs-chart-scrollbar" : "overflow-hidden"} overflow-y-hidden`}>
          <div className={`relative min-w-full ${isScrollable ? "w-max" : "w-full"}`}>
            <div
              className={`relative flex ${!isSubmodule ? "h-[190px] sm:h-[208px]" : ""} min-w-0 items-end gap-1 border-b border-sibs-tertiary-8 px-1 transition-all duration-300 ease-in-out`}
              style={chartHeightStyle}
            >
              {/* Horizontal Gridlines spanning 100% of the bars container */}
              <div className="pointer-events-none absolute inset-0">
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

              {series.map((item, periodIndex) => {
                return (
                  <div
                    key={item.key || periodIndex}
                    className="group/period relative z-10 hover:z-50 flex h-full min-w-0 flex-1 items-end justify-center px-0.5"
                    style={isScrollable ? { minWidth: `${minPeriodWidth}px` } : undefined}
                  >
                  {/* Clustered 3-bar group with chunky width matching the 5-day daily view */}
                  <div className={`flex h-full w-full ${isSubmodule ? "max-w-[170px]" : "max-w-[120px]"} items-end justify-center gap-0`}>
                    {buildVolumeBarItems(item).map(
                      ({ metric, value, className }, barIndex) => {
                        const numericValue = Number(value || 0);

                        const heightPercent =
                          numericValue > 0
                            ? Math.max(2, (numericValue / axisMax) * 100)
                            : 0;

                        // Middle bar (Handled) is elevated cleanly above the Volume bar so it never touches adjacent labels
                        // Side bars (Volume & Handled w/SLA) rest neatly above their bar caps
                        const isInsideBar = heightPercent > (isSubmodule ? 7 : 10);
                        const labelBottom = isInsideBar
                          ? `calc(${heightPercent}% - ${isSubmodule ? 16 : 14}px)`
                          : `calc(${heightPercent}% + 3px)`;

                        return (
                          <div
                            key={metric}
                            className="group/bar relative hover:z-50 flex h-full min-w-0 flex-1 items-end justify-center"
                            aria-label={`${item.label} ${metric}: ${formatGraphNumber(
                              numericValue,
                            )}`}
                          >
                            {numericValue > 0 ? (
                              <span
                                className={`pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 whitespace-nowrap ${isSubmodule ? "text-[8.5px] sm:text-[9px] font-semibold" : "text-[8px] sm:text-[8.5px] 2xl:text-[9px] font-medium"} tracking-tight transition-all duration-200 group-hover/bar:-translate-y-0.5 sibs-graph-number-in ${
                                  isInsideBar
                                    ? "text-white drop-shadow-xs"
                                    : "text-sibs-primary-1"
                                }`} 
                                style={{
                                  bottom: labelBottom,
                                  animationDelay: `${Math.min(periodIndex * 80 + barIndex * 40, 650)}ms`,
                                }}
                              >
                                {formatGraphNumber(numericValue)}
                              </span>
                            ) : null}

                          {/* Tooltip Modal */}
                          <div
                            className={`pointer-events-none absolute top-3 z-50 hidden w-44 max-w-[calc(100vw-2rem)] rounded-xl border border-sibs-tertiary-10/80 bg-white/95 p-2.5 shadow-xl backdrop-blur-md group-hover/bar:block ${getTooltipPositionClass(
                              periodIndex,
                              series.length,
                            )}`}
                          >
                            <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                              <span className="text-xs font-black text-sibs-primary-1">
                                {item.label}
                              </span>
                              <span className="text-[10px] font-bold text-sibs-tertiary-5">
                                {metric}
                              </span>
                            </div>

                            <div className="mt-1.5 flex items-center justify-between text-xs">
                              <span className="flex items-center gap-1.5 font-bold text-slate-600">
                                <span
                                  className={`h-2.5 w-2.5 rounded-full ${
                                    metric === "Volume"
                                      ? "bg-[#0b3b68]"
                                      : metric === "Handled"
                                      ? "bg-[#2f6f9f]"
                                      : "bg-[#4c9aca]"
                                  }`}
                                />
                                Calls:
                              </span>
                              <span className="font-extrabold text-sibs-primary-1">
                                {formatGraphNumber(numericValue)}
                              </span>
                            </div>

                            {metric !== "Volume" &&
                              Number(item.callsOffered || 0) > 0 && (
                                <div className="mt-1 flex items-center justify-between border-t border-slate-100 pt-1 text-[11px]">
                                  <span className="font-semibold text-slate-500">
                                    Rate:
                                  </span>
                                  <span className="font-extrabold text-sibs-primary-1">
                                    {formatPercent(
                                      (numericValue /
                                        Number(item.callsOffered)) *
                                        100,
                                    )}
                                  </span>
                                </div>
                              )}
                          </div>

                          <div
                            className={`w-full ${isSubmodule ? "max-w-[46px]" : "max-w-[42px]"} rounded-t-[4px] ${className} transition-all duration-200 ease-out group-hover/bar:-translate-y-0.5 group-hover/bar:brightness-110 shadow-xs sibs-graph-bar-rise`}
                            style={{
                              height: `${heightPercent}%`,
                              animationDelay: `${Math.min(periodIndex * 80 + barIndex * 40, 650)}ms`,
                            }}
                          />
                        </div>
                      );
                    },
                  )}
                </div>
              </div>
            );
          })}
          </div>

          <div className="flex w-full min-w-full gap-1 px-1">
            {series.map((item, periodIndex) => (
              <div
                key={item.key || periodIndex}
                className="mt-1.5 min-w-0 flex-1 px-0.5 text-center"
                style={isScrollable ? { minWidth: `${minPeriodWidth}px` } : undefined}
              >
                <p
                  className={`m-0 truncate ${isSubmodule ? "text-xs sm:text-[13px] font-extrabold" : "text-[10.5px] font-extrabold"} text-sibs-primary-1 leading-tight`}
                  title={item.label}
                >
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

function LineChart({ series, target = 90, period, hideLegend = false, isSubmodule = false, showFilters = true }) {
  if (!series.length) return <EmptyChart message="No answer rate or service level data available for this reporting range." isSubmodule={isSubmodule} showFilters={showFilters} />;

  const activeSeries = series.filter(
    (item) => Number(item.callsOffered || 0) > 0,
  );

  if (activeSeries.length === 0) {
    return (
      <EmptyChart message="No answer rate or service level data available for this reporting range." isSubmodule={isSubmodule} showFilters={showFilters} />
    );
  }

  const numericTarget = Number(target || 90);
  const axisTicks = [100, 75, 50, 25, 0];

  const rateBarItems = (item) => [
    {
      metric: "Answer",
      value: Number(item.answerRatePct || 0),
      className: "bg-[#0b3b68]",
      color: "#0b3b68",
    },
    {
      metric: "Service Level",
      value: Number(item.serviceLevelPct || 0),
      className: "bg-[#0284c7]",
      color: "#0284c7",
    },
  ];

  const minPeriodWidth = 84;
  const isScrollable = series.length > 6;

  const chartHeightStyle = isSubmodule
    ? {
        height: showFilters
          ? "clamp(140px, calc(50vh - 225px), 220px)"
          : "clamp(220px, calc(50vh - 150px), 320px)",
      }
    : undefined;

  return (
    <div className="w-full min-w-0 select-none">
      {/* 1. Header Legend */}
      {!hideLegend ? (
        <div className="mb-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs font-bold text-sibs-tertiary-5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1.5 text-[#0b3b68]">
              <i className="h-2.5 w-2.5 rounded-full bg-[#0b3b68]" />
              Answer
            </span>

            <span className="inline-flex items-center gap-1.5 text-[#0284c7]">
              <i className="h-2.5 w-2.5 rounded-full bg-[#0284c7]" />
              Service Level
            </span>

            <span className="inline-flex items-center gap-1 text-red-500">
              <i className="inline-block h-0.5 w-3.5 bg-red-500 border-t border-dashed border-red-500" />
              Target: {numericTarget}%
            </span>
          </div>
        </div>
      ) : null}

      <div className="flex w-full min-w-0">
        {/* 2. Y-Axis Ticks */}
        <div
          className={`relative ${!isSubmodule ? "h-[190px] sm:h-[208px]" : ""} w-10 sm:w-11 shrink-0 border-r border-sibs-tertiary-8 pr-1 bg-white z-10 transition-all duration-300 ease-in-out`}
          style={chartHeightStyle}
        >
          {axisTicks.map((tick, index) => (
            <span
              key={`${tick}-${index}`}
              className={`absolute right-1 -translate-y-1/2 ${isSubmodule ? "text-[10px] sm:text-[11px] font-bold" : "text-[10px] font-semibold"} text-sibs-tertiary-5`}
              style={{
                top: `${(index / (axisTicks.length - 1)) * 100}%`,
              }}
            >
              {tick}%
            </span>
          ))}
        </div>

        {/* 3. Main Chart Canvas */}
        <div className={`relative min-w-0 flex-1 ${isScrollable ? "overflow-x-auto pb-1 sibs-chart-scrollbar" : "overflow-hidden"} overflow-y-hidden`}>
          <div className={`relative min-w-full ${isScrollable ? "w-max" : "w-full"}`}>
            {/* Clustered Bars Container */}
            <div
              className={`relative flex ${!isSubmodule ? "h-[190px] sm:h-[208px]" : ""} min-w-0 items-end ${isScrollable ? "gap-2.5 sm:gap-3.5" : "gap-1 sm:gap-1.5"} border-b border-sibs-tertiary-8 px-1 sm:px-1.5 transition-all duration-300 ease-in-out`}
              style={chartHeightStyle}
            >
              {/* Horizontal Grid Lines */}
              <div className="pointer-events-none absolute inset-0">
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

              {/* Target Reference Line */}
              <div
                className="pointer-events-none absolute right-0 left-0 z-10 flex items-center"
                style={{
                  bottom: `${Math.min(100, Math.max(0, numericTarget))}%`,
                }}
              >
                <div className="w-full border-t border-dashed border-red-500" />
              </div>

              {series.map((item, periodIndex) => {
                const hasData = Number(item.callsOffered || 0) > 0;
                const bars = rateBarItems(item);

                return (
                  <div
                    key={item.key || periodIndex}
                    className="group/period relative z-10 hover:z-50 flex h-full min-w-0 flex-1 items-end justify-center px-0.5"
                    style={isScrollable ? { minWidth: `${minPeriodWidth}px` } : undefined}
                  >
                  <div className="flex h-full w-full max-w-[82px] items-end justify-center gap-0">
                    {bars.map(({ metric, value, className, color }, barIndex) => {
                      const numericValue = hasData ? Math.max(0, Math.min(100, Number(value || 0))) : 0;
                      const heightPercent = hasData && numericValue > 0 ? numericValue : 0;

                      return (
                        <div
                          key={metric}
                          className="group/bar relative hover:z-50 flex h-full min-w-0 flex-1 items-end justify-center"
                          aria-label={`${item.label} ${metric}: ${formatPercent(numericValue)}`}
                        >
                          {/* Value inside bar */}
                          {hasData && numericValue > 0 ? (
                            <span
                              className={`pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 whitespace-nowrap ${isSubmodule ? "text-[8.5px] sm:text-[9px] font-semibold" : "text-[8px] sm:text-[8.5px] 2xl:text-[9px] font-medium"} tracking-tight transition-all duration-200 group-hover/bar:-translate-y-0.5 sibs-graph-number-in ${
                                heightPercent > 10
                                  ? "text-white drop-shadow-xs"
                                  : "text-sibs-primary-1"
                              }`}
                              style={{
                                bottom:
                                  heightPercent > 10
                                    ? `calc(${heightPercent}% - ${isSubmodule ? 15 : 14}px)`
                                    : `calc(${heightPercent}% + 3px)`,
                                animationDelay: `${Math.min(periodIndex * 80 + barIndex * 40, 650)}ms`,
                              }}
                            >
                              {numericValue >= 100 || numericValue.toFixed(1) === "100.0"
                                ? "100%"
                                : `${numericValue.toFixed(1)}%`}
                            </span>
                          ) : null}

                          {/* Hover Tooltip Modal */}
                          {hasData ? (
                            <div
                              className={`pointer-events-none absolute top-3 z-50 hidden w-44 max-w-[calc(100vw-2rem)] rounded-xl border border-sibs-tertiary-10/80 bg-white/95 p-2.5 shadow-xl backdrop-blur-md group-hover/bar:block ${getTooltipPositionClass(
                                periodIndex,
                                series.length,
                              )}`}
                            >
                              <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                                <span className="text-xs font-black text-sibs-primary-1">
                                  {item.label}
                                </span>
                                <span className="text-[10px] font-bold text-sibs-tertiary-5">
                                  {metric}
                                </span>
                              </div>

                              <div className="mt-1.5 flex items-center justify-between text-xs">
                                <span className="flex items-center gap-1.5 font-bold text-slate-600">
                                  <span
                                    className="h-2.5 w-2.5 rounded-full"
                                    style={{ backgroundColor: color }}
                                  />
                                  {metric}:
                                </span>
                                <span className="font-extrabold text-sibs-primary-1">
                                  {formatPercent(numericValue)}
                                </span>
                              </div>

                              {metric === "Service Level" && (
                                <div className="mt-1 flex items-center justify-between border-t border-slate-100 pt-1 text-[11px]">
                                  <span className="font-semibold text-slate-500">
                                    Target ({numericTarget}%):
                                  </span>
                                  <span
                                    className={`font-extrabold ${
                                      numericValue >= numericTarget
                                        ? "text-green-600"
                                        : "text-amber-600"
                                    }`}
                                  >
                                    {numericValue >= numericTarget ? "Target met" : "Below target"}
                                  </span>
                                </div>
                              )}

                              <div className="mt-1 flex items-center justify-between border-t border-slate-100 pt-1 text-[10.5px] text-slate-500">
                                <span>Calls Handled:</span>
                                <span className="font-bold text-slate-700">
                                  {formatGraphNumber(item.callsHandled)}
                                </span>
                              </div>
                            </div>
                          ) : null}

                          {/* Bar Element */}
                          {hasData && heightPercent > 0 ? (
                            <div
                              className={`w-full ${isSubmodule ? "max-w-[46px]" : "max-w-[42px]"} rounded-t-[4px] ${className} transition-all duration-200 ease-out group-hover/bar:-translate-y-0.5 group-hover/bar:brightness-110 shadow-xs sibs-graph-bar-rise`}
                              style={{
                                height: `${heightPercent}%`,
                                animationDelay: `${Math.min(periodIndex * 80 + barIndex * 40, 650)}ms`,
                              }}
                            />
                          ) : (
                            <div className="h-0 w-full" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 4. X-Axis Labels */}
          <div className={`flex w-full min-w-full ${isScrollable ? "gap-2.5 sm:gap-3.5" : "gap-1 sm:gap-1.5"} px-1 sm:px-1.5`}>
            {series.map((item, periodIndex) => (
              <div
                key={item.key || periodIndex}
                className="mt-1.5 min-w-0 flex-1 px-0.5 text-center"
                style={isScrollable ? { minWidth: `${minPeriodWidth}px` } : undefined}
              >
                <p
                  className={`m-0 truncate ${isSubmodule ? "text-xs sm:text-[13px] font-extrabold" : "text-[10.5px] font-extrabold"} text-sibs-primary-1 leading-tight`}
                  title={item.label}
                >
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

function AhtChart({ series, target, period, hideLegend = false, isSubmodule = false, showFilters = true }) {
  if (!series.length) return <EmptyChart message="No average handling time data available for this reporting range." isSubmodule={isSubmodule} showFilters={showFilters} />;

  const normalizedTarget = convertDurationToSeconds(target);
  const activeAhtSeries = series.filter(
    (item) => convertDurationToSeconds(item.ahtSeconds) > 0,
  );

  if (activeAhtSeries.length === 0) {
    return <EmptyChart message="No average handling time data available for this reporting range." isSubmodule={isSubmodule} showFilters={showFilters} />;
  }

  const maxValue = Math.max(
    normalizedTarget,
    ...series.map((item) =>
      convertDurationToSeconds(item.ahtSeconds),
    ),
    1,
  );

  const axisTicks = getCallAxisTicks(maxValue, 4);
  const axisMax = Math.max(1, axisTicks[0] || maxValue);

  const targetPosition = Math.min(
    100,
    (normalizedTarget / axisMax) * 100,
  );

  const minPeriodWidth = 76;
  const isScrollable = series.length > 6;

  const chartHeightStyle = isSubmodule
    ? {
        height: showFilters
          ? "clamp(140px, calc(50vh - 225px), 220px)"
          : "clamp(220px, calc(50vh - 150px), 320px)",
      }
    : undefined;

  return (
    <div className="w-full min-w-0 select-none">
      {!hideLegend ? (
        <div className="mb-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs font-bold text-sibs-tertiary-5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1.5">
              <i className="inline-block h-2.5 w-2.5 rounded-full bg-[#0b3b68]" />
              Call AHT
            </span>

            <span className="inline-flex items-center gap-1 text-red-500">
              <i className="inline-block h-0.5 w-3.5 bg-red-500" />
              Target: {formatNumber(normalizedTarget)}s
            </span>
          </div>
        </div>
      ) : null}

      <div className="flex w-full min-w-0">
        <div
          className={`relative ${!isSubmodule ? "h-[190px] sm:h-[208px]" : ""} w-10 sm:w-11 shrink-0 border-r border-sibs-tertiary-8 pr-1 bg-white z-10 transition-all duration-300 ease-in-out`}
          style={chartHeightStyle}
        >
          {axisTicks.map((tick, index) => (
            <span
              key={`${tick}-${index}`}
              className={`absolute right-1 -translate-y-1/2 ${isSubmodule ? "text-[10px] sm:text-[11px] font-bold" : "text-[10px] font-semibold"} text-sibs-tertiary-5`}
              style={{
                top: `${(index / (axisTicks.length - 1)) * 100}%`,
              }}
            >
              {formatNumber(tick)}s
            </span>
          ))}
        </div>

        <div className={`relative min-w-0 flex-1 ${isScrollable ? "overflow-x-auto pb-1 sibs-chart-scrollbar" : "overflow-hidden"} overflow-y-hidden`}>
          <div className={`relative min-w-full ${isScrollable ? "w-max" : "w-full"}`}>
            <div
              className={`relative flex ${!isSubmodule ? "h-[190px] sm:h-[208px]" : ""} min-w-0 items-end gap-1 border-b border-sibs-tertiary-8 px-1 transition-all duration-300 ease-in-out`}
              style={chartHeightStyle}
            >
              {/* Horizontal Gridlines spanning 100% of bars container */}
              <div className="pointer-events-none absolute inset-0">
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

              <div
                className="pointer-events-none absolute right-0 left-0 z-10 flex items-center"
                style={{
                  bottom: `${targetPosition}%`,
                }}
              >
                <div className="w-full border-t border-red-500" />
              </div>

              {series.map((item, itemIndex) => {
                const ahtSec = convertDurationToSeconds(item.ahtSeconds);
                const hasAht = ahtSec > 0;
                const heightPct = Math.max(2, (ahtSec / axisMax) * 100);

                return (
                  <div
                    key={item.key || itemIndex}
                    className="group/aht relative z-10 hover:z-50 flex h-full min-w-0 flex-1 flex-col items-center justify-end"
                    style={isScrollable ? { minWidth: `${minPeriodWidth}px` } : undefined}
                  >
                  {hasAht ? (
                    <p
                      className={`pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 whitespace-nowrap ${isSubmodule ? "text-[8.5px] sm:text-[9px] font-semibold" : "text-[8px] sm:text-[8.5px] 2xl:text-[9px] font-medium"} tracking-tight transition-all duration-200 group-hover/aht:-translate-y-0.5 sibs-graph-number-in ${
                        heightPct > 10
                          ? "text-white drop-shadow-xs"
                          : "text-sibs-primary-1"
                      }`}
                      style={{
                        bottom:
                          heightPct > 10
                            ? `calc(${heightPct}% - ${isSubmodule ? 15 : 14}px)`
                            : `calc(${heightPct}% + 3px)`,
                        animationDelay: `${Math.min(itemIndex * 60, 500)}ms`,
                      }}
                    >
                      {Math.round(ahtSec)}s
                    </p>
                  ) : (
                    <span className="mb-1.5 text-[10px] font-semibold text-slate-400">-</span>
                  )}

                  {/* Tooltip Modal */}
                  {hasAht ? (
                    <div
                      className={`pointer-events-none absolute top-3 z-50 hidden w-44 max-w-[calc(100vw-2rem)] rounded-xl border border-sibs-tertiary-10 bg-white/95 p-2.5 shadow-xl backdrop-blur-md group-hover/aht:block ${getTooltipPositionClass(
                        itemIndex,
                        series.length,
                      )}`}
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                        <span className="text-xs font-black text-sibs-primary-1">
                          {item.label}
                        </span>
                        <span className="text-[10px] font-bold text-sibs-tertiary-5">
                          AHT
                        </span>
                      </div>

                      <div className="mt-1.5 space-y-1 text-[11px]">
                        <div className="flex items-center justify-between font-bold text-[#0b3b68]">
                          <span>Average:</span>
                          <span>{formatDuration(ahtSec)}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-500">Seconds:</span>
                          <span className="font-bold text-slate-700">
                            {formatNumber(ahtSec, 1)}s
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10.5px]">
                          <span className="whitespace-nowrap font-semibold text-slate-500">Target ({formatNumber(normalizedTarget)}s):</span>
                          <span
                            className={`whitespace-nowrap font-extrabold ${
                              ahtSec <= normalizedTarget
                                ? "text-emerald-600"
                                : "text-amber-600"
                            }`}
                          >
                            {ahtSec <= normalizedTarget ? "✓ On Target" : "✗ Over Target"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {hasAht ? (
                    <div
                      className={`w-full ${isSubmodule ? "max-w-[64px]" : "max-w-[54px]"} rounded-t-[4px] bg-[#0b3b68] transition-all duration-200 group-hover/aht:brightness-110 group-hover/aht:-translate-y-0.5 shadow-xs sibs-graph-bar-rise`}
                      style={{
                        height: `${heightPct}%`,
                        animationDelay: `${Math.min(itemIndex * 60, 500)}ms`,
                      }}
                    />
                  ) : (
                    <div className="h-0.5 w-6 rounded bg-slate-200" />
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex w-full min-w-full gap-1 px-1">
            {series.map((item, periodIndex) => (
              <div
                key={item.key || periodIndex}
                className="mt-1.5 min-w-0 flex-1 px-0.5 text-center"
                style={isScrollable ? { minWidth: `${minPeriodWidth}px` } : undefined}
              >
                <p
                  className={`m-0 truncate ${isSubmodule ? "text-xs sm:text-[13px] font-extrabold" : "text-[10.5px] font-extrabold"} text-sibs-primary-1 leading-tight`}
                  title={item.label}
                >
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

export default function CallKpiDashboard({
  data,
  showSummaryCards = true,
  afterCards = null,
  isSubmodule = false,
  showFilters = true,
}) {
  const isFiltersVisible = showFilters !== undefined ? showFilters : showSummaryCards;
  const summary = data?.summary || {};
  const series = Array.isArray(data?.series)
    ? data.series
    : [];

  const targets = data?.targets || {
    serviceLevelPct: 90,
    ahtSeconds: 420,
  };

  const serviceLevelMet =
    Number(summary.serviceLevelPct || 0) >=
    Number(targets.serviceLevelPct || 0);

  const summaryAhtSeconds = convertDurationToSeconds(
    summary.ahtSeconds,
  );

  const targetAhtSeconds = convertDurationToSeconds(
    targets.ahtSeconds,
  );

  const ahtMet =
    summaryAhtSeconds <= targetAhtSeconds &&
    summaryAhtSeconds > 0;

  const summaryAsaSeconds = convertDurationToSeconds(
    summary.asaSeconds,
  );

  const targetAsaSeconds = targets.asaSeconds
    ? convertDurationToSeconds(targets.asaSeconds)
    : null;

  const asaMet =
    targetAsaSeconds !== null
      ? summaryAsaSeconds <= targetAsaSeconds && summaryAsaSeconds > 0
      : null;

  const period = data?.filters?.period || data?.data?.filters?.period;

  return (
    <div className={isSubmodule && isFiltersVisible ? "space-y-1.5 sm:space-y-2" : "space-y-2.5"}>
      {/* 7 Compact KPI Stat Cards */}
      {showSummaryCards ? (
        <div className={isSubmodule ? "space-y-1" : "space-y-1.5 sm:space-y-2"}>
          <div>
            <div className="flex items-center gap-1.5 mb-1 px-0.5">
              <span className="flex items-center gap-1 text-[10px] sm:text-[10.5px] font-black uppercase tracking-wider text-sibs-primary-1">
                <PhoneCall size={11} className="text-sibs-primary-1" />
                Calls
              </span>
              <div className="h-px flex-1 bg-slate-200/70" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-7 gap-1 sm:gap-1.5">
              <KpiCard
                icon={PhoneCall}
                label="Call Volume"
                value={formatNumber(summary.callsOffered)}
                hint="Total calls offered"
              />

            <KpiCard
              icon={PhoneCall}
              label="Handled"
              value={formatNumber(summary.callsHandled)}
              hint="Total handled calls"
            />

            <KpiCard
              icon={CheckCircle2}
              label="Handled w/SLA"
              value={formatNumber(summary.handledWithinSla)}
              hint="Handled within SLT"
            />

            <KpiCard
              icon={Gauge}
              label="Answer %"
              value={formatPercent(summary.answerRatePct)}
              hint="Handled ÷ offered"
            />

            <KpiCard
              icon={Gauge}
              label="Service Level"
              value={formatPercent(summary.serviceLevelPct)}
              hint={`Target ${formatPercent(
                targets.serviceLevelPct,
              )}`}
              status={{
                label: serviceLevelMet
                  ? "Target met"
                  : "Below target",
                className: serviceLevelMet
                  ? "bg-green-100 text-green-700"
                  : "bg-amber-100 text-amber-700",
              }}
            />

            <KpiCard
              icon={Clock3}
              label="Call AHT"
              value={summaryAhtSeconds > 0 ? `${formatNumber(summaryAhtSeconds)}s` : "--"}
              hint={`Target ${formatNumber(targetAhtSeconds)}s`}
              status={{
                label: ahtMet
                  ? "Target met"
                  : "Above target",
                className: ahtMet
                  ? "bg-green-100 text-green-700"
                  : "bg-amber-100 text-amber-700",
              }}
            />

            <div className="col-span-2 sm:col-span-1">
              <KpiCard
                icon={Clock3}
                label="ASA"
                title="Average Speed of Answer (ASA)"
                value={summaryAsaSeconds > 0 ? `${formatNumber(summaryAsaSeconds)}s` : "--"}
                hint={
                  targetAsaSeconds !== null
                    ? `Target ${formatNumber(targetAsaSeconds)}s`
                    : "Speed to answer"
                }
                status={
                  targetAsaSeconds !== null
                    ? {
                        label: asaMet ? "Target met" : "Above target",
                        className: asaMet
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700",
                      }
                    : null
                }
              />
            </div>
          </div>
        </div>

        {afterCards}
      </div>
      ) : null}

      {/* 3 Prominent Graphs:
          In submodule view:
          - Top row alone (full width): Calls
          - Bottom row (side-by-side): Answer Rate & Service Level (col 1) + Average Handling Time (col 2)
      */}
      <div
        id="kpi-graphs-container"
        data-pdf-charts="true"
        key={`kpi-charts-${series.map((s) => s.key || s.label).join("-")}`}
        className={`grid grid-cols-1 ${
          isSubmodule
            ? "lg:grid-cols-2"
            : "2xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1.1fr)_minmax(0,0.95fr)]"
        } ${isSubmodule && isFiltersVisible ? "gap-2 sm:gap-2.5" : "gap-3 sm:gap-3.5"} w-full min-w-0 transition-all duration-300 ease-in-out`}
      >
        <div className={isSubmodule ? "col-span-1 lg:col-span-2" : "col-span-1"}>
          <ChartShell
            title="Calls"
            legend={
              <>
                <span className="inline-flex items-center gap-1 font-bold text-[#0b3b68]">
                  <i className="h-2 w-2 rounded-full bg-[#0b3b68]" />
                  Volume
                </span>
                <span className="inline-flex items-center gap-1 font-bold text-[#2f6f9f]">
                  <i className="h-2 w-2 rounded-full bg-[#2f6f9f]" />
                  Handled
                </span>
                <span className="inline-flex items-center gap-1 font-bold text-[#4c9aca]">
                  <i className="h-2 w-2 rounded-full bg-[#4c9aca]" />
                  Handled w/ SLA
                </span>
              </>
            }
          >
            <VolumeChart
              series={
                series.length
                  ? series
                  : data?.data?.series || []
              }
              period={period}
              hideLegend={true}
              isSubmodule={isSubmodule}
              showFilters={isFiltersVisible}
            />
          </ChartShell>
        </div>

        <div className="col-span-1">
          <ChartShell
            title="Answer Rate & Service Level"
            legend={
              <>
                <span className="inline-flex items-center gap-1 font-bold text-[#0b3b68]">
                  <i className="h-2 w-2 rounded-full bg-[#0b3b68]" />
                  Answer
                </span>
                <span className="inline-flex items-center gap-1 font-bold text-[#0284c7]">
                  <i className="h-2 w-2 rounded-full bg-[#0284c7]" />
                  Service Level
                </span>
                <span className="inline-flex items-center gap-1 font-bold text-red-500">
                  <i className="inline-block h-0.5 w-3 bg-red-500 border-t border-dashed border-red-500" />
                  Target: {Number(targets.serviceLevelPct || data?.data?.targets?.serviceLevelPct || 90)}%
                </span>
              </>
            }
          >
            <LineChart
              series={
                series.length
                  ? series
                  : data?.data?.series || []
              }
              target={
                targets.serviceLevelPct ||
                data?.data?.targets?.serviceLevelPct
              }
              period={period}
              hideLegend={true}
              isSubmodule={isSubmodule}
              showFilters={isFiltersVisible}
            />
          </ChartShell>
        </div>

        <div className="col-span-1">
          <ChartShell
            title="Average Handling Time"
            legend={
              <>
                <span className="inline-flex items-center gap-1 font-bold text-[#0b3b68]">
                  <i className="h-2 w-2 rounded-full bg-[#0b3b68]" />
                  Call AHT
                </span>
                <span className="inline-flex items-center gap-1 font-bold text-red-500">
                  <i className="inline-block h-0.5 w-3 bg-red-500" />
                  Target: {formatNumber(convertDurationToSeconds(targets.ahtSeconds || data?.data?.targets?.ahtSeconds || 420))}s
                </span>
              </>
            }
          >
            <AhtChart
              series={
                series.length
                  ? series
                  : data?.data?.series || []
              }
              target={
                targets.ahtSeconds ||
                data?.data?.targets?.ahtSeconds
              }
              period={period}
              hideLegend={true}
              isSubmodule={isSubmodule}
              showFilters={isFiltersVisible}
            />
          </ChartShell>
        </div>
      </div>
    </div>
  );
}

export { ChartShell, VolumeChart, LineChart, AhtChart, CallKpiDashboard, CallKpiDashboard as WfmCallKpiDashboard };