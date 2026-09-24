import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileSpreadsheet,
  FolderOpen,
  Search,
  Trash2,
} from "lucide-react";

import AdminSidebar from "@/components/layout/AdminSidebar";
import AppHeader from "@/components/layout/AppHeader";
import SingleSelectDropdown from "@/components/ui/Filter/SingleSelectDropdown";
import ConfirmationModal from "@/components/ui/confirmation-modal";
import LoadingModal from "@/components/ui/loading-modal";
import WfmBatchDetailsModal from "@/components/ui/import/wfm-batch-details-modal";
import WfmErrorDetailsModal from "@/components/ui/import/wfm-error-details-modal";
import WfmReadOnlyExcelModal from "@/components/ui/import/wfm-read-only-excel-modal";
import WfmFilterBar from "@/components/ui/import/wfm-filter-bar";
import WfmImportSummaryBar from "@/components/ui/import/wfm-import-summary-bar";
import { RemovedUploadSuccessModal } from "@/components/ui/import/wfm-status-feedback-modals";
import WfmWarningsModal from "@/components/ui/import/wfm-warnings-modal";
import useDashboardPage from "@/hooks/useDashboardPage";
import { getAuthDisplayName } from "@/lib/auth";
import { recordWfmHistoryLogQuietly } from "@/lib/axios/wfm-history-logs";
import { removeWfmGraphReportsForUpload } from "@/lib/wfm-graph-reports";
import { accountOptions, getRawDataCards } from "@/lib/wfm-raw-data-cards";
import {
  deleteUsVisaImportBatch,
  getUsVisaImportBatchDetails,
  getUsVisaImportBatchErrors,
  getUsVisaImportHistory,
  getUsVisaImportSummary,
} from "@/lib/axios/us-visa-imports";
import {
  EMPTY_IMPORT_SUMMARY,
  RAW_DATA_UPLOADS_KEY,
  accountFilters,
  formatRelativeTime,
  getBatchCategory,
  mapBatchToUpload,
  normalizeUploadsByCard,
  readJsonCache,
  writeJsonCache,
} from "@/lib/wfm-import-utils";

