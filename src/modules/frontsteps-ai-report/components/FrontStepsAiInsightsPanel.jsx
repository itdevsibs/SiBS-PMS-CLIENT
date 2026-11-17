import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Lightbulb,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

function formatTimestamp(val) {
  if (!val) return "Not yet generated";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return String(val);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function resolveSeverityTone(severity) {
  switch (String(severity || "INFO").toUpperCase()) {
    case "CRITICAL":
      return {
        border: "border-rose-200 bg-rose-50/40",
        badge: "bg-rose-100 text-rose-800 border-rose-200",
        label: "RISK — CRITICAL",
      };
    case "WARNING":
      return {
        border: "border-amber-200 bg-amber-50/40",
        badge: "bg-amber-100 text-amber-800 border-amber-200",
        label: "RISK / GAP",
      };
    default:
      return {
        border: "border-slate-200 bg-slate-50/50",
        badge: "bg-sky-100 text-[#042c51] border-sky-200",
        label: "OBSERVATION",
      };
  }
}

function formatTargetAttainmentBadge(att) {
  switch (String(att || "").toUpperCase()) {
    case "BELOW_TARGET":
      return {
        label: "Below Target",
        className: "bg-rose-50 text-rose-700 border-rose-200",
      };
    case "MEETS_OR_EXCEEDS_TARGET":
      return {
        label: "Meets Target",
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    case "ON_TARGET":
      return {
        label: "On Target",
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    default:
      return null;
  }
}

function formatCategoryLabel(cat) {
  return String(cat || "OPERATIONAL_PERFORMANCE")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatAggregationTag(aggregationType) {
  switch (String(aggregationType || "").toUpperCase()) {
    case "REPORT_TOTAL":
      return "Period Total";
    case "WEIGHTED_AVERAGE":
      return "Weighted Avg";
    case "DAILY_AVERAGE":
      return "Daily Mean";
    case "INTERVAL_EXTREME":
      return "Interval Extreme";
    case "CASE_DRIVER_TOTAL":
      return "Case Driver";
    case "QUEUE_AGGREGATE":
      return "Voice Queue";
    case "CHANNEL_AGGREGATE":
      return "SF Channel";
    case "EMPLOYEE_TOTAL":
    case "EMPLOYEE_AGGREGATE":
      return "Agent Metric";
    case "EMPLOYEE_ATTRIBUTED_TOTAL":
      return "Modified-By Attr";
    default:
      return null;
  }
}

/**
 * Collapsible AI-Generated Insights Panel shared across Summary, Account KPI, and PMP/PIP dashboards.
 * Strict Non-Chatbot Design: Only displays validated cached snapshot insights and triggers background jobs.
 */
export default function FrontStepsAiInsightsPanel({
  reportLabel = "Report",
  reportType = null,
  insightData = {},
  loading = false,
  generating = false,
  jobState = null,
  error = null,
  onGenerate,
  disabledReason = null,
}) {
  const insight = insightData?.insight || null;
  const latestAttempt = insightData?.latestAttempt || null;
  const hasPublishedSnapshot = Boolean(insightData?.hasPublishedSnapshot);
  const unavailableCode = insightData?.unavailableCode || null;
  const unavailableReason = insightData?.unavailableReason || null;
  const isForbiddenScope =
    unavailableCode === "FORBIDDEN_INSIGHT_SCOPE" ||
    unavailableCode === "FORBIDDEN_CROSS_EMPLOYEE_INSIGHT" ||
    unavailableCode === "FORBIDDEN_INSIGHT_ACCESS" ||
    unavailableCode === "UNAUTHORIZED_INSIGHT_SCOPE";
  const effectiveDisabledReason =
    disabledReason || (insightData?.canGenerateInsights === false ? unavailableReason : null);
  const canGenerate =
    insightData?.canGenerateInsights !== false && !effectiveDisabledReason;

  // Auto-expand when a validated insight, rejection blocker, or explicit governance unavailability exists
  const [expanded, setExpanded] = useState(
    Boolean(
      insight ||
        latestAttempt ||
        (unavailableCode &&
          unavailableCode !== "NO_PUBLISHED_SNAPSHOT" &&
          unavailableCode !== "SNAPSHOT_NOT_FOUND")
    )
  );

  useEffect(() => {
    if (
      insight ||
      latestAttempt ||
      error ||
      (unavailableCode &&
        unavailableCode !== "NO_PUBLISHED_SNAPSHOT" &&
        unavailableCode !== "SNAPSHOT_NOT_FOUND")
    ) {
      setExpanded(true);
    }
  }, [insight?.id, latestAttempt?.id, error, unavailableCode]);

  const findings = Array.isArray(insight?.findings) ? insight.findings : [];
  const semanticReview = insight?.semanticReview || null;
  const hasSemanticFlags = Boolean(
    semanticReview?.hasFlaggedFindings || semanticReview?.reviewStatus === "FLAGGED_SEMANTIC_ISSUES"
  );
  const verifiedFindingsCount = semanticReview
    ? Number(semanticReview.passedFindingsCount || 0)
    : findings.length;
  const flaggedFindingsCount = semanticReview ? Number(semanticReview.flaggedFindingsCount || 0) : 0;
  const riskFindingsCount = findings.filter((f) => f.severity === "CRITICAL" || f.severity === "WARNING").length;
  const validationErrors = latestAttempt?.validationReport?.errors || [];
  const validationWarnings = latestAttempt?.validationReport?.warnings || [];

  return (
    <div
      data-testid="fs-ai-insights-panel"
      className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden min-w-0"
    >
      {/* Collapsible Header Bar */}
      <div className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-slate-100">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#042c51] text-white shrink-0 mt-0.5">
            <Sparkles size={17} className="text-[#ff5c28]" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#042c51]">
                AI-Generated Insights
              </h3>

              {insight && hasSemanticFlags ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border border-amber-300 bg-amber-50 text-amber-900">
                  <ShieldAlert size={11} />
                  <span>
                    Semantic Review Flagged ({flaggedFindingsCount}/{findings.length} Findings)
                  </span>
                </span>
              ) : insight && semanticReview && semanticReview.isCurrentValidatorVersion === false ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-200 bg-emerald-50 text-emerald-800">
                  <ShieldCheck size={11} />
                  <span>
                    Historical Audit Passed ({semanticReview.generatedUnderValidatorVersion || "legacy"} •{" "}
                    {semanticReview.validatorVersionChecked || "v3.3"})
                  </span>
                </span>
              ) : insight ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-200 bg-emerald-50 text-emerald-800">
                  <ShieldCheck size={11} />
                  <span>Validated &amp; Cached (v{insight.versionNumber})</span>
                </span>
              ) : latestAttempt ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border border-amber-300 bg-amber-50 text-amber-800">
                  <ShieldAlert size={11} />
                  <span>Withheld ({latestAttempt.validationStatus})</span>
                </span>
              ) : isForbiddenScope ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border border-rose-200 bg-rose-50 text-rose-800">
                  <ShieldAlert size={11} />
                  <span>Data Not Authorized</span>
                </span>
              ) : unavailableCode === "ROSTER_VERIFICATION_REQUIRED" ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border border-amber-300 bg-amber-50 text-amber-800">
                  <AlertTriangle size={11} />
                  <span>Roster Verification Required</span>
                </span>
              ) : unavailableCode === "NO_SUFFICIENT_SOURCE_EVIDENCE" ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border border-slate-200 bg-slate-100 text-slate-700">
                  <AlertTriangle size={11} />
                  <span>No Sufficient Source Evidence</span>
                </span>
              ) : !hasPublishedSnapshot ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border border-slate-200 bg-slate-100 text-slate-600">
                  <span>No Verified Snapshot</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border border-slate-200 bg-slate-100 text-slate-600">
                  <span>No Cached Insight for Scope</span>
                </span>
              )}

              {jobState && (jobState.status === "QUEUED" || jobState.status === "RUNNING" || jobState.status === "TRIGGERING") && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border border-sky-200 bg-sky-50 text-sky-800 animate-pulse">
                  <RefreshCw size={10} className="animate-spin" />
                  <span>Worker {jobState.status}</span>
                </span>
              )}

              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-emerald-200 bg-white text-emerald-700">
                Hermes Calls on GET: {Number(insightData?.hermesCallsCount || 0)}
              </span>

              {reportType === "INDIVIDUAL_KPI_PMP" && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-slate-200 bg-slate-50 text-slate-700">
                  Coaching &amp; Review Aid Only • No Auto HR/Payroll Action
                </span>
              )}
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
              <span>
                Scope: <strong className="text-slate-700">{reportLabel}</strong>
                {insightData?.snapshot?.id ? ` • Snapshot #${insightData.snapshot.id}` : ""}
              </span>
              {insight?.policySnapshotCode && (
                <>
                  <span>•</span>
                  <span>
                    Policy: <strong className="text-slate-700">{insight.policySnapshotCode}</strong>
                  </span>
                </>
              )}
              {insight?.generatedAt && (
                <>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock size={11} />
                    <span>Generated: {formatTimestamp(insight.generatedAt)}</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {typeof onGenerate === "function" && (
            <button
              type="button"
              disabled={!hasPublishedSnapshot || !canGenerate || generating || loading}
              onClick={() => onGenerate({ force: Boolean(insight) })}
              title={
                effectiveDisabledReason ||
                (!hasPublishedSnapshot
                  ? "Requires a verified report snapshot for the selected filters"
                  : insight
                    ? "Trigger a new background Hermes verification run"
                    : "Generate validated management insights via Hermes background worker")
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer bg-[#042c51] text-white hover:bg-[#063c6e] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles size={13} className={generating ? "animate-spin text-[#ff5c28]" : "text-[#ff5c28]"} />
              <span>
                {generating
                  ? "Generating..."
                  : insight
                    ? "Regenerate Insights"
                    : "Generate Insights"}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
          >
            <span>{expanded ? "Hide Insights" : "View Insights"}</span>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Collapsible Content */}
      {expanded && (
        <div className="p-4 space-y-4">
          {effectiveDisabledReason && (
            <div
              className={`flex items-start gap-2 p-3 rounded-lg border text-xs ${
                isForbiddenScope
                  ? "border-rose-200 bg-rose-50 text-rose-900"
                  : "border-amber-200 bg-amber-50 text-amber-900"
              }`}
            >
              <AlertTriangle
                size={15}
                className={`${isForbiddenScope ? "text-rose-600" : "text-amber-600"} shrink-0 mt-0.5`}
              />
              <span>{effectiveDisabledReason}</span>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-900 text-xs">
              <AlertCircle size={15} className="text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5 min-w-0">
                <p className="font-bold">Insight Generation Error</p>
                <p className="text-rose-800">{error}</p>
                <p className="text-[11px] text-rose-700">
                  Original snapshot calculations remain intact and unaffected below.
                </p>
              </div>
            </div>
          )}

          {jobState && jobState.message && !error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-xs">
              <CheckCircle2 size={14} className="text-[#1b6ca8] shrink-0" />
              <span>{jobState.message}</span>
            </div>
          )}

          {latestAttempt && (
            <div className="rounded-lg border border-amber-300 bg-amber-50/70 p-3 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-amber-900 flex items-center gap-1.5">
                  <ShieldAlert size={14} className="text-amber-600 shrink-0" />
                  <span>
                    Latest Hermes Run Held by Independent Validator ({latestAttempt.validationStatus})
                  </span>
                </span>
                <span className="text-[10.5px] text-amber-700 font-semibold">
                  {formatTimestamp(latestAttempt.generatedAt)}
                </span>
              </div>
              {latestAttempt.errorSummary && (
                <p className="text-amber-900 leading-relaxed">{latestAttempt.errorSummary}</p>
              )}
              {(validationErrors.length > 0 || validationWarnings.length > 0) && (
                <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-amber-800">
                  {validationErrors.map((e, i) => (
                    <li key={`err-${i}`}>{e}</li>
                  ))}
                  {validationWarnings.map((w, i) => (
                    <li key={`warn-${i}`}>{w}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {insight ? (
            <div className="space-y-4">
              {hasSemanticFlags && (
                <div
                  data-testid="fs-ai-semantic-review-banner"
                  className="rounded-xl border border-amber-300 bg-amber-50/90 p-3 text-xs text-amber-950 space-y-1"
                >
                  <div className="flex items-center gap-1.5 font-extrabold">
                    <ShieldAlert size={14} className="text-amber-700 shrink-0" />
                    <span>
                      Semantic Review Warning — Flagged Historical Insight (v
                      {insight.versionNumber}, checked against{" "}
                      {semanticReview?.validatorVersionChecked || "v3.3"})
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-900">
                    {semanticReview?.summary ||
                      "One or more findings in this insight did not pass semantic policy or evidence relevance validation."}
                    {" "}
                    Flagged findings remain visible strictly for authorized audit inspection and must
                    not be treated as unqualified validated management conclusions until a new
                    version is generated and validated.
                  </p>
                </div>
              )}

              {/* Executive Summary */}
              <div className="rounded-xl border border-[#042c51]/15 bg-[#042c51]/[0.03] p-3.5 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#042c51]">
                    Executive Summary
                  </span>
                  <span className="text-[10.5px] font-semibold text-slate-500">
                    Model: {insight.hermesModel} •{" "}
                    {hasSemanticFlags
                      ? `${verifiedFindingsCount} Verified / ${flaggedFindingsCount} Flagged Semantic Review`
                      : `${findings.length} Verified Finding${findings.length === 1 ? "" : "s"}`}
                    {riskFindingsCount > 0 ? ` • ${riskFindingsCount} Risk/Gap Flagged` : ""}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-slate-800">{insight.executiveSummary}</p>
              </div>

              {/* Key Findings, Operational Risks & Suggested Actions */}
              {findings.length > 0 ? (
                <div className="space-y-2.5">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-600">
                    Key Findings, Operational Risks &amp; Suggested Actions
                  </h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {findings.map((finding, idx) => {
                      const tone = resolveSeverityTone(finding.severity);
                      const findingReview = finding.semanticReview || null;
                      const isFindingFlagged = findingReview?.status === "FLAGGED";
                      const semanticIssues = Array.isArray(findingReview?.issues)
                        ? findingReview.issues
                        : [];
                      const evidenceItems =
                        finding.resolvedEvidence && finding.resolvedEvidence.length > 0
                          ? finding.resolvedEvidence
                          : finding.evidence || [];
                      return (
                        <div
                          key={idx}
                          className={`rounded-xl border p-3.5 space-y-2.5 min-w-0 ${
                            isFindingFlagged ? "border-amber-300 bg-amber-50/40" : tone.border
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-1.5">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${tone.badge}`}
                              >
                                {tone.label}
                              </span>
                              {isFindingFlagged && (
                                <span
                                  data-testid={`fs-ai-finding-flagged-${idx}`}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold border border-amber-400 bg-amber-100 text-amber-950"
                                >
                                  <ShieldAlert size={10} />
                                  <span>Semantic Review Flagged — Not Verified Conclusion</span>
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              {finding.claimType && (
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[9.5px] font-semibold text-slate-600">
                                  {formatCategoryLabel(finding.claimType)}
                                </span>
                              )}
                              <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                {formatCategoryLabel(finding.category)}
                              </span>
                            </div>
                          </div>

                          <h5 className="text-xs font-extrabold text-[#042c51] leading-snug">
                            {finding.headline}
                          </h5>

                          <p className="text-xs text-slate-700 leading-relaxed">
                            {finding.observation || finding.explanation}
                          </p>

                          {isFindingFlagged && semanticIssues.length > 0 && (
                            <div className="rounded-lg border border-amber-300 bg-amber-100/70 px-2.5 py-2 text-[11px] text-amber-950 space-y-1">
                              <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900">
                                Audit-Only Notice — Flagged Semantic Validation Issues
                              </p>
                              <ul className="list-disc pl-4 space-y-0.5">
                                {semanticIssues.map((issue, iIdx) => (
                                  <li key={iIdx}>
                                    <span className="font-mono font-bold">{issue.code}</span>:{" "}
                                    {issue.reason}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Verified Supporting Evidence (Deterministically Resolved by PMS Snapshot) */}
                          {evidenceItems.length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                Verified Supporting Evidence (Snapshot-Resolved)
                              </p>
                              <div className="space-y-1">
                                {evidenceItems.map((ev, eIdx) => {
                                  const aggTag = formatAggregationTag(ev.aggregationType);
                                  const attBadge = formatTargetAttainmentBadge(ev.targetAttainment);
                                  const displayVal =
                                    ev.formattedValue ||
                                    (ev.metricValue !== null && ev.metricValue !== undefined
                                      ? String(ev.metricValue)
                                      : "BLOCKED / N/A");
                                  const displayTarget =
                                    ev.formattedTarget ||
                                    (ev.targetValue !== null && ev.targetValue !== undefined
                                      ? `${ev.targetValue}${ev.targetUnit === "%" || ev.targetUnit === "percent" ? "%" : ev.targetUnit === "sec" || ev.targetUnit === "seconds" ? "s" : ev.targetUnit ? ` ${ev.targetUnit}` : ""}`
                                      : null);
                                  return (
                                    <div
                                      key={eIdx}
                                      title={ev.snapshotReference || ev.evidenceId || ev.metricCode}
                                      className="flex flex-wrap items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px] text-slate-700"
                                    >
                                      <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                                        {ev.entityLabel && ev.entityLabel !== "All In-Scope Activity" && (
                                          <span className="px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200 text-[9.5px] font-semibold text-slate-700 truncate max-w-[220px]">
                                            {ev.entityLabel}
                                          </span>
                                        )}
                                        <span className="font-semibold text-[#042c51]">
                                          {ev.metricLabel || ev.metricCode}:
                                        </span>
                                        <span className="font-mono font-bold text-[#042c51]">
                                          {displayVal}
                                        </span>
                                        {displayTarget && (
                                          <span className="text-[10px] font-mono text-slate-500">
                                            (Target: {displayTarget})
                                          </span>
                                        )}
                                        {ev.weightPercent !== null && ev.weightPercent !== undefined && (
                                          <span className="text-[9.5px] text-slate-500">
                                            • Wt: {ev.weightPercent}%
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex flex-wrap items-center gap-1">
                                        {attBadge && (
                                          <span
                                            className={`px-1.5 py-0.2 rounded border text-[9px] font-bold ${attBadge.className}`}
                                          >
                                            {attBadge.label}
                                          </span>
                                        )}
                                        {aggTag && (
                                          <span className="px-1.5 py-0.2 rounded bg-slate-100 text-[9px] font-semibold text-slate-600">
                                            {aggTag}
                                          </span>
                                        )}
                                        {Array.isArray(ev.supportingDocumentCodes) &&
                                          ev.supportingDocumentCodes.length > 0 && (
                                            <span className="px-1.5 py-0.2 rounded bg-sky-50 border border-sky-100 text-[9px] font-semibold text-sky-800">
                                              {ev.supportingDocumentCodes.join(", ")}
                                            </span>
                                          )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Suggested Action */}
                          {finding.recommendation && (
                            <div className="rounded-lg bg-white border border-slate-200/80 p-2.5 flex items-start gap-2">
                              <Lightbulb size={13} className="text-[#ff5c28] shrink-0 mt-0.5" />
                              <div className="text-[11px] text-slate-700 min-w-0">
                                <span className="font-bold text-[#042c51]">Suggested Action: </span>
                                <span>{finding.recommendation}</span>
                              </div>
                            </div>
                          )}

                          {/* Policy References */}
                          {finding.policyReferences && finding.policyReferences.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-slate-500 mr-1">
                                <BookOpen size={11} />
                                <span>Policy:</span>
                              </span>
                              {finding.policyReferences.map((ref, pIdx) => (
                                <span
                                  key={pIdx}
                                  className="inline-flex items-center px-1.5 py-0.5 rounded bg-sky-50 border border-sky-200 text-[10px] font-semibold text-sky-900"
                                >
                                  {ref}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Finding-specific Data Limitations */}
                          {finding.limitations && finding.limitations.length > 0 && (
                            <div className="text-[10.5px] text-amber-800 bg-amber-50/70 border border-amber-200/80 rounded px-2 py-1">
                              <span className="font-bold">Scope Caveat: </span>
                              {finding.limitations.join(" • ")}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-900 flex items-start gap-2">
                  <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Limited Verified Findings for This Scope</p>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      No additional performance findings were published because verified source metrics are incomplete, missing alias attribution, or remain blocked.
                    </p>
                  </div>
                </div>
              )}

              {/* Data Limitations & Completeness Warnings */}
              {((insight.dataQualityWarnings && insight.dataQualityWarnings.length > 0) ||
                (insight.overallLimitations && insight.overallLimitations.length > 0)) && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2 text-[11px] text-slate-700">
                  <div className="font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <AlertTriangle size={13} className="text-amber-600 shrink-0" />
                    <span>Data Limitations &amp; Completeness Constraints</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-1">
                    {[...(insight.dataQualityWarnings || []), ...(insight.overallLimitations || [])].map(
                      (item, idx) => (
                        <li key={idx}>{item}</li>
                      )
                    )}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            !error &&
            !latestAttempt &&
            !effectiveDisabledReason && (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/70 p-4 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                {!hasPublishedSnapshot ? (
                  <div>
                    <p className="font-bold text-slate-800">
                      No verified report snapshot is available for this filter scope.
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      AI insight generation requires a published snapshot matching these filters. Switching dashboards or filters never triggers Hermes automatically.
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="font-bold text-slate-800">
                      No cached management insights exist yet for this snapshot &amp; filter scope.
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Opening or filtering dashboards never invokes Hermes automatically. Authorized managers can click{" "}
                      <strong>Generate Insights</strong> to queue an isolated background analysis.
                    </p>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
