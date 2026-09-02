// WFM page for uploading and managing raw data files.
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  CloudUpload,
  ListPlus,
  Eye,
  FileSpreadsheet,
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
import { getAuthDisplayName } from "@/lib/auth";
import { recordWfmHistoryLogQuietly } from "@/lib/axios/wfm-history-logs";
import { removeWfmGraphReportsForUpload } from "@/lib/wfm-graph-reports";
import {
  accountOptions,
  getRawDataCardByImportProfileCode,
  getRawDataCards,
} from "@/lib/wfm-raw-data-cards";
import {
  deleteUsVisaImportBatch,
  getUsVisaImportBatchErrors,
  getUsVisaImportHistory,
  getUsVisaImportSummary,
  uploadUsVisaImport,
} from "@/lib/axios/us-visa-imports";

const RAW_DATA_UPLOADS_KEY = "sibs-wfm-raw-data-uploads";

const accountFilters = [
  "All Accounts",
  ...accountOptions,
];

const EMPTY_IMPORT_SUMMARY = {
  totalUploads: 0,
  uploadsWithIssues: 0,
  totalRows: 0,
  validRows: 0,
  invalidRows: 0,
  duplicateRows: 0,
  warningRows: 0,
};

const IMPORT_SUMMARY_CARDS = [
  {
    key: "totalUploads",
    label: "TOTAL UPLOADS",
    icon: CloudUpload,
    borderClass: "border-sky-200",
    accentClass: "bg-sky-400",
    iconBgClass: "bg-sky-50",
    iconClass: "text-sky-600",
  },
  {
    key: "totalRows",
    label: "RECORDS PROCESSED",
    icon: FileSpreadsheet,
    borderClass: "border-cyan-200",
    accentClass: "bg-cyan-400",
    iconBgClass: "bg-cyan-50",
    iconClass: "text-cyan-600",
  },
  {
    key: "validRows",
    label: "RECORDS ACCEPTED",
    icon: CheckCircle2,
    borderClass: "border-emerald-200",
    accentClass: "bg-emerald-400",
    iconBgClass: "bg-emerald-50",
    iconClass: "text-emerald-600",
  },
  {
    key: "invalidRows",
    label: "RECORDS REJECTED",
    icon: AlertCircle,
    borderClass: "border-rose-200",
    accentClass: "bg-rose-400",
    iconBgClass: "bg-rose-50",
    iconClass: "text-rose-600",
  },
  {
    key: "duplicateRows",
    label: "DUPLICATES FOUND",
    icon: ListPlus,
    borderClass: "border-orange-200",
    accentClass: "bg-orange-400",
    iconBgClass: "bg-orange-50",
    iconClass: "text-orange-600",
  },
  {
    key: "warningRows",
    label: "WARNINGS FOUND",
    icon: AlertTriangle,
    borderClass: "border-amber-200",
    accentClass: "bg-amber-400",
    iconBgClass: "bg-amber-50",
    iconClass: "text-amber-600",
  },
];

const importSummaryNumberFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function getApiErrorMessage(error, card) {
  const backendMsg = error?.response?.data?.message || "";
  const backendCode = error?.response?.data?.code || "";

  if (backendMsg) {
    return backendMsg;
  }

  if (backendCode === "CORRUPTED_WORKBOOK") {
    return "The uploaded XLSX file could not be opened as a valid Excel workbook. Please re-export the report from the source system and try again.";
  }

  if (backendCode === "INVALID_EXCEL_FILE") {
    return "The selected file could not be read as an Excel workbook. Please select a valid .xlsx file and try again.";
  }

  if (backendCode === "INVALID_FILE_TYPE") {
    return "Only .xlsx files are supported for this import.";
  }

  if (backendCode === "FILE_TOO_LARGE") {
    return "The selected workbook exceeds the maximum allowed upload size.";
  }

  if (
    backendCode === "MISSING_REQUIRED_WORKSHEET" ||
    backendCode === "MISSING_REQUIRED_SHEET" ||
    backendCode === "MISSING_REQUIRED_COLUMN" ||
    backendCode === "MISSING_REQUIRED_HEADER" ||
    backendCode === "WRONG_IMPORT_PROFILE"
  ) {
    const profileLabel = card?.title || "valid";
    const reportTypeLabel = /agent/i.test(profileLabel)
      ? "Agent Level"
      : "Skill Statistics";

    if (/hero/i.test(profileLabel || card?.id || "")) {
      return `Only HeroDash ${reportTypeLabel} (.xlsx) files are allowed for this card. The uploaded file is missing required HeroDash ${reportTypeLabel} sheets or headers.`;
    }
    if (/fusenet/i.test(profileLabel || card?.id || "")) {
      return `Only FuseNet ${reportTypeLabel} (.xlsx) files are allowed for this card. The uploaded file is missing required FuseNet ${reportTypeLabel} sheets or headers.`;
    }
    if (/fuse/i.test(profileLabel || card?.id || "")) {
      return `Only Fusecom ${reportTypeLabel} (.xlsx) files are allowed for this card. The uploaded file is missing required Fusecom ${reportTypeLabel} sheets or headers.`;
    }
    return `Only ${profileLabel} (.xlsx) reports are allowed for this card. The uploaded file does not match the required format.`;
  }
}

