import { useCallback, useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";

import AdminSidebar from "@/components/layout/AdminSidebar";
import AppHeader from "@/components/layout/AppHeader";
import AppModal from "@/components/ui/app-modal";
import ConfirmationModal from "@/components/ui/confirmation-modal";
import LoadingModal from "@/components/ui/loading-modal";
import { Button } from "@/components/ui/button";
import useDashboardPage from "@/hooks/useDashboardPage";
import {
  removeWfmGraphReportSet,
  readWfmGraphReports,
  WFM_GRAPH_REPORTS_UPDATED_EVENT,
} from "@/lib/wfm-graph-reports";
import { getRawDataTitleFromCardId } from "@/lib/wfm-raw-data-cards";

const gridColor = "#e5e7eb";
const graphWindowSize = 6;
const weeklyNavigationStep = 1;
const chartPalette = [
  "#2563EB",
  "#16A34A",
  "#0891B2",
  "#D97706",
  "#DC2626",
  "#7C3AED",
];

function getRating(value, metric, maxValue) {
  if (value == null) {
    return {
      bg: "#94A3B8",
      label: "No data",
      text: "text-sibs-tertiary-5",
    };
  }

  const numberValue = Number(value);

  if (metric.type === "percentage") {
    if (numberValue >= 90) return { bg: "#16A34A", label: "Excellent", text: "text-green-700" };
    if (numberValue >= 80) return { bg: "#0891B2", label: "Good", text: "text-cyan-700" };
    if (numberValue >= 70) return { bg: "#D97706", label: "Watch", text: "text-amber-700" };
    return { bg: "#DC2626", label: "Critical", text: "text-red-700" };
  }

  if (metric.type === "duration") {
    const ratio = numberValue / Math.max(maxValue, 1);

    if (ratio <= 0.33) return { bg: "#16A34A", label: "Fast", text: "text-green-700" };
    if (ratio <= 0.66) return { bg: "#D97706", label: "Moderate", text: "text-amber-700" };
    return { bg: "#DC2626", label: "High", text: "text-red-700" };
  }

  return {
    bg: metric.color || "#2563EB",
    label: metric.type === "count" ? "Volume" : "Value",
    text: "text-sibs-primary-1",
  };
}

function getChartColor(metric, value, maxValue, index) {
  if (metric.key?.endsWith("Count") || metric.label === "Rows") {
    return chartPalette[index % chartPalette.length];
  }

  return getRating(value, metric, maxValue).bg;
}

function formatDuration(value) {
  const totalSeconds = Math.round(Number(value));

  if (!Number.isFinite(totalSeconds)) return "-";

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.abs(totalSeconds % 60);

  return minutes ? `${minutes}m ${String(seconds).padStart(2, "0")}s` : `${seconds}s`;
}

function formatMetricValue(value, unit, type) {
  if (value == null) return "-";

  if (type === "duration") return formatDuration(value);

  const roundedValue = Number(value).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });

  return unit ? `${roundedValue}${unit === "%" ? "%" : ` ${unit}`}` : roundedValue;
}

function getGraphSetLabel(graphSet) {
  return graphSet?.sourceFile || "Uploaded graph data";
}

function isGroupedReport(report) {
  return Array.isArray(report?.series) && report.series.length > 0;
}

function getGraphDateLabel(graphSet) {
  if (graphSet?.dateRange?.label) return graphSet.dateRange.label;

  const firstTrend = graphSet?.reports?.find((report) => report.series?.weekly?.length);
  const weeklySeries = firstTrend?.series?.weekly || [];

  if (!weeklySeries.length) return "-";

  const firstLabel = weeklySeries[0]?.label;
  const lastLabel = weeklySeries.at(-1)?.label;

  return firstLabel === lastLabel ? firstLabel : `${firstLabel} - ${lastLabel}`;
}

function formatGeneratedAt(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function SummaryCard({ label, value }) {
  return (
    <div className="sibs-card min-w-0 p-3">
      <p className="m-0 text-xs font-bold uppercase text-sibs-tertiary-5">
        {label}
      </p>
      <p className="mt-1 mb-0 break-words text-xs font-bold leading-snug text-sibs-primary-1 sm:text-sm">
        {value || "-"}
      </p>
    </div>
  );
}

function getDisplayRawDataTitle(graphSet) {
  return getRawDataTitleFromCardId(graphSet?.sourceCardId, graphSet?.rawDataTitle);
}

function getSeriesData(metric, period) {
  return metric.series?.[period] || metric.data || [];
}

function getWeeksInYear(year) {
  const date = new Date(Date.UTC(year, 11, 28));
  const dayNumber = date.getUTCDay() || 7;

  date.setUTCDate(date.getUTCDate() + 4 - dayNumber);

  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));

  return Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
}

