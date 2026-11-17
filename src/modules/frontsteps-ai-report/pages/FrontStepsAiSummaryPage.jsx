import React, { useState } from "react";
import {
  Activity,
  AlertCircle,
  Award,
  Ban,
  Clock,
  FileText,
  Layers,
  ShieldAlert,
} from "lucide-react";
import FrontStepsAiLayout from "../layouts/FrontStepsAiLayout";
import FrontStepsAiPageHeader from "../components/FrontStepsAiPageHeader";
import FrontStepsAiReportCard from "../components/FrontStepsAiReportCard";
import FrontStepsAiEmptyState from "../components/FrontStepsAiEmptyState";
import FrontStepsAiGovernanceBanner, { MetricStatusBadge } from "../components/FrontStepsAiGovernanceBanner";
import FrontStepsAiInsightsPanel from "../components/FrontStepsAiInsightsPanel";
import { useFrontStepsAiInsights, useFrontStepsAiSummary } from "../hooks/useFrontStepsAiData";

const REPORT_TYPE_OPTIONS = [
  { label: "Monthly", value: "monthly" },
  { label: "Annually", value: "annually" },
  { label: "Weekly", value: "weekly" },
  { label: "Bi-Hourly", value: "bi-hourly" },
  { label: "Daily", value: "daily" },
];

