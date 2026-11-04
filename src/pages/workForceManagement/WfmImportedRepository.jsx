import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Database,
  Eye,
  FileSpreadsheet,
  FolderOpen,
  List,
  MessageSquare,
  Phone,
  Search,
  Trash2,
  TrendingUp,
  User,
  X,
} from "lucide-react";

import AdminSidebar from "@/components/common/layout/AdminSidebar";
import AppHeader from "@/components/common/layout/AppHeader";
import SingleSelectDropdown from "@/components/common/filters/SingleSelectDropdown";
import AppModal from "@/components/common/ui/AppModal";
import ConfirmationModal from "@/components/common/ui/ConfirmationModal";
import LoadingModal from "@/components/common/ui/LoadingModal";
import WfmBatchDetailsModal from "@/components/modules/wfm/imports/WfmBatchDetailsModal";
import WfmImportCalendar, { manilaDateKey } from "@/components/modules/wfm/imports/WfmImportCalendar";
import WfmCalendarDailyImports from "@/components/modules/wfm/imports/WfmCalendarDailyImports";
import WfmRepositoryReportTypeBadge from "@/components/modules/wfm/imports/WfmRepositoryReportTypeBadge";
import WfmErrorDetailsModal from "@/components/modules/wfm/imports/WfmErrorDetailsModal";
import WfmReadOnlyExcelModal from "@/components/modules/wfm/imports/WfmReadOnlyExcelModal";
import WfmFilterBar from "@/components/modules/wfm/imports/WfmFilterBar";
import WfmImportSummaryBar from "@/components/modules/wfm/imports/WfmImportSummaryBar";
import { RemovedUploadSuccessModal } from "@/components/modules/wfm/imports/WfmStatusFeedbackModals";
import WfmWarningsModal from "@/components/modules/wfm/imports/WfmWarningsModal";
import WfmRejectedModal from "@/components/modules/wfm/imports/WfmRejectedModal";
import WfmDuplicatesModal from "@/components/modules/wfm/imports/WfmDuplicatesModal";
import useDashboardPage from "@/hooks/useDashboardPage";
import { getAuthDisplayName } from "@/lib/auth";
import { recordWfmHistoryLogQuietly } from "@/lib/axios/wfm-history-logs";
import { removeWfmGraphReportsForUpload } from "@/lib/wfm-graph-reports";
import { accountOptions, getRawDataCards } from "@/lib/wfm-raw-data-cards";
import {
  getRepositoryReportTypeForUpload,
  getRepositoryToolForUpload,
  getRepositoryToolsForLevel,
  normalizeRepositoryTool,
} from "@/lib/wfm-import-repository-tools";
import {
  deleteUsVisaImportBatch,
  getUsVisaImportBatchDetails,
  getUsVisaImportBatchErrors,
  getUsVisaImportHistory,
  getUsVisaImportSummary,
  getUsVisaImportCalendar,
  getUsVisaImportCalendarDay,
} from "@/lib/axios/us-visa-imports";
import {
  EMPTY_IMPORT_SUMMARY,
  RAW_DATA_UPLOADS_KEY,
  accountFilters,
  formatRelativeTime,
  getImportDisplayStatus,
  getBatchCategory,
  mapBatchToUpload,
  mapCalendarBatchToUpload,
  normalizeUploadsByCard,
  readJsonCache,
  writeJsonCache,
} from "@/lib/wfm-import-utils";

