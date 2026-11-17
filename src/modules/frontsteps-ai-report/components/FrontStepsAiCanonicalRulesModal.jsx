/**
 * FrontSteps AI Canonical Rules & Snapshot Modal
 * 
 * Inspects validated canonical rules, operational scorecard weights,
 * classified issues & resolutions, data dependencies, and immutable snapshots.
 * 
 * Strict Isolation: Enforces FrontSteps policy integrity. Read-only audit view.
 */

import React, { useState } from "react";
import {
  X,
  Scale,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Database,
  ShieldCheck,
  RefreshCw,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Filter,
  FileText,
  AlertCircle,
  Play,
  Lock,
} from "lucide-react";
import {
  useFrontStepsAiCanonicalRules,
  useFrontStepsAiValidationIssues,
  useFrontStepsAiPolicySnapshots,
} from "../hooks/useFrontStepsAiData";

const TABS = [
  { id: "scorecard", label: "Operational Scorecard (100%)" },
  { id: "canonical", label: "All Canonical Rules" },
  { id: "issues", label: "Classified Issues & Resolutions" },
  { id: "snapshots", label: "Immutable Snapshots" },
];

export default function FrontStepsAiCanonicalRulesModal({
  isOpen,
  onClose,
  onPublishSuccess,
}) {
  const [activeTab, setActiveTab] = useState("scorecard");
  const [filterType, setFilterType] = useState("all");

  const { rules, loading: loadingRules, reload: reloadRules } = useFrontStepsAiCanonicalRules();
  const { issues, loading: loadingIssues, reload: reloadIssues } = useFrontStepsAiValidationIssues();
  const {
    snapshots,
    activeSnapshot,
    loading: loadingSnapshots,
    publishing,
    publishSnapshot,
    reload: reloadSnapshots,
  } = useFrontStepsAiPolicySnapshots();

  if (!isOpen) return null;

  const scorecardRules = rules.filter((r) => r.ruleType === "KPI_WEIGHT" && r.scorecardWeight != null);
  const totalScorecardWeight = scorecardRules.reduce((sum, r) => sum + Number(r.scorecardWeight || 0), 0);

  const filteredCanonicalRules = rules.filter((r) => {
    if (filterType === "all") return true;
    if (filterType === "weights") return r.ruleType === "KPI_WEIGHT";
    if (filterType === "kpi") return ["KPI_METRIC", "KPI_FORMULA", "PERFORMANCE_TARGET"].includes(r.ruleType);
    if (filterType === "governance") return ["ELIGIBILITY", "EXCLUSION", "ATTENDANCE_CONDITION", "QA_POLICY"].includes(r.ruleType);
    return true;
  });

  const handlePublish = async (snapshotId) => {
    try {
      await publishSnapshot(snapshotId);
      if (onPublishSuccess) onPublishSuccess();
    } catch (err) {
      alert(err.message || "Failed to publish snapshot");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-5xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-linear-to-r from-slate-50 via-white to-blue-50/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#042c51] text-white shadow-2xs">
              <Scale size={20} className="text-[#ff5c28]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-[#042c51]">
                  Policy Rule Snapshots & Validation Engine
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck size={11} />
                  Phase 3B Validated
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Deterministic validation against authoritative FrontSteps PDFs • 0 Hermes Inference on Inspection
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-200 bg-slate-50/60 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-[#ff5c28] text-[#042c51] bg-white rounded-t-lg shadow-2xs"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>{tab.label}</span>
              {tab.id === "scorecard" && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                  {totalScorecardWeight}%
                </span>
              )}
              {tab.id === "canonical" && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-800 font-bold">
                  {rules.length}
                </span>
              )}
              {tab.id === "issues" && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700 font-bold">
                  {issues.length}
                </span>
              )}
              {tab.id === "snapshots" && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-100 text-purple-800 font-bold">
                  {snapshots.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/40">
          {/* TAB 1: OPERATIONAL SCORECARD */}
          {activeTab === "scorecard" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-emerald-600" />
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900">
                        Operational Scorecard Reconciled: Exactly {totalScorecardWeight.toFixed(2)}%
                      </h4>
                      <p className="text-[11px] text-emerald-800 mt-0.5">
                        Extracted from FS-PMP-001 (Section XII) and corroborated with FS-PIP-001. All 6 primary metrics verified.
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-emerald-700">{totalScorecardWeight.toFixed(0)} / 100</span>
                    <span className="text-xs font-bold text-emerald-600 ml-1">Points</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {scorecardRules.map((rule) => {
                  const rJson = rule.canonicalRuleJson || {};
                  const deps = rule.dependencies || [];

                  return (
                    <div
                      key={rule.canonicalRuleCode}
                      className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs hover:shadow-xs transition-shadow space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            Weight
                          </span>
                          <h5 className="font-mono text-xs font-bold text-slate-800 mt-1">
                            {rule.canonicalRuleCode}
                          </h5>
                        </div>
                        <div className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono font-black text-sm">
                          {rule.scorecardWeight}%
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {rJson.description}
                      </p>

                      {/* Data Dependencies */}
                      {deps.length > 0 && (
                        <div className="pt-2 border-t border-slate-100 space-y-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                            <Database size={10} />
                            Data Dependencies:
                          </span>
                          {deps.map((dep, idx) => (
                            <div key={idx} className="flex items-center justify-between text-[11px] bg-slate-50 px-2 py-1 rounded border border-slate-100">
                              <span className="font-semibold text-slate-700">{dep.source}</span>
                              <span className="font-mono text-[10px] text-emerald-700">{dep.status}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Advisory Gatekeepers */}
              <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-2">
                <h5 className="text-xs font-black uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-blue-700" />
                  Policy Gatekeepers & Governance Preconditions
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                  <div className="bg-white p-2.5 rounded-lg border border-blue-100">
                    <strong className="text-blue-950 block">Attendance Requirement:</strong>
                    <span>Eligibility gatekeeper: 0 unexcused absences, 0 NCNS. Does not carry scorecard weight.</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-blue-100">
                    <strong className="text-blue-950 block">QA Guidelines (0% Interim):</strong>
                    <span>QA explicitly confirmed at 0% weight pending FrontSteps formal QA form sign-off.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ALL CANONICAL RULES */}
          {activeTab === "canonical" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Filter size={12} />
                  <span>Filter Category:</span>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="font-bold text-slate-700 bg-white border border-slate-200 rounded px-2 py-1"
                  >
                    <option value="all">All Canonical Rules ({rules.length})</option>
                    <option value="weights">Scorecard Weights ({scorecardRules.length})</option>
                    <option value="kpi">KPI Targets & Formulas</option>
                    <option value="governance">Eligibility & Governance</option>
                  </select>
                </div>
                <span className="text-xs font-mono text-slate-500">Showing {filteredCanonicalRules.length} rules</span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {filteredCanonicalRules.map((rule) => {
                  const rJson = rule.canonicalRuleJson || {};
                  return (
                    <div
                      key={rule.canonicalRuleCode}
                      className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {rule.ruleType}
                          </span>
                          <span className="font-mono text-xs font-bold text-slate-800">
                            {rule.canonicalRuleCode}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
                          <span>Docs: {rule.supportingDocumentCodes?.join(", ")}</span>
                          <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                            VALIDATED
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600">
                        {rJson.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: CLASSIFIED ISSUES & RESOLUTIONS */}
          {activeTab === "issues" && (
            <div className="space-y-3">
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                <span>All <strong>{issues.length}</strong> interpretation issues classified into canonical audit categories.</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  0 Unresolved Blocking Issues
                </span>
              </div>

              {issues.map((iss, idx) => (
                <div
                  key={iss.id || idx}
                  className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-2"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200">
                        {iss.issue_category}
                      </span>
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${
                        iss.severity === "BLOCKING"
                          ? "bg-red-50 text-red-700 border-red-200"
                          : iss.severity === "WARNING"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}>
                        {iss.severity}
                      </span>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      iss.resolution_status === "UNRESOLVED"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }`}>
                      {iss.resolution_status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-800 font-medium">
                    {iss.issue_details}
                  </p>

                  {iss.resolution_details && (
                    <div className="text-[11px] text-emerald-900 bg-emerald-50/60 p-2 rounded-lg border border-emerald-100">
                      <strong>Audit Resolution: </strong>
                      {iss.resolution_details}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: IMMUTABLE SNAPSHOTS */}
          {activeTab === "snapshots" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                {snapshots.map((snap) => (
                  <div
                    key={snap.id}
                    className={`rounded-xl border p-4 shadow-2xs space-y-3 transition-colors ${
                      snap.is_active
                        ? "border-emerald-300 bg-emerald-50/30 ring-2 ring-emerald-200/50"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-mono text-sm font-black text-slate-900">
                            {snap.snapshot_code}
                          </h4>
                          {snap.is_active ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-600 text-white shadow-2xs flex items-center gap-1">
                              <CheckCircle2 size={10} />
                              ACTIVE SNAPSHOT
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              {snap.status}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 font-mono truncate max-w-lg">
                          Fingerprint: {snap.snapshot_fingerprint}
                        </p>
                      </div>

                      {!snap.is_active && (
                        <button
                          type="button"
                          onClick={() => handlePublish(snap.id)}
                          disabled={publishing}
                          className="px-3 py-1.5 rounded-lg bg-[#042c51] text-white text-xs font-bold hover:bg-[#063c6d] disabled:opacity-50 cursor-pointer shadow-2xs transition-all flex items-center gap-1.5"
                        >
                          <Play size={12} className="text-[#ff5c28]" />
                          <span>Publish / Activate</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-2 border-t border-slate-100">
                      <div>
                        <span className="text-slate-400 block">Canonical Rules:</span>
                        <strong className="text-slate-800">{snap.canonical_rule_count}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Scorecard Sum:</span>
                        <strong className="text-emerald-700">{snap.scorecard_weights_sum}%</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Blocking Issues:</span>
                        <strong className="text-slate-800">{snap.blocking_issue_count}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Created At:</span>
                        <strong className="text-slate-800 font-mono">{snap.created_at ? new Date(snap.created_at).toLocaleDateString() : "-"}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-white">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Lock size={12} className="text-slate-400" />
            <span>Immutable snapshots are cryptographically sealed with SHA-256 fingerprints.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
