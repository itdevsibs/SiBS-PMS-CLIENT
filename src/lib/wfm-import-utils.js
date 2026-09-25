import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  CloudUpload,
  FileSpreadsheet,
  ListPlus,
} from "lucide-react";
import {
  accountOptions,
  getRawDataCardByImportProfileCode,
  getRawDataCards,
} from "@/lib/wfm-raw-data-cards";
import { uploadUsVisaImport } from "@/lib/axios/us-visa-imports";

export const RAW_DATA_UPLOADS_KEY = "sibs-wfm-raw-data-uploads";

export const accountFilters = [
  "All Accounts",
  ...accountOptions,
];

export const EMPTY_IMPORT_SUMMARY = {
  totalUploads: 0,
  uploadsWithIssues: 0,
  totalRows: 0,
  validRows: 0,
  invalidRows: 0,
  duplicateRows: 0,
  warningRows: 0,
  infoRows: 0,
};

export const IMPORT_SUMMARY_CARDS = [
  {
    key: "totalUploads",
    label: "TOTAL UPLOADS",
    icon: CloudUpload,
  },
  {
    key: "totalRows",
    label: "RECORDS PROCESSED",
    icon: FileSpreadsheet,
  },
  {
    key: "validRows",
    label: "RECORDS ACCEPTED",
    icon: CheckCircle2,
  },
  {
    key: "invalidRows",
    label: "RECORDS REJECTED",
    icon: AlertCircle,
  },
  {
    key: "duplicateRows",
    label: "DUPLICATES FOUND",
    icon: ListPlus,
  },
  {
    key: "warningRows",
    label: "WARNINGS FOUND",
    icon: AlertTriangle,
  },
];

export const importSummaryNumberFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function getApiErrorMessage(error, card) {
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
    const extension = card?.fileExtension || ".xlsx";
    return `Only ${extension} files are supported for this import.`;
  }

  if (backendCode === "FILE_TOO_LARGE") {
    return "The selected file exceeds the maximum allowed upload size.";
  }

  if (
    backendCode === "MISSING_REQUIRED_WORKSHEET" ||
    backendCode === "MISSING_REQUIRED_SHEET" ||
    backendCode === "MISSING_REQUIRED_COLUMN" ||
    backendCode === "MISSING_REQUIRED_HEADER" ||
    backendCode === "WRONG_IMPORT_PROFILE" ||
    backendCode === "EMAIL_HEADER_STRUCTURE_MISMATCH"
  ) {
    const profileLabel = card?.title || "valid";
    const extension = card?.fileExtension || ".xlsx";
    const reportTypeLabel = /email/i.test(profileLabel)
      ? "Email Raw Data"
      : /occupancy/i.test(profileLabel)
        ? "Agent Occupancy"
        : /agent/i.test(profileLabel)
          ? "Agent Level"
          : "Skill Statistics";

    if (/hero/i.test(profileLabel || card?.id || "")) {
      return `Only HeroDash ${reportTypeLabel} (${extension}) files are allowed for this card. The uploaded file is missing required HeroDash ${reportTypeLabel} sheets or headers.`;
    }
    if (/fusenet/i.test(profileLabel || card?.id || "")) {
      return `Only FuseNet ${reportTypeLabel} (${extension}) files are allowed for this card. The uploaded file is missing required FuseNet ${reportTypeLabel} sheets or headers.`;
    }
    if (/fuse/i.test(profileLabel || card?.id || "")) {
      return `Only Fusecom ${reportTypeLabel} (${extension}) files are allowed for this card. The uploaded file is missing required Fusecom ${reportTypeLabel} sheets or headers.`;
    }
    return `Only ${profileLabel} (${extension}) reports are allowed for this card. The uploaded file does not match the required format.`;
  }
}

