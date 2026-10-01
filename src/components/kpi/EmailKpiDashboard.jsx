import { CheckCircle2, Mail, Percent } from "lucide-react";
import { ChartShell } from "./CallKpiDashboard.jsx";
import { getCallAxisTicks } from "./callKpiDashboardUtils.js";

function formatNumber(value, digits = 0) {
  const number = Number(value || 0);
  return number.toLocaleString(undefined, { useGrouping: false, maximumFractionDigits: digits });
}

function formatPercent(value) {
  const number = Number(value || 0);
  if (number >= 100 || number.toFixed(2) === "100.00") return "100%";
  return `${formatNumber(value, 2)}%`;
}

function getTooltipPositionClass(periodIndex, seriesLength) {
  if (periodIndex === 0) return "left-0";
  if (periodIndex >= seriesLength - 1) return "right-0";
  return "left-1/2 -translate-x-1/2";
}

function EmptyChart({ message }) {
  return (
    <div className="flex min-h-64 items-center justify-center rounded-xl border border-dashed border-sibs-tertiary-8 bg-sibs-tertiary-10/30 px-3 text-center text-xs font-semibold text-sibs-tertiary-5">
      {message}
    </div>
  );
}

function EmailVolumeChart({ series = [], period }) {
  if (!series.length || !series.some((item) => Number(item.emailVolume || 0) > 0)) {
    return <EmptyChart message="No Email volume is available for this reporting range." />;
  }

  const maxValue = Math.max(
    1,
    ...series.flatMap((item) => [
      Number(item.emailVolume || 0),
      Number(item.handled || 0),
      Number(item.handledWithinSla || 0),
    ]),
  );
  const axisTicks = getCallAxisTicks(maxValue, 4);
  const axisMax = Math.max(1, axisTicks[0] || maxValue);
  const barsFor = (item) => [
    { label: "Volume", value: Number(item.emailVolume || 0), className: "bg-[#0b3b68]" },
    { label: "Handled", value: Number(item.handled || 0), className: "bg-[#2f6f9f]" },
    { label: "Handled w/SLA", value: Number(item.handledWithinSla || 0), className: "bg-[#4c9aca]" },
  ];

  const minPeriodWidth = 84;
  const isCustom = period === "custom";
  const isScrollable = isCustom ? series.length > 4 : series.length > 5;
  const trackWidth = isScrollable ? `${series.length * minPeriodWidth}px` : "100%";

  return (
    <div className="w-full min-w-0 select-none">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs font-bold text-sibs-tertiary-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[#0b3b68]" />Volume</span>
          <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[#2f6f9f]" />Handled</span>
          <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[#4c9aca]" />Handled w/SLA</span>
        </div>
        {(isScrollable || series.length > 3) && (
          <span className="text-[10px] font-semibold text-slate-400 select-none block sm:inline">
            Slide horizontally to view all {series.length} periods &rarr;
          </span>
        )}
      </div>

      <div className="flex w-full min-w-0">
        <div className="relative h-[300px] w-12 shrink-0 border-r border-sibs-tertiary-8 pr-1.5 bg-white z-10">
          {axisTicks.map((tick, index) => (
            <span key={`${tick}-${index}`} className="absolute right-1.5 -translate-y-1/2 text-[10px] font-semibold text-sibs-tertiary-5" style={{ top: `${(index / (axisTicks.length - 1)) * 100}%` }}>
              {formatNumber(tick)}
            </span>
          ))}
        </div>

        <div className="relative min-w-0 flex-1 overflow-x-auto overflow-y-hidden pb-1 sibs-chart-scrollbar">
          <div className="relative min-w-full w-max sm:w-full">
            <div className="relative flex h-[300px] w-full min-w-0 items-end gap-1.5 border-b border-sibs-tertiary-8 px-1 sm:gap-2.5">
              {/* Horizontal Gridlines spanning 100% of the bars container */}
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
                  className="relative z-10 flex h-full min-w-0 flex-1 items-end justify-center px-0.5 sm:px-1"
                  style={{ minWidth: `${minPeriodWidth}px` }}
                >
                  <div className="flex h-full w-full max-w-[120px] items-end justify-center gap-0">
                    {barsFor(item).map((bar, barIndex) => {
                      const height = bar.value > 0 ? Math.max(2, (bar.value / axisMax) * 100) : 0;
                      const inside = height > 10;
                      const volume = Number(item.emailVolume || 0);
                      const handled = Number(item.handled || 0);
                      const detailRate =
                        bar.label === "Handled"
                          ? Number(item.errPct || (volume > 0 ? (bar.value / volume) * 100 : 0))
                          : bar.label === "Handled w/SLA"
                          ? Number(item.serviceLevelPct || (handled > 0 ? (bar.value / handled) * 100 : 0))
                          : null;
                      const detailRateLabel = bar.label === "Handled" ? "ERR" : "SL %";

                      return (
                        <div
                          key={bar.label}
                          className="group/bar relative flex h-full min-w-0 flex-1 items-end justify-center"
                          aria-label={`${item.label} ${bar.label}: ${formatNumber(bar.value)}`}
                        >
                          {bar.value > 0 ? (
                            <span
                              className={`pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 whitespace-nowrap text-[8px] sm:text-[8.5px] 2xl:text-[9px] font-black tracking-tight transition-all duration-200 group-hover/bar:-translate-y-0.5 ${inside ? "text-white drop-shadow-xs" : "text-sibs-primary-1"}`}
                              style={{ bottom: inside ? `calc(${height}% - 17px)` : `calc(${height}% + 4px)` }}
                            >
                              {formatNumber(bar.value)}
                            </span>
                          ) : null}

                          {bar.value > 0 ? (
                            <div
                              className={`pointer-events-none absolute top-3 z-40 hidden w-44 max-w-[calc(100vw-2rem)] rounded-xl border border-sibs-tertiary-10/80 bg-white/95 p-2.5 shadow-xl backdrop-blur-md group-hover/bar:block ${getTooltipPositionClass(periodIndex, series.length)}`}
                            >
                              <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-1">
                                <span className="truncate text-xs font-black text-sibs-primary-1" title={item.label}>{item.label}</span>
                                <span className="shrink-0 text-[10px] font-bold text-sibs-tertiary-5">{bar.label}</span>
                              </div>

                              <div className="mt-1.5 flex items-center justify-between gap-3 text-xs">
                                <span className="flex items-center gap-1.5 font-bold text-slate-600">
                                  <span className={`h-2.5 w-2.5 rounded-full ${bar.className}`} />
                                  Emails:
                                </span>
                                <span className="font-extrabold text-sibs-primary-1">{formatNumber(bar.value)}</span>
                              </div>

                              {detailRate !== null ? (
                                <div className="mt-1 flex items-center justify-between gap-3 border-t border-slate-100 pt-1 text-[11px]">
                                  <span className="font-semibold text-slate-500">{detailRateLabel}:</span>
                                  <span className="font-extrabold text-sibs-primary-1">{formatPercent(detailRate)}</span>
                                </div>
                              ) : null}
                            </div>
                          ) : null}

                          <div className={`w-full max-w-[42px] rounded-t-[4px] ${bar.className} transition-all duration-200 group-hover/bar:brightness-110 group-hover/bar:-translate-y-0.5 shadow-xs`} style={{ height: `${height}%`, animationDelay: `${Math.min(periodIndex * 80 + barIndex * 40, 650)}ms` }} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex w-full min-w-full gap-1.5 px-1 sm:gap-2.5">
              {series.map((item, index) => (
                <div
                  key={item.key || index}
                  className="mt-2 min-w-0 flex-1 px-0.5 sm:px-1 text-center"
                  style={{ minWidth: `${minPeriodWidth}px` }}
                >
                  <p className="m-0 truncate text-[10.5px] font-extrabold text-sibs-primary-1 leading-tight" title={item.label}>{item.label}</p>
                  <p className="m-0 truncate text-[9px] font-semibold uppercase text-sibs-tertiary-5">Period {index + 1}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmailRateChart({ series = [], period }) {
  if (!series.length || !series.some((item) => Number(item.emailVolume || 0) > 0)) {
    return <EmptyChart message="No Email ERR or service level data is available for this reporting range." />;
  }

  const axisTicks = [100, 75, 50, 25, 0];
  const barsFor = (item) => [
    { label: "ERR", value: Number(item.errPct || 0), className: "bg-[#245d8f]" },
    { label: "SL %", value: Number(item.serviceLevelPct || 0), className: "bg-[#3f7fb5]" },
  ];

  const minPeriodWidth = 84;
  const isCustom = period === "custom";
  const isScrollable = isCustom ? series.length > 4 : series.length > 6;
  const trackWidth = isScrollable ? `${series.length * minPeriodWidth}px` : "100%";

  return (
    <div className="w-full min-w-0 select-none">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs font-bold text-sibs-tertiary-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[#245d8f]" />ERR</span>
          <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[#3f7fb5]" />SL %</span>
        </div>
        {(isScrollable || series.length > 3) && (
          <span className="text-[10px] font-semibold text-slate-400 select-none block sm:inline">
            Slide horizontally to view all {series.length} periods &rarr;
          </span>
        )}
      </div>

      <div className="flex w-full min-w-0">
        <div className="relative h-[300px] w-12 shrink-0 border-r border-sibs-tertiary-8 pr-1.5 bg-white z-10">
          {axisTicks.map((tick, index) => (
            <span key={tick} className="absolute right-1.5 -translate-y-1/2 text-[10px] font-semibold text-sibs-tertiary-5" style={{ top: `${(index / (axisTicks.length - 1)) * 100}%` }}>{tick}%</span>
          ))}
        </div>

        <div className="relative min-w-0 flex-1 overflow-x-auto overflow-y-hidden pb-1 sibs-chart-scrollbar">
          <div className="relative min-w-full w-max sm:w-full">
            <div className="relative flex h-[300px] min-w-0 items-end gap-1.5 border-b border-sibs-tertiary-8 px-1 sm:gap-2.5">
              {/* Horizontal Gridlines spanning 100% of the bars container */}
              <div className="pointer-events-none absolute inset-0">
                {axisTicks.map((tick, index) => (
                  <div
                    key={tick}
                    className="absolute left-0 right-0 border-t border-sibs-tertiary-9"
                    style={{ top: `${(index / (axisTicks.length - 1)) * 100}%` }}
                  />
                ))}
              </div>

              {series.map((item, periodIndex) => (
                <div
                  key={item.key || periodIndex}
                  className="relative z-10 flex h-full min-w-0 flex-1 items-end justify-center px-0.5 sm:px-1"
                  style={{ minWidth: `${minPeriodWidth}px` }}
                >
                  <div className="flex h-full w-full max-w-[82px] items-end justify-center gap-0">
                    {barsFor(item).map((bar) => {
                      const value = Math.max(0, Math.min(100, bar.value));
                      const isErr = bar.label === "ERR";
                      const isInsideBar = value > 10;
                      const labelBottom = isInsideBar
                        ? `calc(${value}% - 17px)`
                        : `calc(${value}% + 4px)`;

                      return (
                        <div
                          key={bar.label}
                          className="group/bar relative flex h-full min-w-0 flex-1 items-end justify-center"
                          aria-label={`${item.label} ${bar.label}: ${formatPercent(value)}`}
                        >
                          {value > 0 ? (
                            <span
                              className={`pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 whitespace-nowrap text-[8px] sm:text-[8.5px] 2xl:text-[9px] font-black transition-all duration-200 group-hover/bar:-translate-y-0.5 ${
                                isInsideBar
                                  ? "text-white drop-shadow-xs"
                                  : "text-sibs-primary-1"
                              }`}
                              style={{ bottom: labelBottom }}
                            >
                              {value >= 100 || value.toFixed(2) === "100.00"
                                ? "100%"
                                : `${value.toFixed(2)}%`}
                            </span>
                          ) : null}

                          {value > 0 ? (
                            <div
                              className={`pointer-events-none absolute top-3 z-40 hidden w-48 max-w-[calc(100vw-2rem)] rounded-xl border border-sibs-tertiary-10/80 bg-white/95 p-2.5 shadow-xl backdrop-blur-md group-hover/bar:block ${getTooltipPositionClass(periodIndex, series.length)}`}
                            >
                              <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-1">
                                <span className="truncate text-xs font-black text-sibs-primary-1" title={item.label}>{item.label}</span>
                                <span className="shrink-0 text-[10px] font-bold text-sibs-tertiary-5">{bar.label}</span>
                              </div>

                              <div className="mt-1.5 flex items-center justify-between gap-3 text-xs">
                                <span className="flex items-center gap-1.5 font-bold text-slate-600">
                                  <span className={`h-2.5 w-2.5 rounded-full ${bar.className}`} />
                                  {bar.label}:
                                </span>
                                <span className="font-extrabold text-sibs-primary-1">{formatPercent(value)}</span>
                              </div>

                              <div className="mt-1 space-y-1 border-t border-slate-100 pt-1 text-[10.5px] text-slate-500">
                                {isErr ? (
                                  <>
                                    <div className="flex items-center justify-between gap-3">
                                      <span>Handled:</span>
                                      <span className="font-bold text-slate-700">{formatNumber(item.handled)}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-3">
                                      <span>Volume:</span>
                                      <span className="font-bold text-slate-700">{formatNumber(item.emailVolume)}</span>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="flex items-center justify-between gap-3">
                                      <span>Handled w/SLA:</span>
                                      <span className="font-bold text-slate-700">{formatNumber(item.handledWithinSla)}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-3">
                                      <span>Handled:</span>
                                      <span className="font-bold text-slate-700">{formatNumber(item.handled)}</span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          ) : null}

                          <div className={`w-full max-w-[42px] rounded-t-[4px] ${bar.className} transition-all duration-200 group-hover/bar:brightness-110 group-hover/bar:-translate-y-0.5 shadow-xs`} style={{ height: `${value}%` }} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex w-full min-w-full gap-1.5 px-1 sm:gap-2.5">
              {series.map((item, index) => (
                <div
                  key={item.key || index}
                  className="mt-2 min-w-0 flex-1 px-0.5 sm:px-1 text-center"
                  style={{ minWidth: `${minPeriodWidth}px` }}
                >
                  <p className="m-0 truncate text-[10.5px] font-extrabold text-sibs-primary-1 leading-tight" title={item.label}>{item.label}</p>
                  <p className="m-0 truncate text-[9px] font-semibold uppercase text-sibs-tertiary-5">Period {index + 1}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmailSummaryCards({ summary = {} }) {
  const cards = [
    { label: "Email Volume", value: formatNumber(summary.emailVolume), icon: Mail, hint: "Distinct Email cases created" },
    { label: "Handled", value: formatNumber(summary.handled), icon: CheckCircle2, hint: "Resolved + mapped Modified By" },
    { label: "Handled w/SLA", value: formatNumber(summary.handledWithinSla), icon: CheckCircle2, hint: "Handled within 2 business days" },
    { label: "ERR", value: formatPercent(summary.errPct), icon: Percent, hint: "Handled ÷ Email Volume" },
    { label: "SL %", value: formatPercent(summary.serviceLevelPct), icon: Percent, hint: "Handled w/SLA ÷ Handled" },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
      {cards.map(({ label, value, icon: Icon, hint }, idx) => (
        <div key={label} className={idx === cards.length - 1 ? "col-span-2 sm:col-span-1 xl:col-span-1" : ""}>
          <article className="sibs-card min-w-0 px-3 py-2.5 shadow-xs h-full">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-[10px] font-extrabold uppercase tracking-wider text-sibs-tertiary-5">{label}</span>
              <span className="rounded-md bg-sibs-primary-3/50 p-1 text-sibs-primary-1 shrink-0"><Icon size={13} /></span>
            </div>
            <div className="mt-1 text-lg sm:text-xl font-black text-sibs-primary-1 truncate">{value}</div>
            <p className="m-0 mt-0.5 truncate text-[10px] font-medium text-sibs-tertiary-5" title={hint}>{hint}</p>
          </article>
        </div>
      ))}
    </div>
  );
}

export default function EmailKpiDashboard({ data = {}, showSummaryCards = true }) {
  const series = Array.isArray(data.series) ? data.series : [];
  const period = data.filters?.period || data.data?.filters?.period;

  return (
    <section className="space-y-3">
      {showSummaryCards ? <EmailSummaryCards summary={data.summary || {}} /> : null}

      <div className="grid grid-cols-1 gap-3.5 2xl:grid-cols-2">
        <ChartShell title="Emails" subtitle="Volume, handled, and handled within 2 business days">
          <EmailVolumeChart series={series} period={period} />
        </ChartShell>
        <ChartShell title="Email Response & Service Level" subtitle="ERR = handled ÷ volume; SL = handled within SLA ÷ handled">
          <EmailRateChart series={series} period={period} />
        </ChartShell>
      </div>
    </section>
  );
}
