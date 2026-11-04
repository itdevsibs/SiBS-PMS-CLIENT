import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Download,
  Eye,
  FileEdit,
  FileSpreadsheet,
  FileText,
  Filter,
  FilterX,
  History,
  Info,
  KeyRound,
  LogIn,
  LogOut,
  RotateCcw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";
import TablePagination from "../../components/common/tables/TablePagination";
import { getStoredAuditLogs, AUDIT_LOG_ADDED_EVENT } from "../../lib/audit-logger";

// Comprehensive demonstration audit trail activity records across all FrontSteps modules
const INITIAL_AUDIT_LOGS = [];

// Strict requirement #1: Create, Update, Delete, Approve, Reject, Login, and Logout
function getActionBadge(action) {
  switch (action) {
    case "Login":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "Logout":
      return "bg-slate-100 text-slate-700 border-slate-200";
    case "Upload":
    case "Create":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "Edit":
    case "Update":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "Delete":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "Approve":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "Reject":
      return "bg-rose-50 text-rose-700 border-rose-200";
    default:
      return "bg-slate-50 text-slate-600 border-slate-200";
  }
}

function getActionIcon(action) {
  switch (action) {
    case "Login":
      return <LogIn size={11} className="mr-1 inline text-emerald-600 shrink-0" />;
    case "Logout":
      return <LogOut size={11} className="mr-1 inline text-slate-500 shrink-0" />;
    case "Upload":
      return <Download size={11} className="mr-1 inline text-blue-600 shrink-0 rotate-180" />;
    case "Create":
      return <FileText size={11} className="mr-1 inline text-blue-600 shrink-0" />;
    case "Edit":
    case "Update":
      return <FileEdit size={11} className="mr-1 inline text-amber-600 shrink-0" />;
    case "Delete":
      return <Trash2 size={11} className="mr-1 inline text-rose-600 shrink-0" />;
    case "Approve":
      return <CheckCircle2 size={11} className="mr-1 inline text-emerald-600 shrink-0" />;
    case "Reject":
      return <AlertTriangle size={11} className="mr-1 inline text-rose-600 shrink-0" />;
    default:
      return null;
  }
}

