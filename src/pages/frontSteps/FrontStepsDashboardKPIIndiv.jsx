import React, { useState, useRef, useEffect } from "react";
import { User, Menu, Download, Loader2, ArrowUp, ArrowUpRight, Compass } from "lucide-react";
import SingleSelectDropdown from "../../components/common/filters/SingleSelectDropdown";
import AnimatedNumber, { useAnimatedNumber } from "../../components/modules/frontsteps/AnimatedNumber";
import FrontStepsDashboardGuide, { KPI_INDIV_GUIDE_STEPS } from "../../components/modules/frontsteps/FrontStepsDashboardGuide";

const VIEW_OPTIONS = [
  { value: "dashboard-summary", label: "Summary" },
  { value: "dashboard-account-based", label: "Account-based KPI" },
  { value: "dashboard-kpi-indiv", label: "KPI (PMP/PIP)" },
];

const EMPLOYEE_OPTIONS = [
  { value: "FS-1001", label: "Dwight Anthony Buma-at (FS-1001)", name: "Dwight Anthony Buma-at", id: "FS-1001", account: "FrontSteps Support", lob: "Customer Care" },
  { value: "FS-1002", label: "Janine Marie Dela Cruz (FS-1002)", name: "Janine Marie Dela Cruz", id: "FS-1002", account: "FrontSteps Support", lob: "Customer Care" },
  { value: "FS-1003", label: "Carlos Miguel Mendoza (FS-1003)", name: "Carlos Miguel Mendoza", id: "FS-1003", account: "FrontSteps Support", lob: "Technical Support" },
  { value: "FS-1004", label: "Beatrice Anne Santos (FS-1004)", name: "Beatrice Anne Santos", id: "FS-1004", account: "FrontSteps Support", lob: "Customer Care" },
  { value: "FS-1005", label: "Rafael Dominic Castro (FS-1005)", name: "Rafael Dominic Castro", id: "FS-1005", account: "FrontSteps Support", lob: "Technical Support" },
  { value: "FS-1006", label: "Patricia Nicole Reyes (FS-1006)", name: "Patricia Nicole Reyes", id: "FS-1006", account: "FrontSteps Support", lob: "Customer Care" },
];

const PERIOD_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "annually", label: "Annually" },
];

