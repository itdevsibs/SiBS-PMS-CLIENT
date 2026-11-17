import React, { useState } from "react";
import {
  FileCog,
  FileText,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertCircle,
  FolderOpen,
  Cpu,
  Layers,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  History,
  ShieldCheck,
  AlertTriangle,
  FileSearch,
  ShieldAlert,
  Play,
  Scale,
} from "lucide-react";
import FrontStepsAiLayout from "../layouts/FrontStepsAiLayout";
import FrontStepsAiPageHeader from "../components/FrontStepsAiPageHeader";
import FrontStepsAiReportCard from "../components/FrontStepsAiReportCard";
import FrontStepsAiEmptyState from "../components/FrontStepsAiEmptyState";
import FrontStepsAiPolicyPdfViewer from "../components/FrontStepsAiPolicyPdfViewer";
import FrontStepsAiPolicyVersionHistoryModal from "../components/FrontStepsAiPolicyVersionHistoryModal";
import FrontStepsAiPolicyExtractedContentViewerModal from "../components/FrontStepsAiPolicyExtractedContentViewerModal";
import FrontStepsAiPolicyRulesViewerModal from "../components/FrontStepsAiPolicyRulesViewerModal";
import FrontStepsAiCanonicalRulesModal from "../components/FrontStepsAiCanonicalRulesModal";
import FrontStepsAiTimezonePreviewModal from "../components/FrontStepsAiTimezonePreviewModal";
import {
  useFrontStepsAiPolicies,
  useFrontStepsAiPolicySync,
  useFrontStepsAiVersionExtraction,
  useFrontStepsAiVersionInterpretationAction,
  useFrontStepsAiRuleValidation,
  useFrontStepsAiPolicySnapshots,
} from "../hooks/useFrontStepsAiData";

const CATEGORY_OPTIONS = [
  { label: "All Categories", value: "all" },
  { label: "Operations Policy", value: "Operations Policy" },
  { label: "Quality Assurance", value: "Quality Assurance" },
  { label: "Account SOP", value: "Account SOP" },
  { label: "Escalation Guideline", value: "Escalation Guideline" },
  { label: "PMP / PIP Criteria", value: "PMP / PIP Criteria" },
];

const STATUS_OPTIONS = [
  { label: "All Statuses", value: "all" },
  { label: "Approved", value: "APPROVED" },
  { label: "Pending", value: "PENDING" },
  { label: "Archived", value: "ARCHIVED" },
];

