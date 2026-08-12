// WFM page for uploading and managing raw data files.
import { useEffect, useMemo, useState } from "react";
import { CloudUpload, FolderOpen, Search, Trash2 } from "lucide-react";

import AdminSidebar from "@/components/layout/AdminSidebar";
import AppHeader from "@/components/layout/AppHeader";
import AppModal from "@/components/ui/app-modal";
import { Button } from "@/components/ui/button";
import ConfirmationModal from "@/components/ui/confirmation-modal";
import LoadingModal from "@/components/ui/loading-modal";
import useDashboardPage from "@/hooks/useDashboardPage";
import { addWfmHistoryLog } from "@/lib/wfm-history-logs";
import {
  accountOptions,
  getRawDataCards,
} from "@/lib/wfm-raw-data-cards";

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

function WfmImportDataPage() {
  const dashboard = useDashboardPage();
  const userName = dashboard.authUser?.name || dashboard.authUser?.username || "User";
  const [uploadsByCard, setUploadsByCard] = useState(() =>
    normalizeUploadsByCard(readJsonCache(RAW_DATA_UPLOADS_KEY, {})),
  );
  const [activeUploadCard, setActiveUploadCard] = useState(null);
  const [activeOpenCard, setActiveOpenCard] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemovingUpload, setIsRemovingUpload] = useState(false);
  const [uploadToRemove, setUploadToRemove] = useState(null);
  const [addedUpload, setAddedUpload] = useState(null);
  const [removedUpload, setRemovedUpload] = useState(null);
  const [duplicateUploadAlert, setDuplicateUploadAlert] = useState(null);
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
      [upload.fileName, upload.uploadedAt, formatRelativeTime(upload)]
        .join(" ")
        .toLowerCase()
        .includes(searchValue),
    );
  }, [openCardUploads, uploadedDataSearch]);
  const filteredRawDataCards = useMemo(() => {
    const searchValue = rawDataSearch.trim().toLowerCase();
    const accountFilteredCards = getRawDataCards(selectedAccount);

    if (!searchValue) {
      return accountFilteredCards;
    }

    return accountFilteredCards.filter((card) =>
      [card.title, card.account].join(" ").toLowerCase().includes(searchValue),
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
          const accountCards = getRawDataCards(account);
          const uploadedCount = accountCards.filter(
            (card) => (uploadsByCard[card.id] || []).length > 0,
          ).length;

          return [account, uploadedCount];
        }),
      ),
    [uploadsByCard],
  );

  useEffect(() => {
    writeJsonCache(RAW_DATA_UPLOADS_KEY, uploadsByCard);
  }, [uploadsByCard]);

  const closeUploadModal = () => {
    setActiveUploadCard(null);
    setSelectedFiles([]);
  };

  const handleUploadFiles = async () => {
    if (!activeUploadCard || !selectedFiles.length) {
      return;
    }

    const uploadCard = activeUploadCard;
    const filesToUpload = [...selectedFiles];
    const existingCardUploads = uploadsByCard[uploadCard.id] || [];
    const existingFileNames = new Set(
      existingCardUploads.map((upload) => upload.fileName.toLowerCase()),
    );
    const duplicateFile = filesToUpload.find((file) =>
      existingFileNames.has(file.name.toLowerCase()),
    );

    if (duplicateFile) {
      setDuplicateUploadAlert({
        fileName: duplicateFile.name,
        rawDataTitle: uploadCard.title,
      });
      return;
    }

    closeUploadModal();
    setIsUploading(true);

    const [parsedUploads] = await Promise.all([
      Promise.all(filesToUpload.map(async (file) => {
        const importedData = await readSelectedFile(file);

        return {
          id: `${uploadCard.id}-${file.name}-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}`,
          cardId: uploadCard.id,
          rawDataTitle: uploadCard.title,
          fileName: file.name,
          uploadedAtMs: Date.now(),
          uploadedAt: formatUploadTimestamp(),
          columns: importedData.columns || ["Source File"],
          rows: importedData.rows || [],
        };
      })),
      new Promise((resolve) => {
        window.setTimeout(resolve, 1200);
      }),
    ]);

    setUploadsByCard((currentUploads) => {
      const currentCardUploads = currentUploads[uploadCard.id] || [];

      return {
        ...currentUploads,
        [uploadCard.id]: [...parsedUploads, ...currentCardUploads],
      };
    });
    parsedUploads.forEach((upload) => {
      addWfmHistoryLog({
        action: "imported",
        account: uploadCard.account,
        fileName: upload.fileName,
        rawDataTitle: uploadCard.title,
        message: `Imported ${upload.fileName} to ${uploadCard.title}`,
      });
    });

    setIsUploading(false);
    setAddedUpload({
      count: parsedUploads.length,
      rawDataTitle: uploadCard.title,
    });
  };

  const handleRemoveUpload = async () => {
    if (!uploadToRemove) {
      return;
    }

    const selectedUploadToRemove = uploadToRemove;
    setUploadToRemove(null);
    setIsRemovingUpload(true);

    await new Promise((resolve) => {
      window.setTimeout(resolve, 700);
    });

    setUploadsByCard((currentUploads) => ({
      ...currentUploads,
      [selectedUploadToRemove.cardId]: (
        currentUploads[selectedUploadToRemove.cardId] || []
      ).filter(
        (upload) => upload.id !== selectedUploadToRemove.id,
      ),
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

    setRemovedUpload(selectedUploadToRemove);
    setIsRemovingUpload(false);
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
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <select
              value={selectedAccount}
              onChange={(event) => setSelectedAccount(event.target.value)}
              className="form-input h-9 rounded-full py-0 sm:w-64"
            >
              {accountFilters.map((account) => (
                <option key={account} value={account}>
                  {account} ({uploadedCardCounts[account] || 0})
                </option>
              ))}
            </select>

            <div className="relative w-full sm:w-80">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sibs-tertiary-6"
                aria-hidden="true"
              />
              <input
                value={rawDataSearch}
                onChange={(event) => setRawDataSearch(event.target.value)}
                className="h-9 w-full rounded-full border border-sibs-tertiary-9 bg-white pl-9 pr-4 text-sm outline-none focus:border-sibs-primary-2"
                placeholder="Search raw data..."
                type="text"
              />
            </div>
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
                <section key={card.id} className="sibs-card flex min-h-[300px] flex-col p-4">
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
                  <p className="mt-1 mb-0 truncate text-[11px] font-semibold uppercase text-sibs-tertiary-5">
                    {card.account}
                  </p>

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
                          <p className="m-0 text-[10px] leading-3 text-sibs-tertiary-5">
                            {formatRelativeTime(upload)}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="flex min-h-[140px] items-center justify-center text-center text-xs text-sibs-tertiary-5">
                        No uploaded data yet
                      </div>
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2.5">
                    <Button
                      type="button"
                      onClick={() => setActiveUploadCard(card)}
                      className="h-9 rounded-lg bg-sibs-primary-1 px-3 text-sm text-white hover:bg-sibs-tertiary-4"
                    >
                      <CloudUpload className="h-4 w-4" aria-hidden="true" />
                      Import
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setActiveOpenCard(card);
                        setUploadedDataSearch("");
                      }}
                      className="h-9 rounded-lg px-3 text-sm"
                    >
                      <FolderOpen className="h-4 w-4" aria-hidden="true" />
                      Open
                    </Button>
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

      <AppModal isOpen={Boolean(activeUploadCard)} className="max-w-xl">
        <p className="m-0 text-lg font-bold text-sibs-primary-1">
          {activeUploadCard?.title} - Import Data
        </p>
        <p className="mt-1 mb-0 text-sm text-sibs-tertiary-5">
          Upload raw data files for staging in the WFM dashboard.
        </p>

        <label className="mt-5 flex cursor-pointer items-center gap-4 rounded-lg border border-dashed border-sibs-tertiary-9 bg-[#f8fbfd] p-5 text-left transition hover:border-sibs-primary-2 hover:bg-sibs-primary-2/5">
          <input
            type="file"
            multiple
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(event) => setSelectedFiles(Array.from(event.target.files || []))}
          />
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sibs-primary-2/10">
            <CloudUpload className="h-5 w-5 text-sibs-primary-2" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="m-0 text-sm font-bold text-sibs-primary-1">
              {selectedFiles.length
                ? `${selectedFiles.length} file(s) selected`
                : "Choose raw data file"}
            </p>
            <p className="mt-1 mb-0 text-xs text-sibs-tertiary-5">
              Accepted: .xlsx, .xls, .csv
            </p>
          </div>
        </label>

        <div className="mt-5 flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={closeUploadModal}
            className="h-10 rounded-lg px-4"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!selectedFiles.length}
            onClick={handleUploadFiles}
            className="h-10 rounded-lg bg-sibs-primary-1 px-4 text-white hover:bg-sibs-tertiary-4"
          >
            Upload
          </Button>
        </div>
      </AppModal>

      <AppModal
        isOpen={Boolean(activeOpenCard)}
        className="!max-w-none sm:!w-[min(92vw,1100px)]"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="m-0 text-lg font-bold text-sibs-primary-1">
            {activeOpenCard?.title} Uploaded Data
          </p>
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

        <div className="mt-4 max-h-[65vh] min-h-[420px] divide-y divide-sibs-tertiary-10 overflow-y-auto rounded-lg border border-sibs-tertiary-10">
          {filteredOpenCardUploads.length ? (
            filteredOpenCardUploads.map((upload) => (
              <div
                key={upload.id || `${upload.fileName}-${upload.uploadedAt}`}
                className="grid gap-3 bg-[#f8fbfd] px-4 py-3 sm:grid-cols-[minmax(0,1fr)_92px] sm:items-center"
              >
                <div className="min-w-0">
                  <p className="m-0 break-words text-sm font-bold text-sibs-primary-1">
                    {upload.fileName}
                  </p>
                  <p className="mt-1 mb-0 text-xs text-sibs-tertiary-5">
                    {upload.uploadedAt} ({formatRelativeTime(upload)})
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setUploadToRemove(upload)}
                  className="h-8 rounded-lg border-sibs-danger/30 px-2 text-xs text-sibs-danger hover:border-sibs-danger hover:bg-sibs-danger hover:text-white"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Remove
                </Button>
              </div>
            ))
          ) : (
            <div className="bg-[#f8fbfd] px-4 py-8 text-center text-sm text-sibs-tertiary-5">
              {openCardUploads.length ? "No uploaded data found." : "No uploaded data yet."}
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
          {duplicateUploadAlert?.fileName} is already imported. Please choose a different file.
        </p>
        <Button
          type="button"
          onClick={() => setDuplicateUploadAlert(null)}
          className="mt-5 h-10 w-full rounded-lg bg-sibs-primary-1 text-white hover:bg-sibs-tertiary-4"
        >
          Done
        </Button>
      </AppModal>

      <AppModal isOpen={Boolean(addedUpload)} className="max-w-sm" textAlign="center">
        <p className="m-0 text-lg font-bold text-sibs-primary-1">
          Imported data added
        </p>
        <p className="mt-2 mb-0 text-sm text-sibs-tertiary-5">
          {addedUpload?.count} file(s) were added to {addedUpload?.rawDataTitle}.
        </p>
        <Button
          type="button"
          onClick={() => setAddedUpload(null)}
          className="mt-5 h-10 w-full rounded-lg bg-sibs-primary-1 text-white hover:bg-sibs-tertiary-4"
        >
          Done
        </Button>
      </AppModal>

      <ConfirmationModal
        isOpen={Boolean(uploadToRemove)}
        title="Remove imported data"
        message={`Remove ${uploadToRemove?.fileName || "this uploaded data"} from ${activeOpenCard?.title || "this raw data"}?`}
        cancelText="Cancel"
        confirmText="Remove"
        onCancel={() => setUploadToRemove(null)}
        onConfirm={handleRemoveUpload}
        tone="neutral"
      />

      <AppModal isOpen={Boolean(removedUpload)} className="max-w-sm" textAlign="center">
        <p className="m-0 text-lg font-bold text-sibs-primary-1">
          Imported data removed
        </p>
        <p className="mt-2 mb-0 text-sm text-sibs-tertiary-5">
          {removedUpload?.fileName} was removed successfully.
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

      <LoadingModal
        isOpen={isUploading}
        title="Uploading data"
        message="Please wait while we stage the selected raw data."
      />

      <LoadingModal
        isOpen={isRemovingUpload}
        title="Removing data"
        message="Please wait while we remove the imported data."
      />
    </section>
  );
}

export default WfmImportDataPage;
