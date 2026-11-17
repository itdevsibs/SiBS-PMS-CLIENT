/**
 * FrontSteps AI Policy Rules Viewer Modal
 * 
 * Inspects Hermes-extracted structured candidate rules, formulas, weights,
 * conditions, and page citations for a specific policy version.
 * 
 * Strict Security & Integrity: Displays candidate rules as unactivated proposals.
 * Provides direct links to the authentic PDF page viewer.
 */

import React, { useState } from "react";
import {
  X,
  FileText,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Layers,
  Sparkles,
  RefreshCw,
  Scale,
  ShieldCheck,
  Calculator,
  Target,
  Clock,
  ExternalLink,
  ChevronRight,
  Filter,
  AlertCircle,
  HelpCircle,
  Percent,
  DollarSign,
  Flag,
} from "lucide-react";
import { useFrontStepsAiPolicyRules } from "../hooks/useFrontStepsAiData";

const RULE_TYPE_CATEGORIES = [
  { id: "all", label: "All Rules" },
  { id: "kpi", label: "KPIs & Formulas", types: ["KPI_METRIC", "KPI_FORMULA", "PERFORMANCE_TARGET"] },
  { id: "weights", label: "Weights (100 pts)", types: ["KPI_WEIGHT"] },
  { id: "eligibility", label: "Eligibility & Exclusions", types: ["ELIGIBILITY", "EXCLUSION", "ATTENDANCE_CONDITION", "NEW_HIRE_EXCEPTION"] },
  { id: "incentives", label: "Incentive Caps & Tiers", types: ["INCENTIVE_THRESHOLD", "INCENTIVE_CAP"] },
  { id: "pmp_pip", label: "PMP / PIP & Governance", types: ["PMP_PIP_CONDITION", "CLASSIFICATION", "QA_POLICY"] },
  { id: "issues", label: "Issues & Notes", types: [] },
];

