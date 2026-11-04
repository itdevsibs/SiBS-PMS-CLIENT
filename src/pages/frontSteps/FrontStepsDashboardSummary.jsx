import React, { useState, useEffect, useRef } from "react";
import {
  Menu,
  RotateCw,
  Compass,
  Download,
  Loader2,
} from "lucide-react";
import SingleSelectDropdown from "../../components/common/filters/SingleSelectDropdown";
import AnimatedNumber from "../../components/modules/frontsteps/AnimatedNumber";
import FrontStepsDashboardGuide from "../../components/modules/frontsteps/FrontStepsDashboardGuide";

const REPORT_TYPE_OPTIONS = [
  "Bi-Hourly",
  "Weekly",
  "Monthly",
  "MTD",
  "Milestone",
];

// Interval performance details dataset from user reference image (16 intervals with EST & MT)
const INTERVAL_PERFORMANCE_DATA = [
  { timeEst: "10:00", timeMt: "8:00", offered: 19, handled: 19, abandoned: 0, closed: 0, asa: "0:04:10", aht: "0:09:01", answerRate: "100.00%", abandonRate: "0.00%" },
  { timeEst: "10:30", timeMt: "8:30", offered: 26, handled: 26, abandoned: 0, closed: 0, asa: "0:25:48", aht: "0:11:11", answerRate: "100.00%", abandonRate: "0.00%" },
  { timeEst: "11:00", timeMt: "9:00", offered: 21, handled: 19, abandoned: 2, closed: 0, asa: "0:11:48", aht: "0:11:23", answerRate: "90.48%", abandonRate: "9.52%" },
  { timeEst: "11:30", timeMt: "9:30", offered: 21, handled: 19, abandoned: 2, closed: 0, asa: "0:15:01", aht: "0:08:54", answerRate: "90.48%", abandonRate: "9.52%" },
  { timeEst: "12:00", timeMt: "10:00", offered: 21, handled: 5, abandoned: 16, closed: 0, asa: "0:10:57", aht: "0:11:53", answerRate: "23.81%", abandonRate: "76.19%" },
  { timeEst: "12:30", timeMt: "10:30", offered: 18, handled: 13, abandoned: 5, closed: 0, asa: "0:29:55", aht: "0:09:47", answerRate: "72.22%", abandonRate: "27.78%" },
  { timeEst: "13:00", timeMt: "11:00", offered: 23, handled: 21, abandoned: 2, closed: 0, asa: "0:09:27", aht: "0:09:04", answerRate: "91.30%", abandonRate: "8.70%" },
  { timeEst: "13:30", timeMt: "11:30", offered: 21, handled: 19, abandoned: 2, closed: 0, asa: "0:03:41", aht: "0:15:46", answerRate: "90.48%", abandonRate: "9.52%" },
  { timeEst: "14:00", timeMt: "12:00", offered: 27, handled: 24, abandoned: 3, closed: 0, asa: "1:00:56", aht: "0:13:49", answerRate: "88.89%", abandonRate: "11.11%" },
  { timeEst: "14:30", timeMt: "12:30", offered: 13, handled: 10, abandoned: 3, closed: 0, asa: "0:10:17", aht: "0:14:39", answerRate: "76.92%", abandonRate: "23.08%" },
  { timeEst: "15:00", timeMt: "13:00", offered: 21, handled: 21, abandoned: 0, closed: 0, asa: "0:04:59", aht: "0:08:30", answerRate: "100.00%", abandonRate: "0.00%" },
  { timeEst: "15:30", timeMt: "13:30", offered: 18, handled: 18, abandoned: 0, closed: 0, asa: "0:04:49", aht: "0:08:50", answerRate: "100.00%", abandonRate: "0.00%" },
  { timeEst: "16:00", timeMt: "14:00", offered: 19, handled: 17, abandoned: 2, closed: 1, asa: "0:30:55", aht: "0:09:05", answerRate: "89.47%", abandonRate: "10.53%" },
  { timeEst: "16:30", timeMt: "14:30", offered: 19, handled: 17, abandoned: 2, closed: 0, asa: "0:08:21", aht: "0:10:30", answerRate: "89.47%", abandonRate: "10.53%" },
  { timeEst: "17:00", timeMt: "15:00", offered: 9, handled: 8, abandoned: 1, closed: 0, asa: "0:45:58", aht: "0:11:04", answerRate: "88.89%", abandonRate: "11.11%" },
  { timeEst: "17:30", timeMt: "15:30", offered: 10, handled: 10, abandoned: 0, closed: 0, asa: "0:02:34", aht: "0:10:53", answerRate: "100.00%", abandonRate: "0.00%" },
  { timeEst: "18:00", timeMt: "16:00", offered: 5, handled: 5, abandoned: 0, closed: 0, asa: "0:01:04", aht: "0:06:53", answerRate: "100.00%", abandonRate: "0.00%" },
  { timeEst: "18:30", timeMt: "16:30", offered: 9, handled: 8, abandoned: 1, closed: 0, asa: "0:02:23", aht: "0:10:49", answerRate: "88.89%", abandonRate: "11.11%" },
];


