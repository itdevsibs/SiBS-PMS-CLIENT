// WFM dashboard page for importing raw data and generating graphs.
import { useMemo, useState } from "react";
import { ArrowLeft, BarChart3, Search, Trash2 } from "lucide-react";

import AdminSidebar from "@/components/layout/AdminSidebar";
import AppHeader from "@/components/layout/AppHeader";
import AppModal from "@/components/ui/app-modal";
import ConfirmationModal from "@/components/ui/confirmation-modal";
import LoadingModal from "@/components/ui/loading-modal";
import { Button } from "@/components/ui/button";
import useDashboardPage from "@/hooks/useDashboardPage";
import {
  generateWfmGraphReports,
} from "@/lib/wfm-graph-reports";
import { addWfmHistoryLog } from "@/lib/wfm-history-logs";
import {
  accountOptions,
  getRawDataCards,
} from "@/lib/wfm-raw-data-cards";
import { markWfmImportedFileGraphReady } from "@/lib/axios/wfm-imported-files";

const knownWfmRawDataColumns = [
  "Employee ID",
  "Employee Name",
  "Account",
  "Team Leader",
  "Operations Manager",
  "KPI Period",
  "Attendance %",
  "Quality %",
  "Productivity %",
  "CSAT %",
  "AHT Sec",
  "Compliance %",
  "Final Score",
  "Status",
  "Remarks",
  "Source File",
];

const WFM_DASHBOARD_IMPORT_CACHE_KEY = "sibs-wfm-dashboard-import-cache";
const RAW_DATA_UPLOADS_KEY = "sibs-wfm-raw-data-uploads";

function readWfmImportCache() {
  if (typeof window === "undefined") {
    return {
      selectedUpload: "",
      uploadedFiles: [],
    };
  }

  try {
    const cached = JSON.parse(
      window.localStorage.getItem(WFM_DASHBOARD_IMPORT_CACHE_KEY) || "{}",
    );
    const uploadedFiles = Array.isArray(cached.uploadedFiles)
      ? cached.uploadedFiles.map(normalizeCachedUpload)
      : [];

    return {
      selectedUpload: cached.selectedUpload || uploadedFiles[0]?.fileName || "",
      uploadedFiles,
    };
  } catch {
    return {
      selectedUpload: "",
      uploadedFiles: [],
    };
  }
}

function writeWfmImportCache({ selectedUpload, uploadedFiles }) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    WFM_DASHBOARD_IMPORT_CACHE_KEY,
    JSON.stringify({
      selectedUpload,
      uploadedFiles,
    }),
  );
}

function readRawDataUploadCache() {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    return JSON.parse(window.localStorage.getItem(RAW_DATA_UPLOADS_KEY) || "{}") || {};
  } catch {
    return {};
  }
}

function normalizeColumnKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function getCellText(value) {
  if (value == null) {
    return "";
  }

  if (typeof value === "object") {
    if ("text" in value) return String(value.text || "");
    if ("result" in value) return String(value.result || "");
    if ("richText" in value) {
      return value.richText.map((item) => item.text || "").join("");
    }
  }

  return String(value);
}

function buildImportedRow(columns, cells, fileName) {
  const row = {};

  columns.forEach((column, index) => {
    row[column] = getCellText(cells[index]).trim() || "-";
  });
  row["Source File"] = fileName;

  return row;
}

function getColumnConfig(column) {
  const width = Math.min(Math.max(String(column).length * 8 + 48, 110), 190);

  return {
    label: column,
    width: `${width}px`,
  };
}

function getCombinedColumns(uploadedFiles) {
  const columns = [];

  uploadedFiles.forEach((upload) => {
    (upload.columns || []).forEach((column) => {
      if (!columns.includes(column)) {
        columns.push(column);
      }
    });
  });

  return columns;
}

function isGenericColumnName(column) {
  return /^column\s+\d+$/i.test(String(column || "").trim());
}

function getFilledCellCount(values) {
  return values.filter((value) => getCellText(value).trim() && value !== "-").length;
}

