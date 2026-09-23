import { useMemo } from "react";
import { AlertTriangle, Eye, Search, Trash2 } from "lucide-react";
import AppModal from "@/components/ui/app-modal";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/wfm-import-utils";

export default function WfmCardUploadsModal({
  activeOpenCard,
  onClose,
  uploadedDataSearch,
  setUploadedDataSearch,
  filteredOpenCardUploads,
  openCardUploads,
  uploadsByCard = {},
  isLoadingUsVisaErrors,
  handleOpenUsVisaErrors,
  handleOpenBatchDetails,
  setUploadToRemove,
}) {
  const cardUploads = useMemo(
    () =>
      openCardUploads ||
      (activeOpenCard ? uploadsByCard[activeOpenCard.id] || [] : []),
    [activeOpenCard, openCardUploads, uploadsByCard],
  );

  const displayedUploads = useMemo(() => {
    if (filteredOpenCardUploads) return filteredOpenCardUploads;
    const searchValue = (uploadedDataSearch || "").trim().toLowerCase();
    if (!searchValue) return cardUploads;
    return cardUploads.filter((upload) =>
      upload.fileName.toLowerCase().includes(searchValue),
    );
  }, [cardUploads, filteredOpenCardUploads, uploadedDataSearch]);
  return (
    <AppModal
      isOpen={Boolean(activeOpenCard)}
      className="!max-w-none w-full sm:!w-[min(92vw,1100px)] flex flex-col p-4 sm:p-6 overflow-hidden max-h-[90vh]"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p
            className="m-0 truncate whitespace-nowrap text-sm sm:text-base md:text-lg font-bold text-sibs-primary-1"
            title={`${activeOpenCard?.title} Uploaded Data`}
          >
            {activeOpenCard?.title} Uploaded Data
          </p>
          <p className="mt-1 mb-0 text-xs font-semibold text-sibs-tertiary-5">
            Account: {activeOpenCard?.account}
          </p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sibs-tertiary-6"
            aria-hidden="true"
          />
          <input
            value={uploadedDataSearch}
            onChange={(event) => setUploadedDataSearch(event.target.value)}
            className="h-9 w-full rounded-full border border-sibs-tertiary-9 bg-white pl-9 pr-8 text-sm outline-none focus:border-sibs-primary-2"
            placeholder="Search uploaded data..."
            type="text"
          />
          {uploadedDataSearch ? (
            <button
              type="button"
              onClick={() => setUploadedDataSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-4 max-h-[65vh] min-h-[260px] sm:min-h-[360px] space-y-2.5 overflow-x-hidden overflow-y-auto rounded-xl border border-slate-200/80 bg-slate-50/50 p-2.5 sm:p-3 sibs-scrollbar">
        {displayedUploads.length ? (
          displayedUploads.map((upload) => {
            const isCompletedWithErrors =
              upload.batchStatus === "COMPLETED_WITH_ERRORS" ||
              (upload.invalidRows > 0 ||
                upload.warningRows > 0 ||
                upload.duplicateRows > 0);

            return (
              <div
                key={upload.id || `${upload.fileName}-${upload.uploadedAt}`}
                className="flex flex-col gap-2.5 sm:gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:p-3.5 shadow-xs transition-all hover:border-slate-300 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-1.5 sm:block">
                    <p
                      className="m-0 min-w-0 max-w-full break-words [word-break:break-word] text-sm font-bold text-sibs-primary-1 leading-snug"
                      title={upload.fileName}
                    >
                      {upload.fileName}
                    </p>
                    {isCompletedWithErrors ? (
                      <button
                        type="button"
                        disabled={isLoadingUsVisaErrors}
                        onClick={() =>
                          handleOpenUsVisaErrors(upload.batchId || upload.id)
                        }
                        className="sm:hidden inline-flex shrink-0 whitespace-nowrap items-center gap-1 rounded-md border border-amber-400 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 transition-all hover:border-amber-500 hover:bg-amber-100"
                        title="Completed with error - click to view error details"
                      >
                        <AlertTriangle className="h-2.5 w-2.5 shrink-0 text-amber-600" aria-hidden="true" />
                        <span>Completed with error</span>
                      </button>
                    ) : null}
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-sibs-tertiary-5">
                    <span>{upload.uploadedAt} ({formatRelativeTime(upload)})</span>
                    {upload.batchCode ? (
                      <span className="rounded bg-sibs-primary-2/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-sibs-primary-2">
                        Batch: {upload.batchCode}
                      </span>
                    ) : null}
                    {upload.totalRows ? (
                      <span className="text-[11px] font-medium text-slate-500">
                        • {upload.totalRows.toLocaleString()} rows
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 sm:border-0 sm:pt-0 sm:flex sm:flex-wrap sm:items-center sm:gap-2 sm:shrink-0">
                  {isCompletedWithErrors ? (
                    <button
                      type="button"
                      disabled={isLoadingUsVisaErrors}
                      onClick={() =>
                        handleOpenUsVisaErrors(upload.batchId || upload.id)
                      }
                      className="hidden sm:inline-flex h-8 shrink-0 whitespace-nowrap items-center gap-1.5 rounded-lg border border-amber-400 bg-amber-50 px-2.5 text-xs font-semibold text-amber-800 transition-all hover:border-amber-500 hover:bg-amber-100 shadow-xs"
                      title="Completed with error - click to view error details"
                    >
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" aria-hidden="true" />
                      <span>Completed with error</span>
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => handleOpenBatchDetails(upload)}
                    className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-xs transition-all hover:border-sibs-primary-1 hover:bg-sibs-primary-1 hover:text-white"
                  >
                    <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>View</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadToRemove(upload)}
                    className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50/70 px-3 text-xs font-semibold text-rose-600 shadow-xs transition-all hover:border-rose-600 hover:bg-rose-600 hover:text-white"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-12 text-center text-sm text-sibs-tertiary-5">
            {cardUploads.length ? "No uploaded data found matching search." : "No uploaded data yet."}
          </div>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between">
        <span className="text-xs text-slate-500">
          Showing {displayedUploads.length} of {cardUploads.length} upload{cardUploads.length === 1 ? "" : "s"}
        </span>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="h-10 rounded-lg px-4"
        >
          Close
        </Button>
      </div>
    </AppModal>
  );
}
