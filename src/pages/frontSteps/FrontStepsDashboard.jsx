import React, { useState } from "react";
import {
  LayoutGrid,
  Users,
  ClipboardList,
  TrendingUp,
  Award,
  BarChart3,
  Database,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  History,
  CheckCircle2,
  Clock3,
  PhoneCall,
  FileCheck,
  AlertTriangle,
  ArrowUpRight,
  TrendingDown,
  Target,
  Sparkles,
  HelpCircle,
  Percent,
  Layers,
  Activity,
  Flame,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  Menu,
} from "lucide-react";

import ConfirmationModal from "@/components/common/ui/ConfirmationModal";
import LoadingModal from "@/components/common/ui/LoadingModal";
import useDashboardPage from "@/hooks/useDashboardPage";
import { getAuthUser } from "@/lib/auth";

import FrontStepsEmployeePerformance from "./FrontStepsEmployeePerformance";
import FrontStepsCoachingManagement from "./FrontStepsCoachingManagement";
import FrontStepsPerformanceImprovement from "./FrontStepsPerformanceImprovement";
import FrontStepsQuarterlyIncentives from "./FrontStepsQuarterlyIncentives";
import FrontStepsReportsAnalytics from "./FrontStepsReportsAnalytics";
import FrontStepsDataManagement from "./FrontStepsDataManagement";
import FrontStepsAdministration from "./FrontStepsAdministration";
import FrontStepsAuditTrails from "./FrontStepsAuditTrails";
import FrontStepsDashboardSummary from "./FrontStepsDashboardSummary";
import FrontStepsDashboardAccountBased from "./FrontStepsDashboardAccountBased";
import FrontStepsDashboardKPIIndiv from "./FrontStepsDashboardKPIIndiv";

// Navigation definition matching the exact sidebar group requirements
const FRONTSTEPS_MODULES = [
  {
    key: "overview",
    name: "Overview",
    icon: LayoutGrid,
    submodules: [
      { id: "dashboard-summary", name: "Summary", icon: Activity },
      { id: "dashboard-account-based", name: "Account-based KPI", icon: Target },
      { id: "dashboard-kpi-indiv", name: "KPI (PMP/PIP)", icon: TrendingUp },
    ],
  },
  {
    key: "performance-management",
    name: "Performance Management",
    icon: Users,
    submodules: [
      { id: "employee-performance", name: "Employee Performance", icon: Users },
      { id: "coaching-management", name: "Coaching Management", icon: ClipboardList },
      { id: "performance-improvement", name: "Performance Improvement", icon: TrendingUp },
      { id: "quarterly-incentives", name: "Quarterly Incentives", icon: Award },
    ],
  },
  {
    key: "reporting-data",
    name: "Reporting & Data",
    icon: BarChart3,
    submodules: [
      { id: "reports-analytics", name: "Reports & Analytics", icon: BarChart3 },
      { id: "data-management", name: "Data Management", icon: Database },
    ],
  },
  {
    key: "system",
    name: "System",
    icon: Settings,
    submodules: [
      { id: "administration", name: "Administration", icon: Settings },
      { id: "audit-trails", name: "Audit Trails", icon: ShieldCheck },
    ],
  },
];

