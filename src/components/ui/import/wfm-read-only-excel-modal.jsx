import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  Loader2,
  Lock,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import AppModal from "@/components/ui/app-modal";
import { Button } from "@/components/ui/button";
import { getUsVisaImportRawData } from "@/lib/axios/us-visa-imports";

/* Helper to convert 1-based index to Excel column letter (1 -> A, 27 -> AA) */
function getColumnLetter(colIndex) {
  let temp;
  let letter = "";
  let current = colIndex;
  while (current > 0) {
    temp = (current - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    current = Math.floor((current - temp - 1) / 26);
  }
  return letter;
}

export default function WfmReadOnlyExcelModal({
  isOpen,
  batch,
  onClose,
}) {
  const [activeSheet, setActiveSheet] = useState("");
  const [sheets, setSheets] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    totalRows: 0,
    totalPages: 1,
    search: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [sibsFilter, setSibsFilter] = useState("ALL"); // "ALL" | "SIBS" | "NON_SIBS"
  const [supportsSibsFilter, setSupportsSibsFilter] = useState(false);
  const [sibsCounts, setSibsCounts] = useState({ all: 0, sibs: 0, nonSibs: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  const batchId = batch?.batchId || batch?.id;
  const fileName = batch?.fileName || batch?.sourceFilename || "Spreadsheet.xlsx";
  const batchCode = batch?.batchCode;
  const rawDataTitle = batch?.rawDataTitle || batch?.importProfileName;

  // Determine if this batch represents Agent Level or Agent Occupancy
  const isAgentOrOccupancyFromBatch = useMemo(() => {
    const label = (batch?.groupLabel || "").toUpperCase();
    const text = `${batch?.rawDataTitle || ""} ${batch?.fileName || ""} ${batch?.importProfileName || ""}`.toUpperCase();
    return label.includes("AGENT") || text.includes("AGENT LEVEL") || text.includes("AGENT OCCUPANCY");
  }, [batch]);

  const isSibsFilterActive = supportsSibsFilter || isAgentOrOccupancyFromBatch;

  // Reset state when modal opens or batch changes
  useEffect(() => {
    if (isOpen && batchId) {
      setActiveSheet("");
      setSearchQuery("");
      setSibsFilter("ALL");
      setSupportsSibsFilter(false);
      setSibsCounts({ all: 0, sibs: 0, nonSibs: 0 });
      setErrorMsg("");
      loadRawData(1, "", "", "ALL");
    }
  }, [isOpen, batchId]);

  const loadRawData = async (
    targetPage = 1,
    targetSearch = searchQuery,
    targetSheet = activeSheet,
    targetSibsFilter = sibsFilter,
  ) => {
    if (!batchId) return;

    try {
      setIsLoading(true);
      setErrorMsg("");

      const result = await getUsVisaImportRawData(batchId, {
        page: targetPage,
        limit: pagination.limit,
        search: targetSearch.trim(),
        sheet: targetSheet,
        sibsFilter: targetSibsFilter,
      });

      if (result?.success) {
        setSheets(result.sheets || []);
        setActiveSheet(result.activeSheet || "");
        setHeaders(result.headers || []);
        setRows(result.rows || []);
        if (result.supportsSibsFilter !== undefined) {
          setSupportsSibsFilter(Boolean(result.supportsSibsFilter));
        }
        if (result.sibsCounts) {
          setSibsCounts(result.sibsCounts);
        }
        setPagination({
          page: result.pagination?.page || 1,
          limit: result.pagination?.limit || 50,
          totalRows: result.pagination?.totalRows || 0,
          totalPages: result.pagination?.totalPages || 1,
          search: result.pagination?.search || "",
        });
      } else {
        setErrorMsg(result?.message || "Failed to load raw spreadsheet data.");
      }
    } catch (err) {
      console.error("Load raw data error:", err);
      setErrorMsg(err?.response?.data?.message || "Unable to fetch raw spreadsheet data.");
    } finally {
      setIsLoading(false);
    }
  };

  // Search debounce
  useEffect(() => {
    if (!isOpen || !batchId) return;
    const t = setTimeout(() => {
      loadRawData(1, searchQuery, activeSheet, sibsFilter);
    }, 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const handleSelectSheet = (sheetName) => {
    if (sheetName === activeSheet) return;
    setActiveSheet(sheetName);
    loadRawData(1, searchQuery, sheetName, sibsFilter);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages || newPage === pagination.page) return;
    loadRawData(newPage, searchQuery, activeSheet, sibsFilter);
  };

  const handleLimitChange = (newLimit) => {
    setPagination((prev) => ({ ...prev, limit: newLimit }));
    setTimeout(() => {
      loadRawData(1, searchQuery, activeSheet, sibsFilter);
    }, 0);
  };

  const handleSibsFilterChange = (newFilter) => {
    if (newFilter === sibsFilter) return;
    setSibsFilter(newFilter);
    loadRawData(1, searchQuery, activeSheet, newFilter);
  };

  // Download raw data as XLSX
  const handleExportXlsx = async () => {
    if (isDownloading || rows.length === 0 || !batch?.id) return;
    try {
      setIsDownloading(true);
      const XLSX = await import("xlsx");

      let exportRows = rows.map((r) => r.data || {});

      // If there are more rows than currently displayed on page, fetch all sheet rows
      if (pagination.totalRows > rows.length) {
        try {
          const allRes = await getUsVisaImportRawData(batch.id, {
            sheet: activeSheet,
            exportAll: "true",
            search: searchQuery.trim(),
            sibsFilter,
          });
          if (allRes?.success && Array.isArray(allRes.data?.rows) && allRes.data.rows.length > 0) {
            exportRows = allRes.data.rows.map((r) => r.data || {});
          }
        } catch (fetchErr) {
          console.warn("Export all fallback to current page:", fetchErr);
        }
      }

      const worksheet = XLSX.utils.json_to_sheet(exportRows, { header: headers });
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, activeSheet || "Sheet1");

      const suffix = sibsFilter === "SIBS" ? "_SIBS" : sibsFilter === "NON_SIBS" ? "_NON_SIBS" : "";
      const baseName = fileName.toLowerCase().endsWith(".xlsx")
        ? fileName.slice(0, -5)
        : fileName;
      const exportFileName = `RAW_${baseName}${suffix}.xlsx`;

      XLSX.writeFile(workbook, exportFileName);
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AppModal
      isOpen={isOpen}
      className="!max-w-none !w-[min(98vw,1920px)] !h-[94vh] !max-h-[94vh] flex flex-col !p-0 overflow-hidden"
      zIndex="z-[150]"
    >
      <div className="flex flex-col h-full w-full bg-[#f8fafc] text-slate-800 overflow-hidden rounded-2xl border border-slate-200 shadow-2xl">
        {/* ── Top Ribbon (Excel Header) ────────────────────────────── */}
        <div className="shrink-0 bg-white border-b border-slate-200 px-4 sm:px-5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-2xs">
          {/* Left: Icon, Filename, Read-Only Badge, Metadata */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-xs">
              <FileSpreadsheet className="h-5 w-5" aria-hidden="true" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3
                  className="m-0 font-bold text-sm sm:text-base text-slate-900 truncate leading-snug max-w-xl"
                  title={fileName}
                >
                  {fileName}
                </h3>

                {/* Read-Only Badge */}
                <span className="inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 shadow-2xs">
                  <Lock className="h-2.5 w-2.5" />
                  READ-ONLY
                </span>

                {batchCode && (
                  <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[10.5px] font-bold text-slate-600 border border-slate-200">
                    {batchCode}
                  </span>
                )}
              </div>

              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-slate-500">
                {rawDataTitle && <span className="font-semibold text-slate-700">{rawDataTitle}</span>}
                {pagination.totalRows > 0 && (
                  <span>
                    • <strong className="text-slate-800">{pagination.totalRows.toLocaleString()}</strong> total rows
                  </span>
                )}
                {headers.length > 0 && (
                  <span>
                    • <strong className="text-slate-800">{headers.length}</strong> columns
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleExportXlsx}
              disabled={isDownloading || rows.length === 0}
              className="h-8 shrink-0 rounded-lg px-3.5 sm:px-4 text-xs font-semibold cursor-pointer gap-1.5"
              title="Download raw spreadsheet data"
            >
              {isDownloading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-sibs-primary-1 group-hover/button:text-white" />
              ) : (
                <Download className="h-3.5 w-3.5 text-emerald-600 transition-colors group-hover/button:text-white" />
              )}
              <span>{isDownloading ? "Exporting..." : "Export"}</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-8 shrink-0 rounded-lg px-3.5 sm:px-4 text-xs font-semibold cursor-pointer"
            >
              Close
            </Button>
          </div>
        </div>

        {/* ── Sub-toolbar: Search + Sheet Tabs ────────────────────── */}
        <div className="shrink-0 bg-slate-50/90 border-b border-slate-200 px-4 sm:px-5 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          {/* Sheet tabs (Excel Style) */}
          <div className="flex items-center gap-1 overflow-x-auto sibs-scrollbar py-0.5 min-w-0">
            {sheets.length > 0 ? (
              sheets.map((sheet) => {
                const isActive = sheet === activeSheet;
                return (
                  <button
                    key={sheet}
                    type="button"
                    onClick={() => handleSelectSheet(sheet)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
                      isActive
                        ? "bg-white text-emerald-800 border border-slate-200 border-b-2 border-b-emerald-600 shadow-xs"
                        : "bg-transparent text-slate-600 hover:bg-white/60 hover:text-slate-900 border border-transparent"
                    }`}
                  >
                    <FileSpreadsheet className={`h-3.5 w-3.5 ${isActive ? "text-emerald-600" : "text-slate-400"}`} />
                    <span>{sheet}</span>
                  </button>
                );
              })
            ) : (
              <span className="text-xs font-semibold text-slate-500">Sheet1</span>
            )}
          </div>

          {/* Search + Per Page + SIBS Filter */}
          <div className="flex items-center gap-2 shrink-0">
            {/* SIBS vs Non-SIBS Filter dropdown (Only for Agent Level & Agent Occupancy) */}
            {isSibsFilterActive && (
              <div className="relative">
                <select
                  value={sibsFilter}
                  onChange={(e) => handleSibsFilterChange(e.target.value)}
                  className={`h-8 rounded-lg border px-2.5 text-xs font-semibold shadow-2xs focus:border-emerald-600 focus:outline-none cursor-pointer transition-colors ${
                    sibsFilter === "SIBS"
                      ? "border-emerald-400 bg-emerald-50 text-emerald-800 font-bold"
                      : sibsFilter === "NON_SIBS"
                        ? "border-amber-400 bg-amber-50 text-amber-800 font-bold"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                  title="Filter employees by SIBS / Non-SIBS"
                >
                  <option value="ALL">
                    All Employees{sibsCounts.all ? ` (${sibsCounts.all.toLocaleString()})` : ""}
                  </option>
                  <option value="SIBS">
                    SIBS{sibsCounts.sibs ? ` (${sibsCounts.sibs.toLocaleString()})` : " (Matched)"}
                  </option>
                  <option value="NON_SIBS">
                    Non-SIBS{sibsCounts.nonSibs ? ` (${sibsCounts.nonSibs.toLocaleString()})` : " (Unmatched)"}
                  </option>
                </select>
              </div>
            )}

            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cells in spreadsheet…"
                className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-7 text-xs text-slate-800 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            <select
              value={pagination.limit}
              onChange={(e) => handleLimitChange(Number(e.target.value))}
              className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 shadow-2xs focus:border-emerald-600 focus:outline-none cursor-pointer"
              title="Rows per page"
            >
              <option value={25}>25 rows</option>
              <option value={50}>50 rows</option>
              <option value={100}>100 rows</option>
              <option value={200}>200 rows</option>
            </select>

            <button
              type="button"
              onClick={() => loadRawData(pagination.page, searchQuery, activeSheet, sibsFilter)}
              disabled={isLoading}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 shadow-2xs transition cursor-pointer disabled:opacity-50"
              title="Refresh spreadsheet"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-emerald-600" : ""}`} />
            </button>
          </div>
        </div>

        {/* ── Error Banner ────────────────────────────────────────── */}
        {errorMsg && (
          <div className="shrink-0 bg-rose-50 border-b border-rose-200 px-4 py-2 text-xs font-semibold text-rose-700">
            {errorMsg}
          </div>
        )}

        {/* ── Spreadsheet Grid Area ───────────────────────────────── */}
        <div className="flex-1 min-h-0 bg-white overflow-auto sibs-scrollbar relative">
          {isLoading && rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-24 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mb-2" />
              <p className="text-xs font-semibold text-slate-600">Loading raw Excel data…</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-24 text-center">
              <FileSpreadsheet className="h-10 w-10 text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-700">No data found</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {searchQuery ? `No cells matched "${searchQuery}"` : "This spreadsheet contains no rows."}
              </p>
            </div>
          ) : (
            <table className="border-collapse table-auto text-xs text-slate-800 select-text">
              {/* Table Head: Column letters + Original Column Headers */}
              <thead className="sticky top-0 z-20 bg-slate-100/95 shadow-xs backdrop-blur-xs">
                <tr>
                  {/* Top-left corner cell */}
                  <th className={`sticky left-0 z-30 ${isSibsFilterActive ? "w-20 min-w-[80px] max-w-[80px]" : "w-14 min-w-[56px] max-w-[56px]"} bg-slate-200 border-r border-b border-slate-300 px-1 py-1.5 text-center text-[10px] font-bold text-slate-500 uppercase select-none`}>
                    {isSibsFilterActive ? "Row / Type" : "#"}
                  </th>

                  {/* Header Columns with Column Letter & Name */}
                  {headers.map((header, idx) => (
                    <th
                      key={header || idx}
                      className="border-r border-b border-slate-300 bg-slate-100 px-3 py-1.5 text-left font-bold text-slate-800 whitespace-nowrap min-w-[140px] max-w-[320px] select-none"
                    >
                      <div className="flex flex-col">
                        <span className="font-mono text-[9.5px] font-bold text-slate-400 uppercase leading-none">
                          {getColumnLetter(idx + 1)}
                        </span>
                        <span className="mt-0.5 text-xs font-bold text-slate-900 truncate" title={header}>
                          {header}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-slate-200/80 bg-white">
                {rows.map((row, rIdx) => {
                  const excelRowNum = row.excelRowNumber ?? (pagination.page - 1) * pagination.limit + rIdx + 2;
                  const rowData = row.data || {};

                  return (
                    <tr
                      key={row.id || `${excelRowNum}-${rIdx}`}
                      className="hover:bg-emerald-50/40 transition-colors"
                    >
                      {/* Sticky Row Number (Excel Style) */}
                      <td className={`sticky left-0 z-10 ${isSibsFilterActive ? "w-20 min-w-[80px] max-w-[80px]" : "w-14 min-w-[56px] max-w-[56px]"} bg-slate-100/90 border-r border-b border-slate-200 px-1 py-1 text-center font-mono text-[11px] font-semibold text-slate-500 select-none`}>
                        <div className="flex flex-col items-center justify-center gap-0.5">
                          <span>{excelRowNum}</span>
                          {isSibsFilterActive && (
                            <span
                              className={`inline-block px-1 py-0.5 rounded text-[8.5px] font-extrabold uppercase tracking-tight leading-none ${
                                row.isSibs
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300/60"
                                  : "bg-amber-100 text-amber-800 border border-amber-300/60"
                              }`}
                              title={row.isSibs ? "SIBS Employee (Matched)" : `Non-SIBS (${row.mappingStatus || "Unmatched"})`}
                            >
                              {row.isSibs ? "SIBS" : "NON-SIBS"}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Data Cells */}
                      {headers.map((header, cIdx) => {
                        const cellVal = rowData[header];
                        const displayVal =
                          cellVal === null || cellVal === undefined
                            ? ""
                            : typeof cellVal === "object"
                              ? JSON.stringify(cellVal)
                              : String(cellVal);

                        const isNumber = !isNaN(Number(displayVal)) && displayVal.trim() !== "";

                        return (
                          <td
                            key={cIdx}
                            className={`border-r border-b border-slate-200/90 px-3 py-1.5 whitespace-nowrap min-w-[140px] max-w-[320px] truncate font-sans text-xs ${
                              isNumber ? "text-right font-mono" : "text-left"
                            } ${displayVal === "" ? "bg-slate-50/20" : ""}`}
                            title={displayVal}
                          >
                            {displayVal}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Bottom Status Bar & Pagination (Excel Style) ────────── */}
        <div className="shrink-0 bg-white border-t border-slate-200 px-4 sm:px-5 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
          {/* Left status note */}
          <div className="flex items-center gap-2 text-slate-500 font-medium">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            <span>
              Showing{" "}
              <strong className="text-slate-800">
                {pagination.totalRows === 0
                  ? 0
                  : (pagination.page - 1) * pagination.limit + 1}
              </strong>{" "}
              –{" "}
              <strong className="text-slate-800">
                {Math.min(pagination.page * pagination.limit, pagination.totalRows)}
              </strong>{" "}
              of <strong className="text-slate-800">{pagination.totalRows.toLocaleString()}</strong> rows
              {sibsFilter === "SIBS" && (
                <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300/60">
                  SIBS (Matched)
                </span>
              )}
              {sibsFilter === "NON_SIBS" && (
                <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300/60">
                  Non-SIBS (Unmatched)
                </span>
              )}
            </span>
            <span className="hidden sm:inline text-slate-300">|</span>
            <span className="hidden sm:inline font-mono text-[11px] text-slate-400">
              Sheet: {activeSheet || "Sheet1"}
            </span>
          </div>

          {/* Right Pagination Buttons */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1 || isLoading}
              className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Prev</span>
            </button>

            <span className="px-2.5 py-1 rounded-md bg-slate-100 font-bold text-xs text-slate-800 border border-slate-200">
              {pagination.page} / {pagination.totalPages}
            </span>

            <button
              type="button"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || isLoading}
              className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </AppModal>
  );
}
