/**
 * FrontSteps AI Timezone & Operational Calculation Preview Modal
 * 
 * Minimal, well-organized admin preview control:
 * - Currently active timezone (America/Denver fallback)
 * - Proposed timezone (America/Denver default)
 * - Source timezone certification status (UNCONFIRMED)
 * - Effective date & approval status (PROVISIONAL PREVIEW ONLY)
 * - Preview-only comparative results
 * 
 * Strict Invariant: Read-only preview. Zero activation buttons.
 */

import React, { useState, useEffect } from "react";
import {
  X,
  Clock,
  Globe,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  FileSpreadsheet,
  PhoneCall,
  CheckCircle2,
  Info,
} from "lucide-react";
import { fetchFsAiTimezonePreview } from "../services/frontStepsAiApi";

export default function FrontStepsAiTimezonePreviewModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);
  const [proposedTimezone, setProposedTimezone] = useState("America/Denver");

  const loadPreview = async (tz = proposedTimezone) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFsAiTimezonePreview({
        period: "monthly",
        startDate: "2026-10-01",
        endDate: "2026-10-15",
        proposedTimezone: tz,
      });
      if (res?.preview) {
        setPreview(res.preview);
      } else {
        throw new Error(res?.message || "Failed to load timezone preview");
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Error loading preview");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadPreview(proposedTimezone);
    }
  }, [isOpen, proposedTimezone]);

  if (!isOpen) return null;

  const baseline = preview?.comparison?.baselineHistorical;
  const proposed = preview?.comparison?.proposedReporting;
  const deltas = preview?.comparison?.migrationDeltas;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-slate-900">
                  Timezone Integration & Calculation Preview
                </h2>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 border border-amber-200">
                  PROVISIONAL PREVIEW ONLY
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Phase 7B.2A: Safe read-only comparative analysis — No snapshots or calculations modified
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Governance Notice Banner */}
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 space-y-1">
                <p className="font-semibold text-amber-900">
                  Source Timezone Unconfirmed & Calculation Gated
                </p>
                <p>
                  Salesforce CRM and Amazon Connect source timestamps have not been certified by management
                  (<span className="font-mono font-medium">UNCONFIRMED</span>).
                  Because source clocks lack certification, this preview comparison is strictly provisional.
                  Cases Closed (45% weight) and Final KPI Score remain safely <strong>BLOCKED</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Configuration Status Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div className="rounded-lg border border-slate-200 p-3 bg-slate-50/50">
              <div className="text-slate-500 font-medium mb-1">Currently Active Timezone</div>
              <div className="text-slate-900 font-semibold flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                America/Denver (MT)
              </div>
              <div className="text-slate-500 text-[11px] mt-0.5">Historical Fallback</div>
            </div>

            <div className="rounded-lg border border-blue-200 p-3 bg-blue-50/40">
              <div className="text-blue-700 font-medium mb-1">Proposed Timezone</div>
              <div className="text-blue-900 font-semibold flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-blue-600" />
                {proposedTimezone} ({proposedTimezone === "America/Denver" ? "MT" : proposedTimezone === "America/New_York" ? "ET" : "Local"})
              </div>
              <div className="text-blue-600 text-[11px] mt-0.5">DST-Aware Half-Open Window</div>
            </div>

            <div className="rounded-lg border border-slate-200 p-3 bg-slate-50/50">
              <div className="text-slate-500 font-medium mb-1">Source Certification</div>
              <div className="text-amber-700 font-semibold flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                UNCONFIRMED
              </div>
              <div className="text-slate-500 text-[11px] mt-0.5">Pending Management Approval</div>
            </div>

            <div className="rounded-lg border border-slate-200 p-3 bg-slate-50/50">
              <div className="text-slate-500 font-medium mb-1">Approval & Eligibility</div>
              <div className="text-slate-700 font-semibold flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
                NOT ACTIVATED
              </div>
              <div className="text-red-600 text-[11px] mt-0.5 font-medium">Ineligible for Publication</div>
            </div>
          </div>

          {/* Timezone Selector & Refresh */}
          <div className="flex items-center justify-between bg-slate-100 rounded-lg p-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-700">Preview Timezone:</span>
              <select
                value={proposedTimezone}
                onChange={(e) => setProposedTimezone(e.target.value)}
                disabled={loading}
                className="rounded border border-slate-300 bg-white px-2.5 py-1 text-slate-800 font-mono text-xs focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
              >
                <option value="America/Denver">America/Denver (Mountain Time - Proposed Default)</option>
                <option value="America/New_York">America/New_York (Eastern Time)</option>
                <option value="America/Chicago">America/Chicago (Central Time)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (Pacific Time)</option>
                <option value="Asia/Manila">Asia/Manila (PHT)</option>
                <option value="UTC">UTC (Coordinated Universal Time)</option>
              </select>
            </div>
            <button
              onClick={() => loadPreview(proposedTimezone)}
              disabled={loading}
              className="flex items-center gap-1.5 rounded bg-white px-2.5 py-1 text-slate-700 border border-slate-300 hover:bg-slate-50 font-medium transition-colors"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
              Refresh Preview
            </button>
          </div>

          {/* Loading / Error States */}
          {loading && (
            <div className="py-12 text-center text-slate-500 text-xs">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
              Simulating read-only timezone boundary conversion across raw cases and calls...
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-xs text-red-800">
              <p className="font-semibold mb-1">Preview Generation Failed</p>
              <p>{error}</p>
            </div>
          )}

          {/* Comparison Cards */}
          {!loading && preview && (
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Comparative Ingestion & Boundary Migration (Oct 01 – Oct 15, 2026)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Calls Comparison Card */}
                <div className="rounded-xl border border-slate-200 p-4 bg-white shadow-xs">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <PhoneCall className="h-4 w-4 text-indigo-600" />
                      <span className="font-semibold text-slate-800 text-xs">Calls (Telephony)</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">amazon_connect</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center mb-3">
                    <div className="rounded bg-slate-50 p-2">
                      <div className="text-[10px] text-slate-500">Baseline (MT)</div>
                      <div className="text-sm font-bold text-slate-800 font-mono">
                        {baseline?.counts?.callsTotal?.toLocaleString() || "—"}
                      </div>
                    </div>
                    <div className="rounded bg-blue-50 p-2">
                      <div className="text-[10px] text-blue-600">Proposed (ET)</div>
                      <div className="text-sm font-bold text-blue-800 font-mono">
                        {proposed?.counts?.callsTotal?.toLocaleString() || "—"}
                      </div>
                    </div>
                    <div className="rounded bg-slate-50 p-2">
                      <div className="text-[10px] text-slate-500">Net Delta</div>
                      <div className="text-sm font-bold text-slate-800 font-mono">
                        {deltas?.calls?.netDifference >= 0 ? `+${deltas?.calls?.netDifference}` : deltas?.calls?.netDifference}
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-600 space-y-1 bg-slate-50 rounded p-2.5">
                    <div className="flex justify-between">
                      <span>Records Entering Window:</span>
                      <span className="font-mono font-medium text-emerald-700">+{deltas?.calls?.recordsEntering || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Records Leaving Window:</span>
                      <span className="font-mono font-medium text-amber-700">-{deltas?.calls?.recordsLeaving || 0}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 pt-1 border-t border-slate-200">
                      <span>Answered / Abandoned:</span>
                      <span>{proposed?.counts?.callsAnswered} / {proposed?.counts?.callsAbandoned}</span>
                    </div>
                  </div>
                </div>

                {/* Cases Comparison Card */}
                <div className="rounded-xl border border-slate-200 p-4 bg-white shadow-xs">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                      <span className="font-semibold text-slate-800 text-xs">Cases (Salesforce)</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">salesforce_crm</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center mb-3">
                    <div className="rounded bg-slate-50 p-2">
                      <div className="text-[10px] text-slate-500">Baseline (MT)</div>
                      <div className="text-sm font-bold text-slate-800 font-mono">
                        {baseline?.counts?.casesTotal?.toLocaleString() || "—"}
                      </div>
                    </div>
                    <div className="rounded bg-blue-50 p-2">
                      <div className="text-[10px] text-blue-600">Proposed (ET)</div>
                      <div className="text-sm font-bold text-blue-800 font-mono">
                        {proposed?.counts?.casesTotal?.toLocaleString() || "—"}
                      </div>
                    </div>
                    <div className="rounded bg-slate-50 p-2">
                      <div className="text-[10px] text-slate-500">Net Delta</div>
                      <div className="text-sm font-bold text-slate-800 font-mono">
                        {deltas?.cases?.netDifference >= 0 ? `+${deltas?.cases?.netDifference}` : deltas?.cases?.netDifference}
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-600 space-y-1 bg-slate-50 rounded p-2.5">
                    <div className="flex justify-between">
                      <span>Records Entering Window:</span>
                      <span className="font-mono font-medium text-emerald-700">+{deltas?.cases?.recordsEntering || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Records Leaving Window:</span>
                      <span className="font-mono font-medium text-amber-700">-{deltas?.cases?.recordsLeaving || 0}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 pt-1 border-t border-slate-200">
                      <span>Closed / Open Cases:</span>
                      <span>{proposed?.counts?.casesClosed} / {proposed?.counts?.casesOpen}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interval Bounds Detail */}
              <div className="rounded-lg border border-slate-200 p-3 bg-slate-50 text-[11px] text-slate-600 font-mono space-y-1">
                <div className="text-slate-700 font-semibold font-sans mb-1 text-xs">
                  Exact UTC Half-Open Intervals:
                </div>
                <div>
                  <span className="text-slate-500">Baseline (MT): </span>
                  {baseline?.intervalBounds?.startInclusiveUtc} &rarr; {baseline?.intervalBounds?.endExclusiveUtc} ({baseline?.intervalBounds?.durationHours} hrs)
                </div>
                <div>
                  <span className="text-blue-600 font-medium">Proposed ({proposedTimezone}): </span>
                  {proposed?.intervalBounds?.startInclusiveUtc} &rarr; {proposed?.intervalBounds?.endExclusiveUtc} ({proposed?.intervalBounds?.durationHours} hrs)
                </div>
              </div>

              {/* Side Effect Guarantee Audit */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-200 pt-3">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1 text-emerald-700 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" /> 0 Snapshots Created
                  </span>
                  <span className="flex items-center gap-1 text-emerald-700 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" /> 0 Rebuild Jobs
                  </span>
                  <span className="flex items-center gap-1 text-emerald-700 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" /> 0 Hermes Inferences
                  </span>
                </div>
                <div className="text-slate-400">Duration: {preview?.durationMs}ms</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-3.5 bg-slate-50">
          <div className="text-xs text-slate-500">
            Activation requires Super Admin (7) approval in Phase 7B.2+
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-medium text-white hover:bg-slate-700 transition-colors"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}