const MONTH_OPTIONS = [
  { value: "all", label: "All Months" },
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

/**
 * TypewriterText: Sequentially types out text character-by-character in sync
 * with a subtle blink cursor while typing. Resets whenever text changes.
 */
function TypewriterText({ text, speed = 25, delay = 80, className = "" }) {
  const [displayedLength, setDisplayedLength] = useState(0);

  useEffect(() => {
    setDisplayedLength(0);
    const startTimeout = setTimeout(() => {
      let current = 0;
      const interval = setInterval(() => {
        current += 1;
        setDisplayedLength(current);
        if (current >= (text?.length || 0)) {
          clearInterval(interval);
        }
      }, speed);
      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(startTimeout);
  }, [text, speed, delay]);

  const visibleText = (text || "").slice(0, displayedLength);
  const isTyping = displayedLength < (text?.length || 0);

  return (
    <span className={`inline-flex items-center ${className}`}>
      <span>{visibleText}</span>
      {isTyping && (
        <span className="ml-0.5 inline-block w-[2px] h-[1em] bg-blue-500 animate-kpi-cursor align-middle" />
      )}
    </span>
  );
}


const KPI_COLORS = {
  target: "#052648",       // Target / Benchmark (Deep Navy)
  targetDark: "#03172c",   // Target Pin / Bubble (Deepest Navy)
  actual: "#2E80C4",       // Actual / Completed (Bright Sky Cerulean Blue)
  actualDark: "#1b6ca8",   // Actual Pin / Bubble (Cerulean Blue)
  compliance: "#165B99",   // Compliance / Success (Rich Cerulean Navy)
  complianceBg: "#e0f2fe", // Compliance subtle pill background (Soft Blue)
  weightedScore: "#0A3D6B",// Weighted Scores (Deep Ocean Blue)
  warning: "#DC2626",      // Warning / Threshold
  incomplete: "#94A3B8",   // Incomplete / Neutral (Remainder / Audit info)
  // KPI Breakdown 4 distinct blue shades matching the exact hue palette (Productivity 45%, Efficiency 10%, Consistency 15%, CRM Documentation 30%)
  breakdown: {
    productivity: "#052648", // 45% - Deepest Midnight Navy
    efficiency: "#0a3d6b",   // 10% - Deep Ocean Blue
    consistency: "#165b99",  // 15% - Rich Cerulean Navy
    crm: "#2e80c4",          // 30% - Bright Sky Cerulean
  },
};

export default function FrontStepsDashboardKPIIndiv({
  onNavigate,
  isSidebarHidden,
  onToggleSidebar,
}) {
  const [selectedView, setSelectedView] = useState("dashboard-kpi-indiv");
  const [selectedEmployee, setSelectedEmployee] = useState("FS-1001");
  const [selectedPeriod, setSelectedPeriod] = useState("weekly");
  const [selectedMonth, setSelectedMonth] = useState("10");
  const [isExporting, setIsExporting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [showCallouts, setShowCallouts] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const dashboardRef = useRef(null);

  useEffect(() => {
    setIsMounted(false);
    setShowCallouts(false);
    const mountTimer = setTimeout(() => setIsMounted(true), 50);
    // Donut sweep animation finishes smoothly around 1.6s - wait for it to load first!
    const calloutTimer = setTimeout(() => setShowCallouts(true), 1700);
    return () => {
      clearTimeout(mountTimer);
      clearTimeout(calloutTimer);
    };
  }, [selectedEmployee, selectedPeriod, selectedMonth]);

  const animatedOverallKpi = useAnimatedNumber("94.2%", 1600, 150);

  const currentEmployee =
    EMPLOYEE_OPTIONS.find((emp) => emp.value === selectedEmployee) ||
    EMPLOYEE_OPTIONS[0];

  const handleViewChange = (newView) => {
    setSelectedView(newView);
    if (onNavigate) {
      onNavigate(newView);
    }
  };

  const handleExportPDF = async () => {
    if (!dashboardRef.current || isExporting) return;
    setIsExporting(true);

    try {
      const html2canvasModule = await import("html2canvas-pro");
      const html2canvas = html2canvasModule.default || html2canvasModule.html2canvas;
      const { jsPDF } = await import("jspdf");

      // Give a tiny moment for layout to settle
      await new Promise((resolve) => setTimeout(resolve, 150));

      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#f8fbfd",
      });

      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Report Header Banner
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.setTextColor(4, 44, 81);
      pdf.text(`INDIVIDUAL KPI REPORT - ${currentEmployee.name.toUpperCase()}`, 10, 10);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(100, 116, 139);
      const now = new Date();
      const timestamp = now.toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      pdf.text(
        `Employee ID: ${currentEmployee.id}  |  Period: ${selectedPeriod.toUpperCase()}  |  Generated: ${timestamp}`,
        10,
        15
      );

      // Fit dashboard across the full width and fill down with minimal 5mm side margins
      const margin = 6;
      const topOffset = 18;
      const printWidth = pdfWidth - margin * 2;
      const imgProps = pdf.getImageProperties(imgData);
      const imgRatio = imgProps.width / imgProps.height;
      const printHeight = printWidth / imgRatio;

      pdf.addImage(imgData, "PNG", margin, topOffset, printWidth, printHeight);

      const filename = `KPI_Report_${currentEmployee.id}_${selectedPeriod}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error("PDF export error:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col font-jakarta text-slate-800 select-none gap-3 w-full lg:h-full lg:min-h-0 lg:flex-1 lg:justify-between lg:overflow-hidden pb-6 lg:pb-0">
      {/* Top Filter Bar: View Mode, Employee, Period, Month, Export Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/90 bg-white px-3.5 py-2 shadow-2xs shrink-0">
        <div className="flex flex-wrap items-center gap-2.5">
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

          {/* 1. View Mode */}
          <div id="guide-indiv-view-mode" className="flex items-center gap-2 rounded-lg border border-slate-200/90 bg-slate-50/70 px-2.5 py-1">
            <span className="text-xs font-black uppercase tracking-wider text-[#042c51]">
              View Mode:
            </span>
            <div className="w-[180px]">
              <SingleSelectDropdown
                value={selectedView}
                onChange={(e) => handleViewChange(e.target.value)}
                placeholder="Select View"
                options={VIEW_OPTIONS}
                buttonClassName="h-8 rounded-lg border-slate-200 bg-white px-3 text-xs font-bold text-[#042c51] hover:border-slate-300 shadow-2xs transition-all"
              />
            </div>
          </div>
        </div>

        {/* Filters Group: Employee, Period, Month, Export Button, and Dashboard Guide */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div id="guide-indiv-filters" className="flex flex-wrap items-center gap-2.5">
            {/* 2. Employee Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Employee:
              </span>
              <div className="w-[210px]">
                <SingleSelectDropdown
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  placeholder="Select Employee"
                  options={EMPLOYEE_OPTIONS}
                  buttonClassName="h-8 rounded-lg border-slate-200 bg-slate-50/70 px-3 text-xs font-bold text-slate-800 hover:border-slate-300 hover:bg-white shadow-2xs transition-all"
                />
              </div>
            </div>

            {/* 3. Period Dropdown (daily, weekly, monthly, annually) */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Period:
              </span>
              <div className="w-[125px]">
                <SingleSelectDropdown
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  placeholder="Select Period"
                  options={PERIOD_OPTIONS}
                  buttonClassName="h-8 rounded-lg border-slate-200 bg-slate-50/70 px-3 text-xs font-bold text-slate-800 hover:border-slate-300 hover:bg-white shadow-2xs transition-all"
                />
              </div>
            </div>

            {/* 4. Month Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Month:
              </span>
              <div className="w-[130px]">
                <SingleSelectDropdown
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  placeholder="Select Month"
                  options={MONTH_OPTIONS}
                  buttonClassName="h-8 rounded-lg border-slate-200 bg-slate-50/70 px-3 text-xs font-bold text-slate-800 hover:border-slate-300 hover:bg-white shadow-2xs transition-all"
                />
              </div>
            </div>
          </div>

          {/* 5. Export PDF Button */}
          <button
            id="guide-indiv-export"
            type="button"
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center gap-1.5 h-8 rounded-lg bg-[#042c51] hover:bg-[#0c4a80] text-white px-3 text-xs font-bold shadow-2xs hover:shadow-xs transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
            title="Export dashboard as PDF"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5 text-blue-200" />
                <span>Export</span>
              </>
            )}
          </button>

          {/* Dashboard Guide Trigger Button */}
          <button
            type="button"
            onClick={() => setIsGuideOpen(true)}
            className="flex items-center gap-1.5 h-8 rounded-lg bg-[#042c51] hover:bg-[#0c4a80] text-white px-3 text-xs font-bold shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer"
            title="Open Interactive Dashboard Guide"
          >
            <Compass className="h-3.5 w-3.5 text-sky-300" />
            <span>Dashboard Guide</span>
          </button>
        </div>
      </div>

      {/* 2-Column Dashboard Canvas matching hand-drawn wireframe */}
      <div
        ref={dashboardRef}
        className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch flex-1 min-h-0 pb-3 lg:pb-0"
      >
        {/* ======================================================== */}
        {/* LEFT COLUMN: Agent Profile (Top) + KPI Donut (Bottom)     */}
        {/* Reduced width (col-span-4) to give more room for metrics */}
        {/* ======================================================== */}
        <div className="lg:col-span-4 flex flex-col gap-2.5 h-auto lg:h-full min-h-0">
          {/* Top-Left: Agent Profile & 4 Field Layers (Taller height h-[185px]) with smooth entrance animation */}
          <div id="guide-indiv-agent-profile" className="rounded-2xl border border-slate-200/90 bg-white p-3 lg:p-3.5 shadow-2xs hover:shadow-xs transition-all min-h-[185px] lg:h-[185px] shrink-0 flex flex-col justify-center animate-kpi-enter">
            <div className="flex items-stretch gap-3 h-full">
              {/* Photo Frame Placeholder */}
              <div className="relative flex w-28 shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-[#042c51] to-[#0c4a80] text-white shadow-sm p-2.5 group">
                <User className="h-12 w-12 text-white/95 transition-transform duration-300 group-hover:scale-105" strokeWidth={1.8} />
                <span className="text-[9px] font-black text-white/70 tracking-widest uppercase mt-1">
                  PHOTO
                </span>
              </div>

              {/* 4 Distinct Field Layers with Staggered Cascading Animations */}
              <div className="flex flex-col min-w-0 flex-1 justify-between gap-1.5 h-full">
                {/* Field 1: Name */}
                <div
                  className="flex items-center gap-2 bg-slate-50/90 px-3 py-1.5 rounded-xl border border-slate-200/70 flex-1 min-w-0 transition-all duration-300 hover:bg-slate-100/90"
                >
                  <span className="text-xs font-bold text-slate-500 shrink-0">
                    Name:
                  </span>
                  <TypewriterText
                    text={currentEmployee.name}
                    speed={25}
                    delay={100}
                    className="text-xs font-black text-slate-900 truncate"
                  />
                </div>

                {/* Field 2: Employee ID */}
                <div
                  className="flex items-center gap-2 bg-slate-50/90 px-3 py-1.5 rounded-xl border border-slate-200/70 flex-1 min-w-0 transition-all duration-300 hover:bg-slate-100/90"
                >
                  <span className="text-xs font-bold text-slate-500 shrink-0">
                    ID:
                  </span>
                  <TypewriterText
                    text={currentEmployee.id}
                    speed={25}
                    delay={100}
                    className="font-black text-slate-950 text-xs font-jakarta truncate"
                  />
                </div>

                {/* Field 3: Account */}
                <div
                  className="flex items-center gap-2 bg-slate-50/90 px-3 py-1.5 rounded-xl border border-slate-200/70 flex-1 min-w-0 transition-all duration-300 hover:bg-slate-100/90"
                >
                  <span className="text-xs font-bold text-slate-500 shrink-0">
                    Account:
                  </span>
                  <TypewriterText
                    text={currentEmployee.account}
                    speed={25}
                    delay={100}
                    className="text-xs font-black text-slate-800 truncate"
                  />
                </div>

                {/* Field 4: Line of Business */}
                <div
                  className="flex items-center gap-2 bg-slate-50/90 px-3 py-1.5 rounded-xl border border-slate-200/70 flex-1 min-w-0 transition-all duration-300 hover:bg-slate-100/90"
                >
                  <span className="text-xs font-bold text-slate-500 shrink-0">
                    LOB:
                  </span>
                  <TypewriterText
                    text={currentEmployee.lob}
                    speed={25}
                    delay={100}
                    className="text-xs font-black text-slate-800 truncate"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom-Left: Substantially Bigger Donut Graph filling bottom space */}
          <div id="guide-indiv-overall-kpi" className="flex-1 rounded-2xl border border-slate-200/90 bg-white p-3.5 lg:p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between items-center min-h-[320px] lg:min-h-0">
            <div className="w-full flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-black uppercase tracking-wider text-[#042c51]">
                KPI Breakdown
              </span>
            </div>

            {/* Substantially Larger Donut Ring Graph with Uniform Harmonic Palette */}
            <div className="relative w-full flex-1 min-h-[250px] lg:min-h-0 flex items-center justify-center my-auto p-1">
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

                  {/* 1. Productivity (45%) */}
                  <circle
                    cx="290"
                    cy="195"
                    r="125"
                    fill="transparent"
                    stroke={KPI_COLORS.breakdown.productivity}
                    strokeWidth="44"
                    strokeDasharray={isMounted ? "353.43 431.97" : "0 785.4"}
                    strokeDashoffset="0"
                    style={{ transition: "stroke-dasharray 1.6s cubic-bezier(0.2, 0.8, 0.2, 1) 0.05s" }}
                    className="hover:opacity-85 cursor-pointer"
                  >
                    <title>Productivity: 45%</title>
                  </circle>

                  {/* 2. Efficiency (10%) */}
                  <circle
                    cx="290"
                    cy="195"
                    r="125"
                    fill="transparent"
                    stroke={KPI_COLORS.breakdown.efficiency}
                    strokeWidth="44"
                    strokeDasharray={isMounted ? "78.54 706.86" : "0 785.4"}
                    strokeDashoffset="-353.43"
                    style={{ transition: "stroke-dasharray 1.6s cubic-bezier(0.2, 0.8, 0.2, 1) 0.25s" }}
                    className="hover:opacity-85 cursor-pointer"
                  >
                    <title>Efficiency: 10%</title>
                  </circle>

                  {/* 3. Consistency (15%) */}
                  <circle
                    cx="290"
                    cy="195"
                    r="125"
                    fill="transparent"
                    stroke={KPI_COLORS.breakdown.consistency}
                    strokeWidth="44"
                    strokeDasharray={isMounted ? "117.81 667.59" : "0 785.4"}
                    strokeDashoffset="-431.97"
                    style={{ transition: "stroke-dasharray 1.6s cubic-bezier(0.2, 0.8, 0.2, 1) 0.45s" }}
                    className="hover:opacity-85 cursor-pointer"
                  >
                    <title>Consistency: 15%</title>
                  </circle>

                  {/* 4. CRM Documentation (30%) */}
                  <circle
                    cx="290"
                    cy="195"
                    r="125"
                    fill="transparent"
                    stroke={KPI_COLORS.breakdown.crm}
                    strokeWidth="44"
                    strokeDasharray={isMounted ? "235.62 549.78" : "0 785.4"}
                    strokeDashoffset="-549.78"
                    style={{ transition: "stroke-dasharray 1.6s cubic-bezier(0.2, 0.8, 0.2, 1) 0.65s" }}
                    className="hover:opacity-85 cursor-pointer"
                  >
                    <title>CRM Documentation: 30%</title>
                  </circle>
                </g>

                {/* Inner center badge */}
                <circle cx="290" cy="195" r="86" fill="white" className="shadow-xs" />
                <circle cx="290" cy="195" r="86" fill="none" stroke="#e2e8f0" strokeWidth="1.5" />
                <text
                  x="290"
                  y="192"
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="fill-slate-950 text-4xl font-black font-jakarta tracking-tight select-none"
                >
                  {animatedOverallKpi}
                </text>
                <text
                  x="290"
                  y="234"
                  textAnchor="middle"
                  className="fill-slate-600 text-[11px] font-black uppercase tracking-wider font-jakarta select-none"
                >
                  OVERALL KPI
                </text>

                {/* Callout Lines & Labels with High-Contrast Crisp Black Pointers - Revealed after graph loads */}
                <g
                  style={{
                    opacity: showCallouts ? 1 : 0,
                    transform: showCallouts ? "scale(1)" : "scale(0.97)",
                    transformOrigin: "290px 195px",
                    transition: "opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
                    pointerEvents: showCallouts ? "auto" : "none",
                  }}
                >
                  {/* 1. Productivity: 45% PRODUCTIVITY */}
                  <g style={{
                    opacity: showCallouts ? 1 : 0,
                    transform: showCallouts ? "translate(0, 0)" : "translate(8px, 0)",
                    transition: "opacity 0.4s ease 0ms, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0ms"
                  }}>
                    <polyline points="390,138 418,122 436,122" fill="none" stroke="#0f172a" strokeWidth="1.8" />
                    <circle cx="390" cy="138" r="3.5" fill="#000000" />
                    <text x="442" y="126" className="font-jakarta select-none">
                      <tspan className="text-xs font-black" style={{ fill: KPI_COLORS.breakdown.productivity }}>{`45% `}</tspan>
                      <tspan className="fill-slate-950 text-[10px] font-black tracking-wider font-jakarta uppercase">PRODUCTIVITY</tspan>
                    </text>
                  </g>

                  {/* 2. Efficiency: 10% EFFICIENCY */}
                  <g style={{
                    opacity: showCallouts ? 1 : 0,
                    transform: showCallouts ? "translate(0, 0)" : "translate(0, 8px)",
                    transition: "opacity 0.4s ease 80ms, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1) 80ms"
                  }}>
                    <polyline points="290,320 290,356 310,356" fill="none" stroke="#0f172a" strokeWidth="1.8" />
                    <circle cx="290" cy="320" r="3.5" fill="#000000" />
                    <text x="316" y="360" className="font-jakarta select-none">
                      <tspan className="text-xs font-black" style={{ fill: KPI_COLORS.breakdown.efficiency }}>{`10% `}</tspan>
                      <tspan className="fill-slate-950 text-[10px] font-black tracking-wider font-jakarta uppercase">EFFICIENCY</tspan>
                    </text>
                  </g>

                  {/* 3. Consistency: 15% CONSISTENCY */}
                  <g style={{
                    opacity: showCallouts ? 1 : 0,
                    transform: showCallouts ? "translate(0, 0)" : "translate(-8px, 0)",
                    transition: "opacity 0.4s ease 160ms, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1) 160ms"
                  }}>
                    <polyline points="202,266 182,290 162,290" fill="none" stroke="#0f172a" strokeWidth="1.8" />
                    <circle cx="202" cy="266" r="3.5" fill="#000000" />
                    <text x="156" y="294" textAnchor="end" className="font-jakarta select-none">
                      <tspan className="fill-slate-950 text-[10px] font-black tracking-wider font-jakarta uppercase">{`CONSISTENCY `}</tspan>
                      <tspan className="text-xs font-black" style={{ fill: KPI_COLORS.breakdown.consistency }}>15%</tspan>
                    </text>
                  </g>

                  {/* 4. CRM Documentation: 30% CRM DOCUMENTATION (Generous left space) */}
                  <g style={{
                    opacity: showCallouts ? 1 : 0,
                    transform: showCallouts ? "translate(0, 0)" : "translate(-8px, 0)",
                    transition: "opacity 0.4s ease 240ms, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1) 240ms"
                  }}>
                    <polyline points="196,134 176,114 156,114" fill="none" stroke="#0f172a" strokeWidth="1.8" />
                    <circle cx="196" cy="134" r="3.5" fill="#000000" />
                    <text x="150" y="118" textAnchor="end" className="font-jakarta select-none">
                      <tspan className="fill-slate-950 text-[10px] font-black tracking-wider font-jakarta uppercase">{`CRM DOCUMENTATION `}</tspan>
                      <tspan className="text-xs font-black" style={{ fill: KPI_COLORS.breakdown.crm }}>30%</tspan>
                    </text>
                  </g>
                </g>
              </svg>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: Productivity & Consistency + Efficiency (Top), CRM (Bottom) */}
        {/* Expanded width (col-span-8) for balanced side-by-side layout */}
        {/* ======================================================== */}
        <div className="lg:col-span-8 flex flex-col gap-2.5 h-auto lg:h-full min-h-0">
          {/* Top Row: Left sub-column (Productivity + Consistency) & Right sub-column (Efficiency Gauge) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-stretch shrink-0">
            {/* Left Stack (md:col-span-7 xl:col-span-8): Productivity + Consistency */}
            <div id="guide-indiv-prod-cons" className="md:col-span-7 xl:col-span-8 flex flex-col gap-2.5">
              {/* Card 1: Productivity (Interactive Target vs Actual Progress + Score) */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-3 shadow-2xs hover:shadow-xs transition-all flex items-stretch justify-between shrink-0 min-h-[135px] lg:h-[124px] gap-2 lg:gap-3 animate-fade-up" style={{ animationDelay: "100ms" }}>
                {/* Left: Title on top, Progress Bars below */}
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div className="flex items-center justify-between shrink-0">
                    <h4 className="text-xs font-black tracking-wider text-slate-900 uppercase font-jakarta">
                      PRODUCTIVITY
                    </h4>
                  </div>

                  {/* 2 Progress Bar Rows (Compact) */}
                  <div className="flex flex-col gap-2 min-w-0 mb-0.5">
                    {/* Row 1: CASES CLOSED TARGET (Moved up slightly) */}
                    <div className="rounded-xl bg-[#f0f4f9] px-2.5 py-1 flex items-center gap-2 relative -translate-y-2.5 overflow-visible">
                      <span className="text-[10px] font-black uppercase text-slate-900 tracking-wide w-32 lg:w-36 shrink-0 font-jakarta truncate">
                        CASES CLOSED TARGET
                      </span>
                      <div className="flex-1 relative flex items-center">
                        {/* Track */}
                        <div className="h-2 w-full bg-[#dde5ee] rounded-full overflow-hidden">
                          {/* Fill Bar: Target / Benchmark */}
                          <div
                            className="h-full rounded-full"
                            style={{
                              backgroundColor: KPI_COLORS.target,
                              width: isMounted ? "78%" : "0%",
                              transition: "width 1.6s cubic-bezier(0.2, 0.8, 0.2, 1) 0.2s",
                            }}
                          />
                        </div>

                        {/* Tooltip Pin / Marker positioned over endpoint */}
                        <div
                          className="absolute flex flex-col items-center pointer-events-none -top-6 -translate-x-1/2 z-20"
                          style={{
                            left: isMounted ? "78%" : "0%",
                            opacity: isMounted ? 1 : 0,
                            transition: "left 1.6s cubic-bezier(0.2, 0.8, 0.2, 1) 0.2s, opacity 0.4s ease 0.25s",
                          }}
                        >
                          {/* Tooltip Speech Bubble */}
                          <div
                            className="relative text-white text-[9px] font-black px-2 py-0.5 rounded shadow-xs whitespace-nowrap font-jakarta"
                            style={{ backgroundColor: KPI_COLORS.targetDark }}
                          >
                            140 /wk Target
                            <div
                              className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-[3px] border-x-transparent border-t-[3.5px]"
                              style={{ borderTopColor: KPI_COLORS.targetDark }}
                            />
                          </div>
                          {/* Pin Dot with crisp white ring */}
                          <div
                            className="w-2 h-2 rounded-full ring-1.5 ring-white shadow-xs z-10 mt-0.5"
                            style={{ backgroundColor: KPI_COLORS.targetDark }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Row 2: CASES CLOSED */}
                    <div className="rounded-xl bg-[#f0f4f9] px-2.5 py-1 flex items-center gap-2 relative overflow-visible">
                      <span className="text-[10px] font-black uppercase text-slate-900 tracking-wide w-32 lg:w-36 shrink-0 font-jakarta truncate">
                        CASES CLOSED
                      </span>
                      <div className="flex-1 relative flex items-center">
                        {/* Track */}
                        <div className="h-2 w-full bg-[#dde5ee] rounded-full overflow-hidden">
                          {/* Fill Bar: Actual / Completed */}
                          <div
                            className="h-full rounded-full"
                            style={{
                              backgroundColor: KPI_COLORS.actual,
                              width: isMounted ? "83%" : "0%",
                              transition: "width 1.6s cubic-bezier(0.2, 0.8, 0.2, 1) 0.35s",
                            }}
                          />
                        </div>

                        {/* Tooltip Pin / Marker positioned over endpoint */}
                        <div
                          className="absolute flex flex-col items-center pointer-events-none -top-6 -translate-x-1/2 z-20"
                          style={{
                            left: isMounted ? "83%" : "0%",
                            opacity: isMounted ? 1 : 0,
                            transition: "left 1.6s cubic-bezier(0.2, 0.8, 0.2, 1) 0.35s, opacity 0.4s ease 0.35s",
                          }}
                        >
                          {/* Tooltip Speech Bubble */}
                          <div
                            className="relative text-white text-[9px] font-black px-2 py-0.5 rounded shadow-xs whitespace-nowrap font-jakarta"
                            style={{ backgroundColor: KPI_COLORS.actualDark }}
                          >
                            146 Cases Closed
                            <div
                              className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-[3px] border-x-transparent border-t-[3.5px]"
                              style={{ borderTopColor: KPI_COLORS.actualDark }}
                            />
                          </div>
                          {/* Pin Dot with crisp white ring */}
                          <div
                            className="w-2 h-2 rounded-full ring-1.5 ring-white shadow-xs z-10 mt-0.5"
                            style={{ backgroundColor: KPI_COLORS.actualDark }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Summary Metrics */}
                <div className="shrink-0 flex flex-col justify-center gap-2 pl-3 lg:pl-4 pr-1 border-l border-slate-200/70 min-w-[125px] lg:min-w-[135px] py-0.5">
                  {/* Metric 1: Cases Closed Achievement % */}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[18px] lg:text-[20px] font-black font-jakarta leading-none tracking-tight" style={{ color: KPI_COLORS.compliance }}>
                        <AnimatedNumber value="104.3%" duration={1600} delay={200} />
                      </span>
                      <span
                        className="inline-flex items-center justify-center h-5 w-5 rounded-full shrink-0 shadow-2xs"
                        style={{ backgroundColor: KPI_COLORS.complianceBg, color: KPI_COLORS.compliance }}
                      >
                        <ArrowUp className="h-3 w-3 stroke-[2.5]" />
                      </span>
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-jakarta mt-0.5">
                      CASES CLOSED %
                    </span>
                  </div>

                  {/* Metric 2: Weighted Score */}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="text-[18px] lg:text-[20px] font-black font-jakarta leading-none tracking-tight"
                        style={{ color: KPI_COLORS.weightedScore }}
                      >
                        <AnimatedNumber value="45.00" duration={1600} delay={300} />
                      </span>
                      <svg className="w-5 h-5 -rotate-90 shrink-0" viewBox="0 0 32 32">
                        <circle
                          cx="16"
                          cy="16"
                          r="12"
                          fill="none"
                          stroke="#dde5ee"
                          strokeWidth="3.6"
                        />
                        <circle
                          cx="16"
                          cy="16"
                          r="12"
                          fill="none"
                          stroke={KPI_COLORS.weightedScore}
                          strokeWidth="3.6"
                          strokeLinecap="round"
                          strokeDasharray={isMounted ? "35 75.4" : "0 75.4"}
                          style={{
                            transition: "stroke-dasharray 1.6s cubic-bezier(0.2, 0.8, 0.2, 1) 0.3s",
                          }}
                        />
                      </svg>
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-jakarta mt-0.5">
                      WEIGHTED SCORE
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Consistency (Interactive Calls Progress + Score) */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-3 shadow-2xs hover:shadow-xs transition-all flex items-stretch justify-between shrink-0 min-h-[135px] lg:h-[124px] gap-2 lg:gap-3 animate-fade-up" style={{ animationDelay: "200ms" }}>
                {/* Left: Title on top, Progress Bars below */}
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div className="flex items-center justify-between shrink-0">
                    <h4 className="text-xs font-black tracking-wider text-slate-900 uppercase font-jakarta">
                      CONSISTENCY
                    </h4>
                  </div>

                  {/* 2 Progress Bar Rows (Compact) */}
                  <div className="flex flex-col gap-2 min-w-0 mb-0.5">
                    {/* Row 1: ANSWERED CALLS (Moved up slightly matching Productivity) */}
                    <div className="rounded-xl bg-[#f0f4f9] px-2.5 py-1 flex items-center gap-2 relative -translate-y-2.5 overflow-visible">
                      <span className="text-[10px] font-black uppercase text-slate-900 tracking-wide w-28 lg:w-32 shrink-0 font-jakarta truncate">
                        ANSWERED CALLS
                      </span>
                      <div className="flex-1 relative flex items-center">
                        {/* Track */}
                        <div className="h-2 w-full bg-[#dde5ee] rounded-full overflow-hidden">
                          {/* Fill Bar: Target / Benchmark */}
                          <div
                            className="h-full rounded-full"
                            style={{
                              backgroundColor: KPI_COLORS.target,
                              width: isMounted ? "82%" : "0%",
                              transition: "width 1.6s cubic-bezier(0.2, 0.8, 0.2, 1) 0.35s",
                            }}
                          />
                        </div>

                        {/* Tooltip Pin / Marker positioned over endpoint */}
                        <div
                          className="absolute flex flex-col items-center pointer-events-none -top-6 -translate-x-1/2 z-20"
                          style={{
                            left: isMounted ? "82%" : "0%",
                            opacity: isMounted ? 1 : 0,
                            transition: "left 1.6s cubic-bezier(0.2, 0.8, 0.2, 1) 0.35s, opacity 0.4s ease 0.4s",
                          }}
                        >
                          {/* Tooltip Speech Bubble */}
                          <div
                            className="relative text-white text-[9px] font-black px-2 py-0.5 rounded shadow-xs whitespace-nowrap font-jakarta"
                            style={{ backgroundColor: KPI_COLORS.targetDark }}
                          >
                            145 Calls
                            <div
                              className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-[3px] border-x-transparent border-t-[3.5px]"
                              style={{ borderTopColor: KPI_COLORS.targetDark }}
                            />
                          </div>
                          {/* Pin Dot with crisp white ring */}
                          <div
                            className="w-2 h-2 rounded-full ring-1.5 ring-white shadow-xs z-10 mt-0.5"
                            style={{ backgroundColor: KPI_COLORS.targetDark }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Row 2: CALLS ≤900SEC */}
                    <div className="rounded-xl bg-[#f0f4f9] px-2.5 py-1 flex items-center gap-2 relative overflow-visible">
                      <span className="text-[10px] font-black uppercase text-slate-900 tracking-wide w-28 lg:w-32 shrink-0 font-jakarta truncate">
                        CALLS ≤900SEC
                      </span>
                      <div className="flex-1 relative flex items-center">
                        {/* Track */}
                        <div className="h-2 w-full bg-[#dde5ee] rounded-full overflow-hidden">
                          {/* Fill Bar: Actual / Completed */}
                          <div
                            className="h-full rounded-full"
                            style={{
                              backgroundColor: KPI_COLORS.actual,
                              width: isMounted ? "78%" : "0%",
                              transition: "width 1.6s cubic-bezier(0.2, 0.8, 0.2, 1) 0.5s",
                            }}
                          />
                        </div>

                        {/* Tooltip Pin / Marker positioned over endpoint */}
                        <div
                          className="absolute flex flex-col items-center pointer-events-none -top-6 -translate-x-1/2 z-20"
                          style={{
                            left: isMounted ? "78%" : "0%",
                            opacity: isMounted ? 1 : 0,
                            transition: "left 1.6s cubic-bezier(0.2, 0.8, 0.2, 1) 0.5s, opacity 0.4s ease 0.5s",
                          }}
                        >
                          {/* Tooltip Speech Bubble */}
                          <div
                            className="relative text-white text-[9px] font-black px-2 py-0.5 rounded shadow-xs whitespace-nowrap font-jakarta"
                            style={{ backgroundColor: KPI_COLORS.actualDark }}
                          >
                            138 Calls ≤900s
                            <div
                              className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-[3px] border-x-transparent border-t-[3.5px]"
                              style={{ borderTopColor: KPI_COLORS.actualDark }}
                            />
                          </div>
                          {/* Pin Dot with crisp white ring */}
                          <div
                            className="w-2 h-2 rounded-full ring-1.5 ring-white shadow-xs z-10 mt-0.5"
                            style={{ backgroundColor: KPI_COLORS.actualDark }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Summary Metrics */}
                <div className="shrink-0 flex flex-col justify-center gap-2 pl-3 lg:pl-4 pr-1 border-l border-slate-200/70 min-w-[125px] lg:min-w-[135px] py-0.5">
                  {/* Metric 1: AHT Compliance % */}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[18px] lg:text-[20px] font-black font-jakarta leading-none tracking-tight" style={{ color: KPI_COLORS.compliance }}>
                        <AnimatedNumber value="95.2%" duration={1600} delay={450} />
                      </span>
                      <span
                        className="inline-flex items-center justify-center h-5 w-5 rounded-full shrink-0 shadow-2xs"
                        style={{ backgroundColor: KPI_COLORS.complianceBg, color: KPI_COLORS.compliance }}
                      >
                        <ArrowUp className="h-3 w-3 stroke-[2.5]" />
                      </span>
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-jakarta mt-0.5">
                      AHT COMPLIANCE %
                    </span>
                  </div>

                  {/* Metric 2: Weighted Score */}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="text-[18px] lg:text-[20px] font-black font-jakarta leading-none tracking-tight"
                        style={{ color: KPI_COLORS.weightedScore }}
                      >
                        <AnimatedNumber value="14.85" duration={1600} delay={500} />
                      </span>
                      <svg className="w-5 h-5 -rotate-90 shrink-0" viewBox="0 0 32 32">
                        <circle
                          cx="16"
                          cy="16"
                          r="12"
                          fill="none"
                          stroke="#dde5ee"
                          strokeWidth="3.6"
                        />
                        <circle
                          cx="16"
                          cy="16"
                          r="12"
                          fill="none"
                          stroke={KPI_COLORS.weightedScore}
                          strokeWidth="3.6"
                          strokeLinecap="round"
                          strokeDasharray={isMounted ? "71.8 75.4" : "0 75.4"}
                          style={{
                            transition: "stroke-dasharray 1.6s cubic-bezier(0.2, 0.8, 0.2, 1) 0.5s",
                          }}
                        />
                      </svg>
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-jakarta mt-0.5">
                      WEIGHTED SCORE
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Sub-Column (md:col-span-5 xl:col-span-4): Circular EFFICIENCY Card */}
            <div id="guide-indiv-efficiency-gauge" className="md:col-span-5 xl:col-span-4 flex flex-col justify-between h-[258px]">
              <div className="rounded-2xl border border-slate-200/90 bg-white p-3 lg:p-3.5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between h-[258px] max-h-[258px] overflow-hidden animate-fade-up" style={{ animationDelay: "300ms" }}>
                {/* Header: EFFICIENCY + AHT label matching Productivity & Consistency */}
                <div className="flex flex-col shrink-0">
                  <h4 className="text-xs font-black tracking-wider text-slate-900 uppercase font-jakarta">
                    EFFICIENCY
                  </h4>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-jakarta mt-0.5">
                    AHT
                  </span>
                </div>

                {/* Circular Donut Gauge Area (Enlarged) */}
                <div className="relative w-full flex-1 flex items-center justify-center my-auto min-h-0 py-0.5">
                  <div className="relative w-[215px] h-[152px] sm:w-[225px] sm:h-[156px] flex items-center justify-center">
                    {/* SVG Circular Ring */}
                    <svg viewBox="0 0 200 170" className="w-full h-full overflow-visible">
                      {/* Background Track: Incomplete / Neutral remainder (#94A3B8 with subtle opacity or #e2e8f0 with #94A3B8 stroke) */}
                      <circle
                        cx="100"
                        cy="85"
                        r="65"
                        fill="none"
                        stroke="#e2e8f0"
                        strokeWidth="14"
                      />

                      {/* Foreground Green Donut Arc: Actual / Completed (circumference = 2 * pi * 65 ≈ 408.4) */}
                      <circle
                        cx="100"
                        cy="85"
                        r="65"
                        fill="none"
                        stroke={KPI_COLORS.actual}
                        strokeWidth="14"
                        strokeLinecap="round"
                        strokeDasharray={isMounted ? "313 408.4" : "0 408.4"}
                        transform="rotate(-90 100 85)"
                        style={{
                          transition: "stroke-dasharray 1.6s cubic-bezier(0.2, 0.8, 0.2, 1) 0.3s",
                        }}
                      />

                      {/* Target Marker at 12 o'clock: Red Straight Line with Dot at base (Warning / Threshold #DC2626) */}
                      <g className="transition-opacity duration-500" style={{ opacity: isMounted ? 1 : 0 }}>
                        <line
                          x1="100"
                          y1="6"
                          x2="100"
                          y2="20"
                          stroke={KPI_COLORS.warning}
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                        <circle
                          cx="100"
                          cy="20"
                          r="3"
                          fill={KPI_COLORS.warning}
                          stroke="#ffffff"
                          strokeWidth="1.5"
                        />
                      </g>

                      {/* Green Endpoint Marker at ~138°: Matching Straight Radial Line & Center Dot */}
                      <g className="transition-opacity duration-500" style={{ opacity: isMounted ? 1 : 0 }}>
                        <line
                          x1="148"
                          y1="128"
                          x2="162"
                          y2="141"
                          stroke={KPI_COLORS.actual}
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <circle
                          cx="148"
                          cy="128"
                          r="3"
                          fill={KPI_COLORS.actual}
                          stroke="#ffffff"
                          strokeWidth="1.5"
                        />
                      </g>
                    </svg>

                    {/* Red Badge at Top: "Below 900s Target" with red pointer line and dot */}
                    <div
                      className="absolute -top-3 left-1/2 -translate-x-1/2 pointer-events-none z-20 flex flex-col items-center"
                      style={{
                        opacity: isMounted ? 1 : 0,
                        transition: "opacity 0.4s ease 0.3s",
                      }}
                    >
                      <div
                        className="relative text-white text-[9px] font-black px-2 py-0.5 rounded shadow-xs whitespace-nowrap font-jakarta tracking-tight flex items-center gap-1"
                        style={{ backgroundColor: KPI_COLORS.warning }}
                      >
                        <span>Below 900s Target</span>
                      </div>
                    </div>

                    {/* Center Text: "874s" and "AHT" */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1">
                      <span className="text-[26px] font-black text-slate-950 font-jakarta leading-none tracking-tight">
                        <AnimatedNumber value="874" duration={1600} delay={250} />s
                      </span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-jakarta mt-1">
                        AHT
                      </span>
                    </div>

                    {/* Green Callout Badge at Endpoint (~138°): "874s AHT" with Left-Pointing Tail */}
                    <div
                      className="absolute bottom-4 -right-1 sm:-right-2 pointer-events-none z-20 flex items-center"
                      style={{
                        opacity: isMounted ? 1 : 0,
                        transition: "opacity 0.4s ease 0.4s",
                      }}
                    >
                      <div
                        className="relative text-white text-[9px] font-black px-2 py-0.5 rounded shadow-xs whitespace-nowrap font-jakarta tracking-tight flex items-center gap-1"
                        style={{ backgroundColor: KPI_COLORS.actual }}
                      >
                        {/* Triangle pointer pointing left toward the tick line */}
                        <div
                          className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-y-[3.5px] border-y-transparent border-r-[4.5px]"
                          style={{ borderRightColor: KPI_COLORS.actual }}
                        />
                        <span>874s AHT</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom 2-Column Metrics */}
                <div className="grid grid-cols-2 items-center pt-2 border-t border-slate-100 divide-x divide-slate-200/80 shrink-0">
                  {/* Left Metric: AHT Compliance % */}
                  <div className="flex flex-col pr-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="text-[17px] lg:text-[19px] font-black font-jakarta leading-none tracking-tight"
                        style={{ color: KPI_COLORS.compliance }}
                      >
                        <AnimatedNumber value="98.0%" duration={1600} delay={300} />
                      </span>
                      <span
                        className="inline-flex items-center justify-center h-4.5 w-4.5 rounded-full shrink-0 shadow-2xs"
                        style={{ backgroundColor: KPI_COLORS.complianceBg, color: KPI_COLORS.compliance }}
                      >
                        <ArrowUp className="h-2.5 w-2.5 stroke-[2.5]" />
                      </span>
                    </div>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider font-jakarta mt-0.5">
                      AHT COMPLIANCE %
                    </span>
                  </div>

                  {/* Right Metric: Weighted Score */}
                  <div className="flex flex-col pl-3">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="text-[17px] lg:text-[19px] font-black font-jakarta leading-none tracking-tight"
                        style={{ color: KPI_COLORS.weightedScore }}
                      >
                        <AnimatedNumber value="9.80" duration={1600} delay={400} />
                      </span>
                      <svg className="w-4.5 h-4.5 -rotate-90 shrink-0" viewBox="0 0 32 32">
                        <circle
                          cx="16"
                          cy="16"
                          r="12"
                          fill="none"
                          stroke="#dde5ee"
                          strokeWidth="3.6"
                        />
                        <circle
                          cx="16"
                          cy="16"
                          r="12"
                          fill="none"
                          stroke={KPI_COLORS.weightedScore}
                          strokeWidth="3.6"
                          strokeLinecap="round"
                          strokeDasharray={isMounted ? "73.9 75.4" : "0 75.4"}
                          style={{
                            transition: "stroke-dasharray 1.6s cubic-bezier(0.2, 0.8, 0.2, 1) 0.4s",
                          }}
                        />
                      </svg>
                    </div>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider font-jakarta mt-0.5">
                      WEIGHTED SCORE
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: CRM Documentation (3 Cards matching new design with numbered badges, completion/score box, dual bars, and audit footer) */}
          <div id="guide-indiv-crm-docs" className="rounded-2xl border border-slate-200/90 bg-white p-3.5 lg:p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col flex-1 min-h-[380px] lg:min-h-0 animate-fade-up" style={{ animationDelay: "400ms" }}>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100 shrink-0">
              <h4 className="text-xs font-black tracking-wider text-slate-900 uppercase font-jakarta">
                CRM DOCUMENTATION
              </h4>
            </div>

            {/* 3 Equal Cards side-by-side filling height */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1 min-h-0 items-stretch">
              {/* ======================================================== */}
              {/* Card 1: RESOLUTION */}
              {/* ======================================================== */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 lg:p-4 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all h-full min-h-[340px] md:min-h-0">
                {/* Top Section: Header & Metric Display Box */}
                <div className="flex flex-col shrink-0">
                  {/* Header: Number Badge + Title */}
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-[#0066ff] text-white text-[11px] font-black shrink-0 shadow-2xs">
                      1
                    </span>
                    <h5 className="text-[12.5px] font-black tracking-wider text-slate-900 uppercase font-jakarta truncate">
                      RESOLUTION
                    </h5>
                  </div>

                  {/* Metric Display Box: COMPLETION & SCORE Side-by-Side */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 lg:p-3 grid grid-cols-2 divide-x divide-slate-200/70 mt-2.5">
                    {/* Left: Completion % (Centered) */}
                    <div className="flex flex-col items-center justify-center pr-2.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-jakarta text-center">
                        COMPLETION
                      </span>
                      <div className="flex items-center justify-center gap-1.5 mt-0.5">
                        <span
                          className="text-2xl font-black font-jakarta leading-none tracking-tight text-center"
                          style={{ color: KPI_COLORS.compliance }}
                        >
                          <AnimatedNumber value="99.3%" duration={1600} delay={300} />
                        </span>
                        <ArrowUpRight className="w-4 h-4 stroke-[2.5] shrink-0" style={{ color: KPI_COLORS.compliance }} />
                      </div>
                    </div>

                    {/* Right: Score (Centered) */}
                    <div className="flex flex-col items-center justify-center pl-2.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-jakarta text-center">
                        SCORE
                      </span>
                      <div className="flex items-center justify-center mt-0.5">
                        <span
                          className="text-2xl font-black font-jakarta leading-none tracking-tight text-center"
                          style={{ color: KPI_COLORS.weightedScore }}
                        >
                          <AnimatedNumber value="9.90" duration={1600} delay={350} />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vertical Graph Section: Target Baseline vs Populated Resolution (Tall touching twin bars) */}
                <div className="flex flex-col flex-1 min-h-[195px] my-2 bg-slate-50/60 rounded-xl p-3 border border-slate-100 justify-between">
                  {/* Vertical Bars Chart Area: Tall flush twin bars */}
                  <div className="flex-1 w-full min-h-[150px] flex items-end justify-center pt-2 pb-0 relative">
                    {/* Background Grid Guide Lines */}
                    <div className="absolute inset-x-2 top-2 border-b border-dashed border-slate-200/70 pointer-events-none" />
                    <div className="absolute inset-x-2 top-1/2 border-b border-dashed border-slate-200/50 pointer-events-none" />
                    <div className="absolute inset-x-2 bottom-0 border-b border-slate-300 pointer-events-none" />

                    {/* Joined Twin Bars Container (Touching with 0 gap) */}
                    <div className="flex items-end z-10">
                      {/* Left Bar: Target Baseline (146 Cases) */}
                      <div className="flex flex-col items-center">
                        <span
                          className="text-[12px] font-black font-jakarta mb-1.5 leading-none"
                          style={{ color: KPI_COLORS.target }}
                        >
                          146
                        </span>
                        <div
                          className="w-14 border border-slate-700/60 border-r-0 rounded-tl-sm shadow-xs transition-all duration-300"
                          style={{
                            backgroundColor: KPI_COLORS.target,
                            height: isMounted ? "145px" : "0px",
                            transition: "height 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) 0.2s",
                          }}
                        />
                      </div>

                      {/* Right Bar: Populated Resolution (145 Cases) */}
                      <div className="flex flex-col items-center">
                        <span
                          className="text-[12px] font-black font-jakarta mb-1.5 leading-none"
                          style={{ color: KPI_COLORS.actual }}
                        >
                          145
                        </span>
                        <div
                          className="w-14 border border-slate-700/60 rounded-tr-sm shadow-xs transition-all duration-300"
                          style={{
                            backgroundColor: KPI_COLORS.actual,
                            height: isMounted ? "142px" : "0px",
                            transition: "height 1.4s cubic-bezier(0.2, 0.8, 0.2, 1) 0.3s",
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Legend Below the Graph */}
                  <div className="flex items-center justify-center gap-5 pt-2.5 shrink-0">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 font-jakarta">
                      <span className="w-2.5 h-2.5 rounded-xs border border-slate-700/50" style={{ backgroundColor: KPI_COLORS.target }} />
                      Target: 146
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 font-jakarta">
                      <span className="w-2.5 h-2.5 rounded-xs border border-slate-700/50" style={{ backgroundColor: KPI_COLORS.actual }} />
                      Populated: 145
                    </span>
                  </div>
                </div>
              </div>

              {/* ======================================================== */}
              {/* Card 2: RESOLUTION SUB CODE */}
              {/* ======================================================== */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 lg:p-4 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all h-full min-h-[340px] md:min-h-0">
                {/* Top Section: Header & Metric Display Box */}
                <div className="flex flex-col shrink-0">
                  {/* Header: Number Badge + Title */}
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-[#0066ff] text-white text-[11px] font-black shrink-0 shadow-2xs">
                      2
                    </span>
                    <h5 className="text-[12.5px] font-black tracking-wider text-slate-900 uppercase font-jakarta truncate">
                      RESOLUTION SUB CODE
                    </h5>
                  </div>

                  {/* Metric Display Box: COMPLETION & SCORE Side-by-Side */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 lg:p-3 grid grid-cols-2 divide-x divide-slate-200/70 mt-2.5">
                    {/* Left: Completion % (Centered) */}
                    <div className="flex flex-col items-center justify-center pr-2.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-jakarta text-center">
                        COMPLETION
                      </span>
                      <div className="flex items-center justify-center gap-1.5 mt-0.5">
                        <span
                          className="text-2xl font-black font-jakarta leading-none tracking-tight text-center"
                          style={{ color: KPI_COLORS.compliance }}
                        >
                          <AnimatedNumber value="96.6%" duration={1600} delay={350} />
                        </span>
                        <ArrowUpRight className="w-4 h-4 stroke-[2.5] shrink-0" style={{ color: KPI_COLORS.compliance }} />
                      </div>
                    </div>

                    {/* Right: Score (Centered) */}
                    <div className="flex flex-col items-center justify-center pl-2.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-jakarta text-center">
                        SCORE
                      </span>
                      <div className="flex items-center justify-center mt-0.5">
                        <span
                          className="text-2xl font-black font-jakarta leading-none tracking-tight text-center"
                          style={{ color: KPI_COLORS.weightedScore }}
                        >
                          <AnimatedNumber value="9.70" duration={1600} delay={400} />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vertical Graph Section: Target Baseline vs Populated Sub Codes (Tall touching twin bars) */}
                <div className="flex flex-col flex-1 min-h-[195px] my-2 bg-slate-50/60 rounded-xl p-3 border border-slate-100 justify-between">
                  {/* Vertical Bars Chart Area: Tall flush twin bars */}
                  <div className="flex-1 w-full min-h-[150px] flex items-end justify-center pt-2 pb-0 relative">
                    {/* Background Grid Guide Lines */}
                    <div className="absolute inset-x-2 top-2 border-b border-dashed border-slate-200/70 pointer-events-none" />
                    <div className="absolute inset-x-2 top-1/2 border-b border-dashed border-slate-200/50 pointer-events-none" />
                    <div className="absolute inset-x-2 bottom-0 border-b border-slate-300 pointer-events-none" />

                    {/* Joined Twin Bars Container (Touching with 0 gap) */}
                    <div className="flex items-end z-10">
                      {/* Left Bar: Target Baseline (146 Cases) */}
                      <div className="flex flex-col items-center">
                        <span
                          className="text-[12px] font-black font-jakarta mb-1.5 leading-none"
                          style={{ color: KPI_COLORS.target }}
                        >
                          146
                        </span>
                        <div
                          className="w-14 border border-slate-700/60 border-r-0 rounded-tl-sm shadow-xs transition-all duration-300"
                          style={{
                            backgroundColor: KPI_COLORS.target,
                            height: isMounted ? "145px" : "0px",
                            transition: "height 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) 0.25s",
                          }}
                        />
                      </div>

                      {/* Right Bar: Populated Sub Codes (141 Cases) */}
                      <div className="flex flex-col items-center">
                        <span
                          className="text-[12px] font-black font-jakarta mb-1.5 leading-none"
                          style={{ color: KPI_COLORS.actual }}
                        >
                          141
                        </span>
                        <div
                          className="w-14 border border-slate-700/60 rounded-tr-sm shadow-xs transition-all duration-300"
                          style={{
                            backgroundColor: KPI_COLORS.actual,
                            height: isMounted ? "137px" : "0px",
                            transition: "height 1.4s cubic-bezier(0.2, 0.8, 0.2, 1) 0.35s",
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Legend Below the Graph */}
                  <div className="flex items-center justify-center gap-5 pt-2.5 shrink-0">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 font-jakarta">
                      <span className="w-2.5 h-2.5 rounded-xs border border-slate-700/50" style={{ backgroundColor: KPI_COLORS.target }} />
                      Target: 146
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 font-jakarta">
                      <span className="w-2.5 h-2.5 rounded-xs border border-slate-700/50" style={{ backgroundColor: KPI_COLORS.actual }} />
                      Populated: 141
                    </span>
                  </div>
                </div>
              </div>

              {/* ======================================================== */}
              {/* Card 3: CASE SUMMARY */}
              {/* ======================================================== */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 lg:p-4 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all h-full min-h-[340px] md:min-h-0">
                {/* Top Section: Header & Metric Display Box */}
                <div className="flex flex-col shrink-0">
                  {/* Header: Number Badge + Title */}
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-[#0066ff] text-white text-[11px] font-black shrink-0 shadow-2xs">
                      3
                    </span>
                    <h5 className="text-[12.5px] font-black tracking-wider text-slate-900 uppercase font-jakarta truncate">
                      CASE SUMMARY
                    </h5>
                  </div>

                  {/* Metric Display Box: COMPLETION & SCORE Side-by-Side */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 lg:p-3 grid grid-cols-2 divide-x divide-slate-200/70 mt-2.5">
                    {/* Left: Completion % (Centered) */}
                    <div className="flex flex-col items-center justify-center pr-2.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-jakarta text-center">
                        COMPLETION
                      </span>
                      <div className="flex items-center justify-center gap-1.5 mt-0.5">
                        <span
                          className="text-2xl font-black font-jakarta leading-none tracking-tight text-center"
                          style={{ color: KPI_COLORS.compliance }}
                        >
                          <AnimatedNumber value="97.9%" duration={1600} delay={400} />
                        </span>
                        <ArrowUpRight className="w-4 h-4 stroke-[2.5] shrink-0" style={{ color: KPI_COLORS.compliance }} />
                      </div>
                    </div>

                    {/* Right: Score (Centered) */}
                    <div className="flex flex-col items-center justify-center pl-2.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-jakarta text-center">
                        SCORE
                      </span>
                      <div className="flex items-center justify-center mt-0.5">
                        <span
                          className="text-2xl font-black font-jakarta leading-none tracking-tight text-center"
                          style={{ color: KPI_COLORS.weightedScore }}
                        >
                          <AnimatedNumber value="9.50" duration={1600} delay={450} />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vertical Graph Section: Target Baseline vs Populated Summary (Tall touching twin bars) */}
                <div className="flex flex-col flex-1 min-h-[195px] my-2 bg-slate-50/60 rounded-xl p-3 border border-slate-100 justify-between">
                  {/* Vertical Bars Chart Area: Tall flush twin bars */}
                  <div className="flex-1 w-full min-h-[150px] flex items-end justify-center pt-2 pb-0 relative">
                    {/* Background Grid Guide Lines */}
                    <div className="absolute inset-x-2 top-2 border-b border-dashed border-slate-200/70 pointer-events-none" />
                    <div className="absolute inset-x-2 top-1/2 border-b border-dashed border-slate-200/50 pointer-events-none" />
                    <div className="absolute inset-x-2 bottom-0 border-b border-slate-300 pointer-events-none" />

                    {/* Joined Twin Bars Container (Touching with 0 gap) */}
                    <div className="flex items-end z-10">
                      {/* Left Bar: Target Baseline (146 Cases) */}
                      <div className="flex flex-col items-center">
                        <span
                          className="text-[12px] font-black font-jakarta mb-1.5 leading-none"
                          style={{ color: KPI_COLORS.target }}
                        >
                          146
                        </span>
                        <div
                          className="w-14 border border-slate-700/60 border-r-0 rounded-tl-sm shadow-xs transition-all duration-300"
                          style={{
                            backgroundColor: KPI_COLORS.target,
                            height: isMounted ? "145px" : "0px",
                            transition: "height 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) 0.3s",
                          }}
                        />
                      </div>

                      {/* Right Bar: Populated Summary (143 Cases) */}
                      <div className="flex flex-col items-center">
                        <span
                          className="text-[12px] font-black font-jakarta mb-1.5 leading-none"
                          style={{ color: KPI_COLORS.actual }}
                        >
                          143
                        </span>
                        <div
                          className="w-14 border border-slate-700/60 rounded-tr-sm shadow-xs transition-all duration-300"
                          style={{
                            backgroundColor: KPI_COLORS.actual,
                            height: isMounted ? "140px" : "0px",
                            transition: "height 1.4s cubic-bezier(0.2, 0.8, 0.2, 1) 0.4s",
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Legend Below the Graph */}
                  <div className="flex items-center justify-center gap-5 pt-2.5 shrink-0">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 font-jakarta">
                      <span className="w-2.5 h-2.5 rounded-xs border border-slate-700/50" style={{ backgroundColor: KPI_COLORS.target }} />
                      Target: 146
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 font-jakarta">
                      <span className="w-2.5 h-2.5 rounded-xs border border-slate-700/50" style={{ backgroundColor: KPI_COLORS.actual }} />
                      Populated: 143
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Step-by-Step Dashboard Guide Modal */}
      <FrontStepsDashboardGuide
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        steps={KPI_INDIV_GUIDE_STEPS}
      />
    </div>
  );
}