function normalizeLevelValue(val) {
  if (!val) return "ALL";
  const upper = String(val).trim().toUpperCase();
  if (upper === "ALL" || upper === "ALL LEVEL") return "ALL";
  if (upper.includes("DOCUMENTED CALL")) return "DOCUMENTED CALLS";
  if (upper.includes("CALL REPORT")) return "CALL REPORT (EOD)";
  if (upper.includes("CHAT REPORT")) return "CHAT REPORT (EOD)";
  // Legacy Agent Level is now represented by Call Report (EOD).
  if (upper.includes("AGENT LEVEL")) return "CALL REPORT (EOD)";
  if (upper.includes("SKILL STATISTICS") || upper.includes("SERVICE") || upper.includes("QUEUE")) return "SKILL STATISTICS";
  if (upper.includes("QUALITY") || upper === "QA") return "QUALITY AUDIT";
  if (upper.includes("OCCUPANCY")) return "AGENT OCCUPANCY";
  if (upper.includes("AGENT ACTIVITY") || upper.includes("PRODUCTIVE BREAK")) return "AGENT ACTIVITY - PRODUCTIVE BREAKS";
  if (upper.includes("AGENT PERFORMANCE") && upper.includes("SKILL")) return "AGENT PERFORMANCE BY SKILL";
  if (upper.includes("EMAIL")) return "EMAIL LEVEL";
  return val;
}


