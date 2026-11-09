import { useState, useEffect } from "react";
import {
  AlertCircle,
  Calendar,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Database,
  Eye,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  MessageSquare,
  MoreHorizontal,
  Phone,
  Trash2,
  TrendingUp,
  User,
  X,
} from "lucide-react";
import AppModal from "@/components/common/ui/AppModal";
import { formatRelativeTime, getImportDisplayStatus } from "@/lib/wfm-import-utils";
import { getRepositoryReportTypeForUpload, getRepositoryToolForUpload } from "@/lib/wfm-import-repository-tools";
import { formatWfmImportReportingDate } from "@/lib/wfm-import-reporting-dates";
import WfmRepositoryReportTypeBadge from "./WfmRepositoryReportTypeBadge";

export default function WfmCalendarDailyImports({
  date,
  uploads = [],
  pagination = {},
  loading,
  error,
  onPageChange,
  onView,
  onRaw,
  onRemove,
  onClose,
}) {
  const [noteModalUpload, setNoteModalUpload] = useState(null);
  const [openActionMenuId, setOpenActionMenuId] = useState(null);

  // Close actions dropdown on outside click or Esc
  useEffect(() => {
    if (!openActionMenuId) return;
    const handleOutsideClick = (e) => {
      if (!e.target.closest('[data-drawer-actions="true"]')) {
        setOpenActionMenuId(null);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setOpenActionMenuId(null);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openActionMenuId]);

  const formattedDate = date
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(`${date}T12:00:00Z`))
    : "";

  return (
    <section
      className="flex flex-col h-full overflow-hidden bg-white"
      aria-label="Imports for selected calendar date"
    >
      <div className="flex items-center justify-between gap-3 border-b border-sky-100/80 px-5 py-4 bg-gradient-to-r from-sky-50/90 via-sky-50/50 to-white">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-sky-600 border border-sky-200 shadow-2xs">
              <FileSpreadsheet className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h3 className="m-0 text-base font-bold text-sibs-primary-1 truncate leading-tight">
                Data imported on {formattedDate || "selected date"}
              </h3>
              <p className="m-0 mt-0.5 text-xs text-slate-500 font-medium">
                Files uploaded on this date · <span className="font-bold text-sky-700">{pagination.total || 0}</span> {(pagination.total || 0) === 1 ? "file imported" : "files imported"}
              </p>
            </div>
          </div>
        </div>

        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-sky-200/80 bg-white/80 text-slate-500 hover:bg-white hover:text-slate-800 hover:border-sky-300 shadow-2xs transition cursor-pointer"
            aria-label="Close daily imports panel"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="flex items-center gap-1 px-4 py-2.5 text-xs text-rose-700 bg-rose-50/70 border-b border-rose-100">
          <AlertCircle className="h-3.5 w-3.5 shrink-0"/>{error}
        </p>
      ) : null}

      {/* Main Drawer Cards View - Intact within drawer, non-horizontally-scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto sibs-scrollbar p-3.5 sm:p-4 space-y-3 bg-slate-50/50">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0b3b68] border-t-transparent" />
            <p className="mt-2 text-xs font-semibold text-slate-500">Loading imported batches...</p>
          </div>
        ) : !uploads.length ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center shadow-xs">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
              <FolderOpen className="h-5 w-5" />
            </div>
            <p className="mt-2.5 text-xs font-bold text-slate-700">No import batches found</p>
            <p className="mt-0.5 text-[11px] text-slate-400">No uploads recorded for this date under current filters.</p>
          </div>
        ) : (
          uploads.map((upload) => {
            const recordId = upload.batchId || upload.id || `${upload.fileName}-${upload.uploadedAt}`;
            const display = getImportDisplayStatus(upload);
            const isCompleted =
              display.tone === "success" ||
              display.label?.toLowerCase() === "completed";
            const isPartial =
              display.tone === "warning" ||
              display.label?.toLowerCase().includes("partial");

            const reportType = getRepositoryReportTypeForUpload(upload);
            const tool =
              getRepositoryToolForUpload(upload) === "Other"
                ? upload.sourceSystem || "—"
                : getRepositoryToolForUpload(upload);

            const reportingDateFrom = formatWfmImportReportingDate(upload.reportDateFrom);
            const reportingDateTo = formatWfmImportReportingDate(upload.reportDateTo);
            const hasCoverage = Boolean(reportingDateFrom || reportingDateTo);

            const rowCount =
              upload.totalRows != null && !Number.isNaN(Number(upload.totalRows))
                ? Number(upload.totalRows).toLocaleString()
                : null;

            return (
              <article
                key={recordId}
                className="relative flex flex-col gap-2.5 rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-[0_2px_12px_rgba(15,47,77,0.03)] transition hover:border-slate-300 hover:shadow-md"
              >
                {/* Row 1: File icon, Title, Status & Actions in compact top row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0b3b68]/10 text-[#0b3b68] shadow-2xs">
                      <FileSpreadsheet className="h-4.5 w-4.5 text-[#0b3b68]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4
                        className="m-0 truncate text-xs sm:text-[13px] font-bold text-slate-900 leading-snug"
                        title={upload.fileName || "Unnamed import"}
                      >
                        {upload.fileName || "Unnamed import"}
                      </h4>
                      {/* Upload metadata subtitle */}
                      <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-slate-500">
                        <span className="inline-flex items-center gap-1.5 text-slate-500">
                          <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{formatRelativeTime(upload)} <span className="text-slate-400">({upload.uploadedAt})</span></span>
                        </span>

                        {(upload.uploaderName || upload.uploaderEmpId || upload.uploadedBy) ? (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="inline-flex items-center gap-1.5 text-slate-600">
                              <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span className="font-semibold text-slate-800">{upload.uploaderName || "Unknown"}</span>
                              {(upload.uploaderEmpId || upload.uploadedBy) && (
                                <span className="text-slate-400 font-mono text-[10.5px]">({upload.uploaderEmpId || upload.uploadedBy})</span>
                              )}
                            </span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Top-Right: Status Badge */}
                  <span
                    className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10.5px] font-bold border shadow-2xs ${
                      isCompleted
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : isPartial
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                    ) : isPartial ? (
                      <Clock className="h-3 w-3 text-amber-600 shrink-0" />
                    ) : (
                      <AlertCircle className="h-3 w-3 text-rose-600 shrink-0" />
                    )}
                    <span>{isCompleted ? "Completed" : display.label}</span>
                  </span>
                </div>

                {/* Row 2: Coverage explicitly with From and To */}
                {hasCoverage && (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-slate-50 border border-slate-100 px-3 py-1.5 text-[11px] text-slate-600">
                    <span className="inline-flex items-center gap-1 font-bold text-[#0b3b68]">
                      <CalendarDays className="h-3.5 w-3.5 text-[#0b3b68] shrink-0" />
                      Coverage:
                    </span>
                    <span>
                      <span className="font-semibold text-slate-400 mr-1">From:</span>
                      <span className="font-bold text-slate-800">{reportingDateFrom || "—"}</span>
                    </span>
                    <span className="text-slate-300">•</span>
                    <span>
                      <span className="font-semibold text-slate-400 mr-1">To:</span>
                      <span className="font-bold text-slate-800">{reportingDateTo || "—"}</span>
                    </span>
                  </div>
                )}

                {/* Row 3: Metadata Pills (Level, Tool, Rows, Batch) & Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    {/* Level Pill */}
                    {reportType && (
                      <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-[11px] font-bold text-[#0b3b68]">
                        {reportType}
                      </span>
                    )}

                    {/* Tool Pill */}
                    {tool && tool !== "—" && (
                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100/80 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
                        {tool}
                      </span>
                    )}

                    {/* Rows */}
                    {rowCount != null && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200/80 bg-white px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                        <Database className="h-3 w-3 text-slate-400 shrink-0" />
                        <span>{rowCount} rows</span>
                      </span>
                    )}

                    {/* Batch code */}
                    {upload.batchCode && (
                      <span className="inline-flex items-center rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-600">
                        Batch: {upload.batchCode}
                      </span>
                    )}
                  </div>

                  {/* Actions: Notes, View, Raw, Delete cleanly aligned inline */}
                  <div className="flex items-center gap-1.5 shrink-0 sm:ml-auto">
                    {upload.importNote ? (
                      <button
                        type="button"
                        onClick={() => setNoteModalUpload(upload)}
                        className="inline-flex h-7.5 items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50/80 px-2.5 text-xs font-bold text-[#0b3b68] shadow-2xs hover:bg-blue-100 hover:border-blue-300 transition active:scale-95 cursor-pointer"
                        title="View notes for this import"
                      >
                        <MessageSquare className="h-3.5 w-3.5 text-[#0b3b68]" />
                        <span>Notes</span>
                      </button>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => onView(upload)}
                      className="inline-flex h-7.5 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:border-[#0b3b68] hover:bg-slate-50 hover:text-[#0b3b68] transition active:scale-95 cursor-pointer"
                      title="View import details"
                    >
                      <Eye className="h-3.5 w-3.5 text-slate-500" />
                      <span>View</span>
                    </button>

                    <button
                      type="button"
                      disabled={!upload.batchId || display.status === "FAILED"}
                      onClick={() => onRaw(upload)}
                      className="inline-flex h-7.5 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-2xs hover:border-emerald-600 hover:bg-emerald-50/60 hover:text-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition active:scale-95 cursor-pointer"
                      title="View raw spreadsheet"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Raw</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onRemove(upload)}
                      className="inline-flex h-7.5 w-7.5 items-center justify-center rounded-lg border border-rose-200 bg-white text-rose-600 shadow-2xs hover:bg-rose-50 hover:border-rose-300 transition active:scale-95 cursor-pointer"
                      title="Remove batch"
                      aria-label="Remove batch"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
      {(pagination.totalPages || 1) > 1 ? (
        <div className="flex items-center justify-between border-t border-slate-100 bg-white px-4 py-2.5 text-xs text-slate-600 mt-auto">
          <span className="font-medium">
            Page <span className="font-bold text-slate-900">{pagination.page}</span> of{" "}
            <span className="font-bold text-slate-900">{pagination.totalPages}</span>
          </span>
          <div className="flex items-center gap-1.5">
            <button
              aria-label="Previous page"
              disabled={loading || pagination.page <= 1}
              onClick={() => onPageChange(pagination.page - 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs hover:border-[#0b3b68] hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              aria-label="Next page"
              disabled={loading || pagination.page >= pagination.totalPages}
              onClick={() => onPageChange(pagination.page + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs hover:border-[#0b3b68] hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      {/* View Notes Modal */}
      <AppModal
        isOpen={Boolean(noteModalUpload)}
        className="!max-w-none w-full sm:!w-[min(94vw,760px)] p-6 sm:p-7 rounded-2xl shadow-2xl border border-slate-200 bg-white"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 border border-sky-200 text-sky-700">
              <MessageSquare className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <h3 className="m-0 text-base font-bold text-slate-900 leading-snug">Import Notes</h3>
              <p className="m-0 text-xs text-slate-500 font-medium truncate max-w-sm" title={noteModalUpload?.fileName}>
                {noteModalUpload?.fileName || "Imported File"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setNoteModalUpload(null)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Written Note / Remarks
          </label>
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5 min-h-[140px]">
            <p className="m-0 text-sm leading-relaxed text-slate-800 whitespace-pre-wrap break-words [word-break:break-word] font-medium">
              {noteModalUpload?.importNote || "No note recorded for this import."}
            </p>
          </div>
        </div>

        {/* Footer info: Uploader and timestamp */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 border-t border-slate-100 pt-3">
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-600">
            <User className="h-3.5 w-3.5 text-slate-400" />
            <span>{noteModalUpload?.uploaderName || "Unknown Uploader"}</span>
          </span>
          <span className="text-slate-400">
            {noteModalUpload?.uploadedAt || ""}
          </span>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={() => setNoteModalUpload(null)}
            className="h-9 rounded-lg bg-[#042c51] px-5 text-xs font-bold text-white hover:bg-[#063d70] transition-colors shadow-2xs cursor-pointer"
          >
            Close
          </button>
        </div>
      </AppModal>
    </section>
  );
}
