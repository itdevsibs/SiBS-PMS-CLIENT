import React, { useState, useEffect } from "react";
import {
  X,
  History,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Shield,
  Layers,
  Archive,
  RefreshCw,
  Copy,
  Check,
} from "lucide-react";
import { useFrontStepsAiPolicyVersionHistory } from "../hooks/useFrontStepsAiData";

export default function FrontStepsAiPolicyVersionHistoryModal({
  documentCode,
  policyTitle,
  onClose,
}) {
  const { history, loading, error, reload } = useFrontStepsAiPolicyVersionHistory(documentCode);
  const [activeTab, setActiveTab] = useState("versions");
  const [copiedHash, setCopiedHash] = useState(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleCopyHash = (hash) => {
    if (!hash) return;
    navigator.clipboard?.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const versions = history.versions || [];
  const events = history.events || [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative flex flex-col w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#042c51] text-white shrink-0 shadow-2xs">
              <History size={20} className="text-[#ff5c28]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-blue-100 text-[#042c51]">
                  {documentCode}
                </span>
                <h3 className="text-sm font-black text-slate-800 truncate">
                  {policyTitle || "Policy Version History & Evidence"}
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                Immutable content-addressed version ledger and audit trail
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={reload}
              disabled={loading}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Refresh version history"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Close modal"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-200 bg-white">
          <button
            type="button"
            onClick={() => setActiveTab("versions")}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "versions"
                ? "border-[#042c51] text-[#042c51]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Layers size={14} />
            <span>Version Registry ({versions.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("events")}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "events"
                ? "border-[#042c51] text-[#042c51]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Clock size={14} />
            <span>Lifecycle Audit Trail ({events.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <RefreshCw size={28} className="animate-spin text-[#042c51] mb-2" />
              <p className="text-xs font-semibold">Loading version history...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs font-medium">
              {error}
            </div>
          ) : activeTab === "versions" ? (
            <div className="space-y-3">
              {versions.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-medium bg-white rounded-xl border border-slate-200">
                  No version records synchronized for {documentCode}. Run policy synchronization to index documents.
                </div>
              ) : (
                versions.map((ver) => {
                  const isApproved =
                    String(ver.approvalStatus || "").toLowerCase() === "approved";
                  const isAvailable = ver.sourceAvailability === "AVAILABLE";

                  return (
                    <div
                      key={ver.id}
                      className={`p-4 rounded-xl border transition-all ${
                        ver.isEligibleCurrent
                          ? "bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-300/50"
                          : "bg-white border-slate-200 shadow-2xs"
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-sm px-2.5 py-1 rounded-lg bg-[#042c51] text-white">
                            v{ver.revisionNumber}
                          </span>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-xs text-slate-800">
                                {ver.title || policyTitle}
                              </span>
                              {ver.isEligibleCurrent && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white shadow-2xs">
                                  <CheckCircle2 size={11} />
                                  CURRENT ELIGIBLE FOR AI
                                </span>
                              )}
                              {!isAvailable && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                                  <AlertTriangle size={10} />
                                  SOURCE DELETED
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {ver.fileName} ({ver.fileSizeFormatted})
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                              isApproved
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {ver.approvalStatus || "Pending"}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200">
                            <Archive size={10} className="text-slate-500" />
                            {ver.archiveStatus}
                          </span>
                        </div>
                      </div>

                      {/* Hash and evidence line */}
                      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px]">
                        <div className="flex items-center gap-2 font-mono text-slate-600">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            SHA-256:
                          </span>
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] text-slate-700 select-all font-mono">
                            {ver.verifiedChecksum}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyHash(ver.verifiedChecksum)}
                            className="p-1 rounded hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
                            title="Copy full SHA-256 hash"
                          >
                            {copiedHash === ver.verifiedChecksum ? (
                              <Check size={12} className="text-emerald-600" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </div>
                        <div className="text-slate-400 text-[10px]">
                          Discovered: {ver.discoveredAtFormatted}
                        </div>
                      </div>

                      {ver.versionNotes && (
                        <div className="mt-2 text-[10px] text-slate-500 italic bg-slate-50 px-2.5 py-1 rounded">
                          {ver.versionNotes}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              {events.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-medium bg-white rounded-xl border border-slate-200">
                  No lifecycle audit events recorded yet for this document.
                </div>
              ) : (
                events.map((evt) => {
                  const badgeColor =
                    evt.eventType === "VERSION_ADDED"
                      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                      : evt.eventType === "STATUS_CHANGED"
                      ? "bg-blue-100 text-blue-800 border-blue-200"
                      : evt.eventType === "SOURCE_REPLACED"
                      ? "bg-amber-100 text-amber-800 border-amber-200"
                      : evt.eventType === "SOURCE_MISSING"
                      ? "bg-rose-100 text-rose-800 border-rose-200"
                      : evt.eventType === "CURRENT_REVISION_CHANGED"
                      ? "bg-purple-100 text-purple-800 border-purple-200"
                      : "bg-slate-100 text-slate-700 border-slate-200";

                  return (
                    <div
                      key={evt.id}
                      className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${badgeColor}`}
                          >
                            {evt.eventType}
                          </span>
                          <span className="font-mono text-[11px] text-slate-500">
                            ID #{evt.id}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {evt.createdAtFormatted}
                        </span>
                      </div>

                      {/* State transition or details */}
                      <div className="text-[11px] text-slate-600 bg-slate-50/80 p-2 rounded-lg font-mono text-[10.5px]">
                        {evt.previousState && (
                          <div>
                            <span className="text-slate-400">Previous: </span>
                            {JSON.stringify(evt.previousState)}
                          </div>
                        )}
                        {evt.newState && (
                          <div>
                            <span className="text-slate-400">New: </span>
                            {JSON.stringify(evt.newState)}
                          </div>
                        )}
                        {evt.metadata && (
                          <div>
                            <span className="text-slate-400">Metadata: </span>
                            {JSON.stringify(evt.metadata)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-slate-50/80">
          <span className="text-[11px] text-slate-500">
            Document Code: <strong className="text-slate-700">{documentCode}</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#042c51] text-white text-xs font-bold hover:bg-[#063c6d] transition-colors cursor-pointer shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
