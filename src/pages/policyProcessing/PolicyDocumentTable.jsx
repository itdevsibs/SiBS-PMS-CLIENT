import {
  Search,
  Filter,
  RefreshCw,
  FileText,
  Eye,
  RotateCcw,
  AlertCircle,
  FileCheck2,
  FileQuestion,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Upload,
} from "lucide-react";
import TablePagination from "@/components/common/tables/TablePagination";
import { Skeleton } from "@/components/common/ui/Skeleton";

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

function StatusBadge({ status }) {
  const norm = String(status || "Pending").trim();
  switch (norm) {
    case "Ready":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-[#15803D] border border-emerald-200">
          <CheckCircle2 size={12} className="shrink-0" />
          <span>Ready</span>
        </span>
      );
    case "Partial":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-[#B45309] border border-amber-200">
          <AlertTriangle size={12} className="shrink-0" />
          <span>Partial</span>
        </span>
      );
    case "Processing":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-[#1D4ED8] border border-blue-200">
          <Loader2 size={12} className="shrink-0 animate-spin" />
          <span>Processing</span>
        </span>
      );
    case "Failed":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-[#B91C1C] border border-rose-200">
          <AlertCircle size={12} className="shrink-0" />
          <span>Failed</span>
        </span>
      );
    case "Pending":
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-50 text-slate-700 border border-slate-200">
          <FileQuestion size={12} className="shrink-0" />
          <span>Pending</span>
        </span>
      );
  }
}

