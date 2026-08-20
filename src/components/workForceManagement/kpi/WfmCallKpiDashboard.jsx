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
    <article className="sibs-card min-w-0 px-3.5 py-2.5 shadow-xs flex flex-col justify-center gap-1">
      <div className="flex items-center justify-between gap-1.5">
        <p className="m-0 text-[10.5px] font-extrabold uppercase tracking-wider text-sibs-tertiary-5 truncate">
          {label}
        </p>
        <div className="rounded-md bg-sibs-primary-3/50 p-1.5 text-sibs-primary-1 shrink-0">
          <Icon size={14} />
        </div>
      </div>

      <div className="flex flex-wrap items-baseline gap-1.5 min-w-0">
        <span className="text-2xl font-black text-sibs-primary-1 leading-none">
          {value}
        </span>

        {hint ? (
          <span className="truncate text-[11px] font-medium text-sibs-tertiary-5">
            {hint}
          </span>
        ) : null}

        {status ? (
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold ${status.className} ml-auto`}
          >
            {status.label}
          </span>
        ) : null}
      </div>
    </article>
  );
}

function ChartShell({ title, subtitle, children }) {
  return (
    <article className="sibs-card overflow-hidden flex flex-col h-full shadow-xs">
      <div className="border-b border-sibs-tertiary-10 bg-sibs-primary-3/30 px-4 py-2.5">
        <h3 className="m-0 text-xs font-extrabold uppercase tracking-[0.14em] text-sibs-primary-1">
          {title}
        </h3>

        {subtitle ? (
          <p className="mt-0.5 mb-0 text-[10.5px] text-sibs-tertiary-5 truncate">
            {subtitle}
          </p>
        ) : null}
      </div>

      <div className="p-3.5 flex-1 flex flex-col justify-between overflow-x-auto">
        {children}
      </div>
    </article>
  );
}

function EmptyChart({ message = "No KPI data is available for this reporting range." }) {
  return (
    <div className="flex min-h-64 items-center justify-center rounded-xl border border-dashed border-sibs-tertiary-8 bg-sibs-tertiary-10/30 px-3 text-center text-xs font-semibold text-sibs-tertiary-5">
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
      <div className="mb-3 flex flex-wrap gap-3 text-xs font-bold text-sibs-tertiary-5">
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

      <div className="flex h-[340px] w-full min-w-0">
        <div className="relative h-[270px] w-12 shrink-0 border-r border-sibs-tertiary-8 pr-1.5">
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

        <div className="relative min-w-0 flex-1">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[270px]">
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

          <div className="relative flex h-[340px] min-w-0 items-end gap-1.5 border-b border-sibs-tertiary-8 px-1 sm:gap-2.5">
            {series.map((item, periodIndex) => (
              <div
                key={item.key}
                className="group/period flex min-w-0 flex-1 flex-col items-center justify-end px-0.5"
              >
                <div className="flex h-[270px] w-full min-w-0 items-end justify-center gap-1 sm:gap-1.5">
                  {buildVolumeBarItems(item).map(
                    ({ metric, value, className }) => {
                      const numericValue = Number(value || 0);

                      const heightPercent =
                        numericValue > 0
                          ? Math.max(2, (numericValue / axisMax) * 100)
                          : 0;

                      const tooltipIsNearTop = heightPercent >= 70;

                      return (
                        <div
                          key={metric}
                          className="group/bar flex h-full min-w-0 flex-1 items-end justify-center"
                        >
                          <div
                            className="relative flex h-full w-full max-w-[22px] items-end justify-center"
                            aria-label={`${item.label} ${metric}: ${formatNumber(
                              numericValue,
                            )}`}
                          >
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

                            {/* Tooltip */}
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
                                      top: "6px",
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
                                  {formatNumber(numericValue)}
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
                              className={`w-full rounded-t-sm shadow-xs transition-all duration-200 ease-out group-hover/bar:-translate-y-0.5 group-hover/bar:brightness-110 ${className}`}
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

                <div className="mt-2 w-full px-0.5 text-center">
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
  const width = Math.max(340, containerWidth || 400);
  const height = 340;
  const paddingLeft = 36;
  const paddingRight = 50;
  const chartTop = 26;
  const chartBottom = 275;
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

  const activeItem =
    hoveredIndex !== null ? series[hoveredIndex] : series[series.length - 1];

  const activeAnswer = Number(activeItem?.answerRatePct || 0);
  const activeSl = Number(activeItem?.serviceLevelPct || 0);
  const isTargetMet = activeSl >= numericTarget;

  return (
    <div ref={containerRef} className="w-full min-w-0 select-none">
      {/* Legends */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-sibs-tertiary-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-[#0b3b68]">
            <i className="h-2.5 w-2.5 rounded-full bg-[#0b3b68]" />
            Answer: {Number(activeItem?.callsOffered || 0) > 0 ? formatPercent(activeAnswer) : "--"}
          </span>

          <span className="inline-flex items-center gap-1.5 text-[#0284c7]">
            <i className="h-2.5 w-2.5 rounded-full bg-[#0284c7]" />
            SL: {Number(activeItem?.callsOffered || 0) > 0 ? formatPercent(activeSl) : "--"}
          </span>

          <span className="inline-flex items-center gap-1 text-red-500">
            <i className="inline-block h-0.5 w-3.5 bg-red-500" />
            Tgt: {numericTarget}%
          </span>
        </div>

        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-[9.5px] font-bold ${
            Number(activeItem?.callsOffered || 0) === 0
              ? "bg-slate-100 text-slate-600"
              : isTargetMet
              ? "bg-emerald-100 text-emerald-800"
              : "bg-amber-100 text-amber-800"
          }`}
        >
          {isTargetMet ? "✓ Target Met" : "Below Target"}
        </span>
      </div>

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
              <linearGradient
                id="answerRateGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#0b3b68" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#0b3b68" stopOpacity="0.0" />
              </linearGradient>

              <linearGradient id="slGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0284c7" stopOpacity="0.30" />
                <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Gridlines */}
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
                    y={tickY + 4}
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

            {/* Target Line */}
            <g>
              <line
                x1={paddingLeft}
                x2={width - paddingRight + 4}
                y1={targetY}
                y2={targetY}
                stroke="#ef4444"
                strokeWidth="1.5"
                strokeDasharray="5 3"
              />
              <rect
                x={width - paddingRight + 5}
                y={targetY - 9}
                width={44}
                height={18}
                rx={3}
                fill="#fee2e2"
                stroke="#fca5a5"
                strokeWidth="1"
              />
              <text
                x={width - paddingRight + 27}
                y={targetY + 4}
                textAnchor="middle"
                fontSize="9.5"
                fontWeight="800"
                fill="#b91c1c"
              >
                {numericTarget}%
              </text>
            </g>

            {/* Fills */}
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

            {/* Lines */}
            <path
              d={answerCurve}
              fill="none"
              stroke="#0b3b68"
              strokeWidth="2.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={slCurve}
              fill="none"
              stroke="#0284c7"
              strokeWidth="2.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data Points */}
            {series.map((item, index) => {
              const ptAnswer = answerPts[index];
              const ptSl = slPts[index];
              const hasData = Number(item.callsOffered || 0) > 0;
              const isHovered = hoveredIndex === index;

              return (
                <g key={item.key || index}>
                  {isHovered ? (
                    <line
                      x1={ptAnswer.x}
                      x2={ptAnswer.x}
                      y1={chartTop}
                      y2={chartBottom}
                      stroke="#94a3b8"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                  ) : null}

                  {hasData ? (
                    <>
                      <circle
                        cx={ptAnswer.x}
                        cy={ptAnswer.y}
                        r={isHovered ? 5.5 : 4}
                        fill="#0b3b68"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />
                      <circle
                        cx={ptSl.x}
                        cy={ptSl.y}
                        r={isHovered ? 5.5 : 4}
                        fill="#0284c7"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />
                    </>
                  ) : null}

                  <rect
                    x={ptAnswer.x - usableWidth / (series.length * 2)}
                    y={chartTop}
                    width={usableWidth / series.length}
                    height={chartBottom - chartTop + 30}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(index)}
                  />

                  {/* X Axis Label */}
                  <text
                    x={ptAnswer.x}
                    y={chartBottom + 18}
                    textAnchor="middle"
                    fontSize="10.5"
                    fontWeight="700"
                    fill="#1e293b"
                  >
                    {item.label}
                  </text>
                  <text
                    x={ptAnswer.x}
                    y={chartBottom + 32}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="600"
                    fill="#94a3b8"
                  >
                    Period {index + 1}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Hover Tooltip */}
          {hoveredIndex !== null && series[hoveredIndex] && (
            <div
              className="pointer-events-none absolute z-30 min-w-[160px] rounded-xl border border-sibs-tertiary-10/80 bg-white/95 p-2.5 shadow-xl backdrop-blur-md"
              style={{
                left: `${Math.min(
                  Math.max(10, answerPts[hoveredIndex]?.x - 80),
                  width - 175,
                )}px`,
                top: "14px",
              }}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                <span className="text-xs font-black text-sibs-primary-1">
                  {series[hoveredIndex].label}
                </span>
                <span className="text-[10px] font-bold text-sibs-tertiary-5">
                  Period {hoveredIndex + 1}
                </span>
              </div>

              <div className="mt-1.5 space-y-1 text-[11px]">
                <div className="flex items-center justify-between font-bold text-[#0b3b68]">
                  <span>Answer %:</span>
                  <span>{formatPercent(series[hoveredIndex].answerRatePct)}</span>
                </div>
                <div className="flex items-center justify-between font-bold text-[#0284c7]">
                  <span>Service Level:</span>
                  <span>{formatPercent(series[hoveredIndex].serviceLevelPct)}</span>
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
    <div className="w-full min-w-0">
      <div className="mb-3 flex items-center justify-between gap-2 text-xs font-bold text-sibs-tertiary-5">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5">
            <i className="inline-block h-2.5 w-2.5 rounded-full bg-[#0b3b68]" />
            Call AHT
          </span>

          <span className="inline-flex items-center gap-1.5 text-red-500">
            <i className="inline-block h-0.5 w-3.5 bg-red-500" />
            Target: {formatNumber(normalizedTarget)}s
          </span>
        </div>
      </div>

      <div className="relative flex h-[340px] items-end gap-2 border-b border-sibs-tertiary-8 px-2">
        <div
          className="pointer-events-none absolute right-2 left-2 border-t-2 border-dashed border-red-500"
          style={{
            bottom: `calc(34px + ${targetPosition * 2.35}px)`,
          }}
        />

        {series.map((item, itemIndex) => {
          const ahtSec = convertDurationToSeconds(item.ahtSeconds);
          const hasAht = ahtSec > 0;
          const heightPct = Math.max(2, (ahtSec / maxValue) * 100);

          return (
            <div
              key={item.key}
              className="group/aht relative z-10 flex min-w-0 flex-1 flex-col items-center justify-end"
            >
              {hasAht ? (
                <p className="mb-1.5 text-[11px] font-black text-sibs-primary-1">
                  {formatNumber(ahtSec, 0)}s
                </p>
              ) : (
                <span className="mb-1.5 text-[10px] font-semibold text-slate-400">-</span>
              )}

              {/* Tooltip */}
              {hasAht ? (
                <div
                  className={`pointer-events-none absolute z-30 hidden min-w-[160px] rounded-xl border border-sibs-tertiary-10/80 bg-white/95 p-2.5 shadow-xl backdrop-blur-md group-hover/aht:block ${
                    itemIndex >= series.length - 1
                      ? "right-0 translate-x-0"
                      : itemIndex === 0
                      ? "left-0 translate-x-0"
                      : "left-1/2 -translate-x-1/2"
                  }`}
                  style={{
                    bottom: `calc(${heightPct * 2.35}px + 42px)`,
                  }}
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
                      <span className="font-semibold text-slate-500">Target ({formatNumber(normalizedTarget)}s):</span>
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

              <div className="flex h-[270px] w-full items-end justify-center">
                {hasAht ? (
                  <div
                    className="w-full max-w-[42px] rounded-t-sm bg-[#0b3b68] transition-all duration-200 group-hover/aht:brightness-110 group-hover/aht:-translate-y-0.5 shadow-xs"
                    style={{
                      height: `${heightPct}%`,
                    }}
                  />
                ) : (
                  <div className="h-0.5 w-6 rounded bg-slate-200" />
                )}
              </div>

              <div className="mt-2 w-full px-0.5 text-center">
                <p className="m-0 truncate text-[10.5px] font-extrabold text-sibs-primary-1 leading-tight">
                  {item.label}
                </p>
                <p className="m-0 text-[9px] font-semibold uppercase text-sibs-tertiary-5">
                  Period {itemIndex + 1}
                </p>
              </div>
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
    <div className="space-y-3">
      {/* 6 Compact KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5">
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
          )}s • Tgt ${formatNumber(
            targetAhtSeconds,
          )}s`}
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

      {/* 3 Prominent Graphs Side-by-Side on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
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
          subtitle="Call AHT measured in seconds against target"
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
    </div>
  );
}