import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Award,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  Calendar,
  BarChart3,
  TrendingUp,
  ShieldCheck,
  Paperclip,
  Eye,
  Activity,
  PhoneCall,
  CheckCircle,
  HelpCircle,
  ChevronRight,
  ExternalLink,
  Info,
} from "lucide-react";
import DatePicker from "../../components/common/filters/DatePicker";

export default function FrontStepsViewPerformanceModal({ employee, onClose, formatReportingPeriod }) {
  const [activeTab, setActiveTab] = useState("scorecard");
  const [trendPeriod, setTrendPeriod] = useState("monthly");
  // Performance History: Selected Date (e.g., 2026-10-21 or historical months)
  const [selectedDate, setSelectedDate] = useState("2026-10-21");
  // KPI Breakdown modal state
  const [selectedKpiForBreakdown, setSelectedKpiForBreakdown] = useState(null);

  // Escape key handler to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!employee) return null;

  // Selected month derived from selectedDate (e.g., "2026-10")
  const currentMonthKey = selectedDate ? selectedDate.slice(0, 7) : "2026-10";

  // Historical month profile configurations for realistic drill-down
  const HISTORICAL_MONTHS_MAP = {
    "2026-10": {
      periodLabel: "October 2026",
      score: typeof employee.score === "number" ? employee.score : 92.5,
      rating: employee.rating || "Exceptional",
      status: employee.status || "Validated",
      attendanceRate: "98.20%",
      adherenceRate: "95.40%",
      omniAvailability: "92.80%",
      cancelledCalls: "3 calls",
      technicalIncidents: "1 Incident Documented (Approved)",
    },
    "2026-09": {
      periodLabel: "September 2026",
      score: 89.25,
      rating: "Satisfactory",
      status: "Validated",
      attendanceRate: "96.50%",
      adherenceRate: "94.10%",
      omniAvailability: "90.40%",
      cancelledCalls: "5 calls",
      technicalIncidents: "0 Incidents",
    },
    "2026-08": {
      periodLabel: "August 2026",
      score: 91.80,
      rating: "Very Satisfactory",
      status: "Validated",
      attendanceRate: "99.00%",
      adherenceRate: "96.20%",
      omniAvailability: "93.50%",
      cancelledCalls: "2 calls",
      technicalIncidents: "0 Incidents",
    },
    "2026-07": {
      periodLabel: "July 2026",
      score: 84.10,
      rating: "Unsatisfactory",
      status: "Validated",
      attendanceRate: "93.00%",
      adherenceRate: "89.50%",
      omniAvailability: "87.20%",
      cancelledCalls: "8 calls",
      technicalIncidents: "2 Incidents Documented",
    },
  };

  const activePeriodData = HISTORICAL_MONTHS_MAP[currentMonthKey] || {
    periodLabel: formatReportingPeriod(currentMonthKey),
    score: typeof employee.score === "number" ? employee.score : 88.5,
    rating: employee.rating || "Satisfactory",
    status: employee.status || "Validated",
    attendanceRate: "97.00%",
    adherenceRate: "94.00%",
    omniAvailability: "91.00%",
    cancelledCalls: "4 calls",
    technicalIncidents: "0 Incidents",
  };

  // Dynamic calculations based on active period
  const activeScore = activePeriodData.score;
  const activeRating = activePeriodData.rating;
  const activeStatus = activePeriodData.status;

  const isValidated = activeStatus === "Validated";
  const isPending = activeStatus === "Pending Validation";
  const isCorrected = activeStatus === "Corrected";
  const isIncomplete = activeStatus === "Incomplete";
  const isUnvalidated = activeStatus === "Unvalidated";

  // Rating badge helper
  const getRatingBadge = (rating) => {
    switch (rating) {
      case "Exceptional":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200/80";
      case "Very Satisfactory":
        return "bg-blue-50 text-blue-700 border border-blue-200/80";
      case "Satisfactory":
        return "bg-amber-50 text-amber-700 border border-amber-200/80";
      case "Unsatisfactory":
        return "bg-rose-50 text-rose-700 border border-rose-200/80";
      default:
        return "bg-slate-100 text-slate-500 border border-slate-200";
    }
  };

  // Status badge helper
  const getStatusBadge = (status) => {
    switch (status) {
      case "Validated":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200/80";
      case "Pending Validation":
        return "bg-amber-50 text-amber-700 border border-amber-200/80";
      case "Incomplete":
        return "bg-rose-50 text-rose-700 border border-rose-200/80";
      case "Corrected":
        return "bg-purple-50 text-purple-700 border border-purple-200/80";
      case "Unvalidated":
        return "bg-slate-100 text-slate-600 border border-slate-200";
      default:
        return "bg-slate-100 text-slate-500 border border-slate-200";
    }
  };

  // Six documented KPIs per FrontSteps PMP scaled to active period score
  const scoreFactor = typeof activeScore === "number" ? activeScore / 100 : 0.88;
  const closedCasesCount = Math.round(144 * scoreFactor);
  const ahtSeconds = Math.round(910 - (scoreFactor * 60));
  const ahtMinutesStr = `${Math.floor(ahtSeconds / 60)}m ${ahtSeconds % 60}s`;
  const ahtCompliancePct = (Math.min(94, 76 + scoreFactor * 15)).toFixed(1);
  const resolutionPct = (Math.min(100, 96 + scoreFactor * 4)).toFixed(1);
  const subCodePct = (Math.min(99, 91 + scoreFactor * 8)).toFixed(1);
  const caseSummaryPct = (Math.min(99.5, 93 + scoreFactor * 6)).toFixed(1);

  const kpiItems = [
    {
      id: "cases_closed",
      name: "Cases Closed",
      target: "140 weekly, subject to approved proration",
      actual: isIncomplete ? "—" : `${closedCasesCount} cases/wk`,
      weight: "45%",
      earned: isIncomplete ? "—" : (45 * Math.min(1.05, scoreFactor * 1.02)).toFixed(2),
      status: isIncomplete ? "Missing Data" : isPending ? "Pending Validation" : scoreFactor >= 0.85 ? "Meeting Target" : "Below Target",
      formula: "Weekly Closed Cases = (Total Validated Cases Closed) / (Active Production Weeks Adjusted for Proration)",
      numerator: `${closedCasesCount * 4} Total Verified Closed Cases`,
      denominator: "4 Production Weeks (160 Productive Shift Hours)",
      sourceDataset: "Salesforce CRM Case Audit Extract (Raw Closed Case Feed)",
      note: "Approved leave, training, holidays, or partial production days may adjust the weekly target according to approved proration rules.",
    },
    {
      id: "aht",
      name: "Average Handle Time (AHT)",
      target: "≤15 minutes (900 seconds)",
      actual: isIncomplete ? "—" : `${ahtSeconds}s (${ahtMinutesStr})`,
      weight: "10%",
      earned: isIncomplete ? "—" : (10 * (scoreFactor >= 0.85 ? 1 : 0.75)).toFixed(2),
      status: isIncomplete ? "Missing Data" : isPending ? "Pending Validation" : scoreFactor >= 0.85 ? "Meeting Target" : "Below Target",
      formula: "AHT = (Total Talk Time + Total Hold Time + Total After Call Work) / (Total Answered Inbound Calls)",
      numerator: `${Math.round(ahtSeconds * 542)} seconds Cumulative Call Duration`,
      denominator: "542 Inbound Handled Calls",
      sourceDataset: "FrontSteps Inbound ACD Telephony Log (Twilio / Amazon Connect Extract)",
      note: "Calls exceeding 45 minutes are flagged for supervisor QA audit to isolate system freeze or caller hold anomalies.",
    },
    {
      id: "aht_compliance",
      name: "AHT Compliance",
      target: "≥80% of answered calls completed within 15 minutes",
      actual: isIncomplete ? "—" : `${ahtCompliancePct}%`,
      weight: "15%",
      earned: isIncomplete ? "—" : (15 * (scoreFactor >= 0.85 ? 0.95 : 0.7)).toFixed(2),
      status: isIncomplete ? "Missing Data" : isPending ? "Pending Validation" : scoreFactor >= 0.85 ? "Meeting Target" : "Below Target",
      formula: "AHT Compliance Rate = (Calls Handled within ≤ 900 Seconds / Total Answered Calls) × 100%",
      numerator: `${Math.round(542 * (parseFloat(ahtCompliancePct) / 100))} Calls Handled ≤ 900s`,
      denominator: "542 Total Answered Calls",
      sourceDataset: "ACD Telephony Interval Performance Report",
    },
    {
      id: "resolution",
      name: "Resolution Completion",
      target: "100%",
      actual: isIncomplete ? "—" : `${resolutionPct}%`,
      weight: "10%",
      earned: isIncomplete ? "—" : (10 * (scoreFactor >= 0.9 ? 1 : 0.85)).toFixed(2),
      status: isIncomplete ? "Missing Data" : isPending ? "Pending Validation" : scoreFactor >= 0.9 ? "Meeting Target" : "Below Target",
      formula: "Resolution Completion % = (Cases with Populated Resolution Status / Total Closed Cases) × 100%",
      numerator: `${Math.round((closedCasesCount * 4) * (parseFloat(resolutionPct) / 100))} Documented Resolution Cases`,
      denominator: `${closedCasesCount * 4} Total Closed Cases`,
      sourceDataset: "Salesforce CRM Mandatory Field Validation Audit",
    },
    {
      id: "sub_code",
      name: "Resolution Sub Code Completion",
      target: "≥95%",
      actual: isIncomplete ? "—" : `${subCodePct}%`,
      weight: "10%",
      earned: isIncomplete ? "—" : (10 * (scoreFactor >= 0.85 ? 0.96 : 0.8)).toFixed(2),
      status: isIncomplete ? "Missing Data" : isPending ? "Pending Validation" : scoreFactor >= 0.85 ? "Meeting Target" : "Below Target",
      formula: "Resolution Sub Code % = (Cases with Accurate Secondary Classification Sub Code / Total Closed Cases) × 100%",
      numerator: `${Math.round((closedCasesCount * 4) * (parseFloat(subCodePct) / 100))} Cases with Valid Sub Code`,
      denominator: `${closedCasesCount * 4} Total Closed Cases`,
      sourceDataset: "Salesforce CRM Category & Subcategory Taxonomy Feed",
    },
    {
      id: "case_summary",
      name: "Case Summary Completion",
      target: "≥95%",
      actual: isIncomplete ? "—" : `${caseSummaryPct}%`,
      weight: "10%",
      earned: isIncomplete ? "—" : (10 * (scoreFactor >= 0.85 ? 0.98 : 0.82)).toFixed(2),
      status: isIncomplete ? "Missing Data" : isPending ? "Pending Validation" : scoreFactor >= 0.85 ? "Meeting Target" : "Below Target",
      formula: "Case Summary % = (Cases with Comprehensive Standard Summary Documentation / Total Closed Cases) × 100%",
      numerator: `${Math.round((closedCasesCount * 4) * (parseFloat(caseSummaryPct) / 100))} Cases Meeting Summary Standards`,
      denominator: `${closedCasesCount * 4} Total Closed Cases`,
      sourceDataset: "Salesforce CRM Quality & Notes Audit Query",
    },
  ];

  // Helper for KPI status pill
  const getKpiStatusPill = (status) => {
    switch (status) {
      case "Meeting Target":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200/90";
      case "Below Target":
        return "bg-rose-50 text-rose-700 border border-rose-200/90";
      case "Pending Validation":
        return "bg-amber-50 text-amber-700 border border-amber-200/90";
      case "Missing Data":
        return "bg-slate-100 text-slate-500 border border-slate-200";
      default:
        return "bg-slate-100 text-slate-600 border border-slate-200";
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/25 p-4 sm:p-6 overflow-hidden animate-in fade-in duration-200">
      <div className="relative w-[90vw] max-w-7xl h-[86vh] max-h-[92vh] rounded-2xl bg-white shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col">
        {/* 1. Modal Header — Employee Information & History Date Picker */}
        <div className="flex flex-wrap items-center justify-between px-6 py-3 border-b border-slate-100 bg-[#042c51] text-white shrink-0 gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white border border-white/20">
              <User size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  {employee.name}
                </h3>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-white/15 text-slate-100">
                  {employee.employeeId}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 flex flex-wrap items-center gap-2">
                <span>Account: <strong className="text-white font-medium">{employee.account || "FrontSteps"}</strong></span>
                <span>•</span>
                <span>Supervisor: <strong className="text-white font-medium">{employee.supervisor}</strong></span>
                <span>•</span>
                <span>Viewing Period: <strong className="text-amber-300 font-semibold">{activePeriodData.periodLabel}</strong></span>
              </p>
            </div>
          </div>

          {/* Right Header Controls: Date Picker Dropdown + Close button */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-xl border border-white/15">
              <span className="text-[11px] font-medium text-slate-200 hidden sm:inline">
                Period Date:
              </span>
              <div className="w-[145px]">
                <DatePicker
                  value={selectedDate}
                  onChange={(val) => {
                    if (val) setSelectedDate(val);
                  }}
                  label=""
                  buttonClassName="h-7 text-[11px] bg-white text-slate-800 rounded-md border-0 px-2 font-medium"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 hover:text-white transition-colors cursor-pointer border border-white/15 text-xs font-bold"
              title="Close modal (Esc)"
            >
              Close
            </button>
          </div>
        </div>

        {/* 2. Overall Performance Summary (3 Compact Cards) */}
        <div className="px-6 py-3.5 bg-slate-50/70 border-b border-slate-200/80 shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Card 1: Final KPI Score */}
            <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-xs flex flex-col justify-between">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                Final KPI Score ({activePeriodData.periodLabel})
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                {isValidated && typeof activeScore === "number" ? (
                  <>
                    <span className="text-2xl font-black text-[#042c51]">
                      {activeScore.toFixed(2)}
                    </span>
                    <span className="text-xs font-bold text-slate-400">/ 100</span>
                  </>
                ) : isPending && typeof activeScore === "number" ? (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-amber-700">
                      {activeScore.toFixed(2)}
                    </span>
                    <span className="text-xs font-bold text-slate-400">/ 100</span>
                    <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      Provisional
                    </span>
                  </div>
                ) : isCorrected && typeof activeScore === "number" ? (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-purple-700">
                      {activeScore.toFixed(2)}
                    </span>
                    <span className="text-xs font-bold text-slate-400">/ 100</span>
                    <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                      Pending Revalidation
                    </span>
                  </div>
                ) : (
                  <span className="text-xl font-bold text-slate-400 italic">—</span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 truncate">
                {isValidated ? "Officially validated & confirmed" : isPending ? "Pending supervisor validation" : isCorrected ? "Corrected; awaiting signoff" : "Not yet validated"}
              </span>
            </div>

            {/* Card 2: Performance Rating */}
            <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-xs flex flex-col justify-between">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                Performance Rating
              </span>
              <div className="mt-1 flex items-center">
                {isValidated && activeRating ? (
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${getRatingBadge(activeRating)}`}>
                    {activeRating}
                  </span>
                ) : isPending || isCorrected ? (
                  <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    Pending Validation
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-slate-400 italic">Pending Calculation</span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5">
                Benchmark: Exceptional (95–100) • Sat (85–89.99)
              </span>
            </div>

            {/* Card 3: Data Validation Status */}
            <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-xs flex flex-col justify-between">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                Data Validation Status
              </span>
              <div className="mt-1 flex items-center">
                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadge(activeStatus)}`}>
                  {activeStatus}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5">
                {isValidated ? "Full audit verified" : isPending ? "Disputes/provisional audits active" : "Unconfirmed record status"}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Compact Tab Bar */}
        <div className="px-6 border-b border-slate-200/80 bg-white shrink-0 flex items-center justify-between gap-1 pt-2">
          <div className="flex items-center gap-1">
            {[
              { id: "scorecard", label: "KPI Scorecard" },
              { id: "operational", label: "Operational Metrics" },
              { id: "trends", label: "Performance Trends" },
              { id: "records", label: "Supporting Records" },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-4 py-2 text-xs font-bold transition-colors cursor-pointer border-b-2 -mb-[1px] ${
                    isActive
                      ? "border-[#ff5c28] text-[#ff5c28]"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Active Period Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Period:</span>
            <span className="inline-flex items-center gap-1 font-bold text-[#042c51] bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
              <Calendar size={12} className="text-[#ff5c28]" />
              {activePeriodData.periodLabel}
            </span>
          </div>
        </div>

        {/* 4. Tab Content Area */}
        <div className="flex-1 overflow-y-auto sibs-scrollbar p-6 bg-slate-50/40">
          {/* TAB 1: KPI SCORECARD */}
          {activeTab === "scorecard" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        FrontSteps PMP Documented Key Performance Indicators (6 KPIs)
                      </h4>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {activePeriodData.periodLabel}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Evaluated according to approved weights and operational performance targets
                    </p>
                  </div>
                  
                  {/* Quick Month Switcher & Total Weight */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200/90 shadow-2xs">
                      {[
                        { label: "Oct", key: "2026-10", date: "2026-10-21" },
                        { label: "Sep", key: "2026-09", date: "2026-09-15" },
                        { label: "Aug", key: "2026-08", date: "2026-08-15" },
                        { label: "Jul", key: "2026-07", date: "2026-07-15" },
                      ].map((m) => {
                        const isCurrent = currentMonthKey === m.key;
                        return (
                          <button
                            key={m.key}
                            type="button"
                            onClick={() => setSelectedDate(m.date)}
                            className={`px-2 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                              isCurrent
                                ? "bg-[#042c51] text-white shadow-xs"
                                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            }`}
                          >
                            {m.label}
                          </button>
                        );
                      })}
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                      Weight: 100%
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200/70 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-500 select-none">
                        <th className="py-3 px-4 w-[28%]">KPI Name</th>
                        <th className="py-3 px-4 w-[26%]">Target</th>
                        <th className="py-3 px-4 w-[16%]">Actual Result</th>
                        <th className="py-3 px-4 w-[10%]">Weight</th>
                        <th className="py-3 px-4 w-[12%]">Earned Points</th>
                        <th className="py-3 px-4 w-[18%] text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {kpiItems.map((item, idx) => (
                        <tr
                          key={idx}
                          onClick={() => setSelectedKpiForBreakdown(item)}
                          className="hover:bg-slate-100/80 transition-colors cursor-pointer group"
                          title="Click to view KPI calculation breakdown"
                        >
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            <div className="flex items-center gap-2">
                              <span className="group-hover:text-[#ff5c28] group-hover:underline transition-colors">
                                {item.name}
                              </span>
                            </div>
                            {item.note && (
                              <p className="text-[10.5px] text-slate-400 font-normal mt-1 leading-relaxed">
                                ℹ️ {item.note}
                              </p>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-600 text-xs">
                            {item.target}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-800">
                            {item.actual}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-600">
                            {item.weight}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {item.earned}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold ${getKpiStatusPill(item.status)}`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Total Earned Points Banner */}
                <div className="flex items-center justify-between px-6 py-3.5 bg-slate-50/90 border-t border-slate-200/80">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Total Earned Points ({activePeriodData.periodLabel}):
                    </span>
                    <span className="text-[11px] text-slate-400">
                      (Weighted calculation per PMP guidelines)
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-black text-[#042c51]">
                      {isValidated && typeof activeScore === "number"
                        ? activeScore.toFixed(2)
                        : isPending || isCorrected
                        ? `${activeScore?.toFixed(2) || "—"} (Provisional)`
                        : "—"}
                    </span>
                    <span className="text-xs font-bold text-slate-400">/ 100</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 text-xs text-slate-500">
                <div className="flex items-start gap-2">
                  <Info size={14} className="text-[#ff5c28] shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>Proration Policy Note:</strong> In accordance with FrontSteps PMP, targets for production metrics (Cases Closed) are adjusted proportionately during reporting periods containing approved PTO, bereavement, floating holidays, company training, or documented technical outages.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: OPERATIONAL METRICS */}
          {activeTab === "operational" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {/* 1. Attendance */}
                <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      1. Attendance
                    </span>
                    <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Compliant
                    </span>
                  </div>
                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Attendance Rate:</span>
                      <span className="font-bold text-slate-800">{activePeriodData.attendanceRate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Present Days:</span>
                      <span className="font-semibold text-slate-700">21 days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Absent Days:</span>
                      <span className="font-semibold text-slate-700">0 days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Absence Status:</span>
                      <span className="font-semibold text-emerald-600">None / Perfect Attendance</span>
                    </div>
                  </div>
                </div>

                {/* 2. Schedule Adherence */}
                <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      2. Schedule Adherence
                    </span>
                    <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      Met Target
                    </span>
                  </div>
                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Adherence Rate:</span>
                      <span className="font-bold text-slate-800">{activePeriodData.adherenceRate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Assigned Shift:</span>
                      <span className="font-semibold text-slate-700">09:00 PM – 06:00 AM PHT</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Schedule Status:</span>
                      <span className="font-semibold text-slate-700">Standard Night Shift (M-F)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Adherence Status:</span>
                      <span className="font-semibold text-emerald-600">On Target (≥95%)</span>
                    </div>
                  </div>
                </div>

                {/* 3. Omni Availability */}
                <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      3. Omni Availability
                    </span>
                    <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                      High Availability
                    </span>
                  </div>
                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Availability %:</span>
                      <span className="font-bold text-slate-800">{activePeriodData.omniAvailability}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Logged Time:</span>
                      <span className="font-semibold text-slate-700">168.4 hrs</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Ready / Engaged Time:</span>
                      <span className="font-semibold text-slate-700">156.2 hrs</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Availability Status:</span>
                      <span className="font-semibold text-purple-700">Optimal Queue Routing</span>
                    </div>
                  </div>
                </div>

                {/* 4. Cancelled Calls */}
                <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      4. Cancelled Calls
                    </span>
                    <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                      {activePeriodData.cancelledCalls}
                    </span>
                  </div>
                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Cancelled Call Count:</span>
                      <span className="font-bold text-slate-800">{activePeriodData.cancelledCalls}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Reporting Period:</span>
                      <span className="font-semibold text-slate-700">{activePeriodData.periodLabel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Caller Disconnects:</span>
                      <span className="font-semibold text-slate-700">2 calls</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Technical Drops:</span>
                      <span className="font-semibold text-slate-700">1 call</span>
                    </div>
                  </div>
                </div>

                {/* 5. Technical Incidents */}
                <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs sm:col-span-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      5. Technical Incidents & Outage Log
                    </span>
                    <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {activePeriodData.technicalIncidents}
                    </span>
                  </div>
                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-bold text-slate-800">INC-FS-2026-1044: VPN Gateway Reconnect</span>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Transient carrier fiber degradation caused 24 minutes disconnect. Documented and exempt from unexcused downtime.
                        </p>
                      </div>
                      <span className="text-slate-400 font-mono text-[11px] shrink-0 ml-2">Oct 11, 2026</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-100">
                      <span className="text-slate-400">Incident Status:</span>
                      <span className="font-semibold text-emerald-600">Approved & Excused by WFM</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-dashed border-slate-200 bg-white p-3 text-[11px] text-slate-400">
                Notice: The metrics above represent proposed operational displays for the wireframe prototype. Precise measurement standards, thresholds, and data definitions must be validated by the Workforce Management (WFM) team.
              </div>
            </div>
          )}

          {/* TAB 3: PERFORMANCE TRENDS */}
          {activeTab === "trends" && (
            <div className="space-y-4">
              {/* Period selector */}
              <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Select Trend Range:
                </span>
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                  {[
                    { id: "weekly", label: "Weekly" },
                    { id: "mtd", label: "Month-to-Date" },
                    { id: "monthly", label: "Monthly" },
                    { id: "historical", label: "Historical" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setTrendPeriod(p.id)}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                        trendPeriod === p.id
                          ? "bg-white text-[#042c51] shadow-xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Trend 1: Overall KPI Score Trend */}
                <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        1. Overall KPI Score Trend
                      </h5>
                      <span className="text-[10.5px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Target: ≥ 85.00
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Period comparison against satisfactory performance threshold
                    </p>
                  </div>

                  <div className="mt-4 h-40 bg-slate-50/70 border border-dashed border-slate-200 rounded-xl p-3 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Threshold Line: 85.00</span>
                      <span className="font-bold text-[#042c51]">Latest: {typeof employee.score === "number" ? employee.score.toFixed(2) : "88.50"}</span>
                    </div>
                    <div className="flex items-end justify-between h-24 px-4 gap-3 pt-2">
                      {[
                        { label: "Jul", isoDate: "2026-07-15", monthKey: "2026-07", val: 84 },
                        { label: "Aug", isoDate: "2026-08-15", monthKey: "2026-08", val: 92 },
                        { label: "Sep", isoDate: "2026-09-15", monthKey: "2026-09", val: 89 },
                        { label: "Oct", isoDate: "2026-10-21", monthKey: "2026-10", val: typeof employee.score === "number" ? Math.round(employee.score) : 93 },
                      ].map((bar, i) => {
                        const isSelected = currentMonthKey === bar.monthKey;
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              setSelectedDate(bar.isoDate);
                              setActiveTab("scorecard");
                            }}
                            title={`Click to view ${bar.label} 2026 scorecard details (${bar.val} pts)`}
                            className={`flex-1 flex flex-col items-center gap-1.5 h-full justify-end cursor-pointer group p-1 rounded-lg transition-all ${
                              isSelected ? "bg-amber-50 ring-1 ring-[#ff5c28]" : "hover:bg-slate-100/80"
                            }`}
                          >
                            <span className={`text-[10px] font-bold ${isSelected ? "text-[#ff5c28]" : "text-slate-600"}`}>
                              {bar.val}
                            </span>
                            <div
                              className={`w-full rounded-t-md transition-all ${
                                isSelected ? "bg-[#ff5c28]" : "bg-[#042c51] group-hover:bg-[#ff5c28]/80"
                              }`}
                              style={{ height: `${(bar.val / 100) * 80}px` }}
                            />
                            <span className={`text-[10px] font-semibold ${isSelected ? "text-[#ff5c28]" : "text-slate-500"}`}>
                              {bar.label} {isSelected && "●"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Trend 2: Cases Closed vs Target */}
                <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        2. Cases Closed vs Target
                      </h5>
                      <span className="text-[10.5px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        Target: 140/wk
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Weekly throughput volume against approved prorated expectations
                    </p>
                  </div>

                  <div className="mt-4 h-40 bg-slate-50/70 border border-dashed border-slate-200 rounded-xl p-3 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Target: 140 / wk</span>
                      <span className="font-bold text-emerald-600">Avg: 146 / wk</span>
                    </div>
                    <div className="flex items-end justify-between h-24 px-4 gap-3 pt-2">
                      {[
                        { label: "W1", val: 142 },
                        { label: "W2", val: 148 },
                        { label: "W3", val: 139 },
                        { label: "W4", val: 151 },
                      ].map((bar, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                          <span className="text-[10px] font-bold text-slate-600">{bar.val}</span>
                          <div
                            className={`w-full rounded-t-md transition-all ${bar.val >= 140 ? "bg-emerald-600" : "bg-rose-500"}`}
                            style={{ height: `${(bar.val / 160) * 80}px` }}
                          />
                          <span className="text-[10px] text-slate-400">{bar.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Trend 3: Average Handle Time Trend */}
                <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        3. Average Handle Time (AHT) Trend
                      </h5>
                      <span className="text-[10.5px] font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        Target: ≤ 900s
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Call handling duration in seconds across reporting windows
                    </p>
                  </div>

                  <div className="mt-4 h-40 bg-slate-50/70 border border-dashed border-slate-200 rounded-xl p-3 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Target: ≤ 900s (15 mins)</span>
                      <span className="font-bold text-purple-700">Latest: 874s</span>
                    </div>
                    <div className="flex items-end justify-between h-24 px-4 gap-3 pt-2">
                      {[
                        { label: "W1", val: 910 },
                        { label: "W2", val: 890 },
                        { label: "W3", val: 882 },
                        { label: "W4", val: 874 },
                      ].map((bar, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                          <span className="text-[10px] font-bold text-slate-600">{bar.val}s</span>
                          <div
                            className={`w-full rounded-t-md transition-all ${bar.val <= 900 ? "bg-purple-600" : "bg-rose-500"}`}
                            style={{ height: `${(bar.val / 1000) * 75}px` }}
                          />
                          <span className="text-[10px] text-slate-400">{bar.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Trend 4: CRM Documentation Completion Trend */}
                <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        4. CRM Documentation Completion
                      </h5>
                      <span className="text-[10.5px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Target: ≥ 95%
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Resolution, Sub Code, and Case Summary completion tracking
                    </p>
                  </div>

                  <div className="mt-4 h-40 bg-slate-50/70 border border-dashed border-slate-200 rounded-xl p-3 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Resolution: 99.2%</span>
                      <span>Sub Code: 96.5%</span>
                      <span>Summary: 97.0%</span>
                    </div>
                    <div className="flex items-end justify-around h-24 px-4 gap-2 pt-2">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] font-bold text-slate-600">99.2%</span>
                        <div className="w-10 bg-emerald-600 rounded-t-md h-16" />
                        <span className="text-[10px] text-slate-400">Resolution</span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] font-bold text-slate-600">96.5%</span>
                        <div className="w-10 bg-blue-600 rounded-t-md h-14" />
                        <span className="text-[10px] text-slate-400">Sub Code</span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] font-bold text-slate-600">97.0%</span>
                        <div className="w-10 bg-indigo-600 rounded-t-md h-15" />
                        <span className="text-[10px] text-slate-400">Summary</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SUPPORTING RECORDS */}
          {activeTab === "records" && (
            <div className="space-y-4">
              {/* Section A: Source Reports */}
              <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-3">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    A. Source Reports & Data Ingestion
                  </h5>
                  <span className="text-[11px] text-slate-400">2 Verified Sources</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200/60 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="py-2 px-3">Report Name</th>
                        <th className="py-2 px-3">Source Type</th>
                        <th className="py-2 px-3">Reporting Period</th>
                        <th className="py-2 px-3">Data Status</th>
                        <th className="py-2 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      <tr>
                        <td className="py-2 px-3 font-semibold text-slate-800">Salesforce Case Audit Extract</td>
                        <td className="py-2 px-3 text-slate-500">CRM Raw Export</td>
                        <td className="py-2 px-3">{formatReportingPeriod(employee.reportingPeriod)}</td>
                        <td className="py-2 px-3">
                          <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Loaded & Verified
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button type="button" className="text-[#ff5c28] hover:underline font-bold text-xs cursor-pointer">
                            View Details
                          </button>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-slate-800">FrontSteps Inbound Telephony Log</td>
                        <td className="py-2 px-3 text-slate-500">ACD Telephony Export</td>
                        <td className="py-2 px-3">{formatReportingPeriod(employee.reportingPeriod)}</td>
                        <td className="py-2 px-3">
                          <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Loaded & Verified
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button type="button" className="text-[#ff5c28] hover:underline font-bold text-xs cursor-pointer">
                            View Details
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section B: Supporting Evidence */}
              <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-3">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    B. Supporting Evidence & Attachments
                  </h5>
                  <span className="text-[11px] text-slate-400">Mock Demonstration Attachments</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200/60 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="py-2 px-3">Attachment Name</th>
                        <th className="py-2 px-3">Related KPI</th>
                        <th className="py-2 px-3">File Type</th>
                        <th className="py-2 px-3">Date Attached</th>
                        <th className="py-2 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      <tr>
                        <td className="py-2 px-3 font-semibold text-slate-800 flex items-center gap-1.5">
                          <Paperclip size={13} className="text-slate-400" />
                          <span>Proration_Approved_Leave_Notice.pdf</span>
                        </td>
                        <td className="py-2 px-3 text-slate-500">Cases Closed (Proration)</td>
                        <td className="py-2 px-3 font-mono text-[11px]">PDF</td>
                        <td className="py-2 px-3">Oct 08, 2026</td>
                        <td className="py-2 px-3 text-right">
                          <button type="button" className="text-[#ff5c28] hover:underline font-bold text-xs cursor-pointer">
                            View File
                          </button>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-slate-800 flex items-center gap-1.5">
                          <Paperclip size={13} className="text-slate-400" />
                          <span>QA_Calibration_Dispute_Resolution.pdf</span>
                        </td>
                        <td className="py-2 px-3 text-slate-500">Resolution Completion</td>
                        <td className="py-2 px-3 font-mono text-[11px]">PDF</td>
                        <td className="py-2 px-3">Oct 12, 2026</td>
                        <td className="py-2 px-3 text-right">
                          <button type="button" className="text-[#ff5c28] hover:underline font-bold text-xs cursor-pointer">
                            View File
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section C: Data Validation Details */}
              <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-3">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    C. Data Validation Audit Trail
                  </h5>
                  <span className={`inline-flex px-2 py-0.5 rounded text-[10.5px] font-bold ${getStatusBadge(employee.status)}`}>
                    Status: {employee.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">Missing Records</span>
                    <span className="font-semibold text-slate-700">{isIncomplete ? "2 Attendance Logs" : "0 Missing"}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">Incomplete Data</span>
                    <span className="font-semibold text-slate-700">{isIncomplete ? "Missing QA audits" : "None"}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">Corrected Records</span>
                    <span className="font-semibold text-slate-700">{isCorrected ? "1 AHT Ticket Re-indexed" : "None"}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">Audit Reviewer</span>
                    <span className="font-semibold text-slate-700">{isValidated ? employee.supervisor : "Pending Signoff"}</span>
                  </div>
                </div>
              </div>

              {/* Section D: Related Coaching Records (Read-Only) */}
              <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-3">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    D. Related Coaching Records (Read-Only)
                  </h5>
                  <span className="text-[11px] text-slate-400">Managed in Coaching Management Module</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200/60 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="py-2 px-3">Coaching Date</th>
                        <th className="py-2 px-3">Performance Concern</th>
                        <th className="py-2 px-3">Coaching Type</th>
                        <th className="py-2 px-3">Follow-Up Date</th>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      <tr>
                        <td className="py-2 px-3 font-semibold text-slate-800">Oct 14, 2026</td>
                        <td className="py-2 px-3 text-slate-600">AHT outlier investigation on complex billing cases</td>
                        <td className="py-2 px-3">1-on-1 Performance Sync</td>
                        <td className="py-2 px-3 font-mono text-[11px]">Oct 28, 2026</td>
                        <td className="py-2 px-3">
                          <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            Completed
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button type="button" className="text-[#ff5c28] hover:underline font-bold text-xs cursor-pointer">
                            View Record
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* KPI Calculation Breakdown Modal */}
      {selectedKpiForBreakdown && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/40 p-4 sm:p-6 overflow-hidden animate-in fade-in duration-200 backdrop-blur-2xs">
          <div className="relative w-full max-w-lg max-h-[85vh] rounded-2xl bg-white shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-[#042c51] text-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white border border-white/20">
                  <Activity size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white tracking-tight">
                      {selectedKpiForBreakdown.name} Breakdown
                    </h3>
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#ff5c28] text-white">
                      Weight: {selectedKpiForBreakdown.weight}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    {employee.name} • <span className="text-amber-300 font-semibold">{activePeriodData.periodLabel}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedKpiForBreakdown(null)}
                className="px-2.5 py-1 rounded-md bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer border border-white/15 text-xs font-bold"
              >
                Close
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto sibs-scrollbar p-5 space-y-3.5 bg-slate-50/40">
              {/* Summary Metrics */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Target</span>
                  <span className="text-xs font-bold text-slate-800 mt-1 block truncate" title={selectedKpiForBreakdown.target}>
                    {selectedKpiForBreakdown.target}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Actual Result</span>
                  <span className="text-sm font-black text-[#042c51] mt-0.5 block">
                    {selectedKpiForBreakdown.actual}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Earned Points</span>
                  <span className="text-sm font-black text-[#ff5c28] mt-0.5 block">
                    {selectedKpiForBreakdown.earned} / {selectedKpiForBreakdown.weight}
                  </span>
                </div>
              </div>

              {/* Formula & Calculation Fraction */}
              <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-3">
                <span className="block text-[10.5px] uppercase font-bold text-slate-500 tracking-wider">
                  Calculation Formula
                </span>

                <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 text-center font-mono text-[11px] font-semibold text-[#042c51]">
                  {selectedKpiForBreakdown.formula}
                </div>

                <div className="p-3 rounded-lg border border-dashed border-slate-200 bg-slate-50/60 flex items-center justify-center gap-3">
                  <div className="flex flex-col items-center">
                    <span className="px-2.5 py-1 bg-white border border-slate-200 rounded text-xs font-bold text-slate-800 shadow-2xs">
                      {selectedKpiForBreakdown.numerator}
                    </span>
                    <div className="w-full h-0.5 bg-slate-300 my-1" />
                    <span className="px-2.5 py-1 bg-white border border-slate-200 rounded text-xs font-bold text-slate-600 shadow-2xs">
                      {selectedKpiForBreakdown.denominator}
                    </span>
                  </div>

                  <span className="text-sm font-bold text-slate-400">=</span>

                  <span className="px-3 py-1.5 bg-[#042c51] text-white rounded-lg text-xs font-black shadow-2xs">
                    {selectedKpiForBreakdown.actual}
                  </span>
                </div>
              </div>

              {/* Data Provenance & Source Dataset */}
              <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs">
                <span className="block text-[10.5px] uppercase font-bold text-slate-500 tracking-wider mb-2">
                  Data Source & Status
                </span>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400">Source Dataset:</span>
                    <span className="font-semibold text-slate-800">{selectedKpiForBreakdown.sourceDataset}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400">Status:</span>
                    <span className={`font-bold ${
                      selectedKpiForBreakdown.status === "Meeting Target"
                        ? "text-emerald-600"
                        : selectedKpiForBreakdown.status === "Below Target"
                        ? "text-rose-600"
                        : "text-amber-600"
                    }`}>
                      {selectedKpiForBreakdown.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Proration / Policy Note */}
              {selectedKpiForBreakdown.note && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-800 leading-relaxed">
                  ℹ️ <strong>Rule / Note:</strong> {selectedKpiForBreakdown.note}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200/80 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedKpiForBreakdown(null)}
                className="px-4 py-1.5 text-xs font-bold text-white bg-[#042c51] hover:bg-[#073966] rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
