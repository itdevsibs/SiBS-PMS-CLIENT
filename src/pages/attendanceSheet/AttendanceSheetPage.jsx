import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Database,
  Filter,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  Server,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";

import AdminSidebar from "@/components/layout/AdminSidebar";
import AppHeader from "@/components/layout/AppHeader";
import TablePagination from "@/components/tables/TablePagination";
import { Button } from "@/components/ui/button";
import ConfirmationModal from "@/components/ui/confirmation-modal";
import DatePicker from "@/components/ui/Filter/DatePicker";
import LoadingModal from "@/components/ui/loading-modal";
import useDashboardPage from "@/hooks/useDashboardPage";
import {
  fetchAttendancePreview,
  fetchAttendanceSheetAccounts,
  fetchAttendanceSheetStatus,
} from "@/lib/axios/attendance-sheet";

const PAGE_SIZE_OPTIONS = [15, 25, 50, 100];

function formatManilaDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function getInitialDateRange() {
  const today = formatManilaDate();
  return {
    dateFrom: `${today.slice(0, 7)}-01`,
    dateTo: today,
  };
}

function normalizeEmployeeCode(value) {
  return String(value || "")
    .trim()
    .replace(/^SIB-\s*/i, "")
    .trim();
}

function formatDateTime(value) {
  if (!value) return "—";
  const raw = String(value).trim();
  if (!raw || raw.startsWith("0000-00-00") || raw.startsWith("1970-01-01 00:00:00")) return "—";

  const sqlMatch = raw.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})(?::(\d{2}))?/);
  if (sqlMatch) {
    if (sqlMatch[1] === "0000-00-00") return "—";
    return `${sqlMatch[1]} ${sqlMatch[2]}:${sqlMatch[3] || "00"}`;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getValueByPath(object, fieldPath) {
  if (!object || !fieldPath) return undefined;
  return String(fieldPath)
    .split(".")
    .reduce((value, key) => (value == null ? undefined : value[key]), object);
}

function normalizeFieldKey(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function flattenRowEntries(value, prefix = "", output = [], depth = 0) {
  if (!value || typeof value !== "object" || Array.isArray(value) || depth > 2) {
    return output;
  }

  Object.entries(value).forEach(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    output.push({
      path,
      normalizedPath: normalizeFieldKey(path),
      normalizedLeaf: normalizeFieldKey(key),
      value: child,
    });

    if (child && typeof child === "object" && !Array.isArray(child)) {
      flattenRowEntries(child, path, output, depth + 1);
    }
  });

  return output;
}

function findRowValue(row, candidates = []) {
  if (!row || typeof row !== "object") return undefined;

  const entries = flattenRowEntries(row);

  // Exact leaf/full-path match first.
  for (const candidate of candidates) {
    const normalized = normalizeFieldKey(candidate);
    const match = entries.find(
      (entry) =>
        (entry.normalizedLeaf === normalized || entry.normalizedPath === normalized) &&
        entry.value != null &&
        entry.value !== "",
    );
    if (match) return match.value;
  }

  // Kronos tracker fields can be prefixed (for example gy_tracker_time_in).
  // Use a conservative suffix match instead of requiring an exact key.
  for (const candidate of candidates) {
    const normalized = normalizeFieldKey(candidate);
    const matches = entries
      .filter(
        (entry) =>
          entry.normalizedPath.endsWith(normalized) &&
          entry.value != null &&
          entry.value !== "",
      )
      .sort((a, b) => a.normalizedPath.length - b.normalizedPath.length);
    if (matches.length) return matches[0].value;
  }

  return undefined;
}

function getAttendanceEmployeeId(row, responseMeta) {
  const configuredField = responseMeta?.fieldConfiguration?.employeeCode;
  return (
    getValueByPath(row, configuredField) ??
    findRowValue(row, ["gy_emp_code", "employee_id", "employee_code", "emp_code", "sibs_id"]) ??
    "—"
  );
}

function getAttendanceEmployeeName(row) {
  const directName = findRowValue(row, [
    "employee_name",
    "employee_full_name",
    "full_name",
    "gy_emp_name",
    "emp_name",
    "name",
  ]);
  if (directName != null && directName !== "") return directName;

  const firstName = findRowValue(row, ["first_name", "firstname", "gy_emp_firstname"]);
  const middleName = findRowValue(row, ["middle_name", "middlename", "gy_emp_middlename"]);
  const lastName = findRowValue(row, ["last_name", "lastname", "gy_emp_lastname"]);
  const fullName = [firstName, middleName, lastName].filter(Boolean).join(" ").trim();
  return fullName || "—";
}

function getAttendanceAccountId(row, responseMeta, selectedAccount) {
  return (
    responseMeta?.scope?.kronosMapping?.kronosAccountId ??
    selectedAccount?.kronosMapping?.kronosAccountId ??
    findRowValue(row, ["gy_acc_id", "account_id", "accountId"]) ??
    "—"
  );
}

function getAttendanceAccountName(row, responseMeta, selectedAccount) {
  return (
    responseMeta?.scope?.accountName ??
    selectedAccount?.accountName ??
    row?.accountName ??
    row?.kronosAccountName ??
    findRowValue(row, ["account_name", "accountName", "gy_acc_name", "acc_name"]) ??
    "—"
  );
}

function getAttendanceLogin(row, responseMeta) {
  const configuredField = responseMeta?.fieldConfiguration?.firstLogin;
  return (
    getValueByPath(row, configuredField) ??
    findRowValue(row, [
      "login",
      "login_time",
      "login_at",
      "first_login",
      "first_login_at",
      "time_in",
      "timein",
      "clock_in",
      "clockin",
    ])
  );
}

function getAttendanceLogout(row, responseMeta) {
  const configuredField = responseMeta?.fieldConfiguration?.lastLogoff;
  return (
    getValueByPath(row, configuredField) ??
    findRowValue(row, [
      "logout",
      "logout_time",
      "logout_at",
      "logoff",
      "logoff_time",
      "last_logoff",
      "last_logoff_at",
      "time_out",
      "timeout",
      "clock_out",
      "clockout",
    ])
  );
}

function getErrorDetails(error, fallbackMessage) {
  const payload = error?.response?.data || {};
  return {
    code: payload?.code || "ATTENDANCE_REQUEST_FAILED",
    message: payload?.message || error?.message || fallbackMessage,
  };
}

function StatusPill({ active, activeText, inactiveText }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
        active
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-amber-200 bg-amber-50 text-amber-700"
      }`}
    >
      {active ? (
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
      ) : (
        <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
      )}
      {active ? activeText : inactiveText}
    </span>
  );
}

export default function AttendanceSheetPage() {
  const dashboard = useDashboardPage();
  const initialRange = useMemo(() => getInitialDateRange(), []);

  const [status, setStatus] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true);
  const [metadataError, setMetadataError] = useState(null);

  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => formatManilaDate());
  const [pageSize, setPageSize] = useState(25);

  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [accountSearchTerm, setAccountSearchTerm] = useState("");
  const accountDropdownRef = useRef(null);

  const [dataRows, setDataRows] = useState(() => {
    try {
      const cached = localStorage.getItem("sibs_attendance_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed?.rows) && parsed.rows.length > 0) {
          return parsed.rows;
        }
      }
    } catch {
      // ignore cache parsing error
    }
    return [];
  });
  const [responseMeta, setResponseMeta] = useState(() => {
    try {
      const cached = localStorage.getItem("sibs_attendance_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        return parsed?.meta || null;
      }
    } catch {
      // ignore
    }
    return null;
  });
  const [pagination, setPagination] = useState(() => {
    try {
      const cached = localStorage.getItem("sibs_attendance_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.pagination) return parsed.pagination;
      }
    } catch {
      // ignore
    }
    return {
      currentPage: 1,
      totalPages: 1,
      total: 0,
      limit: 25,
    };
  });
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataError, setDataError] = useState(null);
  const [hasLoadedData, setHasLoadedData] = useState(() => {
    try {
      const cached = localStorage.getItem("sibs_attendance_cache");
      return Boolean(cached);
    } catch {
      return false;
    }
  });

  const mappedAccounts = useMemo(
    () => accounts.filter((account) => Number(account?.kronosMapping?.kronosAccountId) > 0),
    [accounts],
  );

  const selectedAccount = useMemo(
    () => accounts.find((account) => String(account.accountId) === String(selectedAccountId)) || null,
    [accounts, selectedAccountId],
  );

  // Close account dropdown on outside click
  useEffect(() => {
    if (!isAccountDropdownOpen) return;
    const handleClickOutside = (event) => {
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target)) {
        setIsAccountDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isAccountDropdownOpen]);

  const filteredAccountOptions = useMemo(() => {
    if (!accountSearchTerm.trim()) return accounts;
    const term = accountSearchTerm.toLowerCase();
    return accounts.filter((acc) =>
      String(acc.accountName || "").toLowerCase().includes(term) ||
      String(acc.accountId || "").includes(term)
    );
  }, [accounts, accountSearchTerm]);

  const attendanceFieldsReady = Boolean(
    responseMeta?.fieldConfiguration?.complete || status?.attendanceFieldConfiguration?.complete,
  );

  const invalidateViewerData = () => {
    setDataRows([]);
    setResponseMeta(null);
    setDataError(null);
    setHasLoadedData(false);
    setPagination({
      currentPage: 1,
      totalPages: 1,
      total: 0,
      limit: pageSize,
    });
  };

  const loadMetadata = useCallback(async () => {
    setIsLoadingMetadata(true);
    setMetadataError(null);

    const [statusResult, accountsResult] = await Promise.allSettled([
      fetchAttendanceSheetStatus(),
      fetchAttendanceSheetAccounts(),
    ]);

    if (statusResult.status === "fulfilled" && statusResult.value?.success) {
      setStatus(statusResult.value.data || null);
    } else if (statusResult.status === "rejected") {
      setMetadataError(
        getErrorDetails(statusResult.reason, "Unable to load attendance API status."),
      );
    }

    if (accountsResult.status === "fulfilled" && accountsResult.value?.success) {
      const nextAccounts = Array.isArray(accountsResult.value.data)
        ? accountsResult.value.data
        : [];
      setAccounts(nextAccounts);

      setSelectedAccountId((current) => {
        if (
          current &&
          nextAccounts.some(
            (account) =>
              String(account.accountId) === String(current) &&
              Number(account?.kronosMapping?.kronosAccountId) > 0,
          )
        ) {
          return current;
        }

        const preferredUsVisa = nextAccounts.find(
          (account) =>
            /us\s*visa/i.test(String(account?.accountName || "")) &&
            Number(account?.kronosMapping?.kronosAccountId) > 0,
        );
        const firstMapped = nextAccounts.find(
          (account) => Number(account?.kronosMapping?.kronosAccountId) > 0,
        );
        return String(preferredUsVisa?.accountId || firstMapped?.accountId || "");
      });
    } else if (accountsResult.status === "rejected") {
      setMetadataError(
        getErrorDetails(accountsResult.reason, "Unable to load Call Center Operations accounts."),
      );
      setAccounts([]);
    }

    setIsLoadingMetadata(false);
  }, []);

  useEffect(() => {
    void loadMetadata();
  }, [loadMetadata]);

  const loadViewerData = useCallback(
    async (targetPage = 1) => {
      if (!selectedAccountId) {
        setDataError({
          code: "ATTENDANCE_ACCOUNT_REQUIRED",
          message: "Select a Call Center Operations account that was matched to the live attendance source.",
        });
        return;
      }

      if (!selectedAccount?.kronosMapping?.kronosAccountId) {
        setDataError({
          code: "ATTENDANCE_ACCOUNT_MAPPING_REQUIRED",
          message: "The selected account was not matched to a unique account in the live attendance source.",
        });
        return;
      }

      if (!selectedDate) {
        setDataError({
          code: "ATTENDANCE_DATE_REQUIRED",
          message: "Please select a date to view attendance records.",
        });
        return;
      }

      // Optimistically update pagination state instantly so the active button clicks immediately without lag
      setPagination((prev) => ({
        ...prev,
        currentPage: targetPage,
      }));

      setIsLoadingData(true);
      setDataError(null);

      const trimmedSearch = employeeSearch.trim();
      const normalizedCode = normalizeEmployeeCode(trimmedSearch);

      const params = {
        accountId: selectedAccountId,
        search: normalizedCode || undefined,
        gyEmpCode: /^\d+$/.test(normalizedCode) ? normalizedCode : undefined,
        dateFrom: selectedDate,
        dateTo: selectedDate,
        page: targetPage,
        limit: pageSize,
      };

      try {
        const response = await fetchAttendancePreview(params);
        const payload = response?.data || {};
        const rows = Array.isArray(payload?.data) ? payload.data : [];
        const nextPagination = payload?.pagination || {};

        setDataRows(rows);
        setResponseMeta(payload);
        const resolvedPagination = {
          currentPage: Number(nextPagination.currentPage || targetPage) || targetPage,
          totalPages: Math.max(1, Number(nextPagination.totalPages || 1) || 1),
          total:
            Number(nextPagination.total) >= 0
              ? Number(nextPagination.total)
              : rows.length,
          limit: Number(nextPagination.limit || pageSize) || pageSize,
        };
        setPagination(resolvedPagination);
        setHasLoadedData(true);

        if (rows.length > 0 && !trimmedSearch && targetPage === 1) {
          try {
            localStorage.setItem(
              "sibs_attendance_cache",
              JSON.stringify({
                rows,
                meta: payload,
                pagination: resolvedPagination,
              }),
            );
          } catch {
            // ignore localStorage quota error
          }
        }
      } catch (error) {
        const details = getErrorDetails(error, "Unable to load attendance data.");
        setDataError(details);
        setHasLoadedData(true);
      } finally {
        setIsLoadingData(false);
      }
    },
    [
      selectedDate,
      employeeSearch,
      pageSize,
      selectedAccount,
      selectedAccountId,
    ],
  );

  // Debounced/automatic loader: automatically fetch data when filters or pagination change
  useEffect(() => {
    if (!selectedAccountId || !selectedAccount?.kronosMapping?.kronosAccountId) {
      return;
    }

    const timer = setTimeout(() => {
      void loadViewerData(1);
    }, 250);

    return () => clearTimeout(timer);
  }, [
    selectedAccountId,
    selectedAccount,
    employeeSearch,
    selectedDate,
    pageSize,
    loadViewerData,
  ]);

  const handleReset = () => {
    const today = formatManilaDate();
    const preferredUsVisa = mappedAccounts.find((account) =>
      /us\s*visa/i.test(String(account?.accountName || "")),
    );
    setSelectedAccountId(
      String(preferredUsVisa?.accountId || mappedAccounts[0]?.accountId || ""),
    );
    setIsAccountDropdownOpen(false);
    setAccountSearchTerm("");
    setEmployeeSearch("");
    setSelectedDate(today);
    setPageSize(25);
  };

  const tableMinWidth = 760;

  return (
    <section className="font-jakarta flex h-screen max-h-[100dvh] min-h-screen overflow-hidden bg-[#eef3f7] text-sibs-primary-1">
      <AdminSidebar
        isMobileOpen={dashboard.isMobileSidebarOpen}
        modules={dashboard.modules}
        onMobileClose={() => dashboard.setIsMobileSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AppHeader
          title="Attendance Sheet"
          subtitle="Call Center Operations attendance data"
          userName={dashboard.userName}
          onMenuClick={() => dashboard.setIsMobileSidebarOpen(true)}
          onLogoutClick={() => dashboard.setShowLogoutModal(true)}
        />

        <main className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-hidden px-2.5 pb-2 pt-2.5 sm:gap-3 sm:px-4 sm:pt-3 lg:px-5">
          {metadataError && (
            <div className="shrink-0 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-700">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="m-0 font-bold">{metadataError.code}</p>
                  <p className="m-0 mt-0.5">{metadataError.message}</p>
                </div>
              </div>
            </div>
          )}

          {/* Search and filter toolbar matching WOW Report & Calls Report bar */}
          <div className="sibs-card relative z-40 overflow-visible shadow-xs shrink-0 p-2.5 sm:p-3 bg-white">
            <div className="flex flex-wrap items-end gap-2.5 sm:gap-3">
              {/* 1. Search Employee */}
              <div className="w-full sm:w-auto sm:flex-1 sm:min-w-[170px] sm:max-w-[220px]">
                <span className="mb-0.5 block text-[9.5px] font-extrabold uppercase text-sibs-tertiary-5">
                  Search Employee
                </span>
                <div className="relative flex h-8 items-center rounded-lg border border-sibs-tertiary-8 bg-white px-2.5 hover:border-sibs-primary-1 transition-colors focus-within:border-sibs-primary-1 focus-within:ring-1 focus-within:ring-sibs-primary-1/20">
                  <Search size={12} className="text-slate-400 shrink-0 mr-1.5" />
                  <input
                    type="text"
                    value={employeeSearch}
                    onChange={(event) => {
                      setEmployeeSearch(event.target.value);
                    }}
                    placeholder="Search by name or SIBS ID..."
                    className="w-full bg-transparent text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none"
                  />
                  {employeeSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setEmployeeSearch("");
                      }}
                      className="ml-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* 2. Department */}
              <div className="w-full sm:w-auto sm:flex-1 sm:min-w-[160px] sm:max-w-[210px]">
                <span className="mb-0.5 block text-[9.5px] font-extrabold uppercase text-sibs-tertiary-5">
                  Department
                </span>
                <div className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 text-xs font-semibold text-slate-700">
                  <ShieldCheck size={13} className="shrink-0 text-sibs-primary-1" />
                  <span className="truncate">Call Center Operations</span>
                </div>
              </div>

              {/* 3. Account Dropdown */}
              <div className="relative w-full sm:w-auto sm:flex-1 sm:min-w-[160px] sm:max-w-[210px]" ref={accountDropdownRef}>
                <span className="mb-0.5 block text-[9.5px] font-extrabold uppercase text-sibs-tertiary-5">
                  Account
                </span>
                <button
                  type="button"
                  disabled={isLoadingMetadata || accounts.length === 0}
                  onClick={() => setIsAccountDropdownOpen((prev) => !prev)}
                  className={`group flex h-8 w-full cursor-pointer items-center justify-between gap-1.5 rounded-lg border bg-white px-2.5 text-left text-xs font-semibold outline-none transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    isAccountDropdownOpen
                      ? "border-sibs-primary-1 ring-1 ring-sibs-primary-1/20"
                      : "border-sibs-tertiary-8 hover:border-sibs-primary-1 hover:bg-slate-50/50"
                  }`}
                >
                  <span
                    className={`truncate min-w-0 flex-1 ${
                      selectedAccount
                        ? "font-bold text-sibs-primary-1"
                        : "font-semibold text-slate-800"
                    }`}
                  >
                    {selectedAccount?.accountName || "Select account"}
                  </span>
                  <ChevronDown
                    size={13}
                    className={`shrink-0 text-slate-500 transition-transform duration-200 group-hover:text-sibs-primary-1 ${
                      isAccountDropdownOpen ? "rotate-180 text-sibs-primary-1" : ""
                    }`}
                  />
                </button>

                {isAccountDropdownOpen && (
                  <div className="absolute left-0 top-full z-50 mt-1 max-h-80 w-full min-w-[240px] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg shadow-slate-900/10">
                    <div className="border-b border-slate-100 p-1.5">
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input
                          type="text"
                          value={accountSearchTerm}
                          onChange={(e) => setAccountSearchTerm(e.target.value)}
                          placeholder="Search account..."
                          className="h-7 w-full rounded-md border border-slate-200 bg-slate-50 pl-6 pr-2 text-[11px] text-slate-800 focus:border-[#0b3b68] focus:bg-white focus:outline-none"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>

                    <div className="max-h-64 overflow-y-auto sibs-scrollbar">
                      {filteredAccountOptions.length > 0 ? (
                        filteredAccountOptions.map((account) => {
                          const isSelected = String(account.accountId) === String(selectedAccountId);
                          const isMapped = Number(account?.kronosMapping?.kronosAccountId) > 0;
                          return (
                            <button
                              key={account.accountId}
                              type="button"
                              disabled={!isMapped}
                              onClick={() => {
                                setSelectedAccountId(account.accountId);
                                setIsAccountDropdownOpen(false);
                                setAccountSearchTerm("");
                              }}
                              className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs transition ${
                                !isMapped
                                  ? "cursor-not-allowed opacity-40 text-slate-400"
                                  : isSelected
                                  ? "bg-sky-50 font-bold text-[#0b3b68] cursor-pointer"
                                  : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
                              }`}
                            >
                              <span className="truncate">
                                {account.accountName}
                                {!isMapped && " (Unmapped)"}
                              </span>
                              {isSelected && (
                                <Check className="h-3.5 w-3.5 text-[#0b3b68] shrink-0" />
                              )}
                            </button>
                          );
                        })
                      ) : (
                        <div className="px-3 py-3 text-center text-xs text-slate-400">
                          No accounts found
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Select Date */}
              <div className="w-full sm:w-auto sm:flex-1 sm:min-w-[150px] sm:max-w-[190px]">
                <DatePicker
                  label="Select Date"
                  value={selectedDate}
                  onChange={(val) => {
                    setSelectedDate(val || "");
                  }}
                />
              </div>

              {/* Status Indicator */}
              {isLoadingData && (
                <div className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-sky-50 text-[11px] font-semibold text-sibs-primary-1 border border-sky-100 animate-pulse ml-auto sm:ml-0">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#ff5c28]" />
                  <span>Updating...</span>
                </div>
              )}
            </div>
          </div>

          {dataError && (
            <div className="shrink-0 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-700">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="min-w-0">
                  <p className="m-0 font-bold">{dataError.code}</p>
                  <p className="m-0 mt-0.5">{dataError.message}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
            <div className="min-h-0 flex-1 overflow-auto sibs-scrollbar">
              <table
                className="w-full table-auto border-collapse text-left text-[12.5px]"
                style={{ minWidth: `${tableMinWidth}px` }}
              >
                <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-100/90 backdrop-blur-xs shadow-2xs">
                  <tr>
                    {["Employee ID", "Name", "Account Name", "Login", "Logout"].map((label) => (
                      <th
                        key={label}
                        className="whitespace-nowrap px-4 py-3 text-[11px] font-extrabold uppercase tracking-wider text-slate-700"
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {dataRows.length > 0 ? (
                    dataRows.map((row, rowIndex) => {
                      const employeeId = getAttendanceEmployeeId(row, responseMeta);
                      const employeeName = getAttendanceEmployeeName(row);
                      const accountName = getAttendanceAccountName(row, responseMeta, selectedAccount);
                      const login = getAttendanceLogin(row, responseMeta);
                      const logout = getAttendanceLogout(row, responseMeta);
                      const formattedLogin = formatDateTime(login);
                      const formattedLogout = formatDateTime(logout);

                      return (
                        <tr
                          key={row?.gy_tracker_id || row?.id || `${employeeId}-${rowIndex}`}
                          className={`transition-colors hover:bg-sky-50/60 ${
                            rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50/40"
                          } ${isLoadingData ? "opacity-60" : ""}`}
                        >
                          <td className="whitespace-nowrap px-4 py-3 font-bold text-slate-900">
                            {employeeId || "—"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-800">
                            {employeeName || "—"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <span className="inline-flex items-center rounded-md bg-sky-50 px-2 py-0.5 text-[11px] font-bold text-[#0b3b68] border border-sky-200/80 shadow-2xs">
                              {accountName || "—"}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 font-mono text-[12px] text-slate-700">
                            {formattedLogin === "—" ? (
                              <span className="text-slate-400 font-sans">—</span>
                            ) : (
                              formattedLogin
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 font-mono text-[12px] text-slate-700">
                            {formattedLogout === "—" ? (
                              <span className="text-slate-400 font-sans">—</span>
                            ) : (
                              formattedLogout
                            )}
                          </td>
                        </tr>
                      );
                    })
                    ) : isLoadingData ? (
                      Array.from({ length: 8 }).map((_, i) => (
                        <tr key={`skeleton-${i}`} className="animate-pulse">
                          <td className="px-3 py-2.5">
                            <div className="h-4 w-14 bg-slate-200 rounded-md" />
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="h-4 w-36 bg-slate-200 rounded-md" />
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="h-4 w-12 bg-slate-200 rounded-md" />
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="h-4 w-28 bg-slate-200 rounded-md" />
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="h-4 w-28 bg-slate-200 rounded-md" />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-20 text-center text-slate-400">
                          {hasLoadedData
                            ? "No attendance records found for the selected filters."
                            : "Select an account to view attendance records."}
                        </td>
                      </tr>
                    )}
                  </tbody>
              </table>
            </div>

            {hasLoadedData && !dataError && (
              <TablePagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                pageSize={pagination.limit}
                onPageChange={(page) => void loadViewerData(page)}
                itemLabel="records"
                disabled={false}
                className="shrink-0"
                extraLeft={
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                    <Clock3 className="h-3 w-3" />
                    Live fetch
                  </span>
                }
              />
            )}
          </div>
        </main>
      </div>

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