const BATCH_DETAIL_TONES = {
  blue: {
    border: "border-sky-100",
    background: "bg-sky-50/60",
    iconBackground: "bg-sky-100",
    icon: "text-sky-600",
  },
  emerald: {
    border: "border-emerald-100",
    background: "bg-emerald-50/60",
    iconBackground: "bg-emerald-100",
    icon: "text-emerald-600",
  },
  rose: {
    border: "border-rose-100",
    background: "bg-rose-50/60",
    iconBackground: "bg-rose-100",
    icon: "text-rose-600",
  },
  orange: {
    border: "border-orange-100",
    background: "bg-orange-50/60",
    iconBackground: "bg-orange-100",
    icon: "text-orange-600",
  },
  amber: {
    border: "border-amber-100",
    background: "bg-amber-50/60",
    iconBackground: "bg-amber-100",
    icon: "text-amber-600",
  },
};

function BatchDetailStat({ label, value, icon: Icon, tone = "blue" }) {
  const styles = BATCH_DETAIL_TONES[tone] || BATCH_DETAIL_TONES.blue;

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border ${styles.border} ${styles.background} p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md`}
    >
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
        <div className="min-w-0">
          <p className="m-0 min-w-0 text-[9px] font-extrabold uppercase leading-[1.05] tracking-normal text-sibs-tertiary-5">
            {label}
          </p>
          <p className="mt-2 mb-0 text-[22px] font-black leading-none tracking-tight text-sibs-primary-1">
            {Number(value || 0).toLocaleString()}
          </p>
        </div>
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${styles.iconBackground} ${styles.icon}`}
        >
          <Icon className="h-3 w-3" aria-hidden="true" />
        </span>
      </div>
    </div>
  );
}

