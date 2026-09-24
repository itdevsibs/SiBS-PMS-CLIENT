// WFM page for uploading and managing raw data files.
import { useCallback, useEffect, useMemo, useState } from "react";

import AdminSidebar from "@/components/layout/AdminSidebar";
import AppHeader from "@/components/layout/AppHeader";
import WfmAccountWorkspacesGrid from "@/components/ui/import/wfm-account-workspaces-grid";
import WfmFilterBar from "@/components/ui/import/wfm-filter-bar";
import WfmImportModals from "@/components/ui/import/wfm-import-modals";
import WfmImportSummaryBar from "@/components/ui/import/wfm-import-summary-bar";
import WfmRawDataCardsGrid from "@/components/ui/import/wfm-raw-data-cards-grid";
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
  executeCardImport,
  getApiErrorMessage,
  getTaskOrderSearchText,
  groupRawDataCards,
  mapBatchToUpload,
  normalizeTaskOrderOption,
  normalizeUploadsByCard,
  readJsonCache,
  writeJsonCache,
} from "@/lib/wfm-import-utils";

function WfmImportDataPage() {
  const dashboard = useDashboardPage();
  const userName = dashboard.userName || getAuthDisplayName(dashboard.authUser);
  const [uploadsByCard, setUploadsByCard] = useState(() =>
    normalizeUploadsByCard(readJsonCache(RAW_DATA_UPLOADS_KEY, {})),
  );
  // Only newly imported files in the current session are reflected on the cards
  const [newlyImportedByCard, setNewlyImportedByCard] = useState({});
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingCardTitle, setUploadingCardTitle] = useState("");
  const [importStage, setImportStage] = useState("reading");
  const [importFileName, setImportFileName] = useState("");
  const [usVisaBatchResult, setUsVisaBatchResult] = useState(null);
  const [importSummary, setImportSummary] = useState(EMPTY_IMPORT_SUMMARY);
  const [summaryRefreshVersion, setSummaryRefreshVersion] = useState(0);
  const [isLoadingUsVisaErrors, setIsLoadingUsVisaErrors] = useState(false);
  const [usVisaErrorDetails, setUsVisaErrorDetails] = useState(null);
  const [errorPagination, setErrorPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 1,
  });
  const [activeErrorBatchId, setActiveErrorBatchId] = useState(null);
  const [errorSearchQuery, setErrorSearchQuery] = useState("");
  const [errorSeverityFilter, setErrorSeverityFilter] = useState("ALL");
  const [jumpPageInput, setJumpPageInput] = useState("");
  const [activeOpenCard, setActiveOpenCard] = useState(null);
  const [uploadToRemove, setUploadToRemove] = useState(null);
  const [selectedUploadDetails, setSelectedUploadDetails] = useState(null);
  const [addedUpload, setAddedUpload] = useState(null);
  const [removedUpload, setRemovedUpload] = useState(null);
  const [duplicateUploadAlert, setDuplicateUploadAlert] = useState(null);
  const [errorModalInfo, setErrorModalInfo] = useState(null);
  const [isWarningsModalOpen, setIsWarningsModalOpen] = useState(false);
  const [rawDataSearch, setRawDataSearch] = useState("");
  const [uploadedDataSearch, setUploadedDataSearch] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("All Accounts");
  const [pendingTaskOrderUpload, setPendingTaskOrderUpload] = useState(null);
  const [selectedTaskOrderId, setSelectedTaskOrderId] = useState("");

  const filteredRawDataCards = useMemo(() => {
    const cards = getRawDataCards(selectedAccount);
    const searchValue = rawDataSearch.trim().toLowerCase();
    if (!searchValue) return cards;

    return cards.filter(
      (card) =>
        card.title.toLowerCase().includes(searchValue) ||
        card.account.toLowerCase().includes(searchValue) ||
        (card.taskOrders || []).some((taskOrder) =>
          getTaskOrderSearchText(taskOrder).includes(searchValue),
        ),
    );
  }, [rawDataSearch, selectedAccount]);

  const filteredAccountOptions = useMemo(() => {
    const searchValue = rawDataSearch.trim().toLowerCase();
    if (!searchValue) return accountOptions;
    return accountOptions.filter((account) =>
      account.toLowerCase().includes(searchValue),
    );
  }, [rawDataSearch]);

  const sourceSystemCounts = useMemo(() => {
    const counts = {};
    for (const acc of accountOptions) {
      counts[acc] = getRawDataCards(acc).length;
    }
    return counts;
  }, []);

  const groupedRawDataCards = useMemo(
    () => groupRawDataCards(filteredRawDataCards),
    [filteredRawDataCards],
  );

  useEffect(() => {
    writeJsonCache(RAW_DATA_UPLOADS_KEY, uploadsByCard);
  }, [uploadsByCard]);

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
      console.warn("Could not sync database uploads:", error?.message);
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

  const handleOpenUsVisaErrors = async (
    batchId,
    targetPage = 1,
    targetLimit,
    targetSearch = errorSearchQuery,
    targetSeverity = errorSeverityFilter,
  ) => {
    const rawBatchId = batchId || activeErrorBatchId || usVisaBatchResult?.id;
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
      setErrorModalInfo({
        title: "Error Loading Details",
        message:
          error?.response?.data?.message ||
          "Unable to load the batch error records from the server.",
      });
    } finally {
      setIsLoadingUsVisaErrors(false);
    }
  };

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

  const processCardFile = async (card, file, uploadContext = {}) => {
    if (!file) return;

    const isUsVisa = card.account === "US VISA";
    const currentCardUploads = uploadsByCard[card.id] || [];
    const isDuplicate = currentCardUploads.some(
      (upload) => upload.fileName.toLowerCase() === file.name.toLowerCase(),
    );

    if (!isUsVisa && isDuplicate) {
      setDuplicateUploadAlert({
        fileName: file.name,
        rawDataTitle: card.title,
      });
      return;
    }

    setIsUploading(true);
    setUploadingCardTitle(card.title);
    setImportFileName(file.name);
    setImportStage(isUsVisa ? "uploading" : "reading");
    setUploadProgress(isUsVisa ? 5 : 15);
    setUsVisaBatchResult(null);

    try {
      const result = await executeCardImport({
        card,
        file,
        uploadContext,
        onProgress: setUploadProgress,
        onStageChange: setImportStage,
      });

      if (result.isDuplicate) {
        setDuplicateUploadAlert({
          fileName: file.name,
          rawDataTitle: card.title,
        });
        return;
      }

      const { newUpload, batchResult } = result;

      setUploadsByCard((current) => ({
        ...current,
        [card.id]: [newUpload, ...(current[card.id] || [])],
      }));

      // Only the newly imported file is reflected on the card in this module
      setNewlyImportedByCard((current) => ({
        ...current,
        [card.id]: [newUpload],
      }));

      void fetchDatabaseUploads();
      setSummaryRefreshVersion((current) => current + 1);

      if (batchResult) {
        setUsVisaBatchResult(batchResult);
      }

      setAddedUpload({
        count: 1,
        rawDataTitle: card.title,
        fileName: file.name,
        batch: batchResult,
      });

      void recordWfmHistoryLogQuietly({
        action: "imported",
        account: card.account,
        rawDataTitle: card.title,
        fileName: file.name,
        message: `Imported ${file.name} to ${card.account} - ${card.title}.`,
      });
    } catch (error) {
      if (isUsVisa && error?.response?.data?.code === "DUPLICATE_FILE") {
        setDuplicateUploadAlert({
          fileName: file.name,
          rawDataTitle: card.title,
        });
        return;
      }

      console.error("Import failed:", error);
      setErrorModalInfo({
        title: "Import Failed",
        message: getApiErrorMessage(error, card),
      });
    } finally {
      setIsUploading(false);
      setUploadingCardTitle("");
      setImportFileName("");
      setUploadProgress(0);
      setImportStage("reading");
    }
  };

  const handleCardFileSelect = async (card, event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!card.requiresTaskOrderSelection) {
      await processCardFile(card, file);
      return;
    }

    const taskOrderOptions = (card.taskOrders || [])
      .map(normalizeTaskOrderOption)
      .filter((option) => option?.id);

    if (taskOrderOptions.length === 1) {
      await processCardFile(card, file, { taskOrderId: taskOrderOptions[0].id });
      return;
    }

    if (taskOrderOptions.length > 1) {
      setPendingTaskOrderUpload({ card, file, taskOrderOptions });
      setSelectedTaskOrderId("");
      return;
    }

    await processCardFile(card, file);
  };

  const handleConfirmTaskOrderUpload = async () => {
    if (!pendingTaskOrderUpload) return;

    const validSelection = pendingTaskOrderUpload.taskOrderOptions.some(
      (option) => option.id === selectedTaskOrderId,
    );
    if (!validSelection) {
      setErrorModalInfo({
        title: "Task Order Required",
        message: "Select the Task Order represented by this Agent Occupancy workbook before uploading.",
      });
      return;
    }

    const pendingUpload = pendingTaskOrderUpload;
    setPendingTaskOrderUpload(null);

    await processCardFile(pendingUpload.card, pendingUpload.file, {
      taskOrderId: selectedTaskOrderId,
    });
    setSelectedTaskOrderId("");
  };

  const handleCancelTaskOrderUpload = () => {
    setPendingTaskOrderUpload(null);
    setSelectedTaskOrderId("");
  };

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

    setNewlyImportedByCard((current) => ({
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
      account: selectedUploadToRemove.account || activeOpenCard?.account,
      rawDataTitle:
        selectedUploadToRemove.rawDataTitle ||
        activeOpenCard?.title ||
        "Raw Data",
      fileName: selectedUploadToRemove.fileName,
      message: `Removed ${selectedUploadToRemove.fileName} from ${
        selectedUploadToRemove.account || activeOpenCard?.account || "WFM"
      } - ${
        selectedUploadToRemove.rawDataTitle ||
        activeOpenCard?.title ||
        "Raw Data"
      }.`,
    });
  };

  const handleRefreshCard = (cardId, groupCards = []) => {
    setNewlyImportedByCard((current) => {
      const next = { ...current };
      if (cardId) delete next[cardId];
      if (Array.isArray(groupCards)) {
        groupCards.forEach((c) => {
          if (c?.id) delete next[c.id];
        });
      }
      return next;
    });
    void fetchDatabaseUploads();
    setSummaryRefreshVersion((current) => current + 1);
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

        <div className="sibs-scrollbar flex-1 overflow-y-auto p-3 sm:p-4 lg:p-5">
          <WfmFilterBar
            selectedAccount={selectedAccount}
            onSelectAccount={(account) => {
              setSelectedAccount(account);
              setRawDataSearch("");
            }}
            rawDataSearch={rawDataSearch}
            onSearchChange={setRawDataSearch}
            accountFilters={accountFilters}
            sourceSystemCounts={sourceSystemCounts}
          />

          <WfmImportSummaryBar
            importSummary={importSummary}
            onOpenWarnings={() => setIsWarningsModalOpen(true)}
          />

          {selectedAccount === "All Accounts" ? (
            <WfmAccountWorkspacesGrid
              accountOptions={filteredAccountOptions}
              sourceSystemCounts={sourceSystemCounts}
              onSelectAccount={(account) => {
                setSelectedAccount(account);
                setRawDataSearch("");
              }}
            />
          ) : (
            <WfmRawDataCardsGrid
              groupedCards={groupedRawDataCards}
              hasCards={filteredRawDataCards.length > 0}
              uploadsByCard={newlyImportedByCard}
              isUploading={isUploading}
              onBackToAll={() => {
                setSelectedAccount("All Accounts");
                setRawDataSearch("");
              }}
              onFileSelect={handleCardFileSelect}
              onOpenCard={(card) => {
                setActiveOpenCard(card);
                setUploadedDataSearch("");
              }}
              onRefreshCard={handleRefreshCard}
              onOpenErrorDetails={handleOpenUsVisaErrors}
            />
          )}
        </div>
      </main>

      <WfmImportModals
        pendingTaskOrderUpload={pendingTaskOrderUpload}
        selectedTaskOrderId={selectedTaskOrderId}
        setSelectedTaskOrderId={setSelectedTaskOrderId}
        onCancelTaskOrderUpload={handleCancelTaskOrderUpload}
        onConfirmTaskOrderUpload={handleConfirmTaskOrderUpload}
        activeOpenCard={activeOpenCard}
        onCloseCardUploads={() => setActiveOpenCard(null)}
        uploadedDataSearch={uploadedDataSearch}
        setUploadedDataSearch={setUploadedDataSearch}
        isLoadingUsVisaErrors={isLoadingUsVisaErrors}
        handleOpenUsVisaErrors={handleOpenUsVisaErrors}
        handleOpenBatchDetails={handleOpenBatchDetails}
        setUploadToRemove={setUploadToRemove}
        usVisaErrorDetails={usVisaErrorDetails}
        usVisaBatchResult={usVisaBatchResult}
        errorPagination={errorPagination}
        activeErrorBatchId={activeErrorBatchId}
        errorSearchQuery={errorSearchQuery}
        setErrorSearchQuery={setErrorSearchQuery}
        errorSeverityFilter={errorSeverityFilter}
        setErrorSeverityFilter={setErrorSeverityFilter}
        jumpPageInput={jumpPageInput}
        setJumpPageInput={setJumpPageInput}
        onCloseErrorDetails={() => {
          setUsVisaErrorDetails(null);
          setActiveErrorBatchId(null);
          setErrorSearchQuery("");
          setErrorSeverityFilter("ALL");
        }}
        selectedUploadDetails={selectedUploadDetails}
        onCloseBatchDetails={() => setSelectedUploadDetails(null)}
        isWarningsModalOpen={isWarningsModalOpen}
        onCloseWarnings={() => setIsWarningsModalOpen(false)}
        uploadsByCard={uploadsByCard}
        selectedAccount={selectedAccount}
        duplicateUploadAlert={duplicateUploadAlert}
        onCloseDuplicateAlert={() => setDuplicateUploadAlert(null)}
        addedUpload={addedUpload}
        onCloseAddedUpload={() => setAddedUpload(null)}
        removedUpload={removedUpload}
        onCloseRemovedUpload={() => setRemovedUpload(null)}
        uploadToRemove={uploadToRemove}
        onCancelRemoveUpload={() => setUploadToRemove(null)}
        onConfirmRemoveUpload={handleRemoveUpload}
        showLogoutModal={dashboard.showLogoutModal}
        onCancelLogout={() => dashboard.setShowLogoutModal(false)}
        onConfirmLogout={dashboard.handleLogout}
        isLoggingOut={dashboard.isLoggingOut}
        isUploading={isUploading}
        importFileName={importFileName}
        uploadingCardTitle={uploadingCardTitle}
        uploadProgress={uploadProgress}
        importStage={importStage}
        errorModalInfo={errorModalInfo}
        onCloseErrorInfo={() => setErrorModalInfo(null)}
      />
    </section>
  );
}

export default WfmImportDataPage;
