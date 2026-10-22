import React, { useMemo, useState } from "react";
import {
  Settings2,
  Users,
  SlidersHorizontal,
  BellRing,
  ShieldCheck,
  Search,
  Plus,
  Pencil,
  X,
  RotateCcw,
  Save,
  LockKeyhole,
  AlertTriangle,
  CheckCircle2,
  Info,
  ClipboardCheck,
  BriefcaseBusiness,
} from "lucide-react";
import SingleSelectDropdown from "../../components/common/filters/SingleSelectDropdown";
import TablePagination from "../../components/common/tables/TablePagination";

const MODULES = [
  "Dashboard",
  "Employee Performance",
  "Coaching Management",
  "Performance Improvement",
  "Quarterly Incentives",
  "Reports & Analytics",
  "Data Management",
  "Administration",
  "Audit Trails",
];

const INITIAL_ROLES = [
  {
    id: "role-1",
    name: "System Administrator",
    users: 2,
    description: "System configuration and full administrative oversight",
    access: "Full Access",
    permissions: MODULES.reduce((a, m) => ({ ...a, [m]: "Manage" }), {}),
  },
  {
    id: "role-2",
    name: "Operations Manager",
    users: 4,
    description: "Operational oversight and performance reviews",
    access: "Management",
    permissions: Object.fromEntries(
      MODULES.map((m) => [
        m,
        ["Administration", "Audit Trails"].includes(m) ? "View" : "Manage",
      ])
    ),
  },
  {
    id: "role-3",
    name: "Supervisor",
    users: 8,
    description: "Team performance monitoring and coaching",
    access: "Team Scope",
    permissions: Object.fromEntries(
      MODULES.map((m) => [
        m,
        ["Administration", "Audit Trails"].includes(m) ? "None" : "View",
      ])
    ),
  },
  {
    id: "role-4",
    name: "WFM Analyst",
    users: 3,
    description: "Reporting, source-data review, and KPI validation",
    access: "Operations",
    permissions: Object.fromEntries(
      MODULES.map((m) => [
        m,
        ["Reports & Analytics", "Data Management"].includes(m)
          ? "Manage"
          : ["Dashboard", "Employee Performance"].includes(m)
          ? "View"
          : "None",
      ])
    ),
  },
  {
    id: "role-5",
    name: "QTM (Quality Training Management)",
    users: 2,
    description: "Quality audits, scorecard disputes, and coaching quality oversight",
    access: "Quality Scope",
    permissions: Object.fromEntries(
      MODULES.map((m) => [
        m,
        ["Employee Performance", "Coaching Management", "Reports & Analytics"].includes(m)
          ? "Manage"
          : ["Dashboard"].includes(m)
          ? "View"
          : "None",
      ])
    ),
  },
  {
    id: "role-6",
    name: "HR Specialist",
    users: 2,
    description: "PIP referral reviews, formal disciplinary tracking, and policy compliance",
    access: "HR Scope",
    permissions: Object.fromEntries(
      MODULES.map((m) => [
        m,
        ["Performance Improvement", "Coaching Management"].includes(m)
          ? "Manage"
          : ["Employee Performance", "Reports & Analytics", "Audit Trails"].includes(m)
          ? "View"
          : "None",
      ])
    ),
  },
  {
    id: "role-7",
    name: "Client Reporting Viewer",
    users: 2,
    description: "Access to permitted client-facing reports",
    access: "Client View",
    permissions: Object.fromEntries(
      MODULES.map((m) => [
        m,
        m === "Reports & Analytics" ? "Client Only" : "None",
      ])
    ),
  },
];

const INITIAL_KPIS = [
  {
    id: "kpi-1",
    name: "Cases Closed",
    target: "140 / week",
    weight: "45%",
    unit: "Cases",
    type: "Individual",
    status: "For Review",
  },
  {
    id: "kpi-2",
    name: "Average Handle Time",
    target: "≤ 15 minutes",
    weight: "10%",
    unit: "Minutes",
    type: "Individual",
    status: "For Review",
  },
  {
    id: "kpi-3",
    name: "AHT Compliance",
    target: "≥ 80%",
    weight: "15%",
    unit: "%",
    type: "Individual",
    status: "For Review",
  },
  {
    id: "kpi-4",
    name: "Resolution Completion",
    target: "100%",
    weight: "10%",
    unit: "%",
    type: "Individual",
    status: "For Review",
  },
  {
    id: "kpi-5",
    name: "Resolution Sub Code Completion",
    target: "≥ 95%",
    weight: "10%",
    unit: "%",
    type: "Individual",
    status: "For Review",
  },
  {
    id: "kpi-6",
    name: "Case Summary Completion",
    target: "≥ 95%",
    weight: "10%",
    unit: "%",
    type: "Individual",
    status: "For Review",
  },
];

const INITIAL_ALERTS = [
  {
    id: "alert-1",
    name: "Recurring Performance Concern",
    category: "Performance",
    trigger: "Repeated concerns requiring management attention",
    recipients: "Operations Manager, Supervisor",
    enabled: true,
    severity: "High",
  },
  {
    id: "alert-2",
    name: "Critical Performance Issue",
    category: "Performance",
    trigger: "Critical performance concern identified",
    recipients: "Operations Manager",
    enabled: true,
    severity: "Critical",
  },
  {
    id: "alert-3",
    name: "Coaching Follow-Up Due",
    category: "Coaching",
    trigger: "Scheduled review date approaching",
    recipients: "Assigned Supervisor",
    enabled: true,
    severity: "Medium",
  },
  {
    id: "alert-4",
    name: "Data Validation Required",
    category: "Data Quality",
    trigger: "Record is incomplete or awaiting validation",
    recipients: "WFM Analyst",
    enabled: true,
    severity: "Medium",
  },
  {
    id: "alert-5",
    name: "PIP Review Checkpoint",
    category: "Performance Improvement",
    trigger: "Formal review checkpoint is due",
    recipients: "Operations Manager",
    enabled: false,
    severity: "High",
  },
];