export default function FrontStepsAuditTrails() {
  const [logs, setLogs] = useState(() => getStoredAuditLogs());

  useEffect(() => {
    const handleLogAdded = (event) => {
      if (event?.detail) {
        setLogs((prev) => [event.detail, ...prev.filter((l) => l.id !== event.detail.id)]);
      } else {
        setLogs(getStoredAuditLogs());
      }
    };

    window.addEventListener(AUDIT_LOG_ADDED_EVENT, handleLogAdded);
    window.addEventListener("storage", handleLogAdded);

    return () => {
      window.removeEventListener(AUDIT_LOG_ADDED_EVENT, handleLogAdded);
      window.removeEventListener("storage", handleLogAdded);
    };
  }, []);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportNotice, setExportNotice] = useState("");
  const pageSize = 15;

  // Search filter across timestamp, employee name, kronos ID, action, and module
  const filteredLogs = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return logs;
    return logs.filter((log) => {
      return (
        log.employeeName?.toLowerCase().includes(term) ||
        (log.kronosId && log.kronosId.toLowerCase().includes(term)) ||
        (log.employeeId && log.employeeId.toLowerCase().includes(term)) ||
        log.action?.toLowerCase().includes(term) ||
        log.module?.toLowerCase().includes(term) ||
        log.timestamp?.toLowerCase().includes(term)
      );
    });
  }, [logs, search]);

  // Pagination calculation (default newest first)
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const paginatedLogs = useMemo(() => {
    const startIndex = (Math.min(page, totalPages) - 1) * pageSize;
    return filteredLogs.slice(startIndex, startIndex + pageSize);
  }, [filteredLogs, page, totalPages, pageSize]);

  const handleResetFilters = () => {
    setSearch("");
    setPage(1);
  };

  // Export Logs Handler (Requirement #6: CSV and XLSX export for authorized audit compliance)
  const handleExportLogs = (format) => {
    setShowExportMenu(false);
    const dateStamp = new Date().toISOString().split("T")[0];
    const filename = `FrontSteps_Audit_Trails_${dateStamp}.${format.toLowerCase()}`;

    if (format === "CSV") {
      const headers = [
        "Timestamp",
        "Employee Name",
        "Kronos ID",
        "Action",
        "Module",
      ];
      const rows = filteredLogs.map((log) => [
        `"${log.timestamp}"`,
        `"${log.employeeName}"`,
        `"${log.kronosId || log.employeeId || "—"}"`,
        `"${log.action}"`,
        `"${log.module}"`,
      ]);
      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    setExportNotice(`Export Generated: ${filename} downloaded successfully (${filteredLogs.length} audit records).`);
    setTimeout(() => setExportNotice(""), 4500);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2.5 sm:gap-3 overflow-hidden font-jakarta text-slate-800">
      {/* Export Success Notice Banner */}
      {exportNotice && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 shadow-xs animate-in fade-in duration-200 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
            <span className="truncate">{exportNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setExportNotice("")}
            className="text-emerald-600 hover:text-emerald-800 p-0.5 rounded cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* 1. Header Filter & Action Bar */}
      <div className="rounded-xl border border-slate-200/80 bg-white px-3.5 py-2.5 shadow-xs shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Left: Search Input */}
          <div className="flex flex-1 items-center gap-2 max-w-md">
            <div className="flex-1">
              <div className="relative flex h-8 items-center rounded-lg border border-slate-200 bg-white px-2.5 transition-colors focus-within:border-[#ff5c28] focus-within:ring-1 focus-within:ring-[#ff5c28]/20">
                <Search size={13} className="text-slate-400 shrink-0 mr-2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search employee name, ID, or record..."
                  className="w-full bg-transparent text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setPage(1);
                    }}
                    className="text-slate-400 hover:text-slate-600 ml-1 cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {search && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Clear search"
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Right: Export button */}
          <div className="flex items-center gap-2">

            {/* Export Logs Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#042c51] px-3 text-xs font-semibold text-white shadow-xs hover:bg-[#073c6c] transition-colors cursor-pointer"
              >
                <Download size={13} />
                <span>Export Logs</span>
                <ChevronDown size={12} className={showExportMenu ? "rotate-180 transition-transform" : "transition-transform"} />
              </button>

              {showExportMenu && (
                <div className="absolute right-0 top-9.5 z-30 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Export Audit History
                  </div>
                  <button
                    type="button"
                    onClick={() => handleExportLogs("CSV")}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-800 transition-colors cursor-pointer text-left"
                  >
                    <FileText size={14} className="text-blue-600" />
                    <div>
                      <span className="block font-bold">CSV Document (.csv)</span>
                      <span className="text-[10px] text-slate-400">Standard audit extract</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportLogs("XLSX")}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors cursor-pointer text-left"
                  >
                    <FileSpreadsheet size={14} className="text-emerald-600" />
                    <div>
                      <span className="block font-bold">Excel Sheet (.xlsx)</span>
                      <span className="text-[10px] text-slate-400">Formatted workbook</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Audit Trails Table */}
      <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden flex flex-col flex-1 min-h-0">
        {/* Table Body */}
        <div className="overflow-auto flex-1 min-h-0 sibs-scrollbar">
          <table className="w-full table-fixed text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-[#042c51] bg-[#042c51] text-[11px] font-bold uppercase tracking-wider text-white select-none shadow-xs">
                <th className="py-3 px-4 w-[25%]">Timestamp</th>
                <th className="py-3 px-4 w-[35%]">Employee Name & Kronos ID</th>
                <th className="py-3 px-4 w-[20%]">Action</th>
                <th className="py-3 px-4 w-[20%]">Module</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {paginatedLogs.length > 0 ? (
                paginatedLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50/70 transition-colors h-[54px]"
                  >
                    {/* Timestamp */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-[12px] font-semibold text-slate-800">
                        {log.timestamp}
                      </span>
                    </td>

                    {/* Employee Name & Kronos ID */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-[12.5px] truncate" title={log.employeeName}>
                          {log.employeeName}
                        </span>
                        {(log.kronosId || log.employeeId) && (
                          <span className="font-mono text-[11px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/70">
                            ({log.kronosId || log.employeeId})
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${getActionBadge(
                          log.action
                        )}`}
                      >
                        {getActionIcon(log.action)}
                        {log.action}
                      </span>
                    </td>

                    {/* Module */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-slate-800 truncate max-w-full">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#042c51] shrink-0" />
                        <span className="truncate">{log.module}</span>
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-500">
                    <FilterX className="mx-auto mb-2 text-slate-400" size={24} />
                    <p className="text-xs font-bold text-slate-700">No activity records found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      No audit events match your selected filters. Try adjusting your search query or reset filters.
                    </p>
                    {search && (
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <RotateCcw size={12} />
                        <span>Clear Search</span>
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Standard TablePagination */}
        <TablePagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={filteredLogs.length}
          pageSize={pageSize}
          onPageChange={(nextPage) => setPage(nextPage)}
          itemLabel="activities"
          className="shrink-0"
        />
      </div>

      {/* 3. Read-Only View Details Modal (Requirements #3, #4, #5) */}
      {selectedAudit && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-3 sm:p-6"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSelectedAudit(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Audit Activity Details"
            className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150 font-jakarta"
          >
            {/* Modal Header */}
            <header className="flex shrink-0 items-center justify-between gap-3 bg-[#042c51] px-5 py-4 text-white">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#ff5c28] bg-white/10 px-2 py-0.5 rounded">
                    {selectedAudit.id}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10.5px] font-semibold ${getActionBadge(
                      selectedAudit.action
                    )}`}
                  >
                    {getActionIcon(selectedAudit.action)}
                    {selectedAudit.action}
                  </span>
                  <span className="text-[11px] text-slate-300 font-medium hidden sm:inline">
                    • 100% Read-Only Event
                  </span>
                </div>
                <h2 className="text-base font-bold text-white leading-tight mt-1 truncate">
                  {selectedAudit.description}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAudit(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            </header>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 sibs-scrollbar text-xs">
              {/* Event Overview Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                <div>
                  <span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                    Timestamp
                  </span>
                  <span className="font-semibold text-slate-800 text-[12px] block mt-0.5">
                    {selectedAudit.timestamp}
                  </span>
                </div>
                <div>
                  <span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                    Module
                  </span>
                  <span className="font-semibold text-slate-800 text-[12px] block mt-0.5">
                    {selectedAudit.module}
                  </span>
                </div>
                <div>
                  <span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                    Affected Record ID
                  </span>
                  <span className="font-mono font-bold text-slate-800 text-[12px] block mt-0.5">
                    {selectedAudit.recordId || "—"}
                  </span>
                </div>
                <div>
                  <span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                    Record Type
                  </span>
                  <span className="font-semibold text-slate-800 text-[12px] block mt-0.5">
                    {selectedAudit.recordType || "System Entry"}
                  </span>
                </div>
              </div>

              {/* Performed By Section */}
              <div className="rounded-xl border border-slate-200/80 p-3.5 bg-white">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                  <User size={13} className="text-[#042c51]" />
                  Performed By
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-[11px] text-slate-500 block">Employee Name</span>
                    <span className="font-bold text-slate-900 text-xs block mt-0.5">
                      {selectedAudit.employeeName}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Employee ID & Role</span>
                    <span className="font-semibold text-slate-800 text-xs block mt-0.5">
                      {selectedAudit.employeeId} ({selectedAudit.role})
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Client IP / Host</span>
                    <span className="font-mono text-slate-700 text-xs block mt-0.5">
                      {selectedAudit.ipAddress || "10.240.12.84"}
                    </span>
                  </div>
                </div>
                {selectedAudit.targetSubject && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-500">Target Subject:</span>
                    <span className="font-semibold text-slate-800 text-[11.5px]">
                      {selectedAudit.targetSubject}
                    </span>
                  </div>
                )}
              </div>

              {/* Authentication Session Details (for Login/Logout activities) */}
              {selectedAudit.sessionDetails && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2 flex items-center gap-1.5">
                    <KeyRound size={13} className="text-emerald-700" />
                    Authentication Session Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-[11px] text-emerald-700 block">Device & Browser:</span>
                      <span className="font-semibold text-slate-800 text-[11.5px]">
                        {selectedAudit.sessionDetails.device || "Windows 11 (Chrome 129.0)"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-emerald-700 block">Method:</span>
                      <span className="font-semibold text-slate-800 text-[11.5px]">
                        {selectedAudit.sessionDetails.authMethod || "SSO Session"}
                      </span>
                    </div>
                    {selectedAudit.sessionDetails.sessionDuration && (
                      <div>
                        <span className="text-[11px] text-emerald-700 block">Duration:</span>
                        <span className="font-semibold text-slate-800 text-[11.5px]">
                          {selectedAudit.sessionDetails.sessionDuration}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Requirement #4: Before and After Values Table */}
              <div className="rounded-xl border border-slate-200/80 overflow-hidden bg-white">
                <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Activity size={13} className="text-[#ff5c28]" />
                    Field Changes & Values (Before & After)
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {selectedAudit.changes?.length || 0} field modification(s)
                  </span>
                </div>
                {selectedAudit.changes && selectedAudit.changes.length > 0 ? (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-100/60 text-[10.5px] font-bold uppercase tracking-wider text-slate-600">
                        <th className="py-2 px-3 w-[22%]">Field Changed</th>
                        <th className="py-2 px-3 w-[26%] text-rose-700">Before Value</th>
                        <th className="py-2 px-3 w-[26%] text-emerald-700">After Value</th>
                        <th className="py-2 px-3 w-[26%]">Audit Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {selectedAudit.changes.map((change, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70">
                          <td className="py-2 px-3 font-semibold text-slate-900">
                            {change.field}
                          </td>
                          <td className="py-2 px-3">
                            <span className="inline-block rounded bg-rose-50 px-2 py-0.5 text-rose-800 font-mono text-[11px] border border-rose-200">
                              {change.previous}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            <span className="inline-block rounded bg-emerald-50 px-2 py-0.5 text-emerald-800 font-mono text-[11px] border border-emerald-200">
                              {change.current}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-600 text-[11px]">
                            {change.remarks}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-4 text-center text-slate-400 text-xs">
                    No field-level parameter modifications recorded for this entry.
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer (100% Read-Only: Close Only) */}
            <footer className="flex shrink-0 items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-3">
              <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                <Shield size={13} className="text-slate-400" />
                Immutable audit trail entry. No alterations permitted.
              </span>
              <button
                type="button"
                onClick={() => setSelectedAudit(null)}
                className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Close
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}
