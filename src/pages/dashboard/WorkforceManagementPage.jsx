import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CloudUpload, Filter, Search, Trash2 } from "lucide-react";

import AdminSidebar from "@/components/layout/AdminSidebar";
import AppHeader from "@/components/layout/AppHeader";
import AppModal from "@/components/ui/app-modal";
import ConfirmationModal from "@/components/ui/confirmation-modal";
import LoadingModal from "@/components/ui/loading-modal";
import { Button } from "@/components/ui/button";
import useDashboardPage from "@/hooks/useDashboardPage";

const wfmRawDataColumns = [
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

const wfmRawDataColumnConfig = [
  { label: "Employee ID", width: "110px" },
  { label: "Employee Name", width: "190px" },
  { label: "Account", width: "180px" },
  { label: "Team Leader", width: "160px" },
  { label: "Operations Manager", width: "190px" },
  { label: "KPI Period", width: "120px" },
  { label: "Attendance %", width: "120px", align: "right" },
  { label: "Quality %", width: "105px", align: "right" },
  { label: "Productivity %", width: "130px", align: "right" },
  { label: "CSAT %", width: "90px", align: "right" },
  { label: "AHT Sec", width: "95px", align: "right" },
  { label: "Compliance %", width: "130px", align: "right" },
  { label: "Final Score", width: "110px", align: "right" },
  { label: "Status", width: "115px" },
  { label: "Remarks", width: "260px" },
  { label: "Source File", width: "230px" },
];

const WFM_IMPORT_CACHE_KEY = "sibs-wfm-import-cache-v2";

function readWfmImportCache() {
  if (typeof window === "undefined") {
    return {
      selectedUpload: "",
      uploadedFiles: [],
    };
  }

  try {
    const cached = JSON.parse(
      window.localStorage.getItem(WFM_IMPORT_CACHE_KEY) || "{}",
    );
    const uploadedFiles = Array.isArray(cached.uploadedFiles)
      ? cached.uploadedFiles
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
    WFM_IMPORT_CACHE_KEY,
    JSON.stringify({
      selectedUpload,
      uploadedFiles,
    }),
  );
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

function parseCsvRows(text, fileName) {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length <= 1) {
    return [];
  }

  return lines.slice(1).map((line) => {
    const cells = line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, ""));
    const normalized = wfmRawDataColumns.map((_, index) => cells[index] || "-");
    normalized[normalized.length - 1] = fileName;
    return normalized;
  });
}

function normalizeImportedObjects(rows, fileName) {
  if (!rows.length) {
    return [];
  }

  return rows.map((row) =>
    wfmRawDataColumns.map((column, index) => {
      if (column === "Source File") {
        return fileName;
      }

      const normalizedColumn = normalizeColumnKey(column);
      const matchedKey = Object.keys(row).find(
        (key) => normalizeColumnKey(key) === normalizedColumn,
      );

      return getCellText(row[matchedKey] ?? row[index] ?? "-") || "-";
    }),
  );
}

function isImportDataRow(values) {
  return values.some((value) => value && value !== "-");
}

function getHeaderMatchCount(values) {
  const normalizedValues = values.map(normalizeColumnKey);

  return wfmRawDataColumns.filter((column) =>
    normalizedValues.includes(normalizeColumnKey(column)),
  ).length;
}

function getFilledCellCount(values) {
  return values.filter((value) => value && value !== "-").length;
}

function findGenericHeaderRowIndex(rows) {
  return rows.findIndex((row, index) => {
    const filledCellCount = getFilledCellCount(row);
    const nextFilledCellCount = getFilledCellCount(rows[index + 1] || []);

    return filledCellCount >= 4 && nextFilledCellCount >= 4;
  });
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
    return [];
  }

  const sheetRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
    header: 1,
    defval: "",
    blankrows: false,
    raw: false,
  });
  const normalizedSheetRows = sheetRows
    .map((row) => row.map((cell) => getCellText(cell).trim()))
    .filter(isImportDataRow);

  if (!normalizedSheetRows.length) {
    return [];
  }

  let headerRowIndex = -1;
  const scanLimit = Math.min(25, normalizedSheetRows.length);

  for (let index = 0; index < scanLimit; index += 1) {
    const candidateValues = normalizedSheetRows[index];
    const matchCount = getHeaderMatchCount(candidateValues);

    if (matchCount >= 2) {
      headerRowIndex = index;
      break;
    }
  }

  if (headerRowIndex < 0) {
    headerRowIndex = findGenericHeaderRowIndex(normalizedSheetRows);
  }

  const headers = headerRowIndex >= 0 ? normalizedSheetRows[headerRowIndex] : [];
  const dataRows =
    headerRowIndex >= 0
      ? normalizedSheetRows.slice(headerRowIndex + 1)
      : normalizedSheetRows;
  const rows = dataRows.map((cells) => {
    const rowObject = {};

    headers.forEach((header, index) => {
      if (header) {
        rowObject[header] = cells[index] || "";
      }
    });

    return {
      ...cells,
      ...rowObject,
    };
  });

  return normalizeImportedObjects(rows, fileName);
}

