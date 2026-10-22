import React, { useState } from "react";
import { User, Menu } from "lucide-react";
import SingleSelectDropdown from "../../components/common/filters/SingleSelectDropdown";

const VIEW_OPTIONS = [
  { value: "dashboard-summary", label: "Summary" },
  { value: "dashboard-account-based", label: "Account-based KPI" },
  { value: "dashboard-kpi-indiv", label: "KPI (PMP/PIP)" },
];

export default function FrontStepsDashboardKPIIndiv({
  onNavigate,
  isSidebarHidden,
  onToggleSidebar,
}) {
  const [selectedView, setSelectedView] = useState("dashboard-kpi-indiv");

  const handleViewChange = (newView) => {
    setSelectedView(newView);
    if (onNavigate) {
      onNavigate(newView);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col font-jakarta text-slate-800 select-none pb-1 gap-2.5">
      {/* Top Filter Bar: Only 1 Dropdown Filter for the 3 Submodules */}
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

      {/* 2-Column Dashboard Canvas matching hand-drawn wireframe */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch flex-1 min-h-0">
        {/* ======================================================== */}
        {/* LEFT COLUMN: Agent Profile (Top) + KPI Donut (Bottom)     */}
        {/* Compact width (col-span-5) so the detailed cards have room */}
        {/* ======================================================== */}
        <div className="lg:col-span-5 flex flex-col gap-3 h-full min-h-0">
          {/* Top-Left: Agent Profile & 3 Field Layers with Compact Height */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-2xs hover:shadow-xs transition-all">
            <div className="flex items-stretch gap-3.5">
              {/* Photo Frame Placeholder (moderately sized, compact height) */}
              <div className="relative flex w-32 shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-[#042c51] to-[#0c4a80] text-white shadow-md p-2.5">
                <User className="h-12 w-12 text-white/95" strokeWidth={1.8} />
                <span className="text-[9px] font-black text-white/70 tracking-widest uppercase mt-1">
                  PHOTO
                </span>
              </div>

              {/* 3 Distinct Field Layers (Horizontal Key-Value Layout) */}
              <div className="flex flex-col min-w-0 flex-1 justify-between gap-1.5">
                {/* Field 1: Name */}
                <div className="flex items-center gap-2 bg-slate-50/90 px-3 py-2 rounded-xl border border-slate-200/70">
                  <span className="text-xs font-bold text-slate-500 shrink-0">
                    Name:
                  </span>
                  <span className="text-xs font-black text-slate-900 truncate">
                    Dwight Anthony Buma-at
                  </span>
                </div>

                {/* Field 2: Employee ID */}
                <div className="flex items-center gap-2 bg-slate-50/90 px-3 py-2 rounded-xl border border-slate-200/70">
                  <span className="text-xs font-bold text-slate-500 shrink-0">
                    Employee ID:
                  </span>
                  <span className="font-mono font-black text-[#042c51] text-xs">
                    FS-1001
                  </span>
                </div>

                {/* Field 3: Account */}
                <div className="flex items-center gap-2 bg-slate-50/90 px-3 py-2 rounded-xl border border-slate-200/70">
                  <span className="text-xs font-bold text-slate-500 shrink-0">
                    Account:
                  </span>
                  <span className="text-xs font-black text-slate-800 truncate">
                    FrontSteps Support
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom-Left: Substantially Bigger Donut Graph filling bottom space */}
          <div className="flex-1 rounded-2xl border border-slate-200/90 bg-white p-5 lg:p-6 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between items-center min-h-0">
            <div className="w-full flex items-center justify-between pb-2.5 border-b border-slate-100">
              <span className="text-xs font-black uppercase tracking-wider text-[#042c51]">
                KPI Breakdown
              </span>
            </div>

            {/* Substantially Larger Donut Ring Graph with Uniform Harmonic Palette */}
            <div className="relative w-full flex-1 min-h-0 flex items-center justify-center my-auto p-1">
              <svg viewBox="0 0 550 390" className="w-full h-full max-h-[460px] overflow-visible">
                {/* 
                  Center: (290, 195), Radius: 125, strokeWidth: 44 (Prominent, thick donut ring)
                  Circumference = 2 * PI * 125 = 785.398
                  Uniform Palette Slices:
                  - Productivity (45%): #042c51 (deep navy) -> 353.43 arc
                  - Efficiency (10%): #0a4880 (rich royal blue) -> 78.54 arc
                  - Consistency (15%): #1b6ca8 (vibrant cobalt blue) -> 117.81 arc
                  - CRM Documentation (30%): #3a8ac9 (slate cerulean) -> 235.62 arc
                */}
                <g transform="rotate(-90 290 195)">
                  {/* Subtle Background Ring Track */}
                  <circle
                    cx="290"
                    cy="195"
                    r="125"
                    fill="transparent"
                    stroke="#f8fafc"
                    strokeWidth="44"
                  />

                  {/* 1. Productivity (45%) - #042c51 */}
                  <circle
                    cx="290"
                    cy="195"
                    r="125"
                    fill="transparent"
                    stroke="#042c51"
                    strokeWidth="44"
                    strokeDasharray="353.43 431.97"
                    strokeDashoffset="0"
                    className="hover:opacity-85 transition-opacity cursor-pointer"
                  >
                    <title>Productivity: 45%</title>
                  </circle>

                  {/* 2. Efficiency (10%) - #0a4880 */}
                  <circle
                    cx="290"
                    cy="195"
                    r="125"
                    fill="transparent"
                    stroke="#0a4880"
                    strokeWidth="44"
                    strokeDasharray="78.54 706.86"
                    strokeDashoffset="-353.43"
                    className="hover:opacity-85 transition-opacity cursor-pointer"
                  >
                    <title>Efficiency: 10%</title>
                  </circle>

                  {/* 3. Consistency (15%) - #1b6ca8 */}
                  <circle
                    cx="290"
                    cy="195"
                    r="125"
                    fill="transparent"
                    stroke="#1b6ca8"
                    strokeWidth="44"
                    strokeDasharray="117.81 667.59"
                    strokeDashoffset="-431.97"
                    className="hover:opacity-85 transition-opacity cursor-pointer"
                  >
                    <title>Consistency: 15%</title>
                  </circle>

                  {/* 4. CRM Documentation (30%) - #3a8ac9 */}
                  <circle
                    cx="290"
                    cy="195"
                    r="125"
                    fill="transparent"
                    stroke="#3a8ac9"
                    strokeWidth="44"
                    strokeDasharray="235.62 549.78"
                    strokeDashoffset="-549.78"
                    className="hover:opacity-85 transition-opacity cursor-pointer"
                  >
                    <title>CRM Documentation: 30%</title>
                  </circle>
                </g>

                {/* Inner center badge */}
                <circle cx="290" cy="195" r="86" fill="white" className="shadow-xs" />
                <circle cx="290" cy="195" r="86" fill="none" stroke="#f1f5f9" strokeWidth="2" />
                <text
                  x="290"
                  y="185"
                  textAnchor="middle"
                  className="fill-[#042c51] text-4xl font-black font-mono tracking-tight"
                >
                  94.2%
                </text>
                <text
                  x="290"
                  y="209"
                  textAnchor="middle"
                  className="fill-slate-400 text-xs font-black uppercase tracking-wider"
                >
                  OVERALL KPI
                </text>

                {/* Callout Lines & Labels with High-Contrast Crisp Black Pointers */}
                {/* 1. Productivity: 45% PRODUCTIVITY */}
                <polyline points="390,138 418,122 436,122" fill="none" stroke="#0f172a" strokeWidth="1.8" />
                <circle cx="390" cy="138" r="3.5" fill="#000000" />
                <text x="442" y="126" className="font-mono">
                  <tspan className="fill-[#042c51] text-xs font-black">{`45% `}</tspan>
                  <tspan className="fill-slate-900 text-[10px] font-black tracking-wider font-sans uppercase">PRODUCTIVITY</tspan>
                </text>

                {/* 2. Efficiency: 10% EFFICIENCY */}
                <polyline points="290,320 290,356 310,356" fill="none" stroke="#0f172a" strokeWidth="1.8" />
                <circle cx="290" cy="320" r="3.5" fill="#000000" />
                <text x="316" y="360" className="font-mono">
                  <tspan className="fill-[#0a4880] text-xs font-black">{`10% `}</tspan>
                  <tspan className="fill-slate-900 text-[10px] font-black tracking-wider font-sans uppercase">EFFICIENCY</tspan>
                </text>

                {/* 3. Consistency: 15% CONSISTENCY */}
                <polyline points="202,266 182,290 162,290" fill="none" stroke="#0f172a" strokeWidth="1.8" />
                <circle cx="202" cy="266" r="3.5" fill="#000000" />
                <text x="156" y="294" textAnchor="end" className="font-mono">
                  <tspan className="fill-slate-900 text-[10px] font-black tracking-wider font-sans uppercase">{`CONSISTENCY `}</tspan>
                  <tspan className="fill-[#1b6ca8] text-xs font-black">15%</tspan>
                </text>

                {/* 4. CRM Documentation: 30% CRM DOCUMENTATION (Generous left space) */}
                <polyline points="196,134 176,114 156,114" fill="none" stroke="#0f172a" strokeWidth="1.8" />
                <circle cx="196" cy="134" r="3.5" fill="#000000" />
                <text x="150" y="118" textAnchor="end" className="font-mono">
                  <tspan className="fill-slate-900 text-[10px] font-black tracking-wider font-sans uppercase">{`CRM DOCUMENTATION `}</tspan>
                  <tspan className="fill-[#3a8ac9] text-xs font-black">30%</tspan>
                </text>
              </svg>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: 4 Detailed Metric Cards (Wider)             */}
        {/* Expanded width (col-span-7) to comfortably fit details   */}
        {/* ======================================================== */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-3 h-full min-h-0">
          {/* Card 1: Productivity */}
          <div className="flex-1 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-sm font-black tracking-wide text-slate-800">
                Productivity
              </h4>
            </div>

            <div className="grid grid-cols-3 gap-2.5 pt-2 text-center">
              <div className="rounded-xl bg-slate-50/90 p-2 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors">
                <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">Benchmark</span>
                <span className="text-xs font-bold text-slate-700 font-mono mt-0.5 block">140 / wk</span>
              </div>
              <div className="rounded-xl bg-slate-50/90 p-2 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors">
                <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">Actual</span>
                <span className="text-xs font-bold text-[#042c51] font-mono mt-0.5 block">146 cases</span>
              </div>
              <div className="rounded-xl bg-slate-50/90 p-2 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors">
                <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">Score</span>
                <span className="text-xs font-black text-[#042c51] font-mono mt-0.5 block">45.00</span>
              </div>
            </div>
          </div>

          {/* Card 2: Efficiency */}
          <div className="flex-1 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-sm font-black tracking-wide text-slate-800">
                Efficiency
              </h4>
            </div>

            <div className="grid grid-cols-3 gap-2.5 pt-2 text-center">
              <div className="rounded-xl bg-slate-50/90 p-2 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors">
                <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">Target AHT</span>
                <span className="text-xs font-bold text-slate-700 font-mono mt-0.5 block">≤ 900s</span>
              </div>
              <div className="rounded-xl bg-slate-50/90 p-2 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors">
                <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">Actual</span>
                <span className="text-xs font-bold text-[#042c51] font-mono mt-0.5 block">874s</span>
              </div>
              <div className="rounded-xl bg-slate-50/90 p-2 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors">
                <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">Score</span>
                <span className="text-xs font-black text-[#042c51] font-mono mt-0.5 block">9.80</span>
              </div>
            </div>
          </div>

          {/* Card 3: Consistency */}
          <div className="flex-1 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-sm font-black tracking-wide text-slate-800">
                Consistency
              </h4>
            </div>

            <div className="grid grid-cols-3 gap-2.5 pt-2 text-center">
              <div className="rounded-xl bg-slate-50/90 p-2 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors">
                <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">Adherence</span>
                <span className="text-xs font-bold text-slate-700 font-mono mt-0.5 block">96.4</span>
              </div>
              <div className="rounded-xl bg-slate-50/90 p-2 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors">
                <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">Variance</span>
                <span className="text-xs font-bold text-slate-600 font-mono mt-0.5 block">± 3.2</span>
              </div>
              <div className="rounded-xl bg-slate-50/90 p-2 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors">
                <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">Score</span>
                <span className="text-xs font-black text-[#042c51] font-mono mt-0.5 block">14.85</span>
              </div>
            </div>
          </div>

          {/* Card 4: CRM Documentation */}
          <div className="flex-1 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-sm font-black tracking-wide text-slate-800">
                CRM Documentation
              </h4>
            </div>

            <div className="grid grid-cols-3 gap-2.5 pt-2 text-center">
              <div className="rounded-xl bg-slate-50/90 p-2 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors">
                <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">Resolution</span>
                <span className="text-xs font-bold text-slate-700 font-mono mt-0.5 block">99.2</span>
              </div>
              <div className="rounded-xl bg-slate-50/90 p-2 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors">
                <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">Sub Code</span>
                <span className="text-xs font-bold text-[#042c51] font-mono mt-0.5 block">96.5</span>
              </div>
              <div className="rounded-xl bg-slate-50/90 p-2 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors">
                <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">Score</span>
                <span className="text-xs font-black text-[#042c51] font-mono mt-0.5 block">29.10</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