// Top Case Drivers
const TOP_CASE_DRIVERS = [
  { label: "Non-billable / General Inquiry", count: 686, pct: "92.9%", color: "#2563eb" },
  { label: "Uncategorized", count: 52, pct: "7.0%", color: "#ef4444" },
  { label: "Supervisor / Urgent", count: 0, pct: "0.0%", color: "#f97316" },
  { label: "Billing Inquiry", count: 0, pct: "0.0%", color: "#10b981" },
  { label: "Chargeable Task", count: 0, pct: "0.0%", color: "#06b6d4" },
];

// 18 Standard Intervals exactly matching the user's Google Sheets screenshot
const CHART_POINTS = [
  { time: "8:00", valO: 19, valH: 19 },
  { time: "8:30", valO: 26, valH: 26 },
  { time: "9:00", valO: 21, valH: 19 },
  { time: "9:30", valO: 21, valH: 19 },
  { time: "10:00", valO: 21, valH: 5 },
  { time: "10:30", valO: 18, valH: 13 },
  { time: "11:00", valO: 23, valH: 21 },
  { time: "11:30", valO: 21, valH: 19 },
  { time: "12:00", valO: 27, valH: 24 },
  { time: "12:30", valO: 13, valH: 10 },
  { time: "13:00", valO: 21, valH: 21 },
  { time: "13:30", valO: 18, valH: 18 },
  { time: "14:00", valO: 19, valH: 17 },
  { time: "14:30", valO: 19, valH: 17 },
  { time: "15:00", valO: 9, valH: 8 },
  { time: "15:30", valO: 10, valH: 10 },
  { time: "16:00", valO: 5, valH: 5 },
  { time: "16:30", valO: 9, valH: 8 },
];

