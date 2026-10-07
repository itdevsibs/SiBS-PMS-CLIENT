import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Database,
  Filter,
  Loader2,
  RefreshCw,
  RotateCcw,
  Server,
  ShieldCheck,
  Users,
} from "lucide-react";

import AdminSidebar from "@/components/layout/AdminSidebar";
import AppHeader from "@/components/layout/AppHeader";
import TablePagination from "@/components/tables/TablePagination";
import ConfirmationModal from "@/components/ui/confirmation-modal";
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
  if (!raw) return "—";

  const sqlMatch = raw.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})(?::(\d{2}))?/);
  if (sqlMatch) {
    return `${sqlMatch[1]} ${sqlMatch[2]}:${sqlMatch[3] || "00"}`;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;

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
  const [employeeCode, setEmployeeCode] = useState("");
  const [dateFrom, setDateFrom] = useState(initialRange.dateFrom);
  const [dateTo, setDateTo] = useState(initialRange.dateTo);
  const [pageSize, setPageSize] = useState(25);

  const [dataRows, setDataRows] = useState([]);
  const [responseMeta, setResponseMeta] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 25,
  });
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataError, setDataError] = useState(null);
  const [hasLoadedData, setHasLoadedData] = useState(false);

  const mappedAccounts = useMemo(
    () => accounts.filter((account) => Number(account?.kronosMapping?.kronosAccountId) > 0),
    [accounts],
  );

  const selectedAccount = useMemo(
    () => accounts.find((account) => String(account.accountId) === String(selectedAccountId)) || null,
    [accounts, selectedAccountId],
  );

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

      if (dateFrom && dateTo && dateFrom > dateTo) {
        setDataError({
          code: "ATTENDANCE_DATE_RANGE_INVALID",
          message: "Date From cannot be later than Date To.",
        });
        return;
      }

      setIsLoadingData(true);
      setDataError(null);

      const params = {
        accountId: selectedAccountId,
        gyEmpCode: normalizeEmployeeCode(employeeCode) || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
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
        setPagination({
          currentPage: Number(nextPagination.currentPage || targetPage) || targetPage,
          totalPages: Math.max(1, Number(nextPagination.totalPages || 1) || 1),
          total:
            Number(nextPagination.total) >= 0
              ? Number(nextPagination.total)
              : rows.length,
          limit: Number(nextPagination.limit || pageSize) || pageSize,
        });
        setHasLoadedData(true);
      } catch (error) {
        const details = getErrorDetails(error, "Unable to load attendance data.");
        setDataError(details);
        setDataRows([]);
        setResponseMeta(null);
        setPagination({
          currentPage: targetPage,
          totalPages: 1,
          total: 0,
          limit: pageSize,
        });
        setHasLoadedData(true);
      } finally {
        setIsLoadingData(false);
      }
    },
    [
      dateFrom,
      dateTo,
      employeeCode,
      pageSize,
      selectedAccount,
      selectedAccountId,
    ],
  );

  const handleReset = () => {
    const range = getInitialDateRange();
    const preferredUsVisa = mappedAccounts.find((account) =>
      /us\s*visa/i.test(String(account?.accountName || "")),
    );
    setSelectedAccountId(
      String(preferredUsVisa?.accountId || mappedAccounts[0]?.accountId || ""),
    );
    setEmployeeCode("");
    setDateFrom(range.dateFrom);
    setDateTo(range.dateTo);
    setPageSize(25);
    setDataRows([]);
    setResponseMeta(null);
    setPagination({ currentPage: 1, totalPages: 1, total: 0, limit: 25 });
    setDataError(null);
    setHasLoadedData(false);
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
          subtitle="Live Call Center Operations attendance data through the secured PMS server"
          userName={dashboard.userName}
          onMenuClick={() => dashboard.setIsMobileSidebarOpen(true)}
          onLogoutClick={() => dashboard.setShowLogoutModal(true)}
        />

        <main className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-hidden px-2.5 pb-2 pt-2.5 sm:gap-3 sm:px-4 sm:pt-3 lg:px-5">
          <div className="shrink-0 rounded-xl border border-slate-200 bg-white shadow-xs">
            <div className="flex flex-col gap-3 border-b border-slate-100 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-[#ff5c28]" aria-hidden="true" />
                  <h1 className="m-0 text-sm font-extrabold text-[#0b3b68]">
                    Live Attendance Connection
                  </h1>
                </div>
                <p className="m-0 mt-1 text-[11px] leading-4 text-slate-500">
                  No attendance data is stored locally. Every request is fetched live from the attendance source.
                </p>
              </div>

              <button
                type="button"
                onClick={() => void loadMetadata()}
                disabled={isLoadingMetadata}
                className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${isLoadingMetadata ? "animate-spin" : ""}`}
                />
                Refresh Status
              </button>
            </div>

            <div className="grid grid-cols-2 gap-px bg-slate-100 sm:grid-cols-4">
              <div className="bg-white px-3 py-2.5 sm:px-4">
                <p className="m-0 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  API Connection
                </p>
                <div className="mt-1.5">
                  <StatusPill
                    active={Boolean(status?.credentialsConfigured && status?.tokenUsable)}
                    activeText="Connected"
                    inactiveText={status?.credentialsConfigured ? "Token Pending" : "Not Configured"}
                  />
                </div>
              </div>

              <div className="bg-white px-3 py-2.5 sm:px-4">
                <p className="m-0 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  CCO Accounts Resolved
                </p>
                <div className="mt-1 flex items-end gap-1.5">
                  <span className="text-lg font-extrabold leading-none text-[#0b3b68]">
                    {mappedAccounts.length}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">
                    of {accounts.length} live matched
                  </span>
                </div>
              </div>

              <div className="bg-white px-3 py-2.5 sm:px-4">
                <p className="m-0 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Attendance Fields
                </p>
                <div className="mt-1.5">
                  <StatusPill
                    active={attendanceFieldsReady}
                    activeText="Confirmed"
                    inactiveText="Pending Mapping"
                  />
                </div>
              </div>

              <div className="bg-white px-3 py-2.5 sm:px-4">
                <p className="m-0 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Storage Mode
                </p>
                <div className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-extrabold text-[#0b3b68]">
                  <Database className="h-3.5 w-3.5 text-[#ff5c28]" />
                  Live Fetch Only
                </div>
              </div>
            </div>
          </div>

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

          <div className="shrink-0 rounded-xl border border-slate-200 bg-white p-3 shadow-xs sm:p-4">
            <div className="mb-3 flex items-center gap-2">
              <Filter className="h-4 w-4 text-[#0b3b68]" />
              <div>
                <p className="m-0 text-xs font-extrabold text-[#0b3b68]">Viewer Filters</p>
                <p className="m-0 text-[10px] text-slate-400">
                  Department is locked to Call Center Operations. Select an account to load attendance data.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-5">
              <label className="block xl:col-span-1">
                <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Department
                </span>
                <div className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-slate-100 px-3 text-xs font-semibold text-slate-600">
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#0b3b68]" />
                  <span className="truncate">Call Center Operations</span>
                </div>
              </label>

              <label className="block xl:col-span-1">
                <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Account
                </span>
                <div className="relative">
                  <select
                    value={selectedAccountId}
                    onChange={(event) => {
                      setSelectedAccountId(event.target.value);
                      invalidateViewerData();
                    }}
                    disabled={isLoadingMetadata || accounts.length === 0}
                    className="h-9 w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 px-3 pr-8 text-xs font-semibold text-slate-700 outline-none transition focus:border-[#0b3b68] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="">Select account</option>
                    {accounts.map((account) => {
                      const mapped = Number(account?.kronosMapping?.kronosAccountId) > 0;
                      return (
                        <option
                          key={account.accountId}
                          value={account.accountId}
                          disabled={!mapped}
                        >
                          {account.accountName}{mapped ? "" : " — not found in attendance source"}
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                </div>
              </label>

              <label className="block xl:col-span-1">
                <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  SIBS ID
                </span>
                <div className="relative">
                  <Users className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={employeeCode}
                    onChange={(event) => {
                      setEmployeeCode(event.target.value);
                      invalidateViewerData();
                    }}
                    placeholder="Optional"
                    className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0b3b68] focus:bg-white"
                  />
                </div>
              </label>

              <label className="block xl:col-span-1">
                <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Date From
                </span>
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(event) => {
                      setDateFrom(event.target.value);
                      invalidateViewerData();
                    }}
                    className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-2 text-xs font-medium text-slate-700 outline-none transition focus:border-[#0b3b68] focus:bg-white"
                  />
                </div>
              </label>

              <label className="block xl:col-span-1">
                <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Date To
                </span>
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(event) => {
                      setDateTo(event.target.value);
                      invalidateViewerData();
                    }}
                    className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-2 text-xs font-medium text-slate-700 outline-none transition focus:border-[#0b3b68] focus:bg-white"
                  />
                </div>
              </label>
            </div>

            <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="m-0 text-[11px] font-bold text-slate-600">Employee Attendance</p>
                <p className="m-0 mt-0.5 truncate text-[10px] text-slate-400">
                  Live attendance records for the selected Call Center Operations account.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <label className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-[11px] font-semibold text-slate-500">
                  Rows
                  <select
                    value={pageSize}
                    onChange={(event) => {
                      setPageSize(Number(event.target.value));
                      setDataRows([]);
                                                          setResponseMeta(null);
                      setDataError(null);
                      setHasLoadedData(false);
                      setPagination({
                        currentPage: 1,
                        totalPages: 1,
                        total: 0,
                        limit: Number(event.target.value),
                      });
                    }}
                    className="bg-transparent text-[11px] font-bold text-slate-700 outline-none cursor-pointer"
                  >
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </label>

                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset
                </button>

                <button
                  type="button"
                  onClick={() => void loadViewerData(1)}
                  disabled={isLoadingData || !selectedAccountId}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#0b3b68] bg-[#0b3b68] px-4 text-xs font-bold text-white transition hover:bg-[#164f7b] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                >
                  {isLoadingData ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  Load Data
                </button>
              </div>
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
            <div className="flex shrink-0 flex-col gap-2 border-b border-slate-200 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="m-0 text-xs font-extrabold text-[#0b3b68]">
                    Employee Attendance
                  </p>
                  {selectedAccount && (
                    <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[9.5px] font-bold text-blue-700">
                      {selectedAccount.accountName}
                    </span>
                  )}
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[9.5px] font-bold uppercase text-slate-500">
                    Live API
                  </span>
                </div>
                <p className="m-0 mt-0.5 truncate text-[10px] text-slate-400">
                  Showing only employee ID, name, account ID, login, and logout for the selected account.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold text-slate-500 shrink-0">
                {responseMeta?.scope?.kronosMapping?.kronosAccountId && (
                  <span className="rounded-lg bg-slate-100 px-2 py-1 text-slate-600">
                    Source Account #{responseMeta.scope.kronosMapping.kronosAccountId}
                  </span>
                )}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto sibs-scrollbar">
              <table
                className="w-full table-auto border-collapse text-left text-xs"
                style={{ minWidth: `${tableMinWidth}px` }}
              >
                <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 shadow-xs">
                    <tr>
                      {["Employee ID", "Name", "Account ID", "Login", "Logout"].map((label) => (
                        <th
                          key={label}
                          className="whitespace-nowrap px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-600"
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {isLoadingData ? (
                      <tr>
                        <td colSpan={5} className="py-20 text-center text-slate-400">
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-[#ff5c28]" />
                            Fetching live attendance data…
                          </div>
                        </td>
                      </tr>
                    ) : dataRows.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-20 text-center text-slate-400">
                          {hasLoadedData
                            ? "No attendance records found for the selected filters."
                            : "Select an account and click Load Data to view attendance records."}
                        </td>
                      </tr>
                    ) : (
                      dataRows.map((row, rowIndex) => {
                        const employeeId = getAttendanceEmployeeId(row, responseMeta);
                        const employeeName = getAttendanceEmployeeName(row);
                        const accountId = getAttendanceAccountId(row, responseMeta, selectedAccount);
                        const login = getAttendanceLogin(row, responseMeta);
                        const logout = getAttendanceLogout(row, responseMeta);

                        return (
                          <tr
                            key={row?.gy_tracker_id || row?.id || `${employeeId}-${rowIndex}`}
                            className="hover:bg-slate-50/70"
                          >
                            <td className="whitespace-nowrap px-3 py-2 font-bold text-slate-900">
                              {employeeId || "—"}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 font-semibold text-slate-700">
                              {employeeName || "—"}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 font-semibold text-[#0b3b68]">
                              {accountId || "—"}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2">
                              {formatDateTime(login)}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2">
                              {formatDateTime(logout)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
              </table>
            </div>

            {!isLoadingData && hasLoadedData && !dataError && (
              <TablePagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                pageSize={pagination.limit}
                onPageChange={(page) => void loadViewerData(page)}
                itemLabel="records"
                disabled={isLoadingData}
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
