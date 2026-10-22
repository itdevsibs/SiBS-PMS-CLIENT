import React, { useMemo, useState } from "react";
import {
  Menu,
  FileText,
  Phone,
  Send,
  Folder,
  RotateCw,
  Clock,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  Users,
  BarChart2,
  Target,
  PhoneCall,
  PhoneIncoming,
  PhoneOff,
  Zap,
  Percent,
} from "lucide-react";
import SingleSelectDropdown from "../../components/common/filters/SingleSelectDropdown";

const REPORT_TYPE_OPTIONS = [
  "Bi-Hourly",
  "Weekly",
  "Monthly",
  "MTD",
  "Milestone",
];

// Calculated operational datasets reflecting the validated FrontSteps Template Summary worksheet
const SUMMARY_DATA_BY_PERIOD = {
  Monthly: {
    periodLabel: "October 2026 (Full Month)",
    status: "Validated",
    case: {
      offered: 931,
      openCases: 715,
      repeatOpen: 0,
      lt1Day: 117,
      twoDays: 84,
      gt2Days: 514,
      closed: 677,
      closedLt2Days: 322,
      handled: 686,
      backlogRate: "95.94%",
      closedSla: "47.56%",
    },
    call: {
      offeredCalls: "1,010",
      handledCalls: "970",
      unacceptedCalls: "40",
      closedCases: "677",
      asa: "24 sec",
      aht: "13.8 min",
      answerRate: "96.04%",
      unacceptedRate: "3.96%",
    },
  },
  MTD: {
    periodLabel: "Month-to-Date (Oct 1 – Oct 21, 2026)",
    status: "Validated",
    case: {
      offered: 931,
      openCases: 715,
      repeatOpen: 0,
      lt1Day: 117,
      twoDays: 84,
      gt2Days: 514,
      closed: 677,
      closedLt2Days: 322,
      handled: 686,
      backlogRate: "95.94%",
      closedSla: "47.56%",
    },
    call: {
      offeredCalls: "1,010",
      handledCalls: "970",
      unacceptedCalls: "40",
      closedCases: "677",
      asa: "24 sec",
      aht: "13.8 min",
      answerRate: "96.04%",
      unacceptedRate: "3.96%",
    },
  },
  Weekly: {
    periodLabel: "Week 42 (Oct 15 – Oct 21, 2026)",
    status: "Validated",
    case: {
      offered: 235,
      openCases: 178,
      repeatOpen: 0,
      lt1Day: 38,
      twoDays: 24,
      gt2Days: 116,
      closed: 168,
      closedLt2Days: 88,
      handled: 172,
      backlogRate: "96.63%",
      closedSla: "52.38%",
    },
    call: {
      offeredCalls: "258",
      handledCalls: "248",
      unacceptedCalls: "10",
      closedCases: "168",
      asa: "21 sec",
      aht: "13.5 min",
      answerRate: "96.12%",
      unacceptedRate: "3.88%",
    },
  },
  "Bi-Hourly": {
    periodLabel: "Interval 14:00 – 16:00 (Oct 21, 2026)",
    status: "Validated",
    case: {
      offered: 48,
      openCases: 32,
      repeatOpen: 0,
      lt1Day: 12,
      twoDays: 6,
      gt2Days: 14,
      closed: 30,
      closedLt2Days: 21,
      handled: 31,
      backlogRate: "96.88%",
      closedSla: "70.00%",
    },
    call: {
      offeredCalls: "52",
      handledCalls: "50",
      unacceptedCalls: "2",
      closedCases: "30",
      asa: "18 sec",
      aht: "13.2 min",
      answerRate: "96.15%",
      unacceptedRate: "3.85%",
    },
  },
  Milestone: {
    periodLabel: "Q3 Cumulative Milestone (Jul – Sep 2026)",
    status: "Pending Validation",
    case: {
      offered: 1840,
      openCases: 1390,
      repeatOpen: 0,
      lt1Day: 240,
      twoDays: 168,
      gt2Days: 982,
      closed: 1315,
      closedLt2Days: 630,
      handled: 1332,
      backlogRate: "95.83%",
      closedSla: "47.91%",
    },
    call: {
      offeredCalls: "2,040",
      handledCalls: "1,962",
      unacceptedCalls: "78",
      closedCases: "1,315",
      asa: "23 sec",
      aht: "13.7 min",
      answerRate: "96.18%",
      unacceptedRate: "3.82%",
    },
  },
};

