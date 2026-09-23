import { useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Search,
} from "lucide-react";
import AppModal from "@/components/ui/app-modal";
import { Button } from "@/components/ui/button";
import { getPageNumbers } from "@/lib/wfm-import-utils";

export default function WfmErrorDetailsModal({
  usVisaErrorDetails,
  usVisaBatchResult,
  errorPagination,
  activeErrorBatchId,
  errorSearchQuery,
  setErrorSearchQuery,
  errorSeverityFilter,
  setErrorSeverityFilter,
  jumpPageInput,
  setJumpPageInput,
  isLoadingUsVisaErrors,
  handleOpenUsVisaErrors,
  onClose,
  errorTableContainerRef,
  handleTablePointerDown,
  handleTablePointerMove,
  handleTablePointerUp,
}) {
  const internalTableContainerRef = useRef(null);
  const tableRef = errorTableContainerRef || internalTableContainerRef;
  const isDraggingTableRef = useRef(false);
  const tableDragStartXRef = useRef(0);
  const tableDragScrollLeftRef = useRef(0);

  const internalPointerDown = (e) => {
    if (e.button !== 0 || e.target.closest("button, input, a, select")) return;
    const el = tableRef.current;
    if (!el || el.scrollWidth <= el.clientWidth + 2) return;
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      // Fallback
    }
    isDraggingTableRef.current = true;
    tableDragStartXRef.current = e.clientX;
    tableDragScrollLeftRef.current = el.scrollLeft;
  };

  const internalPointerMove = (e) => {
    if (!isDraggingTableRef.current) return;
    const el = tableRef.current;
    if (!el) return;
    const dx = e.clientX - tableDragStartXRef.current;
    el.scrollLeft = tableDragScrollLeftRef.current - dx;
  };

  const internalPointerUp = (e) => {
    if (!isDraggingTableRef.current) return;
    isDraggingTableRef.current = false;
    const el = tableRef.current;
    if (el) {
      try {
        if (el.hasPointerCapture(e.pointerId)) {
          el.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Fallback
      }
    }
  };

  const onPointerDown = handleTablePointerDown || internalPointerDown;
  const onPointerMove = handleTablePointerMove || internalPointerMove;
  const onPointerUp = handleTablePointerUp || internalPointerUp;
  const errorShowingStart =
    errorPagination.total === 0
      ? 0
      : (errorPagination.page - 1) * errorPagination.limit + 1;
  const errorShowingEnd = Math.min(
    errorPagination.page * errorPagination.limit,
    errorPagination.total,
  );
  const errorShowingText =
    errorPagination.total === 0
      ? "Showing 0 of 0 errors"
      : `Showing ${errorShowingStart.toLocaleString()} to ${errorShowingEnd.toLocaleString()} of ${errorPagination.total.toLocaleString()} error records`;

  return (
    <AppModal
      isOpen={Boolean(usVisaErrorDetails)}
      className="!max-w-none !w-[min(96vw,1440px)] !h-[90vh] !max-h-[90vh] flex flex-col p-3.5 sm:p-6 overflow-hidden"
      zIndex="z-[160]"
    >
      {/* Header (fixed) */}
      <div className="shrink-0 flex flex-col gap-2.5 sm:gap-3 border-b border-sibs-tertiary-10 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <p className="m-0 text-lg sm:text-xl font-bold text-sibs-primary-1">
              Import Error Details
            </p>
            {errorPagination.total > 0 ? (
              <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700">
                {errorPagination.total.toLocaleString()} issues
              </span>
            ) : null}
          </div>
          <p className="mt-1 mb-0 text-xs text-sibs-tertiary-5 truncate max-w-[85vw] sm:max-w-none">
            Batch:{" "}
            <span className="font-mono font-semibold text-sibs-primary-1">
              {usVisaErrorDetails?.batch?.batchCode ||
                usVisaBatchResult?.batchCode ||
                "-"}
            </span>
            {usVisaErrorDetails?.batch?.sourceFilename ? (
              <span className="ml-1 sm:ml-2 text-slate-400">
                • {usVisaErrorDetails.batch.sourceFilename}
              </span>
            ) : null}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-80 sm:flex-initial">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-sibs-tertiary-6"
              aria-hidden="true"
            />
            <input
              value={errorSearchQuery}
              onChange={(e) => setErrorSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  void handleOpenUsVisaErrors(
                    activeErrorBatchId,
                    1,
                    errorPagination.limit,
                    errorSearchQuery,
                    errorSeverityFilter,
                  );
                }
              }}
              placeholder="Search error, sheet, code, row..."
              className="h-9 w-full rounded-lg border border-sibs-tertiary-9 bg-white pl-8 pr-8 text-xs outline-none focus:border-sibs-primary-2"
              type="text"
            />
            {errorSearchQuery ? (
              <button
                type="button"
                onClick={() => {
                  setErrorSearchQuery("");
                  void handleOpenUsVisaErrors(
                    activeErrorBatchId,
                    1,
                    errorPagination.limit,
                    "",
                    errorSeverityFilter,
                  );
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            ) : null}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-9 shrink-0 rounded-lg px-3.5 sm:px-4 text-xs font-semibold"
          >
            Close
          </Button>
        </div>
      </div>

      {/* Filter Bar (shrink-0) */}
      <div className="shrink-0 mt-2.5 mb-1.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {["ALL", "ERROR", "DUPLICATE", "WARNING", "INFO"].map((sev) => {
            const isActive = errorSeverityFilter === sev;
            return (
              <button
                key={sev}
                type="button"
                onClick={() => {
                  setErrorSeverityFilter(sev);
                  void handleOpenUsVisaErrors(
                    activeErrorBatchId,
                    1,
                    errorPagination.limit,
                    errorSearchQuery,
                    sev,
                  );
                }}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                  isActive
                    ? "bg-sibs-primary-1 text-white shadow-xs"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {sev === "ALL" ? "All Severities" : sev}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() =>
              void handleOpenUsVisaErrors(
                activeErrorBatchId,
                1,
                errorPagination.limit,
                errorSearchQuery,
                errorSeverityFilter,
              )
            }
            className="inline-flex h-7 items-center gap-1 rounded-md bg-sibs-primary-2/10 px-2.5 text-xs font-bold text-sibs-primary-2 hover:bg-sibs-primary-2/20 shrink-0"
          >
            <Search className="h-3 w-3" />
            <span>Search / Filter</span>
          </button>
        </div>
      </div>

      {/* Table Container (flex-1 min-h-0 overflow-x-auto overflow-y-auto) */}
      <div
        ref={tableRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="sibs-scrollbar relative flex-1 min-h-0 mt-1 overflow-x-auto overflow-y-auto rounded-lg border border-sibs-tertiary-10 bg-white cursor-auto lg:cursor-default touch-pan-x touch-pan-y"
        style={{
          WebkitOverflowScrolling: "touch",
        }}
      >
        {isLoadingUsVisaErrors ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-xs">
            <div className="flex items-center gap-2 text-sm font-semibold text-sibs-primary-1">
              <Loader2 className="h-4 w-4 animate-spin text-sibs-primary-1" />
              Loading records...
            </div>
          </div>
        ) : null}

        <table className="w-full min-w-[960px] lg:min-w-0 lg:w-full table-fixed border-collapse text-left text-xs">
          <colgroup className="hidden lg:table-column-group">
            <col style={{ width: "18%" }} />
            <col style={{ width: "7%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "15%" }} />
            <col style={{ width: "13%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "23%" }} />
          </colgroup>
          <colgroup className="lg:hidden">
            <col style={{ width: "130px" }} />
            <col style={{ width: "65px" }} />
            <col style={{ width: "105px" }} />
            <col style={{ width: "160px" }} />
            <col style={{ width: "130px" }} />
            <col style={{ width: "120px" }} />
            <col style={{ width: "250px" }} />
          </colgroup>
          <thead className="sticky top-0 z-5 bg-[#f0f5fa] uppercase text-sibs-tertiary-6 shadow-xs">
            <tr className="border-b border-sibs-tertiary-10">
              <th className="w-[18%] lg:w-auto px-3.5 py-3 font-bold whitespace-nowrap">Sheet</th>
              <th className="w-[7%] lg:w-auto px-2.5 py-3 text-center font-bold whitespace-nowrap">Row</th>
              <th className="w-[12%] lg:w-auto px-3 py-3 font-bold whitespace-nowrap">Severity</th>
              <th className="w-[15%] lg:w-auto px-3 py-3 font-bold whitespace-nowrap">Code</th>
              <th className="w-[13%] lg:w-auto px-3 py-3 font-bold whitespace-nowrap">Column</th>
              <th className="w-[12%] lg:w-auto px-3 py-3 font-bold whitespace-nowrap">Value</th>
              <th className="w-[23%] lg:w-auto px-3.5 py-3 font-bold whitespace-nowrap">Message</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sibs-tertiary-10">
            {usVisaErrorDetails?.data?.length ? (
              usVisaErrorDetails.data.map((error) => {
                const severityUpper = String(error.severity || "").toUpperCase();
                const severityClass =
                  severityUpper === "ERROR"
                    ? "border border-rose-200 bg-rose-50 text-rose-700"
                    : severityUpper === "DUPLICATE" || severityUpper === "WARNING"
                    ? "border border-amber-200 bg-amber-50 text-amber-800"
                    : severityUpper === "INFO"
                      ? "border border-sky-200 bg-sky-50 text-sky-700"
                      : "border border-slate-200 bg-slate-50 text-slate-700";

                return (
                  <tr
                    key={error.id}
                    className="bg-[#f8fbfd] transition-colors hover:bg-sky-50/40"
                  >
                    <td
                      className="truncate px-3.5 py-2.5 font-medium text-sibs-primary-1"
                      title={error.sheetName || "-"}
                    >
                      {error.sheetName || "-"}
                    </td>
                    <td className="px-2.5 py-2.5 text-center font-mono text-[11px] text-sibs-tertiary-5">
                      {error.excelRowNumber || "-"}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10.5px] font-bold ${severityClass}`}
                      >
                        {error.severity || "-"}
                      </span>
                    </td>
                    <td
                      className="truncate px-3 py-2.5 font-mono text-[11px] text-sibs-tertiary-5"
                      title={error.errorCode || "-"}
                    >
                      {error.errorCode || "-"}
                    </td>
                    <td
                      className="truncate px-3 py-2.5 text-sibs-tertiary-5"
                      title={error.columnName || "-"}
                    >
                      {error.columnName || "-"}
                    </td>
                    <td
                      className="truncate px-3 py-2.5 font-mono text-[11px] text-sibs-tertiary-5"
                      title={String(error.rawValue || "")}
                    >
                      {error.rawValue || "-"}
                    </td>
                    <td className="break-words px-3.5 py-2.5 text-[11.5px] leading-relaxed text-sibs-tertiary-5">
                      {error.errorMessage || "-"}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={7}
                  className="bg-[#f8fbfd] px-5 py-16 text-center text-sm text-sibs-tertiary-5"
                >
                  No error details found matching your search or filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer (shrink-0) */}
      <div className="shrink-0 mt-3 flex flex-col gap-2.5 sm:gap-3 border-t border-sibs-tertiary-10 pt-2.5 sm:pt-3 text-xs text-sibs-tertiary-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2 sm:gap-3">
          <span className="font-medium text-slate-600 text-[11px] sm:text-xs">
            {errorShowingText}
          </span>
          <div className="flex items-center gap-1.5 text-slate-500">
            <span className="text-[11px] sm:text-xs">Per page:</span>
            <select
              value={errorPagination.limit}
              onChange={(e) => {
                const newLimit = Number(e.target.value);
                void handleOpenUsVisaErrors(
                  activeErrorBatchId,
                  1,
                  newLimit,
                  errorSearchQuery,
                  errorSeverityFilter,
                );
              }}
              disabled={
                isLoadingUsVisaErrors || errorPagination.total === 0
              }
              className="h-7 rounded border border-slate-200 bg-white px-1.5 text-xs text-slate-700 outline-hidden focus:border-sibs-primary-1"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 sm:gap-2.5">
          {/* Custom Go to Page Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const targetP = Math.min(
                Math.max(1, Number(jumpPageInput) || 1),
                errorPagination.totalPages,
              );
              void handleOpenUsVisaErrors(
                activeErrorBatchId,
                targetP,
                errorPagination.limit,
                errorSearchQuery,
                errorSeverityFilter,
              );
            }}
            className="flex items-center gap-1.5"
          >
            <span className="text-slate-500 text-[11px] sm:text-xs">Go to:</span>
            <input
              type="number"
              min={1}
              max={errorPagination.totalPages}
              value={jumpPageInput}
              onChange={(e) => setJumpPageInput(e.target.value)}
              className="h-7 sm:h-8 w-12 sm:w-14 rounded-lg border border-slate-200 bg-white px-1 text-center text-xs font-semibold text-slate-700 outline-none focus:border-sibs-primary-1"
              placeholder={String(errorPagination.page)}
            />
            <span className="text-slate-400 text-[11px] sm:text-xs">/ {errorPagination.totalPages}</span>
            <button
              type="submit"
              disabled={isLoadingUsVisaErrors || errorPagination.totalPages <= 1}
              className="inline-flex h-7 sm:h-8 items-center rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 transition hover:border-sibs-primary-1 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Go
            </button>
          </form>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={errorPagination.page <= 1 || isLoadingUsVisaErrors}
              onClick={() =>
                void handleOpenUsVisaErrors(
                  activeErrorBatchId,
                  1,
                  errorPagination.limit,
                  errorSearchQuery,
                  errorSeverityFilter,
                )
              }
              title="First Page"
              className="inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-all hover:border-sibs-primary-1 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              disabled={errorPagination.page <= 1 || isLoadingUsVisaErrors}
              onClick={() =>
                void handleOpenUsVisaErrors(
                  activeErrorBatchId,
                  Math.max(1, errorPagination.page - 1),
                  errorPagination.limit,
                  errorSearchQuery,
                  errorSeverityFilter,
                )
              }
              title="Previous Page"
              className="inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-all hover:border-sibs-primary-1 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            {/* Numbered page buttons: shown on sm+ screens */}
            <div className="hidden sm:flex items-center gap-1 px-1">
              {getPageNumbers(
                errorPagination.page,
                errorPagination.totalPages,
              ).map((p, idx) => {
                if (p === "...") {
                  return (
                    <span
                      key={`ellipsis-${idx}`}
                      className="select-none px-1 text-slate-400"
                    >
                      ...
                    </span>
                  );
                }
                const isActivePage = p === errorPagination.page;
                return (
                  <button
                    key={`page-${p}`}
                    type="button"
                    disabled={isLoadingUsVisaErrors}
                    onClick={() =>
                      void handleOpenUsVisaErrors(
                        activeErrorBatchId,
                        p,
                        errorPagination.limit,
                        errorSearchQuery,
                        errorSeverityFilter,
                      )
                    }
                    className={`inline-flex h-8 min-w-[32px] items-center justify-center rounded-lg px-2 text-xs font-semibold transition-all ${
                      isActivePage
                        ? "bg-sibs-primary-1 text-white shadow-xs"
                        : "border border-slate-200 bg-white text-slate-700 hover:border-sibs-primary-1 hover:bg-slate-50"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>

            {/* Compact page indicator badge on mobile */}
            <div className="flex sm:hidden items-center px-1.5 text-xs font-medium text-slate-700">
              <span>{errorPagination.page} / {errorPagination.totalPages}</span>
            </div>

            <button
              type="button"
              disabled={
                errorPagination.page >= errorPagination.totalPages ||
                isLoadingUsVisaErrors
              }
              onClick={() =>
                void handleOpenUsVisaErrors(
                  activeErrorBatchId,
                  Math.min(
                    errorPagination.totalPages,
                    errorPagination.page + 1,
                  ),
                  errorPagination.limit,
                  errorSearchQuery,
                  errorSeverityFilter,
                )
              }
              title="Next Page"
              className="inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-all hover:border-sibs-primary-1 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              disabled={
                errorPagination.page >= errorPagination.totalPages ||
                isLoadingUsVisaErrors
              }
              onClick={() =>
                void handleOpenUsVisaErrors(
                  activeErrorBatchId,
                  errorPagination.totalPages,
                  errorPagination.limit,
                  errorSearchQuery,
                  errorSeverityFilter,
                )
              }
              title="Last Page"
              className="inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-all hover:border-sibs-primary-1 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </AppModal>
  );
}