function parseWeekSortKey(sortKey) {
  const match = String(sortKey || "").match(/^(\d{4})-(\d{2})$/);

  if (!match) return null;

  return {
    week: Number(match[2]),
    year: Number(match[1]),
  };
}

function shiftWeek({ year, week }, offset) {
  let nextYear = year;
  let nextWeek = week + offset;

  while (nextWeek < 1) {
    nextYear -= 1;
    nextWeek += getWeeksInYear(nextYear);
  }

  while (nextWeek > getWeeksInYear(nextYear)) {
    nextWeek -= getWeeksInYear(nextYear);
    nextYear += 1;
  }

  return {
    sortKey: `${nextYear}-${String(nextWeek).padStart(2, "0")}`,
    week: nextWeek,
    year: nextYear,
  };
}

function padWeeklyBuckets(buckets) {
  const weekBuckets = buckets
    .map((bucket) => ({
      ...bucket,
      weekInfo: parseWeekSortKey(bucket.sortKey),
    }))
    .filter((bucket) => bucket.weekInfo);

  if (!weekBuckets.length) {
    return buckets;
  }

  const lastWeek = weekBuckets.at(-1).weekInfo;
  const startWeek = shiftWeek(lastWeek, -5);
  const endWeek = shiftWeek(lastWeek, 0);
  const bucketMap = new Map(buckets.map((bucket) => [bucket.sortKey, bucket]));
  const paddedBuckets = [];
  let cursor = startWeek;

  while (cursor.sortKey <= endWeek.sortKey) {
    paddedBuckets.push(
      bucketMap.get(cursor.sortKey) || {
        dateLabel: "No Data",
        label: `W${String(cursor.week).padStart(2, "0")}`,
        sortKey: cursor.sortKey,
      },
    );
    cursor = shiftWeek(cursor, 1);
  }

  return paddedBuckets;
}

function shiftWeeklyBuckets(buckets, offset) {
  return buckets.map((bucket) => {
    const weekInfo = parseWeekSortKey(bucket.sortKey);

    if (!weekInfo) {
      return bucket;
    }

    const shiftedWeek = shiftWeek(weekInfo, offset);

    return {
      dateLabel: "No Data",
      label: `W${String(shiftedWeek.week).padStart(2, "0")}`,
      sortKey: shiftedWeek.sortKey,
    };
  });
}

function getChartBuckets(series, period) {
  const buckets = getSeriesData(series[0] || {}, period).map((item) => ({
    dateLabel: item.dateLabel,
    label: item.label,
    sortKey: item.sortKey,
  }));

  return period === "weekly" ? padWeeklyBuckets(buckets) : buckets;
}

function getDefaultWindowStart(bucketCount) {
  if (bucketCount <= graphWindowSize) {
    return 0;
  }

  return Math.floor((bucketCount - 1) / graphWindowSize) * graphWindowSize;
}

function getVisibleBuckets(buckets, windowStart) {
  return buckets.slice(windowStart, windowStart + graphWindowSize);
}

function hasWeeklyBucketKeys(buckets) {
  return buckets.some((bucket) => parseWeekSortKey(bucket.sortKey));
}

function getBucketDateLabel(buckets) {
  const validBuckets = buckets.filter(
    (bucket) => bucket.dateLabel && bucket.dateLabel !== "No Data",
  );

  if (!validBuckets.length) return "No Data";

  const firstLabel = validBuckets[0].dateLabel;
  const lastLabel = validBuckets.at(-1).dateLabel;

  return firstLabel === lastLabel ? firstLabel : `${firstLabel} - ${lastLabel}`;
}

function getMetricValue(metric, bucket, period) {
  const metricPoint = getSeriesData(metric, period).find(
    (item) => item.sortKey === bucket.sortKey || item.label === bucket.label,
  );

  return metricPoint?.value ?? null;
}

