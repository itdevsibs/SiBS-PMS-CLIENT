import { useMemo, useState } from "react";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import AppModal from "@/components/ui/app-modal";
import { Button } from "@/components/ui/button";
import SingleSelectDropdown from "@/components/ui/Filter/SingleSelectDropdown";
import {
  formatRelativeTime,
  getBatchCategory,
  getPageNumbers,
} from "@/lib/wfm-import-utils";

const REJECTED_LEVEL_ORDER = [
  "SERVICE / QUEUE LEVEL",
  "AGENT LEVEL",
  "AGENT OCCUPANCY",
  "EMAIL LEVEL",
  "QUALITY AUDIT",
];

function getRejectedLevelDisplayLabel(level) {
  if (level === "ALL LEVEL" || level === "ALL") return "ALL LEVEL";
  return level === "EMAIL LEVEL" ? "EMAIL RAW DATA" : level;
}

export default function WfmRejectedModal({
  isOpen,
  onClose,
  uploadsByCard = {},
  selectedAccount = "All Accounts",
  isLoadingUsVisaErrors = false,
  handleOpenUsVisaErrors,
  handleOpenBatchDetails,
  setUploadToRemove,
}) {
  const [rejectedDataSearch, setRejectedDataSearch] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("ALL LEVEL");
  const [rejectedPage, setRejectedPage] = useState(1);
  const REJECTED_PAGE_SIZE = 5;

  const rejectedBatches = useMemo(() => {
    const allUploads = Object.values(uploadsByCard).flat();
    const seen = new Set();

    return allUploads
      .filter((upload) => {
        if (selectedAccount !== "All Accounts" && upload.account !== selectedAccount) {
          return false;
        }

        const isRejected =
          Number(upload.invalidRows || 0) > 0 ||
          upload.batchStatus === "FAILED" ||
          upload.status === "FAILED";

        if (!isRejected) return false;

        const key =
          upload.batchId ||
          upload.batchCode ||
          upload.id ||
          `${upload.fileName}-${upload.uploadedAtMs || upload.uploadedAt}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => (b.uploadedAtMs || 0) - (a.uploadedAtMs || 0));
  }, [uploadsByCard, selectedAccount]);

  const defaultRejectedLevel = "ALL LEVEL";
  const activeRejectedLevel = selectedLevel || defaultRejectedLevel;

  const filteredRejectedBatches = useMemo(() => {
    const query = rejectedDataSearch.trim().toLowerCase();
    if (!query) return rejectedBatches;
    return rejectedBatches.filter(
      (b) =>
        b.fileName?.toLowerCase().includes(query) ||
        b.rawDataTitle?.toLowerCase().includes(query) ||
        b.batchCode?.toLowerCase().includes(query) ||
        b.account?.toLowerCase().includes(query),
    );
  }, [rejectedBatches, rejectedDataSearch]);

  const levelCounts = useMemo(() => {
    const counts = {
      "SERVICE / QUEUE LEVEL": 0,
      "AGENT LEVEL": 0,
      "AGENT OCCUPANCY": 0,
      "EMAIL LEVEL": 0,
      "QUALITY AUDIT": 0,
    };
    for (const batch of filteredRejectedBatches) {
      const cat = getBatchCategory(batch);
      if (counts[cat] !== undefined) {
        counts[cat] += 1;
      }
    }
    return counts;
  }, [filteredRejectedBatches]);

  const rejectedLevelDropdownOptions = useMemo(() => {
    return [
      {
        value: "ALL LEVEL",
        label: `ALL LEVEL (${filteredRejectedBatches.length})`,
      },
      {
        value: "SERVICE / QUEUE LEVEL",
        label: `SERVICE / QUEUE LEVEL (${levelCounts["SERVICE / QUEUE LEVEL"] || 0})`,
      },
      {
        value: "AGENT LEVEL",
        label: `AGENT LEVEL (${levelCounts["AGENT LEVEL"] || 0})`,
      },
      {
        value: "AGENT OCCUPANCY",
        label: `AGENT OCCUPANCY (${levelCounts["AGENT OCCUPANCY"] || 0})`,
      },
      {
        value: "EMAIL LEVEL",
        label: `EMAIL RAW DATA (${levelCounts["EMAIL LEVEL"] || 0})`,
      },
      {
        value: "QUALITY AUDIT",
        label: `QUALITY AUDIT (${levelCounts["QUALITY AUDIT"] || 0})`,
      },
    ];
  }, [filteredRejectedBatches.length, levelCounts]);

  const targetRejectedBatches = useMemo(() => {
    if (activeRejectedLevel === "ALL LEVEL" || activeRejectedLevel === "ALL") {
      return filteredRejectedBatches;
    }
    return filteredRejectedBatches.filter(
      (b) => getBatchCategory(b) === activeRejectedLevel,
    );
  }, [filteredRejectedBatches, activeRejectedLevel]);

  const rejectedTotalPages = useMemo(() => {
    return Math.max(
      1,
      Math.ceil(targetRejectedBatches.length / REJECTED_PAGE_SIZE),
    );
  }, [targetRejectedBatches.length]);

  const pagedRejectedBatches = useMemo(() => {
    const startIndex = (rejectedPage - 1) * REJECTED_PAGE_SIZE;
    return targetRejectedBatches.slice(
      startIndex,
      startIndex + REJECTED_PAGE_SIZE,
    );
  }, [targetRejectedBatches, rejectedPage]);

  const displayedRejectedGroups = useMemo(() => {
    return [
      {
        label: getRejectedLevelDisplayLabel(activeRejectedLevel),
        batches: pagedRejectedBatches,
        totalCount: targetRejectedBatches.length,
      },
    ];
  }, [activeRejectedLevel, pagedRejectedBatches, targetRejectedBatches.length]);

  const handleClose = () => {
    setRejectedDataSearch("");
    setSelectedLevel("ALL LEVEL");
    setRejectedPage(1);
    onClose?.();
  };

  return (
    <AppModal
      isOpen={isOpen}
      className="!max-w-none !w-[min(96vw,1320px)] !h-[88vh] !max-h-[88vh] flex flex-col p-4 sm:p-6 md:p-7 overflow-hidden"
    >
      <div className="relative z-20 shrink-0 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-100 text-red-600">
              <XCircle className="h-4 w-4" />
            </span>
            <p
              className="m-0 truncate whitespace-nowrap text-base sm:text-lg md:text-xl font-bold text-slate-900"
              title="Records Rejected Uploaded Data"
            >
              Records Rejected Uploaded Data
            </p>
          </div>
          <p className="mt-1 mb-0 text-xs font-semibold text-sibs-tertiary-5">
            Account: {selectedAccount}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
          {/* Level Filtering Dropdown */}
          <SingleSelectDropdown
            className="w-full sm:w-60"
            buttonClassName="h-9 rounded-full border border-sibs-tertiary-9 bg-white px-3.5 text-xs font-bold text-sibs-primary-1 shadow-2xs"
            value={activeRejectedLevel}
            onChange={(event) => {
              setSelectedLevel(event.target.value);
              setRejectedPage(1);
            }}
            options={rejectedLevelDropdownOptions}
          />

          {/* Search uploaded data */}
          <div className="relative w-full sm:w-72">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sibs-tertiary-6"
              aria-hidden="true"
            />
            <input
              value={rejectedDataSearch}
              onChange={(event) => {
                setRejectedDataSearch(event.target.value);
                setRejectedPage(1);
              }}
              className="h-9 w-full rounded-full border border-sibs-tertiary-9 bg-white pl-9 pr-8 text-xs sm:text-sm outline-none focus:border-red-400"
              placeholder="Search rejected data..."
              type="text"
            />
            {rejectedDataSearch ? (
              <button
                type="button"
                onClick={() => {
                  setRejectedDataSearch("");
                  setRejectedPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-4 flex-1 min-h-0 space-y-6 overflow-x-hidden overflow-y-auto rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 sm:p-5 sibs-scrollbar">
        {targetRejectedBatches.length ? (
          displayedRejectedGroups.map((group) => {
            return (
              <div key={group.label} className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
                  <h3 className="m-0 text-xs font-black uppercase tracking-wider text-slate-700">
                    {group.label}
                  </h3>
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                    {group.totalCount}{" "}
                    {group.totalCount === 1 ? "batch" : "batches"}
                  </span>
                </div>

                {group.batches.length > 0 ? (
                  <div className="space-y-2.5">
                    {group.batches.map((batch) => {
                      const invalidCount = Number(batch.invalidRows || 0);

                      return (
                        <div
                          key={
                            batch.batchId ||
                            batch.id ||
                            `${batch.fileName}-${batch.uploadedAt}`
                          }
                          className="flex flex-col gap-2.5 sm:gap-3 rounded-xl border border-red-200/80 bg-white p-3 sm:p-3.5 shadow-xs transition-all hover:border-red-300 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-1.5 sm:block">
                              <p
                                className="m-0 min-w-0 max-w-full break-words [word-break:break-word] text-sm font-bold text-slate-900 leading-snug"
                                title={batch.fileName}
                              >
                                {batch.fileName}
                              </p>

                              <button
                                type="button"
                                disabled={isLoadingUsVisaErrors}
                                onClick={() => {
                                  handleOpenUsVisaErrors(
                                    batch.batchId || batch.id,
                                  );
                                }}
                                className="sm:hidden inline-flex shrink-0 whitespace-nowrap items-center gap-1 rounded-md border border-red-300 bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-800 transition-all hover:border-red-400 hover:bg-red-100"
                                title="Click to view error details"
                              >
                                <AlertCircle
                                  className="h-2.5 w-2.5 shrink-0 text-red-600"
                                  aria-hidden="true"
                                />
                                <span>
                                  {invalidCount > 0
                                    ? `${invalidCount.toLocaleString()} Rejected`
                                    : "View Errors"}
                                </span>
                              </button>
                            </div>

                            <div className="mt-1 flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-sibs-tertiary-5">
                              <span>
                                {batch.uploadedAt}{" "}
                                ({formatRelativeTime(batch)})
                              </span>

                              {activeRejectedLevel === "ALL LEVEL" ? (
                                <span className="rounded bg-slate-100 border border-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                                  {getRejectedLevelDisplayLabel(getBatchCategory(batch))}
                                </span>
                              ) : null}

                              {batch.batchCode ? (
                                <span className="rounded bg-sibs-primary-2/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-sibs-primary-2">
                                  Batch: {batch.batchCode}
                                </span>
                              ) : null}

                              {batch.totalRows ? (
                                <span className="text-[11px] font-medium text-slate-500">
                                  • {batch.totalRows.toLocaleString()} rows
                                </span>
                              ) : null}

                              {invalidCount > 0 ? (
                                <span className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-50 px-2 py-0.5 text-[10px] font-extrabold text-red-700">
                                  <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
                                  {invalidCount.toLocaleString()} rejected
                                </span>
                              ) : null}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 sm:border-0 sm:pt-0 sm:flex sm:flex-wrap sm:items-center sm:gap-2 sm:shrink-0">
                            <button
                              type="button"
                              disabled={isLoadingUsVisaErrors}
                              onClick={() => {
                                handleOpenUsVisaErrors(
                                  batch.batchId || batch.id,
                                );
                              }}
                              className="hidden sm:inline-flex h-8 shrink-0 whitespace-nowrap items-center gap-1.5 rounded-lg border border-red-300 bg-red-50 px-2.5 text-xs font-semibold text-red-800 transition-all hover:border-red-400 hover:bg-red-100 shadow-xs"
                              title="Click to view error details"
                            >
                              <AlertCircle
                                className="h-3.5 w-3.5 shrink-0 text-red-600"
                                aria-hidden="true"
                              />
                              <span>
                                {invalidCount > 0
                                  ? `${invalidCount.toLocaleString()} Rejected`
                                  : "View Errors"}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                handleOpenBatchDetails(batch);
                              }}
                              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-xs transition-all hover:border-sibs-primary-1 hover:bg-sibs-primary-1 hover:text-white"
                            >
                              <Eye
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                              />
                              <span>View</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setUploadToRemove(batch);
                              }}
                              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50/70 px-3 text-xs font-semibold text-rose-600 shadow-xs transition-all hover:border-rose-600 hover:bg-rose-600 hover:text-white"
                            >
                              <Trash2
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                              />
                              <span>Remove</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200/80 bg-white/60 py-3 text-center text-xs text-sibs-tertiary-5">
                    {group.totalCount > 0
                      ? `No uploads on this page for ${group.label.toLowerCase()}`
                      : `No uploaded data in ${group.label.toLowerCase()}`}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-12 text-center text-sm text-sibs-tertiary-5">
            {rejectedDataSearch
              ? `No uploaded data found matching "${rejectedDataSearch}".`
              : rejectedBatches.length
                ? `No uploaded data with rejected records in ${getRejectedLevelDisplayLabel(activeRejectedLevel).toLowerCase()}.`
                : "No uploaded data with rejected records."}
          </div>
        )}
      </div>

      <div className="mt-5 shrink-0 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center">
          <span className="text-xs text-slate-500 font-medium">
            {targetRejectedBatches.length === 0 ? (
              "Showing 0 uploads"
            ) : (
              <>
                Showing{" "}
                <strong className="font-bold text-slate-800">
                  {(rejectedPage - 1) * REJECTED_PAGE_SIZE + 1}
                </strong>{" "}
                to{" "}
                <strong className="font-bold text-slate-800">
                  {Math.min(
                    rejectedPage * REJECTED_PAGE_SIZE,
                    targetRejectedBatches.length,
                  )}
                </strong>{" "}
                of{" "}
                <strong className="font-bold text-slate-800">
                  {targetRejectedBatches.length}
                </strong>{" "}
                upload{targetRejectedBatches.length === 1 ? "" : "s"}
                {` in ${getRejectedLevelDisplayLabel(activeRejectedLevel)}`}
              </>
            )}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2.5 sm:gap-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={rejectedPage <= 1}
              onClick={() => setRejectedPage(1)}
              title="First Page"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-all hover:border-sibs-primary-1 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              disabled={rejectedPage <= 1}
              onClick={() => setRejectedPage((prev) => Math.max(1, prev - 1))}
              title="Previous Page"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-all hover:border-sibs-primary-1 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            {/* Numbered page buttons: shown on sm+ screens */}
            <div className="hidden sm:flex items-center gap-1 px-1">
              {getPageNumbers(rejectedPage, rejectedTotalPages).map((p, idx) => {
                if (p === "...") {
                  return (
                    <span
                      key={`rejected-ellipsis-${idx}`}
                      className="select-none px-1 text-slate-400 text-xs"
                    >
                      ...
                    </span>
                  );
                }
                const isActivePage = p === rejectedPage;
                return (
                  <button
                    key={`rejected-page-${p}`}
                    type="button"
                    onClick={() => setRejectedPage(p)}
                    className={`inline-flex h-8 min-w-[32px] items-center justify-center rounded-lg px-2 text-xs font-semibold transition-all ${
                      isActivePage
                        ? "bg-red-600 text-white shadow-xs font-bold"
                        : "border border-slate-200 bg-white text-slate-700 hover:border-red-400 hover:bg-red-50/50"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>

            {/* Compact page indicator badge on mobile */}
            <div className="flex sm:hidden items-center px-1.5 text-xs font-medium text-slate-700">
              <span>
                {rejectedPage} / {rejectedTotalPages}
              </span>
            </div>

            <button
              type="button"
              disabled={rejectedPage >= rejectedTotalPages}
              onClick={() =>
                setRejectedPage((prev) => Math.min(rejectedTotalPages, prev + 1))
              }
              title="Next Page"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-all hover:border-sibs-primary-1 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              disabled={rejectedPage >= rejectedTotalPages}
              onClick={() => setRejectedPage(rejectedTotalPages)}
              title="Last Page"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-all hover:border-sibs-primary-1 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="h-10 rounded-lg px-4"
          >
            Close
          </Button>
        </div>
      </div>
    </AppModal>
  );
}