function isLikelyImportedHeader(values, nextValues) {
  const joinedValues = values.map((value) => getCellText(value).toLowerCase()).join(" ");
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
    joinedValues.includes(word),
  ).length;

  return (
    getFilledCellCount(values) >= 3 &&
    getFilledCellCount(nextValues || []) >= 3 &&
    headerWordMatches >= 2
  );
}

function repairGenericImportedUpload(upload) {
  const columns = Array.isArray(upload.columns) ? upload.columns : [];

  if (!columns.some(isGenericColumnName) || !Array.isArray(upload.rows)) {
    return upload;
  }

  const rowValues = upload.rows.map((row) =>
    columns.map((column) => getCellText(row?.[column]).trim()),
  );
  const headerRowIndex = rowValues.findIndex((values, index) =>
    isLikelyImportedHeader(values, rowValues[index + 1]),
  );

  if (headerRowIndex < 0) {
    return upload;
  }

  const repairedColumns = rowValues[headerRowIndex]
    .map((value, index) => value || `Column ${index + 1}`)
    .filter(Boolean);
  const uniqueColumns = repairedColumns.map((column, index, allColumns) => {
    const duplicateIndex = allColumns.slice(0, index).filter((item) => item === column).length;

    return duplicateIndex ? `${column} ${duplicateIndex + 1}` : column;
  });
  const rows = rowValues.slice(headerRowIndex + 1).map((values) =>
    buildImportedRow(uniqueColumns, values, upload.fileName),
  );

  return {
    ...upload,
    columns: [...uniqueColumns, "Source File"],
    rows,
  };
}