function formatUploadTimestamp(date = new Date()) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
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
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDeletingFile, setIsDeletingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [selectedUpload, setSelectedUpload] = useState(cachedImportState.selectedUpload);
  const [uploadedFiles, setUploadedFiles] = useState(cachedImportState.uploadedFiles);
  const [currentPage, setCurrentPage] = useState(1);

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
  const rowsPerPage = 25;
  const totalPages = Math.max(1, Math.ceil(displayedRows.length / rowsPerPage));
  const paginatedRows = displayedRows.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );

  const handleSelectedUploadChange = (fileName) => {
    setSelectedUpload(fileName);
    setCurrentPage(1);
  };

  useEffect(() => {
    writeWfmImportCache({
      selectedUpload,
      uploadedFiles,
    });
  }, [selectedUpload, uploadedFiles]);

  const handleFileSelect = (files) => {
    const file = files?.[0];

    if (file) {
      setSelectedFile(file);
    }
  };

  const closeImportModal = () => {
    setIsImportModalOpen(false);
    setSelectedFile(null);
  };

  const readSelectedFile = () =>
    new Promise((resolve) => {
      if (!selectedFile) {
        resolve([]);
        return;
      }

      if (/\.csv$/i.test(selectedFile.name)) {
        const reader = new FileReader();
        reader.onload = () => resolve(parseCsvRows(reader.result, selectedFile.name));
        reader.onerror = () => resolve([]);
        reader.readAsText(selectedFile);
        return;
      }

      const reader = new FileReader();
      reader.onload = async () => {
        try {
          resolve(await parseWorkbookRows(reader.result, selectedFile.name));
        } catch (error) {
          console.error("Excel import failed:", error);
          resolve([]);
        }
      };
      reader.onerror = () => resolve([]);
      reader.readAsArrayBuffer(selectedFile);
    });

  const handleUploadFile = async () => {
    const fileName = selectedFile?.name || "workforce_raw_import.xlsx";
    setIsImportModalOpen(false);
    setIsImporting(true);
    const [rows] = await Promise.all([
      readSelectedFile(),
      new Promise((resolve) => {
        window.setTimeout(resolve, 3000);
      }),
    ]);

    setUploadedFiles((currentFiles) => {
      const nextFiles = [
        {
          fileName,
          account: "Workforce Raw Import",
          reportType: "Employee Performance KPI",
          status: "Completed",
          records: rows.length.toLocaleString(),
          uploadedAt: formatUploadTimestamp(),
          rows,
        },
        ...currentFiles.filter((upload) => upload.fileName !== fileName),
      ];

      writeWfmImportCache({
        selectedUpload: fileName,
        uploadedFiles: nextFiles,
      });

      return nextFiles;
    });
    handleSelectedUploadChange(fileName);
    closeImportModal();
    setIsImporting(false);
    setShowSuccessModal(true);
  };

  const confirmDeleteFile = (upload) => {
    setFileToDelete(upload);
    setShowDeleteConfirm(true);
  };

  const handleDeleteFile = async () => {
    const deletedFileName = fileToDelete?.fileName;
    setShowDeleteConfirm(false);
    setIsDeletingFile(true);

    await new Promise((resolve) => {
      window.setTimeout(resolve, 800);
    });

    const nextFiles = uploadedFiles.filter(
      (upload) => upload.fileName !== deletedFileName,
    );

    if (selectedUpload === deletedFileName) {
      const nextFile = nextFiles[0];
      handleSelectedUploadChange(nextFile?.fileName || "");
    }

    setUploadedFiles(nextFiles);
    writeWfmImportCache({
      selectedUpload:
        selectedUpload === deletedFileName ? nextFiles[0]?.fileName || "" : selectedUpload,
      uploadedFiles: nextFiles,
    });

    setFileToDelete(null);
    setIsDeletingFile(false);
  };

  return (
    <>
      <div className="grid grid-cols-12 gap-4">
        <section className="col-span-12 flex justify-end">
          <Button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="h-10 rounded-lg bg-sibs-primary-1 px-5 text-white hover:bg-sibs-tertiary-4"
          >
            <CloudUpload className="h-4 w-4" aria-hidden="true" />
            Upload/Import File
          </Button>
        </section>

        <section className="sibs-card col-span-12 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="m-0 text-base font-semibold text-sibs-primary-1">
              Uploaded Excel Files
            </h2>
            <span className="inline-flex items-center gap-1 rounded-full border border-sibs-tertiary-10 bg-[#f8fbfd] px-2.5 py-1 text-xs font-semibold text-sibs-tertiary-5">
              Imported files
              <strong className="text-sibs-primary-1">{uploadedFiles.length}</strong>
            </span>
          </div>

          {uploadedFiles.length > 0 ? (
            <div className="mt-2 divide-y divide-sibs-tertiary-10 overflow-hidden rounded-lg border border-sibs-tertiary-10 bg-[#f8fbfd]">
              {uploadedFiles.map((upload) => (
                <div
                  key={`${upload.fileName}-${upload.uploadedAt}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelectedUploadChange(upload.fileName)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleSelectedUploadChange(upload.fileName);
                    }
                  }}
                  className={`grid cursor-pointer gap-2 px-3 py-2 text-left transition hover:bg-sibs-primary-2/5 md:grid-cols-[minmax(0,1fr)_145px_64px_30px] md:items-center ${
                    selectedUpload === upload.fileName
                      ? "bg-sibs-primary-2/5"
                      : ""
                  }`}
                >
                  <div className="min-w-0">
                    <p className="m-0 truncate text-xs font-bold text-sibs-primary-1">
                      {upload.fileName}
                    </p>
                  </div>
                  <div className="truncate text-xs text-sibs-tertiary-5">
                    {upload.uploadedAt}
                  </div>
                  <div className="text-xs text-sibs-tertiary-5">
                    <span>{upload.records} rows</span>
                  </div>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      confirmDeleteFile(upload);
                    }}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-sibs-danger transition hover:bg-sibs-danger/10 md:justify-self-end"
                    title="Delete file"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-dashed border-sibs-tertiary-9 bg-[#f8fbfd] px-5 py-8 text-center text-sm text-sibs-tertiary-5">
              No uploaded files yet.
            </div>
          )}
        </section>

        <section className="sibs-card col-span-12 overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-sibs-tertiary-10 bg-sibs-primary-3/30 px-5 py-3 md:flex-row md:items-center md:justify-between">
            <h2 className="m-0 text-lg font-semibold text-sibs-primary-1">
              Imported Employee Performance Rows
            </h2>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <select
                value={selectedUpload}
                onChange={(event) => handleSelectedUploadChange(event.target.value)}
                className="form-input h-9 rounded-full py-0 sm:w-72"
              >
                <option value="">All uploaded files</option>
                {uploadedFiles.map((upload) => (
                  <option key={`${upload.fileName}-${upload.uploadedAt}`} value={upload.fileName}>
                    {upload.fileName}
                  </option>
                ))}
              </select>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sibs-tertiary-6"
                  aria-hidden="true"
                />
                <input
                  className="h-9 w-full rounded-full border border-sibs-tertiary-9 bg-white pl-9 pr-4 text-sm outline-none focus:border-sibs-primary-2 sm:w-56"
                  placeholder="Search rows..."
                  type="text"
                />
              </div>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Filter className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>

          <div className="sibs-scrollbar overflow-x-auto">
            <table className="w-max min-w-full table-fixed border-collapse text-left">
              <colgroup>
                {wfmRawDataColumnConfig.map((column) => (
                  <col key={column.label} style={{ width: column.width }} />
                ))}
              </colgroup>
              <thead className="bg-sibs-primary-3/50 text-xs uppercase text-sibs-tertiary-6">
                <tr>
                  {wfmRawDataColumnConfig.map((column) => (
                    <th
                      key={column.label}
                      className={`whitespace-nowrap px-4 py-3 font-bold ${
                        column.align === "right" ? "text-right" : ""
                      }`}
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-sibs-tertiary-10 text-sm">
                {paginatedRows.length > 0 ? (
                  paginatedRows.map((row, rowIndex) => (
                    <tr key={`${row[0]}-${rowIndex}`} className="bg-[#f8fbfd] transition hover:bg-sibs-primary-2/5">
                      {row.map((cell, cellIndex) => (
                        <td
                          key={`${wfmRawDataColumns[cellIndex]}-${cellIndex}`}
                          className={`max-w-0 whitespace-nowrap px-4 py-3 text-sibs-tertiary-5 ${
                            wfmRawDataColumnConfig[cellIndex]?.align === "right"
                              ? "text-right"
                              : ""
                          }`}
                          title={String(cell || "")}
                        >
                          {wfmRawDataColumns[cellIndex] === "Status" ? (
                            <WfmStatusPill status={cell} />
                          ) : (
                            <span className="block truncate">{cell}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={wfmRawDataColumns.length} className="bg-[#f8fbfd] px-5 py-10 text-center text-sm text-sibs-tertiary-5">
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
              <span>{selectedUpload || "All uploaded files"}</span>
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

      <AppModal isOpen={isImportModalOpen} className="max-w-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="m-0 text-lg font-bold text-sibs-primary-1">
              Upload/Import File
            </p>
            <p className="mt-1 mb-0 text-sm text-sibs-tertiary-5">
              Select an Excel or CSV raw KPI file for frontend staging.
            </p>
          </div>
          <CloudUpload className="h-6 w-6 text-sibs-primary-2" aria-hidden="true" />
        </div>

        <label
          htmlFor="wfm-import-file-input"
          className="mt-5 flex cursor-pointer items-center gap-4 rounded-lg border border-dashed border-sibs-tertiary-9 bg-[#f8fbfd] p-5 text-left transition hover:border-sibs-primary-2 hover:bg-sibs-primary-2/5"
        >
          <input
            id="wfm-import-file-input"
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(event) => handleFileSelect(event.target.files)}
          />
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sibs-primary-2/10">
            <CloudUpload className="h-6 w-6 text-sibs-primary-2" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <p className="m-0 truncate text-sm font-bold text-sibs-primary-1">
              {selectedFile?.name || "Choose Excel sheet file"}
            </p>
            <p className="mt-1 mb-0 text-xs text-sibs-tertiary-5">
              Accepted: .xlsx, .xls, .csv
            </p>
          </div>
        </label>

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={closeImportModal}
            className="h-10 rounded-xl border-sibs-tertiary-8 sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!selectedFile}
            onClick={handleUploadFile}
            className="h-10 rounded-xl bg-sibs-primary-1 font-semibold text-white hover:bg-sibs-tertiary-4 sm:w-auto"
          >
            Upload
          </Button>
        </div>
      </AppModal>

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        title="Delete uploaded file"
        message={`Remove ${fileToDelete?.fileName || "this file"} from the uploaded files list?`}
        cancelText="Cancel"
        confirmText="Delete"
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteFile}
        tone="neutral"
      />

      <LoadingModal
        isOpen={isImporting}
        title="Importing file"
        message="Please wait while we read and stage the uploaded file."
      />

      <LoadingModal
        isOpen={isDeletingFile}
        title="Deleting file"
        message="Removing the uploaded file from this workspace."
      />

      <AppModal isOpen={showSuccessModal} textAlign="center">
        <CheckCircle2 className="mx-auto h-11 w-11 text-sibs-success" aria-hidden="true" />
        <p className="mt-4 mb-1 text-base font-bold text-sibs-primary-1">
          Action completed
        </p>
        <p className="m-0 text-sm text-sibs-tertiary-5">
          The WFM import workspace has been updated.
        </p>
        <Button
          type="button"
          onClick={() => setShowSuccessModal(false)}
          className="mt-5 h-10 w-full rounded-xl bg-sibs-primary-1 text-white hover:bg-sibs-tertiary-4"
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