const INITIAL_SETTINGS = {
  // Reporting & Display Preferences (Req #7, #14, #16)
  reportingPeriod: "Monthly",
  defaultReportView: "Internal Management",

  // Notification & Reminder Preferences (Req #12, #13)
  dataQualityNotices: true,
  coachingReminders: true,
  pipCheckpointReminders: true,
  validationNotices: true,

  // Performance Rating Scale Configurations (Req #6)
  ratingExceptional: 95.0,
  ratingVerySatisfactory: 90.0,
  ratingSatisfactory: 85.0,

  // Coaching & PIP Workflow Configurations (Req #8, #9, #11)
  coachingFollowUpDays: 14,
  pipStandardDurationDays: 30,
  pipWeeklyEvaluations: true,
  pipHrApprovalRequired: true,

  // Performance-Based Quarterly Incentive Rules (Req #10)
  incentiveAmountDollars: 40.0,
  incentiveQualifyingAvgScore: 85.0,
  incentiveConsecutiveMonthsRequired: 3,
  incentiveDisqualifyOnActivePip: true,
};

const INITIAL_USERS = [
  { id: "USR-001", name: "Alexandria Chua", email: "alexandria.chua@frontsteps.com", role: "Operations Manager", team: "Operations", status: "Active", account: "FrontSteps" },
  { id: "USR-002", name: "Sarah Gomez", email: "sarah.gomez@frontsteps.com", role: "Supervisor", team: "Team Alpha (Day)", status: "Active", account: "FrontSteps" },
  { id: "USR-003", name: "Mark Ramos", email: "mark.ramos@frontsteps.com", role: "Supervisor", team: "Team Bravo (Mid)", status: "Active", account: "FrontSteps" },
  { id: "USR-004", name: "Janine Marie Dela Cruz", email: "janine.delacruz@frontsteps.com", role: "Employee", team: "Team Bravo (Mid)", status: "Active", account: "FrontSteps" },
  { id: "USR-005", name: "Carlos Miguel Mendoza", email: "carlos.mendoza@frontsteps.com", role: "Employee", team: "Team Alpha (Day)", status: "Active", account: "FrontSteps" },
  { id: "USR-006", name: "Lance Christian Lim", email: "lance.lim@frontsteps.com", role: "Employee", team: "Team Alpha (Day)", status: "Inactive", account: "FrontSteps" },
];

const NAV_TABS = [
  { id: "users", label: "Users & Assignments", icon: BriefcaseBusiness },
  { id: "roles", label: "Roles & Permissions", icon: Users },
  { id: "kpis", label: "KPI Configuration", icon: SlidersHorizontal },
  { id: "alerts", label: "Management Alerts", icon: BellRing },
  { id: "settings", label: "System & Policy Settings", icon: Settings2 },
];