function getSmoothSplinePath(points = []) {
  if (!points || points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? i : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return path;
}

function IntervalSplineChart({ rows = [] }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  if (!Array.isArray(rows) || rows.length === 0) return null;

  const width = 760;
  const height = 220;
  const padLeft = 42;
  const padRight = 18;
  const padTop = 18;
  const padBottom = 34;
  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;

  const maxVal = Math.max(
    1,
    ...rows.map((r) => Math.max(Number(r.offeredCalls || 0), Number(r.answeredCalls || 0)))
  );
  const yCeiling = Math.ceil(maxVal * 1.12);
  const count = rows.length;

  const mapPoint = (idx, value) => {
    const x = count === 1 ? padLeft + innerW / 2 : padLeft + (idx / (count - 1)) * innerW;
    const y = padTop + innerH - (Math.max(0, Number(value || 0)) / yCeiling) * innerH;
    return { x, y };
  };

  const offeredPoints = rows.map((r, i) => mapPoint(i, r.offeredCalls));
  const answeredPoints = rows.map((r, i) => mapPoint(i, r.answeredCalls));
  const offeredPath = getSmoothSplinePath(offeredPoints);
  const answeredPath = getSmoothSplinePath(answeredPoints);
  const baselineY = padTop + innerH;
  const offeredArea =
    offeredPoints.length >= 2
      ? `${offeredPath} L ${offeredPoints[offeredPoints.length - 1].x.toFixed(2)} ${baselineY} L ${offeredPoints[0].x.toFixed(2)} ${baselineY} Z`
      : "";

  const labelStep = Math.max(1, Math.ceil(count / 8));
  const yTicks = [0, 0.25, 0.5, 0.75, 1];
  const activeRow = hoveredIdx !== null && rows[hoveredIdx] ? rows[hoveredIdx] : null;

  return (
    <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50/50 p-3 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5 font-bold text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1b6ca8]" />
            Calls Offered
          </span>
          <span className="inline-flex items-center gap-1.5 font-bold text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-[#16a34a]" />
            Calls Answered
          </span>
          <span className="text-slate-400">({rows.length} stored intervals, zero interpolation)</span>
        </div>
        {activeRow ? (
          <div className="text-[11px] font-semibold text-[#042c51] bg-white px-2.5 py-0.5 rounded border border-slate-200">
            {activeRow.timeEst}: Offered <strong>{activeRow.offeredCalls}</strong> • Answered{" "}
            <strong className="text-emerald-700">{activeRow.answeredCalls}</strong> • Abandoned{" "}
            <strong className="text-rose-600">{activeRow.abandonedCalls}</strong> • Closed Cases{" "}
            <strong>{activeRow.closedCases}</strong>
          </div>
        ) : (
          <span className="text-[10.5px] text-slate-400">Hover interval points for exact slice values</span>
        )}
      </div>

      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[460px] h-48 select-none">
          <defs>
            <linearGradient id="fsAiOfferedFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1b6ca8" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#1b6ca8" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {yTicks.map((ratio) => {
            const y = padTop + innerH - ratio * innerH;
            const labelVal = Math.round(ratio * yCeiling);
            return (
              <g key={ratio}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray={ratio === 0 ? undefined : "3 3"}
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 6}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-slate-400 text-[9px] font-semibold"
                >
                  {labelVal}
                </text>
              </g>
            );
          })}

          {offeredArea && <path d={offeredArea} fill="url(#fsAiOfferedFill)" />}
          {count >= 2 && (
            <>
              <path d={offeredPath} fill="none" stroke="#1b6ca8" strokeWidth="2.2" strokeLinecap="round" />
              <path d={answeredPath} fill="none" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" />
            </>
          )}

          {rows.map((row, idx) => {
            const pOff = offeredPoints[idx];
            const pAns = answeredPoints[idx];
            const isHovered = hoveredIdx === idx;
            const showXLabel = idx === 0 || idx === count - 1 || idx % labelStep === 0;
            const shortLabel = String(row.timeEst || "").replace(/\s+(EST|EDT)$/i, "");
            return (
              <g
                key={row.intervalSortKey || idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer"
              >
                {isHovered && (
                  <line
                    x1={pOff.x}
                    y1={padTop}
                    x2={pOff.x}
                    y2={baselineY}
                    stroke="#94a3b8"
                    strokeDasharray="2 2"
                    strokeWidth="1"
                  />
                )}
                <circle
                  cx={pOff.x}
                  cy={pOff.y}
                  r={isHovered || count === 1 ? 4.5 : count <= 24 ? 2.5 : 1.5}
                  fill="#1b6ca8"
                  stroke="#ffffff"
                  strokeWidth="1.2"
                />
                <circle
                  cx={pAns.x}
                  cy={pAns.y}
                  r={isHovered || count === 1 ? 4.5 : count <= 24 ? 2.5 : 1.5}
                  fill="#16a34a"
                  stroke="#ffffff"
                  strokeWidth="1.2"
                />
                {showXLabel && (
                  <text
                    x={pOff.x}
                    y={height - 10}
                    textAnchor="middle"
                    className="fill-slate-500 text-[9px] font-semibold"
                  >
                    {shortLabel.length > 11 ? shortLabel.slice(0, 11) : shortLabel}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export default function FrontStepsAiSummaryPage() {
  const [intervalTab, setIntervalTab] = useState("BI_HOURLY");
  const {
    data,
    loading,
    error,
    filters,
    setFilters,
    reload,
    rebuildReport,
    rebuilding,
    rebuildStatus,
  } = useFrontStepsAiSummary({ period: "monthly" });

  const {
    insightData,
    loading: insightsLoading,
    generating: insightsGenerating,
    jobState: insightJobState,
    error: insightsError,
    generateInsights,
  } = useFrontStepsAiInsights({
    reportType: "SUMMARY",
    filters,
    snapshotId: data.snapshot?.id || null,
    enabled: Boolean(data.hasPublishedSnapshot),
  });

  const activeIntervalRows =
    intervalTab === "30_MIN"
      ? data.intervalPerformance?.series30Min || []
      : intervalTab === "DAILY"
        ? data.intervalPerformance?.seriesDaily || []
        : data.intervalPerformance?.seriesBiHourly || data.intervalPerformance?.data || [];

  const finalScore = data.finalKpiScore;

  return (
    <FrontStepsAiLayout activeRouteId="ai-summary">
      <div className="space-y-4 pb-6">
        <FrontStepsAiPageHeader
          title="FrontSteps AI Summary (SiBS Team)"
          subtitle="Policy-driven deterministic performance telemetry, DST-aware intervals, and scorecard governance for verified SiBS employees"
          onRefresh={reload}
          isLoading={loading}
          extraActions={(
            <div className="flex flex-wrap items-center gap-2">
              {data.snapshot && (
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold bg-white text-slate-700 border-slate-200 shadow-2xs">
                  <span
                    className={`inline-block w-2 h-2 rounded-full shrink-0 ${
                      data.snapshot.status === "PUBLISHED" || data.snapshot.status === "READY"
                        ? "bg-emerald-500 ring-2 ring-emerald-200"
                        : data.snapshot.status === "STALE"
                          ? "bg-amber-500 ring-2 ring-amber-200"
                          : "bg-blue-500 ring-2 ring-blue-200"
                    }`}
                  />
                  <span className="truncate">
                    Snapshot: {data.snapshot.status} (v{data.snapshot.versionNumber})
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 px-2">Period:</span>
                <select
                  value={filters.period || "monthly"}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      period: e.target.value,
                      startDate: null,
                      endDate: null,
                    }))
                  }
                  className="text-xs font-bold text-slate-800 bg-slate-50 px-2 py-1 rounded border-0 outline-none cursor-pointer"
                >
                  {REPORT_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        />

        <FrontStepsAiGovernanceBanner
          data={data}
          rebuilding={rebuilding}
          rebuildStatus={rebuildStatus}
          onRebuild={rebuildReport}
        />

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl border border-red-200 bg-red-50 text-red-800 text-xs font-semibold min-w-0">
            <AlertCircle size={16} className="text-red-600 shrink-0" />
            <span className="truncate">{error}</span>
          </div>
        )}

        <FrontStepsAiInsightsPanel
          reportType="SUMMARY"
          reportLabel={`AI Summary (${filters.period || "monthly"})`}
          insightData={insightData}
          loading={insightsLoading}
          generating={insightsGenerating}
          jobState={insightJobState}
          error={insightsError}
          onGenerate={generateInsights}
        />

        {!loading && !data.hasPublishedSnapshot ? (
          <FrontStepsAiReportCard
            title={data.message || "No Report Available for Selected Filters"}
            subtitle={`Period: ${filters.period || "monthly"}`}
            icon={Layers}
          >
            <FrontStepsAiEmptyState
              title={data.message || "No Report Available for Selected Filters"}
              message={
                data.unavailableDetail ||
                "Dashboard GET routes serve stored snapshots only without running calculations on load. Select a published period (Monthly / Annually) or click 'Rebuild Snapshot' to enqueue a deterministic calculation job."
              }
              notice="Zero Hermes inference or background jobs are triggered when switching filters."
            />
          </FrontStepsAiReportCard>
        ) : (
          <>
            {/* Key Metrics Grid (Calls & Case SLA Telemetry - SiBS Team Only) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-3 min-w-0">
              <div className="fs-ai-metric-box">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block truncate">
                  Calls Offered
                </span>
                <span className="text-xl font-black text-slate-800 mt-1 block truncate">
                  {loading ? "..." : data.callsOffered.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block truncate">
                  SiBS Handled + Abandoned
                </span>
              </div>

              <div className="fs-ai-metric-box">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block truncate">
                  Answer Rate
                </span>
                <span className="text-xl font-black text-emerald-700 mt-1 block truncate">
                  {loading ? "..." : data.answerRate}
                </span>
                <span className="text-[10px] text-emerald-600 mt-0.5 block truncate">
                  {data.callsHandled.toLocaleString()} Answered by SiBS Agents
                </span>
              </div>

              <div className="fs-ai-metric-box">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block truncate">
                  Abandon Rate
                </span>
                <span className="text-xl font-black text-rose-700 mt-1 block truncate">
                  {loading ? "..." : data.abandonRate}
                </span>
                <span className="text-[10px] text-rose-600 mt-0.5 block truncate">
                  {data.callsAbandoned.toLocaleString()} Abandoned
                </span>
              </div>

              <div className="fs-ai-metric-box">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block truncate">
                  Average ASA
                </span>
                <span className="text-xl font-black text-blue-700 mt-1 block truncate">
                  {loading ? "..." : data.averageSpeedOfAnswer}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block truncate">
                  SiBS Speed of Answer
                </span>
              </div>

              <div className="fs-ai-metric-box">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block truncate">
                  Average AHT
                </span>
                <span className="text-xl font-black text-purple-700 mt-1 block truncate">
                  {loading ? "..." : data.averageHandleTime}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5 block truncate">
                  SLA Compliance: {data.ahtCompliancePercent}
                </span>
              </div>

              <div className="fs-ai-metric-box">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block truncate">
                  Cases Closed
                </span>
                <span className="text-xl font-black text-slate-800 mt-1 block truncate">
                  {loading ? "..." : data.closedCases.toLocaleString()}
                </span>
                <span className="text-[10px] text-emerald-600 mt-0.5 block truncate">
                  SLA (&le;48h): {data.closedSlaRate} • SiBS Closed: {data.closedCases.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Case Volume, Backlog & CRM Documentation Completion - SiBS Team Only */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 min-w-0">
              <div className="fs-ai-metric-box">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block truncate">
                  SiBS Closed Cases
                </span>
                <span className="text-lg font-black text-[#042c51] mt-1 block truncate">
                  {loading ? "..." : data.closedCases.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5 block truncate">
                  Closed &le;2 Days: {data.agingBands.closedWithin2Days.toLocaleString()}
                </span>
              </div>

              <div className="fs-ai-metric-box">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block truncate">
                  SiBS Backlog Rate
                </span>
                <span className="text-lg font-black text-emerald-700 mt-1 block truncate">
                  {loading ? "..." : "0.00%"}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5 block truncate">
                  0 Open of {data.closedCases.toLocaleString()} SiBS Cases
                </span>
              </div>

              <div className="fs-ai-metric-box">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate">
                    CRM Resolution (SiBS)
                  </span>
                  <MetricStatusBadge status={data.crmDocumentation?.resolutionMetric?.metricStatus || data.crmDocumentation?.resolutionMetric?.status || "CALCULATED"} />
                </div>
                <span className="text-lg font-black text-emerald-700 mt-1 block truncate">
                  {loading ? "..." : data.crmDocumentation?.resolutionRate || "N/A"}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5 block truncate">
                  {(data.crmDocumentation?.resolutionPopulated || 0).toLocaleString()} / {data.closedCases.toLocaleString()} Closed
                </span>
              </div>

              <div className="fs-ai-metric-box">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate">
                    CRM Sub Code (SiBS)
                  </span>
                  <MetricStatusBadge status={data.crmDocumentation?.subCodeMetric?.metricStatus || data.crmDocumentation?.subCodeMetric?.status || "CALCULATED"} />
                </div>
                <span className="text-lg font-black text-[#1b6ca8] mt-1 block truncate">
                  {loading ? "..." : data.crmDocumentation?.subCodeRate || "N/A"}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5 block truncate">
                  {(data.crmDocumentation?.subCodesPopulated || 0).toLocaleString()} / {data.closedCases.toLocaleString()} Closed
                </span>
              </div>

              <div className="fs-ai-metric-box">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate">
                    CRM Case Summary (SiBS)
                  </span>
                  <MetricStatusBadge status={data.crmDocumentation?.summaryMetric?.metricStatus || data.crmDocumentation?.summaryMetric?.status || "CALCULATED"} />
                </div>
                <span className="text-lg font-black text-[#ff5c28] mt-1 block truncate">
                  {loading ? "..." : data.crmDocumentation?.summaryRate || "N/A"}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5 block truncate">
                  {(data.crmDocumentation?.summaryPopulated || 0).toLocaleString()} / {data.closedCases.toLocaleString()} Closed
                </span>
              </div>
            </div>

            {/* Policy-Driven Scorecard Components + Gated Final Score */}
            <FrontStepsAiReportCard
              title="Policy-Driven Scorecard Breakdown"
              subtitle={`Weights and targets loaded dynamically from ${data.policyContext?.snapshotCode || "active policy snapshot"} (QA excluded until approved)`}
              icon={Award}
            >
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-stretch">
                <div className="lg:col-span-3 overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10.5px] font-black uppercase text-slate-500">
                        <th className="py-2 px-2.5">Metric Component</th>
                        <th className="py-2 px-2.5">Rule Code</th>
                        <th className="py-2 px-2.5">Weight</th>
                        <th className="py-2 px-2.5">Actual Raw</th>
                        <th className="py-2 px-2.5">Policy Target</th>
                        <th className="py-2 px-2.5">Weighted Score</th>
                        <th className="py-2 px-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.scorecardMetrics.map((m) => {
                        const status = m.metricStatus || m.status || "NO_DATA";
                        const rawVal = m.rawValue !== undefined ? m.rawValue : m.actualValue;
                        const weightVal = m.weightPercent !== undefined ? m.weightPercent : m.weight;
                        const weightedVal =
                          m.weightedScore !== undefined ? m.weightedScore : m.earnedScore;
                        const ruleCode = m.sourceRuleCode || m.ruleCode || "-";
                        return (
                          <tr key={m.metricCode} className="hover:bg-slate-50/70">
                            <td className="py-2 px-2.5 font-bold text-slate-800">{m.metricLabel || m.metricCode}</td>
                            <td className="py-2 px-2.5 font-mono text-[11px] text-slate-500">
                              {ruleCode}
                            </td>
                            <td className="py-2 px-2.5 font-semibold text-slate-700">
                              {weightVal ?? 0}%
                            </td>
                            <td className="py-2 px-2.5 font-bold text-slate-800">
                              {rawVal !== null && rawVal !== undefined
                                ? `${rawVal} ${m.unit === "PERCENT" ? "%" : m.unit === "SECONDS" ? "s" : ""}`
                                : status === "NO_DATA"
                                  ? "No Data Available"
                                  : "BLOCKED / N/A"}
                            </td>
                            <td className="py-2 px-2.5 text-slate-600">
                              {m.targetValue !== null && m.targetValue !== undefined
                                ? `${m.targetValue} ${m.unit === "PERCENT" ? "%" : m.unit === "SECONDS" ? "s" : ""}`
                                : "N/A"}
                            </td>
                            <td className="py-2 px-2.5 font-black text-[#042c51]">
                              {weightedVal !== null && weightedVal !== undefined
                                ? `${Number(weightedVal).toFixed(2)} pts`
                                : status === "NO_DATA"
                                  ? "No Data Available"
                                  : "N/A"}
                            </td>
                            <td className="py-2 px-2.5" title={m.blockingReason || ""}>
                              <MetricStatusBadge status={status} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Final KPI Score Card */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-500">
                        Final KPI Score
                      </span>
                      <MetricStatusBadge status={finalScore?.metricStatus || finalScore?.status || "BLOCKED"} />
                    </div>
                    {(finalScore?.metricStatus || finalScore?.status) === "CALCULATED" ? (
                      <div className="mt-2">
                        <span className="text-3xl font-black text-[#042c51]">
                          {Number(finalScore.weightedScore ?? finalScore.earnedScore ?? 0).toFixed(2)}
                        </span>
                        <span className="text-xs font-bold text-slate-500 ml-1">/ 100 pts</span>
                      </div>
                    ) : (
                      <div className="mt-2 flex items-center gap-2 text-rose-700">
                        <ShieldAlert size={20} className="shrink-0" />
                        <span className="text-lg font-black">BLOCKED</span>
                      </div>
                    )}
                    <p className="mt-2 text-[11px] text-slate-600 leading-relaxed">
                      {finalScore?.blockingReason ||
                        "Strict gating passed across all 6 scorecard components."}
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200 text-[10.5px] text-slate-500 space-y-1">
                    <div>
                      Aging (&lt;24h / 1-2d / &gt;2d):{" "}
                      <strong>
                        {data.agingBands.lt1Day.toLocaleString()} /{" "}
                        {data.agingBands.oneToTwoDays.toLocaleString()} /{" "}
                        {data.agingBands.gt2Days.toLocaleString()}
                      </strong>
                    </div>
                    <div>
                      Repeat Open Cases: <strong>{data.repeatOpenStatus}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </FrontStepsAiReportCard>

            {/* Detailed Sections: Interval Breakdown & Top Case Drivers */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 min-w-0">
              <div className="xl:col-span-2 min-w-0">
                <FrontStepsAiReportCard
                  title="DST-Aware Interval Performance"
                  subtitle={`Intervals evaluated via America/Denver (MT) (${data.intervalPerformance?.timezoneConfidence || "UNCONFIRMED"} source tz)`}
                  icon={Activity}
                  extra={(
                    <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
                      {[
                        { id: "BI_HOURLY", label: "Bi-Hourly" },
                        { id: "30_MIN", label: "30-Min" },
                        { id: "DAILY", label: "Daily" },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setIntervalTab(tab.id)}
                          className={`px-2 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                            intervalTab === tab.id
                              ? "bg-white text-[#042c51] shadow-2xs"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  )}
                >
                  {activeIntervalRows.length > 0 ? (
                    <>
                      <IntervalSplineChart rows={activeIntervalRows} />
                      <div className="overflow-x-auto max-h-80 overflow-y-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="sticky top-0 bg-slate-50 z-10">
                            <tr className="border-b border-slate-200 text-[10.5px] font-black uppercase text-slate-500">
                              <th className="py-2 px-2.5">EST/EDT Interval</th>
                              <th className="py-2 px-2.5">MT/MDT Interval</th>
                              <th className="py-2 px-2.5">Offered</th>
                              <th className="py-2 px-2.5">Answered</th>
                              <th className="py-2 px-2.5">Abandoned</th>
                              <th className="py-2 px-2.5">Closed Cases</th>
                              <th className="py-2 px-2.5">Answer %</th>
                              <th className="py-2 px-2.5">ASA</th>
                              <th className="py-2 px-2.5">AHT</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {activeIntervalRows.map((row, idx) => (
                              <tr key={row.intervalSortKey || idx} className="hover:bg-slate-50/60">
                                <td className="py-2 px-2.5 font-bold text-slate-800 whitespace-nowrap">
                                  {row.timeEst}
                                </td>
                                <td className="py-2 px-2.5 text-slate-500 whitespace-nowrap">
                                  {row.timeMt}
                                </td>
                                <td className="py-2 px-2.5 font-semibold text-slate-700">
                                  {row.offeredCalls}
                                </td>
                                <td className="py-2 px-2.5 font-semibold text-emerald-700">
                                  {row.answeredCalls}
                                </td>
                                <td className="py-2 px-2.5 font-semibold text-rose-600">
                                  {row.abandonedCalls}
                                </td>
                                <td className="py-2 px-2.5 font-semibold text-[#042c51]">
                                  {row.closedCases}
                                </td>
                                <td className="py-2 px-2.5 font-bold text-slate-800">
                                  {row.answerRate}
                                </td>
                                <td className="py-2 px-2.5 text-slate-600">{row.asa}</td>
                                <td className="py-2 px-2.5 text-slate-600">{row.aht}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                    <FrontStepsAiEmptyState
                      title="No Interval Records in Scope"
                      message="No call or case interval records fell within this period window."
                      notice="Interval rows are computed only from verified database timestamps."
                    />
                  )}
                </FrontStepsAiReportCard>
              </div>

              <div className="xl:col-span-1 min-w-0">
                <FrontStepsAiReportCard
                  title="Top Case Drivers"
                  subtitle="Categorized volume distribution across Cases"
                  icon={FileText}
                >
                  {data.topCaseDrivers.length > 0 ? (
                    <div className="space-y-2.5 max-h-[30rem] overflow-y-auto pr-1">
                      {data.topCaseDrivers.map((driver, idx) => {
                        const pctNum = parseFloat(String(driver.percentage || "0").replace("%", "")) || 0;
                        return (
                          <div
                            key={idx}
                            className="text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-slate-800 truncate">{driver.label}</span>
                              <span className="font-extrabold text-[#042c51] text-xs shrink-0">
                                {driver.percentage}
                              </span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-[#1b6ca8]"
                                style={{ width: `${Math.min(100, Math.max(0, pctNum))}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-[10.5px] text-slate-500">
                              <span>{driver.count.toLocaleString()} Total</span>
                              <span>
                                {driver.closedCount.toLocaleString()} Closed •{" "}
                                {driver.openCount.toLocaleString()} Open
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <FrontStepsAiEmptyState
                      title="No Case Categories Found"
                      message="Case driver metrics aggregate directly from imported FrontSteps case records."
                      notice="No fabricated case types displayed."
                    />
                  )}
                </FrontStepsAiReportCard>
              </div>
            </div>
          </>
        )}
      </div>
    </FrontStepsAiLayout>
  );
}