function normalizeCachedUpload(upload) {
  if (Array.isArray(upload.columns) && upload.rows?.every((row) => !Array.isArray(row))) {
    return repairGenericImportedUpload(upload);
  }

  const columns = [...knownWfmRawDataColumns];
  const rows = Array.isArray(upload.rows)
    ? upload.rows.map((row) => {
        if (!Array.isArray(row)) {
          return row;
        }

        return buildImportedRow(columns, row, upload.fileName);
      })
    : [];

  return repairGenericImportedUpload({
    ...upload,
    columns,
    rows,
  });
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

function WfmStatusPill({ status }) {
  const statusMap = {
    Completed: "bg-sibs-secondary-3/10 text-sibs-secondary-3 border-sibs-secondary-3/20",
    Failed: "bg-sibs-danger/10 text-sibs-danger border-sibs-danger/20",
    Processing: "bg-sibs-secondary-2/10 text-sibs-secondary-2 border-sibs-secondary-2/20",
    Validation: "bg-sibs-primary-2/10 text-sibs-primary-2 border-sibs-primary-2/20",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${
        statusMap[status] || "bg-sibs-tertiary-10 text-sibs-tertiary-5"
      }`}
    >
      {status}
    </span>
  );
}


function WfmDashboardContent() {
  const cachedImportState = useMemo(() => readWfmImportCache(), []);
  const rawDataUploadCache = useMemo(() => readRawDataUploadCache(), []);
  const [selectedUpload, setSelectedUpload] = useState(cachedImportState.selectedUpload);
  const [uploadedFiles, setUploadedFiles] = useState(cachedImportState.uploadedFiles);
  const [isImportUploadedDataOpen, setIsImportUploadedDataOpen] = useState(false);
  const [selectedImportAccount, setSelectedImportAccount] = useState("");
  const [activeDashboardImportCard, setActiveDashboardImportCard] = useState(null);
  const [dashboardImportSearch, setDashboardImportSearch] = useState("");
  const [dashboardUploadToImport, setDashboardUploadToImport] = useState(null);
  const [isImportingDashboardData, setIsImportingDashboardData] = useState(false);
  const [importedDashboardUpload, setImportedDashboardUpload] = useState(null);
  const [showRemoveTableConfirm, setShowRemoveTableConfirm] = useState(false);
  const [isRemovingTableData, setIsRemovingTableData] = useState(false);
  const [removedTableData, setRemovedTableData] = useState(null);
  const [showMakeGraphConfirm, setShowMakeGraphConfirm] = useState(false);
  const [isMakingGraph, setIsMakingGraph] = useState(false);
  const [madeGraphSet, setMadeGraphSet] = useState(null);
  const [graphError, setGraphError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const uploadedCardCounts = useMemo(
    () =>
      Object.fromEntries(
        accountOptions.map((account) => {
          const uploadedCount = getRawDataCards(account).filter(
            (card) => (rawDataUploadCache[card.id] || []).length > 0,
          ).length;

          return [account, uploadedCount];
        }),
      ),
    [rawDataUploadCache],
  );
  const selectedAccountCards = useMemo(
    () => (selectedImportAccount ? getRawDataCards(selectedImportAccount) : []),
    [selectedImportAccount],
  );
  const activeDashboardImportUploads = useMemo(
    () => rawDataUploadCache[activeDashboardImportCard?.id] || [],
    [activeDashboardImportCard, rawDataUploadCache],
  );
  const filteredDashboardImportUploads = useMemo(() => {
    const searchValue = dashboardImportSearch.trim().toLowerCase();

    if (!searchValue) {
      return activeDashboardImportUploads;
    }

    return activeDashboardImportUploads.filter((upload) =>
      [upload.fileName, upload.uploadedAt, formatRelativeTime(upload)]
        .join(" ")
        .toLowerCase()
        .includes(searchValue),
    );
  }, [activeDashboardImportUploads, dashboardImportSearch]);

  const selectedUploadedFile = useMemo(
    () => uploadedFiles.find((upload) => upload.fileName === selectedUpload),
    [selectedUpload, uploadedFiles],
  );
  const displayedRows = useMemo(
    () =>
      selectedUploadedFile
        ? selectedUploadedFile.rows
        : uploadedFiles.flatMap((upload) => upload.rows),
    [selectedUploadedFile, uploadedFiles],
  );
  const tableColumns = useMemo(
    () =>
      selectedUploadedFile
        ? selectedUploadedFile.columns || []
        : getCombinedColumns(uploadedFiles),
    [selectedUploadedFile, uploadedFiles],
  );
  const tableColumnConfig = useMemo(
    () => tableColumns.map((column) => getColumnConfig(column)),
    [tableColumns],
  );
  const rowsPerPage = 25;
  const totalPages = Math.max(1, Math.ceil(displayedRows.length / rowsPerPage));
  const paginatedRows = displayedRows.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );

  const handleOpenImportUploadedData = () => {
    setSelectedImportAccount("");
    setActiveDashboardImportCard(null);
    setDashboardImportSearch("");
    setIsImportUploadedDataOpen(true);
  };

  const handleImportDashboardUpload = async () => {
    if (!dashboardUploadToImport) {
      return;
    }

    const upload = dashboardUploadToImport;
    const sourceCard = activeDashboardImportCard;

    setDashboardUploadToImport(null);
    setActiveDashboardImportCard(null);
    setIsImportUploadedDataOpen(false);
    setIsImportingDashboardData(true);

    await new Promise((resolve) => {
      window.setTimeout(resolve, 1200);
    });

    const importedUpload = normalizeCachedUpload(upload);
    const nextFiles = [
      importedUpload,
      ...uploadedFiles.filter((file) => file.fileName !== importedUpload.fileName),
    ];

    setUploadedFiles(nextFiles);
    setSelectedUpload(importedUpload.fileName);
    setCurrentPage(1);
    writeWfmImportCache({
      selectedUpload: importedUpload.fileName,
      uploadedFiles: nextFiles,
    });
    addWfmHistoryLog({
      action: "dashboard-imported",
      account: sourceCard?.account || importedUpload.account,
      fileName: importedUpload.fileName,
      rawDataTitle: sourceCard?.title || importedUpload.rawDataTitle,
      message: `Imported to Work Force Management Dashboard: ${importedUpload.fileName}`,
    });
    setSelectedImportAccount("");
    setDashboardImportSearch("");
    setIsImportingDashboardData(false);
    setImportedDashboardUpload(importedUpload);
  };

  const handleCloseImportUploadedData = () => {
    setIsImportUploadedDataOpen(false);
    setSelectedImportAccount("");
    setActiveDashboardImportCard(null);
    setDashboardImportSearch("");
  };

  const handleRemoveDashboardTableData = async () => {
    const removedFileName = selectedUploadedFile?.fileName || selectedUpload;
    const removedRows = displayedRows.length;

    setShowRemoveTableConfirm(false);
    setIsRemovingTableData(true);

    await new Promise((resolve) => {
      window.setTimeout(resolve, 900);
    });

    setUploadedFiles([]);
    setSelectedUpload("");
    setCurrentPage(1);
    writeWfmImportCache({
      selectedUpload: "",
      uploadedFiles: [],
    });
    addWfmHistoryLog({
      action: "dashboard-removed",
      fileName: removedFileName || "Dashboard table data",
      message: `Removed data from Work Force Management Dashboard table`,
    });
    setRemovedTableData({
      fileName: removedFileName,
      rows: removedRows,
    });
    setIsRemovingTableData(false);
  };

  const handleRequestMakeGraph = () => {
    if (!displayedRows.length || !tableColumns.length) {
      return;
    }

    setShowMakeGraphConfirm(true);
  };

  const handleMakeGraph = async () => {
    if (!displayedRows.length || !tableColumns.length) {
      return;
    }

    if (!selectedUploadedFile?.id) {
      setGraphError("Select one imported uploaded file before making a graph.");
      return;
    }

    setShowMakeGraphConfirm(false);
    setGraphError("");
    setIsMakingGraph(true);

    await new Promise((resolve) => {
      window.setTimeout(resolve, 5000);
    });

    const graphSet = generateWfmGraphReports({
      columns: tableColumns,
      rows: displayedRows,
      sourceFile: selectedUpload || "Imported dashboard data",
      sourceUploadId: selectedUploadedFile?.id,
      sourceCardId: selectedUploadedFile?.cardId,
      sourceUploadedAtMs: selectedUploadedFile?.uploadedAtMs,
      rawDataTitle: selectedUploadedFile?.rawDataTitle,
    });

    if (!graphSet) {
      setIsMakingGraph(false);
      setGraphError("No graphable fields were found in the imported data.");
      return;
    }

    try {
      await markWfmImportedFileGraphReady(selectedUploadedFile.id);
    } catch (error) {
      setIsMakingGraph(false);
      setGraphError(
        error?.response?.data?.message || "The graph was prepared, but it was not saved to View Graphs.",
      );
      return;
    }

    addWfmHistoryLog({
      action: "graph-generated",
      fileName: graphSet.sourceFile,
      message: `Prepared graph reports from Work Force Management Dashboard: ${graphSet.sourceFile}`,
    });
    setIsMakingGraph(false);
    setMadeGraphSet(graphSet);
  };

  return (
    <>
      <div className="grid grid-cols-12 gap-4">
        <section className="sibs-card col-span-12 overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-sibs-tertiary-10 bg-sibs-primary-3/30 px-5 py-3 xl:flex-row xl:items-center xl:justify-between">
            <h2 className="m-0 text-lg font-semibold text-sibs-primary-1">
              Imported Employee Performance Rows
            </h2>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                type="button"
                variant="outline"
                onClick={handleOpenImportUploadedData}
                className="h-9 rounded-full border-sibs-tertiary-8 bg-white px-4 font-semibold text-sibs-primary-1 shadow-sm hover:!border-sibs-tertiary-7 hover:!bg-sibs-tertiary-10 hover:!text-sibs-primary-1 sm:w-auto"
              >
                Import Uploaded Data
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!displayedRows.length}
                onClick={handleRequestMakeGraph}
                className="h-9 rounded-full border-sibs-tertiary-8 bg-white px-4 font-semibold text-sibs-primary-1 shadow-sm hover:!border-sibs-tertiary-7 hover:!bg-sibs-tertiary-10 hover:!text-sibs-primary-1 sm:w-auto"
              >
                <BarChart3 className="h-4 w-4" aria-hidden="true" />
                Make graph
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowRemoveTableConfirm(true)}
                disabled={!displayedRows.length}
                className="h-9 rounded-full border-sibs-danger/30 bg-white px-4 font-semibold text-sibs-danger shadow-sm hover:!border-sibs-tertiary-8 hover:!bg-sibs-tertiary-10 hover:!text-sibs-danger sm:w-auto"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Remove data from table
              </Button>
            </div>
          </div>

          <div className="sibs-scrollbar overflow-x-auto">
            <table className="w-max min-w-full border-collapse text-left">
              <thead className="bg-sibs-primary-3/50 text-xs uppercase text-sibs-tertiary-6">
                <tr>
                  {tableColumnConfig.map((column) => (
                    <th
                      key={column.label}
                      className="whitespace-nowrap px-4 py-3 text-left font-bold"
                      style={{ minWidth: column.width }}
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-sibs-tertiary-10 text-sm">
                {paginatedRows.length > 0 ? (
                  paginatedRows.map((row, rowIndex) => (
                    <tr key={`${row["Source File"] || "row"}-${rowIndex}`} className="bg-[#f8fbfd] transition hover:bg-sibs-primary-2/5">
                      {tableColumnConfig.map((column) => {
                        const cell = row[column.label] || "-";

                        return (
                        <td
                          key={`${column.label}-${rowIndex}`}
                          className="whitespace-nowrap px-4 py-3 text-left text-sibs-tertiary-5"
                          style={{ minWidth: column.width }}
                          title={String(cell || "")}
                        >
                          {normalizeColumnKey(column.label) === "status" ? (
                            <WfmStatusPill status={cell} />
                          ) : (
                            <span>{cell}</span>
                          )}
                        </td>
                      )})}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={Math.max(tableColumns.length, 1)} className="bg-[#f8fbfd] px-5 py-10 text-center text-sm text-sibs-tertiary-5">
                      No raw data imported yet. Upload a file to populate this table.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-sibs-tertiary-10 px-5 py-3 text-sm text-sibs-tertiary-6 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Showing {paginatedRows.length} of {displayedRows.length} imported rows
            </span>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <span>{selectedUpload || "No imported upload selected"}</span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 rounded-lg px-4"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                >
                  Previous
                </Button>
                <span className="text-xs font-bold text-sibs-tertiary-6">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 rounded-lg px-4"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>

      <AppModal
        isOpen={isImportUploadedDataOpen}
        className="flex h-[min(92vh,830px)] !max-w-none flex-col sm:!w-[min(94vw,1280px)]"
      >
        <div className="shrink-0 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="m-0 text-xl font-bold text-sibs-primary-1">
              Import Uploaded Data
            </p>
            <p className="mt-1 mb-0 text-sm text-sibs-tertiary-5">
              Choose staged raw data to reflect in this dashboard.
            </p>
          </div>
          {activeDashboardImportCard ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setActiveDashboardImportCard(null);
                setDashboardImportSearch("");
              }}
              className="h-9 rounded-lg px-4"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Raw data cards
            </Button>
          ) : selectedImportAccount ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSelectedImportAccount("");
                setDashboardImportSearch("");
              }}
              className="h-9 rounded-lg px-4"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              All accounts
            </Button>
          ) : null}
        </div>

        <div className="sibs-scrollbar mt-5 min-h-0 flex-1 overflow-y-auto pr-2">
          {activeDashboardImportCard ? (
            <>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="m-0 text-lg font-bold text-sibs-primary-1">
                  {activeDashboardImportCard.title} Uploaded Data
                </p>
                <div className="relative w-full sm:w-80">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sibs-tertiary-6"
                    aria-hidden="true"
                  />
                  <input
                    value={dashboardImportSearch}
                    onChange={(event) => setDashboardImportSearch(event.target.value)}
                    className="h-9 w-full rounded-full border border-sibs-tertiary-9 bg-white pl-9 pr-4 text-sm outline-none focus:border-sibs-primary-2"
                    placeholder="Search uploaded data..."
                    type="text"
                  />
                </div>
              </div>

              <div className="min-h-[420px] divide-y divide-sibs-tertiary-10 overflow-hidden rounded-lg border border-sibs-tertiary-10">
                {filteredDashboardImportUploads.length ? (
                  filteredDashboardImportUploads.map((upload) => (
                    <div
                      key={upload.id || `${upload.fileName}-${upload.uploadedAt}`}
                      className="grid gap-3 bg-[#f8fbfd] px-4 py-3 sm:grid-cols-[minmax(0,1fr)_120px] sm:items-center"
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
                        onClick={() => setDashboardUploadToImport(upload)}
                        className="h-8 rounded-lg bg-sibs-primary-1 px-3 text-xs text-white hover:bg-sibs-tertiary-4"
                      >
                        Import Data
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="bg-[#f8fbfd] px-4 py-8 text-center text-sm text-sibs-tertiary-5">
                    {activeDashboardImportUploads.length
                      ? "No uploaded data found."
                      : "No uploaded data yet."}
                  </div>
                )}
              </div>
            </>
          ) : !selectedImportAccount ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {accountOptions.map((account) => (
                <button
                  key={account}
                  type="button"
                  onClick={() => setSelectedImportAccount(account)}
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
              {selectedAccountCards.map((card) => {
                const cardUploads = rawDataUploadCache[card.id] || [];
                const latestUploads = cardUploads.slice(0, 5);

                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => {
                      setActiveDashboardImportCard(card);
                      setDashboardImportSearch("");
                    }}
                    className="sibs-card flex min-h-[260px] flex-col p-4 text-left transition hover:border-sibs-primary-2 hover:bg-sibs-primary-2/5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="m-0 truncate text-sm font-bold text-sibs-primary-1">
                          {card.title}
                        </p>
                        <p className="mt-1 mb-0 truncate text-xs font-semibold text-sibs-tertiary-5">
                          {card.account}
                        </p>
                      </div>
                      <span className="rounded-full bg-[#f8fbfd] px-2.5 py-1 text-xs font-bold text-sibs-primary-1">
                        {cardUploads.length}
                      </span>
                    </div>

                    <div className="mt-4 min-h-[155px] flex-1 space-y-1 rounded-lg border border-sibs-tertiary-10 bg-[#f8fbfd] px-3 py-2">
                      {latestUploads.length ? (
                        latestUploads.map((upload) => (
                          <div
                            key={upload.id || `${upload.fileName}-${upload.uploadedAt}`}
                            className="border-b border-sibs-tertiary-10 pb-1 last:border-b-0 last:pb-0"
                          >
                            <span className="block truncate text-[11px] font-semibold leading-4 text-sibs-primary-1">
                              {upload.fileName}
                            </span>
                            <span className="block text-[10px] leading-3 text-sibs-tertiary-5">
                              {formatRelativeTime(upload)}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="flex min-h-[130px] items-center justify-center text-center text-xs text-sibs-tertiary-5">
                          No uploaded data yet
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-5 flex shrink-0 justify-end border-t border-sibs-tertiary-10 pt-5">
          <Button
            type="button"
            variant="outline"
            onClick={handleCloseImportUploadedData}
            className="h-10 rounded-lg px-4"
          >
            Close
          </Button>
        </div>
      </AppModal>

      <LoadingModal
        isOpen={isImportingDashboardData}
        title="Importing data"
        message="Please wait while we reflect the selected uploaded data."
      />

      <ConfirmationModal
        isOpen={Boolean(dashboardUploadToImport)}
        title="Import uploaded data"
        message={`Import ${dashboardUploadToImport?.fileName || "this uploaded data"} to the Work Force Management Dashboard table?`}
        cancelText="Cancel"
        confirmText="Import"
        onCancel={() => setDashboardUploadToImport(null)}
        onConfirm={handleImportDashboardUpload}
        tone="neutral"
      />

      <ConfirmationModal
        isOpen={showRemoveTableConfirm}
        title="Remove data from table"
        message="Remove the imported data currently shown in the Work Force Management Dashboard table?"
        cancelText="Cancel"
        confirmText="Remove"
        onCancel={() => setShowRemoveTableConfirm(false)}
        onConfirm={handleRemoveDashboardTableData}
        tone="neutral"
      />

      <LoadingModal
        isOpen={isRemovingTableData}
        title="Removing data"
        message="Please wait while we clear the dashboard table."
      />

      <LoadingModal
        isOpen={isMakingGraph}
        title="Checking graph data"
        message="Please wait while we check the imported dashboard data."
      />

      <ConfirmationModal
        isOpen={showMakeGraphConfirm}
        title="Make graph"
        message="Check if the current Work Force Management Dashboard table data can be graphed?"
        cancelText="Cancel"
        confirmText="Make graph"
        onCancel={() => setShowMakeGraphConfirm(false)}
        onConfirm={handleMakeGraph}
        tone="neutral"
      />

      <AppModal isOpen={Boolean(madeGraphSet)} className="max-w-sm" textAlign="center">
        <p className="m-0 text-lg font-bold text-sibs-primary-1">
          Graphs ready
        </p>
        <p className="mt-2 mb-0 text-sm text-sibs-tertiary-5">
          {madeGraphSet?.summary?.reports || 0} graph(s) can be viewed from the database-backed View Graphs page.
        </p>
        <Button
          type="button"
          onClick={() => setMadeGraphSet(null)}
          className="mt-5 h-10 w-full rounded-lg bg-sibs-primary-1 text-white hover:bg-sibs-tertiary-4"
        >
          Done
        </Button>
      </AppModal>

      <AppModal isOpen={Boolean(graphError)} className="max-w-sm" textAlign="center">
        <p className="m-0 text-lg font-bold text-sibs-primary-1">
          Graph not generated
        </p>
        <p className="mt-2 mb-0 text-sm text-sibs-tertiary-5">
          {graphError}
        </p>
        <Button
          type="button"
          onClick={() => setGraphError("")}
          className="mt-5 h-10 w-full rounded-lg bg-sibs-primary-1 text-white hover:bg-sibs-tertiary-4"
        >
          Done
        </Button>
      </AppModal>

      <AppModal isOpen={Boolean(removedTableData)} className="max-w-sm" textAlign="center">
        <p className="m-0 text-lg font-bold text-sibs-primary-1">
          Table data removed
        </p>
        <p className="mt-2 mb-0 text-sm text-sibs-tertiary-5">
          {removedTableData?.rows || 0} row(s) were removed from the dashboard table.
        </p>
        <Button
          type="button"
          onClick={() => setRemovedTableData(null)}
          className="mt-5 h-10 w-full rounded-lg bg-sibs-primary-1 text-white hover:bg-sibs-tertiary-4"
        >
          Done
        </Button>
      </AppModal>

      <AppModal isOpen={Boolean(importedDashboardUpload)} className="max-w-sm" textAlign="center">
        <p className="m-0 text-lg font-bold text-sibs-primary-1">
          Imported data reflected
        </p>
        <p className="mt-2 mb-0 text-sm text-sibs-tertiary-5">
          {importedDashboardUpload?.fileName} is now shown in the dashboard table.
        </p>
        <Button
          type="button"
          onClick={() => setImportedDashboardUpload(null)}
          className="mt-5 h-10 w-full rounded-lg bg-sibs-primary-1 text-white hover:bg-sibs-tertiary-4"
        >
          Done
        </Button>
      </AppModal>
    </>
  );
}


function WorkforceManagementPage() {
  const dashboard = useDashboardPage();
  const userName = dashboard.authUser?.name || dashboard.authUser?.username || "User";

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
          <WfmDashboardContent />
        </div>
      </main>

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
    </section>
  );
}

export default WorkforceManagementPage;
