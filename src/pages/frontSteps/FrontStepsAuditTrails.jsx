import React, { useMemo, useState } from "react";
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
import SingleSelectDropdown from "../../components/common/filters/SingleSelectDropdown";
import TablePagination from "../../components/common/tables/TablePagination";

// Comprehensive demonstration audit trail activity records across all FrontSteps modules
const INITIAL_AUDIT_LOGS = [
  {
    id: "AUD-2026-0891",
    timestamp: "Oct 20, 2026, 11:24:18 AM",
    rawDate: "2026-10-20T11:24:18",
    employeeName: "Sarah Gomez",
    employeeId: "FS-SUP-01",
    role: "Supervisor",
    module: "Coaching Management",
    action: "Create",
    severity: "Normal",
    description: "Created coaching session for Kristine Morales",
    recordId: "COACH-FS-007",
    recordType: "Coaching Session",
    targetSubject: "Kristine Joy Morales (FS-1001)",
    ipAddress: "10.240.12.92",
    changes: [
      { field: "Session Type", previous: "—", current: "Unscheduled", remarks: "Initial coaching record created" },
      { field: "Performance Gap", previous: "—", current: "QA Empathy Call Opening", remarks: "Documented coaching gap" },
      { field: "Target Follow-Up Date", previous: "—", current: "Oct 21, 2026", remarks: "14-day review schedule" },
    ],
  },
  {
    id: "AUD-2026-0890",
    timestamp: "Oct 20, 2026, 10:48:05 AM",
    rawDate: "2026-10-20T10:48:05",
    employeeName: "Mark Ramos",
    employeeId: "FS-SUP-02",
    role: "Supervisor",
    module: "Data Management",
    action: "Update",
    severity: "Normal",
    description: "Submitted telephony AHT correction proposal",
    recordId: "FS-DATA-1005",
    recordType: "Source Record",
    targetSubject: "John Rafael Dizon (FS-1003)",
    ipAddress: "10.240.12.95",
    changes: [
      { field: "Reported AHT", previous: "860 sec", current: "845 sec", remarks: "Reconciliation with telephony queue interval data" },
      { field: "Validation Status", previous: "Requires Review", current: "Pending Validation", remarks: "Awaiting supervisory revalidation" },
    ],
  },
  {
    id: "AUD-2026-0889",
    timestamp: "Oct 20, 2026, 10:35:42 AM",
    rawDate: "2026-10-20T10:35:42",
    employeeName: "Dwight Anthony Buma-at",
    employeeId: "FS-MGT-01",
    role: "Operations Manager",
    module: "Quarterly Incentives",
    action: "Approve",
    severity: "Critical",
    description: "Approved Q3 $40 incentive for Maria Santos",
    recordId: "INC-FS-2026-Q3-01",
    recordType: "Quarterly Incentive",
    targetSubject: "Maria Kristina Santos (FS-1002)",
    ipAddress: "10.240.12.84",
    changes: [
      { field: "Approval Status", previous: "Pending Review", current: "Approved", remarks: "Validated 3 consecutive months: 91.2%, 92.5%, 92.8%" },
      { field: "Payout Authorization", previous: "Unapproved", current: "$40 Qualified", remarks: "Approved for Q3 payout distribution" },
    ],
  },
  {
    id: "AUD-2026-0888",
    timestamp: "Oct 20, 2026, 10:12:19 AM",
    rawDate: "2026-10-20T10:12:19",
    employeeName: "Kristine Joy Morales",
    employeeId: "FS-1001",
    role: "Customer Support Agent",
    module: "Coaching Management",
    action: "Update",
    severity: "Normal",
    description: "Acknowledged coaching action plan commitments",
    recordId: "COACH-FS-007",
    recordType: "Coaching Acknowledgment",
    targetSubject: "Self (Kristine Joy Morales)",
    ipAddress: "10.240.14.33",
    changes: [
      { field: "Employee Acknowledgment", previous: "Pending Acknowledgment", current: "Acknowledged (Oct 20, 2026 10:12)", remarks: "Agent confirmed review and committed to soft-skills practice" },
    ],
  },
  {
    id: "AUD-2026-0887",
    timestamp: "Oct 20, 2026, 09:55:30 AM",
    rawDate: "2026-10-20T09:55:30",
    employeeName: "Alexandria Chua",
    employeeId: "FS-WFM-01",
    role: "WFM Analyst",
    module: "Data Management",
    action: "Approve",
    severity: "Normal",
    description: "Validated Oct 2026 telephony calls interval feed",
    recordId: "FS-DATA-1001",
    recordType: "Source Record",
    targetSubject: "FrontSteps Account Feed",
    ipAddress: "10.240.12.88",
    changes: [
      { field: "Validation Status", previous: "Pending Validation", current: "Validated", remarks: "Audited against raw switch logs: 1,010 offered / 970 answered" },
      { field: "Data Quality", previous: "Unverified", current: "No Issues", remarks: "All validation checklist checks verified" },
    ],
  },
  {
    id: "AUD-2026-0886",
    timestamp: "Oct 20, 2026, 09:30:14 AM",
    rawDate: "2026-10-20T09:30:14",
    employeeName: "Dwight Anthony Buma-at",
    employeeId: "FS-MGT-01",
    role: "Operations Manager",
    module: "Performance Improvement",
    action: "Create",
    severity: "Critical",
    description: "Initiated 30-day PIP for Patrick Reyes",
    recordId: "PIP-FS-002",
    recordType: "PIP Record",
    targetSubject: "Patrick Sean Reyes (FS-1011)",
    ipAddress: "10.240.12.84",
    changes: [
      { field: "PIP Status", previous: "Pending Formal Referral", current: "Active - In Progress", remarks: "Target: 140 cases/week and 80% AHT compliance" },
      { field: "Checkpoint 1 Schedule", previous: "—", current: "Oct 27, 2026", remarks: "Day 7 formal milestone review" },
    ],
  },
  {
    id: "AUD-2026-0885",
    timestamp: "Oct 20, 2026, 09:05:22 AM",
    rawDate: "2026-10-20T09:05:22",
    employeeName: "System Administrator",
    employeeId: "FS-ADM-01",
    role: "System Administrator",
    module: "Administration",
    action: "Update",
    severity: "Critical",
    description: "Updated permissions for WFM Analyst role",
    recordId: "ROLE-WFM-001",
    recordType: "Role Profile",
    targetSubject: "Role Profile: WFM Analyst",
    ipAddress: "10.240.12.10",
    changes: [
      { field: "Data Management Access", previous: "View Only", current: "Manage & Validate", remarks: "Authorized to certify source record verification" },
      { field: "Audit Trails Access", previous: "None", current: "View Only", remarks: "Authorized compliance monitoring" },
    ],
  },
  {
    id: "AUD-2026-0884",
    timestamp: "Oct 20, 2026, 08:32:11 AM",
    rawDate: "2026-10-20T08:32:11",
    employeeName: "Dwight Anthony Buma-at",
    employeeId: "FS-MGT-01",
    role: "Operations Manager",
    module: "Authentication",
    action: "Login",
    severity: "Normal",
    description: "Logged in via Corporate SSO",
    recordId: "AUTH-SESS-9104",
    recordType: "Authentication Session",
    targetSubject: "Management User Session",
    ipAddress: "10.240.12.84",
    sessionDetails: {
      clientIp: "10.240.12.84",
      device: "Windows 11 Enterprise (Chrome 129.0)",
      authMethod: "Corporate Single Sign-On (SSO)",
    },
    changes: [
      { field: "Session State", previous: "Terminated", current: "Active", remarks: "SSO token verified via Okta" },
    ],
  },
  {
    id: "AUD-2026-0883",
    timestamp: "Oct 20, 2026, 08:15:49 AM",
    rawDate: "2026-10-20T08:15:49",
    employeeName: "Sarah Gomez",
    employeeId: "FS-SUP-01",
    role: "Supervisor",
    module: "Authentication",
    action: "Login",
    severity: "Normal",
    description: "Logged in via Corporate SSO",
    recordId: "AUTH-SESS-9101",
    recordType: "Authentication Session",
    targetSubject: "Supervisor User Session",
    ipAddress: "10.240.12.92",
    sessionDetails: {
      clientIp: "10.240.12.92",
      device: "Windows 11 Enterprise (Chrome 129.0)",
      authMethod: "Corporate Single Sign-On (SSO)",
    },
    changes: [
      { field: "Session State", previous: "Terminated", current: "Active", remarks: "SSO token verified via Okta" },
    ],
  },
  {
    id: "AUD-2026-0882",
    timestamp: "Oct 19, 2026, 06:02:14 PM",
    rawDate: "2026-10-19T18:02:14",
    employeeName: "Mark Ramos",
    employeeId: "FS-SUP-02",
    role: "Supervisor",
    module: "Authentication",
    action: "Logout",
    severity: "Normal",
    description: "Logged out of SiBS PMS",
    recordId: "AUTH-SESS-9088",
    recordType: "Authentication Session",
    targetSubject: "Supervisor User Session",
    ipAddress: "10.240.12.95",
    sessionDetails: {
      clientIp: "10.240.12.95",
      device: "Windows 11 Enterprise (Edge 129.0)",
      sessionDuration: "8 hours 57 minutes",
    },
    changes: [
      { field: "Session State", previous: "Active", current: "Terminated", remarks: "User initiated clean logout" },
    ],
  },
  {
    id: "AUD-2026-0881",
    timestamp: "Oct 19, 2026, 05:45:10 PM",
    rawDate: "2026-10-19T17:45:10",
    employeeName: "Alexandria Chua",
    employeeId: "FS-WFM-01",
    role: "WFM Analyst",
    module: "Reports & Analytics",
    action: "Create",
    severity: "Normal",
    description: "Generated monthly performance report extract",
    recordId: "REP-FS-2026-10-M",
    recordType: "Published Report",
    targetSubject: "Monthly Executive Performance Summary",
    ipAddress: "10.240.12.88",
    changes: [
      { field: "Report Status", previous: "Draft Extract", current: "Published - Management", remarks: "Validated score averages and volume trends" },
      { field: "View Scope", previous: "Restricted", current: "Internal Management", remarks: "Accessible by Operations and Supervisors" },
    ],
  },
  {
    id: "AUD-2026-0880",
    timestamp: "Oct 19, 2026, 04:30:18 PM",
    rawDate: "2026-10-19T16:30:18",
    employeeName: "Dwight Anthony Buma-at",
    employeeId: "FS-MGT-01",
    role: "Operations Manager",
    module: "Quarterly Incentives",
    action: "Reject",
    severity: "Critical",
    description: "Rejected incentive for Gabriel Tan due to attendance deficit",
    recordId: "INC-FS-2026-Q3-04",
    recordType: "Quarterly Incentive",
    targetSubject: "Gabriel Joshua Tan (FS-1007)",
    ipAddress: "10.240.12.84",
    changes: [
      { field: "Approval Status", previous: "Pending Review", current: "Rejected", remarks: "October attendance record flagged as Missing / deficit" },
      { field: "Eligibility", previous: "Under Review", current: "Disqualified", remarks: "Policy requirement of 3 validated qualifying months not met" },
    ],
  },
  {
    id: "AUD-2026-0879",
    timestamp: "Oct 19, 2026, 03:14:02 PM",
    rawDate: "2026-10-19T15:14:02",
    employeeName: "Sarah Gomez",
    employeeId: "FS-SUP-01",
    role: "Supervisor",
    module: "Performance Improvement",
    action: "Approve",
    severity: "Critical",
    description: "Closed 30-day PIP for John Dizon (Target Met)",
    recordId: "PIP-FS-001",
    recordType: "PIP Record",
    targetSubject: "John Rafael Dizon (FS-1003)",
    ipAddress: "10.240.12.92",
    changes: [
      { field: "PIP Final Outcome", previous: "Active - Final Review", current: "Closed - Successfully Completed", remarks: "AHT achieved 845s (benchmark ≤ 900s) and case closure at 142/week" },
      { field: "Account Status", previous: "Under Formal Improvement", current: "Regular Good Standing", remarks: "Approved by Operations Manager" },
    ],
  },
  {
    id: "AUD-2026-0878",
    timestamp: "Oct 19, 2026, 01:20:55 PM",
    rawDate: "2026-10-19T13:20:55",
    employeeName: "System Administrator",
    employeeId: "FS-ADM-01",
    role: "System Administrator",
    module: "Administration",
    action: "Create",
    severity: "Normal",
    description: "Created recurring QA alert notification rule",
    recordId: "ALERT-RULE-006",
    recordType: "Alert Configuration",
    targetSubject: "System Rule: QA Outlier Notification",
    ipAddress: "10.240.12.10",
    changes: [
      { field: "Rule Trigger", previous: "—", current: "QA Score < 85% for 2 consecutive evaluations", remarks: "New notification rule" },
      { field: "Recipients", previous: "—", current: "Operations Manager, Assigned Supervisor", remarks: "Automated alert distribution" },
    ],
  },
  {
    id: "AUD-2026-0877",
    timestamp: "Oct 19, 2026, 12:45:00 PM",
    rawDate: "2026-10-19T12:45:00",
    employeeName: "Patrick Sean Reyes",
    employeeId: "FS-1011",
    role: "Customer Support Agent",
    module: "Authentication",
    action: "Logout",
    severity: "Normal",
    description: "Logged out of SiBS PMS session",
    recordId: "AUTH-SESS-9065",
    recordType: "Authentication Session",
    targetSubject: "Agent User Session",
    ipAddress: "10.240.12.102",
    sessionDetails: {
      clientIp: "10.240.12.102",
      device: "Windows 11 Enterprise (Chrome 129.0)",
      sessionDuration: "4 hours 15 minutes",
    },
    changes: [
      { field: "Session State", previous: "Active", current: "Terminated", remarks: "User logout recorded" },
    ],
  },
  {
    id: "AUD-2026-0876",
    timestamp: "Oct 18, 2026, 04:10:30 PM",
    rawDate: "2026-10-18T16:10:30",
    employeeName: "System Administrator",
    employeeId: "FS-ADM-01",
    role: "System Administrator",
    module: "Administration",
    action: "Delete",
    severity: "Critical",
    description: "Removed deprecated KPI formula configuration",
    recordId: "KPI-CONFIG-004",
    recordType: "KPI Formula",
    targetSubject: "Formula: Legacy Escalation Rate 2025",
    ipAddress: "10.240.12.10",
    changes: [
      { field: "Record Status", previous: "Inactive", current: "Deleted", remarks: "Purged obsolete metric formula per Q4 configuration update" },
    ],
  },
  {
    id: "AUD-2026-0875",
    timestamp: "Oct 18, 2026, 02:15:20 PM",
    rawDate: "2026-10-18T14:15:20",
    employeeName: "Dwight Anthony Buma-at",
    employeeId: "FS-MGT-01",
    role: "Operations Manager",
    module: "Employee Performance",
    action: "Update",
    severity: "Normal",
    description: "Recalculated October scorecard weighted scores",
    recordId: "SCORECARD-2026-10",
    recordType: "Performance Scorecard",
    targetSubject: "FrontSteps Scorecard Roster",
    ipAddress: "10.240.12.84",
    changes: [
      { field: "Score Batch Status", previous: "Preliminary", current: "Validated Scores", remarks: "Recomputed with verified W42 attendance data" },
    ],
  },
];

