import React, { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const METRIC_STATUS_STYLES = {
  VERIFIED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  CALCULATED: "border-sky-200 bg-sky-50 text-sky-800",
  NO_DATA: "border-slate-200 bg-slate-100 text-slate-600",
  DATA_INCOMPLETE: "border-amber-200 bg-amber-50 text-amber-800",
  BLOCKED: "border-rose-200 bg-rose-50 text-rose-800",
  STALE: "border-orange-200 bg-orange-50 text-orange-800",
  NOT_CALCULATED: "border-slate-200 bg-slate-100 text-slate-600",
};

const METRIC_STATUS_LABELS = {
  VERIFIED: "VERIFIED",
  CALCULATED: "CALCULATED",
  NO_DATA: "NO DATA",
  DATA_INCOMPLETE: "DATA INCOMPLETE",
  BLOCKED: "BLOCKED",
  STALE: "STALE",
  NOT_CALCULATED: "NOT CALCULATED",
};

export function MetricStatusBadge({ status = "NO_DATA", className = "" }) {
  const normalized = String(status || "NO_DATA").toUpperCase();
  const tone = METRIC_STATUS_STYLES[normalized] || METRIC_STATUS_STYLES.NO_DATA;
  const label = METRIC_STATUS_LABELS[normalized] || normalized.replace(/_/g, " ");
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wide ${tone} ${className}`}
    >
      {label}
    </span>
  );
}

function formatTimestamp(ts) {
  if (!ts) return "Not yet calculated";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return String(ts);
  }
}

function formatPeriodWindow(period, windowObj) {
  const p = String(period || "monthly").toUpperCase();
  if (windowObj?.startDate && windowObj?.endDate) {
    return `${p} (${windowObj.startDate} to ${windowObj.endDate})`;
  }
  return p;
}

export default function FrontStepsAiGovernanceBanner({
  data = {},
  rebuilding = false,
  rebuildStatus = null,
  onRebuild,
}) {
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const snapshot = data.snapshot;
  const readiness = data.executionReadiness || {};
  const readinessState = readiness.state || (snapshot ? "VERIFIED" : "NOT_CALCULATED");
  const snapshotLifecycle = !snapshot
    ? "UNAVAILABLE"
    : snapshot.isStale
      ? "STALE"
      : "READY";
  const verificationStatus = data.verification?.status || (snapshot ? "VERIFIED" : "UNVERIFIED");
  const blockingReasons = Array.isArray(readiness.blockingReasons) ? readiness.blockingReasons : [];
  const incompletenessReasons = Array.isArray(readiness.incompletenessReasons)
    ? readiness.incompletenessReasons
    : [];
  const warnings = Array.isArray(readiness.warnings) ? readiness.warnings : [];
  const policySnapshotCode =
    data.policyContext?.snapshotCode ||
    data.sourceWatermark?.activePolicySnapshotCode ||
    "No Active Rule Snapshot";

  const readinessTone =
    readinessState === "EXECUTION_READY" || readinessState === "VERIFIED"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : readinessState === "BLOCKED"
        ? "border-rose-200 bg-rose-50 text-rose-800"
        : readinessState === "DATA_INCOMPLETE"
          ? "border-amber-200 bg-amber-50 text-amber-800"
          : "border-slate-200 bg-slate-100 text-slate-700";

  const snapshotTone =
    snapshotLifecycle === "READY"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : snapshotLifecycle === "STALE"
        ? "border-orange-200 bg-orange-50 text-orange-800"
        : "border-slate-200 bg-slate-100 text-slate-600";

  const diagnosticsCount =
    blockingReasons.length + incompletenessReasons.length + warnings.length;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3 min-w-0">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 min-w-0">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#042c51] text-white shrink-0 mt-0.5">
            {readinessState === "EXECUTION_READY" ? (
              <ShieldCheck size={16} className="text-emerald-400" />
            ) : readinessState === "BLOCKED" ? (
              <ShieldAlert size={16} className="text-rose-400" />
            ) : (
              <Sparkles size={16} className="text-[#ff5c28]" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#042c51]">
                Deterministic Snapshot Governance
              </h4>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${snapshotTone}`}
              >
                <span>Snapshot: {snapshotLifecycle}</span>
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${readinessTone}`}
              >
                {readinessState === "EXECUTION_READY" || readinessState === "VERIFIED" ? (
                  <CheckCircle2 size={10} />
                ) : (
                  <AlertTriangle size={10} />
                )}
                <span>Readiness: {readinessState}</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border border-sky-200 bg-sky-50 text-sky-800">
                <span>Verification: {verificationStatus}</span>
              </span>
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
              <span>
                Period:{" "}
                <strong className="text-slate-700 font-bold">
                  {formatPeriodWindow(data.period, data.periodWindow)}
                </strong>
              </span>
              <span>•</span>
              <span>
                Policy Snapshot:{" "}
                <strong className="text-slate-700 font-bold">{policySnapshotCode}</strong>
              </span>
              <span>•</span>
              <span>
                Engine:{" "}
                <strong className="text-slate-700">
                  {snapshot?.calculationEngineVersion || "v2.0-phase4c"}
                </strong>
              </span>
              <span>•</span>
              <span>
                Calculated:{" "}
                <strong className="text-slate-700">
                  {formatTimestamp(snapshot?.calculatedAt)}
                </strong>
              </span>
              <span>•</span>
              <span className="text-emerald-700 font-semibold">
                Hermes Calls on GET: {Number(data.hermesCallsCount || 0)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {diagnosticsCount > 0 && (
            <button
              type="button"
              onClick={() => setShowDiagnostics((v) => !v)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
            >
              <AlertCircle size={13} className="text-amber-600" />
              <span>Diagnostics ({diagnosticsCount})</span>
              {showDiagnostics ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          )}

          {onRebuild && (
            <button
              type="button"
              disabled={rebuilding}
              onClick={() => onRebuild({ force: true })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#042c51] hover:bg-[#063b6d] disabled:opacity-60 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            >
              <RefreshCw size={13} className={rebuilding ? "animate-spin" : ""} />
              <span>{rebuilding ? "Rebuilding..." : "Rebuild Snapshot"}</span>
            </button>
          )}
        </div>
      </div>

      {rebuildStatus?.message && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 font-medium">
          <Clock size={13} className="text-blue-600 shrink-0" />
          <span>{rebuildStatus.message}</span>
        </div>
      )}

      {showDiagnostics && diagnosticsCount > 0 && (
        <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 space-y-2 text-xs">
          {blockingReasons.map((msg, idx) => (
            <div key={`b-${idx}`} className="flex items-start gap-2 text-rose-800">
              <ShieldAlert size={14} className="text-rose-600 shrink-0 mt-0.5" />
              <span>
                <strong>BLOCKING:</strong> {msg}
              </span>
            </div>
          ))}
          {incompletenessReasons.map((msg, idx) => (
            <div key={`i-${idx}`} className="flex items-start gap-2 text-amber-900">
              <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>DATA GAP:</strong> {msg}
              </span>
            </div>
          ))}
          {warnings.map((msg, idx) => (
            <div key={`w-${idx}`} className="flex items-start gap-2 text-slate-600">
              <AlertCircle size={14} className="text-slate-500 shrink-0 mt-0.5" />
              <span>
                <strong>NOTE:</strong> {msg}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
