import React, { useState, useEffect, useMemo } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Ban,
  ChevronDown,
  ChevronUp,
  Layers,
  Search,
  ShieldAlert,
  ShieldCheck,
  User,
  UserCheck,
  Users,
  UserX,
  X,
} from "lucide-react";
import FrontStepsAiLayout from "../layouts/FrontStepsAiLayout";
import FrontStepsAiPageHeader from "../components/FrontStepsAiPageHeader";
import FrontStepsAiReportCard from "../components/FrontStepsAiReportCard";
import FrontStepsAiEmptyState from "../components/FrontStepsAiEmptyState";
import FrontStepsAiGovernanceBanner, { MetricStatusBadge } from "../components/FrontStepsAiGovernanceBanner";
import FrontStepsAiInsightsPanel from "../components/FrontStepsAiInsightsPanel";
import FrontStepsAiTablePagination from "../components/FrontStepsAiTablePagination";
import { deduplicateFrontStepsEmployees } from "../adapters/frontStepsAiDataAdapter";
import { useFrontStepsAiInsights, useFrontStepsAiPmpPip } from "../hooks/useFrontStepsAiData";

const PAGE_SIZE = 15;

const PERIOD_OPTIONS = [
  { label: "Monthly", value: "monthly" },
  { label: "Annually", value: "annually" },
  { label: "Weekly", value: "weekly" },
  { label: "Daily", value: "daily" },
];

const KPI_POLICY_RULE_MAP = {
  AHT: { label: "Average Handle Time (AHT)", ruleCode: "FS-PMP-AHT-001", targetHint: "<= 900s", unit: "s" },
  AHT_COMPLIANCE: { label: "AHT Compliance", ruleCode: "FS-PMP-AHTC-001", targetHint: ">= 80%", unit: "%" },
  CASES_CLOSED: { label: "Cases Closed SLA", ruleCode: "FS-PMP-CASE-001", targetHint: "Prorated Target", unit: "cases" },
  CRM_RESOLUTION: { label: "CRM Resolution Field", ruleCode: "FS-PMP-CRM-001", targetHint: "100%", unit: "%" },
  CRM_SUB_CODE_COMPLETION: { label: "CRM Sub Code Completion", ruleCode: "FS-PMP-CRM-002", targetHint: ">= 95%", unit: "%" },
  CRM_SUMMARY_COMPLETION: { label: "CRM Case Summary Completion", ruleCode: "FS-PMP-CRM-003", targetHint: ">= 95%", unit: "%" },
};

function formatKpiRaw(kpi, metricCode) {
  if (!kpi || kpi.rawValue === null || kpi.rawValue === undefined) return "No Data Available";
  const unit = KPI_POLICY_RULE_MAP[metricCode]?.unit;
  if (unit === "%") return `${Number(kpi.rawValue).toFixed(2)}%`;
  if (unit === "s") return `${kpi.rawValue}s`;
  return String(kpi.rawValue);
}

function renderEmploymentStatusBadge(status) {
  switch (status) {
    case "ACTIVE":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Active
        </span>
      );
    case "INACTIVE_SEPARATED":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300 text-[10px] font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          Inactive / Separated
        </span>
      );
    case "TRANSFERRED":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          Transferred
        </span>
      );
    case "VERIFICATION_REQUIRED":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 text-[10px] font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Verification Required
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-medium">
          {status || "Unknown"}
        </span>
      );
  }
}

function renderScoreCell(kpi, metricCode) {
  const status = kpi?.status || kpi?.metricStatus || "NO_DATA";
  if (!kpi || kpi.status === "NO_DATA" || status === "NO_DATA") {
    return (
      <span
        title={kpi?.blockingReason || "No Data Available for this period"}
        className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-semibold"
      >
        No Data Available
      </span>
    );
  }
  if (status === "BLOCKED") {
    return (
      <span
        title={kpi.blockingReason || "Blocked by data governance"}
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold"
      >
        <Ban size={10} />
        <span>BLOCKED</span>
      </span>
    );
  }
  const targetLabel =
    kpi.targetValue !== null && kpi.targetValue !== undefined
      ? kpi.targetValue
      : KPI_POLICY_RULE_MAP[metricCode]?.targetHint || "N/A";
  return (
    <div>
      <span className="font-bold text-[#042c51] block">
        {kpi.weightedScore !== null && kpi.weightedScore !== undefined
          ? `${Number(kpi.weightedScore).toFixed(2)} / ${kpi.weightPercent}`
          : "No Data Available"}
      </span>
      <span className="text-[10px] text-slate-500 block">
        Act: {formatKpiRaw(kpi, metricCode)} • Tgt: {targetLabel}
      </span>
    </div>
  );
}