export default function FrontStepsDashboard() {
  const dashboard = useDashboardPage();
  const userName = dashboard.authUser?.name || dashboard.authUser?.username || "User";

  // Check URL query param, hash, or localStorage to preserve active submodule across browser refreshes
  const getInitialSubmoduleId = () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const paramTab = urlParams.get("tab") || urlParams.get("module");
      if (paramTab) return paramTab;

      const hashTab = window.location.hash.replace("#", "").trim();
      if (hashTab) return hashTab;

      const savedTab = localStorage.getItem("frontsteps_active_tab");
      if (savedTab) {
        if (savedTab === "dashboard") return "dashboard-summary";
        return savedTab;
      }
    } catch {
      // fallback
    }
    return "dashboard-summary";
  };

  const [activeSubmoduleId, setActiveSubmoduleId] = useState(getInitialSubmoduleId);
  const [activeDashboardSection, setActiveDashboardSection] = useState("all"); // 'all' | 'summary' | 'account-kpi' | 'pmp-pip'
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const authUser = getAuthUser();
  const fullNameFromParts = [
    authUser?.firstName,
    authUser?.middleName,
    authUser?.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
  const displayName =
    authUser?.fullName ||
    authUser?.name ||
    fullNameFromParts ||
    authUser?.username ||
    authUser?.sibs_id ||
    userName ||
    "User";
  const displayEmail = authUser?.email || authUser?.roleLabel || "user@thesiblingssolutions.com";
  const userInitial = displayName?.charAt(0)?.toUpperCase() || "U";
  const avatarSrc =
    authUser?.avatar ||
    authUser?.profile_photo ||
    authUser?.photo ||
    authUser?.photo_url ||
    authUser?.image ||
    authUser?.profile_image ||
    authUser?.avatar_url ||
    authUser?.picture ||
    authUser?.gy_emp_photo ||
    null;

  // Sync active submodule to localStorage and URL search params whenever it changes
  const handleSelectSubmodule = (subId) => {
    setActiveSubmoduleId(subId);
    try {
      localStorage.setItem("frontsteps_active_tab", subId);
      const url = new URL(window.location.href);
      url.searchParams.set("tab", subId);
      window.history.replaceState({}, "", url.toString());
    } catch {
      // ignore
    }
  };

  // Keep all parent dropdown modules open by default
  const [expandedParents, setExpandedParents] = useState(() =>
    FRONTSTEPS_MODULES.map((m) => m.key),
  );

  const toggleExpand = (moduleKey) => {
    setExpandedParents((prev) =>
      prev.includes(moduleKey)
        ? prev.filter((k) => k !== moduleKey)
        : [...prev, moduleKey],
    );
  };

  // Find active label for header
  const allSubmodules = FRONTSTEPS_MODULES.flatMap((m) => m.submodules);
  const currentSubmodule = allSubmodules.find((sub) => sub.id === activeSubmoduleId);
  const activeTitle = currentSubmodule ? currentSubmodule.name : "FrontSteps";

  // Render the dashboard with 3 distinct sections: Summary, Account-based KPI, KPI(PMP/PIP)
  const renderDashboardView = () => (
    <div className="flex flex-col h-full min-h-full gap-3 overflow-y-auto pr-1 sibs-scrollbar font-jakarta">
      {/* Top Filter & Section Navigator Bar */}
      <div className="rounded-xl border border-slate-200/80 bg-white px-3.5 py-2.5 shadow-xs shrink-0 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#042c51] text-white">
            <LayoutGrid size={15} />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-800 leading-tight">FrontSteps Operational Dashboard</h2>
            <p className="text-[10.5px] text-slate-400">Integrated Overview • October 2026</p>
          </div>
        </div>

        {/* 3 Section Quick Switcher */}
        <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50/80 p-0.5">
          <button
            type="button"
            onClick={() => setActiveDashboardSection("all")}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeDashboardSection === "all"
                ? "bg-white text-[#042c51] shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All Sections
          </button>
          <button
            type="button"
            onClick={() => setActiveDashboardSection("summary")}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeDashboardSection === "summary"
                ? "bg-white text-[#042c51] shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            1. Summary
          </button>
          <button
            type="button"
            onClick={() => setActiveDashboardSection("account-kpi")}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeDashboardSection === "account-kpi"
                ? "bg-white text-[#042c51] shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            2. Account-based KPI
          </button>
          <button
            type="button"
            onClick={() => setActiveDashboardSection("pmp-pip")}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeDashboardSection === "pmp-pip"
                ? "bg-white text-[#042c51] shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            3. KPI (PMP/PIP)
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION 1: SUMMARY                                       */}
      {/* ======================================================== */}
      {(activeDashboardSection === "all" || activeDashboardSection === "summary") && (
        <section className="space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#042c51] text-white text-[11px] font-bold">
                1
              </span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Summary
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">
                • High-level operational metrics & throughput
              </span>
            </div>
            <span className="text-[10.5px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Live Feed: Oct 2026
            </span>
          </div>

          {/* 4 Summary Indicator Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Card 1: Avg Final KPI Score */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                    Avg Final KPI Score
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-extrabold text-slate-900">91.4%</span>
                    <span className="inline-flex items-center gap-0.5 rounded bg-emerald-50 px-1.5 py-0.5 text-[10.5px] font-bold text-emerald-700 border border-emerald-200">
                      <ArrowUpRight size={11} /> +2.1%
                    </span>
                  </div>
                  <span className="block text-[10.5px] text-slate-400 mt-1">
                    Benchmarked vs 85.0% Target
                  </span>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
                  <Award size={16} />
                </div>
              </div>
            </div>

            {/* Card 2: Total Closed Cases */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                    Total Closed Cases
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-extrabold text-slate-900">1,542</span>
                    <span className="inline-flex items-center gap-0.5 rounded bg-emerald-50 px-1.5 py-0.5 text-[10.5px] font-bold text-emerald-700 border border-emerald-200">
                      <ArrowUpRight size={11} /> +4.8%
                    </span>
                  </div>
                  <span className="block text-[10.5px] text-slate-400 mt-1">
                    MTD Case Resolution Target: 1,400
                  </span>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
                  <CheckCircle2 size={16} />
                </div>
              </div>
            </div>

            {/* Card 3: Answer Rate */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                    Answer Rate
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-extrabold text-slate-900">96.0%</span>
                    <span className="inline-flex items-center gap-0.5 rounded bg-emerald-50 px-1.5 py-0.5 text-[10.5px] font-bold text-emerald-700 border border-emerald-200">
                      <ArrowUpRight size={11} /> +1.2%
                    </span>
                  </div>
                  <span className="block text-[10.5px] text-slate-400 mt-1">
                    970 answered / 1,010 offered
                  </span>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
                  <PhoneCall size={16} />
                </div>
              </div>
            </div>

            {/* Card 4: Quarterly Bonus Qualified */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                    Quarterly Bonus Qualified
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-extrabold text-[#ff5c28]">9 / 12</span>
                    <span className="inline-flex items-center rounded bg-orange-50 px-1.5 py-0.5 text-[10.5px] font-bold text-[#ff5c28] border border-orange-200">
                      75.0%
                    </span>
                  </div>
                  <span className="block text-[10.5px] text-slate-400 mt-1">
                    Q3 Retention Bonus Qualified ($40/ea)
                  </span>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-[#ff5c28] border border-orange-100">
                  <Flame size={16} />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* SECTION 2: ACCOUNT-BASED KPI                             */}
      {/* ======================================================== */}
      {(activeDashboardSection === "all" || activeDashboardSection === "account-kpi") && (
        <section className="space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#042c51] text-white text-[11px] font-bold">
                2
              </span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Account-based KPI
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">
                • FrontSteps approved KPI weights, actuals, & SLA adherence
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleSelectSubmodule("employee-performance")}
              className="text-[11px] font-semibold text-[#ff5c28] hover:underline cursor-pointer"
            >
              View Full Scorecards →
            </button>
          </div>

          {/* 6 Account KPIs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* KPI 1: Cases Closed */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Weight: 45% (Highest)
                  </span>
                  <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                    Exceeded
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-800 mt-1">Cases Closed</h4>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-extrabold text-slate-900">146</span>
                  <span className="text-xs font-medium text-slate-400">/ 140 target / week</span>
                </div>
              </div>
              <div className="mt-2.5">
                <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                  <span>Adherence</span>
                  <span className="font-semibold text-emerald-600">104.2%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: "100%" }} />
                </div>
              </div>
            </div>

            {/* KPI 2: Average Handle Time */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Weight: 10%
                  </span>
                  <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                    Within Limit
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-800 mt-1">Average Handle Time</h4>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-extrabold text-slate-900">13.8 min</span>
                  <span className="text-xs font-medium text-slate-400">/ ≤ 15.0 min target</span>
                </div>
              </div>
              <div className="mt-2.5">
                <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                  <span>Target Margin</span>
                  <span className="font-semibold text-emerald-600">828 sec (Compliant)</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: "92%" }} />
                </div>
              </div>
            </div>

            {/* KPI 3: AHT Compliance */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Weight: 15%
                  </span>
                  <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                    Compliant
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-800 mt-1">AHT Compliance</h4>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-extrabold text-slate-900">84.5%</span>
                  <span className="text-xs font-medium text-slate-400">/ ≥ 80.0% target</span>
                </div>
              </div>
              <div className="mt-2.5">
                <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                  <span>Adherence</span>
                  <span className="font-semibold text-emerald-600">105.6%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: "85%" }} />
                </div>
              </div>
            </div>

            {/* KPI 4: Resolution Completion */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Weight: 10%
                  </span>
                  <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                    Perfect
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-800 mt-1">Resolution Completion</h4>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-extrabold text-slate-900">100.0%</span>
                  <span className="text-xs font-medium text-slate-400">/ 100.0% target</span>
                </div>
              </div>
              <div className="mt-2.5">
                <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                  <span>Adherence</span>
                  <span className="font-semibold text-emerald-600">100.0%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: "100%" }} />
                </div>
              </div>
            </div>

            {/* KPI 5: Resolution Sub Code Completion */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Weight: 10%
                  </span>
                  <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                    Met
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-800 mt-1">Resolution Sub Code Completion</h4>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-extrabold text-slate-900">96.8%</span>
                  <span className="text-xs font-medium text-slate-400">/ ≥ 95.0% target</span>
                </div>
              </div>
              <div className="mt-2.5">
                <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                  <span>Adherence</span>
                  <span className="font-semibold text-emerald-600">101.9%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: "97%" }} />
                </div>
              </div>
            </div>

            {/* KPI 6: Case Summary Completion */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Weight: 10%
                  </span>
                  <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                    Met
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-800 mt-1">Case Summary Completion</h4>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-extrabold text-slate-900">97.2%</span>
                  <span className="text-xs font-medium text-slate-400">/ ≥ 95.0% target</span>
                </div>
              </div>
              <div className="mt-2.5">
                <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                  <span>Adherence</span>
                  <span className="font-semibold text-emerald-600">102.3%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: "97%" }} />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* SECTION 3: KPI (PMP / PIP)                               */}
      {/* ======================================================== */}
      {(activeDashboardSection === "all" || activeDashboardSection === "pmp-pip") && (
        <section className="space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#042c51] text-white text-[11px] font-bold">
                3
              </span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                KPI (PMP / PIP)
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">
                • Performance Improvement Plans, coaching workflows, & rating bands
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleSelectSubmodule("performance-improvement")}
              className="text-[11px] font-semibold text-[#ff5c28] hover:underline cursor-pointer"
            >
              Open PIP Module →
            </button>
          </div>

          {/* Grid: PIP Status Cards + Coaching Pipeline + Performance Rating Bands */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            {/* Left 7 Cols: Active PIPs & Coaching Snapshot */}
            <div className="lg:col-span-7 flex flex-col gap-3">
              {/* PIP Metric Summary Row */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Active PIPs
                  </span>
                  <span className="text-xl font-extrabold text-amber-600 block mt-0.5">1</span>
                  <span className="text-[10px] text-slate-400">Patrick Sean Reyes</span>
                </div>

                <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Successfully Closed
                  </span>
                  <span className="text-xl font-extrabold text-emerald-600 block mt-0.5">1</span>
                  <span className="text-[10px] text-slate-400">John Rafael Dizon</span>
                </div>

                <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Under Monitoring
                  </span>
                  <span className="text-xl font-extrabold text-blue-600 block mt-0.5">2</span>
                  <span className="text-[10px] text-slate-400">Day 14 & Day 30 milestones</span>
                </div>
              </div>

              {/* Coaching Pipeline Breakdown */}
              <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-800">Coaching Management Pipeline</h4>
                  <span className="text-[10.5px] font-semibold text-slate-500">8 Sessions Logged</span>
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-600 font-medium">Scheduled &amp; In Progress</span>
                      <span className="font-bold text-slate-800">5 (62.5%)</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: "62.5%" }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-600 font-medium">Completed / Resolved</span>
                      <span className="font-bold text-slate-800">2 (25.0%)</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: "25%" }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-600 font-medium">Pending Follow-up / Overdue</span>
                      <span className="font-bold text-slate-800">1 (12.5%)</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-rose-500 rounded-full" style={{ width: "12.5%" }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 5 Cols: Performance Rating Bands (PMP Distribution) */}
            <div className="lg:col-span-5 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                  <h4 className="text-xs font-bold text-slate-800">Approved PMP Performance Ratings</h4>
                  <span className="text-[10px] text-slate-400 font-mono">FrontSteps Scale</span>
                </div>
                <div className="space-y-2">
                  {/* Band 1: Outstanding */}
                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-emerald-50/60 border border-emerald-100 text-xs">
                    <div>
                      <span className="font-bold text-emerald-800">Outstanding (≥ 95.0%)</span>
                      <span className="text-[10px] text-emerald-600 block">Top Tier Payout</span>
                    </div>
                    <span className="text-xs font-extrabold text-emerald-700 font-mono">2 Agents</span>
                  </div>

                  {/* Band 2: Very Satisfactory */}
                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-blue-50/60 border border-blue-100 text-xs">
                    <div>
                      <span className="font-bold text-blue-800">Very Satisfactory (90.0% – 94.9%)</span>
                      <span className="text-[10px] text-blue-600 block">Standard Incentive Tier</span>
                    </div>
                    <span className="text-xs font-extrabold text-blue-700 font-mono">6 Agents</span>
                  </div>

                  {/* Band 3: Satisfactory */}
                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                    <div>
                      <span className="font-bold text-slate-800">Satisfactory (80.0% – 89.9%)</span>
                      <span className="text-[10px] text-slate-500 block">Baseline Performance</span>
                    </div>
                    <span className="text-xs font-extrabold text-slate-700 font-mono">3 Agents</span>
                  </div>

                  {/* Band 4: Needs Improvement (PIP Trigger) */}
                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-rose-50/60 border border-rose-100 text-xs">
                    <div>
                      <span className="font-bold text-rose-800">Needs Improvement (&lt; 80.0%)</span>
                      <span className="text-[10px] text-rose-600 block">Automatic PIP Referral</span>
                    </div>
                    <span className="text-xs font-extrabold text-rose-700 font-mono">1 Agent</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 text-[10.5px] text-slate-400 border-t border-slate-100 flex items-center justify-between mt-2">
                <span>Total Roster: 12 Agents</span>
                <span className="font-semibold text-emerald-600">91.7% Passing Rate</span>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );

  // Render the appropriate active module view
  const renderModuleView = () => {
    const commonProps = {
      onNavigate: handleSelectSubmodule,
      isSidebarHidden,
      onToggleSidebar: () => setIsSidebarHidden((prev) => !prev),
    };

    switch (activeSubmoduleId) {
      case "dashboard":
      case "dashboard-summary":
        return <FrontStepsDashboardSummary {...commonProps} />;
      case "dashboard-account-based":
        return <FrontStepsDashboardAccountBased {...commonProps} />;
      case "dashboard-kpi-indiv":
        return <FrontStepsDashboardKPIIndiv {...commonProps} />;
      case "employee-performance":
        return <FrontStepsEmployeePerformance {...commonProps} />;
      case "coaching-management":
        return <FrontStepsCoachingManagement {...commonProps} />;
      case "performance-improvement":
        return <FrontStepsPerformanceImprovement {...commonProps} />;
      case "quarterly-incentives":
        return <FrontStepsQuarterlyIncentives {...commonProps} />;
      case "reports-analytics":
        return <FrontStepsReportsAnalytics {...commonProps} />;
      case "data-management":
        return <FrontStepsDataManagement {...commonProps} />;
      case "administration":
        return <FrontStepsAdministration {...commonProps} />;
      case "audit-trails":
        return <FrontStepsAuditTrails {...commonProps} />;
      default:
        return <FrontStepsDashboardSummary {...commonProps} />;
    }
  };

  const renderSidebarContent = (isMobile = false) => {
    const collapsed = isCollapsed && !isMobile;

    return (
      <div className="flex h-full flex-col bg-[#042c51] text-white">
        {/* Brand Header */}
        <div className={`sibs-sidebar-brand-row ${collapsed ? "collapsed" : ""}`}>
          <div className={`sibs-sidebar-brand ${collapsed ? "justify-center" : "items-center"}`}>
            <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#ff5c28] to-[#ff4713] text-[20px] font-extrabold text-white shadow-xs">
              FS
              <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-white shadow-xs" />
            </span>
            {!collapsed && (
              <span className="flex min-w-0 flex-1 flex-col justify-center leading-none">
                <span className="whitespace-nowrap font-sans text-[20.5px] font-extrabold leading-[23px] tracking-tight text-white">
                  <span className="text-[#ff7247]">SiBS</span> PMS
                </span>
                <span className="mt-1 block whitespace-nowrap font-sans text-[8px] font-bold uppercase leading-tight tracking-[0.05em] text-[#9fb2c5]">
                  FRONTSTEPS MANAGEMENT
                </span>
              </span>
            )}
          </div>

          {!isMobile && (
            <button
              type="button"
              aria-label="Hide sidebar"
              title="Hide sidebar totally"
              onClick={() => setIsSidebarHidden(true)}
              className="sibs-sidebar-toggle"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Scrollable Navigation Body */}
        <div className={`sibs-sidebar-scroll py-3 flex-1 overflow-y-auto ${collapsed ? "px-2" : "px-3"}`}>
          <div className="mb-4">
            <p
              className={`mb-2 px-3 text-[10.5px] font-bold uppercase tracking-wider text-[#90a1b9] ${
                collapsed ? "text-center text-[9.5px] px-0" : ""
              }`}
            >
              {collapsed ? "Menu" : "MODULES"}
            </p>

            <nav className="flex flex-col gap-1" aria-label="FrontSteps navigation">
              {FRONTSTEPS_MODULES.map((item) => {
                const Icon = item.icon;
                const isExpanded = expandedParents.includes(item.key);
                const isParentActive = item.submodules.some((sub) => sub.id === activeSubmoduleId);

                return (
                  <div key={item.key} className="flex flex-col">
                    {/* Main parent row */}
                    <div
                      className={`group flex h-[38px] w-full items-center rounded-xl transition-all duration-150 ${
                        isParentActive
                          ? "bg-white/[0.12] text-white font-bold"
                          : "text-[#cad5e2] hover:bg-white/[0.08] hover:text-white"
                      } ${collapsed ? "justify-center px-0" : "px-3"}`}
                    >
                      <button
                        type="button"
                        title={item.name}
                        onClick={() => toggleExpand(item.key)}
                        className={`flex flex-1 min-w-0 cursor-pointer items-center gap-3 border-0 bg-transparent p-0 text-left font-semibold text-inherit outline-none ${
                          collapsed ? "h-[38px] w-[38px] justify-center" : ""
                        }`}
                      >
                        <Icon
                          className={`h-[19px] w-[19px] shrink-0 transition-colors ${
                            isParentActive ? "text-white" : "text-[#90a1b9] group-hover:text-white"
                          }`}
                          strokeWidth={1.9}
                          aria-hidden="true"
                        />
                        {!collapsed && (
                          <span className="min-w-0 flex-1 truncate text-left text-[12.5px] font-semibold leading-5 tracking-normal">
                            {item.name}
                          </span>
                        )}
                      </button>

                      {!collapsed && (
                        <button
                          type="button"
                          aria-label={isExpanded ? `Collapse ${item.name}` : `Expand ${item.name}`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleExpand(item.key);
                          }}
                          className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent p-0 transition-all hover:bg-white/10 outline-none text-[#90a1b9] hover:text-white"
                        >
                          <ChevronDown
                            size={14}
                            strokeWidth={2.2}
                            className={`transform transition-transform duration-300 ease-in-out ${
                              isExpanded ? "rotate-180" : "rotate-0"
                            }`}
                          />
                        </button>
                      )}
                    </div>

                    {/* Smooth Submodules Accordion (with exact vertical border-left branch line) */}
                    {!collapsed && (
                      <div
                        className="grid transition-all duration-300 ease-in-out"
                        style={{
                          gridTemplateRows: isExpanded ? "1fr" : "0fr",
                          opacity: isExpanded ? 1 : 0,
                          marginTop: isExpanded ? "0.25rem" : "0rem",
                          pointerEvents: isExpanded ? "auto" : "none",
                        }}
                      >
                        <div className="overflow-hidden">
                          <div className="relative ml-5 flex flex-col gap-0.5 border-l-2 border-white/20 pl-2.5 py-0.5">
                            {item.submodules.map((sub) => {
                              const SubIcon = sub.icon;
                              const isSubActive = activeSubmoduleId === sub.id;

                              return (
                                <button
                                  key={sub.id}
                                  type="button"
                                  title={sub.name}
                                  onClick={() => {
                                    handleSelectSubmodule(sub.id);
                                    if (isMobile) setIsMobileOpen(false);
                                  }}
                                  className={`group/sub flex h-[32px] w-full cursor-pointer items-center gap-2.5 rounded-lg border-0 px-2.5 text-left text-[12px] font-medium transition-all duration-150 ${
                                    isSubActive
                                      ? "bg-[#ff5c28] text-white font-bold shadow-xs hover:!bg-[#ff5c28] hover:!text-white"
                                      : "text-[#cad5e2] hover:bg-white/[0.08] hover:text-white"
                                  }`}
                                >
                                  {SubIcon && (
                                    <SubIcon
                                      className={`h-3.5 w-3.5 shrink-0 transition-colors ${
                                        isSubActive
                                          ? "text-white"
                                          : "text-[#90a1b9] group-hover/sub:text-white"
                                      }`}
                                      strokeWidth={1.8}
                                      aria-hidden="true"
                                    />
                                  )}
                                  <span className="min-w-0 flex-1 truncate text-left">
                                    {sub.name}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom User Profile Section */}
        <div className="relative mt-auto border-t border-white/10 p-3">
          {/* User Profile Dropdown Popover (Crisp White Card) */}
          {isUserMenuOpen && (
            <div
              className="absolute bottom-[calc(100%+0.5rem)] left-2 right-2 z-[999] overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-2 shadow-2xl shadow-slate-900/20"
              role="menu"
            >
              <div className="px-2.5 py-2 border-b border-slate-100 mb-1.5">
                <p className="text-[11.5px] font-extrabold uppercase tracking-tight text-slate-900 truncate">
                  {displayName}
                </p>
                <p className="text-[10.5px] font-semibold text-[#ff5c28] truncate">
                  {displayEmail}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsUserMenuOpen(false);
                  dashboard.setShowLogoutModal(true);
                }}
                className="flex w-full items-center gap-2.5 rounded-xl border-0 bg-[#fff1f1] px-3 py-2 text-left text-xs font-bold text-[#ef4444] hover:bg-[#ffe5e5] transition cursor-pointer"
                role="menuitem"
              >
                <LogOut className="h-4 w-4 shrink-0 text-[#ef4444]" aria-hidden="true" />
                <span>Logout</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex w-full items-center gap-2.5 rounded-xl border border-white/15 bg-white/10 p-2 text-left transition-all duration-150 hover:bg-white/20 hover:border-white/25 cursor-pointer group"
          >
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={displayName}
                className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-white/30"
              />
            ) : (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#ff5c28] text-xs font-black text-white shadow-xs">
                {userInitial}
              </span>
            )}

            <div className="min-w-0 flex-1 flex flex-col justify-center">
              <span
                className="block truncate text-[11.5px] font-bold text-white group-hover:text-white"
                title={displayName}
              >
                {displayName}
              </span>
              <span
                className="block truncate text-[10px] font-semibold text-white/80"
                title={displayEmail}
              >
                {displayEmail}
              </span>
            </div>

            <ChevronDown
              className={`h-4 w-4 shrink-0 text-white/80 transition-transform duration-200 group-hover:text-white ${
                isUserMenuOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      </div>
    );
  };

  return (
    <section className="font-jakarta relative flex h-screen max-h-[100dvh] min-h-screen bg-[#eef3f7] text-sibs-primary-1 overflow-hidden">
      {/* Desktop Sidebar matching AdminSidebar CSS */}
      {/* Desktop Sidebar with buttery smooth slide & collapse animation */}
      <aside
        className={`sibs-sidebar hidden border-r border-[#0d3b66] bg-[#042c51] text-white shadow-sm md:flex transition-all duration-300 ease-in-out ${
          isSidebarHidden
            ? "!w-0 !min-w-0 !border-0 opacity-0 -translate-x-4 pointer-events-none overflow-hidden"
            : "!w-[260px] opacity-100 translate-x-0 overflow-visible"
        } ${isCollapsed && !isSidebarHidden ? "collapsed" : ""}`}
      >
        <div className="w-[260px] h-full flex flex-col shrink-0 overflow-visible relative">
          {renderSidebarContent(false)}
        </div>
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setIsMobileOpen(false)}
          className="sibs-sidebar-backdrop z-[95] md:hidden"
        />
      )}
      <aside
        className={`sibs-sidebar mobile z-[100] !w-[260px] max-w-[calc(100vw-2rem)] border-r border-[#0d3b66] bg-[#042c51] text-white shadow-2xl sm:!w-[280px] md:hidden ${
          isMobileOpen ? "mobile-open" : ""
        }`}
      >
        {renderSidebarContent(true)}
      </aside>

      {/* Main View Area */}
      <main className="min-w-0 flex-1 flex flex-col h-full overflow-hidden transition-all duration-300 ease-in-out">
        {/* Module Content View: Full stretch without empty left gaps */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-2.5 sm:px-4 lg:px-5 pb-2.5 pt-2.5 sm:pb-3 sm:pt-3 transition-all duration-300 ease-in-out">
          {renderModuleView()}
        </div>
      </main>

      {/* Confirmation & Loading Modals */}
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