function getMetricValues(metric, period) {
  return getSeriesData(metric, period)
    .map((item) => item.value)
    .filter((value) => value != null);
}

function getPointY(value, maxValue) {
  if (value == null) return null;

  return 88 - (Number(value) / Math.max(maxValue, 1)) * 74;
}

function getPointX(index, bucketCount) {
  return bucketCount <= 1 ? 50 : 8 + (index / (bucketCount - 1)) * 84;
}

function getTooltip(bucket, series, period) {
  const rows = [
    bucket.label,
    bucket.dateLabel && bucket.dateLabel !== "No Data" ? bucket.dateLabel : "No Data",
    "",
    ...series.map((metric) => {
      const value = getMetricValue(metric, bucket, period);

      return `${metric.label}: ${formatMetricValue(value, metric.unit, metric.type)}`;
    }),
  ];

  return rows.join("\n");
}

function getMetricTooltip(metric, bucket, period) {
  const value = getMetricValue(metric, bucket, period);

  return [
    metric.label,
    bucket.label,
    bucket.dateLabel && bucket.dateLabel !== "No Data" ? bucket.dateLabel : "No Data",
    `Level: ${formatMetricValue(value, metric.unit, metric.type)}`,
  ].join("\n");
}

function ReportChart({ buckets, period, report }) {
  const series = report.series || [];
  const barMetrics = series.filter((metric) => metric.chartType === "bar");
  const lineMetrics = series.filter((metric) => metric.chartType === "line");
  const barValues = barMetrics
    .flatMap((metric) => buckets.map((bucket) => getMetricValue(metric, bucket, period)))
    .filter((value) => value != null);
  const lineValues = lineMetrics
    .flatMap((metric) => buckets.map((bucket) => getMetricValue(metric, bucket, period)))
    .filter((value) => value != null);
  const maxBarValue = Math.max(...barValues, 1);
  const maxLineValue =
    lineMetrics.some((metric) => metric.unit === "%") && Math.max(...lineValues, 0) <= 100
      ? 100
      : Math.max(...lineValues, 1);
  const groupWidth = 84 / Math.max(buckets.length, 1);
  const barWidthPercent = Math.min(2.8, groupWidth / Math.max(barMetrics.length, 1) - 0.9);

  return (
    <div className="grid h-64 grid-rows-[1fr_auto] gap-3">
      <div className="relative min-h-0 overflow-hidden rounded-lg px-3">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {[14, 32.5, 51, 69.5, 88].map((lineY) => (
            <line
              key={lineY}
              stroke={gridColor}
              strokeWidth="0.7"
              x1="4"
              x2="96"
              y1={lineY}
              y2={lineY}
            />
          ))}
          {lineMetrics.map((metric) => {
            const points = buckets
              .map((bucket, index) => {
                const value = getMetricValue(metric, bucket, period);
                const y = getPointY(value, maxLineValue);

                return y == null
                  ? null
                  : {
                      label: bucket.label,
                      value,
                      x: getPointX(index, buckets.length),
                      y,
                    };
              })
              .filter(Boolean);
            const path = points
              .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
              .join(" ");
            const singlePoint = points[0];

            return (
              <g key={metric.key}>
                {points.length > 1 ? (
                  <path
                    d={path}
                    fill="none"
                    stroke={metric.color}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    vectorEffect="non-scaling-stroke"
                  />
                ) : null}
                {points.length === 1 ? (
                  <line
                    stroke={metric.color}
                    strokeLinecap="round"
                    strokeWidth="1.5"
                    vectorEffect="non-scaling-stroke"
                    x1={Math.max(singlePoint.x - 4, 4)}
                    x2={Math.min(singlePoint.x + 4, 96)}
                    y1={singlePoint.y}
                    y2={singlePoint.y}
                  />
                ) : null}
              </g>
            );
          })}
        </svg>
        {buckets.map((bucket, bucketIndex) => {
          const groupX = getPointX(bucketIndex, buckets.length);

          return barMetrics.map((metric, metricIndex) => {
            const value = getMetricValue(metric, bucket, period);
            const height = value == null ? 0 : Math.max((Number(value) / maxBarValue) * 74, 2);
            const color = getChartColor(metric, value, maxBarValue, bucketIndex);
            const left =
              groupX -
              ((barMetrics.length * barWidthPercent + (barMetrics.length - 1) * 0.8) / 2) +
              metricIndex * (barWidthPercent + 0.8);

            return (
              <span
                key={`${bucket.sortKey}-${metric.key}`}
                className="absolute bottom-[12%] rounded-t-sm"
                style={{
                  backgroundColor: value == null ? "transparent" : color,
                  height: `${height}%`,
                  left: `${left}%`,
                  width: `${barWidthPercent}%`,
                }}
                title={getMetricTooltip(metric, bucket, period)}
              />
            );
          });
        })}
        {lineMetrics.flatMap((metric) =>
          buckets.map((bucket, index) => {
            const value = getMetricValue(metric, bucket, period);
            const y = getPointY(value, maxLineValue);

            if (y == null) return null;

            return (
              <span
                key={`${metric.key}-${bucket.sortKey}-hover`}
                className="absolute h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  backgroundColor: "transparent",
                  left: `${getPointX(index, buckets.length)}%`,
                  top: `${y}%`,
                }}
                title={getMetricTooltip(metric, bucket, period)}
              />
            );
          }),
        )}
        {buckets.map((bucket, index) => (
          <span
            key={`${bucket.sortKey}-hotspot`}
            className="absolute top-0 h-full"
            style={{
              left: `${Math.max(0, getPointX(index, buckets.length) - groupWidth / 2)}%`,
              width: `${groupWidth}%`,
            }}
            title={getTooltip(bucket, series, period)}
          />
        ))}
      </div>
      <div
        className="grid gap-2 px-1"
        style={{
          gridTemplateColumns: `repeat(${Math.max(buckets.length, 1)}, minmax(0, 1fr))`,
        }}
      >
        {buckets.map((item) => (
          <div
            key={`${item.sortKey}-label`}
            className="min-w-0 overflow-hidden truncate text-center text-[10px] font-bold leading-4 text-sibs-primary-1"
            title={item.label}
          >
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}

const periodOptions = [
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Quarterly", value: "quarterly" },
  { label: "Annually", value: "annual" },
];

function getPeriodFromGranularity(granularity) {
  const periodMap = {
    ANNUAL: "annual",
    DAILY: "weekly",
    MONTHLY: "monthly",
    QUARTERLY: "quarterly",
    WEEKLY: "weekly",
  };

  return periodMap[granularity] || "weekly";
}

function GraphCard({ period, report, windowStart }) {
  const series = useMemo(() => report.series || [], [report.series]);
  const allBuckets = useMemo(() => getChartBuckets(series, period), [period, series]);
  const [cardWindowOffset, setCardWindowOffset] = useState(windowStart);
  const isWeeklyTimeSeries =
    period === "weekly" && report.type !== "distribution" && hasWeeklyBucketKeys(allBuckets);
  const isPagedCategoryReport = report.type === "distribution" || report.type === "dimensionComparison";
  const activeWindowStart =
    isWeeklyTimeSeries
      ? cardWindowOffset
      : isPagedCategoryReport
        ? cardWindowOffset
        : getDefaultWindowStart(allBuckets.length);
  const visibleBuckets = useMemo(
    () =>
      isWeeklyTimeSeries
        ? shiftWeeklyBuckets(allBuckets, activeWindowStart)
        : getVisibleBuckets(allBuckets, activeWindowStart),
    [activeWindowStart, allBuckets, isWeeklyTimeSeries],
  );
  const visibleDateLabel = getBucketDateLabel(visibleBuckets);
  const canMoveBack = isWeeklyTimeSeries || cardWindowOffset > 0;
  const canMoveNext =
    isWeeklyTimeSeries || cardWindowOffset + graphWindowSize < allBuckets.length;
  const metricRatings = series.map((metric) => {
    const visibleValues = visibleBuckets
      .map((bucket) => getMetricValue(metric, bucket, period))
      .filter((value) => value != null);
    const values = getMetricValues(metric, period);
    const ratingValues = values.length ? values : visibleValues;
    const latestValue = ratingValues.length ? ratingValues.at(-1) : null;
    const maxValue = Math.max(...ratingValues, 1);

    return {
      metric,
      rating: getRating(latestValue, metric, maxValue),
      value: latestValue,
    };
  });

  useEffect(() => {
    setCardWindowOffset(windowStart);
  }, [period, report.id, windowStart]);

  return (
    <section className="sibs-card p-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <h3 className="m-0 truncate text-base font-bold text-sibs-primary-1">
              {report.title}
            </h3>
            <p className="mt-1 mb-0 truncate text-xs font-semibold text-sibs-tertiary-5">
              {report.type === "distribution" ? "Top uploaded values" : `Dates: ${visibleDateLabel}`}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              className="h-8 w-8 rounded-lg border border-sibs-tertiary-9 bg-white text-sm font-bold text-sibs-primary-1 transition hover:bg-[#eef3f7] disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!canMoveBack}
              onClick={() =>
                setCardWindowOffset((offset) =>
                  isWeeklyTimeSeries
                    ? offset - weeklyNavigationStep
                    : Math.max(0, offset - graphWindowSize),
                )
              }
              aria-label={`Previous ${report.title} window`}
            >
              {"<"}
            </button>
            <button
              type="button"
              className="h-8 w-8 rounded-lg border border-sibs-tertiary-9 bg-white text-sm font-bold text-sibs-primary-1 transition hover:bg-[#eef3f7] disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!canMoveNext}
              onClick={() =>
                setCardWindowOffset((offset) =>
                  isWeeklyTimeSeries
                    ? offset + weeklyNavigationStep
                    : Math.min(getDefaultWindowStart(allBuckets.length), offset + graphWindowSize),
                )
              }
              aria-label={`Next ${report.title} window`}
            >
              {">"}
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-sibs-tertiary-5">
          {metricRatings.map(({ metric, rating, value }) => (
            <span key={metric.key} className="inline-flex items-center gap-2">
              <span
                className={metric.chartType === "bar" ? "h-2.5 w-2.5 rounded-sm" : "h-1 w-5 rounded-full"}
                style={{ backgroundColor: rating.bg }}
              />
              <span>{metric.label}</span>
              {report.type !== "distribution" ? (
                <span className={`rounded-full bg-[#eef3f7] px-2 py-0.5 text-[10px] font-bold uppercase ${rating.text}`}>
                  {rating.label}: {formatMetricValue(value, metric.unit, metric.type)}
                </span>
              ) : null}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-sibs-tertiary-10 bg-[#f8fbfd] p-3">
        <ReportChart buckets={visibleBuckets} period={period} report={report} />
      </div>
    </section>
  );
}

function WfmViewGraphsPage() {
  const dashboard = useDashboardPage();
  const userName = dashboard.authUser?.name || dashboard.authUser?.username || "User";
  const [graphSets, setGraphSets] = useState(() => readWfmGraphReports());
  const [selectedGraphSetId, setSelectedGraphSetId] = useState(graphSets[0]?.id || "");
  const [graphSetToRemove, setGraphSetToRemove] = useState(null);
  const [removedGraphSet, setRemovedGraphSet] = useState(null);
  const [reportPeriod, setReportPeriod] = useState("weekly");
  const [weeklyWindowOffset, setWeeklyWindowOffset] = useState(0);
  const refreshGraphSets = useCallback(() => {
    const nextGraphSets = readWfmGraphReports();

    setGraphSets(nextGraphSets);
    setSelectedGraphSetId((currentId) => {
      if (nextGraphSets.some((graphSet) => graphSet.id === currentId)) {
        return currentId;
      }

      return nextGraphSets[0]?.id || "";
    });
  }, []);

  useEffect(() => {
    refreshGraphSets();

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshGraphSets();
      }
    };

    window.addEventListener("focus", refreshGraphSets);
    window.addEventListener("pageshow", refreshGraphSets);
    window.addEventListener("storage", refreshGraphSets);
    window.addEventListener(WFM_GRAPH_REPORTS_UPDATED_EVENT, refreshGraphSets);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", refreshGraphSets);
      window.removeEventListener("pageshow", refreshGraphSets);
      window.removeEventListener("storage", refreshGraphSets);
      window.removeEventListener(WFM_GRAPH_REPORTS_UPDATED_EVENT, refreshGraphSets);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshGraphSets]);

  const selectedGraphSet = useMemo(
    () => graphSets.find((graphSet) => graphSet.id === selectedGraphSetId),
    [graphSets, selectedGraphSetId],
  );
  useEffect(() => {
    if (!selectedGraphSet) {
      return;
    }

    setReportPeriod(getPeriodFromGranularity(selectedGraphSet.datasetProfile?.periodGranularity));
    setWeeklyWindowOffset(0);
  }, [selectedGraphSet]);

  const selectedGraphSetLabel = getGraphSetLabel(selectedGraphSet);
  const selectedDateLabel = getGraphDateLabel(selectedGraphSet);
  const selectedReports = useMemo(
    () =>
      (selectedGraphSet?.reports || []).filter((report) => isGroupedReport(report)),
    [selectedGraphSet],
  );
  const handleRemoveGraphSet = () => {
    if (!graphSetToRemove) {
      return;
    }

    const nextGraphSets = removeWfmGraphReportSet(graphSetToRemove.id);

    setGraphSets(nextGraphSets);
    setSelectedGraphSetId(nextGraphSets[0]?.id || "");
    setRemovedGraphSet(graphSetToRemove);
    setGraphSetToRemove(null);
  };

  return (
    <section className="font-jakarta flex min-h-screen bg-[#eef3f7] text-sibs-primary-1">
      <AdminSidebar
        isMobileOpen={dashboard.isMobileSidebarOpen}
        modules={dashboard.modules}
        onLogoutClick={() => dashboard.setShowLogoutModal(true)}
        onMobileClose={() => dashboard.setIsMobileSidebarOpen(false)}
        userName={userName}
        userRole={dashboard.authUser?.email || dashboard.authUser?.roleLabel || "User"}
      />

      <main className="min-w-0 flex-1">
        <AppHeader
          title={`${dashboard.authUser?.roleLabel || "User"} Dashboard`}
          subtitle="Performance Management System"
          onMenuClick={() => dashboard.setIsMobileSidebarOpen(true)}
          onLogoutClick={() => dashboard.setShowLogoutModal(true)}
        />

        <div className="sibs-scrollbar max-h-[calc(100vh-74px)] overflow-y-auto p-3 sm:p-4 lg:p-5">
          {graphSets.length ? (
            <div className="space-y-4">
              <section className="sibs-card p-4">
                <div className="grid gap-4 xl:grid-cols-[minmax(16rem,1fr)_minmax(0,54rem)] xl:items-end">
                  <div className="min-w-0">
                    <h2 className="m-0 text-lg font-bold text-sibs-primary-1">
                      View Graphs
                    </h2>
                    <p className="mt-1 mb-0 text-sm text-sibs-tertiary-5">
                      Generated from WFM dashboard imported data.
                    </p>
                  </div>
                  <div className="grid min-w-0 gap-3 md:grid-cols-[minmax(24rem,1fr)_minmax(17.5rem,18.5rem)_10rem] md:items-end">
                    <div className="min-w-0">
                      <label className="mb-1 block truncate text-xs font-bold uppercase text-sibs-tertiary-5">
                        Uploaded Graph Data
                      </label>
                      <select
                        value={selectedGraphSetId}
                        onChange={(event) => setSelectedGraphSetId(event.target.value)}
                        className="form-input h-10 w-full rounded-lg py-0 pr-8 text-xs"
                        aria-label="Uploaded graph data"
                        title={selectedGraphSetLabel}
                      >
                        {graphSets.map((graphSet) => (
                          <option key={graphSet.id} value={graphSet.id}>
                            {getGraphSetLabel(graphSet)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid min-w-0 grid-cols-[6.75rem_2.5rem_5rem_2.5rem] gap-2">
                      <select
                        value={reportPeriod}
                        onChange={(event) => {
                          setReportPeriod(event.target.value);
                          setWeeklyWindowOffset(0);
                        }}
                        className="form-input h-10 rounded-lg py-0"
                        aria-label="Reporting period"
                      >
                        {periodOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="h-10 w-10 rounded-lg border border-sibs-tertiary-9 bg-white text-lg font-bold text-sibs-primary-1 transition hover:bg-[#eef3f7] disabled:cursor-not-allowed disabled:opacity-40"
                        disabled={reportPeriod !== "weekly"}
                        onClick={() =>
                          setWeeklyWindowOffset((offset) => offset - weeklyNavigationStep)
                        }
                        aria-label="Previous reporting week"
                      >
                        {"<"}
                      </button>
                      <button
                        type="button"
                        className="h-10 rounded-lg border border-sibs-tertiary-9 bg-white px-2 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#eef3f7] disabled:cursor-not-allowed disabled:opacity-40"
                        disabled={reportPeriod !== "weekly"}
                        onClick={() => setWeeklyWindowOffset(0)}
                      >
                        Latest
                      </button>
                      <button
                        type="button"
                        className="h-10 w-10 rounded-lg border border-sibs-tertiary-9 bg-white text-lg font-bold text-sibs-primary-1 transition hover:bg-[#eef3f7] disabled:cursor-not-allowed disabled:opacity-40"
                        disabled={reportPeriod !== "weekly"}
                        onClick={() =>
                          setWeeklyWindowOffset((offset) => offset + weeklyNavigationStep)
                        }
                        aria-label="Next reporting week"
                      >
                        {">"}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setGraphSetToRemove(selectedGraphSet)}
                      disabled={!selectedGraphSet}
                      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-sibs-danger/30 bg-white px-3 text-sm font-semibold text-sibs-danger transition hover:border-sibs-danger hover:bg-sibs-danger hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      Remove Graph
                    </button>
                  </div>
                </div>
              </section>

              {selectedGraphSet ? (
                <>
                  <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <SummaryCard label="Source File" value={selectedGraphSet.sourceFile} />
                    <SummaryCard label="Raw Data" value={getDisplayRawDataTitle(selectedGraphSet)} />
                    <SummaryCard label="Date Range" value={selectedDateLabel} />
                    <SummaryCard
                      label="Generated"
                      value={formatGeneratedAt(selectedGraphSet.generatedAt)}
                    />
                    <SummaryCard label="Records" value={selectedGraphSet.summary.records} />
                    <SummaryCard label="Columns" value={selectedGraphSet.summary.columns || 0} />
                    <SummaryCard label="Metrics" value={selectedGraphSet.summary.metrics || 0} />
                    <SummaryCard label="Graphs" value={selectedReports.length} />
                  </section>

                  <section className="grid gap-4 xl:grid-cols-2">
                    {selectedReports.map((report) => (
                      <GraphCard
                        key={report.id}
                        period={reportPeriod}
                        report={report}
                        windowStart={weeklyWindowOffset}
                      />
                    ))}
                  </section>
                </>
              ) : null}
            </div>
          ) : (
            <section className="sibs-card p-8 text-center">
              <h2 className="m-0 text-lg font-bold text-sibs-primary-1">
                View Graphs
              </h2>
              <p className="mt-2 mb-0 text-sm text-sibs-tertiary-5">
                No generated graphs yet.
              </p>
            </section>
          )}
        </div>
      </main>

      <ConfirmationModal
        isOpen={dashboard.showLogoutModal}
        title="Confirm logout"
        message="Are you sure you want to logout?"
        cancelText="Cancel"
        confirmText="Logout"
        onCancel={() => dashboard.setShowLogoutModal(false)}
        onConfirm={dashboard.handleLogout}
        tone="neutral"
      />

      <LoadingModal
        isOpen={dashboard.isLoggingOut}
        title="Logging out"
        message="Please wait while we end your session."
      />

      <ConfirmationModal
        isOpen={Boolean(graphSetToRemove)}
        title="Remove graph"
        message={`Remove ${graphSetToRemove?.sourceFile || "this graph"} from View Graphs? This will delete it completely.`}
        cancelText="Cancel"
        confirmText="Remove"
        onCancel={() => setGraphSetToRemove(null)}
        onConfirm={handleRemoveGraphSet}
        tone="neutral"
      />

      <AppModal isOpen={Boolean(removedGraphSet)} className="max-w-sm" textAlign="center">
        <p className="m-0 text-lg font-bold text-sibs-primary-1">
          Graph removed
        </p>
        <p className="mt-2 mb-0 text-sm text-sibs-tertiary-5">
          {removedGraphSet?.sourceFile || "The graph"} was deleted from View Graphs.
        </p>
        <Button
          type="button"
          onClick={() => setRemovedGraphSet(null)}
          className="mt-5 h-10 w-full rounded-lg bg-sibs-primary-1 text-white hover:bg-sibs-tertiary-4"
        >
          Done
        </Button>
      </AppModal>
    </section>
  );
}

export default WfmViewGraphsPage;
