import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  FileText,
  Search,
  Layers,
  Table as TableIcon,
  AlertTriangle,
  RefreshCw,
  Eye,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Hash,
} from "lucide-react";
import { useFrontStepsAiPolicyPages } from "../hooks/useFrontStepsAiData";

export default function FrontStepsAiPolicyExtractedContentViewerModal({
  versionId,
  documentCode,
  policyTitle,
  revisionNumber = "000",
  onOpenPdfPreview,
  onReprocess,
  isReprocessing = false,
  onClose,
}) {
  const {
    data,
    pages,
    run,
    loading,
    error,
    activePage,
    setActivePage,
    reload,
  } = useFrontStepsAiPolicyPages(versionId);

  const [activeTab, setActiveTab] = useState("page"); // 'page' | 'tables' | 'search'
  const [searchTerm, setSearchTerm] = useState("");

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const currentPage = useMemo(() => {
    return pages.find((p) => p.pageNumber === activePage) || pages[0] || null;
  }, [pages, activePage]);

  // Filter lines or matches when searching within text
  const searchMatches = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    const matches = [];

    pages.forEach((p) => {
      const lines = p.exactText.split("\n");
      lines.forEach((line, idx) => {
        if (line.toLowerCase().includes(term)) {
          matches.push({
            pageNumber: p.pageNumber,
            lineIndex: idx,
            text: line,
          });
        }
      });
    });

    return matches;
  }, [pages, searchTerm]);

  const statusBadge = useMemo(() => {
    const s = run?.status || "PENDING";
    if (s === "READY") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle2 size={12} className="text-emerald-600" />
          READY
        </span>
      );
    }
    if (s === "PARTIAL") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
          <AlertTriangle size={12} className="text-amber-600" />
          PARTIAL EXTRACTION
        </span>
      );
    }
    if (s === "NEEDS_OCR") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
          <ShieldAlert size={12} className="text-purple-600" />
          NEEDS OCR
        </span>
      );
    }
    if (s === "PROCESSING") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
          <RefreshCw size={12} className="animate-spin text-blue-600" />
          PROCESSING
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
        {s}
      </span>
    );
  }, [run]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative flex flex-col w-full max-w-5xl h-[92vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#042c51] text-white shrink-0 shadow-2xs">
              <FileText size={20} className="text-[#ff5c28]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-blue-100 text-[#042c51]">
                  {documentCode}
                </span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold">
                  v{revisionNumber}
                </span>
                <h3 className="text-sm font-black text-slate-800 truncate">
                  {policyTitle || "Extracted Policy Knowledge"}
                </h3>
                {statusBadge}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                Structured knowledge layer extracted page-by-page from verified PDF archive
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenPdfPreview && (
              <button
                type="button"
                onClick={onOpenPdfPreview}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                title="Open original authenticated PDF in side-by-side preview"
              >
                <Eye size={13} className="text-[#ff5c28]" />
                <span>Original PDF</span>
              </button>
            )}

            {onReprocess && (
              <button
                type="button"
                onClick={onReprocess}
                disabled={isReprocessing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#042c51] text-white text-xs font-bold hover:bg-[#063c6d] disabled:opacity-50 transition-colors shadow-2xs cursor-pointer"
                title="Reprocess PDF extraction"
              >
                <RefreshCw size={13} className={isReprocessing ? "animate-spin" : ""} />
                <span>{isReprocessing ? "Reprocessing..." : "Reprocess"}</span>
              </button>
            )}

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

        {/* Overview Stats Bar */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-slate-100/70 border-b border-slate-200 text-xs text-slate-600 shrink-0 flex-wrap gap-2">
          <div className="flex items-center gap-4 flex-wrap text-[11px]">
            <span>
              Total Pages: <strong className="text-slate-800">{run?.pageCount || pages.length}</strong>
            </span>
            <span>•</span>
            <span>
              Detected Tables: <strong className="text-slate-800">{run?.tableCount || 0}</strong>
            </span>
            <span>•</span>
            <span>
              Searchable Chunks: <strong className="text-slate-800">{run?.chunkCount || 0}</strong>
            </span>
            {run?.warningCount > 0 && (
              <>
                <span>•</span>
                <span className="text-amber-700 font-semibold flex items-center gap-1">
                  <AlertTriangle size={12} />
                  {run.warningCount} Warnings
                </span>
              </>
            )}
          </div>

          <div className="text-[11px] text-slate-500 font-mono">
            Parser: {run?.parserVersion || "pdf-parse@1.1.4"} | Checksum:{" "}
            {run?.archiveChecksum ? `${run.archiveChecksum.substring(0, 8)}...` : "—"}
          </div>
        </div>

        {/* Tab switcher & Search */}
        <div className="flex items-center justify-between px-6 border-b border-slate-200 bg-white shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("page")}
              className={`py-3 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === "page"
                  ? "border-[#042c51] text-[#042c51]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <FileText size={14} />
              <span>Page Text</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("tables")}
              className={`py-3 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === "tables"
                  ? "border-[#042c51] text-[#042c51]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <TableIcon size={14} />
              <span>Structured Tables ({currentPage?.tables?.length || 0})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("search")}
              className={`py-3 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === "search"
                  ? "border-[#042c51] text-[#042c51]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Search size={14} />
              <span>Find in Document {searchMatches.length > 0 && `(${searchMatches.length})`}</span>
            </button>
          </div>

          {/* Page navigator */}
          {pages.length > 0 && (
            <div className="flex items-center gap-2 py-2">
              <span className="text-xs font-bold text-slate-600">Page:</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={activePage <= 1}
                  onClick={() => setActivePage((prev) => Math.max(1, prev - 1))}
                  className="p-1 rounded border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  title="Previous page"
                >
                  <ChevronLeft size={14} />
                </button>
                <select
                  value={activePage}
                  onChange={(e) => setActivePage(Number(e.target.value))}
                  className="px-2 py-1 text-xs font-bold text-slate-800 border border-slate-200 rounded bg-white cursor-pointer"
                >
                  {pages.map((p) => (
                    <option key={p.pageNumber} value={p.pageNumber}>
                      {p.pageNumber} of {pages.length}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={activePage >= pages.length}
                  onClick={() => setActivePage((prev) => Math.min(pages.length, prev + 1))}
                  className="p-1 rounded border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  title="Next page"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
              <RefreshCw size={32} className="animate-spin text-[#042c51] mb-2" />
              <p className="text-xs font-semibold">Loading extracted policy knowledge...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs font-medium">
              {error}
            </div>
          ) : pages.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs font-medium bg-white rounded-xl border border-slate-200">
              <FileText size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="font-bold text-slate-700">No Content Extracted Yet</p>
              <p className="mt-1 text-slate-500">
                This policy version has not been extracted. Click "Reprocess" above to extract knowledge.
              </p>
            </div>
          ) : activeTab === "page" ? (
            <div className="space-y-4">
              {/* Source Reference Breadcrumb */}
              <div className="flex items-center justify-between px-3.5 py-2 rounded-lg bg-blue-50 border border-blue-200 text-xs">
                <span className="font-mono font-bold text-[#042c51]">
                  {documentCode} | Revision {revisionNumber} | Page {activePage}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {currentPage?.charCount || 0} characters • {currentPage?.wordCount || 0} words
                </span>
              </div>

              {/* Page Warnings */}
              {currentPage?.warnings && currentPage.warnings.length > 0 && (
                <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-xs font-medium flex items-start gap-2">
                  <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    {currentPage.warnings.map((w, idx) => (
                      <p key={idx}>{w}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Exact Text Box */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
                <pre className="font-mono text-xs leading-relaxed text-slate-800 whitespace-pre-wrap break-words select-text">
                  {currentPage?.exactText || "No text on this page."}
                </pre>
              </div>
            </div>
          ) : activeTab === "tables" ? (
            <div className="space-y-4">
              <div className="px-3.5 py-2 rounded-lg bg-blue-50 border border-blue-200 text-xs font-mono font-bold text-[#042c51]">
                {documentCode} | Revision {revisionNumber} | Page {activePage} Structured Tables
              </div>

              {!currentPage?.tables || currentPage.tables.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-medium bg-white rounded-xl border border-slate-200">
                  No structured tables detected on Page {activePage}.
                </div>
              ) : (
                currentPage.tables.map((table, tIdx) => (
                  <div
                    key={tIdx}
                    className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs"
                  >
                    <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>Table #{tIdx + 1}</span>
                      <span className="font-mono text-[11px] text-slate-500">
                        {table.rows.length + 1} rows × {table.headers.length} columns
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                            {table.headers.map((h, hIdx) => (
                              <th key={hIdx} className="py-2 px-3 border-r border-slate-200 last:border-r-0">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono">
                          {table.rows.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-slate-50/80">
                              {row.map((cell, cIdx) => (
                                <td key={cIdx} className="py-2 px-3 border-r border-slate-100 last:border-r-0">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Type term to search within this policy..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-1 focus:ring-[#042c51]"
                />
              </div>

              {searchMatches.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-medium bg-white rounded-xl border border-slate-200">
                  {searchTerm.trim() ? "No matches found." : "Enter a search term above."}
                </div>
              ) : (
                <div className="space-y-2">
                  {searchMatches.map((match, mIdx) => (
                    <div
                      key={mIdx}
                      onClick={() => {
                        setActivePage(match.pageNumber);
                        setActiveTab("page");
                      }}
                      className="p-3 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition-colors cursor-pointer shadow-2xs text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-[11px] text-[#042c51]">
                          Page {match.pageNumber}
                        </span>
                        <span className="text-[10px] text-blue-600 font-bold">Click to view page</span>
                      </div>
                      <p className="font-mono text-slate-700 bg-slate-50 p-1.5 rounded text-[11px]">
                        {match.text}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-slate-50/80 shrink-0">
          <span className="text-[11px] text-slate-500">
            Source Reference: <strong className="text-slate-700">{documentCode} | Rev {revisionNumber}</strong>
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
