// WFM page for uploading and managing raw data files.
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  CloudUpload,
  Eye,
  FolderOpen,
  Search,
  Trash2,
} from "lucide-react";

import AdminSidebar from "@/components/layout/AdminSidebar";
import AppHeader from "@/components/layout/AppHeader";
import AppModal from "@/components/ui/app-modal";
import { Button } from "@/components/ui/button";
import ConfirmationModal from "@/components/ui/confirmation-modal";
import ImportProgressModal from "@/components/ui/import-progress-modal";
import LoadingModal from "@/components/ui/loading-modal";
import useDashboardPage from "@/hooks/useDashboardPage";
import { removeWfmGraphReportsForUpload } from "@/lib/wfm-graph-reports";
import { addWfmHistoryLog } from "@/lib/wfm-history-logs";
import {
  accountOptions,
  getRawDataCards,
} from "@/lib/wfm-raw-data-cards";
import {
  deleteUsVisaImportBatch,
  getUsVisaImportBatchErrors,
  uploadUsVisaImport,
} from "@/lib/axios/us-visa-imports";

const RAW_DATA_UPLOADS_KEY = "sibs-wfm-raw-data-uploads";

const accountFilters = [
  "All Accounts",
  ...accountOptions,
];

function formatUploadTimestamp(date = new Date()) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getApiErrorMessage(error, card) {
  const backendMsg = error?.response?.data?.message || "";
  const backendCode = error?.response?.data?.code || "";

  if (
    backendCode === "MISSING_REQUIRED_WORKSHEET" ||
    backendCode === "MISSING_REQUIRED_SHEET" ||
    backendCode === "MISSING_REQUIRED_COLUMN" ||
    backendCode === "MISSING_REQUIRED_HEADER" ||
    backendCode === "WRONG_IMPORT_PROFILE" ||
    backendMsg.toLowerCase().includes("missing required") ||
    backendMsg.toLowerCase().includes("only") ||
    backendMsg.toLowerCase().includes("expected report format") ||
    backendMsg.toLowerCase().includes("structure validation failed")
  ) {
    if (/hero/i.test(card?.title || card?.id || "")) {
      return "Only HeroDash Skill Statistics (.xlsx) files are allowed for this card. The uploaded file is missing required HeroDash sheets or headers.";
    }
    if (/fuse/i.test(card?.title || card?.id || "")) {
      return "Only Fusecom Skill Statistics (.xlsx) files are allowed for this card. The uploaded file is missing required Fusecom sheets or headers.";
    }
    return `Only ${card?.title || "valid"} (.xlsx) reports are allowed for this card. The uploaded file does not match the required format.`;
  }

  return (
    backendMsg ||
    error?.message ||
    "The upload could not be completed."
  );
}

function formatImportStatus(status) {
  return String(status || "").replace(/_/g, " ");
}

function BatchStat({ label, value }) {
  return (
    <div className="rounded-lg border border-sibs-tertiary-10 bg-[#f8fbfd] px-3 py-2">
      <p className="m-0 text-[11px] font-bold uppercase text-sibs-tertiary-5">
        {label}
      </p>
      <p className="mt-1 mb-0 text-xl font-extrabold text-sibs-primary-1">
        {Number(value || 0).toLocaleString()}
      </p>
    </div>
  );
}

function getUploadTimeMs(upload) {
  if (upload?.uploadedAtMs) return upload.uploadedAtMs;

  const parsedTime = new Date(upload?.uploadedAt || "").getTime();

  return Number.isNaN(parsedTime) ? Date.now() : parsedTime;
}

function formatRelativeTime(upload) {
  const elapsedMs = Math.max(0, Date.now() - getUploadTimeMs(upload));
  const elapsedMinutes = Math.floor(elapsedMs / 60000);
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  const elapsedDays = Math.floor(elapsedHours / 24);

  if (elapsedMinutes < 1) return "just now";
  if (elapsedMinutes < 60) {
    return `${elapsedMinutes} min${elapsedMinutes === 1 ? "" : "s"} ago`;
  }
  if (elapsedHours < 24) {
    return `${elapsedHours} hour${elapsedHours === 1 ? "" : "s"} ago`;
  }

  return `${elapsedDays} day${elapsedDays === 1 ? "" : "s"} ago`;
}

function getCellText(value) {
  if (value == null) return "";

  if (typeof value === "object") {
    if ("text" in value) return String(value.text || "");
    if ("result" in value) return String(value.result || "");
    if ("richText" in value) {
      return value.richText.map((item) => item.text || "").join("");
    }
  }

  return String(value);
}

function normalizeHeaders(headers) {
  const usedHeaders = new Map();
  const columns = headers.map((header, index) => {
    const fallbackHeader = `Column ${index + 1}`;
    const baseHeader = getCellText(header).trim() || fallbackHeader;
    const usedCount = usedHeaders.get(baseHeader) || 0;

    usedHeaders.set(baseHeader, usedCount + 1);

    return usedCount > 0 ? `${baseHeader} ${usedCount + 1}` : baseHeader;
  });

  return columns.length ? columns : ["Column 1"];
}