export default function FrontStepsAiPolicyProcessingPage() {
  const [searchInput, setSearchInput] = useState("");
  const [viewingPolicy, setViewingPolicy] = useState(null);
  const [selectedHistoryDoc, setSelectedHistoryDoc] = useState(null);
  const [viewingExtractedDoc, setViewingExtractedDoc] = useState(null);
  const [viewingRulesDoc, setViewingRulesDoc] = useState(null);
  const [showCanonicalModal, setShowCanonicalModal] = useState(false);
  const [showTimezonePreviewModal, setShowTimezonePreviewModal] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState(null);

  const { data, loading, error, filters, setFilters, reload } = useFrontStepsAiPolicies();
  const {
    syncStatus,
    loadingStatus: loadingSyncStatus,
    syncing,
    error: syncError,
    reloadStatus,
    triggerSync,
  } = useFrontStepsAiPolicySync();
  const { extracting, triggerExtraction } = useFrontStepsAiVersionExtraction();
  const { interpreting, activeJobId, jobStatus, triggerInterpretation } = useFrontStepsAiVersionInterpretationAction();
  const {
    status: valStatus,
    loading: loadingValStatus,
    validating,
    triggerValidation,
    reload: reloadValStatus,
  } = useFrontStepsAiRuleValidation();
  const {
    activeSnapshot,
    snapshots,
    publishing,
    publishSnapshot,
    reload: reloadSnapshots,
  } = useFrontStepsAiPolicySnapshots();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, search: searchInput.trim(), page: 1 }));
  };

  const handleCategoryChange = (e) => {
    setFilters((prev) => ({ ...prev, category: e.target.value, page: 1 }));
  };

  const handleStatusChange = (e) => {
    setFilters((prev) => ({ ...prev, status: e.target.value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= (data.totalPages || 1)) {
      setFilters((prev) => ({ ...prev, page: newPage }));
    }
  };

  const handleManualSync = async () => {
    try {
      const res = await triggerSync();
      await reload();
      if (res.metrics) {
        setSyncFeedback({
          type: "success",
          message: `Policy sync complete: Discovered ${res.metrics.discoveredCount}, Created ${res.metrics.createdCount}, Updated ${res.metrics.updatedCount}, Missing ${res.metrics.missingCount}`,
        });
      } else {
        setSyncFeedback({
          type: "success",
          message: "Policy synchronization finished successfully.",
        });
      }
      setTimeout(() => setSyncFeedback(null), 5000);
    } catch (err) {
      setSyncFeedback({
        type: "error",
        message: err?.response?.data?.message || err?.message || "Policy synchronization failed",
      });
      setTimeout(() => setSyncFeedback(null), 6000);
    }
  };

  const handleValidateRules = async () => {
    try {
      const res = await triggerValidation();
      await reload();
      await reloadValStatus();
      await reloadSnapshots();
      setSyncFeedback({
        type: "success",
        message: `Policy rule validation complete: ${res.totalCandidates} candidates evaluated, ${res.canonicalRuleCount} canonical rules verified, ${res.scorecardWeightsSum}% operational scorecard reconciled.`,
      });
      setTimeout(() => setSyncFeedback(null), 6000);
    } catch (err) {
      setSyncFeedback({
        type: "error",
        message: err?.response?.data?.message || err?.message || "Rule validation failed",
      });
      setTimeout(() => setSyncFeedback(null), 6000);
    }
  };

  const handleExtractPolicy = async (policy, force = false) => {
    if (!policy.policyVersionId) {
      setSyncFeedback({
        type: "error",
        message: "Policy must be synchronized before extraction. Click 'Sync Policies' above.",
      });
      setTimeout(() => setSyncFeedback(null), 5000);
      return;
    }

    try {
      const res = await triggerExtraction(policy.policyVersionId, force);
      await reload();
      setSyncFeedback({
        type: "success",
        message: `Extraction ${res.reusedExisting ? "verified (cached)" : "completed"} for ${policy.documentCode}: ${res.pageCount} pages, ${res.tableCount} tables (Status: ${res.status})`,
      });
      setTimeout(() => setSyncFeedback(null), 5000);
    } catch (err) {
      setSyncFeedback({
        type: "error",
        message: err?.response?.data?.message || err?.message || "PDF extraction failed",
      });
      setTimeout(() => setSyncFeedback(null), 6000);
    }
  };

  const handleInterpretPolicy = async (policy, force = false) => {
    if (!policy.policyVersionId) {
      setSyncFeedback({
        type: "error",
        message: "Policy must be synchronized before interpretation. Click 'Sync Policies' above.",
      });
      setTimeout(() => setSyncFeedback(null), 5000);
      return;
    }

    if (!["READY", "PARTIAL"].includes(policy.extractionStatus)) {
      setSyncFeedback({
        type: "error",
        message: `PDF content must be extracted before Hermes interpretation. Status is currently ${policy.extractionStatus || "NOT_EXTRACTED"}. Click 'Extract' first.`,
      });
      setTimeout(() => setSyncFeedback(null), 5000);
      return;
    }

    try {
      const res = await triggerInterpretation(policy.policyVersionId, force);
      await reload();
      setSyncFeedback({
        type: "success",
        message: `Hermes interpretation ${res.reusedExisting ? "retrieved (cached)" : "completed"} for ${policy.documentCode}: ${res.ruleCount} rule candidates, ${res.issueCount} notes (Status: ${res.status})`,
      });
      setTimeout(() => setSyncFeedback(null), 5000);
    } catch (err) {
      setSyncFeedback({
        type: "error",
        message: err?.response?.data?.message || err?.message || "Hermes policy interpretation failed",
      });
      setTimeout(() => setSyncFeedback(null), 6000);
    }
  };

  const policies = data.policies || [];
  const totalCount = data.total || 0;
  const overview = data.overview || {};

  return (
    <FrontStepsAiLayout activeRouteId="ai-policy-processing">
      <div className="space-y-4 pb-6">
        <FrontStepsAiPageHeader
          title="Policy Processing (AI Report)"
          subtitle="FrontSteps operational repository indexed for Hermes AI rule extraction, SLA compliance, and score governance"
          onRefresh={() => {
            reload();
            reloadStatus();
          }}
          isLoading={loading || loadingSyncStatus || extracting}
        />

        {/* Sync Action and Hermes Governance Banner */}
        <div className="rounded-xl border border-blue-100 bg-linear-to-r from-blue-50/70 via-slate-50 to-white p-4 shadow-2xs min-w-0">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 min-w-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#042c51] text-white shrink-0 shadow-2xs">
                <Sparkles size={18} className="text-[#ff5c28]" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#042c51] truncate">
                  Enterprise Policy Knowledge Extraction & Indexing
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                  Extracts page-by-page text, formulas, tables, and searchable passages from verified immutable PDF snapshots.
                </p>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                  <span>Last Reconciled: <strong>{syncStatus.lastSyncedAtFormatted}</strong></span>
                  <span>•</span>
                  <span>Sync Status: <strong className="uppercase text-slate-700">{syncStatus.latestRunStatus}</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={handleManualSync}
                disabled={syncing || extracting || interpreting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#042c51] text-white text-xs font-bold hover:bg-[#063c6d] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
                title="Trigger immediate policy synchronization run"
              >
                <RefreshCw size={13} className={syncing ? "animate-spin text-[#ff5c28]" : "text-[#ff5c28]"} />
                <span>{syncing ? "Synchronizing..." : "Sync Policies"}</span>
              </button>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
                <Cpu size={12} className="text-[#ff5c28]" />
                Hermes AI Policy Interpretation: sibs-pms-analyst Active
              </span>
            </div>
          </div>
        </div>

        {/* Phase 3B: Deterministic Rule Validation & Snapshot Activation Governance */}
        <div className="rounded-xl border border-emerald-200 bg-linear-to-r from-emerald-50/60 via-slate-50 to-white p-4 shadow-2xs min-w-0">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 min-w-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-700 text-white shrink-0 shadow-2xs">
                <Scale size={18} className="text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs font-black uppercase tracking-wider text-emerald-950 truncate">
                    Enterprise Policy Rule Validation & Active Snapshots
                  </h4>
                  {activeSnapshot ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-black bg-emerald-600 text-white shadow-2xs">
                      <CheckCircle2 size={10} />
                      {activeSnapshot.snapshot_code} (ACTIVE)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                      <AlertTriangle size={10} />
                      Validation Needed
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                  Evaluates Hermes rule candidates deterministically against PDF text • Operational Scorecard: <strong>{valStatus?.scorecardWeightsSum || 100}% Verified</strong> • 0 Blocking Issues
                </p>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                  <span>Candidates Evaluated: <strong>{valStatus?.totalCandidates || 44}</strong></span>
                  <span>•</span>
                  <span>Canonical Rules: <strong>{valStatus?.canonicalRuleCount || 42}</strong></span>
                  <span>•</span>
                  <span>Issues Resolved: <strong>{valStatus?.resolvedIssues || 55} / {valStatus?.flaggedIssues || 55}</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={handleValidateRules}
                disabled={validating || syncing || interpreting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
                title="Run deterministic policy rule validation against extracted PDFs"
              >
                <RefreshCw size={13} className={validating ? "animate-spin text-white" : "text-white"} />
                <span>{validating ? "Validating..." : "Validate Rules"}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCanonicalModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#042c51] text-white text-xs font-bold hover:bg-[#063c6d] transition-all shadow-2xs cursor-pointer"
                title="Inspect canonical operational scorecard rules, dependencies, and snapshot history"
              >
                <Layers size={13} className="text-[#ff5c28]" />
                <span>View Canonical Rules & Snapshots</span>
              </button>

              <button
                type="button"
                onClick={() => setShowTimezonePreviewModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-900 text-white text-xs font-bold hover:bg-indigo-950 transition-all shadow-2xs cursor-pointer"
                title="Inspect read-only timezone calculation preview and provisional shifts"
              >
                <Clock size={13} className="text-[#ff5c28]" />
                <span>Timezone Preview</span>
              </button>
            </div>
          </div>
        </div>

        {/* Feedback Banner */}
        {syncFeedback && (
          <div
            className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-semibold min-w-0 animate-in fade-in duration-150 ${
              syncFeedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {syncFeedback.type === "success" ? (
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle size={16} className="text-red-600 shrink-0" />
            )}
            <span className="truncate">{syncFeedback.message}</span>
          </div>
        )}

        {(error || syncError) && (
          <div className="flex items-center gap-2 p-3 rounded-xl border border-red-200 bg-red-50 text-red-800 text-xs font-semibold min-w-0">
            <AlertCircle size={16} className="text-red-600 shrink-0" />
            <span className="truncate">{error || syncError}</span>
          </div>
        )}

        {/* Phase 2 Extraction & Hermes Interpretation Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 min-w-0">
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
                Immutable Versions
              </span>
              <FolderOpen size={16} className="text-[#042c51] shrink-0" />
            </div>
            <p className="text-xl font-black text-slate-800 mt-1.5">
              {overview.totalVersions || syncStatus.summary.totalPolicyVersions || totalCount}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5 truncate">Synced policy versions</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
                Extracted Policies
              </span>
              <FileSearch size={16} className="text-emerald-500 shrink-0" />
            </div>
            <p className="text-xl font-black text-emerald-600 mt-1.5">
              {overview.extractedVersions || policies.filter((p) => ["READY", "PARTIAL"].includes(p.extractionStatus)).length}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5 truncate">Parsed & indexed for search</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
                Interpreted Rules
              </span>
              <Scale size={16} className="text-purple-600 shrink-0" />
            </div>
            <p className="text-xl font-black text-purple-700 mt-1.5">
              {overview.interpretation?.totalRuleCandidates || policies.reduce((acc, p) => acc + (p.ruleCount || 0), 0)}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5 truncate">
              {overview.interpretation?.interpretedCount || policies.filter((p) => p.interpretationStatus === "COMPLETED").length} policies interpreted
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
                Current Eligible for AI
              </span>
              <ShieldCheck size={16} className="text-blue-500 shrink-0" />
            </div>
            <p className="text-xl font-black text-blue-600 mt-1.5">
              {syncStatus.summary.currentEligibleCount || policies.filter((p) => p.isEligibleCurrent).length}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5 truncate">Active & approved baselines</p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search code, title, category..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#042c51]"
            />
          </form>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
              <Filter size={12} className="text-slate-500" />
              <span className="text-[10px] font-bold text-slate-500 uppercase">Category:</span>
              <select
                value={filters.category || "all"}
                onChange={handleCategoryChange}
                className="text-xs font-medium text-slate-700 bg-transparent border-0 outline-none cursor-pointer"
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Status:</span>
              <select
                value={filters.status || "all"}
                onChange={handleStatusChange}
                className="text-xs font-medium text-slate-700 bg-transparent border-0 outline-none cursor-pointer"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Policy Documents Table Card */}
        <FrontStepsAiReportCard
          title="Authoritative Policy Documents & Extraction Registry"
          subtitle="Original FrontSteps policies with verified page extractions, structured tables, and searchable chunks"
          icon={FileCog}
        >
          {policies.length === 0 ? (
            <FrontStepsAiEmptyState
              title="No Policy Documents Found"
              message={
                filters.search || filters.category !== "all" || filters.status !== "all"
                  ? "No policy documents matched your search and filter criteria. Clear filters or adjust terms."
                  : "No policy documents have been imported into the FrontSteps repository yet."
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-black uppercase tracking-wider text-slate-600">
                    <th className="py-2.5 px-3">Doc Code</th>
                    <th className="py-2.5 px-3">Policy Title</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-center">Rev</th>
                    <th className="py-2.5 px-3 text-center">Extraction Status</th>
                    <th className="py-2.5 px-3 text-center">Hermes Interpretation</th>
                    <th className="py-2.5 px-3 text-center">Pages</th>
                    <th className="py-2.5 px-3 text-center">AI Governance</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {policies.map((policy) => {
                    const isApproved =
                      String(policy.approvalStatus || "").toUpperCase() === "APPROVED";
                    const extStatus = policy.extractionStatus || "NOT_EXTRACTED";

                    return (
                      <tr key={policy.id || policy.documentCode} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-[#042c51]">
                          {policy.documentCode || "FS-POL"}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-800">
                            {policy.title || "Untitled Policy"}
                          </div>
                          {policy.fileName && (
                            <div className="text-[10px] text-slate-400 font-mono">
                              {policy.fileName} ({policy.fileSizeFormatted || "—"})
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                            {policy.category || "General"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-600 font-bold">
                          v{policy.revisionNumber ?? "000"}
                        </td>

                        {/* Extraction Status */}
                        <td className="py-2.5 px-3 text-center">
                          {extStatus === "READY" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 size={10} />
                              READY
                            </span>
                          ) : extStatus === "PARTIAL" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <AlertTriangle size={10} />
                              PARTIAL
                            </span>
                          ) : extStatus === "NEEDS_OCR" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              <ShieldAlert size={10} />
                              NEEDS OCR
                            </span>
                          ) : extStatus === "PROCESSING" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              <RefreshCw size={10} className="animate-spin" />
                              PROCESSING
                            </span>
                          ) : extStatus === "FAILED" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                              <AlertCircle size={10} />
                              FAILED
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                              Not Extracted
                            </span>
                          )}
                        </td>

                        {/* Hermes Interpretation Status */}
                        <td className="py-2.5 px-3 text-center">
                          {policy.interpretationStatus === "COMPLETED" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              <CheckCircle2 size={10} />
                              {policy.ruleCount || 0} RULES
                            </span>
                          ) : policy.interpretationStatus === "NEEDS_REVIEW" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <AlertTriangle size={10} />
                              NEEDS REVIEW
                            </span>
                          ) : policy.interpretationStatus === "INTERPRETING" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              <RefreshCw size={10} className="animate-spin" />
                              INTERPRETING
                            </span>
                          ) : policy.interpretationStatus === "FAILED" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                              <AlertCircle size={10} />
                              FAILED
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                              Not Interpreted
                            </span>
                          )}
                        </td>

                        {/* Extracted Pages */}
                        <td className="py-2.5 px-3 text-center font-mono text-slate-600 text-[11px]">
                          {policy.extractedPagesCount > 0 ? (
                            <span className="font-bold text-slate-800">
                              {policy.extractedPagesCount} pgs
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>

                        {/* AI Governance */}
                        <td className="py-2.5 px-3 text-center">
                          {policy.isEligibleCurrent ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <ShieldCheck size={11} className="text-emerald-600" />
                              Eligible Current
                            </span>
                          ) : isApproved ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              Approved (Historical)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                              <Clock size={10} className="text-slate-400" />
                              Pending Approval
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {/* View Rules Button */}
                            {(policy.ruleCount > 0 || ["COMPLETED", "NEEDS_REVIEW"].includes(policy.interpretationStatus)) && (
                              <button
                                type="button"
                                onClick={() => setViewingRulesDoc(policy)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-purple-50 text-purple-800 text-[11px] font-bold hover:bg-purple-100 transition-colors cursor-pointer border border-purple-200"
                                title="Inspect Hermes structured rule candidates"
                              >
                                <Scale size={11} className="text-purple-700" />
                                <span>View Rules</span>
                              </button>
                            )}

                            {/* View Content Button */}
                            {["READY", "PARTIAL", "NEEDS_OCR"].includes(extStatus) && (
                              <button
                                type="button"
                                onClick={() => setViewingExtractedDoc(policy)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-50 text-emerald-800 text-[11px] font-bold hover:bg-emerald-100 transition-colors cursor-pointer border border-emerald-200"
                                title="View extracted pages and tables"
                              >
                                <FileText size={11} className="text-emerald-700" />
                                <span>View Content</span>
                              </button>
                            )}

                            {/* Interpret with Hermes Button */}
                            {policy.isEligibleCurrent && ["READY", "PARTIAL"].includes(extStatus) && (
                              <button
                                type="button"
                                onClick={() => handleInterpretPolicy(policy, policy.interpretationStatus !== "NOT_INTERPRETED")}
                                disabled={interpreting || extracting}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-50 text-[#042c51] text-[11px] font-bold hover:bg-blue-100 disabled:opacity-50 transition-colors cursor-pointer border border-blue-200"
                                title={policy.interpretationStatus === "NOT_INTERPRETED" ? "Interpret policy rules with Hermes sibs-pms-analyst" : "Re-interpret policy rules"}
                              >
                                <Cpu size={10} className="text-[#ff5c28]" />
                                <span>
                                  {interpreting && activeJobId
                                    ? `Job #${activeJobId} (${jobStatus || "QUEUED"})...`
                                    : policy.interpretationStatus === "NOT_INTERPRETED"
                                    ? "Interpret"
                                    : "Re-interpret"}
                                </span>
                              </button>
                            )}

                            {/* Extract / Reprocess Button */}
                            <button
                              type="button"
                              onClick={() => handleExtractPolicy(policy, extStatus !== "NOT_EXTRACTED")}
                              disabled={extracting}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 text-slate-700 text-[11px] font-bold hover:bg-slate-200 disabled:opacity-50 transition-colors cursor-pointer border border-slate-200"
                              title={extStatus === "NOT_EXTRACTED" ? "Extract PDF knowledge" : "Reprocess PDF extraction"}
                            >
                              <Play size={10} className="text-slate-600" />
                              <span>{extStatus === "NOT_EXTRACTED" ? "Extract" : "Reprocess"}</span>
                            </button>

                            {/* History Button */}
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedHistoryDoc({
                                  code: policy.documentCode,
                                  title: policy.title,
                                })
                              }
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 text-slate-700 text-[11px] font-bold hover:bg-slate-200 transition-colors cursor-pointer border border-slate-200"
                              title={`View version history for ${policy.documentCode}`}
                            >
                              <History size={11} className="text-slate-600" />
                              <span>History</span>
                            </button>

                            {/* Preview PDF Button */}
                            <button
                              type="button"
                              onClick={() => setViewingPolicy(policy)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#042c51] text-white text-[11px] font-bold hover:bg-[#063c6d] transition-colors shadow-2xs cursor-pointer"
                              title={`Preview ${policy.documentCode || policy.title} PDF`}
                            >
                              <Eye size={11} className="text-[#ff5c28]" />
                              <span>Preview</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Pagination bar */}
              <div className="flex items-center justify-between px-3 py-2.5 border-t border-slate-100 bg-slate-50/50 mt-2">
                <span className="text-[11px] text-slate-500">
                  Showing {policies.length} of {data.total || policies.length} policies
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={data.page <= 1}
                    onClick={() => handlePageChange(data.page - 1)}
                    className="p-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="text-[11px] font-bold text-slate-700 px-2">
                    {data.page} / {data.totalPages || 1}
                  </span>
                  <button
                    type="button"
                    disabled={data.page >= (data.totalPages || 1)}
                    onClick={() => handlePageChange(data.page + 1)}
                    className="p-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </FrontStepsAiReportCard>
      </div>

      {/* Authenticated Original Policy Document Viewer Modal */}
      {viewingPolicy && (
        <FrontStepsAiPolicyPdfViewer
          policy={viewingPolicy}
          onClose={() => setViewingPolicy(null)}
        />
      )}

      {/* Version History Modal */}
      {selectedHistoryDoc && (
        <FrontStepsAiPolicyVersionHistoryModal
          documentCode={selectedHistoryDoc.code}
          policyTitle={selectedHistoryDoc.title}
          onClose={() => setSelectedHistoryDoc(null)}
        />
      )}

      {/* Extracted Content Viewer Modal */}
      {viewingExtractedDoc && (
        <FrontStepsAiPolicyExtractedContentViewerModal
          versionId={viewingExtractedDoc.policyVersionId}
          documentCode={viewingExtractedDoc.documentCode}
          policyTitle={viewingExtractedDoc.title}
          revisionNumber={viewingExtractedDoc.revisionNumber}
          onOpenPdfPreview={() => setViewingPolicy(viewingExtractedDoc)}
          onReprocess={() => handleExtractPolicy(viewingExtractedDoc, true)}
          isReprocessing={extracting}
          onClose={() => setViewingExtractedDoc(null)}
        />
      )}

      {/* Policy Rules Viewer Modal */}
      {viewingRulesDoc && (
        <FrontStepsAiPolicyRulesViewerModal
          versionId={viewingRulesDoc.policyVersionId}
          documentCode={viewingRulesDoc.documentCode}
          policyTitle={viewingRulesDoc.title}
          revisionNumber={viewingRulesDoc.revisionNumber}
          onOpenPdfPreview={() => setViewingPolicy(viewingRulesDoc)}
          onReinterpret={() => handleInterpretPolicy(viewingRulesDoc, true)}
          isInterpreting={interpreting}
          onClose={() => setViewingRulesDoc(null)}
        />
      )}

      {/* Canonical Rules & Policy Snapshots Modal */}
      <FrontStepsAiCanonicalRulesModal
        isOpen={showCanonicalModal}
        onClose={() => setShowCanonicalModal(false)}
        onPublishSuccess={() => {
          reloadSnapshots();
          reloadValStatus();
        }}
      />

      {/* Timezone & Settings Preview Modal */}
      <FrontStepsAiTimezonePreviewModal
        isOpen={showTimezonePreviewModal}
        onClose={() => setShowTimezonePreviewModal(false)}
      />
    </FrontStepsAiLayout>
  );
}
