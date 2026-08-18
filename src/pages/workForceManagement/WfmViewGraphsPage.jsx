// WFM page for viewing generated graph cards and report windows.
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, BarChart3, Database, RefreshCw, Table2 } from "lucide-react";

import AdminSidebar from "@/components/layout/AdminSidebar";
import AppHeader from "@/components/layout/AppHeader";
import ConfirmationModal from "@/components/ui/confirmation-modal";
import LoadingModal from "@/components/ui/loading-modal";
import useDashboardPage from "@/hooks/useDashboardPage";
import {
  generateWfmGraphReports,
} from "@/lib/wfm-graph-reports";
import {
  getWfmImportedFileReport,
  getWfmImportedFiles,
} from "@/lib/axios/wfm-imported-files";

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

function ReportStatus({ icon: Icon, title, message }) {
  return (
    <section className="sibs-card p-8 text-center">
      <Icon className="mx-auto h-8 w-8 text-sibs-tertiary-5" aria-hidden="true" />
      <h2 className="mt-3 mb-0 text-lg font-bold text-sibs-primary-1">
        {title}
      </h2>
      <p className="mt-2 mb-0 text-sm text-sibs-tertiary-5">
        {message}
      </p>
    </section>
  );
}

function FieldSummaryPanel({ fields }) {
  const visibleFields = (fields || []).filter((field) => field.visualizable).slice(0, 10);

  if (!visibleFields.length) return null;

  return (
    <section className="sibs-card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-sibs-tertiary-10 px-4 py-3">
        <Table2 className="h-4 w-4 text-sibs-primary-1" aria-hidden="true" />
        <h3 className="m-0 text-sm font-bold text-sibs-primary-1">
          Data Fields Used
        </h3>
      </div>
      <div className="sibs-scrollbar overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left text-xs">
          <thead className="bg-white text-sibs-tertiary-6">
            <tr>
              <th className="px-4 py-3 font-bold uppercase">Field</th>
              <th className="px-4 py-3 font-bold uppercase">Role</th>
              <th className="px-4 py-3 font-bold uppercase">Filled</th>
              <th className="px-4 py-3 font-bold uppercase">Unique</th>
              <th className="px-4 py-3 font-bold uppercase">Sample</th>
            </tr>
          </thead>
          <tbody>
            {visibleFields.map((field) => (
              <tr key={field.column} className="border-t border-sibs-tertiary-10">
                <td className="px-4 py-3 font-bold text-sibs-primary-1">{field.label}</td>
                <td className="px-4 py-3 text-sibs-tertiary-5">{field.role}</td>
                <td className="px-4 py-3 text-sibs-tertiary-5">
                  {Number(field.filled || 0).toLocaleString()} / {Number(field.total || 0).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sibs-tertiary-5">
                  {Number(field.unique || 0).toLocaleString()}
                </td>
                <td className="max-w-[24rem] truncate px-4 py-3 text-sibs-tertiary-5">
                  {(field.sampleValues || []).join(", ") || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RawDataPreview({ columns, rows }) {
  const visibleColumns = (columns || []).slice(0, 8);
  const visibleRows = (rows || []).slice(0, 12);

  if (!visibleColumns.length || !visibleRows.length) return null;

  return (
    <section className="sibs-card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-sibs-tertiary-10 px-4 py-3">
        <Database className="h-4 w-4 text-sibs-primary-1" aria-hidden="true" />
        <h3 className="m-0 text-sm font-bold text-sibs-primary-1">
          Raw Data Preview
        </h3>
      </div>
      <div className="sibs-scrollbar overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-left text-xs">
          <thead className="bg-white text-sibs-tertiary-6">
            <tr>
              {visibleColumns.map((column) => (
                <th key={column} className="whitespace-nowrap px-4 py-3 font-bold uppercase">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-t border-sibs-tertiary-10">
                {visibleColumns.map((column) => (
                  <td key={column} className="max-w-[18rem] truncate px-4 py-3 text-sibs-tertiary-5">
                    {row?.[column] ?? "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function WfmViewGraphsPage() {
  const dashboard = useDashboardPage();
  const userName = dashboard.authUser?.name || dashboard.authUser?.username || "User";
  const [importedFiles, setImportedFiles] = useState([]);
  const [selectedImportId, setSelectedImportId] = useState("");
  const [reportData, setReportData] = useState(null);
  const [selectedGraphSet, setSelectedGraphSet] = useState(null);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [reportError, setReportError] = useState("");
  const [reportPeriod, setReportPeriod] = useState("weekly");
  const [weeklyWindowOffset, setWeeklyWindowOffset] = useState(0);
  const refreshImportedFiles = useCallback(async () => {
    setIsLoadingFiles(true);
    setReportError("");

    try {
      const response = await getWfmImportedFiles({ graphReady: true });
      const nextFiles = Array.isArray(response?.data) ? response.data : [];

      setImportedFiles(nextFiles);
      setSelectedImportId((currentId) => {
        if (nextFiles.some((file) => file.uploadId === currentId)) {
          return currentId;
        }

        return nextFiles[0]?.uploadId || "";
      });
    } catch (error) {
      setReportError(
        error?.response?.data?.message || "Unable to load imported WFM files.",
      );
    } finally {
      setIsLoadingFiles(false);
    }
  }, []);

  useEffect(() => {
    refreshImportedFiles();
  }, [refreshImportedFiles]);

  useEffect(() => {
    if (!selectedImportId) {
      setReportData(null);
      setSelectedGraphSet(null);
      return;
    }

    let isActive = true;

    async function loadReport() {
      setIsLoadingReport(true);
      setReportError("");
      setReportData(null);
      setSelectedGraphSet(null);

      try {
        const response = await getWfmImportedFileReport(selectedImportId);
        const importedReport = response?.data;
        const graphSet = generateWfmGraphReports({
          columns: importedReport?.columns || [],
          rows: importedReport?.rows || [],
          sourceFile: importedReport?.displayName || importedReport?.fileTitle,
          sourceUploadId: importedReport?.uploadId,
          sourceCardId: importedReport?.cardId,
          sourceUploadedAtMs: importedReport?.uploadedAtMs,
          rawDataTitle: importedReport?.taskOrder,
        });

        if (!isActive) return;

        if (!graphSet) {
          setReportError("No graphable fields were found in this imported file.");
          setReportData(importedReport);
          return;
        }

        setReportData(importedReport);
        setSelectedGraphSet(graphSet);
        setReportPeriod(getPeriodFromGranularity(graphSet.datasetProfile?.periodGranularity));
        setWeeklyWindowOffset(0);
      } catch (error) {
        if (!isActive) return;

        setReportError(
          error?.response?.data?.message || "Unable to build graphs from this imported file.",
        );
      } finally {
        if (isActive) {
          setIsLoadingReport(false);
        }
      }
    }

    loadReport();

    return () => {
      isActive = false;
    };
  }, [selectedImportId]);

  const selectedImport = useMemo(
    () => importedFiles.find((file) => file.uploadId === selectedImportId),
    [importedFiles, selectedImportId],
  );
  const selectedGraphSetLabel = selectedGraphSet?.sourceFile || selectedImport?.displayName || "-";
  const selectedDateLabel = getGraphDateLabel(selectedGraphSet);
  const selectedReports = useMemo(
    () =>
      (selectedGraphSet?.reports || []).filter((report) => isGroupedReport(report)),
    [selectedGraphSet],
  );
  const isBusy = isLoadingFiles || isLoadingReport;

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
          <div className="space-y-4">
            <section className="sibs-card p-4">
              <div className="grid gap-4 xl:grid-cols-[minmax(16rem,1fr)_minmax(0,52rem)] xl:items-end">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-sibs-primary-1" aria-hidden="true" />
                    <h2 className="m-0 text-lg font-bold text-sibs-primary-1">
                      View Graphs
                    </h2>
                  </div>
                  <p className="mt-1 mb-0 text-sm text-sibs-tertiary-5">
                    Reports generated from imported raw data in PMS database.
                  </p>
                </div>
                <div className="grid min-w-0 gap-3 md:grid-cols-[minmax(22rem,1fr)_minmax(17.5rem,18.5rem)_2.5rem] md:items-end">
                  <div className="min-w-0">
                    <label className="mb-1 block truncate text-xs font-bold uppercase text-sibs-tertiary-5">
                      Imported Raw Data
                    </label>
                    <select
                      value={selectedImportId}
                      onChange={(event) => setSelectedImportId(event.target.value)}
                      className="form-input h-10 w-full rounded-lg py-0 pr-8 text-xs"
                      disabled={isBusy || !importedFiles.length}
                      aria-label="Imported raw data"
                      title={selectedGraphSetLabel}
                    >
                      {importedFiles.map((file) => (
                        <option key={file.uploadId} value={file.uploadId}>
                          {file.displayName || file.fileTitle}
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
                      disabled={!selectedGraphSet}
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
                      disabled={reportPeriod !== "weekly" || !selectedGraphSet}
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
                      disabled={reportPeriod !== "weekly" || !selectedGraphSet}
                      onClick={() => setWeeklyWindowOffset(0)}
                    >
                      Latest
                    </button>
                    <button
                      type="button"
                      className="h-10 w-10 rounded-lg border border-sibs-tertiary-9 bg-white text-lg font-bold text-sibs-primary-1 transition hover:bg-[#eef3f7] disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={reportPeriod !== "weekly" || !selectedGraphSet}
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
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-sibs-tertiary-9 bg-white text-sibs-primary-1 transition hover:bg-[#eef3f7] disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={isBusy}
                    onClick={refreshImportedFiles}
                    aria-label="Refresh imported files"
                    title="Refresh imported files"
                  >
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </section>

            {isBusy ? (
              <ReportStatus
                icon={Database}
                title="Loading reports"
                message="Reading imported rows from PMS database."
              />
            ) : reportError ? (
              <ReportStatus
                icon={AlertCircle}
                title="Report unavailable"
                message={reportError}
              />
            ) : !importedFiles.length ? (
              <ReportStatus
                icon={Database}
                title="No graph reports yet"
                message="Import uploaded data in the WFM dashboard, then click Make graph."
              />
            ) : selectedGraphSet ? (
              <>
                <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <SummaryCard label="Source File" value={selectedGraphSet.sourceFile} />
                  <SummaryCard label="Account" value={reportData?.account} />
                  <SummaryCard label="Task Order" value={reportData?.taskOrder} />
                  <SummaryCard label="Date Range" value={selectedDateLabel} />
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

                <FieldSummaryPanel fields={selectedGraphSet.fieldSummaries} />
                <RawDataPreview columns={reportData?.columns} rows={reportData?.rows} />
              </>
            ) : null}
          </div>
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
    </section>
  );
}


export default WfmViewGraphsPage;