export default function WfmImportedRepository() {
  const dashboard = useDashboardPage();
  const userName = dashboard.userName || getAuthDisplayName(dashboard.authUser);

  // Filter Bar state
  const [selectedAccount, setSelectedAccount] = useState("All Accounts");
  const [importSummary, setImportSummary] = useState(EMPTY_IMPORT_SUMMARY);
  const [summaryRefreshVersion, setSummaryRefreshVersion] = useState(0);
  const [isWarningsModalOpen, setIsWarningsModalOpen] = useState(false);

  // Raw data uploads stored across all cards/levels
  const [uploadsByCard, setUploadsByCard] = useState(() =>
    normalizeUploadsByCard(readJsonCache(RAW_DATA_UPLOADS_KEY, {})),
  );

  // Filters: Selected Level, Selected Tool & Search query
  const [selectedLevel, setSelectedLevel] = useState("ALL");
  const [selectedTool, setSelectedTool] = useState("ALL");
  const [uploadedDataSearch, setUploadedDataSearch] = useState("");

  // Modals state
  const [selectedUploadDetails, setSelectedUploadDetails] = useState(null);
  const [selectedRawBatch, setSelectedRawBatch] = useState(null);
  const [uploadToRemove, setUploadToRemove] = useState(null);
  const [removedUpload, setRemovedUpload] = useState(null);
  const [isLoadingUsVisaErrors, setIsLoadingUsVisaErrors] = useState(false);
  const [usVisaErrorDetails, setUsVisaErrorDetails] = useState(null);
  const [activeErrorBatchId, setActiveErrorBatchId] = useState(null);
  const [errorSearchQuery, setErrorSearchQuery] = useState("");
  const [errorSeverityFilter, setErrorSeverityFilter] = useState("ALL");
  const [jumpPageInput, setJumpPageInput] = useState("");
  const [errorPagination, setErrorPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 1,
  });

  // Sync uploads with local cache
  useEffect(() => {
    writeJsonCache(RAW_DATA_UPLOADS_KEY, uploadsByCard);
  }, [uploadsByCard]);

  // Fetch real database uploads from backend
  const fetchDatabaseUploads = useCallback(async () => {
    try {
      const response = await getUsVisaImportHistory({ limit: 100 });
      if (response?.data && Array.isArray(response.data)) {
        const dbUploads = response.data.map(mapBatchToUpload).filter(Boolean);

        setUploadsByCard((current) => {
          const next = { ...current };
          for (const card of getRawDataCards("US VISA")) {
            const cardDbUploads = dbUploads.filter((u) => u.cardId === card.id);
            const cardLocalUploads = (next[card.id] || []).filter(
              (u) => !u.batchId && !u.id?.startsWith("batch-"),
            );
            next[card.id] = [...cardDbUploads, ...cardLocalUploads].sort(
              (a, b) => (b.uploadedAtMs || 0) - (a.uploadedAtMs || 0),
            );
          }
          return next;
        });
      }
    } catch (error) {
      console.warn("Could not sync database uploads in repository:", error?.message);
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;
    const syncInitialUploads = async () => {
      if (!isCancelled) await fetchDatabaseUploads();
    };
    void syncInitialUploads();
    return () => {
      isCancelled = true;
    };
  }, [fetchDatabaseUploads]);

  // Load source system counts for filter bar
  const sourceSystemCounts = useMemo(() => {
    const counts = {};
    for (const acc of accountOptions) {
      counts[acc] = getRawDataCards(acc).length;
    }
    return counts;
  }, []);

  // Fetch summary metrics (Total Uploads, Records Processed, Warnings, etc.)
  useEffect(() => {
    let isActive = true;
    const loadImportSummary = async () => {
      try {
        const response = await getUsVisaImportSummary({ account: selectedAccount });
        if (isActive) {
          setImportSummary(response?.summary || EMPTY_IMPORT_SUMMARY);
        }
      } catch (error) {
        if (isActive) {
          setImportSummary(EMPTY_IMPORT_SUMMARY);
          console.warn("Could not sync import summary:", error?.message);
        }
      }
    };
    void loadImportSummary();
    return () => {
      isActive = false;
    };
  }, [selectedAccount, summaryRefreshVersion]);

  // Helper to resolve level/group category for an upload
  const getUploadLevel = useCallback((upload) => {
    if (upload.groupLabel) return upload.groupLabel;
    if (upload.level) return upload.level;
    return getBatchCategory(upload);
  }, []);

  // Account cards for the selected account (defaults to US VISA cards)
  const accountCards = useMemo(() => {
    return getRawDataCards(selectedAccount === "All Accounts" ? "US VISA" : selectedAccount);
  }, [selectedAccount]);

  // Array of all uploads matching the active account's cards
  const allUploads = useMemo(() => {
    const list = [];
    accountCards.forEach((card) => {
      const cardUploads = uploadsByCard[card.id];
      if (Array.isArray(cardUploads)) {
        list.push(...cardUploads);
      }
    });
    return list.sort((a, b) => (b.uploadedAtMs || 0) - (a.uploadedAtMs || 0));
  }, [uploadsByCard, accountCards]);

  // Count uploads per level
  const levelCounts = useMemo(() => {
    const counts = {
      "SERVICE / QUEUE LEVEL": 0,
      "AGENT LEVEL": 0,
      "AGENT OCCUPANCY": 0,
      "EMAIL LEVEL": 0,
    };
    allUploads.forEach((u) => {
      const lvl = getUploadLevel(u);
      if (counts[lvl] !== undefined) {
        counts[lvl]++;
      } else {
        counts[lvl] = 1;
      }
    });
    return counts;
  }, [allUploads, getUploadLevel]);

  // Dropdown options for Level selector
  const levelOptions = useMemo(
    () => [
      {
        value: "ALL",
        label: "ALL LEVEL",
      },
      {
        value: "SERVICE / QUEUE LEVEL",
        label: "SERVICE / QUEUE LEVEL",
      },
      {
        value: "AGENT LEVEL",
        label: "AGENT LEVEL",
      },
      {
        value: "AGENT OCCUPANCY",
        label: "AGENT OCCUPANCY",
      },
      {
        value: "EMAIL LEVEL",
        label: "EMAIL RAW DATA",
      },
    ],
    [],
  );

  // Uploads filtered by selected level
  const levelFilteredUploads = useMemo(() => {
    if (selectedLevel === "ALL") return allUploads;
    return allUploads.filter((u) => getUploadLevel(u) === selectedLevel);
  }, [allUploads, selectedLevel, getUploadLevel]);

  // Helper to extract normalized tool name ("Fusecom", "FuseNet", "HeroDash")
  const getUploadTool = useCallback((upload) => {
    const raw = `${upload.sourceSystem || ""} ${upload.sourceLabel || ""} ${upload.rawDataTitle || ""} ${upload.fileName || ""} ${upload.cardId || ""}`.toLowerCase();
    if (raw.includes("fusenet")) return "FuseNet";
    if (raw.includes("fusecom")) return "Fusecom";
    if (raw.includes("hero")) return "HeroDash";
    return "Other";
  }, []);

  // Tool counts for the selected level
  const toolCounts = useMemo(() => {
    const counts = {
      Fusecom: 0,
      FuseNet: 0,
      HeroDash: 0,
    };
    levelFilteredUploads.forEach((u) => {
      const tool = getUploadTool(u);
      if (counts[tool] !== undefined) {
        counts[tool]++;
      }
    });
    return counts;
  }, [levelFilteredUploads, getUploadTool]);

  // Tool filter options with live data counts
  const toolOptions = useMemo(
    () => [
      { value: "ALL", label: `All Tools (${levelFilteredUploads.length})` },
      { value: "Fusecom", label: `Fusecom (${toolCounts.Fusecom || 0})` },
      { value: "FuseNet", label: `FuseNet (${toolCounts.FuseNet || 0})` },
      { value: "HeroDash", label: `HeroDash (${toolCounts.HeroDash || 0})` },
    ],
    [levelFilteredUploads.length, toolCounts],
  );

  // Uploads further filtered by tool and search query
  const displayedUploads = useMemo(() => {
    let result = levelFilteredUploads;

    if (selectedTool !== "ALL") {
      result = result.filter(
        (u) => getUploadTool(u).toLowerCase() === selectedTool.toLowerCase(),
      );
    }

    const searchValue = (uploadedDataSearch || "").trim().toLowerCase();
    if (!searchValue) return result;

    return result.filter(
      (upload) =>
        (upload.fileName || "").toLowerCase().includes(searchValue) ||
        (upload.batchCode || "").toLowerCase().includes(searchValue) ||
        (upload.rawDataTitle || "").toLowerCase().includes(searchValue),
    );
  }, [levelFilteredUploads, selectedTool, uploadedDataSearch, getUploadTool]);

  // Pagination state (matching Employee Ledger)
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Reset page when level, tool or search filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedLevel, selectedTool, uploadedDataSearch]);

  const totalCount = displayedUploads.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Paginated uploads slice
  const paginatedUploads = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return displayedUploads.slice(start, start + pageSize);
  }, [displayedUploads, currentPage, pageSize]);

  // Fixed header title so the font, text, and layout never shift when changing filters
  const headerTitle = "Uploaded Data Repository";

  // View Batch Details
  const handleOpenBatchDetails = async (upload) => {
    setSelectedUploadDetails(upload);

    if (upload?.batchId) {
      try {
        const details = await getUsVisaImportBatchDetails(upload.batchId);
        if (details?.batch) {
          setSelectedUploadDetails((prev) => {
            if (!prev || prev.batchId !== upload.batchId) return prev;
            return {
              ...prev,
              totalRows: details.batch.totalRows ?? prev.totalRows,
              validRows: details.batch.validRows ?? prev.validRows,
              invalidRows: details.batch.invalidRows ?? prev.invalidRows,
              duplicateRows: details.batch.duplicateRows ?? prev.duplicateRows,
              warningRows: details.batch.warningRows ?? prev.warningRows,
              infoRows: details.batch.infoRows ?? prev.infoRows,
              batchStatus: details.batch.status ?? prev.batchStatus,
            };
          });
        }
      } catch (err) {
        console.warn("Could not fetch latest batch details:", err?.message);
      }
    }
  };

  // Open error details modal
  const handleOpenUsVisaErrors = async (
    batchId,
    targetPage = 1,
    targetLimit,
    targetSearch = errorSearchQuery,
    targetSeverity = errorSeverityFilter,
  ) => {
    const rawBatchId = batchId || activeErrorBatchId;
    const targetBatchId =
      typeof rawBatchId === "string" && rawBatchId.startsWith("batch-")
        ? rawBatchId.replace("batch-", "")
        : rawBatchId;

    if (!targetBatchId || isLoadingUsVisaErrors) return;

    const currentLimit = targetLimit || errorPagination.limit || 25;
    setIsLoadingUsVisaErrors(true);
    setActiveErrorBatchId(targetBatchId);

    try {
      const response = await getUsVisaImportBatchErrors(targetBatchId, {
        page: targetPage,
        limit: currentLimit,
        search: targetSearch || undefined,
        severity: targetSeverity !== "ALL" ? targetSeverity : undefined,
      });

      setUsVisaErrorDetails(response);
      const totalCount =
        response?.pagination?.total ?? response?.data?.length ?? 0;
      const totalPages =
        response?.pagination?.totalPages ??
        Math.max(1, Math.ceil(totalCount / currentLimit));

      setErrorPagination({
        page: targetPage,
        limit: currentLimit,
        total: totalCount,
        totalPages,
      });
      setJumpPageInput(String(targetPage));
    } catch (error) {
      console.error("Failed to load US VISA import errors:", error);
    } finally {
      setIsLoadingUsVisaErrors(false);
    }
  };

  // Confirm removal of upload
  const handleRemoveUpload = async () => {
    if (!uploadToRemove) return;

    const selectedUploadToRemove = uploadToRemove;
    setUploadToRemove(null);

    const batchIdentifier =
      selectedUploadToRemove.batchId || selectedUploadToRemove.batchCode;

    if (batchIdentifier) {
      try {
        await deleteUsVisaImportBatch(batchIdentifier);
        await new Promise((resolve) => setTimeout(resolve, 400));
      } catch (error) {
        console.warn(
          "Backend batch removal issue:",
          error?.response?.data || error?.message || error,
        );
      }
    } else {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    removeWfmGraphReportsForUpload(selectedUploadToRemove.id);

    setUploadsByCard((current) => ({
      ...current,
      [selectedUploadToRemove.cardId]: (
        current[selectedUploadToRemove.cardId] || []
      ).filter((u) => u.id !== selectedUploadToRemove.id),
    }));

    void fetchDatabaseUploads();
    setSummaryRefreshVersion((current) => current + 1);
    setRemovedUpload(selectedUploadToRemove);

    void recordWfmHistoryLogQuietly({
      action: "removed",
      account: selectedUploadToRemove.account || "US VISA",
      rawDataTitle: selectedUploadToRemove.rawDataTitle || "Raw Data",
      fileName: selectedUploadToRemove.fileName,
      message: `Removed ${selectedUploadToRemove.fileName} from ${
        selectedUploadToRemove.account || "US VISA"
      } - ${selectedUploadToRemove.rawDataTitle || "Raw Data"} via Import Repository.`,
    });
  };

  return (
    <section className="font-jakarta flex h-screen max-h-[100dvh] min-h-screen bg-[#eef3f7] text-sibs-primary-1 overflow-hidden">
      <AdminSidebar
        isMobileOpen={dashboard.isMobileSidebarOpen}
        modules={dashboard.modules}
        onLogoutClick={() => dashboard.setShowLogoutModal(true)}
        onMobileClose={() => dashboard.setIsMobileSidebarOpen(false)}
        userName={userName}
        userRole={dashboard.authUser?.email || dashboard.authUser?.roleLabel || "User"}
      />

      <main className="min-w-0 flex-1 flex flex-col h-full overflow-hidden">
        <AppHeader
          title={dashboard.authUser?.roleLabel || "Workforce Management"}
          subtitle="Performance Management System"
          onMenuClick={() => dashboard.setIsMobileSidebarOpen(true)}
          onLogoutClick={() => dashboard.setShowLogoutModal(true)}
        />

        <div className="sibs-scrollbar flex-1 overflow-y-scroll [scrollbar-gutter:stable] p-3 sm:p-4 lg:p-5">
          {/* Top Filter Bar */}
          <WfmFilterBar
            selectedAccount={selectedAccount}
            onSelectAccount={(account) => {
              setSelectedAccount(account);
              setUploadedDataSearch("");
            }}
            rawDataSearch={uploadedDataSearch}
            onSearchChange={setUploadedDataSearch}
            accountFilters={accountFilters}
            sourceSystemCounts={sourceSystemCounts}
          />

          {/* Import Summary Bar (Total Uploads, Records Processed, Accepted, Rejected, Duplicates, Warnings) */}
          <WfmImportSummaryBar
            importSummary={importSummary}
            onOpenWarnings={() => setIsWarningsModalOpen(true)}
          />

          {/* Main Repository Box Container */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs">
            {/* Header: Title/Subtitle on Left, Level dropdown & Search on Right */}
            <div className="flex flex-col gap-3.5 lg:flex-row lg:items-center lg:justify-between border-b border-slate-100 pb-4">
              <div className="min-w-0 flex-1 pr-4">
                <h2
                  className="m-0 truncate text-base sm:text-lg md:text-xl font-bold text-sibs-primary-1"
                  title={headerTitle}
                >
                  {headerTitle}
                </h2>
                <p className="mt-1 mb-0 text-xs font-semibold text-sibs-tertiary-5 truncate">
                  Account:{" "}
                  <span className="font-bold text-sibs-primary-1">
                    {selectedAccount === "All Accounts" ? "US VISA" : selectedAccount}
                  </span>
                  {" "}• <span className="font-medium text-slate-500">Repository of imported raw data batches</span>
                </p>
              </div>

              {/* Controls: Search Input, Level Dropdown, Tool Dropdown, Clear Button - FIXED POSITIONS */}
              <div className="flex flex-wrap lg:flex-nowrap items-center gap-2.5 sm:gap-3 shrink-0 ml-auto">
                {/* Search uploaded data input */}
                <div className="relative w-full sm:w-64 shrink-0">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sibs-tertiary-6"
                    aria-hidden="true"
                  />
                  <input
                    value={uploadedDataSearch}
                    onChange={(e) => setUploadedDataSearch(e.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-xs sm:text-sm outline-none transition focus:border-sibs-primary-2 shadow-2xs"
                    placeholder="Search uploaded data..."
                    type="text"
                  />
                  {uploadedDataSearch ? (
                    <button
                      type="button"
                      onClick={() => setUploadedDataSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      ✕
                    </button>
                  ) : null}
                </div>

                {/* Level selector dropdown - fixed width so it never moves when changing options */}
                <div className="w-full sm:w-56 shrink-0">
                  <SingleSelectDropdown
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    options={levelOptions}
                    placeholder="Select Level..."
                    buttonClassName="h-9 rounded-lg border-slate-200 px-2.5 text-xs font-semibold shadow-2xs"
                  />
                </div>

                {/* Tool selector dropdown - fixed width so changing count text never resizes */}
                <div className="w-full sm:w-44 shrink-0">
                  <SingleSelectDropdown
                    value={selectedTool}
                    onChange={(e) => setSelectedTool(e.target.value)}
                    options={toolOptions}
                    placeholder="Select Tool..."
                    buttonClassName="h-9 rounded-lg border-slate-200 px-2.5 text-xs font-semibold shadow-2xs"
                  />
                </div>

                {/* Clear button to reset back to All Level and All Tools */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLevel("ALL");
                    setSelectedTool("ALL");
                    setUploadedDataSearch("");
                  }}
                  className="h-9 shrink-0 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 shadow-2xs transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
                  title="Reset to All Level and All Tools"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* 1 Single Clean Table Container */}
            <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
              {displayedUploads.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {paginatedUploads.map((upload) => {
                    const isCompletedWithErrors =
                      upload.batchStatus === "COMPLETED_WITH_ERRORS" ||
                      upload.invalidRows > 0 ||
                      upload.warningRows > 0 ||
                      upload.duplicateRows > 0;

                    return (
                      <div
                        key={upload.id || `${upload.fileName}-${upload.uploadedAt}`}
                        className="flex flex-col gap-2.5 sm:gap-3 p-4 sm:px-5 sm:py-4 transition-colors hover:bg-slate-50/70 sm:flex-row sm:items-center sm:justify-between"
                      >
                        {/* Left: File details, batch badge, time & row counts */}
                        <div className="min-w-0 flex-1">
                          <p
                            className="m-0 min-w-0 max-w-full break-words [word-break:break-word] text-sm font-bold text-sibs-primary-1 leading-snug"
                            title={upload.fileName}
                          >
                            {upload.fileName}
                          </p>

                          <div className="mt-1 flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-sibs-tertiary-5">
                            <span>
                              ({formatRelativeTime(upload)}) {upload.uploadedAt}
                            </span>

                            {upload.batchCode ? (
                              <span className="rounded bg-sibs-primary-2/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-sibs-primary-2">
                                Batch: {upload.batchCode}
                              </span>
                            ) : null}

                            {upload.rawDataTitle ? (
                              <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 shadow-2xs">
                                {upload.rawDataTitle}
                              </span>
                            ) : null}

                            {upload.totalRows ? (
                              <span className="text-[11px] font-medium text-slate-500">
                                • {upload.totalRows.toLocaleString()} rows
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {/* Right: Actions (Completed with error, View raw data, View & Remove buttons) */}
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 sm:border-0 sm:pt-0 sm:shrink-0 sm:ml-auto">
                          <div className="w-[158px] shrink-0 flex items-center justify-end">
                            {isCompletedWithErrors ? (
                              <button
                                type="button"
                                disabled={isLoadingUsVisaErrors}
                                onClick={() =>
                                  handleOpenUsVisaErrors(upload.batchId || upload.id)
                                }
                                className="inline-flex h-8 shrink-0 whitespace-nowrap items-center gap-1.5 rounded-lg border border-amber-400 bg-amber-50 px-2.5 text-xs font-semibold text-amber-800 transition-all hover:border-amber-500 hover:bg-amber-100 shadow-xs cursor-pointer"
                                title="Completed with error - click to view error details"
                              >
                                <AlertTriangle
                                  className="h-3.5 w-3.5 shrink-0 text-amber-600"
                                  aria-hidden="true"
                                />
                                <span>Completed with error</span>
                              </button>
                            ) : null}
                          </div>

                          <button
                            type="button"
                            onClick={() => setSelectedRawBatch(upload)}
                            className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 text-xs font-semibold text-emerald-700 shadow-xs transition-all hover:border-emerald-600 hover:bg-emerald-600 hover:text-white cursor-pointer"
                            title="View raw Excel spreadsheet data"
                          >
                            <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>View raw data</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenBatchDetails(upload)}
                            className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-xs transition-all hover:border-sibs-primary-1 hover:bg-sibs-primary-1 hover:text-white cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>View</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setUploadToRemove(upload)}
                            className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50/70 px-3 text-xs font-semibold text-rose-600 shadow-xs transition-all hover:border-rose-600 hover:bg-rose-600 hover:text-white cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="px-4 py-16 text-center text-sm text-sibs-tertiary-5">
                  <FolderOpen className="mx-auto mb-2.5 h-8 w-8 text-slate-300" />
                  <p className="m-0 font-medium">
                    {levelFilteredUploads.length
                      ? "No uploaded data found matching your search."
                      : `No uploaded data stored for ${selectedLevel} yet.`}
                  </p>
                </div>
              )}

              {/* ── Pagination footer (matching Employee Ledger) ── */}
              {totalCount > 0 && (
                <div className="shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200/90 bg-slate-50/80 px-5 py-3 sm:py-3.5">
                  {/* Count */}
                  <p className="text-xs sm:text-[13px] text-slate-600 m-0">
                    Showing{" "}
                    <span className="font-bold text-slate-900">
                      {(currentPage - 1) * pageSize + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-bold text-slate-900">
                      {Math.min(currentPage * pageSize, totalCount)}
                    </span>{" "}
                    of{" "}
                    <span className="font-bold text-slate-900">{totalCount}</span>{" "}
                    upload{totalCount === 1 ? "" : "s"}
                  </p>

                  {/* Page controls */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                      className="flex h-8 w-8 sm:h-8.5 sm:w-8.5 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-slate-100 hover:text-slate-900 disabled:opacity-35 disabled:cursor-not-allowed transition cursor-pointer"
                      title="Previous page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    <span className="rounded-md border border-slate-200 bg-white px-3 py-1 text-xs sm:text-[12.5px] font-bold text-slate-800 shadow-2xs">
                      {currentPage} / {totalPages}
                    </span>

                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                      disabled={currentPage >= totalPages}
                      className="flex h-8 w-8 sm:h-8.5 sm:w-8.5 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-slate-100 hover:text-slate-900 disabled:opacity-35 disabled:cursor-not-allowed transition cursor-pointer"
                      title="Next page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* View Batch Details Modal */}
      <WfmBatchDetailsModal
        selectedUploadDetails={selectedUploadDetails}
        activeOpenCard={
          selectedUploadDetails
            ? {
                title:
                  selectedUploadDetails.rawDataTitle ||
                  selectedUploadDetails.groupLabel ||
                  "Import",
                account: selectedUploadDetails.account || "US VISA",
              }
            : null
        }
        isLoadingUsVisaErrors={isLoadingUsVisaErrors}
        handleOpenUsVisaErrors={handleOpenUsVisaErrors}
        onOpenRawData={(batch) => setSelectedRawBatch(batch)}
        onClose={() => setSelectedUploadDetails(null)}
      />

      {/* Read-Only Excel Preview Modal */}
      <WfmReadOnlyExcelModal
        isOpen={Boolean(selectedRawBatch)}
        batch={selectedRawBatch}
        onClose={() => setSelectedRawBatch(null)}
      />

      {/* Error Details Modal */}
      <WfmErrorDetailsModal
        usVisaErrorDetails={usVisaErrorDetails}
        activeOpenCard={null}
        isLoadingUsVisaErrors={isLoadingUsVisaErrors}
        handleOpenUsVisaErrors={handleOpenUsVisaErrors}
        errorPagination={errorPagination}
        activeErrorBatchId={activeErrorBatchId}
        errorSearchQuery={errorSearchQuery}
        setErrorSearchQuery={setErrorSearchQuery}
        errorSeverityFilter={errorSeverityFilter}
        setErrorSeverityFilter={setErrorSeverityFilter}
        jumpPageInput={jumpPageInput}
        setJumpPageInput={setJumpPageInput}
        onClose={() => {
          setUsVisaErrorDetails(null);
          setActiveErrorBatchId(null);
          setErrorSearchQuery("");
          setErrorSeverityFilter("ALL");
        }}
      />

      {/* Warnings & Issues Modal (opened when clicking Warnings Found card) */}
      <WfmWarningsModal
        isOpen={isWarningsModalOpen}
        onClose={() => setIsWarningsModalOpen(false)}
        uploadsByCard={uploadsByCard}
        selectedAccount={selectedAccount}
        isLoadingUsVisaErrors={isLoadingUsVisaErrors}
        handleOpenUsVisaErrors={handleOpenUsVisaErrors}
        handleOpenBatchDetails={handleOpenBatchDetails}
        setUploadToRemove={setUploadToRemove}
      />

      {/* Remove Upload Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(uploadToRemove)}
        title="Remove Upload"
        message={`Are you sure you want to remove "${uploadToRemove?.fileName}" from the repository? All associated database records will be permanently deleted.`}
        confirmText="Remove"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleRemoveUpload}
        onCancel={() => setUploadToRemove(null)}
      />

      {/* Successfully Removed Feedback Modal */}
      <RemovedUploadSuccessModal
        removedUpload={removedUpload}
        onClose={() => setRemovedUpload(null)}
      />

      {/* Sign Out Confirmation Modal */}
      <ConfirmationModal
        isOpen={dashboard.showLogoutModal}
        title="Sign Out"
        message="Are you sure you want to sign out of your account?"
        confirmText="Sign Out"
        cancelText="Cancel"
        variant="danger"
        onConfirm={dashboard.handleLogout}
        onCancel={() => dashboard.setShowLogoutModal(false)}
      />

      {/* Signing Out Loading Modal */}
      <LoadingModal
        isOpen={dashboard.isLoggingOut}
        title="Signing out..."
        message="Please wait while we securely end your session."
      />
    </section>
  );
}