export default function PolicyDocumentTable({
  documents = [],
  pagination = {},
  loading = false,
  search = "",
  onSearchChange,
  category = "all",
  onCategoryChange,
  status = "all",
  onStatusChange,
  onPageChange,
  onRefresh,
  onViewDetail,
  onPreviewPdf,
  onReprocess,
  onOpenUpload,
  canManage = false,
  processingDocId = null,
}) {
  const categories = [
    { value: "all", label: "All Categories" },
    { value: "Performance Incentive", label: "Performance Incentive" },
    { value: "Operations Policy", label: "Operations Policy" },
    { value: "FrontSteps Policy", label: "FrontSteps Policy" },
    { value: "WFM Standard", label: "WFM Standard" },
  ];

  const statuses = [
    { value: "all", label: "All Extraction States" },
    { value: "Ready", label: "Ready" },
    { value: "Partial", label: "Partial" },
    { value: "Processing", label: "Processing" },
    { value: "Pending", label: "Pending" },
    { value: "Failed", label: "Failed" },
  ];

  return (
    <div className="flex flex-col rounded-xl border border-[#DCE4EE] bg-white shadow-2xs overflow-hidden">
      {/* Header and Toolbar */}
      <div className="border-b border-[#DCE4EE] bg-[#082B60] px-5 py-3.5 text-white flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <FileCheck2 size={20} className="text-[#ff5c28]" />
          <div>
            <h2 className="text-[15px] font-extrabold tracking-wide text-white">
              Policy Knowledge Documents
            </h2>
            <p className="text-[11px] text-slate-300">
              Authoritative business rule PDFs extracted for PMS KPI & governance logic
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          {canManage && onOpenUpload && (
            <button
              type="button"
              onClick={onOpenUpload}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#ff5c28] hover:bg-[#e04818] px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs transition-colors cursor-pointer"
            >
              <Upload size={14} />
              <span>Upload Policy</span>
            </button>
          )}

          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-md bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-1.5 text-xs font-bold text-white transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh documents list"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="p-4 border-b border-[#DCE4EE] bg-[#F8FAFC] flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-1 w-full md:w-auto items-center gap-3">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by code, title, or filename..."
              className="w-full rounded-lg border border-[#DCE4EE] bg-white pl-9 pr-3 py-2 text-xs text-[#14233F] placeholder-slate-400 focus:border-[#082B60] focus:ring-1 focus:ring-[#082B60] outline-none transition-all"
            />
          </div>

          {/* Category filter */}
          <div className="relative">
            <select
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="appearance-none rounded-lg border border-[#DCE4EE] bg-white pl-3 pr-8 py-2 text-xs font-medium text-[#14233F] focus:border-[#082B60] outline-none cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <Filter
              size={12}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>

          {/* Status filter */}
          <div className="relative">
            <select
              value={status}
              onChange={(e) => onStatusChange(e.target.value)}
              className="appearance-none rounded-lg border border-[#DCE4EE] bg-white pl-3 pr-8 py-2 text-xs font-medium text-[#14233F] focus:border-[#082B60] outline-none cursor-pointer"
            >
              {statuses.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <Filter
              size={12}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium self-end md:self-auto shrink-0">
          Showing {documents.length} of {pagination.total || documents.length} documents
        </div>
      </div>

      {/* Table container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#F0F3F7] text-[11px] font-extrabold text-[#14233F] border-b border-[#DCE4EE]">
              <th className="py-3 px-4">Document Details</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4 text-center">Version</th>
              <th className="py-3 px-4 text-center">Pages</th>
              <th className="py-3 px-4 text-center">Extraction Status</th>
              <th className="py-3 px-4">Uploaded At</th>
              <th className="py-3 px-4">Last Processed</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DCE4EE] bg-white text-[12px]">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="h-16">
                  <td className="py-3 px-4">
                    <Skeleton className="h-4 w-40 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </td>
                  <td className="py-3 px-4">
                    <Skeleton className="h-4 w-28" />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Skeleton className="h-5 w-14 mx-auto rounded" />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Skeleton className="h-4 w-10 mx-auto" />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Skeleton className="h-6 w-20 mx-auto rounded-full" />
                  </td>
                  <td className="py-3 px-4">
                    <Skeleton className="h-4 w-24" />
                  </td>
                  <td className="py-3 px-4">
                    <Skeleton className="h-4 w-24" />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Skeleton className="h-7 w-28 ml-auto rounded" />
                  </td>
                </tr>
              ))
            ) : documents.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500">
                  <FileQuestion size={36} className="mx-auto mb-2 text-slate-400" />
                  <p className="text-sm font-bold text-slate-700">No policy documents found</p>
                  <p className="text-xs text-slate-500 mt-1">
                    No approved policy PDFs match the current search or filter criteria.
                  </p>
                </td>
              </tr>
            ) : (
              documents.map((doc) => {
                const isItemProcessing =
                  processingDocId === doc.id || doc.processing_status === "Processing";

                return (
                  <tr
                    key={doc.id}
                    className="hover:bg-[#F4F6F9]/60 transition-colors"
                  >
                    {/* Document Details */}
                    <td className="py-3 px-4 max-w-xs">
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded bg-blue-50 text-[#12376B] shrink-0 border border-blue-100">
                          <FileText size={15} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold text-[#14233F] truncate">
                              {doc.policy_title || doc.file_name}
                            </span>
                            {doc.document_code && (
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200">
                                {doc.document_code}
                              </span>
                            )}
                          </div>
                          <span className="block text-[11px] text-slate-500 truncate mt-0.5">
                            {doc.file_name}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-medium text-[#14233F]">
                        {doc.policy_category || "Standard Policy"}
                      </span>
                    </td>

                    {/* Version */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        Rev {doc.revision_number || "000"}
                      </span>
                    </td>

                    {/* Total Pages */}
                    <td className="py-3 px-4 text-center whitespace-nowrap font-medium text-slate-700">
                      {doc.total_pages ? (
                        <span>{doc.total_pages} {doc.total_pages === 1 ? "page" : "pages"}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Processing Status */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <StatusBadge status={doc.processing_status} />
                    </td>

                    {/* Upload Date */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-medium">
                      {formatTimestamp(doc.created_at)}
                    </td>

                    {/* Last Processed */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-medium">
                      {formatTimestamp(doc.last_processed_at)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        {/* Inspect Details Button */}
                        <button
                          type="button"
                          onClick={() => onViewDetail(doc)}
                          className="inline-flex items-center gap-1 rounded-md border border-[#DCE4EE] bg-white hover:bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-[#082B60] transition-colors cursor-pointer shadow-2xs"
                          title="Inspect extracted pages, formulas, rules & audit logs"
                        >
                          <Eye size={13} className="text-[#082B60]" />
                          <span>Inspect</span>
                        </button>

                        {/* Preview PDF */}
                        <button
                          type="button"
                          onClick={() => onPreviewPdf(doc)}
                          className="inline-flex items-center gap-1 rounded-md border border-[#DCE4EE] bg-white hover:bg-slate-50 px-2 py-1 text-[11px] font-bold text-slate-700 transition-colors cursor-pointer shadow-2xs"
                          title="Preview original PDF"
                        >
                          <FileText size={13} className="text-[#ff5c28]" />
                          <span>PDF</span>
                        </button>

                        {/* Reprocess Document */}
                        {canManage && (
                          <button
                            type="button"
                            onClick={() => onReprocess(doc.id)}
                            disabled={isItemProcessing}
                            className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[11px] font-bold transition-colors cursor-pointer shadow-2xs ${
                              isItemProcessing
                                ? "border-blue-200 bg-blue-50 text-blue-600 cursor-not-allowed"
                                : "border-[#12376B]/30 bg-[#12376B]/5 text-[#12376B] hover:bg-[#12376B]/15"
                            }`}
                            title="Reprocess PDF text extraction & formula indexing"
                          >
                            <RotateCcw
                              size={12}
                              className={isItemProcessing ? "animate-spin" : ""}
                            />
                            <span>{isItemProcessing ? "Processing" : "Reprocess"}</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination.totalPages > 1 && (
        <div className="p-3 border-t border-[#DCE4EE] bg-[#F8FAFC]">
          <TablePagination
            currentPage={pagination.page || 1}
            totalPages={pagination.totalPages || 1}
            totalItems={pagination.total || documents.length}
            pageSize={pagination.limit || 10}
            onPageChange={onPageChange}
            itemLabel="documents"
          />
        </div>
      )}
    </div>
  );
}