// Helper to compute a smooth monotonic-like cubic spline SVG path through coordinates
function getSmoothSplinePath(points) {
  if (!points || points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x},${points[0].y}`;
  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d;
}

export default function FrontStepsDashboardSummary({
  onNavigate,
  isSidebarHidden,
  onToggleSidebar,
}) {
  const [selectedView, setSelectedView] = useState("dashboard-summary");
  const [reportType, setReportType] = useState("Bi-Hourly");
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const dashboardRef = useRef(null);

  useEffect(() => {
    setIsMounted(false);
    const timer = setTimeout(() => setIsMounted(true), 60);
    return () => clearTimeout(timer);
  }, [reportType]);

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

      // Tiny delay for layout to stabilize
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

      // Report Header Banner
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.setTextColor(4, 44, 81);
      pdf.text("SUMMARY DASHBOARD REPORT - FRONTSTEPS", 10, 10);

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
        `Report Type: ${reportType.toUpperCase()}  |  Generated: ${timestamp}`,
        10,
        15
      );

      // Fit dashboard across the page width with 6mm margins
      const margin = 6;
      const topOffset = 18;
      const printWidth = pdfWidth - margin * 2;
      const imgProps = pdf.getImageProperties(imgData);
      const imgRatio = imgProps.width / imgProps.height;
      const printHeight = printWidth / imgRatio;

      pdf.addImage(imgData, "PNG", margin, topOffset, printWidth, printHeight);

      const filename = `Summary_Dashboard_Report_${reportType.replace(/\s+/g, "_")}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error("PDF export error:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const getAnswerRateClass = (rate) => {
    const val = parseFloat(rate);
    if (val === 100) return "bg-emerald-100/90 text-emerald-800 font-bold";
    if (val >= 85) return "bg-amber-100/90 text-amber-900 font-bold";
    return "bg-rose-100/90 text-rose-800 font-bold";
  };

  // Chart coordinates mapping (Width: 840, Height: 155)
  // Value 0 => y = 132, Value 30 => y = 18
  const chartW = 840;
  const leftPad = 48;
  const rightPad = 24;
  const usableW = chartW - leftPad - rightPad;
  const stepX = usableW / (CHART_POINTS.length - 1);
  const getY = (val) => 132 - (val / 30) * 114;

  const offeredCoords = CHART_POINTS.map((pt, i) => ({
    x: leftPad + i * stepX,
    y: getY(pt.valO),
    val: pt.valO,
  }));

  const handledCoords = CHART_POINTS.map((pt, i) => ({
    x: leftPad + i * stepX,
    y: getY(pt.valH),
    val: pt.valH,
  }));

  const offeredPath = getSmoothSplinePath(offeredCoords);
  const handledPath = getSmoothSplinePath(handledCoords);

  return (
    <div
      ref={dashboardRef}
      className="flex flex-col font-jakarta text-slate-800 select-none gap-3 w-full lg:h-full lg:min-h-0 lg:flex-1 lg:justify-between lg:overflow-hidden"
    >
      {/* 1. Global Filter Bar: View Mode Switcher, Report Type & Guide Button */}
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
          <div id="guide-view-mode" className="flex items-center gap-2 rounded-lg border border-slate-200/90 bg-slate-50/70 px-2.5 py-1">
            <span className="text-xs font-black uppercase tracking-wider text-[#042c51]">
              View Mode:
            </span>
            <div className="w-[180px]">
              <SingleSelectDropdown
                value={selectedView}
                onChange={(e) => handleViewChange(e.target.value)}
                placeholder="Select View"
                options={[
                  { value: "dashboard-summary", label: "Summary" },
                  { value: "dashboard-account-based", label: "Account-based KPI" },
                  { value: "dashboard-kpi-indiv", label: "KPI (PMP/PIP)" },
                ]}
                buttonClassName="h-8 rounded-lg border-slate-200 bg-white px-3 text-xs font-bold text-[#042c51] hover:border-slate-300 shadow-2xs transition-all"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div id="guide-report-type" className="flex items-center gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Report Type:
            </span>
            <div className="w-[140px]">
              <SingleSelectDropdown
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                options={REPORT_TYPE_OPTIONS.map((opt) => ({ value: opt, label: opt }))}
                buttonClassName="h-8 rounded-lg border-slate-200 bg-slate-50/70 px-3 text-xs font-bold text-slate-800 hover:border-slate-300 hover:bg-white shadow-2xs transition-all"
              />
            </div>
          </div>

          {/* Export PDF Button */}
          <button
            id="guide-summary-export"
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



      {/* 3. Top Metrics Row: Exactly 11 Summary KPI Cards with consistent height, alignment & visible values */}
      <div id="guide-summary-kpis" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11 gap-2 shrink-0">
        {/* Offered */}
        <div id="guide-kpi-offered" className="flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-2xs min-h-[58px]">
          <span className="text-[10.5px] font-bold text-slate-500 leading-tight">Offered</span>
          <span className="text-xl font-black text-[#042c51] tracking-tight mt-0.5">
            <AnimatedNumber value="0" duration={1200} />
          </span>
        </div>

        {/* Open Cases */}
        <div id="guide-kpi-open-cases" className="flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-2xs min-h-[58px]">
          <span className="text-[10.5px] font-bold text-slate-500 leading-tight">Open Cases</span>
          <span className="text-xl font-black text-[#042c51] tracking-tight mt-0.5">
            <AnimatedNumber value="122" duration={1300} />
          </span>
        </div>

        {/* Repeat Open Cases */}
        <div id="guide-kpi-repeat-open" className="flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-2xs min-h-[58px]">
          <span className="text-[10.5px] font-bold text-slate-500 leading-tight">Repeat Open</span>
          <span className="text-xl font-black text-[#042c51] tracking-tight mt-0.5">
            <AnimatedNumber value="0" duration={1200} />
          </span>
        </div>

        {/* < 1 Business Day */}
        <div id="guide-kpi-under-1-day" className="flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-2xs min-h-[58px]">
          <span className="text-[10.5px] font-bold text-slate-500 leading-tight">&lt; 1 Day</span>
          <span className="text-xl font-black text-[#042c51] tracking-tight mt-0.5">
            <AnimatedNumber value="0" duration={1200} />
          </span>
        </div>

        {/* 2 Business Days */}
        <div id="guide-kpi-2-days" className="flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-2xs min-h-[58px]">
          <span className="text-[10.5px] font-bold text-slate-500 leading-tight">2 Days</span>
          <span className="text-xl font-black text-[#042c51] tracking-tight mt-0.5">
            <AnimatedNumber value="0" duration={1200} />
          </span>
        </div>

        {/* > 2 Business Days */}
        <div id="guide-kpi-over-2-days" className="flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-2xs min-h-[58px]">
          <span className="text-[10.5px] font-bold text-slate-500 leading-tight">&gt; 2 Days</span>
          <span className="text-xl font-black text-[#042c51] tracking-tight mt-0.5">
            <AnimatedNumber value="0" duration={1200} />
          </span>
        </div>

        {/* Closed */}
        <div id="guide-kpi-closed" className="flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-2xs min-h-[58px]">
          <span className="text-[10.5px] font-bold text-slate-500 leading-tight">Closed</span>
          <span className="text-xl font-black text-[#042c51] tracking-tight mt-0.5">
            <AnimatedNumber value="2" duration={1200} />
          </span>
        </div>

        {/* Closed < 2 Business Days */}
        <div id="guide-kpi-closed-under-2d" className="flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-2xs min-h-[58px]">
          <span className="text-[10.5px] font-bold text-slate-500 leading-tight">Closed &lt; 2d</span>
          <span className="text-xl font-black text-[#042c51] tracking-tight mt-0.5">
            <AnimatedNumber value="0" duration={1200} />
          </span>
        </div>

        {/* Handled */}
        <div id="guide-kpi-handled" className="flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-2xs min-h-[58px]">
          <span className="text-[10.5px] font-bold text-slate-500 leading-tight">Handled</span>
          <span className="text-xl font-black text-[#042c51] tracking-tight mt-0.5">
            <AnimatedNumber value="3" duration={1200} />
          </span>
        </div>

        {/* Backlog Handling Rate */}
        <div id="guide-kpi-backlog-rate" className="flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-2xs min-h-[58px]">
          <span className="text-[10.5px] font-bold text-slate-500 leading-tight">Backlog Rate</span>
          <span className="text-xl font-black text-[#042c51] tracking-tight mt-0.5">
            <AnimatedNumber value="2.46%" duration={1400} />
          </span>
        </div>

        {/* Closed SLA % */}
        <div id="guide-kpi-closed-sla" className="flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-2xs min-h-[58px]">
          <span className="text-[10.5px] font-bold text-slate-500 leading-tight">Closed SLA</span>
          <span className="text-xl font-black text-[#042c51] tracking-tight mt-0.5">
            <AnimatedNumber value="0.00%" duration={1200} />
          </span>
        </div>
      </div>

      {/* 4. Middle Row: Offered vs Handled Calls (Left 7 cols) & Call Performance Summary (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 flex-1 min-h-[220px] lg:min-h-0">
        {/* Left: Offered vs Handled Calls Chart with Splines & Hover Tooltip */}
        <div id="guide-chart-offered-handled" className="lg:col-span-7 flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-3 shadow-2xs min-h-[210px] lg:min-h-0 relative">
          {/* Header with Title on Left and Centered Legend */}
          <div className="flex items-center justify-between shrink-0 mb-1 px-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#042c51]">
              Offered vs Handled Calls
            </h3>
            <div className="flex items-center gap-5 text-xs font-semibold text-slate-700">
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block w-4 h-[3.5px] bg-[#1d6fa5] rounded-xs" />
                <span>Offered Call</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block w-4 h-[3.5px] bg-[#5cb85c] rounded-xs" />
                <span>Handled Call</span>
              </span>
            </div>
          </div>

          {/* SVG Line Chart: Smooth Bezier Splines with horizontal scroll slider so numbers are never compressed */}
          <div className="w-full flex-1 min-h-[160px] overflow-x-auto overflow-y-hidden table-scrollbar pt-1 pb-1">
            <div className="min-w-[780px] w-full h-full relative flex flex-col justify-end">
              <svg viewBox="0 0 840 152" preserveAspectRatio="none" className="w-full h-full overflow-visible">
              {/* Horizontal Grid lines */}
              <line x1="42" y1="18" x2="825" y2="18" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="42" y1="56" x2="825" y2="56" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="42" y1="94" x2="825" y2="94" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="42" y1="132" x2="825" y2="132" stroke="#9ca3af" strokeWidth="1.2" />

              {/* Y Axis Numeric Labels */}
              <text x="36" y="21" className="text-[11px] fill-slate-700 font-medium" textAnchor="end">30</text>
              <text x="36" y="59" className="text-[11px] fill-slate-700 font-medium" textAnchor="end">20</text>
              <text x="36" y="97" className="text-[11px] fill-slate-700 font-medium" textAnchor="end">10</text>
              <text x="36" y="135" className="text-[11px] fill-slate-700 font-medium" textAnchor="end">0</text>

              {/* Handled Calls Smooth Curve (Green #4cae4c / #16a34a) with slow, gentle stroke draw-in animation */}
              <path
                d={handledPath}
                fill="none"
                stroke="#4cae4c"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="1600"
                strokeDashoffset={isMounted ? 0 : 1600}
                style={{ transition: "stroke-dashoffset 3.2s cubic-bezier(0.16, 1, 0.3, 1) 0.2s" }}
              />

              {/* Offered Calls Smooth Curve (Blue #1d6fa5) with slow, gentle stroke draw-in animation */}
              <path
                d={offeredPath}
                fill="none"
                stroke="#1d6fa5"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="1600"
                strokeDashoffset={isMounted ? 0 : 1600}
                style={{ transition: "stroke-dashoffset 3.2s cubic-bezier(0.16, 1, 0.3, 1) 0.1s" }}
              />

              {/* Data Labels: Exactly as displayed in the Google Sheets reference */}
              {CHART_POINTS.map((pt, idx) => {
                const cx = leftPad + idx * stepX;
                const yO = getY(pt.valO);
                const yH = getY(pt.valH);
                const isEqual = pt.valO === pt.valH;
                const isHovered = hoveredPoint?.idx === idx;

                return (
                  <g
                    key={idx}
                    onMouseEnter={() => setHoveredPoint({ idx, ...pt, cx, yO, yH })}
                    onMouseLeave={() => setHoveredPoint(null)}
                    className="cursor-pointer"
                  >
                    {/* Invisible expanded hit area for effortless hover */}
                    <rect x={cx - 15} y="15" width="30" height="120" fill="transparent" />

                    {/* Subtle vertical indicator bar when hovered */}
                    {isHovered && (
                      <line x1={cx} y1="18" x2={cx} y2="132" stroke="#93c5fd" strokeWidth="1.2" strokeDasharray="3 3" />
                    )}

                    {/* Data dots with slow sequential cascade along the curve */}
                    <circle
                      cx={cx}
                      cy={yO}
                      r={isHovered ? 4 : 2.5}
                      fill="#1d6fa5"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      style={{
                        transform: isMounted ? "scale(1)" : "scale(0)",
                        transformOrigin: `${cx}px ${yO}px`,
                        transition: `transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${0.3 + idx * 0.12}s`,
                      }}
                    />
                    <circle
                      cx={cx}
                      cy={yH}
                      r={isHovered ? 4 : 2.5}
                      fill="#4cae4c"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      style={{
                        transform: isMounted ? "scale(1)" : "scale(0)",
                        transformOrigin: `${cx}px ${yH}px`,
                        transition: `transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${0.35 + idx * 0.12}s`,
                      }}
                    />

                    {/* Data numbers animated smoothly along the curve as it draws */}
                    <g
                      style={{
                        opacity: isMounted ? 1 : 0,
                        transform: isMounted ? "translateY(0)" : "translateY(5px)",
                        transition: `opacity 0.6s ease ${0.4 + idx * 0.12}s, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${0.4 + idx * 0.12}s`,
                      }}
                    >
                      {isEqual ? (
                        /* When values are identical, show single green label directly above point */
                        <text
                          x={cx}
                          y={yH - 7}
                          textAnchor="middle"
                          className="text-[9.5px] font-bold fill-[#4cae4c] pointer-events-none"
                        >
                          {pt.valH}
                        </text>
                      ) : (
                        <>
                          {/* Offered value in blue above */}
                          <text
                            x={cx}
                            y={yO - 7}
                            textAnchor="middle"
                            className="text-[9.5px] font-bold fill-[#1d6fa5] pointer-events-none"
                          >
                            {pt.valO}
                          </text>
                          {/* Handled value in green */}
                          <text
                            x={cx}
                            y={yH < yO ? yH - 7 : yH + 12}
                            textAnchor="middle"
                            className="text-[9.5px] font-bold fill-[#4cae4c] pointer-events-none"
                          >
                            {pt.valH}
                          </text>
                        </>
                      )}
                    </g>
                  </g>
                );
              })}

              {/* X Axis Timestamps directly beneath data points */}
              {CHART_POINTS.map((tick, idx) => (
                <text
                  key={idx}
                  x={leftPad + idx * stepX}
                  y="146"
                  textAnchor="middle"
                  className="text-[9.5px] font-medium fill-slate-700 select-none pointer-events-none"
                >
                  {tick.time}
                </text>
              ))}
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredPoint && (
              <div
                className="absolute z-20 pointer-events-none transform -translate-x-1/2 rounded-lg bg-slate-900/95 px-2.5 py-1.5 text-white shadow-xl backdrop-blur-xs text-[10.5px] border border-slate-700/80"
                style={{
                  left: `${(hoveredPoint.cx / chartW) * 100}%`,
                  top: "10px",
                }}
              >
                <div className="font-bold text-slate-200 border-b border-slate-700 pb-0.5 mb-1 text-center">
                  Time: {hoveredPoint.time}
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[#60a5fa] font-semibold">Offered:</span>
                  <span className="font-mono font-bold">{hoveredPoint.valO}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[#4ade80] font-semibold">Handled:</span>
                  <span className="font-mono font-bold">{hoveredPoint.valH}</span>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>

        {/* Right: Call Performance Summary Grid (5 cols) with Day-to-Date Scope Label */}
        <div id="guide-section-call-performance" className="lg:col-span-5 flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-2xs min-h-0">
          <div className="flex items-center justify-between mb-1.5 shrink-0">
            <h3 className="text-[11px] font-black uppercase tracking-wider text-[#042c51]">
              Call Performance Summary
            </h3>
            <span className="text-[10px] font-semibold text-slate-400">
              (18 Intervals Aggregate)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 flex-1 min-h-0 items-stretch">
            {/* Offered Calls */}
            <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-50/80 border border-slate-100 text-center">
              <span className="text-2xl font-black text-slate-900 leading-none">
                <AnimatedNumber value="320" duration={1300} />
              </span>
              <span className="text-[10px] font-semibold text-slate-500 mt-1">Offered Calls</span>
            </div>
            {/* Handled Calls */}
            <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-50/80 border border-slate-100 text-center">
              <span className="text-2xl font-black text-slate-900 leading-none">
                <AnimatedNumber value="279" duration={1300} />
              </span>
              <span className="text-[10px] font-semibold text-slate-500 mt-1">Handled Calls</span>
            </div>
            {/* Abandoned Calls */}
            <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-50/80 border border-slate-100 text-center">
              <span className="text-2xl font-black text-slate-900 leading-none">
                <AnimatedNumber value="41" duration={1300} />
              </span>
              <span className="text-[10px] font-semibold text-slate-500 mt-1">Abandoned Calls</span>
            </div>
            {/* Answer Rate */}
            <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-50/80 border border-slate-100 text-center">
              <span className="text-2xl font-black text-emerald-600 leading-none">
                <AnimatedNumber value="87.19%" duration={1500} />
              </span>
              <span className="text-[10px] font-semibold text-slate-500 mt-1">Answer Rate</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5 mt-1.5 flex-1 min-h-0 items-stretch">
            {/* Abandon Rate */}
            <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-50/80 border border-slate-100 text-center">
              <span className="text-xl font-black text-slate-900 leading-none">
                <AnimatedNumber value="14.70%" duration={1500} />
              </span>
              <span className="text-[9.5px] font-semibold text-slate-500 mt-1">Abandon Rate</span>
            </div>
            {/* Avg Speed of Answer (ASA) */}
            <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-50/80 border border-slate-100 text-center">
              <span className="text-xl font-black text-slate-900 leading-none font-mono">
                <AnimatedNumber value="0:17:15" duration={1500} />
              </span>
              <span className="text-[9px] font-semibold text-slate-500 mt-1">Avg Speed Answer</span>
            </div>
            {/* Avg Handling Time (AHT) */}
            <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-50/80 border border-slate-100 text-center">
              <span className="text-xl font-black text-slate-900 leading-none font-mono">
                <AnimatedNumber value="0:10:43" duration={1500} />
              </span>
              <span className="text-[9px] font-semibold text-slate-500 mt-1">Avg Handling Time</span>
            </div>
          </div>
        </div>
      </div>

            {/* 5. Bottom Row: 30% Top Case Drivers (Left 3 cols) & 70% Interval Performance Details (Right 7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-2.5 lg:flex-[1.3] min-h-0">
        {/* Left: Top Case Drivers (~30% width: 3 of 10 cols) */}
        <div id="guide-section-case-drivers" className="lg:col-span-3 flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs min-h-[340px] lg:min-h-0">
          {/* Header */}
          <div className="flex items-center justify-between shrink-0 mb-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#042c51]">
              TOP CASE DRIVERS
            </h3>
            <span className="text-[11px] font-bold text-[#2563eb] bg-[#eef4ff] px-2 py-0.5 rounded-md">
              738 Total Cases
            </span>
          </div>

          {/* Centered Donut Chart on Top - Significantly Enlarged with Maximum Readability */}
          <div className="flex flex-col items-center justify-center shrink-0 my-1.5">
            <div className="relative h-[175px] w-[175px] flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 transform">
                {/* Background Track */}
                <circle cx="50" cy="50" r="39" fill="none" stroke="#f1f5f9" strokeWidth="13" />
                {/* Primary Segment (Non-billable: 92.9%) */}
                <circle
                  cx="50"
                  cy="50"
                  r="39"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="13"
                  strokeDasharray={isMounted ? "227.6 245" : "0 245"}
                  strokeDashoffset="0"
                  strokeLinecap="butt"
                  style={{ transition: "stroke-dasharray 1.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s" }}
                />
                {/* Secondary Segment (Uncategorized: 7.0%) */}
                <circle
                  cx="50"
                  cy="50"
                  r="39"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="13"
                  strokeDasharray={isMounted ? "17.1 245" : "0 245"}
                  strokeDashoffset="-227.6"
                  strokeLinecap="butt"
                  style={{ transition: "stroke-dasharray 1.6s cubic-bezier(0.16, 1, 0.3, 1) 0.3s" }}
                />
              </svg>
              {/* Donut Center Text: Maximum Size & Readability */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-4xl font-black text-slate-900 leading-none tracking-tight">
                  <AnimatedNumber value="738" duration={1500} />
                </span>
                <span className="text-sm font-extrabold text-slate-600 mt-1.5">Total Cases</span>
              </div>
            </div>
          </div>

          {/* Drivers List with full-width progress bars underneath, padded to prevent chatbot overlap */}
          <div className="flex flex-col justify-between flex-1 min-h-0 gap-1.5 pt-1 pr-1 pb-1">
            {TOP_CASE_DRIVERS.map((item, idx) => (
              <div key={idx} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[11px] leading-tight">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-slate-800 font-semibold truncate" title={item.label}>
                      {item.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 font-mono">
                    <span className="text-slate-900 font-black text-xs">
                      <AnimatedNumber value={item.count} duration={1300} />
                    </span>
                    <span className="text-slate-500 text-[10.5px] w-9 text-right font-semibold">
                      <AnimatedNumber value={item.pct} duration={1300} />
                    </span>
                  </div>
                </div>

                {/* Full-width Progress Bar */}
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: isMounted ? item.pct : "0%",
                      backgroundColor: item.color,
                      transition: "width 1.4s cubic-bezier(0.16, 1, 0.3, 1) 0.2s",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Interval Performance Details Table (~70% width: 7 of 10 cols) */}
        <div id="guide-section-interval-details" className="lg:col-span-7 flex flex-col rounded-xl border border-slate-200/90 bg-white p-3 shadow-2xs min-h-[300px] lg:min-h-0">
          <div className="flex items-center justify-between mb-2 shrink-0">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#042c51]">
              Interval Performance Details
            </h3>
            <span className="text-[10px] text-slate-400 font-medium lg:hidden">Swipe sideways to view all columns</span>
          </div>

          {/* Table Container with Separate Fixed Header & Scrollable Body */}
          <div className="flex-1 min-h-[260px] lg:min-h-0 flex flex-col border border-slate-200/90 rounded-lg overflow-x-auto lg:overflow-hidden bg-white">
            <div className="min-w-[720px] flex-1 flex flex-col h-full min-h-0">
              {/* Header: Static at the top */}
              <div className="bg-[#042c51] text-white text-[10px] uppercase font-bold tracking-tight shrink-0">
                <table className="w-full text-left border-collapse table-fixed">
                  <thead>
                    <tr>
                      <th className="py-2 px-1 text-center border-r border-blue-900/40 w-[10%]">Interval (EST)</th>
                      <th className="py-2 px-1 text-center border-r border-blue-900/40 bg-[#032240] w-[10%]">Interval (MT)</th>
                      <th className="py-2 px-1 text-center border-r border-blue-900/40 w-[10%]">Offered Call</th>
                      <th className="py-2 px-1 text-center border-r border-blue-900/40 w-[10%]">Handled Call</th>
                      <th className="py-2 px-1 text-center border-r border-blue-900/40 w-[10%]">Abandoned Call</th>
                      <th className="py-2 px-1 text-center border-r border-blue-900/40 w-[9%]">Closed Cases</th>
                      <th className="py-2 px-1 text-center border-r border-blue-900/40 w-[11%]">AVG Speed Answer</th>
                      <th className="py-2 px-1 text-center border-r border-blue-900/40 w-[11%]">AVG Handling Time</th>
                      <th className="py-2 px-1 text-center border-r border-blue-900/40 w-[14%]">Answer Rate</th>
                      <th className="py-2 px-1 text-center w-[15%]">Abandon Rate</th>
                    </tr>
                  </thead>
                </table>
              </div>

              {/* Body: Dedicated vertical scroll slider */}
              <div className="flex-1 min-h-0 max-h-[340px] lg:max-h-none overflow-y-scroll overflow-x-hidden table-scrollbar bg-white">
                <table className="w-full text-left text-xs border-collapse table-fixed">
                  <tbody className="divide-y divide-slate-100 text-[11px] font-medium">
                    {INTERVAL_PERFORMANCE_DATA.map((row, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="py-1.5 px-1 text-center font-mono font-semibold text-slate-700 bg-slate-50/50 border-r border-slate-100 text-xs w-[10%]">{row.timeEst}</td>
                        <td className="py-1.5 px-1 text-center font-mono font-semibold text-slate-500 bg-slate-100/60 border-r border-slate-100 text-xs w-[10%]">{row.timeMt}</td>
                        <td className="py-1.5 px-1 text-center font-semibold text-slate-900 border-r border-slate-100 text-xs w-[10%]">
                          <AnimatedNumber value={row.offered} duration={1300} />
                        </td>
                        <td className="py-1.5 px-1 text-center font-semibold text-slate-900 border-r border-slate-100 text-xs w-[10%]">
                          <AnimatedNumber value={row.handled} duration={1300} />
                        </td>
                        <td className="py-1.5 px-1 text-center font-semibold text-slate-900 border-r border-slate-100 text-xs w-[10%]">
                          <AnimatedNumber value={row.abandoned} duration={1300} />
                        </td>
                        <td className="py-1.5 px-1 text-center font-semibold text-slate-900 border-r border-slate-100 text-xs w-[9%]">
                          <AnimatedNumber value={row.closed} duration={1300} />
                        </td>
                        <td className="py-1.5 px-1 text-center font-mono font-medium text-slate-700 border-r border-slate-100 text-[10.5px] w-[11%]">
                          <AnimatedNumber value={row.asa} duration={1300} />
                        </td>
                        <td className="py-1.5 px-1 text-center font-mono font-medium text-slate-700 border-r border-slate-100 text-[10.5px] w-[11%]">
                          <AnimatedNumber value={row.aht} duration={1300} />
                        </td>
                        <td className={`py-1.5 px-1.5 text-center font-bold border-r border-slate-100 text-[10.5px] w-[14%] ${getAnswerRateClass(row.answerRate)}`}>
                          <AnimatedNumber value={row.answerRate} duration={1500} />
                        </td>
                        <td className="py-1.5 px-1.5 text-center font-medium text-slate-700 text-[10.5px] w-[15%]">
                          <AnimatedNumber value={row.abandonRate} duration={1500} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Step-by-Step Dashboard Guide Modal */}
      <FrontStepsDashboardGuide
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}
