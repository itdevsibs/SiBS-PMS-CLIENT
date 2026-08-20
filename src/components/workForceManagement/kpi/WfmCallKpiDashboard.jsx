import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Clock3, Gauge, PhoneCall } from "lucide-react";
import {
  buildVolumeBarItems,
  convertDurationToSeconds,
  getCallAxisTicks,
} from "./wfmCallKpiDashboardUtils.js";

function formatNumber(value, digits = 0) {
  const number = Number(value || 0);
  return number.toLocaleString(undefined, { maximumFractionDigits: digits });
}

function formatPercent(value) {
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

function KpiCard({ icon: Icon, label, value, hint, status }) {
  return (
    <article className="sibs-card min-w-0 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="m-0 text-[11px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
            {label}
          </p>

          <p className="mt-2 mb-0 text-2xl font-extrabold text-sibs-primary-1">
            {value}
          </p>

          {hint ? (
            <p className="mt-1 mb-0 text-xs font-medium text-sibs-tertiary-5">
              {hint}
            </p>
          ) : null}
        </div>

        <div className="rounded-xl bg-sibs-primary-3/50 p-2.5 text-sibs-primary-1">
          <Icon size={20} />
        </div>
      </div>

      {status ? (
        <div
          className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${status.className}`}
        >
          {status.label}
        </div>
      ) : null}
    </article>
  );
}

function ChartShell({ title, subtitle, children }) {
  return (
    <article className="sibs-card overflow-hidden">
      <div className="border-b border-sibs-tertiary-10 bg-sibs-primary-3/30 px-4 py-3 sm:px-5">
        <h3 className="m-0 text-sm font-extrabold uppercase tracking-[0.18em] text-sibs-primary-1">
          {title}
        </h3>

        {subtitle ? (
          <p className="mt-1 mb-0 text-xs text-sibs-tertiary-5">
            {subtitle}
          </p>
        ) : null}
      </div>

      <div className="overflow-x-auto p-4 sm:p-5">{children}</div>
    </article>
  );
}

function EmptyChart({ message = "No KPI data is available for this reporting range." }) {
  return (
    <div className="flex min-h-56 items-center justify-center rounded-xl border border-dashed border-sibs-tertiary-8 bg-sibs-tertiary-10/30 px-4 text-center text-sm font-semibold text-sibs-tertiary-5">
      {message}
    </div>
  );
}

function VolumeChart({ series }) {
  if (!series.length) return <EmptyChart message="No call volume recorded for this reporting range." />;

  const totalVolume = series.reduce(
    (acc, item) => acc + Number(item.callsOffered || 0),
    0,
  );

  if (totalVolume === 0) {
    return <EmptyChart message="No call volume recorded for this reporting range." />;
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

  return (
    <div className="w-full min-w-0">
      <div className="mb-4 flex flex-wrap gap-4 text-xs font-bold text-sibs-tertiary-5">
        <span>
          <i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full bg-[#0b3b68]" />
          Volume
        </span>

        <span>
          <i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full bg-[#2f6f9f]" />
          Handled
        </span>

        <span>
          <i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full bg-[#4c9aca]" />
          Handled w/SLA
        </span>
      </div>

      <div className="flex h-64 w-full min-w-0">
        <div className="relative h-52 w-14 shrink-0 border-r border-sibs-tertiary-8 pr-2">
          {axisTicks.map((tick, index) => (
            <span
              key={`${tick}-${index}`}
              className="absolute right-2 -translate-y-1/2 text-[10px] font-semibold text-sibs-tertiary-5"
              style={{
                top: `${(index / (axisTicks.length - 1)) * 100}%`,
              }}
            >
              {formatNumber(tick)}
            </span>
          ))}
        </div>

        <div className="relative min-w-0 flex-1">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-52">
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

          <div className="relative flex h-64 min-w-0 items-end gap-3 border-b border-sibs-tertiary-8 px-2 sm:gap-4 md:gap-5 xl:gap-7">
            {series.map((item, periodIndex) => (
              <div
                key={item.key}
                className="group/period flex min-w-0 flex-1 flex-col items-center justify-end px-0.5 sm:px-1"
              >
                <div className="flex h-52 w-full min-w-0 items-end justify-center gap-1 sm:gap-1.5 md:gap-2">
                  {buildVolumeBarItems(item).map(
                    ({ metric, value, className }) => {
                      const numericValue = Number(value || 0);

                      const heightPercent =
                        numericValue > 0
                          ? Math.max(2, (numericValue / axisMax) * 100)
                          : 0;

                      const tooltipIsNearTop = heightPercent >= 72;

                      return (
                        <div
                          key={metric}
                          className="group/bar flex h-full min-w-0 flex-1 items-end justify-center"
                        >
                          <div
                            className="relative flex h-full w-full max-w-[44px] items-end justify-center"
                            aria-label={`${item.label} ${metric}: ${formatNumber(
                              numericValue,
                            )}`}
                          >
                            {numericValue > 0 ? (
                              <span
                                className="pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 whitespace-nowrap text-[10px] font-extrabold text-sibs-primary-1 transition-all duration-200 group-hover/bar:-translate-y-1"
                                style={{
                                  bottom: `calc(${heightPercent}% + 5px)`,
                                }}
                              >
                                {formatNumber(numericValue)}
                              </span>
                            ) : null}

                            {/* White Card Tooltip (matches LineChart style, clamped to avoid scrollbar) */}
                            <div
                              className={`pointer-events-none absolute z-30 hidden min-w-[160px] rounded-xl border border-sibs-tertiary-10/80 bg-white/95 p-2.5 shadow-xl backdrop-blur-md group-hover/bar:block ${
                                periodIndex >= series.length - 1
                                  ? "right-0 translate-x-0"
                                  : periodIndex === 0
                                  ? "left-0 translate-x-0"
                                  : "left-1/2 -translate-x-1/2"
                              }`}
                              style={
                                tooltipIsNearTop
                                  ? {
                                      top: "8px",
                                    }
                                  : {
                                      bottom: `calc(${heightPercent}% + 28px)`,
                                    }
                              }
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
                                    className={`h-2 w-2 rounded-full ${
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
                                  {formatNumber(numericValue)}
                                </span>
                              </div>

                              {metric !== "Volume" &&
                                Number(item.callsOffered || 0) > 0 && (
                                  <div className="mt-1 flex items-center justify-between border-t border-slate-100 pt-1 text-[10.5px]">
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
                              className={`w-full max-w-[40px] rounded-t-md shadow-sm transition-all duration-200 ease-out group-hover/bar:-translate-y-1 group-hover/bar:brightness-110 group-hover/bar:shadow-md ${className}`}
                              style={{
                                height: `${heightPercent}%`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>

                <div className="mt-2 w-full px-0.5 py-1.5 text-center">
                  <p
                    className="m-0 truncate text-[11px] font-extrabold text-sibs-primary-1"
                    title={item.label}
                  >
                    {item.label}
                  </p>

                  <p className="mt-0.5 mb-0 text-[9px] font-bold uppercase tracking-[0.12em] text-sibs-tertiary-5">
                    Period {periodIndex + 1}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function LineChart({ series, target = 90 }) {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  if (!series.length) return <EmptyChart message="No answer rate or service level data available for this reporting range." />;

  const activeSeries = series.filter(
    (item) => Number(item.callsOffered || 0) > 0,
  );

  if (activeSeries.length === 0) {
    return (
      <EmptyChart message="No answer rate or service level data available for this reporting range." />
    );
  }

  const numericTarget = Number(target || 90);
  const width = Math.max(680, containerWidth || 720);
  const height = 270;
  const paddingLeft = 56;
  const paddingRight = 84;
  const chartTop = 32;
  const chartBottom = 205;
  const usableWidth = width - paddingLeft - paddingRight;

  const getX = (index) =>
    series.length > 1
      ? paddingLeft + (index / (series.length - 1)) * usableWidth
      : paddingLeft + usableWidth / 2;

  const getY = (val) => {
    const clamped = Math.max(0, Math.min(100, Number(val || 0)));
    return chartBottom - (clamped / 100) * (chartBottom - chartTop);
  };

  const answerPts = series.map((item, index) => ({
    x: getX(index),
    y: getY(item.answerRatePct),
  }));

  const slPts = series.map((item, index) => ({
    x: getX(index),
    y: getY(item.serviceLevelPct),
  }));

  // Smooth Bezier path generator with clamping
  const getCurvedPath = (pts) => {
    if (!pts || pts.length === 0) return "";
    if (pts.length === 1) return `M ${pts[0].x},${pts[0].y}`;
    if (pts.length === 2) {
      return `M ${pts[0].x},${pts[0].y} L ${pts[1].x},${pts[1].y}`;
    }

    let d = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i += 1) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(pts.length - 1, i + 2)];

      if (Math.abs(p1.y - p2.y) < 0.1) {
        d += ` L ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
        continue;
      }

      const tension = 0.2;
      let cp1x = p1.x + (p2.x - p0.x) * tension;
      let cp1y = p1.y + (p2.y - p0.y) * tension;
      let cp2x = p2.x - (p3.x - p1.x) * tension;
      let cp2y = p2.y - (p3.y - p1.y) * tension;

      const minY = Math.min(p1.y, p2.y);
      const maxY = Math.max(p1.y, p2.y);
      cp1y = Math.max(minY, Math.min(maxY, cp1y));
      cp2y = Math.max(minY, Math.min(maxY, cp2y));

      d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }
    return d;
  };

  const answerCurve = getCurvedPath(answerPts);
  const slCurve = getCurvedPath(slPts);

  const firstX = answerPts[0]?.x || paddingLeft;
  const lastX = answerPts[answerPts.length - 1]?.x || width - paddingRight;

  const answerArea = `${answerCurve} L ${lastX.toFixed(1)},${chartBottom} L ${firstX.toFixed(1)},${chartBottom} Z`;
  const slArea = `${slCurve} L ${lastX.toFixed(1)},${chartBottom} L ${firstX.toFixed(1)},${chartBottom} Z`;

  const targetY = getY(numericTarget);

  // Active / Latest period for header summary
  const activeItem =
    hoveredIndex !== null ? series[hoveredIndex] : series[series.length - 1];

  const activeAnswer = Number(activeItem?.answerRatePct || 0);
  const activeSl = Number(activeItem?.serviceLevelPct || 0);
  const isTargetMet = activeSl >= numericTarget;

  return (
    <div ref={containerRef} className="w-full min-w-0 select-none">
      {/* Chart Top Bar / Legends & Quick Status */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-sibs-tertiary-10/70 pb-3">
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 text-xs font-bold text-sibs-tertiary-5">
          <div className="flex items-center gap-2 rounded-lg bg-blue-50/80 px-2.5 py-1 text-[#0b3b68] ring-1 ring-blue-100">
            <span className="h-2.5 w-2.5 rounded-full bg-[#0b3b68] shadow-sm" />
            <span className="font-extrabold">Answer Rate</span>
            <span className="text-xs font-black text-sibs-primary-1">
              {Number(activeItem?.callsOffered || 0) > 0 ? formatPercent(activeAnswer) : "--"}
            </span>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-cyan-50/80 px-2.5 py-1 text-[#0284c7] ring-1 ring-cyan-100">
            <span className="h-2.5 w-2.5 rounded-full bg-[#0284c7] shadow-sm" />
            <span className="font-extrabold">Service Level (SL)</span>
            <span className="text-xs font-black text-sibs-primary-1">
              {Number(activeItem?.callsOffered || 0) > 0 ? formatPercent(activeSl) : "--"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg bg-red-50/80 px-2.5 py-1 text-red-600 ring-1 ring-red-100">
            <span className="inline-block h-0.5 w-3.5 bg-red-500 rounded" />
            <span className="font-extrabold">SL Target ({numericTarget}%)</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
              Number(activeItem?.callsOffered || 0) === 0
                ? "bg-slate-100 text-slate-600"
                : isTargetMet
                ? "bg-emerald-100 text-emerald-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {activeItem?.label ? `${activeItem.label}: ` : ""}
            {Number(activeItem?.callsOffered || 0) === 0
              ? "No Call Volume"
              : isTargetMet
              ? "SL Target Met"
              : "Below SL Target"}
          </span>
        </div>
      </div>

      {/* Interactive Chart Canvas */}
      <div
        className="relative overflow-x-auto"
        onMouseLeave={() => setHoveredIndex(null)}
      >
        <div style={{ minWidth: width, position: "relative" }}>
          <svg
            width={width}
            height={height}
            className="overflow-visible"
            role="img"
            aria-label="Answer rate and service level trend"
          >
            <defs>
              {/* Answer Rate Gradient Area */}
              <linearGradient
                id="answerRateGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#0b3b68" stopOpacity="0.18" />
                <stop offset="90%" stopColor="#0b3b68" stopOpacity="0.01" />
              </linearGradient>

              {/* Service Level Gradient Area */}
              <linearGradient id="slGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0284c7" stopOpacity="0.22" />
                <stop offset="90%" stopColor="#0284c7" stopOpacity="0.01" />
              </linearGradient>

              {/* Drop Shadow for active markers */}
              <filter
                id="markerShadow"
                x="-30%"
                y="-30%"
                width="160%"
                height="160%"
              >
                <feDropShadow
                  dx="0"
                  dy="1.5"
                  stdDeviation="1.5"
                  floodOpacity="0.25"
                />
              </filter>
            </defs>

            {/* Horizontal Gridlines & Y-Axis Percentages */}
            {[0, 25, 50, 75, 100].map((tick) => {
              const tickY = getY(tick);
              return (
                <g key={tick}>
                  <line
                    x1={paddingLeft}
                    x2={width - 24}
                    y1={tickY}
                    y2={tickY}
                    stroke="#e2e8f0"
                    strokeDasharray={tick === 0 ? "none" : "3 3"}
                    strokeWidth={tick === 0 ? "1.5" : "1"}
                  />
                  <text
                    x={paddingLeft - 8}
                    y={tickY + 3.5}
                    textAnchor="end"
                    fontSize="10"
                    fontWeight="600"
                    fill="#64748b"
                  >
                    {tick}%
                  </text>
                </g>
              );
            })}

            {/* SL Target Reference Line */}
            <g>
              <line
                x1={paddingLeft}
                x2={width - paddingRight + 4}
                y1={targetY}
                y2={targetY}
                stroke="#ef4444"
                strokeWidth="1.75"
                strokeDasharray="6 4"
              />
              {/* Target Badge on Right Axis */}
              <rect
                x={width - paddingRight + 6}
                y={targetY - 9}
                width={70}
                height={18}
                rx={4}
                fill="#fee2e2"
                stroke="#fca5a5"
                strokeWidth="1"
              />
              <text
                x={width - paddingRight + 41}
                y={targetY + 3.5}
                textAnchor="middle"
                fontSize="9.5"
                fontWeight="800"
                fill="#b91c1c"
              >
                Target {numericTarget}%
              </text>
            </g>

            {/* Gradient Area Fills */}
            <path
              d={answerArea}
              fill="url(#answerRateGradient)"
              className="pointer-events-none"
            />
            <path
              d={slArea}
              fill="url(#slGradient)"
              className="pointer-events-none"
            />

            {/* Smooth Spline Lines */}
            <path
              d={answerCurve}
              fill="none"
              stroke="#0b3b68"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="pointer-events-none"
            />
            <path
              d={slCurve}
              fill="none"
              stroke="#0284c7"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="pointer-events-none"
            />

            {/* Vertical Guide Line on Hover */}
            {hoveredIndex !== null && (
              <line
                x1={getX(hoveredIndex)}
                x2={getX(hoveredIndex)}
                y1={chartTop}
                y2={chartBottom}
                stroke="#94a3b8"
                strokeWidth="1.5"
                strokeDasharray="3 3"
                className="pointer-events-none"
              />
            )}

            {/* Data Points & X-Axis Labels */}
            {series.map((item, index) => {
              const x = getX(index);
              const answerY = getY(item.answerRatePct);
              const slY = getY(item.serviceLevelPct);
              const isHovered = hoveredIndex === index;
              const isLatest = index === series.length - 1 && hoveredIndex === null;
              const hasNoCalls = Number(item.callsOffered || 0) === 0;

              return (
                <g key={item.key || index} className="transition-all duration-200">
                  {/* Answer % Point */}
                  <circle
                    cx={x}
                    cy={answerY}
                    r={isHovered ? "6" : isLatest ? "5" : "4"}
                    fill="#0b3b68"
                    stroke="#ffffff"
                    strokeWidth={isHovered ? "2.5" : "2"}
                    filter="url(#markerShadow)"
                    className="transition-all duration-150"
                  />

                  {/* SL % Point */}
                  <circle
                    cx={x}
                    cy={slY}
                    r={isHovered ? "6" : isLatest ? "5" : "4"}
                    fill="#0284c7"
                    stroke="#ffffff"
                    strokeWidth={isHovered ? "2.5" : "2"}
                    filter="url(#markerShadow)"
                    className="transition-all duration-150"
                  />

                  {/* Value Badges on Hovered / Latest Active Point */}
                  {(isHovered || isLatest) && (
                    <g className="pointer-events-none">
                      <rect
                        x={x - 22}
                        y={Math.min(answerY, slY) === answerY ? answerY - 22 : answerY + 8}
                        width={44}
                        height={16}
                        rx={3}
                        fill="#0b3b68"
                      />
                      <text
                        x={x}
                        y={Math.min(answerY, slY) === answerY ? answerY - 11 : answerY + 19}
                        textAnchor="middle"
                        fontSize="9"
                        fontWeight="800"
                        fill="#ffffff"
                      >
                        {formatNumber(item.answerRatePct, 1)}%
                      </text>

                      <rect
                        x={x - 22}
                        y={Math.min(answerY, slY) === slY ? slY - 22 : slY + 8}
                        width={44}
                        height={16}
                        rx={3}
                        fill="#0284c7"
                      />
                      <text
                        x={x}
                        y={Math.min(answerY, slY) === slY ? slY - 11 : slY + 19}
                        textAnchor="middle"
                        fontSize="9"
                        fontWeight="800"
                        fill="#ffffff"
                      >
                        {formatNumber(item.serviceLevelPct, 1)}%
                      </text>
                    </g>
                  )}

                  {/* X-Axis Label */}
                  <text
                    x={x}
                    y={chartBottom + 20}
                    textAnchor="middle"
                    fontSize={isHovered || isLatest ? "11" : "10.5"}
                    fontWeight={isHovered || isLatest ? "800" : "700"}
                    fill={isHovered || isLatest ? "#0b3b68" : "#475569"}
                  >
                    {item.label}
                  </text>

                  {/* Sub-label showing calls or "No calls" */}
                  <text
                    x={x}
                    y={chartBottom + 32}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="600"
                    fill={hasNoCalls ? "#94a3b8" : "#64748b"}
                  >
                    {hasNoCalls ? "0 calls" : `${formatNumber(item.callsOffered)} calls`}
                  </text>
                </g>
              );
            })}

            {/* Mathematically precise SVG hover capture columns */}
            {series.map((item, index) => {
              const currentX = getX(index);
              const prevX = index > 0 ? getX(index - 1) : 0;
              const nextX = index < series.length - 1 ? getX(index + 1) : width;

              const startX = index === 0 ? 0 : (prevX + currentX) / 2;
              const endX = index === series.length - 1 ? width : (currentX + nextX) / 2;
              const rectWidth = Math.max(1, endX - startX);

              return (
                <rect
                  key={`hover-col-${item.key || index}`}
                  x={startX}
                  y={0}
                  width={rectWidth}
                  height={height}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseMove={() => setHoveredIndex(index)}
                  onClick={() => setHoveredIndex(index)}
                />
              );
            })}
          </svg>

          {/* Floating Tooltip Card */}
          {hoveredIndex !== null && (
            <div
              className="pointer-events-none absolute z-30 transition-all duration-150 ease-out"
              style={{
                left: `${getX(hoveredIndex)}px`,
                top: "10px",
                transform:
                  hoveredIndex >= series.length - 2
                    ? "translateX(-100%) translateX(24px)"
                    : hoveredIndex <= 1
                    ? "translateX(-16px)"
                    : "translateX(-50%)",
              }}
            >
              <div className="min-w-[210px] rounded-xl border border-sibs-tertiary-10/80 bg-white/95 p-3 shadow-xl backdrop-blur-md">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-xs font-black text-sibs-primary-1">
                    {series[hoveredIndex].label}
                  </span>
                  <span className="text-[10px] font-bold text-sibs-tertiary-5">
                    {formatNumber(series[hoveredIndex].callsOffered)} calls offered
                  </span>
                </div>

                <div className="mt-2 space-y-1.5">
                  {Number(series[hoveredIndex].callsOffered || 0) > 0 ? (
                    <>
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 font-bold text-[#0b3b68]">
                          <span className="h-2 w-2 rounded-full bg-[#0b3b68]" />
                          Answer Rate:
                        </span>
                        <span className="font-extrabold text-sibs-primary-1">
                          {formatPercent(series[hoveredIndex].answerRatePct)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 font-bold text-[#0284c7]">
                          <span className="h-2 w-2 rounded-full bg-[#0284c7]" />
                          Service Level:
                        </span>
                        <span className="font-extrabold text-sibs-primary-1">
                          {formatPercent(series[hoveredIndex].serviceLevelPct)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-1 text-[11px]">
                        <span className="font-semibold text-slate-500">Handled:</span>
                        <span className="font-bold text-slate-700">
                          {formatNumber(series[hoveredIndex].callsHandled)} (
                          {formatNumber(series[hoveredIndex].handledWithinSla)} w/SLA)
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-0.5">
                        <span className="font-semibold text-slate-500">Target ({numericTarget}%):</span>
                        <span
                          className={`font-extrabold ${
                            Number(series[hoveredIndex].serviceLevelPct || 0) >= numericTarget
                              ? "text-emerald-600"
                              : "text-amber-600"
                          }`}
                        >
                          {Number(series[hoveredIndex].serviceLevelPct || 0) >= numericTarget
                            ? `✓ +${formatNumber(
                                Number(series[hoveredIndex].serviceLevelPct || 0) - numericTarget,
                                1,
                              )}%`
                            : `✗ -${formatNumber(
                                numericTarget - Number(series[hoveredIndex].serviceLevelPct || 0),
                                1,
                              )}%`}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="py-2 text-center text-xs font-semibold text-sibs-tertiary-5">
                      No call volume recorded in this period.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AhtChart({ series, target }) {
  if (!series.length) return <EmptyChart message="No average handling time data available for this reporting range." />;

  const normalizedTarget = convertDurationToSeconds(target);
  const activeAhtSeries = series.filter(
    (item) => convertDurationToSeconds(item.ahtSeconds) > 0,
  );

  if (activeAhtSeries.length === 0) {
    return <EmptyChart message="No average handling time data available for this reporting range." />;
  }

  const maxValue = Math.max(
    normalizedTarget,
    ...series.map((item) =>
      convertDurationToSeconds(item.ahtSeconds),
    ),
    1,
  );

  const targetPosition = Math.min(
    100,
    (normalizedTarget / maxValue) * 100,
  );

  return (
    <div className="min-w-[720px]">
      <div className="mb-4 flex items-center gap-4 text-xs font-bold text-sibs-tertiary-5">
        <span>
          <i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full bg-[#0b3b68]" />
          Call AHT
        </span>

        <span>
          <i className="mr-1.5 inline-block h-0.5 w-4 align-middle bg-red-500" />
          Target ({formatNumber(normalizedTarget)} sec)
        </span>
      </div>

      <div className="relative flex h-64 items-end gap-5 border-b border-sibs-tertiary-8 px-3">
        <div
          className="pointer-events-none absolute right-3 left-3 border-t-2 border-dashed border-red-500"
          style={{
            bottom: `calc(32px + ${targetPosition * 1.9}px)`,
          }}
        />

        {series.map((item, itemIndex) => {
          const ahtSec = convertDurationToSeconds(item.ahtSeconds);
          const hasAht = ahtSec > 0;
          const heightPct = Math.max(2, (ahtSec / maxValue) * 100);

          return (
            <div
              key={item.key}
              className="group/aht relative z-10 flex min-w-[88px] flex-1 flex-col items-center justify-end"
            >
              {hasAht ? (
                <p className="mb-1 text-[10px] font-extrabold text-sibs-primary-1">
                  {formatNumber(ahtSec, 2)}
                </p>
              ) : (
                <span className="mb-1 text-[10px] font-semibold text-slate-400">-</span>
              )}

              {/* White Card Tooltip (clamped on edges to prevent scrollbars) */}
              {hasAht ? (
                <div
                  className={`pointer-events-none absolute z-30 hidden min-w-[170px] rounded-xl border border-sibs-tertiary-10/80 bg-white/95 p-2.5 shadow-xl backdrop-blur-md group-hover/aht:block ${
                    itemIndex >= series.length - 1
                      ? "right-0 translate-x-0"
                      : itemIndex === 0
                      ? "left-0 translate-x-0"
                      : "left-1/2 -translate-x-1/2"
                  }`}
                  style={{
                    bottom: `calc(${heightPct * 1.8}px + 48px)`,
                  }}
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                    <span className="text-xs font-black text-sibs-primary-1">
                      {item.label}
                    </span>
                    <span className="text-[10px] font-bold text-sibs-tertiary-5">
                      Call AHT
                    </span>
                  </div>

                  <div className="mt-1.5 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 font-bold text-[#0b3b68]">
                        <span className="h-2 w-2 rounded-full bg-[#0b3b68]" />
                        Average:
                      </span>
                      <span className="font-extrabold text-sibs-primary-1">
                        {formatDuration(ahtSec)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-1 text-[10.5px]">
                      <span className="font-semibold text-slate-500">Seconds:</span>
                      <span className="font-bold text-slate-700">
                        {formatNumber(ahtSec, 1)}s
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10.5px]">
                      <span className="font-semibold text-slate-500">
                        Target ({formatNumber(normalizedTarget)}s):
                      </span>
                      <span
                        className={`font-extrabold ${
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

              <div className="flex h-48 w-full items-end justify-center">
                {hasAht ? (
                  <div
                    className="w-12 rounded-t bg-[#0b3b68] transition-all duration-200 group-hover/aht:brightness-110 group-hover/aht:-translate-y-0.5 group-hover/aht:shadow-md"
                    style={{
                      height: `${heightPct}%`,
                    }}
                  />
                ) : (
                  <div className="h-0.5 w-8 rounded bg-slate-200" />
                )}
              </div>

              <p className="mt-2 mb-0 text-center text-[11px] font-bold text-sibs-primary-1">
                {item.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function WfmCallKpiDashboard({ data }) {
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

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
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
          value={formatDuration(summaryAhtSeconds)}
          hint={`${formatNumber(
            summaryAhtSeconds,
          )} sec • Target ${formatNumber(
            targetAhtSeconds,
          )} sec`}
          status={{
            label: ahtMet
              ? "Target met"
              : "Above target",
            className: ahtMet
              ? "bg-green-100 text-green-700"
              : "bg-amber-100 text-amber-700",
          }}
        />
      </div>

      <ChartShell
        title="Calls"
        subtitle="Volume, handled calls, and handled within SLA"
      >
        <VolumeChart
          series={
            series.length
              ? series
              : data?.data?.series || []
          }
        />
      </ChartShell>

      <ChartShell
        title="Answer Rate & Service Level"
        subtitle="Answer % and service level performance against target"
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
        />
      </ChartShell>

      <ChartShell
        title="Average Handling Time"
        subtitle="Call AHT measured in seconds against the current target"
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
        />
      </ChartShell>
    </div>
  );
}