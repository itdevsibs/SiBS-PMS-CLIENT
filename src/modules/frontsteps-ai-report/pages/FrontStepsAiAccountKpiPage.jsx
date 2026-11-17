import React from "react";
import { AlertCircle, Award, FolderKanban, Layers, PhoneCall, ShieldAlert, Target } from "lucide-react";
import FrontStepsAiLayout from "../layouts/FrontStepsAiLayout";
import FrontStepsAiPageHeader from "../components/FrontStepsAiPageHeader";
import FrontStepsAiReportCard from "../components/FrontStepsAiReportCard";
import FrontStepsAiEmptyState from "../components/FrontStepsAiEmptyState";
import FrontStepsAiGovernanceBanner, { MetricStatusBadge } from "../components/FrontStepsAiGovernanceBanner";
import FrontStepsAiInsightsPanel from "../components/FrontStepsAiInsightsPanel";
import { useFrontStepsAiAccountKpi, useFrontStepsAiInsights } from "../hooks/useFrontStepsAiData";

const PERIOD_OPTIONS = [
  { label: "Monthly", value: "monthly" },
  { label: "Annually", value: "annually" },
  { label: "Weekly", value: "weekly" },
  { label: "Daily", value: "daily" },
];

export default function FrontStepsAiAccountKpiPage() {
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
  } = useFrontStepsAiAccountKpi({
    period: "monthly",
    account: "all",
    caseQueue: "all",
    caseOrigin: "all",
  });

  const {
    insightData,
    loading: insightsLoading,
    generating: insightsGenerating,
    jobState: insightJobState,
    error: insightsError,
    generateInsights,
  } = useFrontStepsAiInsights({
    reportType: "ACCOUNT_KPI",
    filters,
    snapshotId: data.snapshot?.id || null,
    enabled: Boolean(data.hasPublishedSnapshot),
  });

  const callQueueOptions = data.availableFilters?.callQueues || [];
  const caseQueueOptions = data.availableFilters?.caseQueues || [];
  const caseOriginOptions = data.availableFilters?.caseOrigins || [];
  const scopedFilterLabels = [
    filters.account && filters.account !== "all" ? `Call Queue: ${filters.account}` : null,
    filters.caseQueue && filters.caseQueue !== "all" ? `Case Queue: ${filters.caseQueue}` : null,
    filters.caseOrigin && filters.caseOrigin !== "all" ? `Origin: ${filters.caseOrigin}` : null,
  ].filter(Boolean);
  const hasScopedFilter = scopedFilterLabels.length > 0;

  const callSum = data.callSummary || {};
  const caseSum = data.caseSummary || {};
  const finalScore = data.finalKpiScore;

  return (
    <FrontStepsAiLayout activeRouteId="ai-account-kpi">
      <div className="space-y-4 pb-6">
        <FrontStepsAiPageHeader
          title="Account-based KPI (SiBS Employee Queues)"
          subtitle="Voice call queues and Salesforce case channels handled by verified SiBS employees evaluated against active policy SLA thresholds"
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
                    }))
                  }
                  className="text-xs font-bold text-slate-800 bg-slate-50 px-2 py-1 rounded border-0 outline-none cursor-pointer"
                >
                  {PERIOD_OPTIONS.map((opt) => (
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
          reportType="ACCOUNT_KPI"
          reportLabel={`Account KPI (${filters.period || "monthly"}${
            scopedFilterLabels.length > 0
              ? ` — ${scopedFilterLabels.join(", ")}`
              : " — All Call Queues & Case Channels"
          })`}
          insightData={insightData}
          loading={insightsLoading}
          generating={insightsGenerating}
          jobState={insightJobState}
          error={insightsError}
          onGenerate={generateInsights}
          disabledReason={
            !loading && !data.hasPublishedSnapshot
              ? data.unavailableDetail ||
                data.message ||
                "No verified Account KPI snapshot exists for this filter selection."
              : null
          }
        />

        {/* Scope Filters Bar (Call Queue / Case Queue / Case Origin) */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500">Call Queue:</span>
            <select
              aria-label="Call Queue"
              value={filters.account || "all"}
              onChange={(e) => setFilters((prev) => ({ ...prev, account: e.target.value }))}
              className="text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg outline-none cursor-pointer max-w-[230px]"
            >
              <option value="all">All Call Queues ({callQueueOptions.length})</option>
              {callQueueOptions.map((qName) => (
                <option key={qName} value={qName}>
                  {qName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500">Case Queue:</span>
            <select
              aria-label="Case Queue"
              value={filters.caseQueue || "all"}
              onChange={(e) => setFilters((prev) => ({ ...prev, caseQueue: e.target.value }))}
              className="text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg outline-none cursor-pointer"
            >
              <option value="all">All Case Queues ({caseQueueOptions.length})</option>
              {caseQueueOptions.map((tier) => (
                <option key={tier} value={tier}>
                  {tier}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500">Case Origin:</span>
            <select
              aria-label="Case Origin"
              value={filters.caseOrigin || "all"}
              onChange={(e) => setFilters((prev) => ({ ...prev, caseOrigin: e.target.value }))}
              className="text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg outline-none cursor-pointer max-w-[220px]"
            >
              <option value="all">All Case Origins ({caseOriginOptions.length})</option>
              {caseOriginOptions.map((origin) => (
                <option key={origin} value={origin}>
                  {origin}
                </option>
              ))}
            </select>
          </div>

          {hasScopedFilter && (
            <button
              type="button"
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  account: "all",
                  caseQueue: "all",
                  caseOrigin: "all",
                }))
              }
              className="ml-auto text-xs font-bold text-[#042c51] hover:underline cursor-pointer px-2 py-1"
            >
              Reset Scopes
            </button>
          )}
        </div>

        {!loading && !data.hasPublishedSnapshot ? (
          <FrontStepsAiReportCard
            title={data.message || "No Report Available for Selected Filters"}
            subtitle={`Scope: ${filters.period || "monthly"}`}
            icon={Layers}
          >
            <FrontStepsAiEmptyState
              title={data.message || "No Report Available for Selected Filters"}
              message={
                data.unavailableDetail ||
                "No matching Call Queue or Case Channel rows exist in this stored snapshot for the selected scope filters. Clear a filter or select Monthly / Annually."
              }
              notice="Zero Hermes inference or background rebuilds are triggered on filter changes."
            />
          </FrontStepsAiReportCard>
        ) : (
          <>
            {/* Separated Operational Telemetry vs Policy-Scored KPIs */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 min-w-0">
              <FrontStepsAiReportCard
                title="SiBS Operational Telemetry (Volume-Weighted Scope Totals)"
                subtitle={
                  data.isCallScopeFiltered || data.isCaseScopeFiltered
                    ? "Computed dynamically from matched queue/channel denominators without averaging percentages"
                    : "SiBS employee-handled call queues and Salesforce case channel telemetry from stored snapshot"
                }
                icon={Target}
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <div className="fs-ai-metric-box">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">
                      Calls Offered
                    </span>
                    <span className="text-lg font-black text-slate-800 block mt-0.5">
                      {loading ? "..." : Number(callSum.offered || 0).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-emerald-700 block">
                      {Number(callSum.answered || 0).toLocaleString()} Answered ({callSum.answerRate || "N/A"})
                    </span>
                  </div>
                  <div className="fs-ai-metric-box">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">
                      Calls Abandoned
                    </span>
                    <span className="text-lg font-black text-rose-700 block mt-0.5">
                      {loading ? "..." : Number(callSum.abandoned || 0).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Abandon Rate: {callSum.abandonRate || "N/A"}
                    </span>
                  </div>
                  <div className="fs-ai-metric-box">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">
                      Weighted ASA
                    </span>
                    <span className="text-lg font-black text-blue-700 block mt-0.5">
                      {loading ? "..." : callSum.asaFormatted || "N/A"}
                    </span>
                    <span className="text-[10px] text-slate-400 block">Operational Speed of Answer</span>
                  </div>
                  <div className="fs-ai-metric-box">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">
                      Total / Open Cases
                    </span>
                    <span className="text-lg font-black text-[#042c51] block mt-0.5">
                      {loading
                        ? "..."
                        : `${Number(caseSum.totalCases || 0).toLocaleString()} / ${Number(caseSum.openCases || 0).toLocaleString()}`}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Closed: {Number(caseSum.closedCases || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="fs-ai-metric-box">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">
                      Backlog Rate
                    </span>
                    <span className="text-lg font-black text-amber-700 block mt-0.5">
                      {loading ? "..." : caseSum.backlogRate || "N/A"}
                    </span>
                    <span className="text-[10px] text-slate-400 block">Open / Total Cases</span>
                  </div>
                  <div className="fs-ai-metric-box">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">
                      Closed SLA (&le;48h)
                    </span>
                    <span className="text-lg font-black text-emerald-700 block mt-0.5">
                      {loading ? "..." : caseSum.closedSlaRate || "N/A"}
                    </span>
                    <span className="text-[10px] text-slate-400 block">Operational SLA Rate</span>
                  </div>
                </div>
              </FrontStepsAiReportCard>

              <FrontStepsAiReportCard
                title="Policy-Scored Account KPI Components"
                subtitle={`Account-level policy evaluation (${data.policyContext?.snapshotCode || "Active Rule Snapshot"})`}
                icon={Award}
              >
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-500 block">
                        Final KPI Score
                      </span>
                      <span className="text-[11px] text-slate-600">
                        {finalScore?.blockingReason || "Gated by incomplete closure attribution"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {(finalScore?.metricStatus || finalScore?.status) === "CALCULATED" ? (
                        <span className="text-xl font-black text-[#042c51]">
                          {Number(finalScore.weightedScore ?? finalScore.earnedScore ?? 0).toFixed(2)} pts
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-700 font-black text-sm">
                          <ShieldAlert size={15} /> BLOCKED
                        </span>
                      )}
                      <MetricStatusBadge status={finalScore?.metricStatus || finalScore?.status || "BLOCKED"} />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11.5px] border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500">
                          <th className="py-1.5 px-2">Policy KPI</th>
                          <th className="py-1.5 px-2">Wt</th>
                          <th className="py-1.5 px-2">Actual</th>
                          <th className="py-1.5 px-2">Pts</th>
                          <th className="py-1.5 px-2">State</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {data.scorecardMetrics.map((m) => {
                          const status = m.metricStatus || m.status || "NO_DATA";
                          const rawVal = m.rawValue !== undefined ? m.rawValue : m.actualValue;
                          const pts = m.weightedScore !== undefined ? m.weightedScore : m.earnedScore;
                          return (
                            <tr key={m.metricCode}>
                              <td className="py-1.5 px-2 font-bold text-slate-800">{m.metricLabel || m.metricCode}</td>
                              <td className="py-1.5 px-2 text-slate-600">{m.weightPercent ?? m.weight ?? 0}%</td>
                              <td className="py-1.5 px-2 font-semibold text-slate-700">
                                {rawVal !== null && rawVal !== undefined
                                  ? `${rawVal}${m.unit === "PERCENT" ? "%" : m.unit === "SECONDS" ? "s" : ""}`
                                  : "BLOCKED"}
                              </td>
                              <td className="py-1.5 px-2 font-black text-[#042c51]">
                                {pts !== null && pts !== undefined ? Number(pts).toFixed(2) : "N/A"}
                              </td>
                              <td className="py-1.5 px-2">
                                <MetricStatusBadge status={status} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </FrontStepsAiReportCard>
            </div>

            {/* Voice Call Queues Breakdown */}
            <FrontStepsAiReportCard
              title={`Voice Call Queues Performance (${data.callQueues.length})`}
              subtitle="Policy-evaluated AHT (target <= 900s, 10%) and AHT Compliance (target >= 80%, 15%) by Call Queue"
              icon={PhoneCall}
            >
              {data.callQueues && data.callQueues.length > 0 ? (
                <div className="overflow-x-auto w-full min-w-0">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10.5px] font-black uppercase text-slate-500">
                        <th className="py-2.5 px-3">Call Queue</th>
                        <th className="py-2.5 px-3">Offered</th>
                        <th className="py-2.5 px-3">Answered</th>
                        <th className="py-2.5 px-3">Abandoned</th>
                        <th className="py-2.5 px-3">Answer Rate</th>
                        <th className="py-2.5 px-3">ASA</th>
                        <th className="py-2.5 px-3">Avg AHT</th>
                        <th className="py-2.5 px-3">AHT Score (10%)</th>
                        <th className="py-2.5 px-3">AHT Compliance</th>
                        <th className="py-2.5 px-3">Compliance Score (15%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.callQueues.map((q, idx) => (
                        <tr key={q.queueName || idx} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-2.5 px-3 font-bold text-slate-800">{q.queueName}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-700">
                            {Number(q.offered || 0).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-emerald-700">
                            {Number(q.answeredCalls || 0).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-rose-600">
                            {Number(q.abandonedCalls || 0).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-[#042c51]">{q.answerRate}</td>
                          <td className="py-2.5 px-3 text-slate-600">{q.asaFormatted || "N/A"}</td>
                          <td className="py-2.5 px-3 text-slate-700 font-semibold">
                            {q.ahtFormatted || "N/A"}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-[#042c51]">
                            {q.ahtWeightedScore !== null && q.ahtWeightedScore !== undefined
                              ? Number(q.ahtWeightedScore).toFixed(2)
                              : "N/A"}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-700">
                            {q.ahtCompliancePercent !== null && q.ahtCompliancePercent !== undefined
                              ? `${q.ahtCompliancePercent}%`
                              : "N/A"}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-[#042c51]">
                            {q.ahtComplianceWeightedScore !== null &&
                            q.ahtComplianceWeightedScore !== undefined
                              ? Number(q.ahtComplianceWeightedScore).toFixed(2)
                              : "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <FrontStepsAiEmptyState
                  title="No Voice Queue Snapshot Rows Available"
                  message="No voice call queues matched the active Call Queue filter or period."
                  notice="Call queues and Salesforce case channels are kept strictly separated without synthetic joins."
                />
              )}
            </FrontStepsAiReportCard>

            {/* Case Channels & Tiers Breakdown */}
            <FrontStepsAiReportCard
              title={`Case Channels & Tier Queues Performance (${data.caseChannels.length})`}
              subtitle="Salesforce Cases aggregated by Tier Queue and Case Origin channel with CRM field completion telemetry"
              icon={FolderKanban}
            >
              {data.caseChannels && data.caseChannels.length > 0 ? (
                <div className="overflow-x-auto w-full min-w-0">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10.5px] font-black uppercase text-slate-500">
                        <th className="py-2.5 px-3">Case Tier / Queue</th>
                        <th className="py-2.5 px-3">Case Origin</th>
                        <th className="py-2.5 px-3">Total Cases</th>
                        <th className="py-2.5 px-3">Closed</th>
                        <th className="py-2.5 px-3">Open</th>
                        <th className="py-2.5 px-3">SLA &le;48h</th>
                        <th className="py-2.5 px-3">Backlog</th>
                        <th className="py-2.5 px-3">CRM Resolution</th>
                        <th className="py-2.5 px-3">Sub Codes</th>
                        <th className="py-2.5 px-3">Case Summary</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.caseChannels.map((ch, idx) => (
                        <tr key={`${ch.queueName}-${ch.caseOrigin}-${idx}`} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-2.5 px-3 font-bold text-slate-800">{ch.queueName}</td>
                          <td className="py-2.5 px-3 text-slate-600">{ch.caseOrigin}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-700">
                            {Number(ch.totalCases || 0).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-emerald-700">
                            {Number(ch.closedCases || 0).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-amber-700">
                            {Number(ch.openCases || 0).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-[#042c51]">
                            {ch.closedSlaPercent !== null && ch.closedSlaPercent !== undefined
                              ? `${ch.closedSlaPercent}%`
                              : "N/A"}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {ch.backlogRatePercent !== null && ch.backlogRatePercent !== undefined
                              ? `${ch.backlogRatePercent}%`
                              : "N/A"}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-700">
                            {ch.resolutionCompletionPercent !== null &&
                            ch.resolutionCompletionPercent !== undefined
                              ? `${ch.resolutionCompletionPercent}%`
                              : "N/A"}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700">
                            {ch.subCodeCompletionPercent !== null &&
                            ch.subCodeCompletionPercent !== undefined
                              ? `${ch.subCodeCompletionPercent}%`
                              : "N/A"}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700">
                            {ch.summaryCompletionPercent !== null &&
                            ch.summaryCompletionPercent !== undefined
                              ? `${ch.summaryCompletionPercent}%`
                              : "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <FrontStepsAiEmptyState
                  title="No Case Channel Rows Available"
                  message="No Salesforce Case Tier or Origin channels matched the active filter criteria."
                  notice="No synthetic case-to-voice-queue merges performed."
                />
              )}
            </FrontStepsAiReportCard>
          </>
        )}
      </div>
    </FrontStepsAiLayout>
  );
}