export function formatUploadTimestamp(date = new Date()) {
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

export function getUploadTimeMs(upload) {
  if (upload?.uploadedAtMs && !Number.isNaN(Number(upload.uploadedAtMs))) {
    return Number(upload.uploadedAtMs);
  }

  const parsedTime = new Date(upload?.uploadedAt || "").getTime();

  return Number.isNaN(parsedTime) ? Date.now() : parsedTime;
}

export function formatRelativeTime(upload) {
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

export function getCellText(value) {
  if (value == null) return "";

  if (typeof value === "object") {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      const year = value.getUTCFullYear();
      if (year === 1899 || year === 1900) {
        const epoch = Date.UTC(1899, 11, 30);
        const totalSec = Math.round((value.getTime() - epoch) / 1000);
        if (totalSec >= 0) {
          const h = Math.floor(totalSec / 3600);
          const m = Math.floor((totalSec % 3600) / 60);
          const s = totalSec % 60;
          return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
        }
        return [value.getUTCHours(), value.getUTCMinutes(), value.getUTCSeconds()]
          .map((n) => String(n).padStart(2, "0"))
          .join(":");
      }
      const yyyy = value.getUTCFullYear();
      const mm = String(value.getUTCMonth() + 1).padStart(2, "0");
      const dd = String(value.getUTCDate()).padStart(2, "0");
      const hh = String(value.getUTCHours()).padStart(2, "0");
      const min = String(value.getUTCMinutes()).padStart(2, "0");
      const ss = String(value.getUTCSeconds()).padStart(2, "0");

      if (
        value.getUTCHours() === 0 &&
        value.getUTCMinutes() === 0 &&
        value.getUTCSeconds() === 0 &&
        value.getUTCMilliseconds() === 0
      ) {
        return `${yyyy}-${mm}-${dd}`;
      }
      return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
    }
    if ("text" in value) return String(value.text || "");
    if ("result" in value) return String(value.result || "");
    if ("richText" in value) {
      return value.richText.map((item) => item.text || "").join("");
    }
  }

  const str = String(value);
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?Z?$/i);
  if (match) {
    const year = parseInt(match[1], 10);
    if (year === 1899 || year === 1900) {
      const d = new Date(str);
      if (!Number.isNaN(d.getTime())) {
        const epoch = Date.UTC(1899, 11, 30);
        const totalSec = Math.round((d.getTime() - epoch) / 1000);
        if (totalSec >= 0) {
          const h = Math.floor(totalSec / 3600);
          const m = Math.floor((totalSec % 3600) / 60);
          const s = totalSec % 60;
          return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
        }
      }
      return `${match[4]}:${match[5]}:${match[6]}`;
    }
    return `${match[1]}-${match[2]}-${match[3]} ${match[4]}:${match[5]}:${match[6]}`;
  }

  return str;
}