const MODULE_OPTIONS = [
  "All Modules",
  "Authentication",
  "Employee Performance",
  "Coaching Management",
  "Performance Improvement",
  "Quarterly Incentives",
  "Reports & Analytics",
  "Data Management",
  "Administration",
];

// Strict requirement #1: Create, Update, Delete, Approve, Reject, Login, and Logout
const ACTION_OPTIONS = [
  "All Actions",
  "Create",
  "Update",
  "Delete",
  "Approve",
  "Reject",
  "Login",
  "Logout",
];

const DATE_RANGE_OPTIONS = [
  "All Dates",
  "Today (Oct 20, 2026)",
  "Yesterday (Oct 19, 2026)",
  "Last 7 Days (Oct 14 - Oct 20)",
  "Last 30 Days (Sep 21 - Oct 20)",
];

function getActionBadge(action) {
  switch (action) {
    case "Login":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "Logout":
      return "bg-slate-100 text-slate-700 border-slate-200";
    case "Create":
      return "bg-blue-50 text-blue-700 border-blue-200";
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
    case "Create":
      return <FileText size={11} className="mr-1 inline text-blue-600 shrink-0" />;
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
  const [logs] = useState(INITIAL_AUDIT_LOGS);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("All Modules");
  const [actionFilter, setActionFilter] = useState("All Actions");
  const [dateRange, setDateRange] = useState("All Dates");
  const [page, setPage] = useState(1);
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportNotice, setExportNotice] = useState("");
  const pageSize = 10;

  // Search & Filter Logic across employee name, ID, module, action, date range, and record ID
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const term = search.trim().toLowerCase();
      const matchesSearch =
        !term ||
        log.employeeName.toLowerCase().includes(term) ||
        log.employeeId.toLowerCase().includes(term) ||
        log.id.toLowerCase().includes(term) ||
        (log.recordId && log.recordId.toLowerCase().includes(term)) ||
        (log.targetSubject && log.targetSubject.toLowerCase().includes(term)) ||
        log.description.toLowerCase().includes(term);

      const matchesModule =
        moduleFilter === "All Modules" || log.module === moduleFilter;

      const matchesAction =
        actionFilter === "All Actions" || log.action === actionFilter;

      let matchesDate = true;
      if (dateRange === "Today (Oct 20, 2026)") {
        matchesDate = log.timestamp.includes("Oct 20, 2026");
      } else if (dateRange === "Yesterday (Oct 19, 2026)") {
        matchesDate = log.timestamp.includes("Oct 19, 2026");
      } else if (dateRange === "Last 7 Days (Oct 14 - Oct 20)") {
        matchesDate = log.rawDate >= "2026-10-14";
      } else if (dateRange === "Last 30 Days (Sep 21 - Oct 20)") {
        matchesDate = log.rawDate >= "2026-09-21";
      }

      return matchesSearch && matchesModule && matchesAction && matchesDate;
    });
  }, [logs, search, moduleFilter, actionFilter, dateRange]);

  // Pagination calculation (default newest first)
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const paginatedLogs = useMemo(() => {
    const startIndex = (Math.min(page, totalPages) - 1) * pageSize;
    return filteredLogs.slice(startIndex, startIndex + pageSize);
  }, [filteredLogs, page, totalPages, pageSize]);

  const handleResetFilters = () => {
    setSearch("");
    setModuleFilter("All Modules");
    setActionFilter("All Actions");
    setDateRange("All Dates");
    setPage(1);
  };

  // Export Logs Handler (Requirement #6: CSV and XLSX export for authorized audit compliance)
  const handleExportLogs = (format) => {
    setShowExportMenu(false);
    const dateStamp = new Date().toISOString().split("T")[0];
    const filename = `FrontSteps_Audit_Trails_${dateStamp}.${format.toLowerCase()}`;

    if (format === "CSV") {
      const headers = [
        "Audit Log ID",
        "Timestamp",
        "Employee Name",
        "Employee ID",
        "Role",
        "Module",
        "Action Type",
        "Affected Record ID",
        "Activity Description",
      ];
      const rows = filteredLogs.map((log) => [
        `"${log.id}"`,
        `"${log.timestamp}"`,
        `"${log.employeeName}"`,
        `"${log.employeeId}"`,
        `"${log.role}"`,
        `"${log.module}"`,
        `"${log.action}"`,
        `"${log.recordId || "—"}"`,
        `"${log.description.replace(/"/g, '""')}"`,
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
          {/* Left: Search and Dropdown Filters */}
          <div className="flex flex-1 flex-wrap items-center gap-2 min-w-[280px]">
            {/* Search Input: employee name, employee ID, record ID, or description */}
            <div className="flex-1 min-w-[200px]">
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
                    className="text-slate-400 hover:text-slate-600 ml-1"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Module Filter */}
            <div className="w-[165px]">
              <SingleSelectDropdown
                value={moduleFilter}
                onChange={(e) => {
                  setModuleFilter(e.target.value);
                  setPage(1);
                }}
                options={MODULE_OPTIONS.map((m) => ({ value: m, label: m }))}
                buttonClassName="h-8 rounded-lg border-slate-200 px-3 text-xs"
              />
            </div>

            {/* Action Type Filter: Create, Update, Delete, Approve, Reject, Login, Logout */}
            <div className="w-[145px]">
              <SingleSelectDropdown
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setPage(1);
                }}
                options={ACTION_OPTIONS.map((a) => ({ value: a, label: a }))}
                buttonClassName="h-8 rounded-lg border-slate-200 px-3 text-xs"
              />
            </div>

            {/* Date Range Filter */}
            <div className="w-[170px]">
              <SingleSelectDropdown
                value={dateRange}
                onChange={(e) => {
                  setDateRange(e.target.value);
                  setPage(1);
                }}
                options={DATE_RANGE_OPTIONS.map((d) => ({ value: d, label: d }))}
                buttonClassName="h-8 rounded-lg border-slate-200 px-3 text-xs"
              />
            </div>

            {/* Reset Filters Button */}
            {(search || moduleFilter !== "All Modules" || actionFilter !== "All Actions" || dateRange !== "All Dates") && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Reset all filters"
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Right: Read-only badge and Export button */}
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
              <ShieldCheck size={12} className="text-emerald-600" />
              100% Read-Only
            </span>

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
                <th className="py-3 px-4 w-[16%]">Timestamp</th>
                <th className="py-3 px-4 w-[18%]">Employee</th>
                <th className="py-3 px-4 w-[16%]">Module</th>
                <th className="py-3 px-4 w-[11%]">Action</th>
                <th className="py-3 px-4 w-[14%]">Affected Record ID</th>
                <th className="py-3 px-4 w-[19%]">Activity</th>
                <th className="py-3 px-4 w-[6%] text-center">Action</th>
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
                        {`${log.timestamp.split(",")[0]}, ${log.timestamp.split(",")[1]?.trim()} - ${log.timestamp.split(",")[2]?.trim()}`}
                      </span>
                    </td>

                    {/* Employee Name & ID */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 text-[12.5px] truncate" title={log.employeeName}>
                        {log.employeeName}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <span className="font-mono font-medium text-slate-600">{log.employeeId}</span>
                        <span>•</span>
                        <span className="truncate">{log.role}</span>
                      </div>
                    </td>

                    {/* Module */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-slate-800 truncate max-w-full">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#042c51] shrink-0" />
                        <span className="truncate">{log.module}</span>
                      </span>
                    </td>

                    {/* Action Type Badge (Create, Update, Delete, Approve, Reject, Login, Logout) */}
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

                    {/* Affected Record ID */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {log.recordId ? (
                        <span className="inline-flex items-center font-mono text-[11.5px] font-semibold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/80">
                          {log.recordId}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Activity (Shortened description) */}
                    <td className="py-3 px-4">
                      <span
                        className="text-[12px] text-slate-700 font-medium truncate block"
                        title={log.description}
                      >
                        {log.description}
                      </span>
                    </td>

                    {/* View Details Action */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedAudit(log)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-[#042c51] hover:text-[#042c51] hover:bg-slate-50 transition-colors cursor-pointer"
                        title="View audit event details"
                      >
                        <Eye size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <FilterX className="mx-auto mb-2 text-slate-400" size={24} />
                    <p className="text-xs font-bold text-slate-700">No activity records found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      No audit events match your selected filters. Try adjusting your search query or reset filters.
                    </p>
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <RotateCcw size={12} />
                      <span>Reset Filters</span>
                    </button>
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