export default function FrontStepsAiPolicyRulesViewerModal({
  versionId,
  documentCode,
  policyTitle,
  revisionNumber = "000",
  onOpenPdfPreview,
  onReinterpret,
  isInterpreting = false,
  onClose,
}) {
  const [activeTab, setActiveTab] = useState("all");
  const { rules, interpretation, loading, error, reload } = useFrontStepsAiPolicyRules(versionId);

  const run = interpretation?.run || {};
  const issues = interpretation?.issues || [];
  const metadata = run.raw_response_json?.document_summary
    ? run.raw_response_json
    : {};

  // Filter rules based on active tab
  const filteredRules = rules.filter((r) => {
    if (activeTab === "all") return true;
    if (activeTab === "issues") return false;
    const cat = RULE_TYPE_CATEGORIES.find((c) => c.id === activeTab);
    return cat?.types?.includes(r.rule_type);
  });

  const getRuleTypeBadge = (type) => {
    switch (type) {
      case "KPI_FORMULA":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Formula</span>;
      case "KPI_WEIGHT":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">Weight</span>;
      case "PERFORMANCE_TARGET":
      case "KPI_METRIC":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">Target</span>;
      case "ELIGIBILITY":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Eligibility</span>;
      case "EXCLUSION":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Disqualification</span>;
      case "INCENTIVE_THRESHOLD":
      case "INCENTIVE_CAP":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Incentive Cap</span>;
      case "PMP_PIP_CONDITION":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">PMP / PIP</span>;
      case "QA_POLICY":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">QA Status</span>;
      case "ATTENDANCE_CONDITION":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">Attendance</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">{type}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="flex flex-col w-full max-w-5xl h-[90vh] rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-linear-to-r from-slate-50 via-white to-blue-50/40">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#042c51] text-white shrink-0 shadow-2xs">
              <Cpu size={20} className="text-[#ff5c28]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-black text-[#042c51] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {documentCode}
                </span>
                <span className="text-[11px] font-bold text-slate-500">
                  v{revisionNumber}
                </span>
                {run.status === "COMPLETED" ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 size={11} />
                    INTERPRETED (CANDIDATE)
                  </span>
                ) : run.status === "NEEDS_REVIEW" ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">
                    <AlertTriangle size={11} />
                    NEEDS REVIEW
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">
                    <RefreshCw size={11} className="animate-spin" />
                    {run.status || "PROCESSING"}
                  </span>
                )}
              </div>
              <h3 className="text-sm font-black text-slate-900 truncate mt-0.5">
                {policyTitle}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenPdfPreview && (
              <button
                type="button"
                onClick={onOpenPdfPreview}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                title="View original PDF document"
              >
                <Eye size={13} className="text-[#ff5c28]" />
                <span className="hidden sm:inline">Preview PDF</span>
              </button>
            )}

            {onReinterpret && (
              <button
                type="button"
                onClick={onReinterpret}
                disabled={isInterpreting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#042c51] text-white text-xs font-bold hover:bg-[#063c6d] disabled:opacity-50 transition-colors cursor-pointer shadow-2xs"
                title="Re-run Hermes interpretation"
              >
                <RefreshCw size={13} className={isInterpreting ? "animate-spin text-[#ff5c28]" : "text-[#ff5c28]"} />
                <span className="hidden sm:inline">{isInterpreting ? "Interpreting..." : "Re-interpret"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Policy Governance & Status Summary Sub-header */}
        <div className="px-5 py-2.5 bg-slate-50/75 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-slate-600">
              Hermes Model: <strong className="font-mono text-slate-800">{run.hermes_model || "sibs-pms-analyst"}</strong>
            </span>
            <span>•</span>
            <span className="text-slate-600">
              Total Candidates: <strong className="text-emerald-700">{rules.length}</strong>
            </span>
            <span>•</span>
            <span className="text-slate-600">
              Issues / Uncertainties: <strong className={issues.length > 0 ? "text-amber-600" : "text-slate-700"}>{issues.length}</strong>
            </span>
            {run.duration_ms && (
              <>
                <span>•</span>
                <span className="text-slate-500 text-[11px]">
                  Duration: {(run.duration_ms / 1000).toFixed(1)}s
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200/80 text-slate-700">
              <ShieldCheck size={11} className="text-blue-600" />
              Candidate Rules (Unactivated)
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-slate-200 bg-white overflow-x-auto">
          {RULE_TYPE_CATEGORIES.map((tab) => {
            const count =
              tab.id === "all"
                ? rules.length
                : tab.id === "issues"
                ? issues.length
                : rules.filter((r) => tab.types.includes(r.rule_type)).length;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-[#ff5c28] text-[#042c51]"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    activeTab === tab.id
                      ? "bg-[#042c51] text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-2 text-slate-400">
              <RefreshCw size={24} className="animate-spin text-[#ff5c28]" />
              <p className="text-xs font-semibold">Loading Hermes rule interpretation...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-800 text-xs">
              <div className="flex items-center gap-2 font-bold mb-1">
                <AlertCircle size={16} />
                <span>Failed to load rules</span>
              </div>
              <p>{error}</p>
            </div>
          ) : activeTab === "issues" ? (
            /* Issues Tab */
            <div className="space-y-3">
              {issues.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
                  <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2" />
                  <p className="text-xs font-bold text-slate-700">No Ambiguities or Issues Reported</p>
                  <p className="text-[11px] text-slate-500 mt-1">Hermes did not identify any conflicting or unresolved statements in this policy.</p>
                </div>
              ) : (
                issues.map((iss, idx) => (
                  <div
                    key={iss.id || idx}
                    className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/60 shadow-2xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800">
                        <AlertTriangle size={11} />
                        {iss.issue_type || "POLICY_UNCERTAINTY"}
                      </span>
                      {iss.source_reference && (
                        <span className="text-[10px] font-mono text-slate-500">
                          {iss.source_reference}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-slate-800">
                      {iss.issue_details}
                    </p>
                  </div>
                ))
              )}
            </div>
          ) : filteredRules.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
              <Layers size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-bold text-slate-700">No Rules Found In This Category</p>
              <p className="text-[11px] text-slate-500 mt-1">Select another tab to inspect different rule types.</p>
            </div>
          ) : (
            /* Rule Cards List */
            <div className="grid grid-cols-1 gap-3.5">
              {filteredRules.map((rule) => {
                const candidate = rule.candidate_json || {};
                const formula = candidate.formula;
                const conditions = candidate.conditions || [];

                return (
                  <div
                    key={rule.id || rule.rule_key}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs hover:shadow-xs transition-shadow space-y-3"
                  >
                    {/* Rule Top Row */}
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getRuleTypeBadge(rule.rule_type)}
                        <span className="font-mono text-xs font-black text-slate-800">
                          {rule.rule_key}
                        </span>
                        {rule.metric_code && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                            Metric: {rule.metric_code}
                          </span>
                        )}
                      </div>

                      {/* Source Citation Pill */}
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-[#042c51] bg-blue-50/80 px-2.5 py-0.5 rounded border border-blue-200">
                          <FileText size={11} className="text-[#ff5c28]" />
                          {rule.citation || `Page ${rule.page_start || 1}`}
                        </span>
                        {rule.validation_status === "VALID" ? (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 size={10} />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            <AlertTriangle size={10} />
                            Flagged
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Rule Description */}
                    <p className="text-xs text-slate-700 font-medium leading-relaxed">
                      {rule.description}
                    </p>

                    {/* Numerical Value / Threshold */}
                    {(rule.value !== null && rule.value !== undefined) && (
                      <div className="flex items-center gap-2 text-xs bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <Scale size={13} className="text-blue-600 shrink-0" />
                        <span className="text-slate-500 font-medium">Target / Value:</span>
                        <strong className="text-slate-800 font-mono">
                          {rule.value} {rule.unit || ""}
                        </strong>
                      </div>
                    )}

                    {/* Formula Box (if applicable) */}
                    {formula && formula.operation !== "NONE" && (
                      <div className="rounded-lg border border-blue-100 bg-blue-50/40 p-2.5 space-y-1">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-900">
                          <Calculator size={13} className="text-[#ff5c28]" />
                          <span>Formula Structure: {formula.operation}</span>
                        </div>
                        {formula.description && (
                          <p className="text-xs font-mono text-blue-950 bg-white/80 p-1.5 rounded border border-blue-100">
                            {formula.description}
                          </p>
                        )}
                        {formula.operands && formula.operands.length > 0 && (
                          <div className="flex items-center gap-1 text-[10px] text-blue-800 flex-wrap mt-1">
                            <span className="font-semibold">Operands:</span>
                            {formula.operands.map((op, i) => (
                              <span key={i} className="px-1.5 py-0.2 rounded bg-white font-mono border border-blue-200">
                                {op}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Conditions */}
                    {conditions.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Applicable Conditions:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {conditions.map((c, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-slate-100 text-slate-800 border border-slate-200"
                            >
                              <strong>{c.field}</strong> {c.operator} <span>{String(c.value)}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Exact Excerpt */}
                    {rule.exact_excerpt && (
                      <div className="rounded-lg bg-slate-50 border-l-4 border-[#042c51] p-2 text-[11px] text-slate-600 italic">
                        <span className="not-italic font-bold text-[#042c51] mr-1">"</span>
                        {rule.exact_excerpt}
                        <span className="not-italic font-bold text-[#042c51] ml-1">"</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 bg-white">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>Rules are verifiable proposals. Activation occurs in Phase 3B/4.</span>
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