export default function WfmImportedRepository() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const dashboard = useDashboardPage();
  const userName = dashboard.userName || getAuthDisplayName(dashboard.authUser);

  // Filter Bar state
  const [selectedAccount, setSelectedAccount] = useState(() => {
    return (
      location.state?.selectedAccount ||
      location.state?.account ||
      searchParams.get("account") ||
      "All Accounts"
    );
  });
  const [importSummary, setImportSummary] = useState(EMPTY_IMPORT_SUMMARY);
  const [summaryRefreshVersion, setSummaryRefreshVersion] = useState(0);
  const [isWarningsModalOpen, setIsWarningsModalOpen] = useState(false);
  const [isRejectedModalOpen, setIsRejectedModalOpen] = useState(false);
  const [isDuplicatesModalOpen, setIsDuplicatesModalOpen] = useState(false);

  // Raw data uploads stored across all cards/levels
  const [uploadsByCard, setUploadsByCard] = useState(() =>
    normalizeUploadsByCard(readJsonCache(RAW_DATA_UPLOADS_KEY, {})),
  );

  // Filters: Selected Level, Selected Tool & Search query
  const [selectedLevel, setSelectedLevel] = useState(() => {
    return normalizeLevelValue(
      location.state?.selectedLevel ||
      location.state?.level ||
      searchParams.get("level") ||
      "ALL",
    );
  });
  const [selectedTool, setSelectedTool] = useState(() => {
    return normalizeRepositoryTool(
      location.state?.selectedTool ||
      location.state?.tool ||
      searchParams.get("tool") ||
      "ALL",
    );
  });
  const [uploadedDataSearch, setUploadedDataSearch] = useState("");
  // Calendar is the default view; List keeps the existing repository workflow.
  const [repositoryView, setRepositoryView] = useState(() => {
    return (
      location.state?.view ||
      searchParams.get("view") ||
      "calendar"
    );
  });
  const [calendarMonth, setCalendarMonth] = useState(() => manilaDateKey().slice(0, 7));
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(null);
  const [isDailyDrawerOpen, setIsDailyDrawerOpen] = useState(false);
  const [calendarDays, setCalendarDays] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarError, setCalendarError] = useState("");
  const [dailyUploads, setDailyUploads] = useState([]);
  const [dailyPagination, setDailyPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [dailyLoading, setDailyLoading] = useState(false);
  const [dailyError, setDailyError] = useState("");
  const [dailyPage, setDailyPage] = useState(1);


  // Sync filters when navigated from another page (e.g. Open button in Import Data)
  useEffect(() => {
    const rawLevel =
      location.state?.selectedLevel ||
      location.state?.level ||
      searchParams.get("level");
    const rawTool =
      location.state?.selectedTool ||
      location.state?.tool ||
      searchParams.get("tool");

    if (rawLevel) {
      setSelectedLevel(normalizeLevelValue(rawLevel));
    }
    if (rawTool) {
      setSelectedTool(normalizeRepositoryTool(rawTool));
    } else if (rawLevel) {
      setSelectedTool("ALL");
    }
    setUploadedDataSearch("");

    const rawAccount =
      location.state?.selectedAccount ||
      location.state?.account ||
      searchParams.get("account");
    if (rawAccount) {
      setSelectedAccount(rawAccount);
    }

    const rawView =
      location.state?.view ||
      searchParams.get("view");
    if (rawView === "list" || rawView === "calendar") {
      setRepositoryView(rawView);
    }
  }, [location.key]);

  // Modals state
  const [selectedUploadDetails, setSelectedUploadDetails] = useState(null);
  const [noteModalUpload, setNoteModalUpload] = useState(null);
  const [selectedRawBatch, setSelectedRawBatch] = useState(null);
  const [uploadToRemove, setUploadToRemove] = useState(null);
  const [isRemovingUpload, setIsRemovingUpload] = useState(false);
  const [removingUploadFileName, setRemovingUploadFileName] = useState("");
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

  // Helper to resolve level/group category for an upload.
  // Legacy Agent Level batches are grouped under Call Report (EOD);
  // Skill Statistics is active again; old queue-level batches share this category.
  const getUploadLevel = useCallback((upload) => {
    const rawLevel =
      upload.groupLabel ||
      upload.level ||
      getBatchCategory(upload);

    const upper = String(rawLevel || "").trim().toUpperCase();
    if (upper.includes("AGENT LEVEL")) return "CALL REPORT (EOD)";
    if (upper.includes("SKILL STATISTICS") || upper.includes("QUEUE") || upper.includes("SERVICE")) return "SKILL STATISTICS";
    if (upper.includes("DOCUMENTED CALL")) return "DOCUMENTED CALLS";
    if (upper.includes("CALL REPORT")) return "CALL REPORT (EOD)";
    if (upper.includes("CHAT REPORT")) return "CHAT REPORT (EOD)";
    if (upper.includes("OCCUPANCY")) return "AGENT OCCUPANCY";
    if (upper.includes("AGENT ACTIVITY") || upper.includes("PRODUCTIVE BREAK")) return "AGENT ACTIVITY - PRODUCTIVE BREAKS";
    if (upper.includes("AGENT PERFORMANCE") && upper.includes("SKILL")) return "AGENT PERFORMANCE BY SKILL";
    if (upper.includes("EMAIL")) return "EMAIL LEVEL";
    if (upper.includes("QUALITY") || upper === "QA") return "QUALITY AUDIT";
    return rawLevel;
  }, []);

  // Account cards for the selected account (defaults to US VISA cards)
  const accountCards = useMemo(() => {
    return getRawDataCards(selectedAccount === "All Accounts" ? "US VISA" : selectedAccount);
  }, [selectedAccount]);

  // Preserve legacy import history. Agent Level batches roll into Call Report (EOD),
  // while historical Skill Statistics / Service Level batches remain grouped with new imports.
  const allUploads = useMemo(() => {
    const list = Object.values(uploadsByCard)
      .flat()
      .filter(Boolean)
      .filter((upload) =>
        selectedAccount === "All Accounts" || upload.account === selectedAccount
      );
    return list.sort((a, b) => (b.uploadedAtMs || 0) - (a.uploadedAtMs || 0));
  }, [uploadsByCard, selectedAccount]);

  // Count uploads per level
  const levelCounts = useMemo(() => {
    const counts = {
      "CALL REPORT (EOD)": 0,
      "SKILL STATISTICS": 0,
      "DOCUMENTED CALLS": 0,
      "CHAT REPORT (EOD)": 0,
      "AGENT OCCUPANCY": 0,
      "AGENT ACTIVITY - PRODUCTIVE BREAKS": 0,
      "AGENT PERFORMANCE BY SKILL": 0,
      "EMAIL LEVEL": 0,
      "QUALITY AUDIT": 0,
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

  // Dropdown options for Level selector with live upload counts
  const levelOptions = useMemo(
    () => [
      {
        value: "ALL",
        label: `ALL LEVEL (${allUploads.length})`,
      },
      {
        value: "SKILL STATISTICS",
        label: `SKILL STATISTICS (${levelCounts["SKILL STATISTICS"] || 0})`,
      },
      {
        value: "DOCUMENTED CALLS",
        label: `DOCUMENTED CALLS (${levelCounts["DOCUMENTED CALLS"] || 0})`,
      },
      {
        value: "CALL REPORT (EOD)",
        label: `CALL REPORT (EOD) (${levelCounts["CALL REPORT (EOD)"] || 0})`,
      },
      {
        value: "CHAT REPORT (EOD)",
        label: `CHAT REPORT (EOD) (${levelCounts["CHAT REPORT (EOD)"] || 0})`,
      },
      {
        value: "AGENT OCCUPANCY",
        label: `AGENT OCCUPANCY (${levelCounts["AGENT OCCUPANCY"] || 0})`,
      },
      {
        value: "AGENT ACTIVITY - PRODUCTIVE BREAKS",
        label: `AGENT ACTIVITY - PRODUCTIVE BREAKS (${levelCounts["AGENT ACTIVITY - PRODUCTIVE BREAKS"] || 0})`,
      },
      {
        value: "AGENT PERFORMANCE BY SKILL",
        label: `AGENT PERFORMANCE BY SKILL (${levelCounts["AGENT PERFORMANCE BY SKILL"] || 0})`,
      },
      {
        value: "EMAIL LEVEL",
        label: `EMAIL RAW DATA (${levelCounts["EMAIL LEVEL"] || 0})`,
      },
      {
        value: "QUALITY AUDIT",
        label: `QUALITY AUDIT (${levelCounts["QUALITY AUDIT"] || 0})`,
      },
    ],
    [allUploads.length, levelCounts],
  );

  // Uploads filtered by selected level
  const levelFilteredUploads = useMemo(() => {
    if (selectedLevel === "ALL") return allUploads;
    return allUploads.filter((u) => getUploadLevel(u) === selectedLevel);
  }, [allUploads, selectedLevel, getUploadLevel]);

  // Tool choices are determined by the raw-data category, not all available systems.
  // A selected tool is reset when the category changes; the effective filter
  // guards against stale URL/navigation state until that update has committed.
  const availableTools = useMemo(() => getRepositoryToolsForLevel(selectedLevel), [selectedLevel]);
  const effectiveSelectedTool = selectedTool === "ALL" || availableTools.includes(selectedTool)
    ? selectedTool : "ALL";

  useEffect(() => {
    if (selectedTool !== effectiveSelectedTool) setSelectedTool("ALL");
  }, [selectedTool, effectiveSelectedTool]);

  const toolCounts = useMemo(() => {
    const counts = Object.fromEntries(availableTools.map((tool) => [tool, 0]));
    for (const upload of levelFilteredUploads) {
      const tool = getRepositoryToolForUpload(upload);
      if (Object.hasOwn(counts, tool)) counts[tool] += 1;
    }
    return counts;
  }, [levelFilteredUploads, availableTools]);

  const toolOptions = useMemo(() => [
    { value: "ALL", label: `All Tools (${levelFilteredUploads.length})` },
    ...availableTools.map((tool) => ({ value: tool, label: `${tool} (${toolCounts[tool] || 0})` })),
  ], [levelFilteredUploads.length, availableTools, toolCounts]);

  // Uploads further filtered by tool and search query
  const displayedUploads = useMemo(() => {
    let result = levelFilteredUploads;

    if (effectiveSelectedTool !== "ALL") {
      result = result.filter((u) => getRepositoryToolForUpload(u) === effectiveSelectedTool);
    }

    const searchValue = (uploadedDataSearch || "").trim().toLowerCase();
    if (!searchValue) return result;

    return result.filter(
      (upload) =>
        (upload.fileName || "").toLowerCase().includes(searchValue) ||
        (upload.batchCode || "").toLowerCase().includes(searchValue) ||
        (upload.rawDataTitle || "").toLowerCase().includes(searchValue),
    );
  }, [levelFilteredUploads, effectiveSelectedTool, uploadedDataSearch]);

  // Server-side calendar queries keep the calendar complete even beyond the
  // legacy list's 100-history-item limit. Abort stale results on filter changes.
  const calendarFilters = useMemo(() => ({
    month: calendarMonth, account: selectedAccount,
    level: selectedLevel, tool: effectiveSelectedTool, search: uploadedDataSearch,
  }), [calendarMonth, selectedAccount, selectedLevel, effectiveSelectedTool, uploadedDataSearch]);

  useEffect(() => {
    if (repositoryView !== "calendar") return;
    let active = true;
    setCalendarLoading(true);
    setCalendarError("");
    getUsVisaImportCalendar(calendarFilters).then((response) => {
      if (active) setCalendarDays(response.days || []);
    }).catch(() => {
      if (active) { setCalendarDays([]); setCalendarError("Unable to load the import calendar. Please try again."); }
    }).finally(() => { if (active) setCalendarLoading(false); });
    return () => { active = false; };
  }, [repositoryView, calendarFilters, summaryRefreshVersion]);

  useEffect(() => {
    if (repositoryView !== "calendar" || !selectedCalendarDay) {
      setDailyUploads([]);
      return;
    }
    let active = true;
    setDailyLoading(true);
    setDailyError("");
    getUsVisaImportCalendarDay({ ...calendarFilters, date: selectedCalendarDay, page: dailyPage, limit: 20 })
      .then((response) => {
        if (!active) return;
        setDailyUploads((response.data || []).map(mapCalendarBatchToUpload));
        setDailyPagination(response.pagination || { page: 1, total: 0, totalPages: 1 });
      }).catch(() => {
        if (active) { setDailyUploads([]); setDailyPagination({ page: 1, total: 0, totalPages: 1 }); setDailyError("Unable to load imports for this date."); }
      }).finally(() => { if (active) setDailyLoading(false); });
    return () => { active = false; };
  }, [repositoryView, calendarFilters, selectedCalendarDay, dailyPage, summaryRefreshVersion]);

  useEffect(() => { setDailyPage(1); }, [calendarFilters, selectedCalendarDay]);

  const changeCalendarMonth = (month) => {
    setCalendarMonth(month);
    setSelectedCalendarDay(null);
    setIsDailyDrawerOpen(false);
    setDailyPage(1);
  };

  const handleSelectCalendarDay = (day, dayData) => {
    setSelectedCalendarDay(day);
    // If the day has batches/imports or if clicked, open the right drawer
    if (dayData?.batchCount > 0) {
      setIsDailyDrawerOpen(true);
    } else {
      // If user clicks a blank day, don't open the drawer
      setIsDailyDrawerOpen(false);
    }
  };

  // Pagination state (matching Employee Ledger)
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Reset page when level, tool or search filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedLevel, effectiveSelectedTool, uploadedDataSearch]);

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
              displayStatus: details.batch.displayStatus ?? prev.displayStatus,
              mappingRows: details.batch.mappingRows ?? prev.mappingRows,
              unmappedRows: details.batch.unmappedRows ?? prev.unmappedRows,
              unassignedTaskOrderRows: details.batch.unassignedTaskOrderRows ?? prev.unassignedTaskOrderRows,
              infoRows: details.batch.infoRows ?? prev.infoRows,
              batchStatus: details.batch.status ?? prev.batchStatus,
              reportDateFrom: details.batch.reportDateFrom ?? prev.reportDateFrom,
              reportDateTo: details.batch.reportDateTo ?? prev.reportDateTo,
              importNote: details.batch.importNote ?? prev.importNote,
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
    const targetFileName = selectedUploadToRemove.fileName || "data file";
    setRemovingUploadFileName(targetFileName);
    setUploadToRemove(null);
    setIsRemovingUpload(true);

    const batchIdentifier =
      selectedUploadToRemove.batchId || selectedUploadToRemove.batchCode;

    try {
      if (batchIdentifier) {
        try {
          await deleteUsVisaImportBatch(batchIdentifier);
          await new Promise((resolve) => setTimeout(resolve, 600));
        } catch (error) {
          console.warn(
            "Backend batch removal issue:",
            error?.response?.data || error?.message || error,
          );
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, 600));
      }

      removeWfmGraphReportsForUpload(selectedUploadToRemove.id);

      setUploadsByCard((current) => ({
        ...current,
        [selectedUploadToRemove.cardId]: (
          current[selectedUploadToRemove.cardId] || []
        ).filter((u) => u.id !== selectedUploadToRemove.id),
      }));

      await fetchDatabaseUploads();
      setSummaryRefreshVersion((current) => current + 1);

      void recordWfmHistoryLogQuietly({
        action: "removed",
        account: selectedUploadToRemove.account || "US VISA",
        rawDataTitle: selectedUploadToRemove.rawDataTitle || "Raw Data",
        fileName: selectedUploadToRemove.fileName,
        message: `Removed ${selectedUploadToRemove.fileName} from ${
          selectedUploadToRemove.account || "US VISA"
        } - ${selectedUploadToRemove.rawDataTitle || "Raw Data"} via Import Repository.`,
      });
    } finally {
      setIsRemovingUpload(false);
      setRemovingUploadFileName("");
      setRemovedUpload(selectedUploadToRemove);
    }
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

        <div className="sibs-scrollbar flex-1 flex flex-col overflow-y-auto [scrollbar-gutter:stable] p-2 sm:p-2.5 lg:p-3">
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
            onOpenRejected={() => setIsRejectedModalOpen(true)}
            onOpenDuplicates={() => setIsDuplicatesModalOpen(true)}
          />

          {/* Main Repository Box Container - flex-1 to fill bottom space */}
          <div className="flex-1 flex flex-col rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-xs">
            {/* Header: Title/Subtitle on Left, Level dropdown & Search on Right */}
            <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between border-b border-slate-100 pb-2.5 sm:pb-3 shrink-0">
              <div className="min-w-0 flex-1">
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

              <div className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-slate-200/80 p-1 shadow-inner" role="group" aria-label="Repository view">
                <button
                  type="button"
                  onClick={() => setRepositoryView("calendar")}
                  aria-pressed={repositoryView === "calendar"}
                  className={`flex h-8 items-center gap-1.5 rounded-lg px-3.5 text-xs transition-all cursor-pointer ${
                    repositoryView === "calendar"
                      ? "bg-[#042c51] text-white shadow-sm font-extrabold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/50 font-bold"
                  }`}
                >
                  <CalendarDays className="h-3.5 w-3.5" />
                  <span>Calendar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRepositoryView("list")}
                  aria-pressed={repositoryView === "list"}
                  className={`flex h-8 items-center gap-1.5 rounded-lg px-3.5 text-xs transition-all cursor-pointer ${
                    repositoryView === "list"
                      ? "bg-[#042c51] text-white shadow-sm font-extrabold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/50 font-bold"
                  }`}
                >
                  <List className="h-3.5 w-3.5" />
                  <span>List</span>
                </button>
              </div>

              {/* Controls: Search Input, Level Dropdown, Tool Dropdown, Clear Button - FIXED POSITIONS */}
              <div className="flex flex-col sm:flex-row sm:flex-wrap xl:flex-nowrap items-stretch sm:items-center gap-2 sm:gap-2.5 lg:gap-3 w-full lg:w-auto">
                {/* Search uploaded data input */}
                <div className="relative w-full sm:w-60 md:w-64 lg:w-56 xl:w-64 shrink-0">
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
                <div className="w-full sm:w-60 md:w-64 shrink-0">
                  <SingleSelectDropdown
                    value={selectedLevel}
                    onChange={(e) => { setSelectedLevel(e.target.value); setSelectedTool("ALL"); }}
                    options={repositoryView === "calendar" ? levelOptions.map((option) => ({ ...option, label: option.label.replace(/ \(\d+\)$/, "") })) : levelOptions}
                    placeholder="Select Level..."
                    buttonClassName="h-9 rounded-lg border-slate-200 px-2.5 text-xs font-semibold shadow-2xs"
                  />
                </div>

                {/* Tool selector dropdown - fixed width so changing count text never resizes */}
                <div className="w-full sm:w-40 md:w-44 shrink-0">
                  <SingleSelectDropdown
                    value={effectiveSelectedTool}
                    onChange={(e) => setSelectedTool(e.target.value)}
                    options={repositoryView === "calendar" ? toolOptions.map((option) => ({ ...option, label: option.label.replace(/ \(\d+\)$/, "") })) : toolOptions}
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
                  className="h-9 w-full sm:w-auto shrink-0 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-600 shadow-2xs transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 cursor-pointer text-center"
                  title="Reset to All Level and All Tools"
                >
                  Clear
                </button>
              </div>
            </div>

            {repositoryView === "calendar" ? (
              <>
                <WfmImportCalendar
                  month={calendarMonth}
                  onMonthChange={changeCalendarMonth}
                  selectedDay={selectedCalendarDay}
                  onSelectDay={handleSelectCalendarDay}
                  days={calendarDays}
                  loading={calendarLoading}
                  error={calendarError}
                />

                {/* Slide-out side drawer on the right when a day with data is clicked */}
                <div
                  className={`fixed inset-0 z-[100] overflow-hidden transition-all duration-300 ${
                    isDailyDrawerOpen && selectedCalendarDay
                      ? "pointer-events-auto visible"
                      : "pointer-events-none invisible"
                  }`}
                  role="dialog"
                  aria-modal="true"
                >
                  {/* Simple Backdrop without blur */}
                  <div
                    className={`fixed inset-0 bg-slate-900/20 transition-opacity duration-300 ease-out ${
                      isDailyDrawerOpen && selectedCalendarDay ? "opacity-100" : "opacity-0"
                    }`}
                    onClick={() => setIsDailyDrawerOpen(false)}
                    aria-hidden="true"
                  />

                  {/* Smooth Sliding Drawer Panel */}
                  <div className="fixed inset-y-0 right-0 flex max-w-full pl-6">
                    <div
                      className={`w-screen max-w-2xl sm:max-w-3xl lg:max-w-[860px] shadow-2xl transition-transform duration-300 ease-out transform ${
                        isDailyDrawerOpen && selectedCalendarDay
                          ? "translate-x-0"
                          : "translate-x-full"
                      }`}
                    >
                      <WfmCalendarDailyImports
                        date={selectedCalendarDay}
                        uploads={dailyUploads}
                        pagination={dailyPagination}
                        loading={dailyLoading}
                        error={dailyError}
                        onPageChange={setDailyPage}
                        onView={handleOpenBatchDetails}
                        onRaw={setSelectedRawBatch}
                        onRemove={setUploadToRemove}
                        onClose={() => setIsDailyDrawerOpen(false)}
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : null}

            {repositoryView === "list" ? <>
            {/* Clean Elevated Cards Container */}
            <div className="mt-3.5 space-y-2.5">
              {displayedUploads.length > 0 ? (
                  paginatedUploads.map((upload) => {
                    const display = getImportDisplayStatus(upload);
                    const isCompleted = display.tone === "success" || display.label?.toLowerCase() === "completed";
                    const isPartial = display.tone === "warning" || display.label?.toLowerCase().includes("partial");

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
                        key={upload.id || `${upload.fileName}-${upload.uploadedAt}`}
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
                              <span className="inline-block rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 font-mono text-[10.5px] font-bold text-slate-700">
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
                            {upload.importNote ? (
                              <button
                                type="button"
                                onClick={() => setNoteModalUpload(upload)}
                                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-3 text-xs font-bold text-sky-800 shadow-2xs hover:bg-sky-100 hover:border-sky-300 transition active:scale-95 cursor-pointer"
                                title="View notes for this import"
                              >
                                <MessageSquare className="h-3.5 w-3.5 text-sky-600" />
                                <span>View Notes</span>
                              </button>
                            ) : null}

                            <button
                              type="button"
                              onClick={() => handleOpenBatchDetails(upload)}
                              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition active:scale-95 cursor-pointer"
                              title="View batch details"
                            >
                              <Eye className="h-3.5 w-3.5 text-slate-500" />
                              <span>View</span>
                            </button>

                            <button
                              type="button"
                              disabled={!upload.batchId || display.status === "FAILED"}
                              onClick={() => setSelectedRawBatch(upload)}
                              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition active:scale-95 cursor-pointer"
                              title="View raw spreadsheet"
                            >
                              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                              <span>Raw</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setUploadToRemove(upload)}
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
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-16 text-center text-sm text-sibs-tertiary-5">
                  <FolderOpen className="mx-auto mb-2.5 h-8 w-8 text-slate-300" />
                  <p className="font-semibold text-slate-700">No imported data found</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {levelFilteredUploads.length
                      ? "No uploaded data found matching your search."
                      : `No uploaded data stored for ${selectedLevel} yet.`}
                  </p>
                </div>
              )}
            </div>

              {/* ── Pagination footer (matching Employee Ledger) ── */}
              {totalCount > 0 && (
                <div className="shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200/90 bg-slate-50/80 px-3.5 sm:px-5 py-3 sm:py-3.5">
                  {/* Count */}
                  <p className="text-xs sm:text-[13px] text-slate-600 m-0 text-center sm:text-left">
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
            </> : null}
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

      {/* Records Rejected Modal (opened when clicking Records Rejected card) */}
      <WfmRejectedModal
        isOpen={isRejectedModalOpen}
        onClose={() => setIsRejectedModalOpen(false)}
        uploadsByCard={uploadsByCard}
        selectedAccount={selectedAccount}
        isLoadingUsVisaErrors={isLoadingUsVisaErrors}
        handleOpenUsVisaErrors={handleOpenUsVisaErrors}
        handleOpenBatchDetails={handleOpenBatchDetails}
        setUploadToRemove={setUploadToRemove}
      />

      {/* Duplicates Found Modal (opened when clicking Duplicates Found card) */}
      <WfmDuplicatesModal
        isOpen={isDuplicatesModalOpen}
        onClose={() => setIsDuplicatesModalOpen(false)}
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

      {/* Removing Upload Loading Modal */}
      <LoadingModal
        isOpen={isRemovingUpload}
        title="Removing Data..."
        message={`Deleting "${removingUploadFileName}" and cleaning associated database records...`}
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

      {/* View Notes Modal */}
      <AppModal
        isOpen={Boolean(noteModalUpload)}
        className="!max-w-none w-full sm:!w-[min(94vw,760px)] p-6 sm:p-7 rounded-2xl shadow-2xl border border-slate-200 bg-white"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 border border-sky-200 text-sky-700">
              <MessageSquare className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <h3 className="m-0 text-base font-bold text-slate-900 leading-snug">Import Notes</h3>
              <p className="m-0 text-xs text-slate-500 font-medium truncate max-w-sm" title={noteModalUpload?.fileName}>
                {noteModalUpload?.fileName || "Imported File"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setNoteModalUpload(null)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Written Note / Remarks
          </label>
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5 min-h-[140px]">
            <p className="m-0 text-sm leading-relaxed text-slate-800 whitespace-pre-wrap break-words [word-break:break-word] font-medium">
              {noteModalUpload?.importNote || "No note recorded for this import."}
            </p>
          </div>
        </div>

        {/* Footer info: Uploader and timestamp */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 border-t border-slate-100 pt-3">
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-600">
            <User className="h-3.5 w-3.5 text-slate-400" />
            <span>{noteModalUpload?.uploaderName || "Unknown Uploader"}</span>
          </span>
          <span className="text-slate-400">
            {noteModalUpload?.uploadedAt || ""}
          </span>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={() => setNoteModalUpload(null)}
            className="h-9 rounded-lg bg-[#042c51] px-5 text-xs font-bold text-white hover:bg-[#063d70] transition-colors shadow-2xs cursor-pointer"
          >
            Close
          </button>
        </div>
      </AppModal>
    </section>
  );
}
