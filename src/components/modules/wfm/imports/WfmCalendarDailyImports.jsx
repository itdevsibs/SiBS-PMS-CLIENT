import { AlertCircle, ChevronLeft, ChevronRight, Eye, FileSpreadsheet, FolderOpen, Trash2 } from "lucide-react";
import { getImportDisplayStatus } from "@/lib/wfm-import-utils";
import { getRepositoryToolForUpload } from "@/lib/wfm-import-repository-tools";
import WfmRepositoryReportTypeBadge from "./WfmRepositoryReportTypeBadge";

export default function WfmCalendarDailyImports({ date, uploads = [], pagination = {}, loading, error, onPageChange, onView, onRaw, onRemove }) {
  const label = date ? new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`)) : "Choose a day";
  return <section className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs" aria-label="Imports for selected calendar date">
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3.5 sm:px-5">
      <div><h3 className="m-0 text-sm font-bold text-sibs-primary-1">{label}</h3><p className="m-0 mt-1 text-xs text-slate-500">Files uploaded on this date · {pagination.total || 0} batch(es)</p></div>
    </div>
    {error ? <p role="alert" className="flex items-center gap-1 px-5 py-4 text-xs text-rose-700"><AlertCircle className="h-4 w-4"/>{error}</p> : null}
    {loading ? <p className="px-5 py-8 text-sm text-slate-500">Loading daily imports...</p> : !uploads.length ? <div className="px-5 py-12 text-center text-sm text-slate-500"><FolderOpen className="mx-auto mb-2 h-7 w-7 text-slate-300"/>No import batches found for this date and the current filters.</div> : <div className="divide-y divide-slate-100">
      {uploads.map((upload) => {
        const display = getImportDisplayStatus(upload);
        const tone = display.tone === "danger" ? "bg-rose-50 text-rose-700 border-rose-200" : display.tone === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200";
        return <article key={upload.batchId || upload.id} className="flex flex-col gap-3 px-4 py-3.5 transition hover:bg-slate-50/60 lg:flex-row lg:items-center lg:justify-between sm:px-5">
          <div className="min-w-0 flex-1"><div className="flex items-start gap-2"><FileSpreadsheet className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"/><div className="min-w-0"><p className="m-0 break-all text-xs font-bold text-sibs-primary-1 sm:text-sm">{upload.fileName || "Unnamed import"}</p><div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500"><WfmRepositoryReportTypeBadge upload={upload} /><span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-700">{getRepositoryToolForUpload(upload) === "Other" ? (upload.sourceSystem || "Unknown tool") : getRepositoryToolForUpload(upload)}</span><span>{Number(upload.totalRows || 0).toLocaleString()} rows</span></div><p className="mt-1 text-[10px] text-slate-500">{upload.batchCode || `Batch #${upload.batchId}`}</p></div></div></div>
          <div className="flex flex-wrap items-center gap-2"><span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${tone}`}>{display.label}</span><button type="button" onClick={() => onView(upload)} className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"><Eye className="h-3.5 w-3.5"/>View</button><button type="button" disabled={!upload.batchId || display.status === "FAILED"} onClick={() => onRaw(upload)} className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"><FileSpreadsheet className="h-3.5 w-3.5"/>Raw</button><button type="button" onClick={() => onRemove(upload)} className="inline-flex h-8 items-center gap-1 rounded-lg border border-rose-200 px-3 text-xs font-semibold text-rose-700 hover:bg-rose-50"><Trash2 className="h-3.5 w-3.5"/>Remove</button></div>
        </article>;
      })}
    </div>}
    {(pagination.totalPages || 1) > 1 ? <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-600"><button aria-label="Previous page" disabled={loading || pagination.page <= 1} onClick={() => onPageChange(pagination.page - 1)} className="rounded border border-slate-200 p-1.5 disabled:opacity-30"><ChevronLeft className="h-4 w-4"/></button>{pagination.page} / {pagination.totalPages}<button aria-label="Next page" disabled={loading || pagination.page >= pagination.totalPages} onClick={() => onPageChange(pagination.page + 1)} className="rounded border border-slate-200 p-1.5 disabled:opacity-30"><ChevronRight className="h-4 w-4"/></button></div> : null}
  </section>;
}
