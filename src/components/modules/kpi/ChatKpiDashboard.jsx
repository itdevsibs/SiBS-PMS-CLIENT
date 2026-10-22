import { useLayoutEffect, useRef } from "react";
import {
  CheckCircle2,
  Clock3,
  MessageCircle,
  MessageSquareOff,
  Percent,
  XCircle,
} from "lucide-react";
import { ChartShell } from "./CallKpiDashboard.jsx";
import {
  getCallAxisTicks,
  useSyncedHorizontalScroll,
} from "./callKpiDashboardUtils.js";

function formatNumber(value, digits = 0) {
  const number = Number(value || 0);
  return number.toLocaleString(undefined, { maximumFractionDigits: digits });
}

function formatPercent(value) {
  const number = Number(value || 0);
  if (number >= 100 || number.toFixed(2) === "100.00") return "100%";
  return `${formatNumber(number, 2)}%`;
}

function formatDuration(seconds) {
  const value = Number(seconds || 0);
  if (!Number.isFinite(value) || value <= 0) return "--";
  const minutes = Math.floor(value / 60);
  const remainingSeconds = Math.round(value % 60);
  return minutes > 0
    ? `${minutes}m ${String(remainingSeconds).padStart(2, "0")}s`
    : `${remainingSeconds}s`;
}

function getTooltipPositionClass(periodIndex, seriesLength) {
  if (periodIndex <= 1) return "left-0";
  if (periodIndex >= seriesLength - 2) return "right-0";
  return "left-1/2 -translate-x-1/2";
}

function EmptyChart({ message, isSubmodule = false, showFilters = true }) {
  const chartHeightStyle = isSubmodule
    ? {
        height: showFilters
          ? "clamp(180px, calc((100vh - 350px) / 2), 340px)"
          : "clamp(240px, calc((100vh - 200px) / 2), 440px)",
      }
    : undefined;

  return (
    <div
      className={`flex ${!isSubmodule ? "h-[75px] sm:h-[85px]" : ""} items-center justify-center rounded-xl border border-dashed border-sibs-tertiary-8 bg-sibs-tertiary-10/30 px-3 text-center text-xs font-semibold text-sibs-tertiary-5`}
      style={chartHeightStyle}
    >
      {message}
    </div>
  );
}

function useAutoScrollToLatest({ series, isScrollable, externalScrollRef }) {
  const internalScrollRef = useRef(null);
  const setScrollRef = (node) => {
    internalScrollRef.current = node;
    if (typeof externalScrollRef === "function") {
      externalScrollRef(node);
    } else if (externalScrollRef && "current" in externalScrollRef) {
      externalScrollRef.current = node;
    }
  };

  useLayoutEffect(() => {
    if (!isScrollable || !internalScrollRef.current) return undefined;
    internalScrollRef.current.scrollLeft = internalScrollRef.current.scrollWidth;
    const timeoutId = setTimeout(() => {
      if (internalScrollRef.current) {
        internalScrollRef.current.scrollLeft = internalScrollRef.current.scrollWidth;
      }
    }, 50);
    return () => clearTimeout(timeoutId);
  }, [series, isScrollable]);

  return setScrollRef;
}