export function normalizeHeaders(headers) {
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

export function buildRows(columns, dataRows, fileName) {
  return dataRows.map((cells) => {
    const row = {};

    columns.forEach((column, index) => {
      row[column] = getCellText(cells[index]).trim() || "-";
    });
    row["Source File"] = fileName;

    return row;
  });
}

export function parseCsvRows(text, fileName) {
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

export function isDataRow(row) {
  return row.some((cell) => getCellText(cell).trim());
}

export function getFilledCellCount(row) {
  return row.filter((cell) => getCellText(cell).trim()).length;
}

export function isLikelyHeaderRow(row, nextRow) {
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

export function findHeaderRowIndex(rows) {
  const scanLimit = Math.min(rows.length - 1, 25);

  for (let index = 0; index < scanLimit; index += 1) {
    if (isLikelyHeaderRow(rows[index], rows[index + 1])) {
      return index;
    }
  }

  return 0;
}

export async function parseWorkbookRows(arrayBuffer, fileName) {
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

export function readJsonCache(key, fallback) {
  if (typeof window === "undefined") return fallback;

  try {
    return JSON.parse(window.localStorage.getItem(key) || "") || fallback;
  } catch {
    return fallback;
  }
}

export function writeJsonCache(key, value) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function normalizeUploadsByCard(uploadsByCard) {
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

export async function readSelectedFile(file) {
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

export function createUploadRecordId(cardId, fileName) {
  const uploadedAtMs = Date.now();
  const rand = Math.random().toString(36).slice(2);

  return {
    id: `${cardId}-${fileName}-${uploadedAtMs}-${rand}`,
    uploadedAtMs,
  };
}

export function getImportProfileForCard(card) {
  return String(card?.importProfileCode || "").trim() || null;
}

export function normalizeTaskOrderOption(taskOrder) {
  if (!taskOrder) return null;
  if (typeof taskOrder === "string") {
    return { id: null, label: taskOrder };
  }

  const id = String(taskOrder.id || "").trim();
  const label = String(taskOrder.label || id).trim();
  return id || label ? { id: id || null, label: label || id } : null;
}

export function getTaskOrderSearchText(taskOrder) {
  const option = normalizeTaskOrderOption(taskOrder);
  return option ? `${option.id || ""} ${option.label || ""}`.trim().toLowerCase() : "";
}

export function mapBatchToUpload(batch) {
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
    groupLabel: card.groupLabel || "SERVICE / QUEUE LEVEL",
    importProfileCode: profileCode,
    importProfileName: batch.importProfileName || rawDataTitle,
    sourceSystem: batch.sourceSystem || card.sourceLabel,
    taskOrderId: batch.taskOrderId || null,
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
    infoRows: batch.infoRows || 0,
    reportDateFrom: batch.reportDateFrom || null,
    reportDateTo: batch.reportDateTo || null,
    uploadedBy: batch.uploadedBy || null,
  };
}

export const WARNING_CATEGORY_LABELS = [
  "SERVICE / QUEUE LEVEL",
  "AGENT LEVEL",
  "AGENT OCCUPANCY",
  "EMAIL LEVEL",
];

export function getBatchCategory(batch) {
  if (!batch) return "SERVICE / QUEUE LEVEL";
  if (batch.groupLabel && WARNING_CATEGORY_LABELS.includes(batch.groupLabel)) {
    return batch.groupLabel;
  }
  if (batch.importProfileCode) {
    const card = getRawDataCardByImportProfileCode(batch.importProfileCode);
    if (card?.groupLabel && WARNING_CATEGORY_LABELS.includes(card.groupLabel)) {
      return card.groupLabel;
    }
  }
  const usVisaCards = getRawDataCards("US VISA");
  const card = usVisaCards.find(
    (c) => c.id === batch.cardId || c.title === batch.rawDataTitle,
  );
  if (card?.groupLabel && WARNING_CATEGORY_LABELS.includes(card.groupLabel)) {
    return card.groupLabel;
  }

  const text = `${batch.rawDataTitle || ""} ${batch.fileName || ""} ${batch.importProfileName || ""}`.toLowerCase();
  if (text.includes("email")) return "EMAIL LEVEL";
  if (text.includes("occupancy")) return "AGENT OCCUPANCY";
  if (text.includes("agent level")) return "AGENT LEVEL";
  if (
    text.includes("skill") ||
    text.includes("queue") ||
    text.includes("service")
  ) {
    return "SERVICE / QUEUE LEVEL";
  }

  return "SERVICE / QUEUE LEVEL";
}

export function getPageNumbers(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "...", totalPages];
  }
  if (currentPage >= totalPages - 3) {
    return [
      1,
      "...",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }
  return [
    1,
    "...",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "...",
    totalPages,
  ];
}

export async function executeCardImport({
  card,
  file,
  uploadContext = {},
  onProgress,
  onStageChange,
  onProgressDetail,
}) {
  const isUsVisa = card.account === "US VISA";

  let importedData = {
    columns: ["Source File"],
    rows: [],
  };

  if (!isUsVisa) {
    importedData = await readSelectedFile(file);
    onProgress?.(30);
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  let batchResult = null;

  if (isUsVisa) {
    const importProfileId = getImportProfileForCard(card);

    if (!importProfileId) {
      throw new Error(`${card.title} raw-data import is not configured yet.`);
    }

    const uploadResponse = await uploadUsVisaImport({
      file,
      importProfileId,
      taskOrderId: uploadContext.taskOrderId || undefined,
      reportDateFrom: uploadContext.reportDateFrom || undefined,
      reportDateTo: uploadContext.reportDateTo || undefined,
      onProgress: (percent) => {
        onStageChange?.("uploading");
        onProgress?.(Math.round(percent * 0.2));
        onProgressDetail?.({
          message: "Uploading workbook to the ingestion service.",
          processedRows: null,
          totalRows: null,
        });
      },
      onServerProgress: (progress) => {
        if (!progress) return;
        onStageChange?.(progress.stage || "processing");
        onProgress?.(progress.percent ?? 0);
        onProgressDetail?.({
          message: progress.message || "",
          processedRows: progress.processedRows ?? null,
          totalRows: progress.totalRows ?? null,
        });
      },
    });

    batchResult = uploadResponse?.batch || null;

    if (batchResult?.status === "DUPLICATE") {
      return { isDuplicate: true, batchResult: null, newUpload: null };
    }

    if (batchResult?.status === "FAILED") {
      throw new Error(
        batchResult.errorMessage ||
          "Import structure validation failed. Please check the required file format.",
      );
    }

    onStageChange?.("complete");
    onProgress?.(100);
    onProgressDetail?.({
      message: "Import completed successfully.",
      processedRows: batchResult?.totalRows ?? null,
      totalRows: batchResult?.totalRows ?? null,
    });
    await new Promise((resolve) => setTimeout(resolve, 200));
  } else {
    onProgress?.(75);
    onStageChange?.("finalizing");
    onProgress?.(95);
  }

  const { id: uploadId, uploadedAtMs } = createUploadRecordId(card.id, file.name);

  const newUpload = {
    id: uploadId,
    cardId: card.id,
    account: card.account,
    rawDataTitle: card.title,
    groupLabel: card.groupLabel || "SERVICE / QUEUE LEVEL",
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
    infoRows: batchResult?.infoRows ?? 0,
    taskOrderId: batchResult?.taskOrderId || uploadContext.taskOrderId || null,
    reportDateFrom: batchResult?.reportDateFrom || uploadContext.reportDateFrom || null,
    reportDateTo: batchResult?.reportDateTo || uploadContext.reportDateTo || null,
    importProfileCode: card.importProfileCode || null,
    importProfileName: batchResult?.importProfileName || card.title,
    sourceSystem: batchResult?.sourceSystem || card.sourceLabel || card.title,
  };

  return { isDuplicate: false, batchResult, newUpload };
}

export function groupRawDataCards(cards = []) {
  const groupOrder = [
    "SERVICE / QUEUE LEVEL",
    "AGENT LEVEL",
    "AGENT OCCUPANCY",
    "EMAIL LEVEL",
  ];

  const grouped = groupOrder.map((label) => ({ label, cards: [] }));
  const otherGroup = { label: "OTHER", cards: [] };

  cards.forEach((card) => {
    const targetGroup = grouped.find((group) => group.label === card.groupLabel);
    if (targetGroup) {
      targetGroup.cards.push(card);
      return;
    }
    otherGroup.cards.push(card);
  });

  if (otherGroup.cards.length) grouped.push(otherGroup);
  return grouped.filter((group) => group.cards.length > 0);
}