function buildRows(columns, dataRows, fileName) {
  return dataRows.map((cells) => {
    const row = {};

    columns.forEach((column, index) => {
      row[column] = getCellText(cells[index]).trim() || "-";
    });
    row["Source File"] = fileName;

    return row;
  });
}

function parseCsvRows(text, fileName) {
  const lines = String(text || "").split(/\r?\n/).filter((line) => line.trim());

  if (lines.length <= 1) {
    return {
      columns: ["Source File"],
      rows: [],
    };
  }

  const [headerLine, ...dataLines] = lines;
  const columns = normalizeHeaders(
    headerLine.split(",").map((cell) => cell.trim().replace(/^"|"$/g, "")),
  );
  const rows = buildRows(
    columns,
    dataLines.map((line) =>
      line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, "")),
    ),
    fileName,
  );

  return {
    columns: [...columns, "Source File"],
    rows,
  };
}

function isDataRow(row) {
  return row.some((cell) => getCellText(cell).trim());
}

function getFilledCellCount(row) {
  return row.filter((cell) => getCellText(cell).trim()).length;
}

function isLikelyHeaderRow(row, nextRow) {
  const filledCellCount = getFilledCellCount(row);
  const nextFilledCellCount = getFilledCellCount(nextRow || []);
  const joinedRow = row.map((cell) => getCellText(cell).toLowerCase()).join(" ");
  const knownHeaderWords = [
    "employee",
    "record",
    "date",
    "skill",
    "calls",
    "account",
    "team",
    "quality",
    "score",
  ];
  const headerWordMatches = knownHeaderWords.filter((word) =>
    joinedRow.includes(word),
  ).length;

  return filledCellCount >= 3 && nextFilledCellCount >= 3 && headerWordMatches >= 2;
}

function findHeaderRowIndex(rows) {
  const scanLimit = Math.min(rows.length - 1, 25);

  for (let index = 0; index < scanLimit; index += 1) {
    if (isLikelyHeaderRow(rows[index], rows[index + 1])) {
      return index;
    }
  }

  return 0;
}

async function parseWorkbookRows(arrayBuffer, fileName) {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(arrayBuffer, {
    type: "array",
    cellDates: true,
    cellText: false,
  });
  const sheetName = workbook.SheetNames.find(
    (name) => workbook.Sheets[name]?.["!ref"],
  );

  if (!sheetName) {
    return {
      columns: ["Source File"],
      rows: [],
    };
  }

  const sheetRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
    header: 1,
    defval: "",
    blankrows: false,
    raw: false,
  });
  const normalizedRows = sheetRows
    .map((row) => row.map((cell) => getCellText(cell).trim()))
    .filter(isDataRow);

  if (normalizedRows.length <= 1) {
    return {
      columns: ["Source File"],
      rows: [],
    };
  }

  const headerRowIndex = findHeaderRowIndex(normalizedRows);
  const headerRow = normalizedRows[headerRowIndex];
  const dataRows = normalizedRows.slice(headerRowIndex + 1);
  const columns = normalizeHeaders(headerRow);

  return {
    columns: [...columns, "Source File"],
    rows: buildRows(columns, dataRows, fileName),
  };
}

function readJsonCache(key, fallback) {
  if (typeof window === "undefined") return fallback;

  try {
    return JSON.parse(window.localStorage.getItem(key) || "") || fallback;
  } catch {
    return fallback;
  }
}

function writeJsonCache(key, value) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(key, JSON.stringify(value));
}

function normalizeUploadsByCard(uploadsByCard) {
  return Object.fromEntries(
    Object.entries(uploadsByCard || {}).map(([cardId, uploads]) => [
      cardId,
      Array.isArray(uploads)
        ? uploads.map((upload, index) => ({
            ...upload,
            id:
              upload.id ||
              `${cardId}-${upload.fileName || "upload"}-${getUploadTimeMs(upload)}-${index}`,
            cardId: upload.cardId || cardId,
            uploadedAtMs: getUploadTimeMs(upload),
          }))
        : [],
    ]),
  );
}

async function readSelectedFile(file) {
  if (/\.csv$/i.test(file.name)) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(parseCsvRows(reader.result, file.name));
      reader.onerror = () => resolve({ columns: ["Source File"], rows: [] });
      reader.readAsText(file);
    });
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        resolve(await parseWorkbookRows(reader.result, file.name));
      } catch {
        resolve({ columns: ["Source File"], rows: [] });
      }
    };
    reader.onerror = () => resolve({ columns: ["Source File"], rows: [] });
    reader.readAsArrayBuffer(file);
  });
}

function createUploadRecordId(cardId, fileName) {
  const uploadedAtMs = Date.now();
  const rand = Math.random().toString(36).slice(2);

  return {
    id: `${cardId}-${fileName}-${uploadedAtMs}-${rand}`,
    uploadedAtMs,
  };
}

