// Professional Recent Ingestion Batches table for WFM dashboard.
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileSpreadsheet,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function WfmRecentBatchesTable({
  batches = [],
  isLoading = false,
}) {
  const navigate = useNavigate();

  const getStatusBadge = (status) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9.5px] font-extrabold text-emerald-700 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            COMPLETED
          </span>
        );
      case "COMPLETED_WITH_ERRORS":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[9.5px] font-extrabold text-amber-700 border border-amber-200">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            WITH ISSUES
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[9.5px] font-extrabold text-rose-700 border border-rose-200">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            FAILED
          </span>
        );
      case "VALIDATING":
      case "IMPORTING":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[9.5px] font-extrabold text-sky-700 border border-sky-200 animate-pulse">
            <Clock3 className="h-2.5 w-2.5" />
            PROCESSING
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[9.5px] font-bold text-slate-600 border border-slate-200">
            {status || "UPLOADED"}
          </span>
        );
    }
  };

  return (
    <article className="rounded-xl border border-slate-200/90 bg-white relative z-10 flex flex-col h-full shadow-2xs overflow-hidden">
      {/* Clean Header */}
      <div className="border-b border-slate-100 bg-slate-50/50 px-4 py-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <FileSpreadsheet size={14} className="text-slate-500 shrink-0" />
          <h3 className="m-0 text-xs sm:text-[13px] font-bold text-slate-800">
            Recent Batches
          </h3>
        </div>

        <button
          type="button"
          onClick={() => navigate("/dashboard/wfm/import-data")}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-sibs-primary-1 hover:text-sibs-primary-2 cursor-pointer transition-colors"
        >
          <span>View All</span>
          <ArrowRight size={11} />
        </button>
      </div>

      {/* Content Body */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between overflow-x-auto">
        {isLoading ? (
          <div className="space-y-2 py-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 rounded-lg bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : batches.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400">
            <FileSpreadsheet className="mx-auto mb-1.5 h-6 w-6 text-slate-300" />
            No import batch runs recorded in the database yet.
          </div>
        ) : (
          <div className="w-full overflow-x-auto sibs-scrollbar">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="pb-2 pr-3">Batch</th>
                  <th className="pb-2 px-3">Feed / Profile</th>
                  <th className="pb-2 px-3">File</th>
                  <th className="pb-2 px-3">Records (Valid / Total)</th>
                  <th className="pb-2 px-3 text-center">Status</th>
                  <th className="pb-2 pl-3 text-right">Uploaded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {batches.slice(0, 5).map((batch) => (
                  <tr
                    key={batch.id || batch.batchCode}
                    className="group hover:bg-slate-50/80 transition-colors"
                  >
                    {/* Batch Code */}
                    <td className="py-2.5 pr-3 font-mono font-bold text-[10.5px] text-slate-700 whitespace-nowrap">
                      {batch.batchCode}
                    </td>

                    {/* Profile */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="font-semibold text-slate-800 text-[11.5px]">
                        {batch.importProfileName || batch.sourceSystem || "Raw Data"}
                      </span>
                    </td>

                    {/* Filename */}
                    <td
                      className="py-2.5 px-3 max-w-[150px] truncate text-slate-500 font-medium text-[11px]"
                      title={batch.sourceFilename}
                    >
                      {batch.sourceFilename || "upload.xlsx"}
                    </td>

                    {/* Records Count */}
                    <td className="py-2.5 px-3 whitespace-nowrap text-[11px]">
                      <span className="font-bold text-slate-800">
                        {Number(batch.validRows || 0).toLocaleString()}
                      </span>
                      <span className="text-slate-400 font-normal">
                        {" / "}
                        {Number(batch.totalRows || 0).toLocaleString()}
                      </span>
                      {Number(batch.invalidRows || 0) > 0 && (
                        <span className="ml-1 text-[9.5px] font-bold text-rose-500">
                          ({batch.invalidRows} err)
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {getStatusBadge(batch.status)}
                    </td>

                    {/* Time */}
                    <td className="py-2.5 pl-3 text-right text-slate-400 text-[10.5px] whitespace-nowrap">
                      {batch.formattedTime || (batch.createdAt ? new Date(batch.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer info */}
        <div className="pt-2.5 mt-2 border-t border-slate-100 flex items-center justify-end text-xs">
          <button
            type="button"
            onClick={() => navigate("/dashboard/wfm/import-data")}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-sibs-primary-1 hover:text-sibs-primary-2 cursor-pointer transition-colors"
          >
            <span>Batch Details & Logs</span>
            <ArrowRight size={11} />
          </button>
        </div>
      </div>
    </article>
  );
}
