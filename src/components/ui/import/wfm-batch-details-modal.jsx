import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Info,
  ListPlus,
} from "lucide-react";
import AppModal from "@/components/ui/app-modal";
import { Button } from "@/components/ui/button";
import BatchDetailStat from "@/components/ui/import/wfm-batch-detail-stat";
import { formatRelativeTime } from "@/lib/wfm-import-utils";

export default function WfmBatchDetailsModal({
  selectedUploadDetails,
  activeOpenCard,
  isLoadingUsVisaErrors,
  handleOpenUsVisaErrors,
  onOpenRawData,
  onClose,
}) {
  return (
    <AppModal
      isOpen={Boolean(selectedUploadDetails)}
      className="!max-w-none w-full max-w-[94vw] sm:!w-[900px] !p-0 overflow-hidden"
      zIndex="z-[140]"
    >
      <div className="overflow-hidden rounded-2xl bg-white">
        {/* Header */}
        <div className="bg-gradient-to-br from-slate-50 via-white to-sky-50/50 p-4 sm:p-6 border-b border-sibs-tertiary-10">
          {/* Top row: Icon + Details on left, Status badge on right */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3 sm:gap-3.5">
              <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl border border-sky-100 bg-sky-50 text-sky-600 shadow-xs">
                <FileSpreadsheet className="h-5 w-5" aria-hidden="true" />
              </div>

              <div className="min-w-0">
                <p className="m-0 text-[10px] font-extrabold uppercase tracking-[0.08em] text-sibs-tertiary-5">
                  Batch details
                </p>

                {/* Desktop badges shown inline under BATCH DETAILS */}
                <div className="hidden sm:flex items-center gap-2 mt-1.5">
                  <span className="rounded-lg bg-sibs-primary-2/10 px-2.5 py-1 text-[11px] font-extrabold text-sibs-primary-2 whitespace-nowrap">
                    {activeOpenCard?.title || selectedUploadDetails?.rawDataTitle || "Import"}
                  </span>
                  <span className="text-[11px] font-bold text-sibs-tertiary-5 whitespace-nowrap">
                    {activeOpenCard?.account || selectedUploadDetails?.account}
                  </span>
                </div>
              </div>
            </div>

            {/* Status Badge */}
            {selectedUploadDetails?.batchStatus === "COMPLETED_WITH_ERRORS" ||
            (selectedUploadDetails?.invalidRows > 0) ||
            (selectedUploadDetails?.warningRows > 0) ||
            (selectedUploadDetails?.duplicateRows > 0) ? (
              <button
                type="button"
                disabled={isLoadingUsVisaErrors}
                onClick={() =>
                  handleOpenUsVisaErrors(
                    selectedUploadDetails.batchId || selectedUploadDetails.id,
                  )
                }
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-400 bg-amber-50 px-2.5 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-[10.5px] font-semibold text-amber-800 shadow-xs transition-all hover:border-amber-500 hover:bg-amber-100 cursor-pointer"
                title="Completed with error - click to view error details"
              >
                <AlertTriangle className="h-3 w-3 shrink-0 text-amber-600" aria-hidden="true" />
                <span>Completed with error</span>
              </button>
            ) : (
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-[10.5px] font-extrabold uppercase tracking-wide text-emerald-700 shadow-xs">
                <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-600" aria-hidden="true" />
                <span>Completed</span>
              </span>
            )}
          </div>

          {/* Mobile-only badges row: sits under top bar on mobile across full width */}
          <div className="flex sm:hidden items-center gap-2 mt-2.5">
            <span className="rounded-lg bg-sibs-primary-2/10 px-2.5 py-1 text-[10.5px] font-extrabold text-sibs-primary-2 whitespace-nowrap">
              {activeOpenCard?.title || selectedUploadDetails?.rawDataTitle || "Import"}
            </span>
            <span className="text-[10.5px] font-bold text-sibs-tertiary-5 whitespace-nowrap">
              {activeOpenCard?.account || selectedUploadDetails?.account}
            </span>
          </div>

          {/* File Name & Batch Code: full width */}
          <div className="mt-2.5 sm:mt-3 min-w-0 sm:pl-[58px]">
            <p className="m-0 break-words text-sm sm:text-[15px] font-extrabold leading-snug text-sibs-primary-1 [overflow-wrap:anywhere]">
              {selectedUploadDetails?.fileName}
            </p>

            <div className="mt-1.5 sm:mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-sibs-tertiary-5">
              {selectedUploadDetails?.batchCode ? (
                <span className="rounded-md bg-white px-2 py-0.5 font-mono font-semibold text-sibs-primary-2 shadow-xs ring-1 ring-slate-200/70 whitespace-nowrap">
                  {selectedUploadDetails.batchCode}
                </span>
              ) : null}
              <span className="whitespace-nowrap">
                ({formatRelativeTime(selectedUploadDetails)}) {selectedUploadDetails?.uploadedAt}
              </span>
            </div>
          </div>
        </div>

        {/* Metric Stats Cards */}
        <div className="p-4 sm:p-6 bg-white">
          <div className="grid grid-cols-2 gap-2 sm:gap-2.5 sm:grid-cols-6">
            <BatchDetailStat
              label="Total Rows"
              value={selectedUploadDetails?.totalRows}
              icon={FileSpreadsheet}
              tone="blue"
            />
            <BatchDetailStat
              label="Valid Rows"
              value={selectedUploadDetails?.validRows}
              icon={CheckCircle2}
              tone="emerald"
            />
            <BatchDetailStat
              label="Invalid Rows"
              value={selectedUploadDetails?.invalidRows}
              icon={AlertCircle}
              tone="rose"
            />
            <BatchDetailStat
              label="Duplicate Rows"
              value={selectedUploadDetails?.duplicateRows}
              icon={ListPlus}
              tone="orange"
            />
            <BatchDetailStat
              label="Warning Rows"
              value={selectedUploadDetails?.warningRows}
              icon={AlertTriangle}
              tone="amber"
            />
            <BatchDetailStat
              label="Info Rows"
              value={selectedUploadDetails?.infoRows}
              icon={Info}
              tone="cyan"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 pb-4 pt-3 sm:px-6 sm:pb-6 sm:pt-4 border-t border-sibs-tertiary-10 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2">
          {selectedUploadDetails?.batchId &&
          ((selectedUploadDetails.invalidRows || 0) > 0 ||
            (selectedUploadDetails.warningRows || 0) > 0 ||
            (selectedUploadDetails.duplicateRows || 0) > 0) ? (
            <Button
              type="button"
              variant="outline"
              disabled={isLoadingUsVisaErrors}
              onClick={() => handleOpenUsVisaErrors(selectedUploadDetails.batchId)}
              className="h-10 w-full sm:w-auto rounded-xl border-rose-200 bg-rose-50 px-4 text-xs font-bold text-rose-700 shadow-xs hover:border-rose-300 hover:bg-rose-100 hover:text-rose-800"
            >
              <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>
                View Error Details (
                {(
                  (selectedUploadDetails.invalidRows || 0) +
                  (selectedUploadDetails.warningRows || 0) +
                  (selectedUploadDetails.duplicateRows || 0)
                ).toLocaleString()}
                )
              </span>
            </Button>
          ) : null}
          {selectedUploadDetails?.batchId && onOpenRawData ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenRawData(selectedUploadDetails)}
              className="h-10 w-full sm:w-auto rounded-xl border-emerald-300 bg-emerald-50 px-4 text-xs font-bold text-emerald-800 shadow-xs hover:border-emerald-400 hover:bg-emerald-100 hover:text-emerald-900 cursor-pointer"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 shrink-0 text-emerald-700" aria-hidden="true" />
              <span>View Raw Data</span>
            </Button>
          ) : null}
          <Button
            type="button"
            onClick={onClose}
            className="h-10 w-full sm:w-auto rounded-xl bg-sibs-primary-1 px-5 text-xs font-bold text-white shadow-xs hover:bg-sibs-tertiary-4"
          >
            Close
          </Button>
        </div>
      </div>
    </AppModal>
  );
}
