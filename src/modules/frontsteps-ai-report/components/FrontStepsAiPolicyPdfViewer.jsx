import React, { useState, useEffect } from "react";
import { X, Download, AlertTriangle, Loader2, FileText, CheckCircle2 } from "lucide-react";
import { getFrontStepsPolicyBlob } from "@/lib/axios/frontsteps-imports";

export default function FrontStepsAiPolicyPdfViewer({ policy, onClose }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Lock background scrolling while modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Fetch authenticated document binary as Blob
  useEffect(() => {
    if (!policy?.id) {
      setError("Invalid policy document: missing document ID.");
      setLoading(false);
      return;
    }

    let url = null;
    let active = true;
    setLoading(true);
    setError("");

    getFrontStepsPolicyBlob(policy.id)
      .then((blob) => {
        if (!active) return;
        const ext = (policy.fileExtension || policy.fileName?.split(".").pop() || "pdf").toLowerCase();
        const mime = blob.type || (ext === "pdf" ? "application/pdf" : "application/octet-stream");
        const typedBlob = new Blob([blob], { type: mime });
        url = URL.createObjectURL(typedBlob);
        setBlobUrl(url);
      })
      .catch((err) => {
        if (!active) return;
        console.error("[FrontSteps AI PDF Viewer] Error retrieving document blob:", err);
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to retrieve policy document from FrontSteps repository."
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [policy?.id, policy?.fileExtension, policy?.fileName]);

  if (!policy) return null;

  const title = policy.title || policy.fileName || "Policy Document";
  const docCode = policy.documentCode || policy.document_code || "—";
  const rev = policy.revisionNumber ?? policy.revision_number ?? "000";
  const status = policy.approvalStatus || policy.approval_status || "Approved";
  const ext = (policy.fileExtension || policy.fileName?.split(".").pop() || "pdf").toLowerCase();
  const isPdf = ext === "pdf";
  const downloadFileName =
    policy.fileName || policy.file_name || `${docCode}_Rev${rev}.${ext}`;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/60 backdrop-blur-2xs p-3 sm:p-6 animate-in fade-in duration-150"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <section className="flex w-full max-w-[1200px] w-[92vw] h-[88vh] max-h-[94vh] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200">
        {/* Navy Brand Header */}
        <header className="flex shrink-0 items-center justify-between gap-3 bg-[#042c51] px-5 sm:px-6 py-3.5 text-white border-b border-[#0d3b66]">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#ff5c28] text-[11px] font-black text-white">
                FS
              </span>
              <h2 className="text-sm sm:text-base font-bold text-white leading-tight truncate">
                {title}
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-300 truncate font-mono">
              Policy Code: <span className="font-bold text-white">{docCode}</span> · Revision:{" "}
              <span className="font-bold text-white">Rev {rev}</span> · Status:{" "}
              <span className="font-bold text-emerald-400">{status}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs font-bold text-white transition-colors cursor-pointer shadow-2xs shrink-0"
            aria-label="Close viewer dialog"
            title="Close viewer"
          >
            <X size={14} />
            <span className="hidden sm:inline">Close</span>
          </button>
        </header>

        {/* Viewer Body */}
        <div className="flex-1 min-h-0 w-full flex flex-col items-center justify-center relative bg-slate-100 overflow-hidden">
          {loading && (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-500">
              <Loader2 size={36} className="animate-spin text-[#ff5c28]" />
              <span className="text-xs font-bold text-slate-700">
                Retrieving authenticated policy document...
              </span>
              <span className="text-[11px] text-slate-400">
                Streaming secure PDF from FrontSteps repository
              </span>
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center justify-center p-8 text-center max-w-md bg-white rounded-xl border border-red-200 shadow-sm m-4">
              <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center text-red-600 mb-3">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Unable to display policy document</h3>
              <p className="mt-1.5 text-xs text-red-600 leading-relaxed">{error}</p>
              <button
                type="button"
                onClick={onClose}
                className="mt-4 px-4 py-2 rounded-lg bg-[#042c51] text-white text-xs font-bold hover:bg-[#063c6d] transition cursor-pointer"
              >
                Close Viewer
              </button>
            </div>
          )}

          {!loading && !error && blobUrl && (
            isPdf ? (
              <iframe
                src={blobUrl}
                title={title}
                className="w-full h-full border-none flex-1 min-h-[500px]"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center max-w-md bg-white rounded-2xl shadow-sm m-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-[#042c51] mb-4 shadow-xs">
                  <FileText size={32} />
                </div>
                <h4 className="text-base font-extrabold text-[#042c51]">{title}</h4>
                <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                  Document format ({ext.toUpperCase()}) cannot be embedded directly in the browser viewer,
                  but can be downloaded using the button below.
                </p>
                <a
                  href={blobUrl}
                  download={downloadFileName}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#ff5c28] hover:bg-[#e04a1b] text-white px-4 py-2 text-xs font-bold transition shadow-xs"
                >
                  <Download size={14} /> Download Document
                </a>
              </div>
            )
          )}
        </div>

        {/* Modal Footer */}
        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 sm:px-6 py-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span className="font-mono">{policy.fileSizeFormatted || (policy.fileSize ? `${(policy.fileSize / 1024).toFixed(1)} KB` : "—")}</span>
            <span>·</span>
            <span className="font-bold uppercase text-slate-600">{ext}</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
              <CheckCircle2 size={12} className="text-emerald-500" />
              Verified Authenticated Blob
            </span>
          </div>

          <div className="flex items-center gap-2">
            {blobUrl && (
              <a
                href={blobUrl}
                download={downloadFileName}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition cursor-pointer shadow-2xs"
                title="Download local copy of this policy document"
              >
                <Download size={13} />
                <span>Download Copy</span>
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1 rounded-lg bg-[#042c51] hover:bg-[#063c6d] px-3.5 py-1.5 text-xs font-bold text-white transition cursor-pointer shadow-2xs"
            >
              Done
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
