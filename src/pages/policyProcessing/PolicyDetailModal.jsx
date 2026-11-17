import { useState, useEffect } from "react";
import {
  X,
  FileText,
  Layers,
  Sigma,
  History,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Download,
  Code2,
  AlertCircle,
  FileCheck2,
  Loader2,
} from "lucide-react";
import {
  getPolicyProcessingDetail,
  getPolicyPdfPreviewUrl,
} from "@/lib/axios/policy-processing";

function formatTimestamp(value) {
  if (!value) return "—";
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(d);
  } catch {
    return String(value);
  }
}

export default function PolicyDetailModal({
  documentId,
  initialDocument = null,
  onClose,
  onReprocess,
  canManage = false,
  isReprocessing = false,
}) {
  const [activeTab, setActiveTab] = useState("extracted"); // 'extracted', 'formulas', 'preview', 'history'
  const [documentDetail, setDocumentDetail] = useState(initialDocument);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPageNum, setSelectedPageNum] = useState(1);

  useEffect(() => {
    if (!documentId) return;
    let active = true;

    getPolicyProcessingDetail(documentId)
      .then((detail) => {
        if (!active) return;
        setDocumentDetail(detail);
        if (detail?.pages?.length > 0) {
          setSelectedPageNum(detail.pages[0].page_number || 1);
        }
        setError("");
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.response?.data?.message || err.message || "Failed to load document details");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [documentId]);

  if (!documentId) return null;

  const doc = documentDetail || initialDocument || {};
  const pages = doc.pages || [];
  const sections = doc.sections || [];
  const versions = doc.versions || [];
  const jobs = doc.jobs || [];
  const warnings = Array.isArray(doc.warnings)
    ? doc.warnings
    : typeof doc.warnings === "string" && doc.warnings.startsWith("[")
    ? JSON.parse(doc.warnings)
    : [];

  const currentPage = pages.find((p) => p.page_number === selectedPageNum) || pages[0];
  const previewUrl = getPolicyPdfPreviewUrl(documentId);

  // Group sections by type for formula/rule tab
  const formulaSections = sections.filter((s) => s.section_type === "formula" || s.section_type === "kpi_definition");
  const ruleSections = sections.filter((s) => s.section_type === "policy_rules" || s.section_type === "table" || s.section_type === "procedure");

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-black/60 p-4 sm:p-6 backdrop-blur-xs">
      <div className="relative flex flex-col w-full max-w-5xl h-[90vh] bg-white rounded-2xl shadow-2xl border border-[#DCE4EE] overflow-hidden">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between bg-[#082B60] px-6 py-4 text-white shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-[#ff5c28] border border-white/15 shrink-0">
              <FileCheck2 size={22} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-extrabold tracking-wide text-white truncate">
                  {doc.policy_title || doc.file_name || "Policy Document Details"}
                </h3>
                {doc.document_code && (
                  <span className="rounded bg-[#ff5c28] px-2 py-0.5 text-[11px] font-black text-white">
                    {doc.document_code}
                  </span>
                )}
                <span className="rounded bg-white/15 px-2 py-0.5 text-[11px] font-bold text-slate-200">
                  Rev {doc.revision_number || "000"}
                </span>
              </div>
              <p className="text-xs text-slate-300 truncate mt-0.5">
                {doc.file_name} • {doc.policy_category || "General Policy"} •{" "}
                {doc.total_pages ? `${doc.total_pages} Pages` : "Unprocessed"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canManage && (
              <button
                type="button"
                onClick={() => onReprocess(documentId)}
                disabled={isReprocessing}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 hover:bg-white/25 px-3 py-1.5 text-xs font-bold text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                <RotateCcw size={13} className={isReprocessing ? "animate-spin" : ""} />
                <span>{isReprocessing ? "Reprocessing..." : "Reprocess"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Metadata Summary Banner */}
        <div className="bg-[#F8FAFC] border-b border-[#DCE4EE] px-6 py-3 shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[11px] font-medium text-slate-500 block">Status:</span>
              <span className="font-bold text-[#14233F] flex items-center gap-1 mt-0.5">
                {doc.processing_status === "Ready" && <CheckCircle2 size={13} className="text-emerald-600" />}
                {doc.processing_status === "Partial" && <AlertTriangle size={13} className="text-amber-600" />}
                {doc.processing_status === "Failed" && <AlertCircle size={13} className="text-rose-600" />}
                {doc.processing_status || "Pending"}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-medium text-slate-500 block">SHA-256 Checksum:</span>
              <span
                className="font-mono text-[11px] text-slate-700 block truncate mt-0.5"
                title={doc.checksum_sha256}
              >
                {doc.checksum_sha256 ? `${doc.checksum_sha256.substring(0, 16)}...` : "—"}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-medium text-slate-500 block">Uploaded At:</span>
              <span className="font-semibold text-slate-800 block mt-0.5">
                {formatTimestamp(doc.created_at)}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-medium text-slate-500 block">Last Processed:</span>
              <span className="font-semibold text-slate-800 block mt-0.5">
                {formatTimestamp(doc.last_processed_at)}
              </span>
            </div>
          </div>

          {/* Warnings Bar if warnings exist */}
          {warnings.length > 0 && (
            <div className="mt-2.5 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-2 text-xs text-amber-800">
              <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="font-bold">Extraction Warnings: </span>
                <span>{warnings.join("; ")}</span>
              </div>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-[#DCE4EE] bg-white px-6 pt-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("extracted")}
            className={`flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-bold transition-colors cursor-pointer ${
              activeTab === "extracted"
                ? "border-[#082B60] text-[#082B60]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Layers size={14} />
            <span>Extracted Text ({pages.length} Pages)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("formulas")}
            className={`flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-bold transition-colors cursor-pointer ${
              activeTab === "formulas"
                ? "border-[#082B60] text-[#082B60]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Sigma size={14} />
            <span>Formulas & Sections ({sections.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={`flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-bold transition-colors cursor-pointer ${
              activeTab === "preview"
                ? "border-[#082B60] text-[#082B60]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <FileText size={14} />
            <span>Original PDF Preview</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-bold transition-colors cursor-pointer ${
              activeTab === "history"
                ? "border-[#082B60] text-[#082B60]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <History size={14} />
            <span>Version & Audit Activity ({jobs.length})</span>
          </button>
        </div>

        {/* Modal Body / Tab Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6 bg-slate-50">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 py-16 text-slate-500">
              <Loader2 size={32} className="animate-spin text-[#082B60]" />
              <span className="text-xs font-bold">Loading extracted policy details...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 py-16 text-center">
              <AlertCircle size={36} className="text-rose-500" />
              <p className="text-sm font-bold text-slate-800">Error Loading Details</p>
              <p className="text-xs text-rose-600 max-w-md">{error}</p>
            </div>
          ) : activeTab === "extracted" ? (
            /* Tab 1: Extracted Text Organized by Page */
            <div className="flex flex-col h-full gap-4">
              {pages.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
                  <FileText size={32} className="mx-auto mb-2 text-slate-400" />
                  <p className="text-sm font-bold text-slate-700">No Extracted Pages Available</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Click "Reprocess" above to extract pages from the PDF document.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col h-full gap-3">
                  {/* Page selector bar */}
                  <div className="flex items-center justify-between bg-white rounded-xl border border-[#DCE4EE] p-3 shadow-2xs">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#14233F]">Select Page:</span>
                      <div className="flex items-center gap-1 overflow-x-auto max-w-md">
                        {pages.map((p) => (
                          <button
                            key={p.page_number}
                            type="button"
                            onClick={() => setSelectedPageNum(p.page_number)}
                            className={`flex h-7 min-w-[28px] items-center justify-center rounded px-2 text-xs font-bold transition-colors cursor-pointer ${
                              selectedPageNum === p.page_number
                                ? "bg-[#082B60] text-white"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            }`}
                          >
                            Page {p.page_number}
                          </button>
                        ))}
                      </div>
                    </div>

                    {currentPage && (
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>
                          <strong>{currentPage.word_count || 0}</strong> words
                        </span>
                        <span>•</span>
                        <span>
                          <strong>{currentPage.character_count || 0}</strong> chars
                        </span>
                        {currentPage.has_tables === 1 && (
                          <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                            Tables Detected
                          </span>
                        )}
                        {currentPage.has_formulas === 1 && (
                          <span className="rounded bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                            Formulas Detected
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Page text container */}
                  <div className="flex-1 min-h-[300px] overflow-y-auto rounded-xl border border-[#DCE4EE] bg-white p-5 shadow-2xs">
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
                      <h4 className="text-xs font-extrabold text-[#082B60] uppercase tracking-wider">
                        Page {selectedPageNum} Extracted Content
                      </h4>
                      <span className="text-[11px] text-slate-400">
                        Authoritative policy rules verbatim text
                      </span>
                    </div>

                    <pre className="font-mono text-xs text-[#14233F] whitespace-pre-wrap leading-relaxed select-text">
                      {currentPage?.extracted_text || "No text found for this page."}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === "formulas" ? (
            /* Tab 2: Extracted Formulas & Logical Sections */
            <div className="space-y-4">
              {/* Formula and KPI definitions */}
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#082B60] mb-2 flex items-center gap-1.5">
                  <Sigma size={15} className="text-[#ff5c28]" />
                  <span>Mathematical Formulas & KPI Thresholds ({formulaSections.length})</span>
                </h4>

                {formulaSections.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500">
                    No explicit mathematical formulas indexed in this document.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2.5">
                    {formulaSections.map((sec, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-purple-200 bg-purple-50/40 p-4 shadow-2xs"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-extrabold text-xs text-purple-900">
                            {sec.heading || `Formula Section #${idx + 1}`}
                          </span>
                          <span className="rounded bg-purple-200 px-2 py-0.5 text-[10px] font-bold text-purple-800">
                            Page {sec.page_start}
                          </span>
                        </div>
                        <p className="font-mono text-xs text-slate-800 bg-white p-2.5 rounded-lg border border-purple-100 whitespace-pre-wrap">
                          {sec.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Policy Rules & Procedures */}
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#082B60] mb-2 flex items-center gap-1.5">
                  <Layers size={15} className="text-[#12376B]" />
                  <span>Governance Rules, Tables & Requirements ({ruleSections.length})</span>
                </h4>

                {ruleSections.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500">
                    No structured governance sections indexed.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2.5">
                    {ruleSections.map((sec, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-[#DCE4EE] bg-white p-4 shadow-2xs"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-extrabold text-xs text-[#082B60]">
                            {sec.heading || `Policy Rule #${idx + 1}`}
                          </span>
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                            Pages {sec.page_start}{sec.page_end !== sec.page_start ? `–${sec.page_end}` : ""}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {sec.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === "preview" ? (
            /* Tab 3: Original PDF Preview */
            <div className="flex flex-col h-full rounded-xl border border-[#DCE4EE] bg-white overflow-hidden shadow-2xs">
              <div className="flex items-center justify-between bg-slate-100 px-4 py-2 border-b border-[#DCE4EE]">
                <span className="text-xs font-bold text-slate-700">
                  {doc.file_name} (Original Authoritative PDF)
                </span>
                <a
                  href={previewUrl}
                  download={doc.file_name || "policy.pdf"}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#082B60] hover:underline cursor-pointer"
                >
                  <Download size={13} />
                  <span>Download File</span>
                </a>
              </div>
              <iframe
                src={previewUrl}
                title={doc.policy_title || "PDF Preview"}
                className="w-full flex-1 min-h-[480px] border-none"
              />
            </div>
          ) : (
            /* Tab 4: Version History & Processing Activity */
            <div className="space-y-5">
              {/* Version History Table */}
              <div className="rounded-xl border border-[#DCE4EE] bg-white p-4 shadow-2xs">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#082B60] mb-3 flex items-center gap-1.5">
                  <History size={14} className="text-[#ff5c28]" />
                  <span>Document Revisions & Version History</span>
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#F0F3F7] text-[11px] font-extrabold text-[#14233F] border-b border-[#DCE4EE]">
                        <th className="py-2 px-3">Revision</th>
                        <th className="py-2 px-3">File Name</th>
                        <th className="py-2 px-3">Category</th>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 px-3">Upload Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DCE4EE] text-slate-700">
                      {versions.map((ver) => (
                        <tr
                          key={ver.id}
                          className={ver.id === Number(documentId) ? "bg-blue-50/50 font-bold" : ""}
                        >
                          <td className="py-2 px-3 font-mono">Rev {ver.revision_number}</td>
                          <td className="py-2 px-3">{ver.file_name}</td>
                          <td className="py-2 px-3">{ver.policy_category}</td>
                          <td className="py-2 px-3">
                            <span className="rounded bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                              {ver.approval_status || "Approved"}
                            </span>
                          </td>
                          <td className="py-2 px-3">{formatTimestamp(ver.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Processing Audit Jobs Log */}
              <div className="rounded-xl border border-[#DCE4EE] bg-white p-4 shadow-2xs">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#082B60] mb-3 flex items-center gap-1.5">
                  <Code2 size={14} className="text-[#12376B]" />
                  <span>Extraction & Indexing Audit Activity ({jobs.length} Runs)</span>
                </h4>

                {jobs.length === 0 ? (
                  <p className="text-xs text-slate-500">No processing logs recorded yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#F0F3F7] text-[11px] font-extrabold text-[#14233F] border-b border-[#DCE4EE]">
                          <th className="py-2 px-3">Job ID</th>
                          <th className="py-2 px-3">Type</th>
                          <th className="py-2 px-3">Status</th>
                          <th className="py-2 px-3 text-center">Pages</th>
                          <th className="py-2 px-3 text-center">Duration</th>
                          <th className="py-2 px-3">Executed At</th>
                          <th className="py-2 px-3">Executed By</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#DCE4EE] text-slate-700">
                        {jobs.map((job) => (
                          <tr key={job.id}>
                            <td className="py-2 px-3 font-mono text-slate-500">#{job.id}</td>
                            <td className="py-2 px-3 font-semibold text-[#082B60]">{job.job_type}</td>
                            <td className="py-2 px-3">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                                  job.status === "Ready" || job.status === "Completed"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : job.status === "Failed"
                                    ? "bg-rose-100 text-rose-800"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {job.status}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-center">{job.pages_extracted ?? "—"}</td>
                            <td className="py-2 px-3 text-center font-mono">
                              {job.duration_ms ? `${job.duration_ms}ms` : "—"}
                            </td>
                            <td className="py-2 px-3">{formatTimestamp(job.created_at)}</td>
                            <td className="py-2 px-3">{job.created_by || "System"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="flex items-center justify-between bg-white px-6 py-3 border-t border-[#DCE4EE] shrink-0">
          <div className="text-xs text-slate-500">
            Authoritative source: FrontSteps Policies Repository
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-100 hover:bg-slate-200 px-4 py-2 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
