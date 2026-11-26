import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Clock3,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import AdminSidebar from "@/components/common/layout/AdminSidebar";
import AppHeader from "@/components/common/layout/AppHeader";
import TablePagination from "@/components/common/tables/TablePagination";
import ConfirmationModal from "@/components/common/ui/ConfirmationModal";
import DatePicker from "@/components/common/filters/DatePicker";
import SingleSelectDropdown from "@/components/common/filters/SingleSelectDropdown";
import LoadingModal from "@/components/common/ui/LoadingModal";
import useDashboardPage from "@/hooks/useDashboardPage";
import {
  fetchAttendanceSheet,
  fetchAttendanceSheetAccounts,
} from "@/lib/axios/attendance-sheet";
import { getAttendanceEmployeeName } from "./attendanceSheetEmployeeName.js";
import AttendanceSummaryCards from "./AttendanceSummaryCards.jsx";

const ROLE_OPTIONS = [
  { value: "all", label: "All Roles" },
  { value: "AGENT", label: "Agent" },
  { value: "TEAM_LEADER", label: "Team Leader" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "plannedLeave", label: "Planned Leave" },
  { value: "unplannedLeave", label: "Unplanned Leave" },
  { value: "leaveUnavailable", label: "Leave Verification Unavailable" },
];

const CARD_FILTER_LABELS = {
  scheduled: "Scheduled to Work",
  restDay: "Rest Day",
  noSchedule: "No Schedule",
  pending: "Pending",
  scheduleUnavailable: "Schedule Unavailable",
  incomplete: "Missing In",
};

function resolveUsVisaAccount(accounts) {
  // Match the same account-name rule used by the server's strict roster path.
  const matches = accounts.filter((account) => /^US[\s_-]*VISA$/i.test(String(account?.accountName || "").trim()));
  if (matches.length !== 1) return null;
  const account = matches[0];
  const accountId = Number(account?.accountId);
  const kronosAccountId = Number(account?.kronosMapping?.kronosAccountId);
  return Number.isInteger(accountId) && accountId > 0 && Number.isInteger(kronosAccountId) && kronosAccountId > 0
    ? account : null;
}

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

function normalizeEmployeeCode(value) {
  return String(value || "")
    .trim()
    .replace(/^SIB-\s*/i, "")
    .trim();
}