// 1. CASE SUMMARY — Row 1 (6 Cards: #1 - #6)
const CASE_ROW_1_CARDS = [
  {
    key: "offered",
    title: "Offered",
    desc: "Total cases received",
    icon: Send,
    iconBg: "bg-blue-100/70 text-blue-600",
    id: "#1",
  },
  {
    key: "openCases",
    title: "Open Cases",
    desc: "Total unresolved cases",
    icon: Folder,
    iconBg: "bg-blue-100/70 text-blue-600",
    id: "#2",
  },
  {
    key: "repeatOpen",
    title: "Repeat Open Cases",
    desc: "Identified repeat open cases",
    icon: RotateCw,
    iconBg: "bg-sky-100/80 text-sky-600",
    id: "#3",
  },
  {
    key: "lt1Day",
    title: "Less Than 1 Business Day",
    desc: "Open cases < 1 business day",
    icon: Clock,
    iconBg: "bg-emerald-100/80 text-emerald-600",
    id: "#4",
  },
  {
    key: "twoDays",
    title: "2 Business Days",
    desc: "Open cases within 2 days",
    icon: Calendar,
    iconBg: "bg-amber-100/80 text-amber-600",
    id: "#5",
  },
  {
    key: "gt2Days",
    title: "More Than 2 Business Days",
    desc: "Open cases exceeding 2 days",
    icon: CalendarCheck,
    iconBg: "bg-rose-100/80 text-rose-600",
    id: "#6",
  },
];

// 1. CASE SUMMARY — Row 2 (5 Cards: #7 - #11)
const CASE_ROW_2_CARDS = [
  {
    key: "closed",
    title: "Closed",
    desc: "Total closed cases",
    icon: CheckCircle2,
    iconBg: "bg-emerald-100/80 text-emerald-600",
    id: "#7",
  },
  {
    key: "closedLt2Days",
    title: "Closed Under 2 Business Days",
    desc: "Closed within SLA threshold",
    icon: Clock,
    iconBg: "bg-emerald-100/80 text-emerald-600",
    id: "#8",
  },
  {
    key: "handled",
    title: "Handled",
    desc: "Total handled per workbook",
    icon: Users,
    iconBg: "bg-indigo-100/80 text-indigo-600",
    id: "#9",
  },
  {
    key: "backlogRate",
    title: "Backlog Handling Rate %",
    desc: "% of backlog handled",
    icon: BarChart2,
    iconBg: "bg-blue-100/80 text-blue-600",
    id: "#10",
  },
  {
    key: "closedSla",
    title: "Closed SLA %",
    desc: "% meeting closure SLA",
    icon: Target,
    iconBg: "bg-emerald-100/80 text-emerald-600",
    id: "#11",
  },
];

// 2. CALL SUMMARY — Row 1 (4 Cards: Volume & Intake #1 - #4)
const CALL_ROW_1_CARDS = [
  {
    key: "offeredCalls",
    title: "Offered Calls",
    desc: "Total inbound queue volume",
    icon: PhoneCall,
    iconBg: "bg-sky-100/80 text-sky-600",
    id: "#1",
  },
  {
    key: "handledCalls",
    title: "Handled Calls",
    desc: "Answered & handled interactions",
    icon: PhoneIncoming,
    iconBg: "bg-emerald-100/80 text-emerald-600",
    id: "#2",
  },
  {
    key: "unacceptedCalls",
    title: "Unaccepted Calls",
    desc: "Abandoned or missed in queue",
    icon: PhoneOff,
    iconBg: "bg-rose-100/80 text-rose-500",
    id: "#3",
  },
  {
    key: "closedCases",
    title: "Closed Cases",
    desc: "Case closures from call interactions",
    icon: FileText,
    iconBg: "bg-purple-100/80 text-purple-600",
    id: "#4",
  },
];

// 2. CALL SUMMARY — Row 2 (4 Cards: Efficiency & Rates #5 - #8)
const CALL_ROW_2_CARDS = [
  {
    key: "asa",
    title: "Average Speed of Answer (ASA)",
    desc: "Average wait time before answer",
    icon: Zap,
    iconBg: "bg-blue-100/80 text-blue-600",
    id: "#5",
  },
  {
    key: "aht",
    title: "Average Handling Time (AHT)",
    desc: "Average interaction duration",
    icon: Clock,
    iconBg: "bg-amber-100/80 text-amber-600",
    id: "#6",
  },
  {
    key: "answerRate",
    title: "Answer Rate %",
    desc: "Answered vs offered percentage",
    icon: BarChart2,
    iconBg: "bg-emerald-100/80 text-emerald-600",
    id: "#7",
  },
  {
    key: "unacceptedRate",
    title: "Unaccepted Rate %",
    desc: "Unaccepted vs offered ratio",
    icon: Percent,
    iconBg: "bg-rose-100/80 text-rose-500",
    id: "#8",
  },
];