function formatUploadTimestamp(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

function getUploadTimeMs(upload) {
  if (upload?.uploadedAtMs && !Number.isNaN(Number(upload.uploadedAtMs))) {
    return Number(upload.uploadedAtMs);
  }

  const parsedTime = new Date(upload?.uploadedAt || "").getTime();

  return Number.isNaN(parsedTime) ? Date.now() : parsedTime;
}

function formatRelativeTime(upload) {
  const uploadMs = getUploadTimeMs(upload);
  const elapsedMs = Math.max(0, Date.now() - uploadMs);
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

function formatImportStatus(status) {
  switch (status) {
    case "COMPLETED":
      return "Completed";
    case "COMPLETED_WITH_ERRORS":
      return "Completed with warnings";
    case "FAILED":
      return "Failed";
    case "DUPLICATE":
      return "Duplicate";
    default:
      return status ? String(status).replace(/_/g, " ") : "Completed";
  }
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
  return String(card?.importProfileCode || "").trim() || null;
}

function mapBatchToUpload(batch) {
  if (!batch || batch.status === "FAILED") {
    return null;
  }

  const profileCode = String(batch.importProfileCode || "").trim();
  const card = getRawDataCardByImportProfileCode(profileCode);

  if (!card) {
    return null;
  }

  const cardId = card.id;
  const rawDataTitle = card.title;
  const account = "US VISA";

  let uploadedAtMs = Date.now();
  if (batch.createdAt) {
    const raw = String(batch.createdAt).trim();
    const normalized =
      raw.includes("Z") || raw.includes("+")
        ? raw
        : `${raw.replace(" ", "T")}+08:00`;
    const parsed = new Date(normalized).getTime();
    if (!Number.isNaN(parsed)) {
      uploadedAtMs = parsed;
    }
  }

  const uploadedAt = batch.formattedTime || formatUploadTimestamp(new Date(uploadedAtMs));

  return {
    id: `batch-${batch.id}`,
    batchId: batch.id,
    batchCode: batch.batchCode,
    cardId,
    account,
    rawDataTitle,
    importProfileCode: profileCode,
    importProfileName: batch.importProfileName || rawDataTitle,
    sourceSystem: batch.sourceSystem || card.sourceLabel,
    fileName: batch.sourceFilename,
    fileSize: batch.fileSize || 0,
    filePath: `${account}/${rawDataTitle}/${batch.sourceFilename}`,
    uploadedAtMs,
    uploadedAt,
    batchStatus: batch.status || "COMPLETED",
    totalRows: batch.totalRows || 0,
    validRows: batch.validRows || 0,
    invalidRows: batch.invalidRows || 0,
    duplicateRows: batch.duplicateRows || 0,
    warningRows: batch.warningRows || 0,
    uploadedBy: batch.uploadedBy || null,
  };
}

function WfmImportDataPage() {
  const dashboard = useDashboardPage();
  const userName = dashboard.userName || getAuthDisplayName(dashboard.authUser);
  const [uploadsByCard, setUploadsByCard] = useState(() =>
    normalizeUploadsByCard(readJsonCache(RAW_DATA_UPLOADS_KEY, {})),
  );
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

  const groupedRawDataCards = useMemo(() => {
    const groups = [];

    for (const card of filteredRawDataCards) {
      const groupLabel = card.groupLabel || "RAW DATA";
      let group = groups.find((item) => item.label === groupLabel);

      if (!group) {
        group = {
          label: groupLabel,
          cards: [],
        };
        groups.push(group);
      }

      group.cards.push(card);
    }

    return groups;
  }, [filteredRawDataCards]);

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

  const sourceSystemCounts = useMemo(
    () =>
      Object.fromEntries(
        accountFilters.map((account) => {
          if (account === "All Accounts") {
            return [account, accountOptions.length];
          }

          const accCards = getRawDataCards(account);
          return [account, accCards.length];
        }),
      ),
    [],
  );

  useEffect(() => {
    writeJsonCache(RAW_DATA_UPLOADS_KEY, uploadsByCard);
  }, [uploadsByCard]);

  const fetchDatabaseUploads = async () => {
    try {
      const response = await getUsVisaImportHistory({ limit: 100 });
      if (response?.data && Array.isArray(response.data)) {
        const dbUploads = response.data.map(mapBatchToUpload).filter(Boolean);

        setUploadsByCard((current) => {
          const updated = { ...current };
          const usVisaCards = getRawDataCards("US VISA");

          for (const card of usVisaCards) {
            updated[card.id] = dbUploads.filter((upload) => upload.cardId === card.id);
          }

          writeJsonCache(RAW_DATA_UPLOADS_KEY, updated);
          return updated;
        });
      }
    } catch (error) {
      console.warn("Could not sync database import batches:", error?.message);
    }
  };

  useEffect(() => {
    fetchDatabaseUploads();
  }, []);

  useEffect(() => {
    let isActive = true;

    setImportSummary(EMPTY_IMPORT_SUMMARY);

    const loadImportSummary = async () => {
      try {
        const response = await getUsVisaImportSummary({
          account: selectedAccount,
        });

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
      let importedData = {
        columns: ["Source File"],
        rows: [],
      };

      if (!isUsVisa) {
        importedData = await readSelectedFile(file);
        setUploadProgress(30);
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      let batchResult = null;

      if (isUsVisa) {
        const importProfileId = getImportProfileForCard(card);

        if (!importProfileId) {
          throw new Error(
            `${card.title} raw-data import is not configured yet.`,
          );
        }

        const uploadPromise = uploadUsVisaImport({
          file,
          importProfileId,
          onProgress: (percent) => {
            const scaledProgress = Math.round(5 + percent * 0.6);
            setUploadProgress(scaledProgress);
            if (percent >= 90) {
              setImportStage("processing");
            }
          },
        });

        const uploadResponse = await uploadPromise;
        batchResult = uploadResponse?.batch || null;

        if (batchResult?.status === "DUPLICATE") {
          setDuplicateUploadAlert({
            fileName: file.name,
            rawDataTitle: card.title,
          });
          return;
        }

        if (batchResult?.status === "FAILED") {
          throw new Error(
            batchResult.errorMessage ||
            "Workbook structure validation failed. Please check the required worksheet format.",
          );
        }

        setUploadProgress(90);
      } else {
        setUploadProgress(75);
      }

      setImportStage("finalizing");
      setUploadProgress(95);

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
        importProfileCode: card.importProfileCode || null,
        importProfileName: batchResult?.importProfileName || card.title,
        sourceSystem: batchResult?.sourceSystem || card.sourceLabel || card.title,
      };

      setUploadsByCard((current) => {
        const currentList = current[card.id] || [];
        return {
          ...current,
          [card.id]: [newUpload, ...currentList],
        };
      });

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

    void fetchDatabaseUploads();
    setSummaryRefreshVersion((current) => current + 1);

    setIsRemovingUpload(false);
    setRemovedUpload(selectedUploadToRemove);

    void recordWfmHistoryLogQuietly({
      action: "removed",
      account: selectedUploadToRemove.account || activeOpenCard?.account,
      rawDataTitle:
        selectedUploadToRemove.rawDataTitle ||
        activeOpenCard?.title ||
        "Raw Data",
      fileName: selectedUploadToRemove.fileName,
      message: `Removed ${selectedUploadToRemove.fileName} from ${selectedUploadToRemove.account || activeOpenCard?.account || "WFM"
        } - ${selectedUploadToRemove.rawDataTitle ||
        activeOpenCard?.title ||
        "Raw Data"
        }.`,
    });
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
                  {account} ({sourceSystemCounts[account] || 0})
                </option>
              ))}
            </select>
          </div>

          <div
            className="mb-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6"
            aria-label="Import summary"
          >
            {IMPORT_SUMMARY_CARDS.map((card) => {
              const value = Number(importSummary?.[card.key] || 0);
              const uploadsWithIssues = Number(
                importSummary?.uploadsWithIssues || 0,
              );
              const isTotalUploadsCard = card.key === "totalUploads";
              const Icon = card.icon;

              return (
                <div
                  key={card.key}
                  className={`group relative min-w-0 overflow-hidden rounded-xl border bg-white px-3.5 pb-3 pt-3.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${card.borderClass}`}
                  title={
                    isTotalUploadsCard && uploadsWithIssues > 0
                      ? `${card.label}: ${value.toLocaleString()} • ${uploadsWithIssues.toLocaleString()} with issues`
                      : `${card.label}: ${value.toLocaleString()}`
                  }
                >
                  <div
                    className={`absolute inset-x-0 top-0 h-[3px] ${card.accentClass}`}
                    aria-hidden="true"
                  />

                  <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                    <p className="m-0 min-w-0 break-words text-[9px] font-extrabold leading-tight tracking-[0.04em] text-sibs-tertiary-5">
                      {card.label}
                    </p>

                    <span
                      className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105 ${card.iconBgClass}`}
                    >
                      <Icon
                        className={`h-3.5 w-3.5 ${card.iconClass}`}
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                    </span>
                  </div>

                  <div className="mt-2 flex min-w-0 items-end justify-between gap-2">
                    <p className="m-0 min-w-0 lowercase text-[22px] font-extrabold leading-none tracking-tight text-sibs-primary-1">
                      {importSummaryNumberFormatter.format(value)}
                    </p>

                    {isTotalUploadsCard && uploadsWithIssues > 0 ? (
                      <span className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[9px] font-bold leading-none text-amber-700 shadow-sm">
                        <AlertTriangle
                          className="h-3 w-3 shrink-0"
                          strokeWidth={2.25}
                          aria-hidden="true"
                        />
                        {importSummaryNumberFormatter.format(uploadsWithIssues)}{" "}
                        {uploadsWithIssues === 1 ? "issue" : "issues"}
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          {selectedAccount === "All Accounts" ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {filteredAccountOptions.map((account) => {
                const totalSourceSystems =
                  sourceSystemCounts[account] || 0;

                return (
                  <button
                    key={account}
                    type="button"
                    onClick={() => {
                      setSelectedAccount(account);
                      setRawDataSearch("");
                    }}
                    className="group sibs-card flex min-h-[100px] cursor-pointer flex-col justify-between p-4 text-left shadow-xs transition-colors duration-150 hover:border-sibs-primary-1"
                  >
                    <div className="min-w-0">
                      <p className="m-0 truncate text-base font-bold text-sibs-primary-1">
                        {account}
                      </p>
                      <p className="mt-1 mb-0 text-xs font-semibold text-sibs-tertiary-5">
                        {totalSourceSystems}{" "}
                        {totalSourceSystems === 1
                          ? "Source System"
                          : "Source Systems"}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-end border-t border-slate-100 pt-2 text-[11px] font-bold text-sibs-primary-1">
                      <span className="inline-flex items-center gap-1 text-sibs-primary-1">
                        View Source System →
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-5">
              {groupedRawDataCards.map((group) => (
                <section key={group.label} className="min-w-0">
                  <div className="mb-2 flex items-center gap-2">
                    <h2 className="m-0 text-[11px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
                      {group.label}
                    </h2>
                    <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    {group.cards.map((card) => {
                      const uploads = uploadsByCard[card.id] || [];
                      const latestUploads = uploads.slice(0, 3);

                      return (
                        <section
                          key={card.id}
                          className="sibs-card flex min-h-[350px] flex-col justify-between p-4 shadow-xs transition hover:border-sibs-primary-1/40"
                        >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-baseline gap-2">
                          <h2 className="m-0 truncate text-base font-extrabold text-sibs-primary-1">
                            {card.title}
                          </h2>
                          <span className="shrink-0 text-[11px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
                            {card.account}
                          </span>
                        </div>
                        <span
                          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${uploads.length > 0
                              ? "border border-emerald-200/80 bg-emerald-50 text-emerald-700"
                              : "border border-slate-200 bg-slate-50 text-slate-500"
                            }`}
                        >
                          {uploads.length > 0 ? (
                            <>
                              <CheckCircle2 size={11} className="shrink-0" />
                              {uploads.length} {uploads.length === 1 ? "file" : "files"}
                            </>
                          ) : (
                            "0 files"
                          )}
                        </span>
                      </div>

                      {card.taskOrders?.length ? (
                        <div className="mt-2.5 flex min-w-0 flex-wrap items-center gap-1.5 text-xs">
                          <span className="text-[10px] font-extrabold uppercase text-sibs-tertiary-5">
                            TASK ORDERS:
                          </span>
                          <div className="flex min-w-0 flex-wrap gap-1">
                            {card.taskOrders.map((taskOrder) => (
                              <span
                                key={taskOrder}
                                className="rounded-md border border-sibs-tertiary-8 bg-white px-2 py-0.5 text-[11px] font-bold text-sibs-primary-1 shadow-2xs"
                              >
                                {taskOrder}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-3.5 min-h-[175px] flex-1 rounded-xl border border-slate-200/80 bg-slate-50/50 p-2.5">
                      {latestUploads.length ? (
                        <div className="space-y-1.5">
                          {latestUploads.map((upload) => (
                            <div
                              key={upload.id || `${upload.fileName}-${upload.uploadedAt}`}
                              className="rounded-lg border border-slate-200/60 bg-white p-2 shadow-2xs transition hover:border-slate-300"
                            >
                              <div className="flex items-start gap-2">
                                <FileSpreadsheet
                                  size={15}
                                  className="mt-0.5 shrink-0 text-sibs-primary-1/70"
                                />
                                <div className="min-w-0 flex-1">
                                  <p
                                    className="m-0 truncate text-[11px] font-bold text-sibs-primary-1"
                                    title={upload.fileName}
                                  >
                                    {upload.fileName}
                                  </p>
                                  <div className="mt-0.5 flex items-center justify-between text-[10px] text-sibs-tertiary-5">
                                    <span>{formatRelativeTime(upload)}</span>
                                    {upload.batchCode ? (
                                      <span className="rounded bg-sibs-primary-2/10 px-1 font-mono text-[9px] font-bold text-sibs-primary-2">
                                        {upload.batchCode}
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex h-full min-h-[120px] flex-col items-center justify-center p-3 text-center">
                          <CloudUpload
                            size={22}
                            className="mb-1.5 text-slate-400 opacity-60"
                          />
                          <p className="m-0 text-xs font-semibold text-sibs-tertiary-5">
                            No uploaded data yet
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-3.5 grid grid-cols-2 gap-2.5">
                      <label className="flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-sibs-primary-1 px-3 text-xs font-bold text-white shadow-xs transition hover:bg-sibs-tertiary-4">
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
                        className="flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-sibs-primary-1 shadow-xs transition hover:border-sibs-primary-1 hover:bg-sibs-primary-1 hover:text-white"
                      >
                        <FolderOpen className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span>Open</span>
                      </button>
                    </div>
                        </section>
                      );
                    })}
                  </div>
                </section>
              ))}
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
        zIndex="z-[160]"
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
            <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-5">
              <BatchDetailStat
                label="Total Rows"
                value={addedUpload.batch.totalRows}
                icon={FileSpreadsheet}
                tone="blue"
              />
              <BatchDetailStat
                label="Valid Rows"
                value={addedUpload.batch.validRows}
                icon={CheckCircle2}
                tone="emerald"
              />
              <BatchDetailStat
                label="Invalid Rows"
                value={addedUpload.batch.invalidRows}
                icon={AlertCircle}
                tone="rose"
              />
              <BatchDetailStat
                label="Duplicate Rows"
                value={addedUpload.batch.duplicateRows}
                icon={ListPlus}
                tone="orange"
              />
              <BatchDetailStat
                label="Warning Rows"
                value={addedUpload.batch.warningRows}
                icon={AlertTriangle}
                tone="amber"
              />
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
        className="!max-w-none sm:!w-[720px]"
        zIndex="z-[140]"
      >
        <div className="overflow-hidden rounded-2xl border border-sibs-tertiary-10 bg-white shadow-sm">
          <div className="bg-gradient-to-br from-slate-50 via-white to-sky-50/50 px-5 py-5 sm:px-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-sky-100 bg-sky-50 text-sky-600 shadow-sm">
                  <FileSpreadsheet className="h-5 w-5" aria-hidden="true" />
                </div>

                <div className="min-w-0">
                  <p className="m-0 text-[10px] font-extrabold uppercase tracking-[0.08em] text-sibs-tertiary-5">
                    Batch details
                  </p>

                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-sibs-primary-2/10 px-2.5 py-1 text-[11px] font-extrabold text-sibs-primary-2">
                      {activeOpenCard?.title || selectedUploadDetails?.rawDataTitle || "Import"}
                    </span>
                    <span className="text-[11px] font-bold text-sibs-tertiary-5">
                      {activeOpenCard?.account || selectedUploadDetails?.account}
                    </span>
                  </div>

                  <p className="mt-3 mb-0 break-words text-[15px] font-extrabold leading-snug text-sibs-primary-1 [overflow-wrap:anywhere]">
                    {selectedUploadDetails?.fileName}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-sibs-tertiary-5">
                    {selectedUploadDetails?.batchCode ? (
                      <span className="rounded-md bg-white/80 px-2 py-1 font-mono font-semibold text-sibs-primary-2 shadow-sm ring-1 ring-slate-200/70">
                        {selectedUploadDetails.batchCode}
                      </span>
                    ) : null}
                    <span>
                      {selectedUploadDetails?.uploadedAt} ({formatRelativeTime(selectedUploadDetails)})
                    </span>
                  </div>
                </div>
              </div>

              {selectedUploadDetails?.batchStatus === "COMPLETED_WITH_ERRORS" || (selectedUploadDetails?.invalidRows > 0) ? (
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-amber-800 shadow-sm">
                  <AlertTriangle className="h-3 w-3 shrink-0 text-amber-600" aria-hidden="true" />
                  Completed with errors
                </span>
              ) : (
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-emerald-700 shadow-sm">
                  <CheckCircle2 className="h-3 w-3 shrink-0" aria-hidden="true" />
                  Completed
                </span>
              )}
            </div>
          </div>

          <div className="border-t border-sibs-tertiary-10 px-5 py-5 sm:px-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
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
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-sibs-tertiary-10 pt-4">
          {selectedUploadDetails?.batchId && (selectedUploadDetails.invalidRows > 0 || selectedUploadDetails.warningRows > 0) ? (
            <Button
              type="button"
              variant="outline"
              disabled={isLoadingUsVisaErrors}
              onClick={() => handleOpenUsVisaErrors(selectedUploadDetails.batchId)}
              className="h-10 rounded-xl border-rose-200 bg-rose-50 px-4 text-xs font-bold text-rose-700 shadow-sm hover:border-rose-300 hover:bg-rose-100 hover:text-rose-800"
            >
              <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
              View Error Details ({selectedUploadDetails.invalidRows})
            </Button>
          ) : null}
          <Button
            type="button"
            onClick={() => setSelectedUploadDetails(null)}
            className="h-10 rounded-xl bg-sibs-primary-1 px-5 text-xs font-bold text-white shadow-sm hover:bg-sibs-tertiary-4"
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
          <span className="break-words font-semibold text-sibs-primary-1 [overflow-wrap:anywhere]">
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

      <LoadingModal
        isOpen={isLoadingUsVisaErrors}
        title="Loading error details"
        message="Please wait while we retrieve the import error records..."
        zIndex="z-[155]"
      />
    </section>
  );
}

export default WfmImportDataPage;