function ChatVolumeChart({
  series = [],
  period,
  isSubmodule = false,
  showFilters = true,
  scrollContainerRef,
}) {
  if (!series.length) {
    return (
      <EmptyChart
        message="No Chat Detail Records are available for this reporting range."
        isSubmodule={isSubmodule}
        showFilters={showFilters}
      />
    );
  }

  const maxValue = Math.max(
    1,
    ...series.flatMap((item) => [
      Number(item.chatsReceived || 0),
      Number(item.chatsAnswered || 0),
      Number(item.noResponse || 0),
      Number(item.chatsAbandoned || 0),
    ]),
  );
  const axisTicks = getCallAxisTicks(maxValue, 4);
  const axisMax = Math.max(1, axisTicks[0] || maxValue);
  const minPeriodWidth = 100;
  const isScrollable = series.length > 6 || period === "custom";
  const setScrollRef = useAutoScrollToLatest({
    series,
    isScrollable,
    externalScrollRef: scrollContainerRef,
  });

  const chartHeightStyle = isSubmodule
    ? {
        height: showFilters
          ? "clamp(180px, calc((100vh - 350px) / 2), 340px)"
          : "clamp(240px, calc((100vh - 200px) / 2), 440px)",
      }
    : undefined;

  const maxTickCharLength = Math.max(...axisTicks.map((tick) => formatNumber(tick).length), 1);
  const barsFor = (item) => [
    { label: "Received", value: Number(item.chatsReceived || 0), className: "bg-[#0b3b68]" },
    { label: "Answered", value: Number(item.chatsAnswered || 0), className: "bg-[#2f6f9f]" },
    { label: "No Response", value: Number(item.noResponse || 0), className: "bg-[#739fc0]" },
    { label: "Abandoned", value: Number(item.chatsAbandoned || 0), className: "bg-[#a8c5da]" },
  ];

  return (
    <div className={`w-full min-w-0 select-none ${!isSubmodule ? "flex-1 min-h-0 flex flex-col justify-between" : ""}`}>
      <div className={`flex w-full min-w-0 ${!isSubmodule ? "flex-1 min-h-0" : ""}`}>
        <div className={`flex flex-col shrink-0 ${!isSubmodule ? "h-full" : ""}`}>
          <div
            className={`relative ${!isSubmodule ? "" : "w-10 sm:w-11"} shrink-0 border-r border-sibs-tertiary-8 pr-1 bg-white z-10 overflow-visible ${!isSubmodule ? "flex-1 min-h-0" : ""}`}
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
                } whitespace-nowrap ${isSubmodule ? "text-[10px] sm:text-[11px]" : "text-[8.5px]"} font-bold text-sibs-tertiary-5 leading-none`}
                style={{ top: `${(index / (axisTicks.length - 1)) * 100}%` }}
              >
                {formatNumber(tick)}
              </span>
            ))}
          </div>
          {!isSubmodule && <div className="shrink-0 h-5 border-r border-sibs-tertiary-8" />}
        </div>

        <div
          ref={setScrollRef}
          className={`relative min-w-0 flex-1 ${isScrollable ? "overflow-x-auto pb-1 sibs-chart-scrollbar" : "overflow-hidden"} overflow-y-hidden ${!isSubmodule ? "h-full flex flex-col" : ""}`}
        >
          <div className={`relative min-w-full ${isScrollable ? "w-max" : "w-full"} ${!isSubmodule ? "flex-1 min-h-0 flex flex-col" : ""}`}>
            <div
              className={`relative flex w-full min-w-0 items-end gap-1 border-b border-sibs-tertiary-8 px-1 transition-all ${!isSubmodule ? "flex-1 min-h-0" : ""}`}
              style={chartHeightStyle}
            >
              <div className="pointer-events-none absolute inset-0">
                {axisTicks.map((tick, index) => (
                  <div
                    key={`${tick}-${index}`}
                    className="absolute left-0 right-0 border-t border-sibs-tertiary-9"
                    style={{ top: `${(index / (axisTicks.length - 1)) * 100}%` }}
                  />
                ))}
              </div>

              {series.map((item, periodIndex) => (
                <div
                  key={item.key || periodIndex}
                  className="group/period relative z-10 hover:z-50 flex h-full min-w-0 flex-1 items-end justify-center px-0.5"
                  style={isScrollable ? { minWidth: `${minPeriodWidth}px` } : undefined}
                >
                  <div className={`flex h-full w-full ${isSubmodule ? "max-w-[180px]" : "max-w-[135px]"} items-end justify-center gap-0`}>
                    {barsFor(item).map((bar, barIndex) => {
                      const height = bar.value > 0 ? Math.max(2, (bar.value / axisMax) * 100) : 0;
                      const inside = height > 10;
                      return (
                        <div
                          key={bar.label}
                          className="group/bar relative hover:z-50 flex h-full min-w-0 flex-1 items-end justify-center"
                          aria-label={`${item.label} ${bar.label}: ${formatNumber(bar.value)}`}
                        >
                          {bar.value > 0 ? (
                            <span
                              className={`pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 whitespace-nowrap ${isSubmodule ? "text-[8px] sm:text-[8.5px]" : "text-[7.5px] sm:text-[8px]"} font-black tracking-tight ${inside ? "text-white drop-shadow-xs" : "text-sibs-primary-1"}`}
                              style={{
                                bottom: inside ? `calc(${height}% - 16px)` : `calc(${height}% + 3px)`,
                                animationDelay: `${Math.min(periodIndex * 80 + barIndex * 35, 650)}ms`,
                              }}
                            >
                              {formatNumber(bar.value)}
                            </span>
                          ) : null}

                          <div
                            className={`pointer-events-none absolute bottom-[calc(100%+8px)] z-[80] hidden w-44 rounded-lg border border-slate-200 bg-white p-2 text-left shadow-xl group-hover/bar:block ${getTooltipPositionClass(periodIndex, series.length)}`}
                          >
                            <p className="m-0 text-[10px] font-black text-sibs-primary-1">{item.label}</p>
                            <div className="mt-1 flex items-center justify-between gap-3 text-[10px]">
                              <span className="font-bold text-slate-600">{bar.label}</span>
                              <span className="font-extrabold text-sibs-primary-1">{formatNumber(bar.value)}</span>
                            </div>
                          </div>

                          <div
                            className={`w-full ${isSubmodule ? "max-w-[40px]" : "max-w-[34px]"} rounded-t-[4px] ${bar.className} shadow-xs sibs-graph-bar-rise transition-all group-hover/bar:brightness-110`}
                            style={{
                              height: `${height}%`,
                              animationDelay: `${Math.min(periodIndex * 80 + barIndex * 35, 650)}ms`,
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="shrink-0 flex w-full min-w-full gap-1 px-1">
              {series.map((item, index) => (
                <div
                  key={item.key || index}
                  className="mt-1 min-w-0 flex-1 px-0.5 text-center"
                  style={isScrollable ? { minWidth: `${minPeriodWidth}px` } : undefined}
                >
                  <p className={`${isSubmodule ? "text-[10px] sm:text-[11px]" : "text-[9px] sm:text-[9.5px]"} m-0 truncate font-bold text-sibs-primary-1 leading-tight`} title={item.label}>
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

function ChatPercentageChart({
  series = [],
  period,
  isSubmodule = false,
  showFilters = true,
  scrollContainerRef,
}) {
  if (!series.length) {
    return <EmptyChart message="No Chat SLA data is available for this reporting range." isSubmodule={isSubmodule} showFilters={showFilters} />;
  }

  const axisTicks = [100, 75, 50, 25, 0];
  const minPeriodWidth = 84;
  const isScrollable = series.length > 6 || period === "custom";
  const setScrollRef = useAutoScrollToLatest({ series, isScrollable, externalScrollRef: scrollContainerRef });
  const chartHeightStyle = isSubmodule
    ? { height: showFilters ? "clamp(180px, calc((100vh - 350px) / 2), 340px)" : "clamp(240px, calc((100vh - 200px) / 2), 440px)" }
    : undefined;

  return (
    <div className={`w-full min-w-0 select-none ${!isSubmodule ? "flex-1 min-h-0 flex flex-col" : ""}`}>
      <div className={`flex w-full min-w-0 ${!isSubmodule ? "flex-1 min-h-0" : ""}`}>
        <div className={`flex flex-col shrink-0 ${!isSubmodule ? "h-full" : ""}`}>
          <div className={`relative ${!isSubmodule ? "w-8" : "w-10 sm:w-11"} shrink-0 border-r border-sibs-tertiary-8 pr-1 bg-white ${!isSubmodule ? "flex-1 min-h-0" : ""}`} style={chartHeightStyle}>
            {axisTicks.map((tick, index) => (
              <span
                key={`${tick}-${index}`}
                className={`absolute right-1 ${index === 0 ? "translate-y-0" : index === axisTicks.length - 1 ? "-translate-y-full" : "-translate-y-1/2"} whitespace-nowrap ${isSubmodule ? "text-[10px] sm:text-[11px]" : "text-[8.5px]"} font-bold text-sibs-tertiary-5 leading-none`}
                style={{ top: `${(index / (axisTicks.length - 1)) * 100}%` }}
              >
                {tick}%
              </span>
            ))}
          </div>
          {!isSubmodule && <div className="shrink-0 h-5 border-r border-sibs-tertiary-8" />}
        </div>

        <div ref={setScrollRef} className={`relative min-w-0 flex-1 ${isScrollable ? "overflow-x-auto pb-1 sibs-chart-scrollbar" : "overflow-hidden"} overflow-y-hidden ${!isSubmodule ? "h-full flex flex-col" : ""}`}>
          <div className={`relative min-w-full ${isScrollable ? "w-max" : "w-full"} ${!isSubmodule ? "flex-1 min-h-0 flex flex-col" : ""}`}>
            <div className={`relative flex min-w-0 items-end gap-1 border-b border-sibs-tertiary-8 px-1 ${!isSubmodule ? "flex-1 min-h-0" : ""}`} style={chartHeightStyle}>
              <div className="pointer-events-none absolute inset-0">
                {axisTicks.map((tick, index) => (
                  <div key={`${tick}-${index}`} className="absolute left-0 right-0 border-t border-sibs-tertiary-9" style={{ top: `${(index / (axisTicks.length - 1)) * 100}%` }} />
                ))}
              </div>

              {series.map((item, index) => {
                const value = Math.max(0, Math.min(100, Number(item.slaPct || 0)));
                const height = value > 0 ? Math.max(2, value) : 0;
                return (
                  <div key={item.key || index} className="group/bar relative z-10 hover:z-50 flex h-full min-w-0 flex-1 items-end justify-center px-2" style={isScrollable ? { minWidth: `${minPeriodWidth}px` } : undefined}>
                    {value > 0 ? (
                      <span className={`pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 whitespace-nowrap ${isSubmodule ? "text-[9px]" : "text-[8.5px]"} font-black ${height > 10 ? "text-white" : "text-sibs-primary-1"}`} style={{ bottom: height > 10 ? `calc(${height}% - 17px)` : `calc(${height}% + 4px)` }}>
                        {formatPercent(value)}
                      </span>
                    ) : null}
                    <div className="w-full max-w-[48px] rounded-t-[4px] bg-[#2f6f9f] shadow-xs sibs-graph-bar-rise" style={{ height: `${height}%` }} />
                  </div>
                );
              })}
            </div>
            <div className="shrink-0 flex w-full min-w-full gap-1 px-1">
              {series.map((item, index) => (
                <div key={item.key || index} className="mt-1 min-w-0 flex-1 text-center" style={isScrollable ? { minWidth: `${minPeriodWidth}px` } : undefined}>
                  <p className={`${isSubmodule ? "text-[10px] sm:text-[11px]" : "text-[9px] sm:text-[9.5px]"} m-0 truncate font-bold text-sibs-primary-1 leading-tight`} title={item.label}>{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatAhtChart({
  series = [],
  period,
  isSubmodule = false,
  showFilters = true,
  scrollContainerRef,
}) {
  if (!series.length) {
    return <EmptyChart message="No valid Chat duration values are available for this reporting range." isSubmodule={isSubmodule} showFilters={showFilters} />;
  }

  const maxValue = Math.max(1, ...series.map((item) => Number(item.ahtSeconds || 0)));
  const axisTicks = getCallAxisTicks(maxValue, 4);
  const axisMax = Math.max(1, axisTicks[0] || maxValue);
  const minPeriodWidth = 84;
  const isScrollable = series.length > 6 || period === "custom";
  const setScrollRef = useAutoScrollToLatest({ series, isScrollable, externalScrollRef: scrollContainerRef });
  const chartHeightStyle = isSubmodule
    ? { height: showFilters ? "clamp(180px, calc((100vh - 350px) / 2), 340px)" : "clamp(240px, calc((100vh - 200px) / 2), 440px)" }
    : undefined;

  return (
    <div className={`w-full min-w-0 select-none ${!isSubmodule ? "flex-1 min-h-0 flex flex-col" : ""}`}>
      <div className={`flex w-full min-w-0 ${!isSubmodule ? "flex-1 min-h-0" : ""}`}>
        <div className={`flex flex-col shrink-0 ${!isSubmodule ? "h-full" : ""}`}>
          <div className={`relative ${!isSubmodule ? "w-10" : "w-11 sm:w-12"} shrink-0 border-r border-sibs-tertiary-8 pr-1 bg-white ${!isSubmodule ? "flex-1 min-h-0" : ""}`} style={chartHeightStyle}>
            {axisTicks.map((tick, index) => (
              <span key={`${tick}-${index}`} className={`absolute right-1 ${index === 0 ? "translate-y-0" : index === axisTicks.length - 1 ? "-translate-y-full" : "-translate-y-1/2"} whitespace-nowrap ${isSubmodule ? "text-[10px] sm:text-[11px]" : "text-[8.5px]"} font-bold text-sibs-tertiary-5 leading-none`} style={{ top: `${(index / (axisTicks.length - 1)) * 100}%` }}>
                {formatNumber(tick)}s
              </span>
            ))}
          </div>
          {!isSubmodule && <div className="shrink-0 h-5 border-r border-sibs-tertiary-8" />}
        </div>
        <div ref={setScrollRef} className={`relative min-w-0 flex-1 ${isScrollable ? "overflow-x-auto pb-1 sibs-chart-scrollbar" : "overflow-hidden"} overflow-y-hidden ${!isSubmodule ? "h-full flex flex-col" : ""}`}>
          <div className={`relative min-w-full ${isScrollable ? "w-max" : "w-full"} ${!isSubmodule ? "flex-1 min-h-0 flex flex-col" : ""}`}>
            <div className={`relative flex min-w-0 items-end gap-1 border-b border-sibs-tertiary-8 px-1 ${!isSubmodule ? "flex-1 min-h-0" : ""}`} style={chartHeightStyle}>
              <div className="pointer-events-none absolute inset-0">
                {axisTicks.map((tick, index) => (
                  <div key={`${tick}-${index}`} className="absolute left-0 right-0 border-t border-sibs-tertiary-9" style={{ top: `${(index / (axisTicks.length - 1)) * 100}%` }} />
                ))}
              </div>
              {series.map((item, index) => {
                const value = Math.max(0, Number(item.ahtSeconds || 0));
                const height = value > 0 ? Math.max(2, Math.min(100, (value / axisMax) * 100)) : 0;
                return (
                  <div key={item.key || index} className="group/bar relative z-10 hover:z-50 flex h-full min-w-0 flex-1 items-end justify-center px-2" style={isScrollable ? { minWidth: `${minPeriodWidth}px` } : undefined}>
                    {value > 0 ? (
                      <span className={`pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 whitespace-nowrap ${isSubmodule ? "text-[9px]" : "text-[8.5px]"} font-black ${height > 12 ? "text-white" : "text-sibs-primary-1"}`} style={{ bottom: height > 12 ? `calc(${height}% - 17px)` : `calc(${height}% + 4px)` }}>
                        {formatNumber(value)}s
                      </span>
                    ) : null}
                    <div className="w-full max-w-[48px] rounded-t-[4px] bg-[#4c9aca] shadow-xs sibs-graph-bar-rise" style={{ height: `${height}%` }} />
                  </div>
                );
              })}
            </div>
            <div className="shrink-0 flex w-full min-w-full gap-1 px-1">
              {series.map((item, index) => (
                <div key={item.key || index} className="mt-1 min-w-0 flex-1 text-center" style={isScrollable ? { minWidth: `${minPeriodWidth}px` } : undefined}>
                  <p className={`${isSubmodule ? "text-[10px] sm:text-[11px]" : "text-[9px] sm:text-[9.5px]"} m-0 truncate font-bold text-sibs-primary-1 leading-tight`} title={item.label}>{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatKpiCard({ icon: Icon, label, value, hint, onClick = null }) {
  return (
    <article
      onClick={onClick || undefined}
      className={`sibs-card rounded-xl min-w-0 px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-2xs h-full flex flex-col justify-between gap-1 transition-all duration-150 hover:border-sibs-primary-1/30 ${onClick ? "cursor-pointer" : ""}`}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="truncate text-[9px] xl:text-[9.5px] font-extrabold uppercase tracking-wider text-sibs-tertiary-5 leading-none">{label}</span>
        <span className="rounded p-0.5 text-sibs-tertiary-5/80 shrink-0"><Icon size={12} /></span>
      </div>
      <div className="text-base sm:text-lg xl:text-[19px] font-black text-sibs-primary-1 truncate leading-none">{value}</div>
      <p className="m-0 truncate text-[9px] xl:text-[9.5px] font-bold text-sibs-tertiary-5 leading-tight" title={typeof hint === "string" ? hint : undefined}>{hint}</p>
    </article>
  );
}

function ChatSummaryCards({ summary = {}, title = "Chats", onCardClick = null }) {
  const cards = [
    { label: "Chats Received", value: formatNumber(summary.chatsReceived), icon: MessageCircle, hint: "Unique Chat ID" },
    { label: "Answered", value: formatNumber(summary.chatsAnswered), icon: CheckCircle2, hint: "First Response In > 0" },
    { label: "No Response", value: formatNumber(summary.noResponse), icon: MessageSquareOff, hint: "First Response In = 0" },
    { label: "Abandoned", value: formatNumber(summary.chatsAbandoned), icon: XCircle, hint: "Duration = N/A" },
    { label: "Chat SLA", value: formatPercent(summary.slaPct), icon: Percent, hint: "Chats Answered ÷ Chats Received × 100" },
    { label: "Chat AHT", value: formatDuration(summary.ahtSeconds), icon: Clock3, hint: "Average valid Duration" },
  ];

  return (
    <div>
      {title ? (
        <div className="flex items-center gap-1.5 mb-1 px-0.5">
          <span className="flex items-center gap-1 text-[10px] sm:text-[10.5px] font-black uppercase tracking-wider text-sibs-primary-1">
            <MessageCircle size={11} className="text-sibs-primary-1" />
            {title}
          </span>
          <div className="h-px flex-1 bg-slate-200/70" />
        </div>
      ) : null}
      <div className="grid grid-cols-2 gap-1.5 sm:gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {cards.map(({ label, value, icon, hint }) => (
          <ChatKpiCard key={label} icon={icon} label={label} value={value} hint={hint} onClick={onCardClick} />
        ))}
      </div>
    </div>
  );
}

export default function ChatKpiDashboard({
  data = {},
  period,
  showSummaryCards = true,
  isSubmodule = false,
  showFilters = true,
  onSectionClick = null,
  isLoading = false,
}) {
  const series = Array.isArray(data.series) ? data.series : [];
  const currentPeriod = period || data.filters?.period || data.data?.filters?.period;
  const isCustomPeriod = currentPeriod === "custom";
  const registerScroll = useSyncedHorizontalScroll(isCustomPeriod);

  return (
    <section className={isSubmodule ? "space-y-1.5 sm:space-y-2" : "flex-1 min-h-0 flex flex-col"}>
      <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${showSummaryCards ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 pointer-events-none"}`}>
        <div className="overflow-hidden pb-1">
          <ChatSummaryCards
            summary={data.summary || {}}
            onCardClick={!isSubmodule ? onSectionClick : undefined}
          />
        </div>
      </div>

      <div className={`grid grid-cols-1 ${isSubmodule ? "lg:grid-cols-2" : "md:grid-cols-2 lg:grid-cols-3 md:grid-rows-1"} ${isSubmodule && showFilters ? "gap-2 sm:gap-2.5" : "gap-1.5 sm:gap-1.5"} w-full min-w-0 flex-1 min-h-0 transition-all duration-300 ease-in-out ${!isSubmodule && showFilters ? "min-h-[200px]" : !isSubmodule ? "min-h-[170px]" : ""}`}>
        <div className={isSubmodule ? "col-span-1 lg:col-span-2" : "col-span-1 md:col-span-2 lg:col-span-1 min-h-[160px] md:min-h-0 md:h-full flex flex-col"}>
          <ChartShell
            title="Chats"
            tightLeft={!isSubmodule}
            onClick={!isSubmodule ? onSectionClick : undefined}
            isLoading={isLoading}
            isSubmodule={isSubmodule}
            showFilters={showFilters}
            barsPerPeriod={4}
            series={series}
            legend={
              <>
                <span className="inline-flex items-center gap-1 font-bold text-[#0b3b68]"><i className="h-2 w-2 rounded-full bg-[#0b3b68]" />Received</span>
                <span className="inline-flex items-center gap-1 font-bold text-[#2f6f9f]"><i className="h-2 w-2 rounded-full bg-[#2f6f9f]" />Answered</span>
                <span className="inline-flex items-center gap-1 font-bold text-[#739fc0]"><i className="h-2 w-2 rounded-full bg-[#739fc0]" />No Response</span>
                <span className="inline-flex items-center gap-1 font-bold text-[#7894a8]"><i className="h-2 w-2 rounded-full bg-[#a8c5da]" />Abandoned</span>
              </>
            }
          >
            <ChatVolumeChart series={series} period={currentPeriod} isSubmodule={isSubmodule} showFilters={showFilters} scrollContainerRef={registerScroll} />
          </ChartShell>
        </div>

        <div className={isSubmodule ? "col-span-1" : "col-span-1 min-h-[160px] md:min-h-0 md:h-full flex flex-col"}>
          <ChartShell
            title="Chat Answer Rate / SLA"
            tightLeft={!isSubmodule}
            onClick={!isSubmodule ? onSectionClick : undefined}
            isLoading={isLoading}
            isSubmodule={isSubmodule}
            showFilters={showFilters}
            series={series}
            legend={<span className="inline-flex items-center gap-1 font-bold text-[#2f6f9f]"><i className="h-2 w-2 rounded-full bg-[#2f6f9f]" />Answered ÷ Received</span>}
          >
            <ChatPercentageChart series={series} period={currentPeriod} isSubmodule={isSubmodule} showFilters={showFilters} scrollContainerRef={registerScroll} />
          </ChartShell>
        </div>

        <div className={isSubmodule ? "col-span-1" : "col-span-1 min-h-[160px] md:min-h-0 md:h-full flex flex-col"}>
          <ChartShell
            title="Chat Average Handling Time"
            tightLeft={!isSubmodule}
            onClick={!isSubmodule ? onSectionClick : undefined}
            isLoading={isLoading}
            isSubmodule={isSubmodule}
            showFilters={showFilters}
            series={series}
            legend={<span className="inline-flex items-center gap-1 font-bold text-[#4c9aca]"><i className="h-2 w-2 rounded-full bg-[#4c9aca]" />Valid Duration average</span>}
          >
            <ChatAhtChart series={series} period={currentPeriod} isSubmodule={isSubmodule} showFilters={showFilters} scrollContainerRef={registerScroll} />
          </ChartShell>
        </div>
      </div>
    </section>
  );
}

export { ChatSummaryCards };