function getImportProfileForCard(card) {
  const title = String(card?.title || "").toLowerCase();
  const taskOrders = Array.isArray(card?.taskOrders)
    ? card.taskOrders.map((to) => String(to).toLowerCase()).join(" ")
    : "";
  const combined = `${title} ${taskOrders}`;

  if (combined.includes("fuse")) {
    return "FUSECOM_SKILL_STATISTICS_INBOUND";
  }

  if (combined.includes("hero")) {
    return "HERO_SKILL_STATISTICS_INBOUND";
  }

  return "FUSECOM_SKILL_STATISTICS_INBOUND";
}

function WfmImportDataPage() {
  const dashboard = useDashboardPage();
  const userName = dashboard.authUser?.name || dashboard.authUser?.username || "User";
  const [uploadsByCard, setUploadsByCard] = useState(() =>
    normalizeUploadsByCard(readJsonCache(RAW_DATA_UPLOADS_KEY, {})),
  );
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingCardTitle, setUploadingCardTitle] = useState("");
  const [importStage, setImportStage] = useState("reading");
  const [importFileName, setImportFileName] = useState("");
  const [usVisaBatchResult, setUsVisaBatchResult] = useState(null);
  const [isLoadingUsVisaErrors, setIsLoadingUsVisaErrors] = useState(false);
  const [usVisaErrorDetails, setUsVisaErrorDetails] = useState(null);
  const [activeOpenCard, setActiveOpenCard] = useState(null);
  const [isRemovingUpload, setIsRemovingUpload] = useState(false);
  const [uploadToRemove, setUploadToRemove] = useState(null);
  const [selectedUploadDetails, setSelectedUploadDetails] = useState(null);
  const [addedUpload, setAddedUpload] = useState(null);
  const [removedUpload, setRemovedUpload] = useState(null);
  const [duplicateUploadAlert, setDuplicateUploadAlert] = useState(null);
  const [errorModalInfo, setErrorModalInfo] = useState(null);
  const [rawDataSearch, setRawDataSearch] = useState("");
  const [uploadedDataSearch, setUploadedDataSearch] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("All Accounts");

  const openCardUploads = useMemo(
    () => uploadsByCard[activeOpenCard?.id] || [],
    [activeOpenCard, uploadsByCard],
  );

  const filteredOpenCardUploads = useMemo(() => {
    const searchValue = uploadedDataSearch.trim().toLowerCase();

    if (!searchValue) {
      return openCardUploads;
    }

    return openCardUploads.filter((upload) =>
      upload.fileName.toLowerCase().includes(searchValue),
    );
  }, [openCardUploads, uploadedDataSearch]);

  const filteredRawDataCards = useMemo(() => {
    const cards = getRawDataCards(selectedAccount);
    const searchValue = rawDataSearch.trim().toLowerCase();

    if (!searchValue) {
      return cards;
    }

    return cards.filter(
      (card) =>
        card.title.toLowerCase().includes(searchValue) ||
        card.account.toLowerCase().includes(searchValue) ||
        (card.taskOrders || []).some((to) =>
          to.toLowerCase().includes(searchValue),
        ),
    );
  }, [rawDataSearch, selectedAccount]);

  const filteredAccountOptions = useMemo(() => {
    const searchValue = rawDataSearch.trim().toLowerCase();

    if (!searchValue) {
      return accountOptions;
    }

    return accountOptions.filter((account) =>
      account.toLowerCase().includes(searchValue),
    );
  }, [rawDataSearch]);

  const uploadedCardCounts = useMemo(
    () =>
      Object.fromEntries(
        accountFilters.map((account) => {
          const accCards = getRawDataCards(account);
          const uploadedCount = accCards.filter(
            (card) => (uploadsByCard[card.id] || []).length > 0,
          ).length;

          return [account, uploadedCount];
        }),
      ),
    [uploadsByCard],
  );

  const taskOrderCounts = useMemo(
    () =>
      Object.fromEntries(
        accountFilters.map((account) => {
          if (account === "All Accounts") {
            return [account, accountOptions.length];
          }

          const accCards = getRawDataCards(account);
          const taskOrderCount = accCards.reduce(
            (total, card) => total + Math.max(card.taskOrders?.length || 0, 1),
            0,
          );

          return [account, taskOrderCount];
        }),
      ),
    [],
  );

  useEffect(() => {
    writeJsonCache(RAW_DATA_UPLOADS_KEY, uploadsByCard);
  }, [uploadsByCard]);

  const handleOpenUsVisaErrors = async (batchId) => {
    const targetBatchId = batchId || usVisaBatchResult?.id;

    if (!targetBatchId || isLoadingUsVisaErrors) {
      return;
    }

    setIsLoadingUsVisaErrors(true);

    try {
      const response = await getUsVisaImportBatchErrors(targetBatchId, {
        limit: 50,
      });

      setUsVisaErrorDetails(response);
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

  const handleCardFileSelect = async (card, event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    const currentCardUploads = uploadsByCard[card.id] || [];
    const isDuplicate = currentCardUploads.some(
      (upload) => upload.fileName.toLowerCase() === file.name.toLowerCase(),
    );

    if (isDuplicate) {
      setDuplicateUploadAlert({
        fileName: file.name,
        rawDataTitle: card.title,
      });
      return;
    }

    setIsUploading(true);
    setUploadingCardTitle(card.title);
    setImportFileName(file.name);
    setImportStage("reading");
    setUploadProgress(15);
    setUsVisaBatchResult(null);

    try {
      // Stage 1: Reading workbook
      const importedData = await readSelectedFile(file);
      setUploadProgress(30);
      await new Promise((resolve) => setTimeout(resolve, 200));

      let batchResult = null;
      const isUsVisa = card.account === "US VISA";

      if (isUsVisa) {
        // Stage 2: Uploading payload
        setImportStage("uploading");
        const importProfileId = getImportProfileForCard(card);

        const uploadPromise = uploadUsVisaImport({
          file,
          importProfileId,
          onProgress: (percent) => {
            const scaledProgress = Math.round(30 + percent * 0.35);
            setUploadProgress(scaledProgress);
            if (percent >= 90) {
              setImportStage("validating");
            }
          },
        });

        // Stage 3: Schema validation & hashing on backend
        const uploadResponse = await uploadPromise;
        batchResult = uploadResponse?.batch || null;

        // Stage 4: Record processing & normalization
        setImportStage("processing");
        setUploadProgress(85);
        await new Promise((resolve) => setTimeout(resolve, 250));
      } else {
        setUploadProgress(75);
      }

      // Stage 5: Database staging & client sync
      setImportStage("finalizing");
      setUploadProgress(95);
      await new Promise((resolve) => setTimeout(resolve, 200));

      const { id: uploadId, uploadedAtMs } = createUploadRecordId(card.id, file.name);

      const newUpload = {
        id: uploadId,
        cardId: card.id,
        account: card.account,
        rawDataTitle: card.title,
        fileName: file.name,
        fileSize: file.size || 0,
        filePath: `${card.account}/${card.title}/${file.name}`,
        uploadedAtMs,
        uploadedAt: formatUploadTimestamp(new Date(uploadedAtMs)),
        columns: importedData.columns || ["Source File"],
        rows: importedData.rows || [],
        batchId: batchResult?.id || null,
        batchCode: batchResult?.batchCode || null,
        batchStatus: batchResult?.status || "COMPLETED",
        totalRows: batchResult?.totalRows ?? importedData.rows?.length ?? 0,
        validRows: batchResult?.validRows ?? 0,
        invalidRows: batchResult?.invalidRows ?? 0,
        duplicateRows: batchResult?.duplicateRows ?? 0,
        warningRows: batchResult?.warningRows ?? 0,
      };

      setUploadsByCard((current) => {
        const currentList = current[card.id] || [];
        return {
          ...current,
          [card.id]: [newUpload, ...currentList],
        };
      });

      addWfmHistoryLog({
        action: "imported",
        account: card.account,
        fileName: file.name,
        rawDataTitle: card.title,
        message: `Imported ${file.name} to ${card.title}`,
      });

      if (batchResult) {
        setUsVisaBatchResult(batchResult);
      }

      setAddedUpload({
        count: 1,
        rawDataTitle: card.title,
        fileName: file.name,
        batch: batchResult,
      });
    } catch (error) {
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

  const handleRemoveUpload = async () => {
    if (!uploadToRemove) {
      return;
    }

    const selectedUploadToRemove = uploadToRemove;
    setUploadToRemove(null);
    setIsRemovingUpload(true);

    const batchIdentifier =
      selectedUploadToRemove.batchId || selectedUploadToRemove.batchCode;

    if (batchIdentifier) {
      try {
        await deleteUsVisaImportBatch(batchIdentifier);
        // Small pause for smooth visual UX transition
        await new Promise((resolve) => setTimeout(resolve, 400));
      } catch (error) {
        console.warn(
          "Backend batch removal encountered an issue, continuing with UI cleanup:",
          error?.response?.data || error?.message || error,
        );
      }
    } else {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    removeWfmGraphReportsForUpload(selectedUploadToRemove.id);

    setUploadsByCard((currentUploads) => ({
      ...currentUploads,
      [selectedUploadToRemove.cardId]: (
        currentUploads[selectedUploadToRemove.cardId] || []
      ).filter((upload) => upload.id !== selectedUploadToRemove.id),
    }));

    addWfmHistoryLog({
      action: "removed",
      account: activeOpenCard?.account,
      fileName: selectedUploadToRemove.fileName,
      rawDataTitle: activeOpenCard?.title || selectedUploadToRemove.rawDataTitle,
      message: `Removed ${selectedUploadToRemove.fileName} from ${
        activeOpenCard?.title || selectedUploadToRemove.rawDataTitle
      }`,
    });

    setIsRemovingUpload(false);
    setRemovedUpload(selectedUploadToRemove);
  };

  return (
    <section className="font-jakarta flex min-h-screen bg-[#eef3f7] text-sibs-primary-1">
      <AdminSidebar
        isMobileOpen={dashboard.isMobileSidebarOpen}
        modules={dashboard.modules}
        onLogoutClick={() => dashboard.setShowLogoutModal(true)}
        onMobileClose={() => dashboard.setIsMobileSidebarOpen(false)}
        userName={userName}
        userRole={dashboard.authUser?.email || dashboard.authUser?.roleLabel || "User"}
      />

      <main className="min-w-0 flex-1">
        <AppHeader
          title={`${dashboard.authUser?.roleLabel || "User"} Dashboard`}
          subtitle="Performance Management System"
          onMenuClick={() => dashboard.setIsMobileSidebarOpen(true)}
          onLogoutClick={() => dashboard.setShowLogoutModal(true)}
        />

        <div className="sibs-scrollbar max-h-[calc(100vh-74px)] overflow-y-auto p-3 sm:p-4 lg:p-5">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-start">
            <div className="flex h-9 w-full shrink-0 items-center justify-center truncate rounded-full border border-sibs-tertiary-9 bg-white px-4 text-sm font-extrabold text-sibs-primary-1 sm:w-32">
              {selectedAccount === "All Accounts" ? "All Accounts" : selectedAccount}
            </div>

            <div className="relative w-full shrink-0 sm:w-80">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sibs-tertiary-6"
                aria-hidden="true"
              />
              <input
                value={rawDataSearch}
                onChange={(event) => setRawDataSearch(event.target.value)}
                className="h-9 w-full rounded-full border border-sibs-tertiary-9 bg-white pl-9 pr-4 text-sm outline-none focus:border-sibs-primary-2"
                placeholder="Search data..."
                type="text"
              />
            </div>

            <select
              value={selectedAccount}
              onChange={(event) => setSelectedAccount(event.target.value)}
              className="form-input h-9 w-full shrink-0 rounded-full py-0 sm:w-64"
            >
              {accountFilters.map((account) => (
                <option key={account} value={account}>
                  {account} ({taskOrderCounts[account] || 0})
                </option>
              ))}
            </select>
          </div>

          {selectedAccount === "All Accounts" ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {filteredAccountOptions.map((account) => (
                <button
                  key={account}
                  type="button"
                  onClick={() => {
                    setSelectedAccount(account);
                    setRawDataSearch("");
                  }}
                  className="sibs-card min-h-[130px] p-4 text-left transition hover:border-sibs-primary-2 hover:bg-sibs-primary-2/5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="m-0 truncate text-base font-bold text-sibs-primary-1">
                        {account}
                      </p>
                      <p className="mt-1 mb-0 text-sm font-semibold text-sibs-tertiary-5">
                        Open account raw data
                      </p>
                    </div>
                    <span className="rounded-full bg-[#f8fbfd] px-2.5 py-1 text-xs font-bold text-sibs-primary-1">
                      {uploadedCardCounts[account] || 0}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {filteredRawDataCards.map((card) => {
                const uploads = uploadsByCard[card.id] || [];
                const latestUploads = uploads.slice(0, 5);

                return (
                  <section
                    key={card.id}
                    className="sibs-card flex min-h-[300px] flex-col p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-baseline gap-2">
                        <h2 className="m-0 truncate text-sm font-bold text-sibs-primary-1">
                          {card.title}
                        </h2>
                        <p className="m-0 shrink-0 text-xs font-semibold text-sibs-tertiary-5">
                          Upload Data
                        </p>
                      </div>
                      <span className="rounded-full bg-[#f8fbfd] px-2.5 py-1 text-xs font-bold text-sibs-primary-1">
                        {uploads.length}
                      </span>
                    </div>
                    <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2">
                      <p className="m-0 truncate text-xs font-bold uppercase text-sibs-tertiary-5">
                        {card.account}
                      </p>
                      {card.taskOrders?.length ? (
                        <div className="flex min-w-0 flex-wrap gap-1.5">
                          {card.taskOrders.map((taskOrder) => (
                            <span
                              key={taskOrder}
                              className="rounded-md border border-sibs-tertiary-8 bg-white px-2.5 py-1 text-xs font-extrabold leading-none text-sibs-primary-1"
                            >
                              {taskOrder}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-4 min-h-[170px] flex-1 space-y-1 rounded-lg border border-sibs-tertiary-10 bg-[#f8fbfd] px-3 py-2">
                      {latestUploads.length ? (
                        latestUploads.map((upload) => (
                          <div
                            key={upload.id || `${upload.fileName}-${upload.uploadedAt}`}
                            className="border-b border-sibs-tertiary-10 pb-1 last:border-b-0 last:pb-0"
                          >
                            <p className="m-0 truncate text-[11px] font-semibold leading-4 text-sibs-primary-1">
                              {upload.fileName}
                            </p>
                            <div className="flex items-center justify-between text-[10px] text-sibs-tertiary-5">
                              <span>{formatRelativeTime(upload)}</span>
                              {upload.batchCode ? (
                                <span className="rounded bg-sibs-primary-2/10 px-1 font-mono text-[9px] font-bold text-sibs-primary-2">
                                  {upload.batchCode}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex min-h-[140px] items-center justify-center text-center text-xs text-sibs-tertiary-5">
                          No uploaded data yet
                        </div>
                      )}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2.5">
                      <label className="flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-sibs-primary-1 px-3 text-sm font-semibold text-white shadow-xs transition hover:bg-sibs-tertiary-4">
                        <CloudUpload className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span>Import</span>
                        <input
                          type="file"
                          accept={card.account === "US VISA" ? ".xlsx" : ".xlsx,.xls,.csv"}
                          disabled={isUploading}
                          onChange={(event) => handleCardFileSelect(card, event)}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveOpenCard(card);
                          setUploadedDataSearch("");
                        }}
                        className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-sibs-primary-1 shadow-xs transition hover:border-sibs-primary-1 hover:bg-sibs-primary-1 hover:text-white"
                      >
                        <FolderOpen className="h-4 w-4" aria-hidden="true" />
                        Open
                      </button>
                    </div>
                  </section>
                );
              })}
            </div>
          )}

          {selectedAccount === "All Accounts" && !filteredAccountOptions.length ? (
            <div className="mt-4 rounded-lg border border-dashed border-sibs-tertiary-9 bg-[#f8fbfd] px-5 py-8 text-center text-sm text-sibs-tertiary-5">
              No accounts found.
            </div>
          ) : null}

          {selectedAccount !== "All Accounts" && !filteredRawDataCards.length ? (
            <div className="mt-4 rounded-lg border border-dashed border-sibs-tertiary-9 bg-[#f8fbfd] px-5 py-8 text-center text-sm text-sibs-tertiary-5">
              No raw data cards found.
            </div>
          ) : null}
        </div>
      </main>

      <AppModal
        isOpen={Boolean(activeOpenCard)}
        className="!max-w-none sm:!w-[min(92vw,1100px)]"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="m-0 text-lg font-bold text-sibs-primary-1">
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
              className="h-9 w-full rounded-full border border-sibs-tertiary-9 bg-white pl-9 pr-4 text-sm outline-none focus:border-sibs-primary-2"
              placeholder="Search uploaded data..."
              type="text"
            />
          </div>
        </div>

        <div className="mt-4 max-h-[65vh] min-h-[360px] space-y-2.5 overflow-y-auto rounded-xl border border-slate-200/80 bg-slate-50/50 p-3">
          {filteredOpenCardUploads.length ? (
            filteredOpenCardUploads.map((upload) => {
              const isCompletedWithErrors =
                upload.batchStatus === "COMPLETED_WITH_ERRORS" ||
                (upload.batchId && (upload.invalidRows > 0 || upload.warningRows > 0));

              return (
                <div
                  key={upload.id || `${upload.fileName}-${upload.uploadedAt}`}
                  className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs transition-all hover:border-slate-300 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p
                      className="m-0 break-words text-sm font-bold text-sibs-primary-1"
                      title={upload.fileName}
                    >
                      {upload.fileName}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-sibs-tertiary-5">
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

                  <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                    {isCompletedWithErrors ? (
                      <button
                        type="button"
                        disabled={isLoadingUsVisaErrors}
                        onClick={() => handleOpenUsVisaErrors(upload.batchId)}
                        className="inline-flex h-6 items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 text-[10px] font-semibold text-amber-800 transition-all hover:border-amber-400 hover:bg-amber-100"
                        title="Completed with error - click to view error details"
                      >
                        <AlertTriangle className="h-2.5 w-2.5 shrink-0 text-amber-600" aria-hidden="true" />
                        <span>Completed with error</span>
                      </button>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => setSelectedUploadDetails(upload)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-xs transition-all hover:border-sibs-primary-1 hover:bg-sibs-primary-1 hover:text-white"
                    >
                      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadToRemove(upload)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50/70 px-3 text-xs font-semibold text-rose-600 shadow-xs transition-all hover:border-rose-600 hover:bg-rose-600 hover:text-white"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Remove
                    </button>
                  </div>
              </div>
            );
          })
        ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-12 text-center text-sm text-sibs-tertiary-5">
              {openCardUploads.length ? "No uploaded data found matching search." : "No uploaded data yet."}
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => setActiveOpenCard(null)}
            className="h-10 rounded-lg px-4"
          >
            Close
          </Button>
        </div>
      </AppModal>

      <AppModal isOpen={Boolean(duplicateUploadAlert)} className="max-w-sm" textAlign="center">
        <p className="m-0 text-lg font-bold text-sibs-primary-1">
          Duplicate file name
        </p>
        <p className="mt-2 mb-0 text-sm text-sibs-tertiary-5">
          {duplicateUploadAlert?.fileName} is already imported in {duplicateUploadAlert?.rawDataTitle}. Please choose a different file.
        </p>
        <Button
          type="button"
          onClick={() => setDuplicateUploadAlert(null)}
          className="mt-5 h-10 w-full rounded-lg bg-sibs-primary-1 text-white hover:bg-sibs-tertiary-4"
        >
          Done
        </Button>
      </AppModal>

      <AppModal
        isOpen={Boolean(errorModalInfo)}
        className="max-w-md"
        textAlign="center"
        zIndex="z-[160]"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
          <AlertCircle className="h-6 w-6" aria-hidden="true" />
        </div>
        <p className="mt-4 mb-0 text-lg font-bold text-sibs-primary-1">
          {errorModalInfo?.title || "Error"}
        </p>
        <p className="mt-2 mb-0 text-sm leading-relaxed text-sibs-tertiary-5">
          {errorModalInfo?.message}
        </p>
        <Button
          type="button"
          onClick={() => setErrorModalInfo(null)}
          className="mt-5 h-10 w-full rounded-lg bg-sibs-primary-1 text-white hover:bg-sibs-tertiary-4"
        >
          Got It
        </Button>
      </AppModal>

      <AppModal
        isOpen={Boolean(usVisaErrorDetails)}
        className="!max-w-none sm:!w-[min(92vw,1100px)]"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="m-0 text-lg font-bold text-sibs-primary-1">
              Import Error Details
            </p>
            <p className="mt-1 mb-0 text-sm text-sibs-tertiary-5">
              {usVisaErrorDetails?.batch?.batchCode || usVisaBatchResult?.batchCode}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setUsVisaErrorDetails(null)}
            className="h-9 rounded-lg px-4"
          >
            Close
          </Button>
        </div>

        <div className="sibs-scrollbar mt-4 max-h-[65vh] overflow-auto rounded-lg border border-sibs-tertiary-10">
          <table className="w-max min-w-full border-collapse text-left text-sm">
            <thead className="bg-sibs-primary-3/50 text-xs uppercase text-sibs-tertiary-6">
              <tr>
                <th className="px-4 py-3 font-bold">Sheet</th>
                <th className="px-4 py-3 font-bold">Row</th>
                <th className="px-4 py-3 font-bold">Severity</th>
                <th className="px-4 py-3 font-bold">Code</th>
                <th className="px-4 py-3 font-bold">Column</th>
                <th className="px-4 py-3 font-bold">Value</th>
                <th className="px-4 py-3 font-bold">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sibs-tertiary-10">
              {usVisaErrorDetails?.data?.length ? (
                usVisaErrorDetails.data.map((error) => (
                  <tr key={error.id} className="bg-[#f8fbfd]">
                    <td className="whitespace-nowrap px-4 py-3 text-sibs-primary-1">
                      {error.sheetName || "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sibs-tertiary-5">
                      {error.excelRowNumber || "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-bold text-sibs-primary-1">
                      {error.severity || "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sibs-tertiary-5">
                      {error.errorCode || "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sibs-tertiary-5">
                      {error.columnName || "-"}
                    </td>
                    <td
                      className="max-w-[220px] truncate px-4 py-3 text-sibs-tertiary-5"
                      title={String(error.rawValue || "")}
                    >
                      {error.rawValue || "-"}
                    </td>
                    <td className="min-w-[320px] px-4 py-3 text-sibs-tertiary-5">
                      {error.errorMessage || "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="bg-[#f8fbfd] px-5 py-8 text-center text-sm text-sibs-tertiary-5"
                  >
                    No error details found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </AppModal>

      <AppModal
        isOpen={Boolean(addedUpload)}
        className="!max-w-none sm:!w-[640px]"
        textAlign="center"
      >
        <p className="m-0 text-lg font-bold text-sibs-primary-1">
          Import Successful
        </p>
        <p className="mt-2 mb-0 text-sm text-sibs-tertiary-5">
          <span className="font-semibold text-sibs-primary-1">
            {addedUpload?.fileName}
          </span>{" "}
          was imported to{" "}
          <span className="font-semibold text-sibs-primary-1">
            {addedUpload?.rawDataTitle}
          </span>
          .
        </p>

        {addedUpload?.batch ? (
          <div className="mt-4 rounded-xl border border-sibs-tertiary-10 bg-white p-4 text-left">
            <div className="flex items-center justify-between text-xs font-bold text-sibs-primary-1">
              <span className="font-mono text-sibs-primary-2">
                Batch: {addedUpload.batch.batchCode}
              </span>
              <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                {formatImportStatus(addedUpload.batch.status)}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
              <BatchStat label="Total Rows" value={addedUpload.batch.totalRows} />
              <BatchStat label="Valid Rows" value={addedUpload.batch.validRows} />
              <BatchStat label="Invalid Rows" value={addedUpload.batch.invalidRows} />
              <BatchStat label="Duplicate Rows" value={addedUpload.batch.duplicateRows} />
              <BatchStat label="Warning Rows" value={addedUpload.batch.warningRows} />
            </div>
          </div>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          {addedUpload?.batch && (addedUpload.batch.invalidRows > 0 || addedUpload.batch.warningRows > 0) ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const batchId = addedUpload.batch.id;
                setAddedUpload(null);
                handleOpenUsVisaErrors(batchId);
              }}
              className="h-10 rounded-lg border-sibs-danger/30 px-4 text-sibs-danger hover:bg-sibs-danger hover:text-white"
            >
              View Errors
            </Button>
          ) : null}
          <Button
            type="button"
            onClick={() => setAddedUpload(null)}
            className="h-10 rounded-lg bg-sibs-primary-1 px-4 text-white hover:bg-sibs-tertiary-4"
          >
            Done
          </Button>
        </div>
      </AppModal>

      <AppModal
        isOpen={Boolean(selectedUploadDetails)}
        className="!max-w-none sm:!w-[640px]"
        zIndex="z-[140]"
      >
        <div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-sibs-primary-2/10 px-2 py-0.5 text-xs font-bold text-sibs-primary-2">
                {activeOpenCard?.title || selectedUploadDetails?.rawDataTitle || "Import"}
              </span>
              <span className="text-xs font-semibold text-sibs-tertiary-5">
                {activeOpenCard?.account || selectedUploadDetails?.account}
              </span>
            </div>

            {selectedUploadDetails?.batchStatus === "COMPLETED_WITH_ERRORS" || (selectedUploadDetails?.invalidRows > 0) ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                <AlertTriangle className="h-2.5 w-2.5 shrink-0 text-amber-600" aria-hidden="true" />
                Completed with errors
              </span>
            ) : (
              <span className="inline-flex shrink-0 items-center rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                Completed
              </span>
            )}
          </div>

          <p className="mt-2 mb-0 break-words text-sm font-bold leading-snug text-sibs-primary-1">
            {selectedUploadDetails?.fileName}
          </p>

          <p className="mt-1 mb-0 text-xs text-sibs-tertiary-5">
            {selectedUploadDetails?.batchCode ? `Batch: ${selectedUploadDetails.batchCode} • ` : ""}
            {selectedUploadDetails?.uploadedAt} ({formatRelativeTime(selectedUploadDetails)})
          </p>
        </div>

        <div className="mt-4 rounded-xl border border-sibs-tertiary-10 bg-white p-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            <BatchStat label="Total Rows" value={selectedUploadDetails?.totalRows} />
            <BatchStat label="Valid Rows" value={selectedUploadDetails?.validRows} />
            <BatchStat label="Invalid Rows" value={selectedUploadDetails?.invalidRows} />
            <BatchStat label="Duplicate Rows" value={selectedUploadDetails?.duplicateRows} />
            <BatchStat label="Warning Rows" value={selectedUploadDetails?.warningRows} />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          {selectedUploadDetails?.batchId && (selectedUploadDetails.invalidRows > 0 || selectedUploadDetails.warningRows > 0) ? (
            <Button
              type="button"
              variant="outline"
              disabled={isLoadingUsVisaErrors}
              onClick={() => handleOpenUsVisaErrors(selectedUploadDetails.batchId)}
              className="h-9 rounded-lg border-sibs-danger/30 px-3 text-xs text-sibs-danger hover:bg-sibs-danger hover:text-white"
            >
              <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
              View Error Details ({selectedUploadDetails.invalidRows})
            </Button>
          ) : null}
          <Button
            type="button"
            onClick={() => setSelectedUploadDetails(null)}
            className="h-9 rounded-lg bg-sibs-primary-1 px-4 text-xs font-bold text-white hover:bg-sibs-tertiary-4"
          >
            Close
          </Button>
        </div>
      </AppModal>

      <ConfirmationModal
        isOpen={Boolean(uploadToRemove)}
        title="Remove imported data"
        message={`Are you sure you want to remove ${uploadToRemove?.fileName || "this file"} from ${activeOpenCard?.title || "this raw data"}? This will permanently delete the batch and all its database records.`}
        cancelText="Cancel"
        confirmText="Remove"
        onCancel={() => setUploadToRemove(null)}
        onConfirm={handleRemoveUpload}
        tone="neutral"
        zIndex="z-[130]"
      />

      <AppModal
        isOpen={Boolean(removedUpload)}
        className="max-w-sm"
        textAlign="center"
        zIndex="z-[150]"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
        </div>
        <p className="mt-4 mb-0 text-lg font-bold text-sibs-primary-1">
          Data Removed Successfully
        </p>
        <p className="mt-2 mb-0 text-sm text-sibs-tertiary-5">
          <span className="font-semibold text-sibs-primary-1">
            {removedUpload?.fileName}
          </span>{" "}
          and all associated database records have been deleted.
        </p>
        <Button
          type="button"
          onClick={() => setRemovedUpload(null)}
          className="mt-5 h-10 w-full rounded-lg bg-sibs-primary-1 text-white hover:bg-sibs-tertiary-4"
        >
          Done
        </Button>
      </AppModal>

      <ConfirmationModal
        isOpen={dashboard.showLogoutModal}
        title="Confirm logout"
        message="Are you sure you want to logout?"
        cancelText="Cancel"
        confirmText="Logout"
        onCancel={() => dashboard.setShowLogoutModal(false)}
        onConfirm={dashboard.handleLogout}
        tone="neutral"
      />

      <LoadingModal
        isOpen={dashboard.isLoggingOut}
        title="Logging out"
        message="Please wait while we end your session."
      />

      <ImportProgressModal
        isOpen={isUploading}
        fileName={importFileName}
        cardTitle={uploadingCardTitle}
        currentStage={importStage}
        progressPercent={uploadProgress}
      />

      <LoadingModal
        isOpen={isRemovingUpload}
        title="Removing data"
        message="Please wait while the file and database records are removed..."
        zIndex="z-[150]"
      />
    </section>
  );
}

export default WfmImportDataPage;