function Chip({ children, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-50 text-slate-600 border-slate-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    red: "bg-rose-50 text-rose-700 border-rose-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none transition focus:border-[#ff5c28] focus:ring-1 focus:ring-[#ff5c28]/20";

function Field({ label, children, note }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
      {note && <span className="mt-1 block text-[11px] text-slate-400">{note}</span>}
    </label>
  );
}

function Toggle({ checked, onChange, label, description }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs">
      <div>
        <p className="text-xs font-bold text-slate-800">{label}</p>
        {description && (
          <p className="mt-0.5 text-[11px] text-slate-500">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          checked ? "bg-[#042c51]" : "bg-slate-200"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

function Modal({ title, subtitle, onClose, children, footer, wide = false }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-3 sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`flex max-h-[88vh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150 ${
          wide ? "max-w-4xl" : "max-w-xl"
        }`}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 bg-[#042c51] px-5 py-4 text-white">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-white leading-tight">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-slate-300">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X size={16} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">{children}</div>
        {footer && (
          <footer className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}

export default function FrontStepsAdministration() {
  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState(INITIAL_USERS);
  const [roles, setRoles] = useState(INITIAL_ROLES);
  const [kpis, setKpis] = useState(INITIAL_KPIS);
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const [, setSavedSettings] = useState(INITIAL_SETTINGS);

  const [query, setQuery] = useState("");
  const [modal, setModal] = useState(null);
  const [draft, setDraft] = useState(null);
  const [notice, setNotice] = useState("");
  const [accessFilter, setAccessFilter] = useState("All Access");
  const [severityFilter, setSeverityFilter] = useState("All Severities");

  // Pagination states for tabular tabs
  const [userPage, setUserPage] = useState(1);
  const [rolePage, setRolePage] = useState(1);
  const [kpiPage, setKpiPage] = useState(1);
  const [alertPage, setAlertPage] = useState(1);
  const pageSize = 10;

  const showNotice = (message) => {
    setNotice(message);
  };

  const openUser = (user) => {
    setDraft({ ...user });
    setModal("user");
  };

  const openRole = (role) => {
    setDraft({ ...role, permissions: { ...role.permissions } });
    setModal("role");
  };

  const openKpi = (kpi) => {
    setDraft({ ...kpi });
    setModal("kpi");
  };

  const openAlert = (alert) => {
    setDraft({ ...alert });
    setModal("alert");
  };

  const closeModal = () => {
    setModal(null);
    setDraft(null);
  };

  const saveUser = () => {
    if (!draft?.name.trim()) return;
    setUsers((prev) =>
      prev.some((u) => u.id === draft.id)
        ? prev.map((u) => (u.id === draft.id ? draft : u))
        : [...prev, { ...draft, id: `USR-${String(prev.length + 1).padStart(3, "0")}` }]
    );
    showNotice("User account and assignment saved.");
    closeModal();
  };

  const saveRole = () => {
    if (!draft?.name.trim()) return;
    setRoles((prev) =>
      prev.some((r) => r.id === draft.id)
        ? prev.map((r) => (r.id === draft.id ? draft : r))
        : [...prev, { ...draft, id: `role-${Date.now()}`, users: 0 }]
    );
    showNotice("Role configuration saved.");
    closeModal();
  };

  const saveKpi = () => {
    setKpis((prev) =>
      prev.map((k) => (k.id === draft.id ? { ...draft, status: "For Review" } : k))
    );
    showNotice("KPI configuration saved for review.");
    closeModal();
  };

  const saveAlert = () => {
    if (!draft?.name.trim()) return;
    setAlerts((prev) =>
      prev.some((a) => a.id === draft.id)
        ? prev.map((a) => (a.id === draft.id ? draft : a))
        : [...prev, { ...draft, id: `alert-${Date.now()}` }]
    );
    showNotice("Alert configuration saved.");
    closeModal();
  };

  // Filtered lists
  const usersShown = useMemo(
    () =>
      users.filter((u) =>
        `${u.name} ${u.email} ${u.role} ${u.team}`.toLowerCase().includes(query.toLowerCase())
      ),
    [users, query]
  );

  // Filtered lists
  const rolesShown = useMemo(
    () =>
      roles.filter(
        (r) =>
          `${r.name} ${r.description}`.toLowerCase().includes(query.toLowerCase()) &&
          (accessFilter === "All Access" || r.access === accessFilter)
      ),
    [roles, query, accessFilter]
  );

  const kpisShown = useMemo(
    () =>
      kpis.filter((k) =>
        `${k.name} ${k.target}`.toLowerCase().includes(query.toLowerCase())
      ),
    [kpis, query]
  );

  const alertsShown = useMemo(
    () =>
      alerts.filter(
        (a) =>
          `${a.name} ${a.category} ${a.recipients}`
            .toLowerCase()
            .includes(query.toLowerCase()) &&
          (severityFilter === "All Severities" || a.severity === severityFilter)
      ),
    [alerts, query, severityFilter]
  );

  // Paginated slices
  const totalUserPages = Math.max(1, Math.ceil(usersShown.length / pageSize));
  const paginatedUsers = usersShown.slice(
    (Math.min(userPage, totalUserPages) - 1) * pageSize,
    Math.min(userPage, totalUserPages) * pageSize
  );

  const totalRolePages = Math.max(1, Math.ceil(rolesShown.length / pageSize));
  const paginatedRoles = rolesShown.slice(
    (Math.min(rolePage, totalRolePages) - 1) * pageSize,
    Math.min(rolePage, totalRolePages) * pageSize
  );

  const totalKpiPages = Math.max(1, Math.ceil(kpisShown.length / pageSize));
  const paginatedKpis = kpisShown.slice(
    (Math.min(kpiPage, totalKpiPages) - 1) * pageSize,
    Math.min(kpiPage, totalKpiPages) * pageSize
  );

  const totalAlertPages = Math.max(1, Math.ceil(alertsShown.length / pageSize));
  const paginatedAlerts = alertsShown.slice(
    (Math.min(alertPage, totalAlertPages) - 1) * pageSize,
    Math.min(alertPage, totalAlertPages) * pageSize
  );

  const reset = () => {
    setQuery("");
    setAccessFilter("All Access");
    setSeverityFilter("All Severities");
    setUserPage(1);
    setRolePage(1);
    setKpiPage(1);
    setAlertPage(1);
  };

  const setActiveTab = (next) => {
    setTab(next);
    reset();
    setNotice("");
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2.5 sm:gap-3 overflow-hidden font-jakarta text-slate-800">
      {/* Toast Notice */}
      {notice && (
        <div
          role="status"
          className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800 shrink-0"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 size={15} />
            {notice}
          </span>
          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Dismiss notification"
            className="cursor-pointer text-emerald-700 hover:text-emerald-900"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* 1. Summary Cards (4 Metric Cards matching other FrontSteps modules) */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 shrink-0">
        {/* Card 1 — Configured Roles */}
        <div className="flex items-center justify-between rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 shadow-xs">
          <div className="min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Configured Roles
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-extrabold text-slate-800">
                {roles.length}
              </span>
              <span className="text-xs font-medium text-slate-400">Profiles</span>
            </div>
            <span className="block text-[10px] text-slate-400 mt-0.5">
              Access control profiles
            </span>
          </div>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
            <Users size={15} />
          </div>
        </div>

        {/* Card 2 — Individual KPIs */}
        <div className="flex items-center justify-between rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 shadow-xs">
          <div className="min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Individual KPIs
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-extrabold text-[#042c51]">
                {kpis.length}
              </span>
              <span className="text-xs font-medium text-slate-400">Measures</span>
            </div>
            <span className="block text-[10px] text-slate-400 mt-0.5">
              Scorecard metrics
            </span>
          </div>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-[#ff5c28] border border-orange-100">
            <SlidersHorizontal size={15} />
          </div>
        </div>

        {/* Card 3 — Active Alert Rules */}
        <div className="flex items-center justify-between rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 shadow-xs">
          <div className="min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Active Alert Rules
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-extrabold text-amber-700">
                {alerts.filter((a) => a.enabled).length}
              </span>
              <span className="text-xs font-medium text-amber-600/80">
                / {alerts.length} Active
              </span>
            </div>
            <span className="block text-[10px] text-amber-600 font-semibold mt-0.5">
              Configured notification rules
            </span>
          </div>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
            <BellRing size={15} />
          </div>
        </div>

        {/* Card 4 — Configuration Scope */}
        <div className="flex items-center justify-between rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 shadow-xs">
          <div className="min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Configuration Scope
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-extrabold text-emerald-700">
                FrontSteps
              </span>
            </div>
            <span className="block text-[10px] text-emerald-600/80 mt-0.5">
              Account-level administration
            </span>
          </div>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
            <ShieldCheck size={15} />
          </div>
        </div>
      </div>

      {/* 2. Sub-Tab Navigation Bar */}
      <div className="rounded-xl border border-slate-200/80 bg-white px-3 py-1 shadow-xs shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {NAV_TABS.map((t) => {
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`flex shrink-0 items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  isActive
                    ? "bg-[#042c51] text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <t.icon size={14} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Search and Action Controls (For Roles, KPIs, and Alerts) */}
      {tab !== "settings" && (
        <div className="rounded-xl border border-slate-200/80 bg-white px-3.5 py-2.5 shadow-xs shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            {/* Left Filter & Search Controls */}
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
              {/* Search input */}
              <div className="flex-1 min-w-[200px]">
                <div className="relative flex h-8 items-center rounded-lg border border-slate-200 bg-white px-2.5 transition-colors focus-within:border-[#ff5c28] focus-within:ring-1 focus-within:ring-[#ff5c28]/20">
                  <Search size={13} className="text-slate-400 shrink-0 mr-2" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setUserPage(1);
                      setRolePage(1);
                      setKpiPage(1);
                      setAlertPage(1);
                    }}
                    placeholder={
                      tab === "users"
                        ? "Search employee name, email, role, or team..."
                        : tab === "roles"
                        ? "Search role or description..."
                        : tab === "kpis"
                        ? "Search KPI metrics or targets..."
                        : "Search alert rules, categories, recipients..."
                    }
                    className="w-full bg-transparent text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none"
                  />
                </div>
              </div>

              {/* Roles Access Filter Dropdown */}
              {tab === "roles" && (
                <div className="w-[170px]">
                  <SingleSelectDropdown
                    value={accessFilter}
                    onChange={(e) => {
                      setAccessFilter(e.target.value);
                      setRolePage(1);
                    }}
                    options={[
                      { value: "All Access", label: "All Access Levels" },
                      ...[...new Set(roles.map((r) => r.access))].map((a) => ({
                        value: a,
                        label: a,
                      })),
                    ]}
                    buttonClassName="h-8 rounded-lg border-slate-200 px-3 text-xs"
                  />
                </div>
              )}

              {/* Alerts Severity Filter Dropdown */}
              {tab === "alerts" && (
                <div className="w-[170px]">
                  <SingleSelectDropdown
                    value={severityFilter}
                    onChange={(e) => {
                      setSeverityFilter(e.target.value);
                      setAlertPage(1);
                    }}
                    options={[
                      { value: "All Severities", label: "All Severities" },
                      { value: "Critical", label: "Critical" },
                      { value: "High", label: "High" },
                      { value: "Medium", label: "Medium" },
                      { value: "Low", label: "Low" },
                    ]}
                    buttonClassName="h-8 rounded-lg border-slate-200 px-3 text-xs"
                  />
                </div>
              )}

              {/* Reset Filters button */}
              <button
                type="button"
                onClick={reset}
                className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
                title="Reset search and filters"
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>
            </div>

            {/* Right Action Button */}
            {tab === "users" && (
              <div className="shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    openUser({
                      id: "",
                      name: "",
                      email: "",
                      role: "Employee",
                      team: "Team Alpha (Day)",
                      status: "Active",
                      account: "FrontSteps",
                    })
                  }
                  className="flex h-8 items-center gap-1.5 rounded-lg bg-[#ff5c28] px-3.5 text-xs font-bold text-white hover:bg-[#e04816] transition-colors cursor-pointer shadow-xs"
                >
                  <Plus size={14} />
                  <span>Add User</span>
                </button>
              </div>
            )}

            {tab === "roles" && (
              <div className="shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    openRole({
                      id: "",
                      name: "",
                      description: "",
                      access: "Team Scope",
                      users: 0,
                      permissions: Object.fromEntries(
                        MODULES.map((m) => [m, "None"])
                      ),
                    })
                  }
                  className="flex h-8 items-center gap-1.5 rounded-lg bg-[#ff5c28] px-3.5 text-xs font-bold text-white hover:bg-[#e04816] transition-colors cursor-pointer shadow-xs"
                >
                  <Plus size={14} />
                  <span>Add Role</span>
                </button>
              </div>
            )}

            {tab === "alerts" && (
              <div className="shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    openAlert({
                      id: "",
                      name: "",
                      category: "Performance",
                      trigger: "",
                      recipients: "Operations Manager",
                      enabled: true,
                      severity: "Medium",
                    })
                  }
                  className="flex h-8 items-center gap-1.5 rounded-lg bg-[#ff5c28] px-3.5 text-xs font-bold text-white hover:bg-[#e04816] transition-colors cursor-pointer shadow-xs"
                >
                  <Plus size={14} />
                  <span>Add Alert Rule</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 0: User Management & Employee Assignments (Req #1, #4) */}
      {tab === "users" && (
        <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden flex flex-col flex-1 min-h-0">
          <div className="overflow-auto flex-1 min-h-0 sibs-scrollbar">
            <table className="w-full table-fixed text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-[#042c51] bg-[#042c51] text-[11px] font-bold uppercase tracking-wider text-white select-none shadow-xs">
                  <th className="py-3 px-4 w-[22%]">User Name / Email</th>
                  <th className="py-3 px-4 w-[12%]">User ID</th>
                  <th className="py-3 px-4 w-[20%]">Assigned Role</th>
                  <th className="py-3 px-4 w-[20%]">Team & Shift</th>
                  <th className="py-3 px-4 w-[12%] text-center">Status</th>
                  <th className="py-3 px-4 w-[14%] text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {paginatedUsers.length > 0 ? (
                  paginatedUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors h-[52px]">
                      <td className="py-3 px-4">
                        <span className="block font-bold text-slate-900 text-[13px] leading-tight">
                          {u.name}
                        </span>
                        <span className="block text-[11px] text-slate-400 mt-0.5">{u.email}</span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-600 text-xs">
                        {u.id}
                      </td>
                      <td className="py-3 px-4">
                        <Chip tone={u.role === "Operations Manager" ? "purple" : u.role === "Supervisor" ? "blue" : "slate"}>
                          {u.role}
                        </Chip>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-700">
                        {u.team}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Chip tone={u.status === "Active" ? "green" : "red"}>
                          {u.status}
                        </Chip>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => openUser(u)}
                            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-bold text-[#042c51] hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            <Pencil size={12} />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = users.map((item) =>
                                item.id === u.id
                                  ? { ...item, status: item.status === "Active" ? "Inactive" : "Active" }
                                  : item
                              );
                              setUsers(updated);
                              showNotice(`User ${u.name} status updated.`);
                            }}
                            className={`inline-flex items-center justify-center rounded-md px-2 py-1 text-[11px] font-bold cursor-pointer transition-colors ${
                              u.status === "Active"
                                ? "text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200"
                                : "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200"
                            }`}
                          >
                            {u.status === "Active" ? "Deactivate" : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      <p className="text-xs font-bold text-slate-700">No users found</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        No user accounts match your search query.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <TablePagination
            currentPage={userPage}
            totalPages={totalUserPages}
            totalItems={usersShown.length}
            pageSize={pageSize}
            onPageChange={(page) => setUserPage(page)}
            itemLabel="users"
            className="shrink-0"
          />
        </div>
      )}

      {/* TAB 1: User Roles & Permissions */}
      {tab === "roles" && (
        <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden flex flex-col flex-1 min-h-0">
          <div className="overflow-auto flex-1 min-h-0 sibs-scrollbar">
            <table className="w-full table-fixed text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-[#042c51] bg-[#042c51] text-[11px] font-bold uppercase tracking-wider text-white select-none shadow-xs">
                  <th className="py-3 px-4 w-[20%]">Role</th>
                  <th className="py-3 px-4 w-[38%]">Description</th>
                  <th className="py-3 px-4 w-[14%] text-center">Assigned Users</th>
                  <th className="py-3 px-4 w-[16%]">Access Level</th>
                  <th className="py-3 px-4 w-[12%] text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {paginatedRoles.length > 0 ? (
                  paginatedRoles
                    .map((r) => (
                      <tr
                        key={r.id}
                        className="hover:bg-slate-50/70 transition-colors h-[54px]"
                      >
                        <td className="py-3 px-4">
                          <span className="block font-bold text-slate-900 text-[13px] leading-tight">
                            {r.name}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className="block text-slate-600 text-[12px] truncate"
                            title={r.description}
                          >
                            {r.description}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center justify-center font-bold text-slate-800 text-[12.5px] bg-slate-100 px-2.5 py-0.5 rounded-full">
                            {r.users}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <Chip
                            tone={
                              r.access === "Full Access"
                                ? "purple"
                                : r.access === "Management"
                                ? "blue"
                                : "slate"
                            }
                          >
                            {r.access}
                          </Chip>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => openRole(r)}
                            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-bold text-[#042c51] hover:bg-slate-50 transition-colors cursor-pointer shrink-0"
                          >
                            <Pencil size={12} className="shrink-0" />
                            <span>Configure</span>
                          </button>
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      <p className="text-xs font-bold text-slate-700">No roles found</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        No user access profiles match your selected search or filter.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <TablePagination
            currentPage={rolePage}
            totalPages={totalRolePages}
            totalItems={rolesShown.length}
            pageSize={pageSize}
            onPageChange={(page) => setRolePage(page)}
            itemLabel="roles"
            className="shrink-0"
          />
        </div>
      )}

      {/* TAB 2: KPI Configuration */}
      {tab === "kpis" && (
        <div className="flex flex-col flex-1 min-h-0 gap-3">
          <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden flex flex-col flex-1 min-h-0">
            <div className="overflow-auto flex-1 min-h-0 sibs-scrollbar">
              <table className="w-full table-fixed text-left text-xs border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-[#042c51] bg-[#042c51] text-[11px] font-bold uppercase tracking-wider text-white select-none shadow-xs">
                    <th className="py-3 px-4 w-[28%]">KPI Metric</th>
                    <th className="py-3 px-4 w-[24%]">Performance Target</th>
                    <th className="py-3 px-4 w-[16%]">Weight</th>
                    <th className="py-3 px-4 w-[18%]">Configuration Status</th>
                    <th className="py-3 px-4 w-[14%] text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {paginatedKpis.length > 0 ? (
                    paginatedKpis.map((k) => (
                      <tr
                        key={k.id}
                        className="hover:bg-slate-50/70 transition-colors h-[54px]"
                      >
                        <td className="py-3 px-4">
                          <span className="block font-bold text-slate-900 text-[13px] leading-tight">
                            {k.name}
                          </span>
                          <span className="text-[11px] text-slate-400">{k.type} Scorecard Measure</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-800 text-[12.5px]">
                            {k.target}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-extrabold text-[#042c51] text-[13px]">
                            {k.weight}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <Chip tone="amber">{k.status}</Chip>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => openKpi(k)}
                            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-bold text-[#042c51] hover:bg-slate-50 transition-colors cursor-pointer shrink-0"
                          >
                            <Pencil size={12} className="shrink-0" />
                            <span>Configure</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500">
                        <p className="text-xs font-bold text-slate-700">No KPI metrics found</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          No scorecard measures match your query.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <TablePagination
              currentPage={kpiPage}
              totalPages={totalKpiPages}
              totalItems={kpisShown.length}
              pageSize={pageSize}
              onPageChange={(page) => setKpiPage(page)}
              itemLabel="KPIs"
              className="shrink-0"
            />
          </div>

          {/* KPI Context Cards */}
          <div className="grid gap-3 md:grid-cols-2 shrink-0">
            <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-[#042c51]">
                <ClipboardCheck size={16} className="text-[#ff5c28]" />
                <span>Individual KPI Scorecard Framework</span>
              </div>
              <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                The six individual measures are maintained separately from account-level operational KPIs.
                Weekly case volume targets may require approved proration during holiday cycles.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-[#042c51]">
                  <BriefcaseBusiness size={16} className="text-[#042c51]" />
                  <span>Account KPI Baseline</span>
                </div>
                <Chip tone="amber">Awaiting Confirmation</Chip>
              </div>
              <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                Account KPI definitions, operational targets, formulas, and source mappings will be displayed
                once confirmed by their respective process owners.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Management Alert Rules */}
      {tab === "alerts" && (
        <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden flex flex-col flex-1 min-h-0">
          <div className="overflow-auto flex-1 min-h-0 sibs-scrollbar">
            <table className="w-full table-fixed text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-[#042c51] bg-[#042c51] text-[11px] font-bold uppercase tracking-wider text-white select-none shadow-xs">
                  <th className="py-3 px-4 w-[22%]">Alert Rule</th>
                  <th className="py-3 px-4 w-[28%]">Trigger / Condition</th>
                  <th className="py-3 px-4 w-[22%]">Recipients</th>
                  <th className="py-3 px-4 w-[10%]">Severity</th>
                  <th className="py-3 px-4 w-[9%]">Status</th>
                  <th className="py-3 px-4 w-[9%] text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {paginatedAlerts.length > 0 ? (
                  paginatedAlerts
                    .map((a) => (
                      <tr
                        key={a.id}
                        className="hover:bg-slate-50/70 transition-colors h-[54px]"
                      >
                        <td className="py-3 px-4">
                          <span className="block font-bold text-slate-900 text-[13px] leading-tight">
                            {a.name}
                          </span>
                          <span className="text-[11px] text-slate-400">{a.category}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className="block text-slate-600 text-[12px] truncate"
                            title={a.trigger}
                          >
                            {a.trigger}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className="block text-slate-600 text-[12px] truncate"
                            title={a.recipients}
                          >
                            {a.recipients}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <Chip
                            tone={
                              a.severity === "Critical"
                                ? "red"
                                : a.severity === "High"
                                ? "amber"
                                : "blue"
                            }
                          >
                            {a.severity}
                          </Chip>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <Chip tone={a.enabled ? "green" : "slate"}>
                            {a.enabled ? "Enabled" : "Disabled"}
                          </Chip>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => openAlert(a)}
                            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-bold text-[#042c51] hover:bg-slate-50 transition-colors cursor-pointer shrink-0"
                          >
                            <Pencil size={12} className="shrink-0" />
                            <span>Configure</span>
                          </button>
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      <p className="text-xs font-bold text-slate-700">No alert rules found</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        No notification conditions match your filter criteria.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <TablePagination
            currentPage={alertPage}
            totalPages={totalAlertPages}
            totalItems={alertsShown.length}
            pageSize={pageSize}
            onPageChange={(page) => setAlertPage(page)}
            itemLabel="alerts"
            className="shrink-0"
          />
        </div>
      )}

      {/* TAB 4: System & Policy Settings (Req #6, #7, #8, #9, #10, #13, #15, #16) */}
      {tab === "settings" && (
        <div className="grid gap-3 lg:grid-cols-2">
          {/* Section 1: Reporting & Account Preferences (Req #7, #14, #16) */}
          <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden flex flex-col">
            <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-3">
              <h3 className="text-xs font-bold text-[#042c51]">
                Reporting & View Preferences
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Set default reporting display options and access scope for FrontSteps accounts.
              </p>
            </div>
            <div className="space-y-3.5 p-4 flex-1">
              <Field label="Default Reporting Period">
                <SingleSelectDropdown
                  value={settings.reportingPeriod}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, reportingPeriod: e.target.value }))
                  }
                  options={[
                    { value: "Month-to-Date", label: "Month-to-Date" },
                    { value: "Monthly", label: "Monthly" },
                    { value: "Historical", label: "Historical" },
                  ]}
                  buttonClassName="h-9 rounded-lg border-slate-200 px-3 text-xs"
                />
              </Field>

              <Field label="Default Reporting View">
                <SingleSelectDropdown
                  value={settings.defaultReportView}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, defaultReportView: e.target.value }))
                  }
                  options={[
                    { value: "Internal Management", label: "Internal Management" },
                    { value: "Client Reporting", label: "Client Reporting" },
                  ]}
                  buttonClassName="h-9 rounded-lg border-slate-200 px-3 text-xs"
                />
              </Field>

              <div className="flex items-start gap-2 rounded-lg bg-slate-50 border border-slate-200/80 p-3 text-xs text-slate-600">
                <LockKeyhole size={15} className="mt-0.5 shrink-0 text-slate-400" />
                <span>
                  Report visibility automatically respects authorized module permissions,
                  regardless of the selected default display mode.
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Performance Rating Scale Settings (Req #6) */}
          <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden flex flex-col">
            <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-3">
              <h3 className="text-xs font-bold text-[#042c51]">
                Performance Rating Scale Settings
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Configure score thresholds for monthly employee performance scorecard bands.
              </p>
            </div>
            <div className="space-y-3 p-4 flex-1">
              <div className="grid grid-cols-3 gap-2.5">
                <Field label="Exceptional (≥ %)">
                  <input
                    type="number"
                    step="0.5"
                    className={inputCls}
                    value={settings.ratingExceptional}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, ratingExceptional: parseFloat(e.target.value) || 0 }))
                    }
                  />
                </Field>
                <Field label="Very Satisfactory (≥ %)">
                  <input
                    type="number"
                    step="0.5"
                    className={inputCls}
                    value={settings.ratingVerySatisfactory}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, ratingVerySatisfactory: parseFloat(e.target.value) || 0 }))
                    }
                  />
                </Field>
                <Field label="Satisfactory (≥ %)">
                  <input
                    type="number"
                    step="0.5"
                    className={inputCls}
                    value={settings.ratingSatisfactory}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, ratingSatisfactory: parseFloat(e.target.value) || 0 }))
                    }
                  />
                </Field>
              </div>

              <div className="rounded-lg bg-slate-50 border border-slate-200/70 p-2.5 text-[11px] text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span className="font-semibold text-emerald-700">Exceptional:</span>
                  <span>&ge; {settings.ratingExceptional}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-blue-700">Very Satisfactory:</span>
                  <span>{settings.ratingVerySatisfactory}% – {(settings.ratingExceptional - 0.01).toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-amber-700">Satisfactory:</span>
                  <span>{settings.ratingSatisfactory}% – {(settings.ratingVerySatisfactory - 0.01).toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-rose-700">Unsatisfactory:</span>
                  <span>&lt; {settings.ratingSatisfactory}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Coaching & PIP Workflow Configurations (Req #8, #9, #11) */}
          <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden flex flex-col">
            <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-3">
              <h3 className="text-xs font-bold text-[#042c51]">
                Coaching & PIP Workflow Settings
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Set duration defaults, review checkpoints, and authorization requirements.
              </p>
            </div>
            <div className="space-y-3 p-4 flex-1">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Coaching Follow-Up (Days)">
                  <input
                    type="number"
                    className={inputCls}
                    value={settings.coachingFollowUpDays}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, coachingFollowUpDays: parseInt(e.target.value, 10) || 0 }))
                    }
                  />
                </Field>
                <Field label="PIP Standard Duration (Days)">
                  <input
                    type="number"
                    className={inputCls}
                    value={settings.pipStandardDurationDays}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, pipStandardDurationDays: parseInt(e.target.value, 10) || 0 }))
                    }
                  />
                </Field>
              </div>

              <Toggle
                checked={settings.pipWeeklyEvaluations}
                onChange={(v) => setSettings((s) => ({ ...s, pipWeeklyEvaluations: v }))}
                label="Require Weekly PIP Evaluations"
                description="Mandates weekly supervisor check-ins during active 30-day improvement plans."
              />
              <Toggle
                checked={settings.pipHrApprovalRequired}
                onChange={(v) => setSettings((s) => ({ ...s, pipHrApprovalRequired: v }))}
                label="HR Co-Signature for PIP Creation"
                description="Requires HR endorsement alongside Operations Manager review."
              />
            </div>
          </div>

          {/* Section 4: Quarterly Incentive Settings (Req #10) */}
          <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden flex flex-col">
            <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-3">
              <h3 className="text-xs font-bold text-[#042c51]">
                Quarterly Incentive Program Settings (FS-MILESTONE-001)
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Maintain milestone bonus criteria and disbursement amounts.
              </p>
            </div>
            <div className="space-y-3 p-4 flex-1">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Bonus Amount ($ USD)">
                  <input
                    type="number"
                    className={inputCls}
                    value={settings.incentiveAmountDollars}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, incentiveAmountDollars: parseFloat(e.target.value) || 0 }))
                    }
                  />
                </Field>
                <Field label="3-Month Average Benchmark (≥ %)">
                  <input
                    type="number"
                    step="0.5"
                    className={inputCls}
                    value={settings.incentiveQualifyingAvgScore}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, incentiveQualifyingAvgScore: parseFloat(e.target.value) || 0 }))
                    }
                  />
                </Field>
              </div>

              <Toggle
                checked={settings.incentiveDisqualifyOnActivePip}
                onChange={(v) => setSettings((s) => ({ ...s, incentiveDisqualifyOnActivePip: v }))}
                label="Disqualify if Active PIP / Sanction"
                description="Strictly disqualify agents with active corrective actions during the evaluated quarter."
              />

              <div className="rounded-lg bg-amber-50 border border-amber-200/80 p-2.5 text-[11px] text-amber-900 flex items-start gap-2">
                <Info size={14} className="shrink-0 mt-0.5 text-amber-700" />
                <span>
                  Policy Reference: FrontSteps Milestone Consistency Bonus requires 3 consecutive full production months.
                </span>
              </div>
            </div>
          </div>

          {/* Save Action */}
          <div className="lg:col-span-2 flex justify-end pt-2">
            <button
              type="button"
              onClick={() => {
                setSavedSettings({ ...settings });
                showNotice("System configurations, rating scales, and workflow settings successfully saved.");
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#ff5c28] px-4 py-2 text-xs font-bold text-white hover:bg-[#e04816] transition-colors cursor-pointer shadow-xs"
            >
              <Save size={14} />
              <span>Save System Preferences</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal 0: Add / Edit User & Employee Assignment (Req #1, #4) */}
      {modal === "user" && draft && (
        <Modal
          title={draft.id ? "Edit User & Assignment" : "Add User & Assignment"}
          subtitle="Configure user profile, account role, and team/supervisor assignment."
          onClose={closeModal}
          footer={
            <>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveUser}
                disabled={!draft.name.trim() || !draft.email.trim()}
                className="rounded-lg bg-[#ff5c28] px-4 py-2 text-xs font-bold text-white hover:bg-[#e04816] transition-colors cursor-pointer disabled:opacity-40"
              >
                Save User
              </button>
            </>
          }
        >
          <div className="space-y-3.5">
            <Field label="Full Name">
              <input
                className={inputCls}
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                placeholder="e.g. Dwight Anthony Buma-at"
              />
            </Field>

            <Field label="Email Address">
              <input
                type="email"
                className={inputCls}
                value={draft.email}
                onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
                placeholder="e.g. employee@frontsteps.com"
              />
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Assigned Role">
                <SingleSelectDropdown
                  value={draft.role}
                  onChange={(e) => setDraft((d) => ({ ...d, role: e.target.value }))}
                  options={[
                    { value: "Employee", label: "Employee" },
                    { value: "Supervisor", label: "Supervisor" },
                    { value: "Operations Manager", label: "Operations Manager" },
                    { value: "WFM Analyst", label: "WFM Analyst" },
                    { value: "QTM (Quality Training Management)", label: "QTM" },
                    { value: "HR Specialist", label: "HR Specialist" },
                    { value: "Client Reporting Viewer", label: "Client Reporting Viewer" },
                    { value: "System Administrator", label: "System Administrator" },
                  ]}
                  buttonClassName="h-9 rounded-lg border-slate-200 px-3 text-xs"
                />
              </Field>

              <Field label="Team & Shift Assignment">
                <SingleSelectDropdown
                  value={draft.team}
                  onChange={(e) => setDraft((d) => ({ ...d, team: e.target.value }))}
                  options={[
                    { value: "Team Alpha (Day)", label: "Team Alpha (Day - Sarah Gomez)" },
                    { value: "Team Bravo (Mid)", label: "Team Bravo (Mid - Mark Ramos)" },
                    { value: "Team Charlie (Night)", label: "Team Charlie (Night - Alexandria Chua)" },
                    { value: "Operations", label: "Operations Management" },
                  ]}
                  buttonClassName="h-9 rounded-lg border-slate-200 px-3 text-xs"
                />
              </Field>
            </div>

            <Field label="Account Assignment">
              <input
                className={inputCls}
                value={draft.account || "FrontSteps"}
                disabled
              />
            </Field>

            <div className="pt-1">
              <Toggle
                checked={draft.status === "Active"}
                onChange={(v) => setDraft((d) => ({ ...d, status: v ? "Active" : "Inactive" }))}
                label="Account Active"
                description="Inactive accounts cannot log in or be assigned active production tickets."
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Modal 1: Configure Role */}
      {modal === "role" && draft && (
        <Modal
          title={draft.id ? "Configure Role" : "Add Role Profile"}
          subtitle="Define user access level and module-level authorization permissions."
          onClose={closeModal}
          wide
          footer={
            <>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveRole}
                disabled={!draft.name.trim()}
                className="rounded-lg bg-[#ff5c28] px-4 py-2 text-xs font-bold text-white hover:bg-[#e04816] transition-colors cursor-pointer disabled:opacity-40"
              >
                Save Role
              </button>
            </>
          }
        >
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field label="Role Name">
              <input
                className={inputCls}
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                placeholder="e.g. Operations Manager"
              />
            </Field>
            <Field label="Access Level">
              <SingleSelectDropdown
                value={draft.access}
                onChange={(e) => setDraft((d) => ({ ...d, access: e.target.value }))}
                options={[
                  { value: "Full Access", label: "Full Access" },
                  { value: "Management", label: "Management" },
                  { value: "Team Scope", label: "Team Scope" },
                  { value: "Operations", label: "Operations" },
                  { value: "Client View", label: "Client View" },
                ]}
                buttonClassName="h-9 rounded-lg border-slate-200 px-3 text-xs"
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Description">
                <input
                  className={inputCls}
                  value={draft.description}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, description: e.target.value }))
                  }
                  placeholder="Primary duties and administrative scope"
                />
              </Field>
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200/80 bg-white">
            <div className="border-b border-slate-100 bg-[#042c51] px-4 py-2.5 text-xs font-bold text-white uppercase tracking-wider">
              Module Permissions
            </div>
            <div className="grid gap-0 sm:grid-cols-2 divide-y sm:divide-y-0 divide-slate-100">
              {MODULES.map((m) => (
                <div
                  key={m}
                  className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-2.5"
                >
                  <span className="text-xs font-medium text-slate-800">{m}</span>
                  <select
                    aria-label={`${m} permission`}
                    value={draft.permissions[m] || "None"}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        permissions: { ...d.permissions, [m]: e.target.value },
                      }))
                    }
                    className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 outline-none focus:border-[#ff5c28]"
                  >
                    {["None", "View", "Manage", "Client Only"].map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-3 text-[11px] text-slate-500 leading-relaxed">
            Role updates are recorded in this interface session and will be logged to Audit Trails
            upon confirmation.
          </p>
        </Modal>
      )}

      {/* Modal 2: Configure KPI */}
      {modal === "kpi" && draft && (
        <Modal
          title="Configure KPI Metric"
          subtitle="Review target benchmark and weighting values for this measure."
          onClose={closeModal}
          footer={
            <>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveKpi}
                className="rounded-lg bg-[#ff5c28] px-4 py-2 text-xs font-bold text-white hover:bg-[#e04816] transition-colors cursor-pointer"
              >
                Save for Review
              </button>
            </>
          }
        >
          <div className="space-y-3.5">
            <Field label="KPI Metric Name">
              <input
                className={`${inputCls} bg-slate-50 text-slate-600 cursor-not-allowed`}
                value={draft.name}
                readOnly
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Performance Target">
                <input
                  className={inputCls}
                  value={draft.target}
                  onChange={(e) => setDraft((d) => ({ ...d, target: e.target.value }))}
                  placeholder="e.g. ≥ 80%"
                />
              </Field>
              <Field label="Weight">
                <input
                  className={inputCls}
                  value={draft.weight}
                  onChange={(e) => setDraft((d) => ({ ...d, weight: e.target.value }))}
                  placeholder="e.g. 15%"
                />
              </Field>
            </div>
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <AlertTriangle size={15} className="shrink-0 text-amber-600 mt-0.5" />
              <span>
                Changes to scorecard performance targets and weightings remain subject to formal WFM
                validation and operations management sign-off.
              </span>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal 3: Configure Alert Rule */}
      {modal === "alert" && draft && (
        <Modal
          title={draft.id ? "Configure Alert Rule" : "Add Alert Rule"}
          subtitle="Define operational notification thresholds and recipient routing."
          onClose={closeModal}
          footer={
            <>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveAlert}
                disabled={!draft.name.trim()}
                className="rounded-lg bg-[#ff5c28] px-4 py-2 text-xs font-bold text-white hover:bg-[#e04816] transition-colors cursor-pointer disabled:opacity-40"
              >
                Save Alert Rule
              </button>
            </>
          }
        >
          <div className="space-y-3.5">
            <Field label="Alert Name">
              <input
                className={inputCls}
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                placeholder="e.g. Critical Performance Issue"
              />
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Category">
                <SingleSelectDropdown
                  value={draft.category}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, category: e.target.value }))
                  }
                  options={[
                    { value: "Performance", label: "Performance" },
                    { value: "Coaching", label: "Coaching" },
                    { value: "Data Quality", label: "Data Quality" },
                    { value: "Performance Improvement", label: "Performance Improvement" },
                  ]}
                  buttonClassName="h-9 rounded-lg border-slate-200 px-3 text-xs"
                />
              </Field>

              <Field label="Severity">
                <SingleSelectDropdown
                  value={draft.severity}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, severity: e.target.value }))
                  }
                  options={[
                    { value: "Critical", label: "Critical" },
                    { value: "High", label: "High" },
                    { value: "Medium", label: "Medium" },
                    { value: "Low", label: "Low" },
                  ]}
                  buttonClassName="h-9 rounded-lg border-slate-200 px-3 text-xs"
                />
              </Field>
            </div>

            <Field label="Trigger Condition">
              <input
                className={inputCls}
                value={draft.trigger}
                onChange={(e) => setDraft((d) => ({ ...d, trigger: e.target.value }))}
                placeholder="Condition that triggers this management alert"
              />
            </Field>

            <Field label="Recipients">
              <input
                className={inputCls}
                value={draft.recipients}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, recipients: e.target.value }))
                }
                placeholder="Roles notified (e.g. Operations Manager, Supervisor)"
              />
            </Field>

            <div className="pt-1">
              <Toggle
                checked={draft.enabled}
                onChange={(v) => setDraft((d) => ({ ...d, enabled: v }))}
                label="Rule Enabled"
                description="Activate or suspend automated notifications for this rule."
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
