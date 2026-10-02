import { useMemo, useState } from "react";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Copy,
  Eye,
  Search,
  Trash2,
} from "lucide-react";
import AppModal from "@/components/ui/app-modal";
import { Button } from "@/components/ui/button";
import SingleSelectDropdown from "@/components/ui/Filter/SingleSelectDropdown";
import {
  formatRelativeTime,
  getBatchCategory,
  getPageNumbers,
} from "@/lib/wfm-import-utils";

const DUPLICATE_LEVEL_ORDER = [
  "SERVICE / QUEUE LEVEL",
  "AGENT LEVEL",
  "AGENT OCCUPANCY",
  "EMAIL LEVEL",
  "QUALITY AUDIT",
];

function getDuplicateLevelDisplayLabel(level) {
  if (level === "ALL LEVEL" || level === "ALL") return "ALL LEVEL";
  return level === "EMAIL LEVEL" ? "EMAIL RAW DATA" : level;
}

export default function WfmDuplicatesModal({
  isOpen,
  onClose,
  uploadsByCard = {},
  selectedAccount = "All Accounts",
  isLoadingUsVisaErrors = false,
  handleOpenUsVisaErrors,
  handleOpenBatchDetails,
  setUploadToRemove,
}) {
  const [duplicateDataSearch, setDuplicateDataSearch] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("ALL LEVEL");
  const [duplicatePage, setDuplicatePage] = useState(1);
  const DUPLICATE_PAGE_SIZE = 5;

  const duplicateBatches = useMemo(() => {
    const allUploads = Object.values(uploadsByCard).flat();
    const seen = new Set();

    return allUploads
      .filter((upload) => {
        if (selectedAccount !== "All Accounts" && upload.account !== selectedAccount) {
          return false;
        }

        const hasDuplicates = Number(upload.duplicateRows || 0) > 0;
        if (!hasDuplicates) return false;

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

  const defaultDuplicateLevel = "ALL LEVEL";
  const activeDuplicateLevel = selectedLevel || defaultDuplicateLevel;

  const filteredDuplicateBatches = useMemo(() => {
    const query = duplicateDataSearch.trim().toLowerCase();
    if (!query) return duplicateBatches;
    return duplicateBatches.filter(
      (b) =>
        b.fileName?.toLowerCase().includes(query) ||
        b.rawDataTitle?.toLowerCase().includes(query) ||
        b.batchCode?.toLowerCase().includes(query) ||
        b.account?.toLowerCase().includes(query),
    );
  }, [duplicateBatches, duplicateDataSearch]);

  const levelCounts = useMemo(() => {
    const counts = {
      "SERVICE / QUEUE LEVEL": 0,
      "AGENT LEVEL": 0,
      "AGENT OCCUPANCY": 0,
      "EMAIL LEVEL": 0,
      "QUALITY AUDIT": 0,
    };
    for (const batch of filteredDuplicateBatches) {
      const cat = getBatchCategory(batch);
      if (counts[cat] !== undefined) {
        counts[cat] += 1;
      }
    }
    return counts;
  }, [filteredDuplicateBatches]);

  const duplicateLevelDropdownOptions = useMemo(() => {
    return [
      {
        value: "ALL LEVEL",
        label: `ALL LEVEL (${filteredDuplicateBatches.length})`,
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
  }, [filteredDuplicateBatches.length, levelCounts]);

  const targetDuplicateBatches = useMemo(() => {
    if (activeDuplicateLevel === "ALL LEVEL" || activeDuplicateLevel === "ALL") {
      return filteredDuplicateBatches;
    }
    return filteredDuplicateBatches.filter(
      (b) => getBatchCategory(b) === activeDuplicateLevel,
    );
  }, [filteredDuplicateBatches, activeDuplicateLevel]);

  const duplicateTotalPages = useMemo(() => {
    return Math.max(
      1,
      Math.ceil(targetDuplicateBatches.length / DUPLICATE_PAGE_SIZE),
    );
  }, [targetDuplicateBatches.length]);

  const pagedDuplicateBatches = useMemo(() => {
    const startIndex = (duplicatePage - 1) * DUPLICATE_PAGE_SIZE;
    return targetDuplicateBatches.slice(
      startIndex,
      startIndex + DUPLICATE_PAGE_SIZE,
    );
  }, [targetDuplicateBatches, duplicatePage]);

  const displayedDuplicateGroups = useMemo(() => {
    return [
      {
        label: getDuplicateLevelDisplayLabel(activeDuplicateLevel),
        batches: pagedDuplicateBatches,
        totalCount: targetDuplicateBatches.length,
      },
    ];
  }, [activeDuplicateLevel, pagedDuplicateBatches, targetDuplicateBatches.length]);

  const handleClose = () => {
    setDuplicateDataSearch("");
    setSelectedLevel("ALL LEVEL");
    setDuplicatePage(1);
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
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 text-orange-700">
              <Copy className="h-4 w-4" />
            </span>
            <p
              className="m-0 truncate whitespace-nowrap text-base sm:text-lg md:text-xl font-bold text-slate-900"
              title="Duplicates Found Uploaded Data"
            >
              Duplicates Found Uploaded Data
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
            value={activeDuplicateLevel}
            onChange={(event) => {
              setSelectedLevel(event.target.value);
              setDuplicatePage(1);
            }}
            options={duplicateLevelDropdownOptions}
          />

          {/* Search uploaded data */}
          <div className="relative w-full sm:w-72">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sibs-tertiary-6"
              aria-hidden="true"
            />
            <input
              value={duplicateDataSearch}
              onChange={(event) => {
                setDuplicateDataSearch(event.target.value);
                setDuplicatePage(1);
              }}
              className="h-9 w-full rounded-full border border-sibs-tertiary-9 bg-white pl-9 pr-8 text-xs sm:text-sm outline-none focus:border-orange-400"
              placeholder="Search duplicate data..."
              type="text"
            />
            {duplicateDataSearch ? (
              <button
                type="button"
                onClick={() => {
                  setDuplicateDataSearch("");
                  setDuplicatePage(1);
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
        {targetDuplicateBatches.length ? (
          displayedDuplicateGroups.map((group) => {
            return (
              <div key={group.label} className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
                  <h3 className="m-0 text-xs font-black uppercase tracking-wider text-slate-700">
                    {group.label}
                  </h3>
                  <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-800">
                    {group.totalCount}{" "}
                    {group.totalCount === 1 ? "batch" : "batches"}
                  </span>
                </div>

                {group.batches.length > 0 ? (
                  <div className="space-y-2.5">
                    {group.batches.map((batch) => {
                      const duplicateCount = Number(batch.duplicateRows || 0);
                      const hasErrors =
                        batch.batchStatus === "COMPLETED_WITH_ERRORS" ||
                        Number(batch.invalidRows || 0) > 0;

                      return (
                        <div
                          key={
                            batch.batchId ||
                            batch.id ||
                            `${batch.fileName}-${batch.uploadedAt}`
                          }
                          className="flex flex-col gap-2.5 sm:gap-3 rounded-xl border border-orange-200/80 bg-white p-3 sm:p-3.5 shadow-xs transition-all hover:border-orange-300 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-1.5 sm:block">
                              <p
                                className="m-0 min-w-0 max-w-full break-words [word-break:break-word] text-sm font-bold text-slate-900 leading-snug"
                                title={batch.fileName}
                              >
                                {batch.fileName}
                              </p>

                              {duplicateCount > 0 || hasErrors ? (
                                <button
                                  type="button"
                                  disabled={isLoadingUsVisaErrors}
                                  onClick={() => {
                                    handleOpenUsVisaErrors(
                                      batch.batchId || batch.id,
                                    );
                                  }}
                                  className="sm:hidden inline-flex shrink-0 whitespace-nowrap items-center gap-1 rounded-md border border-orange-300 bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-orange-800 transition-all hover:border-orange-400 hover:bg-orange-100"
                                  title="View duplicate records"
                                >
                                  <Copy
                                    className="h-2.5 w-2.5 shrink-0 text-orange-600"
                                    aria-hidden="true"
                                  />
                                  <span>Duplicates</span>
                                </button>
                              ) : null}
                            </div>

                            <div className="mt-1 flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-sibs-tertiary-5">
                              <span>
                                {batch.uploadedAt}{" "}
                                ({formatRelativeTime(batch)})
                              </span>

                              {activeDuplicateLevel === "ALL LEVEL" ? (
                                <span className="rounded bg-slate-100 border border-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                                  {getDuplicateLevelDisplayLabel(getBatchCategory(batch))}
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

                              {duplicateCount > 0 ? (
                                <span className="inline-flex items-center gap-1 rounded-full border border-orange-300 bg-orange-50 px-2 py-0.5 text-[10px] font-extrabold text-orange-800">
                                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                                  {duplicateCount.toLocaleString()} duplicate{duplicateCount === 1 ? "" : "s"}
                                </span>
                              ) : null}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 sm:border-0 sm:pt-0 sm:flex sm:flex-wrap sm:items-center sm:gap-2 sm:shrink-0">
                            {duplicateCount > 0 || hasErrors ? (
                              <button
                                type="button"
                                disabled={isLoadingUsVisaErrors}
                                onClick={() => {
                                  handleOpenUsVisaErrors(
                                    batch.batchId || batch.id,
                                  );
                                }}
                                className="hidden sm:inline-flex h-8 shrink-0 whitespace-nowrap items-center gap-1.5 rounded-lg border border-orange-300 bg-orange-50 px-2.5 text-xs font-semibold text-orange-800 transition-all hover:border-orange-400 hover:bg-orange-100 shadow-xs"
                                title="Click to view duplicate details"
                              >
                                <Copy
                                  className="h-3.5 w-3.5 shrink-0 text-orange-600"
                                  aria-hidden="true"
                                />
                                <span>Duplicates</span>
                              </button>
                            ) : null}

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
            {duplicateDataSearch
              ? `No uploaded data found matching "${duplicateDataSearch}".`
              : duplicateBatches.length
                ? `No uploaded data with duplicates in ${getDuplicateLevelDisplayLabel(activeDuplicateLevel).toLowerCase()}.`
                : "No uploaded data with duplicate records."}
          </div>
        )}
      </div>

      <div className="mt-5 shrink-0 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center">
          <span className="text-xs text-slate-500 font-medium">
            {targetDuplicateBatches.length === 0 ? (
              "Showing 0 uploads"
            ) : (
              <>
                Showing{" "}
                <strong className="font-bold text-slate-800">
                  {(duplicatePage - 1) * DUPLICATE_PAGE_SIZE + 1}
                </strong>{" "}
                to{" "}
                <strong className="font-bold text-slate-800">
                  {Math.min(
                    duplicatePage * DUPLICATE_PAGE_SIZE,
                    targetDuplicateBatches.length,
                  )}
                </strong>{" "}
                of{" "}
                <strong className="font-bold text-slate-800">
                  {targetDuplicateBatches.length}
                </strong>{" "}
                upload{targetDuplicateBatches.length === 1 ? "" : "s"}
                {` in ${getDuplicateLevelDisplayLabel(activeDuplicateLevel)}`}
              </>
            )}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2.5 sm:gap-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={duplicatePage <= 1}
              onClick={() => setDuplicatePage(1)}
              title="First Page"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-all hover:border-sibs-primary-1 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              disabled={duplicatePage <= 1}
              onClick={() => setDuplicatePage((prev) => Math.max(1, prev - 1))}
              title="Previous Page"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-all hover:border-sibs-primary-1 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            {/* Numbered page buttons: shown on sm+ screens */}
            <div className="hidden sm:flex items-center gap-1 px-1">
              {getPageNumbers(duplicatePage, duplicateTotalPages).map((p, idx) => {
                if (p === "...") {
                  return (
                    <span
                      key={`duplicate-ellipsis-${idx}`}
                      className="select-none px-1 text-slate-400 text-xs"
                    >
                      ...
                    </span>
                  );
                }
                const isActivePage = p === duplicatePage;
                return (
                  <button
                    key={`duplicate-page-${p}`}
                    type="button"
                    onClick={() => setDuplicatePage(p)}
                    className={`inline-flex h-8 min-w-[32px] items-center justify-center rounded-lg px-2 text-xs font-semibold transition-all ${
                      isActivePage
                        ? "bg-orange-600 text-white shadow-xs font-bold"
                        : "border border-slate-200 bg-white text-slate-700 hover:border-orange-400 hover:bg-orange-50/50"
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
                {duplicatePage} / {duplicateTotalPages}
              </span>
            </div>

            <button
              type="button"
              disabled={duplicatePage >= duplicateTotalPages}
              onClick={() =>
                setDuplicatePage((prev) => Math.min(duplicateTotalPages, prev + 1))
              }
              title="Next Page"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-all hover:border-sibs-primary-1 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              disabled={duplicatePage >= duplicateTotalPages}
              onClick={() => setDuplicatePage(duplicateTotalPages)}
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