export default function FrontStepsAiPmpPipPage() {
  const [showVerificationDetails, setShowVerificationDetails] = useState(true);
  const [inspectedSibsId, setInspectedSibsId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

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
  } = useFrontStepsAiPmpPip({ period: "monthly", employeeId: "all", site: "all" });

  // 1. Retrieve the complete authorized active employee dataset
  const rawDataset = Array.isArray(data.directory) && data.directory.length > 0
    ? data.directory
    : Array.isArray(data.employees)
      ? data.employees
      : [];

  // 2. Deduplicate and verify canonical active employee identity (5 active agents)
  const canonicalEmployees = useMemo(
    () => deduplicateFrontStepsEmployees(rawDataset).filter(
      (e) => e.employmentStatus === "ACTIVE" ||
             e.availabilityStatus === "VERIFIED_ACTIVE_FRONTSTEPS" ||
             e.availabilityStatus === "ACTIVE_MISSING_SOURCE_ALIAS" ||
             e.availabilityStatus === "ACTIVE_NO_SOURCE_RECORDS"
    ),
    [rawDataset]
  );

  // 3 & 4. Apply site filter, employeeId filter, and search
  const filteredAndSorted = useMemo(() => {
    const list = canonicalEmployees.filter((emp) => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const nameMatch = String(emp.employeeName || "").toLowerCase().includes(q);
        const idMatch = String(emp.sibsId || "").toLowerCase().includes(q);
        const kronosMatch = String(emp.kronosEmpCode || "").toLowerCase().includes(q);
        if (!nameMatch && !idMatch && !kronosMatch) return false;
      }
      if (filters.site && filters.site !== "all") {
        const siteNorm = String(filters.site).toLowerCase().trim();
        const empSiteNorm = String(emp.siteName || "").toLowerCase().trim();
        if (empSiteNorm && empSiteNorm !== siteNorm) return false;
      }
      if (filters.employeeId && filters.employeeId !== "all") {
        if (String(emp.sibsId) !== String(filters.employeeId)) return false;
      }
      return true;
    });

    // 5. Apply deterministic sorting: alphabetical by employee name
    list.sort((a, b) => String(a.employeeName || "").localeCompare(String(b.employeeName || "")));
    return list;
  }, [canonicalEmployees, searchTerm, filters.site, filters.employeeId]);

  // 6. Calculate total matching active employees and pages
  const totalMatchingEmployees = filteredAndSorted.length;
  const totalPages = Math.max(1, Math.ceil(totalMatchingEmployees / PAGE_SIZE));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  // Reset to Page 1 when search query, period, site, or employee filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters.period, filters.site, filters.employeeId]);

  // If current page becomes invalid after data update, automatically move to last valid page
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // 7. Paginate the filtered/sorted active results (default 15 per page)
  const paginatedEmployees = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
    return filteredAndSorted.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredAndSorted, safeCurrentPage]);

  // Backwards-compatible aliases for legacy references
  const directory = canonicalEmployees;
  const filteredDirectory = filteredAndSorted;

  const employeeOptions = data.availableFilters?.directoryEmployees?.length
    ? data.availableFilters.directoryEmployees
    : data.availableFilters?.employees?.length
      ? data.availableFilters.employees
      : directory;
  const siteOptions = data.availableFilters?.sites || [];

  const selectedEmpOption =
    filters.employeeId && filters.employeeId !== "all"
      ? employeeOptions.find((e) => String(e.sibsId) === String(filters.employeeId)) || null
      : null;

  const pmpUnavailableState = data.selectedEmployeeExcludedForVerification
    ? {
        hasPublishedSnapshot: true,
        code: "ROSTER_VERIFICATION_REQUIRED",
        reason:
          "Individual scorecard and AI insights are withheld while employee roster verification is required.",
      }
    : !loading && !data.hasPublishedSnapshot
      ? {
          hasPublishedSnapshot: false,
          code: "NO_PUBLISHED_SNAPSHOT",
          reason:
            data.unavailableDetail ||
            data.message ||
            "No published Individual KPI snapshot exists for this filter selection.",
        }
      : null;

  const missingDataDisabledReason =
    selectedEmpOption &&
    (selectedEmpOption.availabilityStatus === "ACTIVE_MISSING_SOURCE_ALIAS" ||
      selectedEmpOption.availabilityStatus === "ACTIVE_NO_SOURCE_RECORDS")
      ? `AI insights disabled: ${selectedEmpOption.employeeName || `Agent #${filters.employeeId}`} has no verified source call/case records (${selectedEmpOption.availabilityStatus}).`
      : null;

  const {
    insightData,
    loading: insightsLoading,
    generating: insightsGenerating,
    jobState: insightJobState,
    error: insightsError,
    generateInsights,
  } = useFrontStepsAiInsights({
    reportType: "INDIVIDUAL_KPI_PMP",
    filters,
    snapshotId: data.snapshot?.id || null,
    enabled: Boolean(data.hasPublishedSnapshot && !data.selectedEmployeeExcludedForVerification),
    unavailableState: pmpUnavailableState,
  });

  const inspectedEmployee = useMemo(() => {
    if (inspectedSibsId) {
      const found = canonicalEmployees.find((e) => String(e.sibsId) === String(inspectedSibsId));
      if (found) return found;
    }
    if (filters.employeeId && filters.employeeId !== "all") {
      const found = canonicalEmployees.find((e) => String(e.sibsId) === String(filters.employeeId));
      if (found) return found;
    }
    if (paginatedEmployees.length === 1) return paginatedEmployees[0];
    if (paginatedEmployees.length > 0) return paginatedEmployees[0];
    return canonicalEmployees[0] || null;
  }, [canonicalEmployees, paginatedEmployees, inspectedSibsId, filters.employeeId]);

  return (
    <FrontStepsAiLayout activeRouteId="ai-pmp-pip">
      <div className="space-y-4 pb-6">
        <FrontStepsAiPageHeader
          title="Individual KPI / PMP / PIP (SiBS Agents)"
          subtitle="Policy-governed individual agent KPI evaluation for verified SiBS employees with strict proration and closure-attribution gates"
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
                  aria-label="Period"
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
              {siteOptions.length > 0 && (
                <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 px-2">Site:</span>
                  <select
                    aria-label="Site"
                    value={filters.site || "all"}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        site: e.target.value,
                      }))
                    }
                    className="text-xs font-bold text-slate-800 bg-slate-50 px-2 py-1 rounded border-0 outline-none cursor-pointer"
                  >
                    <option value="all">All Sites ({siteOptions.length})</option>
                    {siteOptions.map((siteName) => (
                      <option key={siteName} value={siteName}>
                        {siteName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 px-2">Agent:</span>
                <select
                  aria-label="Agent"
                  value={filters.employeeId || "all"}
                  onChange={(e) => {
                    setFilters((prev) => ({
                      ...prev,
                      employeeId: e.target.value,
                    }));
                    setInspectedSibsId(e.target.value === "all" ? null : e.target.value);
                  }}
                  className="text-xs font-bold text-slate-800 bg-slate-50 px-2 py-1 rounded border-0 outline-none cursor-pointer max-w-xs"
                >
                  <option value="all">Verified Roster ({employeeOptions.length})</option>
                  {employeeOptions.map((emp) => (
                    <option key={emp.sibsId} value={emp.sibsId}>
                      {emp.employeeName} ({emp.sibsId})
                      {emp.availabilityStatus === "ACTIVE_MISSING_SOURCE_ALIAS"
                        ? " — Missing Alias (No Data)"
                        : emp.availabilityStatus === "ACTIVE_NO_SOURCE_RECORDS"
                          ? " — No Source Records"
                          : ""}
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
          reportType="INDIVIDUAL_KPI_PMP"
          reportLabel={
            selectedEmpOption
              ? `${selectedEmpOption.employeeName} (${selectedEmpOption.sibsId}) — ${filters.period || "monthly"}${
                  filters.site && filters.site !== "all" ? `, ${filters.site}` : ""
                }`
              : filters.employeeId && filters.employeeId !== "all"
                ? `Agent #${filters.employeeId} (${filters.period || "monthly"}${
                    filters.site && filters.site !== "all" ? `, ${filters.site}` : ""
                  })`
                : `Verified Team Roster (${filters.period || "monthly"}${
                    filters.site && filters.site !== "all" ? `, ${filters.site}` : ""
                  })`
          }
          insightData={insightData}
          loading={insightsLoading}
          generating={insightsGenerating}
          jobState={insightJobState}
          error={insightsError}
          onGenerate={generateInsights}
          disabledReason={
            data.selectedEmployeeExcludedForVerification
              ? "Individual scorecard and AI insights are withheld while employee roster verification is required."
              : missingDataDisabledReason ||
                (!loading && !data.hasPublishedSnapshot
                  ? data.unavailableDetail ||
                    data.message ||
                    "No published Individual KPI snapshot exists for this filter selection."
                  : null)
          }
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
                "No published individual KPI snapshot exists for this period/site selection. Select Monthly or Annually, or clear Site/Agent filters."
              }
              notice="Zero Hermes inference or background rebuilds are triggered on filter changes."
            />
          </FrontStepsAiReportCard>
        ) : (
          <>
            {/* Authoritative Policy Performance Bands */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 min-w-0">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                  Exceeds Expectations (Milestone Gold)
                </span>
                <span className="text-lg font-black text-emerald-700 mt-0.5 block">
                  &ge; 95.0%
                </span>
                <span className="text-[10px] text-emerald-600 block mt-0.5">
                  Tier Benchmark (FS-MILESTONE-001)
                </span>
              </div>

              <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 block">
                  Passing PMP Baseline
                </span>
                <span className="text-lg font-black text-blue-700 mt-0.5 block">
                  85.0% - 94.9%
                </span>
                <span className="text-[10px] text-blue-600 block mt-0.5">
                  Minimum Passing Target (FS-PMP-001)
                </span>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                  PIP Review Watch
                </span>
                <span className="text-lg font-black text-amber-700 mt-0.5 block">
                  80.0% - 84.9%
                </span>
                <span className="text-[10px] text-amber-600 block mt-0.5">
                  Coaching / Remediation Review (FS-PIP-001)
                </span>
              </div>

              <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 block">
                  Critical Fail Threshold
                </span>
                <span className="text-lg font-black text-rose-700 mt-0.5 block">
                  &lt; 80.0%
                </span>
                <span className="text-[10px] text-rose-600 block mt-0.5">
                  Requires Verified All-6 Components (QA Excluded)
                </span>
              </div>
            </div>

            {/* Identity Reconciliation, Section 7 Roster Quarantine & Attribution Governance Summary */}
            {(data.aliasIdMismatches.length > 0 ||
              data.unmappedTopCallOwners.length > 0 ||
              data.identityVerificationIssues.length > 0 ||
              data.identityReconciliation ||
              data.actorReconciliation) && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 text-xs text-amber-950 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-bold">
                    <ShieldCheck size={14} className="text-emerald-700 shrink-0" />
                    <span>Roster Verification &amp; Source Attribution Governance</span>
                  </div>
                  {data.identityReconciliation && (
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Verified Operational Roster:{" "}
                        {data.identityReconciliation.verifiedOperationalRosterCount ??
                          data.identityReconciliation.verifiedActiveCount}
                      </span>
                      {Number(data.identityReconciliation.verifiedActiveMissingAliasCount || 0) > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200">
                          Active Missing Source Alias:{" "}
                          {data.identityReconciliation.verifiedActiveMissingAliasCount}
                        </span>
                      )}
                      {data.identityReconciliation.kronosDirectoryActiveCount !== undefined && (
                        <span className="px-2 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200">
                          Kronos Directory Active: {data.identityReconciliation.kronosDirectoryActiveCount}
                        </span>
                      )}
                      {data.identityVerificationIssues.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                          Roster Verification Required: {data.identityVerificationIssues.length}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        Excluded Inactive / Non-Agent: {data.identityReconciliation.excludedCount}
                      </span>
                    </div>
                  )}
                </div>

                {data.identityReconciliation?.reconciliationSummary && (
                  <p className="text-[11px] text-amber-900">
                    {data.identityReconciliation.reconciliationSummary}
                  </p>
                )}

                {data.identityVerificationIssues.length > 0 && (
                  <div className="rounded-lg border border-amber-300 bg-white/80 p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
                        <AlertTriangle size={13} className="text-amber-600 shrink-0" />
                        <span>
                          Roster Verification Required — Individual Scorecards Held (
                          {data.identityVerificationIssues.length})
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowVerificationDetails((v) => !v)}
                        className="text-[10.5px] font-bold text-[#042c51] hover:underline cursor-pointer"
                      >
                        {showVerificationDetails ? "Hide Details" : "Inspect"}
                      </button>
                    </div>
                    {showVerificationDetails && (
                      <div className="space-y-1">
                        {data.identityVerificationIssues.map((issue) => (
                          <div
                            key={issue.sibsId}
                            className="text-[11px] text-slate-700 bg-amber-50/70 rounded px-2.5 py-1.5 border border-amber-200"
                          >
                            <div className="flex flex-wrap items-center gap-2 font-bold text-slate-800">
                              <span>
                                {issue.employeeName} (SIBS ID: {issue.sibsId})
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 text-[9.5px]">
                                {issue.availabilityStatus || issue.issueCode || "ROSTER_VERIFICATION_REQUIRED"}
                              </span>
                              <span className="text-[10px] font-normal text-slate-500">
                                {issue.siteName || "Site"} ({issue.isWfh ? "WFH" : "WFO"}) • Attendance:{" "}
                                {issue.attendanceDaysCount ?? 0}d / Sched: {issue.scheduledWorkdays ?? 0}d
                                {issue.trackerHaltedSince ? ` • Last Punch: ${issue.trackerHaltedSince}` : ""} • SF
                                Calls: {issue.callsCount ?? 0} • SF Cases: {issue.casesCount ?? 0}
                              </span>
                            </div>
                            <p className="mt-0.5 text-slate-600">{issue.reason}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {data.aliasIdMismatches.length > 0 && (
                  <p className="text-[11px]">
                    <strong>Kronos Code vs ID Mismatch (Excluded, Source Untouched):</strong>{" "}
                    {data.aliasIdMismatches
                      .map(
                        (m) =>
                          `${m.employeeName} (alias sibs_id=${m.aliasSibsId} != Kronos gy_emp_code=${m.expectedKronosEmpCode || m.kronosEmpCode || "N/A"})`
                      )
                      .join("; ")}
                  </p>
                )}

                {data.actorReconciliation?.hasKronosDirectoryLookup ? (
                  <>
                    <p className="text-[11px]">
                      <strong>Unmapped Potential SiBS Employees in Salesforce:</strong>{" "}
                      Calls: {data.actorReconciliation.calls?.potentialUnmappedSibsCount || 0} | Cases:{" "}
                      {data.actorReconciliation.casesClosedModifiedBy?.potentialUnmappedSibsCount || 0}
                    </p>
                    {data.actorReconciliation.calls?.topNonSibsExternalActors?.length > 0 && (
                      <p className="text-[11px]">
                        <strong>
                          Verified Non-SiBS / Client Actors (Retained in Global Totals, Excluded from
                          Individual Scorecards):
                        </strong>{" "}
                        {data.actorReconciliation.calls.topNonSibsExternalActors
                          .slice(0, 5)
                          .map((u) => `${u.name || u.rawOwner || "Unknown"} (${u.count})`)
                          .join(", ")}
                      </p>
                    )}
                  </>
                ) : (
                  data.unmappedTopCallOwners.length > 0 && (
                    <p className="text-[11px]">
                      <strong>Unmapped Call Owners (Top):</strong>{" "}
                      {data.unmappedTopCallOwners
                        .slice(0, 5)
                        .map((u) => `${u.name || u.rawOwner || "Unknown"} (${u.count})`)
                        .join(", ")}
                    </p>
                  )
                )}
              </div>
            )}

            {data.selectedEmployeeExcludedForVerification && data.selectedUnverifiedEmployee && (
              <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-blue-950 flex items-start gap-2.5">
                <UserCheck size={16} className="text-blue-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">
                    {data.selectedUnverifiedEmployee.employeeName} ({data.selectedUnverifiedEmployee.sibsId}) —
                    Roster Verification Required
                  </p>
                  <p className="mt-0.5 text-[11px] text-blue-900">
                    {data.selectedUnverifiedEmployee.reason} No Individual KPI Scorecard or PIP flag is generated
                    while membership confirmation is pending.
                  </p>
                </div>
              </div>
            )}

        {/* Active FrontSteps Employee KPI Scorecards Table */}
        <FrontStepsAiReportCard
          title="Active FrontSteps Employee KPI Scorecards"
          data-legacy-title="Verified Active FrontSteps Agent Scorecards"
          subtitle="Performance scorecards for verified active SiBS employees assigned to FrontSteps (Account 64)"
          icon={Users}
        >
          {/* Active Status Badge & Search Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Verified Active SiBS Employees ({canonicalEmployees.length})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name or SIBS ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#042c51] focus:border-[#042c51]"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
              <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap hidden sm:inline">
                Showing {totalMatchingEmployees} of {canonicalEmployees.length} active employees
              </span>
            </div>
          </div>

          {filteredAndSorted && filteredAndSorted.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10.5px] font-black uppercase text-slate-500">
                      <th className="py-2.5 px-3">SIBS ID</th>
                      <th className="py-2.5 px-3">Employee</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">FrontSteps Assignment Period</th>
                      <th className="py-2.5 px-3">Calls (Ans/Off)</th>
                      <th className="py-2.5 px-3">AHT (10%)</th>
                      <th className="py-2.5 px-3">AHT Comp (15%)</th>
                      <th className="py-2.5 px-3">Attributed Closed Cases</th>
                      <th className="py-2.5 px-3">Cases Closed (45%)</th>
                      <th className="py-2.5 px-3">CRM Res (10%)</th>
                      <th className="py-2.5 px-3">Sub Codes (10%)</th>
                      <th className="py-2.5 px-3">Summary (10%)</th>
                      <th className="py-2.5 px-3">Final KPI Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedEmployees.map((emp) => {
                      const isInspected = String(inspectedEmployee?.sibsId) === String(emp.sibsId);
                      return (
                        <tr
                          key={emp.sibsId}
                          onClick={() => setInspectedSibsId(emp.sibsId)}
                          className={`cursor-pointer transition-colors ${
                            isInspected ? "bg-blue-50/60" : "hover:bg-slate-50/60"
                          }`}
                        >
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{emp.sibsId}</td>
                          <td className="py-2.5 px-3">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-semibold text-slate-900">{emp.employeeName}</span>
                              {emp.availabilityStatus === "ACTIVE_MISSING_SOURCE_ALIAS" && (
                                <span
                                  title="Verified active in Kronos FrontSteps, but missing Salesforce alias and source records; displaying No Data Available without fabrication"
                                  className="px-1.5 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200 text-[9.5px] font-bold"
                                >
                                  Active FS — Missing Source Alias
                                </span>
                              )}
                              {emp.hasStalledTracker && (
                                <span
                                  title={emp.identityStatusNotes?.[0] || "Tracker stopped mid-period"}
                                  className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-300 text-[9.5px] font-bold"
                                >
                                  Tracker Halted ({emp.trackerHaltedSince})
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              {emp.siteName || "Site"} ({emp.isWfh ? "WFH" : "WFO"}) • Task Order:{" "}
                              {emp.taskOrder || "N/A (FrontSteps Resident Support)"}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              Att: {emp.attendanceDaysCount ?? "—"}d • Sched: {emp.scheduledWorkdays ?? "—"}d • Leave:{" "}
                              {emp.approvedLeaveDays || 0}d
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            {renderEmploymentStatusBadge(emp.employmentStatus)}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-semibold text-slate-800 block text-xs">
                              {emp.assignmentPeriod || "N/A"}
                            </span>
                            {(emp.hireDate || emp.lastWorkingDay) && (
                              <span className="text-[10px] text-slate-400 block">
                                {emp.hireDate ? `Hire: ${emp.hireDate}` : ""}{emp.lastWorkingDay ? ` • LWD: ${emp.lastWorkingDay}` : ""}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-700">
                            {emp.calls && (Number(emp.calls.offered) > 0 || Number(emp.calls.answered) > 0)
                              ? `${emp.calls.answered ?? 0} / ${emp.calls.offered ?? 0}`
                              : "No Data Available"}
                          </td>
                          <td className="py-2.5 px-3">{renderScoreCell(emp.kpis?.AHT, "AHT")}</td>
                          <td className="py-2.5 px-3">{renderScoreCell(emp.kpis?.AHT_COMPLIANCE, "AHT_COMPLIANCE")}</td>
                          <td className="py-2.5 px-3">
                            {emp.cases && (Number(emp.cases.attributedClosedCasesModifiedBy) > 0 || emp.isOnAccountInPeriod) ? (
                              <>
                                <span className="font-bold text-slate-800 block">
                                  {emp.cases.attributedClosedCasesModifiedBy ?? 0}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  Owner ref: {emp.cases.informationalOwnedClosedCases ?? 0}
                                </span>
                              </>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-semibold">
                                No Data Available
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">{renderScoreCell(emp.kpis?.CASES_CLOSED, "CASES_CLOSED")}</td>
                          <td className="py-2.5 px-3">{renderScoreCell(emp.kpis?.CRM_RESOLUTION, "CRM_RESOLUTION")}</td>
                          <td className="py-2.5 px-3">
                            {renderScoreCell(emp.kpis?.CRM_SUB_CODE_COMPLETION, "CRM_SUB_CODE_COMPLETION")}
                          </td>
                          <td className="py-2.5 px-3">
                            {renderScoreCell(emp.kpis?.CRM_SUMMARY_COMPLETION, "CRM_SUMMARY_COMPLETION")}
                          </td>
                          <td className="py-2.5 px-3">
                            {emp.finalKpiScore?.status === "CALCULATED" ? (
                              <div>
                                <span className="font-black text-[#042c51] block">
                                  {Number(emp.finalKpiScore.score).toFixed(2)}%
                                </span>
                                <span className="text-[10px] text-emerald-700 font-semibold">
                                  {emp.finalKpiScore.pmpClassification}
                                </span>
                              </div>
                            ) : emp.finalKpiScore?.status === "NO_DATA" ? (
                              <span
                                title={emp.finalKpiScore?.blockingReason || "No Data Available"}
                                className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-semibold"
                              >
                                No Data Available
                              </span>
                            ) : (
                              <span
                                title={emp.finalKpiScore?.blockingReason || "Final KPI Score blocked: incomplete components (CASES_CLOSED)."}
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200"
                              >
                                <ShieldAlert size={11} />
                                <span>BLOCKED</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Exact Design Replication of Employee Records Pagination Footer */}
              <FrontStepsAiTablePagination
                currentPage={safeCurrentPage}
                totalPages={totalPages}
                totalItems={totalMatchingEmployees}
                pageSize={PAGE_SIZE}
                onPageChange={setCurrentPage}
                itemLabel="employee records"
              />
            </>
          ) : (
            <>
              <FrontStepsAiEmptyState
                title="No Active FrontSteps Employees Match"
                message={`No active FrontSteps employees match ${searchTerm ? `query "${searchTerm}"` : "the selected filters"}.`}
                notice="Try clearing the search query or adjusting your filters."
              />
              <FrontStepsAiTablePagination
                currentPage={1}
                totalPages={1}
                totalItems={0}
                pageSize={PAGE_SIZE}
                onPageChange={setCurrentPage}
                itemLabel="employee records"
                disabled={true}
              />
            </>
          )}
        </FrontStepsAiReportCard>

        {/* Detailed Individual Agent Policy Rule & Target Breakdown */}
        {inspectedEmployee && (
          <FrontStepsAiReportCard
            title={`Policy Rule Breakdown: ${inspectedEmployee.employeeName} (${inspectedEmployee.sibsId})`}
            subtitle={`${inspectedEmployee.siteName || "Site"} (${inspectedEmployee.isWfh ? "WFH" : "WFO"}) • Status: ${inspectedEmployee.statusBadgeLabel || inspectedEmployee.employmentStatus || inspectedEmployee.availabilityStatus || "Active"} • Assignment: ${inspectedEmployee.assignmentPeriod || "N/A"} • Task Order: ${inspectedEmployee.taskOrder || "N/A (FrontSteps Resident Support)"} • Hire Date: ${inspectedEmployee.hireDate || "N/A"}`}
            icon={ShieldCheck}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500">
                    <th className="py-2 px-3">KPI Component</th>
                    <th className="py-2 px-3">Policy Rule Ref</th>
                    <th className="py-2 px-3">Weight %</th>
                    <th className="py-2 px-3">Policy Target</th>
                    <th className="py-2 px-3">Actual</th>
                    <th className="py-2 px-3">Earned Points</th>
                    <th className="py-2 px-3">Required Source &amp; Mapping</th>
                    <th className="py-2 px-3">Status &amp; Missing Evidence / Gate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(KPI_POLICY_RULE_MAP).map(([code, meta]) => {
                    const kpi = inspectedEmployee.kpis?.[code] || {};
                    const readiness = kpi.readiness || inspectedEmployee.metricReadiness?.[code] || null;
                    const status = kpi.status || "NO_DATA";
                    const evidenceSummary =
                      readiness?.missingEvidence?.length > 0
                        ? readiness.missingEvidence.join("; ")
                        : kpi.blockingReason;
                    return (
                      <tr key={code}>
                        <td className="py-2 px-3 font-bold text-slate-800">{meta.label}</td>
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-500">
                          {kpi.ruleCode || meta.ruleCode}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-700">
                          {kpi.weightPercent ?? "—"}%
                        </td>
                        <td className="py-2 px-3 text-slate-600">
                          {kpi.targetValue !== null && kpi.targetValue !== undefined
                            ? kpi.targetValue
                            : meta.targetHint}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-800">
                          {status === "BLOCKED" ? "BLOCKED" : formatKpiRaw(kpi, code)}
                        </td>
                        <td className="py-2 px-3 font-black text-[#042c51]">
                          {kpi.weightedScore !== null && kpi.weightedScore !== undefined
                            ? `${Number(kpi.weightedScore).toFixed(2)} pts`
                            : "No Data Available"}
                        </td>
                        <td className="py-2 px-3 text-[10.5px] text-slate-600 max-w-xs">
                          {readiness ? (
                            <div className="space-y-0.5">
                              <span className="block font-semibold text-slate-700">
                                {readiness.mappingStatusLabel}
                              </span>
                              <span className="block text-[10px] text-slate-500">
                                {readiness.requiredSource}
                              </span>
                              <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[9.5px] font-mono">
                                {readiness.availabilityStatus}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400">Stored Snapshot Metric</span>
                          )}
                        </td>
                        <td className="py-2 px-3 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <MetricStatusBadge status={status} />
                            {readiness?.calculationReadiness && (
                              <span className="text-[9.5px] font-bold uppercase text-slate-500">
                                ({readiness.calculationReadiness})
                              </span>
                            )}
                          </div>
                          {evidenceSummary && (
                            <span className="block text-[10.5px] text-slate-500">{evidenceSummary}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </FrontStepsAiReportCard>
        )}

        {/* Note: Excluded Historical / Separated / Non-Agent & Mismatched Entries are now unified into the main FrontSteps Employee KPI Scorecards directory above */}
          </>
        )}
      </div>
    </FrontStepsAiLayout>
  );
}