function formatDateTime(value) {
  if (!value) return "—";
  const raw = String(value).trim();
  if (
    !raw ||
    raw === "—" ||
    raw.startsWith("0000-00-00") ||
    raw.startsWith("1970-01-01 00:00:00")
  ) {
    return "—";
  }

  if (raw === "Rest Day") return "Rest Day";

  // Match pure time like "14:00:00" or "14:00"
  const timeOnlyMatch = raw.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (timeOnlyMatch) {
    const hours = Number(timeOnlyMatch[1]);
    const minutes = timeOnlyMatch[2];
    const ampm = hours >= 12 ? "PM" : "AM";
    const formattedHour = hours % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  }

  const sqlMatch = raw.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})(?::(\d{2}))?/);
  if (sqlMatch) {
    if (sqlMatch[1] === "0000-00-00") return "—";
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

function getAttendanceScheduleIn(row, responseMeta) {
  const configuredField = responseMeta?.fieldConfiguration?.scheduleIn;
  return (
    row?.scheduleIn ??
    getValueByPath(row, configuredField) ??
    findRowValue(row, [
      "gy_sched_login",
      "sched_login",
      "schedule_in",
      "schedule_login",
      "sched_in",
      "shift_start",
    ])
  );
}

function getAttendanceScheduleOut(row, responseMeta) {
  const configuredField = responseMeta?.fieldConfiguration?.scheduleOut;
  return (
    row?.scheduleOut ??
    getValueByPath(row, configuredField) ??
    findRowValue(row, [
      "gy_sched_logout",
      "sched_logout",
      "schedule_out",
      "schedule_logoff",
      "sched_out",
      "shift_end",
    ])
  );
}

function getAttendanceOtHours(row, responseMeta) {
  const configuredField = responseMeta?.fieldConfiguration?.otHours;
  const val =
    getValueByPath(row, configuredField) ??
    row?.otHours ??
    findRowValue(row, [
      "gy_tracker_ot",
      "tracker_ot",
      "ot_hours",
      "ot_hrs",
      "overtime",
      "ot",
    ]);
  return val != null ? Number(val) : null;
}

function getAttendanceTotalHours(row, responseMeta) {
  const configuredField = responseMeta?.fieldConfiguration?.totalHours;
  const val =
    getValueByPath(row, configuredField) ??
    row?.totalHours ??
    findRowValue(row, [
      "gy_tracker_wh",
      "tracker_wh",
      "gy_tracker_ath",
      "tracker_ath",
      "total_hours",
      "work_hours",
      "work_hrs",
      "wh",
    ]);
  return val != null ? Number(val) : null;
}

function getAttendanceStatus(row, responseMeta) {
  // The sheet API is authoritative, including an intentionally blank pending status.
  if (row?.attendanceState) return row.status ?? null;
  const configuredField = responseMeta?.fieldConfiguration?.status;
  const login = getAttendanceLogin(row, responseMeta);
  const logout = getAttendanceLogout(row, responseMeta);

  const rawVal =
    getValueByPath(row, configuredField) ??
    row?.status ??
    row?.shiftStatus ??
    findRowValue(row, [
      "gy_tracker_status",
      "tracker_status",
      "attendance_status",
      "shift_status",
      "status",
      "gy_sched_mode",
    ]);

  // If no login was recorded at all for this employee record
  if (!login && !logout) {
    if (rawVal === 0 || rawVal === "0" || String(rawVal).toLowerCase().includes("rest")) {
      return "Rest Day";
    }
    return "Absent";
  }

  if (rawVal === "MISSING_BOTH_BOUNDARIES" || rawVal === "ABSENT" || String(rawVal).toLowerCase() === "absent") {
    return "Absent";
  }
  if (rawVal === 0 || rawVal === "0") return "Rest Day";
  if (rawVal === 1 || rawVal === "1") return "Present";
  if (rawVal === "COMPLETE") return "Present";
  if (rawVal === "MISSING_LAST_LOGOFF") return "On Shift / Active";
  if (rawVal === "MISSING_FIRST_LOGIN") return "Missing In";

  return rawVal || (login ? "Present" : "Absent");
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
  const [selectedAccount, setSelectedAccount] = useState(null);
  const selectedAccountId = selectedAccount ? String(selectedAccount.accountId) : "";
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true);
  const [metadataError, setMetadataError] = useState(null);

  const [employeeSearch, setEmployeeSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => formatManilaDate());
  const pageSize = 25;
  const [roleFilter, setRoleFilter] = useState("all");
  const [attendanceStatusFilter, setAttendanceStatusFilter] = useState("all");

  const [dataRows, setDataRows] = useState([]);
  // Do not retain employee data in localStorage. Ignore stale responses when the
  // user changes dates/searches or pages while a prior fetch is still pending.
  const attendanceRequestId = useRef(0);
  const prefetchAbort = useRef(null);
  const foregroundAbort = useRef(null);
  const [prefetchError, setPrefetchError] = useState(null);

  useEffect(() => {
    // Remove obsolete localStorage rows saved by the previous implementation.
    try { localStorage.removeItem("sibs_attendance_cache"); } catch { /* unavailable */ }
  }, []);
  const [responseMeta, setResponseMeta] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 25,
  });
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataError, setDataError] = useState(null);
  const [hasLoadedData, setHasLoadedData] = useState(false);

  const loadMetadata = useCallback(async () => {
    prefetchAbort.current?.abort();
    foregroundAbort.current?.abort();
    setPrefetchError(null);
    setIsLoadingMetadata(true);
    setMetadataError(null);
    setSelectedAccount(null);
    setDataRows([]);
    setResponseMeta(null);
    setDataError(null);
    setHasLoadedData(false);
    setPagination({ currentPage: 1, totalPages: 1, total: 0, limit: 25 });
    attendanceRequestId.current += 1;
    setIsLoadingData(true);
    try {
      const response = await fetchAttendanceSheetAccounts();
      const accounts = response?.success && Array.isArray(response.data) ? response.data : [];
      const account = resolveUsVisaAccount(accounts);
      if (!account) {
        setMetadataError({
          code: "ATTENDANCE_US_VISA_ACCOUNT_REQUIRED",
          message: "US Visa could not be uniquely resolved to a mapped Kronos account. No other account will be used. Click Refresh to retry.",
        });
        setIsLoadingData(false);
        return;
      }
      setSelectedAccount(account);
    } catch (error) {
      setMetadataError(getErrorDetails(error, "Unable to resolve the US Visa account."));
      setIsLoadingData(false);
    } finally {
      setIsLoadingMetadata(false);
    }
  }, []);

  useEffect(() => {
    void loadMetadata();
  }, [loadMetadata]);

  const loadViewerData = useCallback(
    async (targetPage = 1, { forceRefresh = false } = {}) => {
      if (!selectedAccountId) {
        setDataError({
          code: "ATTENDANCE_ACCOUNT_REQUIRED",
          message: "US Visa must be resolved to the live attendance source.",
        });
        return;
      }

      if (!selectedAccount?.kronosMapping?.kronosAccountId) {
        setDataError({
          code: "ATTENDANCE_ACCOUNT_MAPPING_REQUIRED",
          message: "US Visa was not matched to a unique account in the live attendance source.",
        });
        return;
      }

      if (!selectedDate) {
        setDataError({
          code: "ATTENDANCE_DATE_REQUIRED",
          message: "Please select a date to view attendance records.",
        });
        setDataRows([]);
        setResponseMeta(null);
        setIsLoadingData(false);
        return;
      }

      // Optimistically update pagination state instantly so the active button clicks immediately without lag
      setPagination((prev) => ({
        ...prev,
        currentPage: targetPage,
      }));

      foregroundAbort.current?.abort();
      const controller = new AbortController();
      foregroundAbort.current = controller;
      if (forceRefresh) {
        prefetchAbort.current?.abort();
        setResponseMeta(null);
        setPrefetchError(null);
      }
      const requestId = ++attendanceRequestId.current;
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
        attendanceStatus: attendanceStatusFilter,
        role: roleFilter,
        progressive: true,
        ...(forceRefresh ? { forceRefresh: true } : {}),
      };

      try {
        const response = await fetchAttendanceSheet(params, { signal: controller.signal });
        if (requestId !== attendanceRequestId.current) return;
        const payload = response?.data || {};
        if (String(payload?.scope?.accountId ?? "") !== selectedAccountId ||
            !/^US[\s_-]*VISA$/i.test(String(payload?.scope?.accountName || "").trim())) {
          throw new Error("Attendance response does not match the resolved US Visa account.");
        }
        if (payload?.roleFilter !== roleFilter || payload?.attendanceDate !== selectedDate) {
          throw new Error("Attendance response does not match the selected role or date.");
        }
        const rows = Array.isArray(payload?.data) ? payload.data : [];
        const nextPagination = payload?.pagination || {};

        setDataRows(rows);
        setResponseMeta(previous => {
          if (previous?.roleFilter === roleFilter && previous?.progressive?.sessionId === payload?.progressive?.sessionId && previous?.progressive?.loadedEmployees > payload?.progressive?.loadedEmployees) {
            return { ...payload, summary: previous.summary, progressive: previous.progressive, performance: previous.performance };
          }
          return payload;
        });
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

      } catch (error) {
        if (requestId !== attendanceRequestId.current) return;
        const details = getErrorDetails(error, "Unable to load attendance data.");
        setDataError(details);
        setDataRows([]);
        setResponseMeta(null);
        setHasLoadedData(true);
      } finally {
        if (requestId === attendanceRequestId.current) setIsLoadingData(false);
      }
    },
    [
      selectedDate,
      employeeSearch,
      attendanceStatusFilter,
      roleFilter,
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

    // Invalidate in-flight results as soon as any filter changes, not only
    // after the debounced request starts.
    attendanceRequestId.current += 1;
    foregroundAbort.current?.abort();
    setIsLoadingData(true);
    const timer = setTimeout(() => {
      void loadViewerData(1);
    }, 250);

    return () => {
      clearTimeout(timer);
      foregroundAbort.current?.abort();
      attendanceRequestId.current += 1;
    };
  }, [
    selectedAccountId,
    selectedAccount,
    employeeSearch,
    selectedDate,
    pageSize,
    loadViewerData,
  ]);

  // Load one additional batch at a time. The server prioritizes interactive
  // requests over queued prefetch calls. Abort the loop on date/session change.
  const progressiveSession = responseMeta?.roleFilter === roleFilter && responseMeta?.attendanceDate === selectedDate &&
    String(responseMeta?.scope?.accountId) === selectedAccountId
    ? responseMeta?.progressive?.sessionId : null;
  const progressiveComplete = responseMeta?.progressive?.complete === true;
  useEffect(() => {
    if (!progressiveSession || progressiveComplete) return;
    const controller = new AbortController();
    prefetchAbort.current = controller;
    setPrefetchError(null);
    const run = async () => {
      try {
        while (!controller.signal.aborted) {
          const response = await fetchAttendanceSheet({ accountId: selectedAccountId,
            dateFrom: selectedDate, dateTo: selectedDate, progressive: true,
            prefetch: true, role: roleFilter, sessionId: progressiveSession }, { signal: controller.signal });
          if (controller.signal.aborted) return;
          const payload = response?.data;
          if (payload?.roleFilter !== roleFilter || payload?.progressive?.sessionId !== progressiveSession || payload?.attendanceDate !== selectedDate ||
              String(payload?.scope?.accountId) !== selectedAccountId) throw new Error("Attendance loading session changed.");
          setResponseMeta(previous => previous?.roleFilter === roleFilter && previous?.progressive?.sessionId === progressiveSession &&
            previous.progressive.loadedEmployees <= payload.progressive.loadedEmployees
            ? { ...previous, summary: payload.summary, progressive: payload.progressive, performance: payload.performance }
            : previous);
          if (payload.progressive.complete) return;
        }
      } catch (error) {
        if (!controller.signal.aborted) setPrefetchError("Remaining attendance data could not be loaded. Refresh to retry.");
      }
    };
    void run();
    return () => controller.abort();
  }, [progressiveSession, progressiveComplete, selectedAccountId, selectedDate, roleFilter]);

  const tableMinWidth = 1100;

  return (
    <section className="font-jakarta flex h-screen max-h-[100dvh] min-h-screen overflow-hidden bg-[#eef3f7] text-sibs-primary-1">
      <AdminSidebar
        isMobileOpen={dashboard.isMobileSidebarOpen}
        modules={dashboard.modules}
        onMobileClose={() => dashboard.setIsMobileSidebarOpen(false)}
        onLogoutClick={() => dashboard.setShowLogoutModal(true)}
        userName={dashboard.userName}
        userRole={dashboard.authUser?.email || dashboard.authUser?.roleLabel || "User"}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AppHeader
          title="Attendance Sheet"
          subtitle="US Visa Operations attendance data"
          userName={dashboard.userName}
          onMenuClick={() => dashboard.setIsMobileSidebarOpen(true)}
          onLogoutClick={() => dashboard.setShowLogoutModal(true)}
        />

        <main className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-2.5 pb-2 pt-2.5 lg:overflow-hidden sm:gap-3 sm:px-4 sm:pt-3 lg:px-5">
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

          <AttendanceSummaryCards
            summary={!dataError && responseMeta?.roleFilter === roleFilter && String(responseMeta?.scope?.accountId) === String(selectedAccountId) && responseMeta?.attendanceDate === selectedDate ? responseMeta?.summary : null}
            activeFilter={attendanceStatusFilter}
            onFilterChange={setAttendanceStatusFilter}
            loading={isLoadingData || Boolean(progressiveSession && !progressiveComplete && !prefetchError)}
            progressive={Boolean(progressiveSession && !progressiveComplete && !prefetchError)}
          />

          {prefetchError && progressiveSession && !progressiveComplete && (
            <div role="status" className="shrink-0 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">{prefetchError}</div>
          )}

          {!dataError && responseMeta?.roleFilter === roleFilter && responseMeta?.attendanceDate === selectedDate && responseMeta?.performance?.incomplete && (
            <div role="status" className="flex shrink-0 items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Incomplete Kronos data: {responseMeta.performance.roleAttendanceFailures ?? responseMeta.performance.attendanceFailures ?? 0} attendance and {responseMeta.performance.roleScheduleFailures ?? responseMeta.performance.scheduleFailures ?? 0} schedule lookups unavailable; {responseMeta.performance.roleLeaveFailures ?? responseMeta.performance.leaveFailures ?? 0} leave verifications unavailable. Refresh to retry. Unverified records are not counted as absent.</span>
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

              {/* 2. Select Date */}
              <div className="w-full sm:w-auto sm:flex-1 sm:min-w-[150px] sm:max-w-[190px]">
                <DatePicker
                  label="Select Date"
                  value={selectedDate}
                  onChange={(val) => {
                    setSelectedDate(val || "");
                    setAttendanceStatusFilter("all");
                  }}
                />
              </div>

              <SingleSelectDropdown
                label="Role"
                value={roleFilter}
                options={ROLE_OPTIONS}
                onChange={(event) => {
                  attendanceRequestId.current += 1;
                  foregroundAbort.current?.abort();
                  prefetchAbort.current?.abort();
                  setPrefetchError(null);
                  setIsLoadingData(true);
                  setRoleFilter(event.target.value);
                  setPagination(prev => ({ ...prev, currentPage: 1 }));
                }}
                className="w-full sm:w-auto sm:flex-1 sm:min-w-[130px] sm:max-w-[190px]"
              />

              {/* 3. Status: summary-only filters remain selectable via cards. */}
              <SingleSelectDropdown
                label="Status"
                value={attendanceStatusFilter}
                options={STATUS_OPTIONS}
                placeholder={CARD_FILTER_LABELS[attendanceStatusFilter] || "All Status"}
                onChange={(event) => setAttendanceStatusFilter(event.target.value)}
                className="w-full sm:w-auto sm:flex-1 sm:min-w-[150px] sm:max-w-[190px]"
              />

              {/* 4. Actions: Latest & Refresh */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto sm:flex-1 sm:min-w-[190px] sm:max-w-[230px] justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setEmployeeSearch("");
                    setSelectedDate(formatManilaDate());
                    setAttendanceStatusFilter("all");
                  }}
                  disabled={isLoadingData}
                  title="Use the latest date and clear search."
                  className="inline-flex h-8 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-sibs-primary-1 shadow-2xs transition hover:border-sibs-primary-1 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Clock size={12} className="shrink-0" />
                  <span>Latest</span>
                </button>

                <button
                  type="button"
                  onClick={() => selectedAccountId ? loadViewerData(1, { forceRefresh: true }) : loadMetadata()}
                  disabled={isLoadingMetadata || (isLoadingData && Boolean(selectedAccountId))}
                  title="Refresh attendance records"
                  className="inline-flex h-8 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[#042c51] bg-[#042c51] px-2.5 text-xs font-bold text-white shadow-2xs transition hover:bg-[#063d70] hover:border-[#063d70] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCw
                    size={12}
                    className={`shrink-0 ${isLoadingData ? "animate-spin text-white" : ""}`}
                  />
                  <span>Refresh</span>
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

          <div className="flex min-h-[240px] lg:min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
            <div className="min-h-0 flex-1 overflow-auto sibs-scrollbar">
              <table
                className="w-full table-auto border-collapse text-left text-[12.5px]"
                style={{ minWidth: `${tableMinWidth}px` }}
              >
                <thead className="sticky top-0 z-10 border-b border-[#0d3b66] bg-[#042c51] text-white shadow-2xs">
                  <tr>
                    {[
                      "Employee ID",
                      "Name",
                      "Role",
                      "Schedule In",
                      "Schedule Out",
                      "Login",
                      "Logout",
                      "OT Hours",
                      "Total Hours",
                      "Status",
                    ].map((label) => (
                      <th
                        key={label}
                        className="whitespace-nowrap px-4 py-3 text-[11px] font-extrabold uppercase tracking-wider text-white"
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {isLoadingData ? (
                    Array.from({ length: 10 }).map((_, i) => (
                      <tr key={`skeleton-${i}`} className="animate-pulse">
                        <td className="px-4 py-3">
                          <div className="h-4 w-16 bg-slate-200 rounded-md" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-4 w-36 bg-slate-200 rounded-md" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-5 w-24 bg-slate-200 rounded-md" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-4 w-28 bg-slate-200 rounded-md" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-4 w-28 bg-slate-200 rounded-md" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-4 w-24 bg-slate-200 rounded-md" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-4 w-24 bg-slate-200 rounded-md" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-4 w-16 bg-slate-200 rounded-md" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-4 w-16 bg-slate-200 rounded-md" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-5 w-20 bg-slate-200 rounded-full" />
                        </td>
                      </tr>
                    ))
                  ) : dataRows.length > 0 ? (
                    dataRows.map((row, rowIndex) => {
                      const employeeId = getAttendanceEmployeeId(row, responseMeta);
                      const accountName = getAttendanceAccountName(row, responseMeta, selectedAccount);
                      const employeeName = getAttendanceEmployeeName(row, accountName);
                      const login = getAttendanceLogin(row, responseMeta);
                      const logout = getAttendanceLogout(row, responseMeta);
                      const formattedLogin = formatDateTime(login);
                      const formattedLogout = formatDateTime(logout);

                      const scheduleIn = getAttendanceScheduleIn(row, responseMeta);
                      const scheduleOut = getAttendanceScheduleOut(row, responseMeta);
                      const otHours = getAttendanceOtHours(row, responseMeta);
                      const totalHours = getAttendanceTotalHours(row, responseMeta);
                      const attendanceStatus = getAttendanceStatus(row, responseMeta);

                      return (
                        <tr
                          key={row?.gy_tracker_id || row?.id || `${employeeId}-${rowIndex}`}
                          className={`transition-colors hover:bg-sky-50/60 ${
                            rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50/40"
                          }`}
                        >
                          <td className="whitespace-nowrap px-4 py-3 font-bold text-slate-900">
                            {employeeId || "—"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-800">
                            {employeeName || "—"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            {row?.employeeRole === "TEAM_LEADER" ? (
                              <span className="inline-flex items-center rounded-md border border-violet-200 bg-violet-50 px-2 py-0.5 text-[11px] font-bold text-violet-700 shadow-2xs">Team Leader</span>
                            ) : row?.employeeRole === "AGENT" ? (
                              <span className="inline-flex items-center rounded-md border border-sky-200/80 bg-sky-50 px-2 py-0.5 text-[11px] font-bold text-[#0b3b68] shadow-2xs">Agent</span>
                            ) : <span className="text-slate-400">—</span>}
                          </td>
                          {/* Schedule In */}
                          <td className="whitespace-nowrap px-4 py-3 font-mono text-[12px] text-slate-700">
                            {scheduleIn ? formatDateTime(scheduleIn) : <span className="text-slate-400 font-sans">—</span>}
                          </td>
                          {/* Schedule Out */}
                          <td className="whitespace-nowrap px-4 py-3 font-mono text-[12px] text-slate-700">
                            {scheduleOut ? formatDateTime(scheduleOut) : <span className="text-slate-400 font-sans">—</span>}
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
                          {/* OT Hours */}
                          <td className="whitespace-nowrap px-4 py-3 font-mono text-[12px] text-slate-700">
                            {otHours != null ? `${Number(otHours).toFixed(2)} hrs` : <span className="text-slate-400 font-sans">—</span>}
                          </td>
                          {/* Total Hours */}
                          <td className="whitespace-nowrap px-4 py-3 font-mono text-[12px] text-slate-700">
                            {totalHours != null ? `${Number(totalHours).toFixed(2)} hrs` : <span className="text-slate-400 font-sans">—</span>}
                          </td>
                          {/* Status */}
                          <td className="whitespace-nowrap px-4 py-3 text-[12px] font-semibold">
                            {attendanceStatus ? (
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-bold ${
                                  attendanceStatus === "Present" || attendanceStatus === "Complete"
                                    ? "bg-green-100 text-green-700 border border-green-200"
                                    : attendanceStatus === "Absent"
                                    ? "bg-rose-100 text-rose-700 border border-rose-200"
                                    : attendanceStatus === "Planned Leave"
                                    ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
                                    : attendanceStatus === "Rest Day"
                                    ? "bg-slate-100 text-slate-600 border border-slate-200"
                                    : "bg-amber-100 text-amber-700 border border-amber-200"
                                }`}
                              >
                                {attendanceStatus}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-sans">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                      <tr>
                        <td colSpan={10} className="py-20 text-center text-slate-400">
                          {hasLoadedData
                            ? "No attendance records found for the selected filters."
                            : "US Visa attendance is unavailable. Refresh to retry account resolution."}
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
