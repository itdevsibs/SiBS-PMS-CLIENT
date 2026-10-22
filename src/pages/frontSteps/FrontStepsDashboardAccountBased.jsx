import React, { useState } from "react";
import {
  Menu,
  Star,
  CheckSquare,
  PhoneCall,
  Clock,
  CheckCircle2,
  PhoneOff,
  PhoneIncoming,
  AlertCircle,
  FileText,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import SingleSelectDropdown from "../../components/common/filters/SingleSelectDropdown";

const VIEW_OPTIONS = [
  { value: "dashboard-summary", label: "Summary" },
  { value: "dashboard-account-based", label: "Account-based KPI" },
  { value: "dashboard-kpi-indiv", label: "KPI (PMP/PIP)" },
];

export default function FrontStepsDashboardAccountBased({
  onNavigate,
  isSidebarHidden,
  onToggleSidebar,
}) {
  const [selectedView, setSelectedView] = useState("dashboard-account-based");

  const handleViewChange = (newView) => {
    setSelectedView(newView);
    if (onNavigate) {
      onNavigate(newView);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col justify-between font-jakarta text-slate-800 select-none pb-0.5 gap-2.5 overflow-hidden">
      {/* Top Filter Bar: View Mode Switcher + Integrated Sidebar Toggle when collapsed */}
      <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/90 bg-white px-3.5 py-2 shadow-2xs shrink-0">
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
              options={VIEW_OPTIONS}
              buttonClassName="h-8 rounded-lg border-slate-200 bg-slate-50/90 px-3 text-xs font-bold text-[#042c51] hover:border-slate-300 hover:bg-white shadow-2xs transition-all"
            />
          </div>
        </div>
      </div>

      {/* Row 1: 8 Top Metric Stat Cards (Data/Number prominently highlighted) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 shrink-0">
        {/* 1. Account KPI Score */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-2 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="flex h-5.5 w-5.5 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-200/60 shadow-2xs">
              <Star className="h-3 w-3 fill-blue-500 text-blue-500" />
            </span>
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/60">
              SCORE
            </span>
          </div>
          <div className="my-1 text-center">
            <span className="font-mono text-3xl lg:text-[32px] font-black tracking-tight text-[#042c51] leading-none block">
              89.1
            </span>
          </div>
          <div className="text-center pt-1 border-t border-slate-100/80">
            <p className="text-[11px] lg:text-[12px] font-bold text-slate-800 leading-tight truncate">Account KPI Score</p>
            <p className="text-[9px] text-slate-400 mt-0.5 truncate">Proposed workbook</p>
          </div>
        </div>

        {/* 2. Cases Closed */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-2 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="flex h-5.5 w-5.5 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-200/60 shadow-2xs">
              <CheckSquare className="h-3 w-3 text-blue-600" />
            </span>
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/60">
              Cases
            </span>
          </div>
          <div className="my-1 text-center">
            <span className="font-mono text-3xl lg:text-[32px] font-black tracking-tight text-[#042c51] leading-none block">
              7,363
            </span>
          </div>
          <div className="text-center pt-1 border-t border-slate-100/80">
            <p className="text-[11px] lg:text-[12px] font-bold text-slate-800 leading-tight truncate">Cases Closed</p>
            <p className="text-[9px] text-slate-400 mt-0.5 truncate">Unique cases</p>
          </div>
        </div>

        {/* 3. Answer Rate */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-2 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="flex h-5.5 w-5.5 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-200/60 shadow-2xs">
              <PhoneCall className="h-3 w-3 text-blue-600" />
            </span>
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/60">
              ≥90%
            </span>
          </div>
          <div className="my-1 text-center">
            <span className="font-mono text-3xl lg:text-[32px] font-black tracking-tight text-[#042c51] leading-none block">
              84%
            </span>
          </div>
          <div className="text-center pt-1 border-t border-slate-100/80">
            <p className="text-[11px] lg:text-[12px] font-bold text-slate-800 leading-tight truncate">Answer Rate</p>
            <p className="text-[9px] text-slate-400 mt-0.5 truncate">Proposed target</p>
          </div>
        </div>

        {/* 4. Seven-day Closure */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-2 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="flex h-5.5 w-5.5 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-200/60 shadow-2xs">
              <Clock className="h-3 w-3 text-blue-600" />
            </span>
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/60">
              ≥70%
            </span>
          </div>
          <div className="my-1 text-center">
            <span className="font-mono text-3xl lg:text-[32px] font-black tracking-tight text-[#042c51] leading-none block">
              61%
            </span>
          </div>
          <div className="text-center pt-1 border-t border-slate-100/80">
            <p className="text-[11px] lg:text-[12px] font-bold text-slate-800 leading-tight truncate">Seven-day Closure</p>
            <p className="text-[9px] text-slate-400 mt-0.5 truncate">Proposed target</p>
          </div>
        </div>

        {/* 5. Sub-code Completion */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-2 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="flex h-5.5 w-5.5 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-200/60 shadow-2xs">
              <CheckCircle2 className="h-3 w-3 text-blue-600" />
            </span>
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/60">
              ≥95%
            </span>
          </div>
          <div className="my-1 text-center">
            <span className="font-mono text-3xl lg:text-[32px] font-black tracking-tight text-[#042c51] leading-none block">
              82%
            </span>
          </div>
          <div className="text-center pt-1 border-t border-slate-100/80">
            <p className="text-[11px] lg:text-[12px] font-bold text-slate-800 leading-tight truncate">Sub-code Compl.</p>
            <p className="text-[9px] text-slate-400 mt-0.5 truncate">Proposed target</p>
          </div>
        </div>

        {/* 6. Unaccepted Calls */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-2 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="flex h-5.5 w-5.5 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-200/60 shadow-2xs">
              <PhoneOff className="h-3 w-3 text-blue-600" />
            </span>
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/60">
              ≤10%
            </span>
          </div>
          <div className="my-1 text-center">
            <span className="font-mono text-3xl lg:text-[32px] font-black tracking-tight text-[#042c51] leading-none block">
              16%
            </span>
          </div>
          <div className="text-center pt-1 border-t border-slate-100/80">
            <p className="text-[11px] lg:text-[12px] font-bold text-slate-800 leading-tight truncate">Unaccepted Calls</p>
            <p className="text-[9px] text-slate-400 mt-0.5 truncate">Guardrail</p>
          </div>
        </div>

        {/* 7. Answered Calls */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-2 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="flex h-5.5 w-5.5 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-200/60 shadow-2xs">
              <PhoneIncoming className="h-3 w-3 text-blue-600" />
            </span>
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/60">
              Calls
            </span>
          </div>
          <div className="my-1 text-center">
            <span className="font-mono text-3xl lg:text-[32px] font-black tracking-tight text-[#042c51] leading-none block">
              2,789
            </span>
          </div>
          <div className="text-center pt-1 border-t border-slate-100/80">
            <p className="text-[11px] lg:text-[12px] font-bold text-slate-800 leading-tight truncate">Answered Calls</p>
            <p className="text-[9px] text-slate-400 mt-0.5 truncate">Inbound accepted</p>
          </div>
        </div>

        {/* 8. Pending Reviews */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-2 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="flex h-5.5 w-5.5 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-200/60 shadow-2xs">
              <AlertCircle className="h-3 w-3 text-blue-600" />
            </span>
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/60">
              Reviews
            </span>
          </div>
          <div className="my-1 text-center">
            <span className="font-mono text-3xl lg:text-[32px] font-black tracking-tight text-[#042c51] leading-none block">
              54
            </span>
          </div>
          <div className="text-center pt-1 border-t border-slate-100/80">
            <p className="text-[11px] lg:text-[12px] font-bold text-slate-800 leading-tight truncate">Pending Reviews</p>
            <p className="text-[9px] text-slate-400 mt-0.5 truncate">Exceptions</p>
          </div>
        </div>
      </div>

      {/* Row 2: 2 Side-by-Side Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-[1.1] min-h-0">
        {/* Left Chart: Cases Closed by weekly */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-2xs flex flex-col justify-between min-h-0">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 shrink-0">
            <h4 className="text-sm font-black tracking-wide text-slate-800">
              Cases Closed by weekly
            </h4>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-600 font-bold bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded-md">
              <span className="h-2 w-2 rounded-full bg-[#1b6ca8]" />
              <span>Cases Closed</span>
            </div>
          </div>

          {/* Chart Body: Unsquished HTML Y-Axis + Responsive Vector Canvas */}
          <div className="w-full flex-1 min-h-0 flex flex-col justify-between pt-2">
            <div className="flex-1 flex gap-2 min-h-0 relative">
              {/* HTML Y-Axis Labels */}
              <div className="flex flex-col justify-between text-right font-mono text-[10px] font-bold text-slate-400 shrink-0 pb-1 select-none">
                <span>3,930</span>
                <span>2,947</span>
                <span>1,965</span>
                <span>982</span>
                <span className="text-slate-500 font-extrabold">0</span>
              </div>

              {/* Graphic Canvas */}
              <div className="flex-1 relative flex flex-col justify-end min-h-0">
                <svg viewBox="0 0 450 160" preserveAspectRatio="none" className="w-full h-full">
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1b6ca8" />
                      <stop offset="100%" stopColor="#2563eb" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines */}
                  <line x1="0" y1="8" x2="450" y2="8" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="0" y1="44" x2="450" y2="44" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="0" y1="81" x2="450" y2="81" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="0" y1="117" x2="450" y2="117" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                  {/* Baseline 0 */}
                  <line x1="0" y1="154" x2="450" y2="154" stroke="#cbd5e1" strokeWidth="1.5" />

                  {/* Bar W1 */}
                  <rect x="55" y="22" width="60" height="132" rx="5" fill="url(#barGradient)" className="hover:opacity-90 transition-opacity drop-shadow-2xs" />
                  {/* Bar W2 */}
                  <rect x="195" y="34" width="60" height="120" rx="5" fill="url(#barGradient)" className="hover:opacity-90 transition-opacity drop-shadow-2xs" />
                  {/* Bar W3 */}
                  <rect x="335" y="122" width="60" height="32" rx="5" fill="url(#barGradient)" className="hover:opacity-90 transition-opacity drop-shadow-2xs" />
                </svg>

                {/* Value Callouts placed neatly on top of bars */}
                <div className="absolute inset-0 pointer-events-none flex">
                  <div className="flex-1 flex flex-col items-center justify-between pb-1 pt-1">
                    <span className="font-mono text-xs font-black text-[#042c51]">3,421</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-between pb-1 pt-3.5">
                    <span className="font-mono text-xs font-black text-[#042c51]">3,110</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-end pb-9">
                    <span className="font-mono text-xs font-black text-[#042c51]">832</span>
                  </div>
                </div>
              </div>
            </div>

            {/* X-Axis Labels */}
            <div className="flex pl-10 pr-2 pt-1 text-center font-bold text-xs text-slate-700">
              <div className="flex-1">W1</div>
              <div className="flex-1">W2</div>
              <div className="flex-1">W3</div>
            </div>
          </div>
        </div>

        {/* Right Chart: Calls Received & Answered */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-2xs flex flex-col justify-between min-h-0">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 shrink-0">
            <h4 className="text-sm font-black tracking-wide text-slate-800">
              Calls Received & Answered
            </h4>
            <div className="flex items-center gap-2 text-[10px] text-slate-600 font-bold">
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded-md">
                <span className="h-2 w-2 rounded-full bg-[#1b6ca8]" />
                <span>Received/Answered</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded-md">
                <span className="w-3 border-t-2 border-dashed border-[#60a5fa]" />
                <span>Target</span>
              </div>
            </div>
          </div>

          {/* Chart Body: Unsquished HTML Y-Axis + Responsive Vector Canvas */}
          <div className="w-full flex-1 min-h-0 flex flex-col justify-between pt-2">
            <div className="flex-1 flex gap-2 min-h-0 relative">
              {/* HTML Y-Axis Labels */}
              <div className="flex flex-col justify-between text-right font-mono text-[10px] font-bold text-slate-400 shrink-0 pb-1 select-none">
                <span>2,179</span>
                <span>1,634</span>
                <span>1,090</span>
                <span>545</span>
                <span className="text-slate-500 font-extrabold">0</span>
              </div>

              {/* Graphic Canvas */}
              <div className="flex-1 relative flex flex-col justify-end min-h-0">
                <svg viewBox="0 0 450 160" preserveAspectRatio="none" className="w-full h-full">
                  <defs>
                    <linearGradient id="callsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines */}
                  <line x1="0" y1="8" x2="450" y2="8" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="0" y1="44" x2="450" y2="44" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="0" y1="81" x2="450" y2="81" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="0" y1="117" x2="450" y2="117" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                  {/* Baseline 0 */}
                  <line x1="0" y1="154" x2="450" y2="154" stroke="#cbd5e1" strokeWidth="1.5" />

                  {/* Target benchmark dashed line */}
                  <line x1="0" y1="52" x2="450" y2="52" stroke="#93c5fd" strokeWidth="1.8" strokeDasharray="4 4" />

                  {/* Area under curve */}
                  <polygon
                    points="75,44 225,81 375,127 375,154 75,154"
                    fill="url(#callsGradient)"
                  />

                  {/* Trend line */}
                  <polyline
                    points="75,44 225,81 375,127"
                    fill="none"
                    stroke="#1b6ca8"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Dots */}
                  <circle cx="75" cy="44" r="5" fill="white" stroke="#1b6ca8" strokeWidth="2.8" className="drop-shadow-2xs" />
                  <circle cx="225" cy="81" r="5" fill="white" stroke="#1b6ca8" strokeWidth="2.8" className="drop-shadow-2xs" />
                  <circle cx="375" cy="127" r="5" fill="white" stroke="#1b6ca8" strokeWidth="2.8" className="drop-shadow-2xs" />
                </svg>

                {/* Value Callouts placed neatly on top of nodes */}
                <div className="absolute inset-0 pointer-events-none flex">
                  <div className="flex-1 flex flex-col items-center justify-between pb-1 pt-3">
                    <span className="font-mono text-xs font-black text-[#042c51]">1,634</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-between pb-1 pt-11">
                    <span className="font-mono text-xs font-black text-[#042c51]">1,090</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-end pb-8">
                    <span className="font-mono text-xs font-black text-[#042c51]">382</span>
                  </div>
                </div>
              </div>
            </div>

            {/* X-Axis Labels */}
            <div className="flex pl-10 pr-2 pt-1 text-center font-bold text-xs text-slate-700">
              <div className="flex-1">W1</div>
              <div className="flex-1">W2</div>
              <div className="flex-1">W3</div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: 3 Bottom Donut Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-[1.2] min-h-0">
        {/* Donut 1: Case Closure Timeliness */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs flex flex-col justify-between min-h-0">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 shrink-0">
            <h4 className="text-sm font-black tracking-wide text-slate-800">
              Case Closure Timeliness
            </h4>
          </div>

          <div className="flex items-center justify-between gap-6 pt-2 flex-1 min-h-0">
            {/* Donut SVG */}
            <div className="relative w-52 h-52 lg:w-56 lg:h-56 xl:w-60 xl:h-60 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
                <circle cx="70" cy="70" r="54" fill="none" stroke="#f1f5f9" strokeWidth="24" />
                {/* 61% arc (339.29 * 0.61 = 206.97) */}
                <circle
                  cx="70"
                  cy="70"
                  r="54"
                  fill="none"
                  stroke="#042c51"
                  strokeWidth="24"
                  strokeDasharray="206.97 339.29"
                  strokeDashoffset="0"
                />
                {/* 20% arc (339.29 * 0.20 = 67.86) */}
                <circle
                  cx="70"
                  cy="70"
                  r="54"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="24"
                  strokeDasharray="67.86 339.29"
                  strokeDashoffset="-206.97"
                />
                {/* 19% arc (339.29 * 0.19 = 64.46) */}
                <circle
                  cx="70"
                  cy="70"
                  r="54"
                  fill="none"
                  stroke="#93c5fd"
                  strokeWidth="24"
                  strokeDasharray="64.46 339.29"
                  strokeDashoffset="-274.83"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-mono text-3xl lg:text-4xl font-black text-slate-900 leading-none">61%</span>
                <span className="text-[10px] font-semibold text-slate-400 mt-1">Closed within 7 days</span>
              </div>
            </div>

            {/* Legend list */}
            <div className="flex flex-col gap-2.5 flex-1 text-[13px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="h-3 w-3 rounded-full bg-[#042c51]" />
                  <span className="text-slate-600 font-medium">Within 1 day</span>
                </div>
                <span className="font-black text-slate-800 font-mono text-sm">40%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="h-3 w-3 rounded-full bg-[#1e40af]" />
                  <span className="text-slate-600 font-medium">2–3 days</span>
                </div>
                <span className="font-black text-slate-800 font-mono text-sm">6%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="h-3 w-3 rounded-full bg-[#2563eb]" />
                  <span className="text-slate-600 font-medium">4–7 days</span>
                </div>
                <span className="font-black text-slate-800 font-mono text-sm">15%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="h-3 w-3 rounded-full bg-[#93c5fd]" />
                  <span className="text-slate-600 font-medium">Over 7 days</span>
                </div>
                <span className="font-black text-slate-800 font-mono text-sm">39%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Donut 2: Queue / Work Mix */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs flex flex-col justify-between min-h-0">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 shrink-0">
            <h4 className="text-sm font-black tracking-wide text-slate-800">
              Queue / Work Mix
            </h4>
          </div>

          <div className="flex items-center justify-between gap-6 pt-2 flex-1 min-h-0">
            {/* Donut SVG */}
            <div className="relative w-52 h-52 lg:w-56 lg:h-56 xl:w-60 xl:h-60 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
                <circle cx="70" cy="70" r="54" fill="none" stroke="#f1f5f9" strokeWidth="24" />
                {/* 90% Tier 1 (339.29 * 0.90 = 305.36) */}
                <circle
                  cx="70"
                  cy="70"
                  r="54"
                  fill="none"
                  stroke="#042c51"
                  strokeWidth="24"
                  strokeDasharray="305.36 339.29"
                  strokeDashoffset="0"
                />
                {/* 7% Tier 2 (339.29 * 0.07 = 23.75) */}
                <circle
                  cx="70"
                  cy="70"
                  r="54"
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="24"
                  strokeDasharray="23.75 339.29"
                  strokeDashoffset="-305.36"
                />
                {/* 2% Unspecified (339.29 * 0.02 = 6.79) */}
                <circle
                  cx="70"
                  cy="70"
                  r="54"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="24"
                  strokeDasharray="6.79 339.29"
                  strokeDashoffset="-329.11"
                />
                {/* 1% Other (339.29 * 0.01 = 3.39) */}
                <circle
                  cx="70"
                  cy="70"
                  r="54"
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="24"
                  strokeDasharray="3.39 339.29"
                  strokeDashoffset="-335.90"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-mono text-3xl lg:text-4xl font-black text-slate-900 leading-none">7,363</span>
                <span className="text-[10px] font-semibold text-slate-400 mt-1">Total closed cases</span>
              </div>
            </div>

            {/* Legend list */}
            <div className="flex flex-col gap-2.5 flex-1 text-[13px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="h-3 w-3 rounded-full bg-[#042c51]" />
                  <span className="text-slate-600 font-medium">Tier 1</span>
                </div>
                <span className="font-black text-slate-800 font-mono text-sm">90%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="h-3 w-3 rounded-full bg-[#0284c7]" />
                  <span className="text-slate-600 font-medium">Tier 2</span>
                </div>
                <span className="font-black text-slate-800 font-mono text-sm">7%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="h-3 w-3 rounded-full bg-[#38bdf8]" />
                  <span className="text-slate-600 font-medium">Unspecified</span>
                </div>
                <span className="font-black text-slate-800 font-mono text-sm">2%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="h-3 w-3 rounded-full bg-[#94a3b8]" />
                  <span className="text-slate-600 font-medium">Other</span>
                </div>
                <span className="font-black text-slate-800 font-mono text-sm">1%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Donut 3: Employee Performance Distribution */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs flex flex-col justify-between min-h-0">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 shrink-0">
            <h4 className="text-sm font-black tracking-wide text-slate-800">
              Employee Performance Distribution
            </h4>
          </div>

          <div className="flex items-center justify-between gap-6 pt-2 flex-1 min-h-0">
            {/* Donut SVG */}
            <div className="relative w-52 h-52 lg:w-56 lg:h-56 xl:w-60 xl:h-60 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
                <circle cx="70" cy="70" r="54" fill="none" stroke="#f1f5f9" strokeWidth="24" />
                {/* 100% Unsatisfactory */}
                <circle
                  cx="70"
                  cy="70"
                  r="54"
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="24"
                  strokeDasharray="339.29 339.29"
                  strokeDashoffset="0"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-mono text-3xl lg:text-4xl font-black text-slate-900 leading-none">0%</span>
                <span className="text-[10px] font-semibold text-slate-400 mt-1">Satisfactory or higher</span>
              </div>
            </div>

            {/* Legend list */}
            <div className="flex flex-col gap-2.5 flex-1 text-[13px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="h-3 w-3 rounded-full bg-[#042c51]" />
                  <span className="text-slate-600 font-medium">Exceptional</span>
                </div>
                <span className="font-black text-slate-800 font-mono text-sm">0%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="h-3 w-3 rounded-full bg-[#2563eb]" />
                  <span className="text-slate-600 font-medium">Very Satisfactory</span>
                </div>
                <span className="font-black text-slate-800 font-mono text-sm">0%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="h-3 w-3 rounded-full bg-[#60a5fa]" />
                  <span className="text-slate-600 font-medium">Satisfactory</span>
                </div>
                <span className="font-black text-slate-800 font-mono text-sm">0%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="h-3 w-3 rounded-full bg-[#94a3b8]" />
                  <span className="text-slate-600 font-medium">Unsatisfactory</span>
                </div>
                <span className="font-black text-slate-800 font-mono text-sm">100%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: 3 Bottom Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 shrink-0">
        {/* Monthly Incentive Projection */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              Monthly Incentive Projection
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50/80 border border-blue-200/60 text-blue-600 shadow-2xs">
              <DollarSign className="h-3.5 w-3.5 text-blue-600" />
            </div>
          </div>
          <div className="flex items-baseline justify-between pt-2">
            <span className="font-mono text-2xl font-black text-[#042c51] leading-none">
              $0
            </span>
            <span className="text-[11px] font-semibold text-slate-400">
              Unapproved estimate
            </span>
          </div>
        </div>

        {/* Milestone Incentive Status */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              Milestone Incentive Status
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50/80 border border-blue-200/60 text-blue-600 shadow-2xs">
              <Star className="h-3.5 w-3.5 text-blue-600" />
            </div>
          </div>
          <div className="flex items-baseline justify-between pt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-2xl font-black text-[#042c51] leading-none">
                0
              </span>
              <span className="font-mono text-sm font-bold text-slate-400">
                / 67
              </span>
            </div>
            <span className="text-[11px] font-semibold text-slate-400 truncate max-w-[55%] text-right" title="Meet score threshold; not approved">
              Threshold met; unapproved
            </span>
          </div>
        </div>

        {/* Pending Validations */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              Pending Validations
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50/80 border border-blue-200/60 text-blue-600 shadow-2xs">
              <FileText className="h-3.5 w-3.5 text-blue-600" />
            </div>
          </div>
          <div className="flex items-baseline justify-between pt-2">
            <span className="font-mono text-2xl font-black text-[#042c51] leading-none">
              54
            </span>
            <span className="text-[11px] font-semibold text-slate-400">
              Require confirmation
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
