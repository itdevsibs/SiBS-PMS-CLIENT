import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Database,
  Eye,
  FileSpreadsheet,
  FolderOpen,
  MessageSquare,
  Phone,
  Trash2,
  TrendingUp,
  User,
  X,
} from "lucide-react";
import { formatRelativeTime, getImportDisplayStatus } from "@/lib/wfm-import-utils";
import { getRepositoryReportTypeForUpload, getRepositoryToolForUpload } from "@/lib/wfm-import-repository-tools";
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
      <div className="flex-1 overflow-y-auto sibs-scrollbar p-3 space-y-2.5 bg-slate-50/40">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-sibs-primary-1 border-t-transparent" />
            <p className="mt-2 text-xs font-semibold text-slate-500">Loading imported batches...</p>
          </div>
        ) : !uploads.length ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-12 text-center shadow-2xs">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
              <FolderOpen className="h-5 w-5" />
            </div>
            <p className="mt-2.5 text-xs font-bold text-slate-700">No import batches found</p>
            <p className="mt-0.5 text-[10.5px] text-slate-400">No uploads recorded for this date under current filters.</p>
          </div>
        ) : (
          uploads.map((upload) => {
            const display = getImportDisplayStatus(upload);
            const isCompleted = display.tone === "success" || display.label?.toLowerCase() === "completed";
            const isPartial = display.tone === "warning" || display.label?.toLowerCase().includes("partial");

            // Accent bar & status tone colors matching mockup
            const borderAccentClass = isCompleted
              ? "border-l-[5px] border-l-emerald-500"
              : isPartial
              ? "border-l-[5px] border-l-amber-500"
              : "border-l-[5px] border-l-rose-500";

            const reportType = getRepositoryReportTypeForUpload(upload);
            const isChat = reportType?.toLowerCase().includes("chat");
            const isCall = reportType?.toLowerCase().includes("call");
            const isOccupancy = reportType?.toLowerCase().includes("occupancy");

            return (
              <article
                key={upload.batchId || upload.id}
                className={`group relative flex flex-col gap-2.5 rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-xs transition-all duration-200 hover:border-slate-300 hover:shadow-sm ${borderAccentClass}`}
              >
                {/* Top Row: Excel icon, File Title, and Status Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* Sheet Green Badge (FileSpreadsheet logo) */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 shadow-2xs">
                      <FileSpreadsheet className="h-5.5 w-5.5 text-emerald-700" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        className="m-0 truncate text-sm font-bold text-sibs-primary-1 leading-snug"
                        title={upload.fileName}
                      >
                        {upload.fileName || "Unnamed import"}
                      </p>

                      {upload.importNote ? (
                        <p className="mt-1 line-clamp-2 text-xs text-slate-600" title={upload.importNote}>
                          <MessageSquare className="mr-1 inline h-3.5 w-3.5 text-slate-400" />{upload.importNote}
                        </p>
                      ) : null}

                      {/* Subtitle row: Calendar icon, Relative time, Exact timestamp, Divider, User icon, Uploader (Kronos ID) */}
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1.5 text-slate-500">
                          <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{formatRelativeTime(upload)} • {upload.uploadedAt}</span>
                        </span>

                        {(upload.uploaderName || upload.uploaderEmpId || upload.uploadedBy) ? (
                          <>
                            <span className="text-slate-300 font-light">|</span>
                            <span className="inline-flex items-center gap-1.5 font-medium text-slate-600">
                              <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span className="font-bold text-slate-800 uppercase">{upload.uploaderName || "Unknown"}</span>
                              <span className="text-slate-500 font-mono text-[11px]">({upload.uploaderEmpId || upload.uploadedBy || "—"})</span>
                            </span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Status Pill Badge (with Clock icon for Partial, CheckCircle2 for Completed, AlertCircle for Failed) */}
                  <span
                    className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold tracking-tight border shadow-2xs ${
                      isCompleted
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : isPartial
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    ) : isPartial ? (
                      <Clock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    ) : (
                      <AlertCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                    )}
                    <span>{isCompleted ? "Completed" : isPartial ? "Partially Imported" : display.label}</span>
                  </span>
                </div>

                {/* Bottom Row: Metadata Chips (Batch, Category, Tool, Rows) and Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
                  {/* Chips: Batch, Level Badge with icon, Tool, Rows */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {upload.batchCode ? (
                      <span className="inline-block rounded-md bg-rose-50 border border-rose-200/80 px-2 py-0.5 font-mono text-[10.5px] font-bold text-rose-600">
                        Batch: {upload.batchCode}
                      </span>
                    ) : null}

                    {/* Report Level badge with corresponding icon */}
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-xs font-bold text-sky-800">
                      {isChat ? (
                        <MessageSquare className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                      ) : isCall ? (
                        <Phone className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                      ) : isOccupancy ? (
                        <TrendingUp className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                      ) : null}
                      <span>{reportType}</span>
                    </span>

                    {/* Tool Tag */}
                    <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-700">
                      {getRepositoryToolForUpload(upload) === "Other"
                        ? upload.sourceSystem || "Tool"
                        : getRepositoryToolForUpload(upload)}
                    </span>

                    {/* Total Rows with Database icon */}
                    {upload.totalRows ? (
                      <span className="inline-flex items-center gap-1.5 font-semibold text-slate-600 text-xs">
                        <Database className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{Number(upload.totalRows).toLocaleString()} rows</span>
                      </span>
                    ) : null}
                  </div>

                  {/* Right Action buttons bar: View, Raw, Remove with divider styling matching mockup */}
                  <div className="flex items-center gap-1.5 shrink-0 ml-auto pl-2 border-l border-slate-200/60">
                    <button
                      type="button"
                      onClick={() => onView(upload)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition active:scale-95 cursor-pointer"
                      title="View batch details"
                    >
                      <Eye className="h-3.5 w-3.5 text-slate-500" />
                      <span>View</span>
                    </button>

                    <button
                      type="button"
                      disabled={!upload.batchId || display.status === "FAILED"}
                      onClick={() => onRaw(upload)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition active:scale-95 cursor-pointer"
                      title="View raw spreadsheet"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Raw</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onRemove(upload)}
                      className="inline-flex h-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50/60 px-2.5 text-rose-600 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition active:scale-95 cursor-pointer"
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
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/80 px-3 py-1.5 text-[11px] text-slate-600 mt-auto">
          <span>Page {pagination.page} of {pagination.totalPages}</span>
          <div className="flex items-center gap-1">
            <button
              aria-label="Previous page"
              disabled={loading || pagination.page <= 1}
              onClick={() => onPageChange(pagination.page - 1)}
              className="rounded border border-slate-200 p-1 hover:bg-white disabled:opacity-30 transition"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              aria-label="Next page"
              disabled={loading || pagination.page >= pagination.totalPages}
              onClick={() => onPageChange(pagination.page + 1)}
              className="rounded border border-slate-200 p-1 hover:bg-white disabled:opacity-30 transition"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