export default function FrontStepsDashboardSummary({
  onNavigate,
  isSidebarHidden,
  onToggleSidebar,
}) {
  const [selectedView, setSelectedView] = useState("dashboard-summary");
  const [reportType, setReportType] = useState("Monthly");

  const handleViewChange = (newView) => {
    setSelectedView(newView);
    if (onNavigate) {
      onNavigate(newView);
    }
  };

  const currentDataset = useMemo(
    () => SUMMARY_DATA_BY_PERIOD[reportType] || SUMMARY_DATA_BY_PERIOD["Monthly"],
    [reportType]
  );

  const cCase = currentDataset.case;
  const cCall = currentDataset.call;

  const renderCard = (card, source = "case") => {
    const IconComponent = card.icon;

    return (
      <div
        key={card.key}
        className="group relative flex flex-1 flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-150 min-h-0 select-none"
      >
        {/* Top: Clean minimal icon + Title */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100/90 text-slate-600 group-hover:bg-[#042c51] group-hover:text-white transition-colors">
            <IconComponent className="h-3.5 w-3.5" strokeWidth={2} />
          </span>
          <span
            className="text-[11.5px] font-bold text-slate-700 leading-snug line-clamp-1"
            title={card.title}
          >
            {card.title}
          </span>
        </div>

        {/* Middle: Clean placeholder value */}
        <div className="my-auto py-1 flex items-baseline">
          <span className="text-3xl lg:text-[32px] font-black font-mono text-slate-300 tracking-tight leading-none group-hover:text-slate-400 transition-colors">
            —
          </span>
        </div>

        {/* Bottom: Subtitle description */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <span
            className="text-[10px] text-slate-400 font-medium line-clamp-1"
            title={card.desc}
          >
            {card.desc}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden font-jakarta text-slate-800 gap-2.5 select-none">
      {/* Global Filter Bar: View Mode Switcher and Reporting Period */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/90 bg-white px-3.5 py-2 shadow-2xs shrink-0">
        <div className="flex items-center gap-2.5">
          {isSidebarHidden && (
            <button
              type="button"
              aria-label="Expand sidebar"
              title="Expand sidebar"
              onClick={onToggleSidebar}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-[#042c51] hover:border-[#ff5c28] hover:bg-[#ff5c28] hover:text-white transition-all duration-150 cursor-pointer active:scale-95 shadow-2xs shrink-0"
            >
              <Menu className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
          <span className="text-xs font-black uppercase tracking-wider text-[#042c51]">
            View Mode:
          </span>
          <div className="w-[200px]">
            <SingleSelectDropdown
              value={selectedView}
              onChange={(e) => handleViewChange(e.target.value)}
              placeholder="Select View"
              options={[
                { value: "dashboard-summary", label: "Summary" },
                { value: "dashboard-account-based", label: "Account-based KPI" },
                { value: "dashboard-kpi-indiv", label: "KPI (PMP/PIP)" },
              ]}
              buttonClassName="h-8 rounded-lg border-slate-200 bg-slate-50/90 px-3 text-xs font-bold text-[#042c51] hover:border-slate-300 hover:bg-white shadow-2xs transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Reporting Period:
          </label>
          <div className="w-[145px]">
            <SingleSelectDropdown
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              options={REPORT_TYPE_OPTIONS.map((opt) => ({ value: opt, label: opt }))}
              buttonClassName="h-8 rounded-lg border-slate-200 bg-slate-50/70 px-3 text-xs font-bold text-slate-800 hover:border-slate-300 hover:bg-white shadow-2xs transition-all"
            />
          </div>
        </div>
      </div>

      {/* Main Content Area with maximized vertical space distribution */}
      <div className="flex flex-1 min-h-0 flex-col gap-2.5 justify-between">
        {/* 1. CASE SUMMARY SECTION (flex-[1.2] to accommodate 2 rows of 6 & 5 cards) */}
        <section className="flex flex-col gap-1.5 flex-[1.2] min-h-0 justify-between">
          {/* Section Header Bar */}
          <div className="flex items-center justify-between px-0.5 shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex h-5.5 w-5.5 items-center justify-center rounded-lg bg-[#042c51] text-white shadow-2xs">
                <FileText className="h-3 w-3" />
              </div>
              <h2 className="text-[11.5px] font-black tracking-wide uppercase text-slate-900 leading-tight">
                Case Summary
              </h2>
            </div>
            <span className="text-[9px] font-bold text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
              11 Metrics
            </span>
          </div>

          {/* Row 1: Exactly 6 Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 flex-1 min-h-0">
            {CASE_ROW_1_CARDS.map((card) => renderCard(card, "case"))}
          </div>

          {/* Row 2: Exactly 5 Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 flex-1 min-h-0">
            {CASE_ROW_2_CARDS.map((card) => renderCard(card, "case"))}
          </div>
        </section>

        {/* 2. CALL SUMMARY SECTION (flex-1 to accommodate 2 rows of 4 cards) */}
        <section className="flex flex-col gap-1.5 flex-1 min-h-0 justify-between">
          {/* Section Header Bar */}
          <div className="flex items-center justify-between px-0.5 shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex h-5.5 w-5.5 items-center justify-center rounded-lg bg-[#042c51] text-white shadow-2xs">
                <Phone className="h-3 w-3" />
              </div>
              <h2 className="text-[11.5px] font-black tracking-wide uppercase text-slate-900 leading-tight">
                Call Summary
              </h2>
            </div>
            <span className="text-[9px] font-bold text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
              8 Metrics
            </span>
          </div>

          {/* Row 1: Exactly 4 Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 flex-1 min-h-0">
            {CALL_ROW_1_CARDS.map((card) => renderCard(card, "call"))}
          </div>

          {/* Row 2: Exactly 4 Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 flex-1 min-h-0">
            {CALL_ROW_2_CARDS.map((card) => renderCard(card, "call"))}
          </div>
        </section>
      </div>
    </div>
  );
}
