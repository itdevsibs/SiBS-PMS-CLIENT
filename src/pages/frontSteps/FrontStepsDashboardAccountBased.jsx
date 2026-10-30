import React, { useState, useEffect, useRef } from "react";
import {
  Menu,
  Download,
  Loader2,
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
  Compass,
} from "lucide-react";
import SingleSelectDropdown from "../../components/common/filters/SingleSelectDropdown";
import AnimatedNumber from "../../components/modules/frontsteps/AnimatedNumber";
import FrontStepsDashboardGuide, { ACCOUNT_BASED_GUIDE_STEPS } from "../../components/modules/frontsteps/FrontStepsDashboardGuide";

const VIEW_OPTIONS = [
  { value: "dashboard-summary", label: "Summary" },
  { value: "dashboard-account-based", label: "Account-based KPI" },
  { value: "dashboard-kpi-indiv", label: "KPI (PMP/PIP)" },
];

const EMPLOYEE_OPTIONS = [
  { value: "all", label: "All Employees" },
  { value: "FS-1001", label: "Dwight Anthony Buma-at (FS-1001)" },
  { value: "FS-1002", label: "Janine Marie Dela Cruz (FS-1002)" },
  { value: "FS-1003", label: "Carlos Miguel Mendoza (FS-1003)" },
  { value: "FS-1004", label: "Beatrice Anne Santos (FS-1004)" },
  { value: "FS-1005", label: "Rafael Dominic Castro (FS-1005)" },
  { value: "FS-1006", label: "Patricia Nicole Reyes (FS-1006)" },
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

export default function FrontStepsDashboardAccountBased({
  onNavigate,
  isSidebarHidden,
  onToggleSidebar,
}) {
  const [selectedView, setSelectedView] = useState("dashboard-account-based");
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [selectedPeriod, setSelectedPeriod] = useState("weekly");
  const [selectedMonth, setSelectedMonth] = useState("10");
  const [isExporting, setIsExporting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  useEffect(() => {
    setIsMounted(false);
    const timer = setTimeout(() => setIsMounted(true), 50);
    return () => clearTimeout(timer);
  }, [selectedEmployee, selectedPeriod, selectedMonth]);

  const dashboardRef = useRef(null);

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
      pdf.text(`ACCOUNT-BASED KPI REPORT - FRONTSTEPS`, 10, 10);

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

      const empObj = EMPLOYEE_OPTIONS.find((e) => e.value === selectedEmployee);
      const empLabel = empObj ? empObj.label : "All Employees";
      const monthObj = MONTH_OPTIONS.find((m) => m.value === selectedMonth);
      const monthLabel = monthObj ? monthObj.label : "October";

      pdf.text(
        `Employee: ${empLabel}  |  Period: ${selectedPeriod.toUpperCase()}  |  Month: ${monthLabel}  |  Generated: ${timestamp}`,
        10,
        15
      );

      // Fit dashboard across the full width and fill down with minimal 6mm side margins
      const margin = 6;
      const topOffset = 18;
      const printWidth = pdfWidth - margin * 2;
      const imgProps = pdf.getImageProperties(imgData);
      const imgRatio = imgProps.width / imgProps.height;
      const printHeight = printWidth / imgRatio;

      pdf.addImage(imgData, "PNG", margin, topOffset, printWidth, printHeight);

      const filename = `Account_KPI_Report_${selectedPeriod}_${selectedMonth}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error("PDF export error:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col justify-between font-jakarta text-slate-800 select-none pb-0.5 gap-2.5 overflow-hidden">
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
          <div id="guide-ab-view-mode" className="flex items-center gap-2 rounded-lg border border-slate-200/90 bg-slate-50/70 px-2.5 py-1">
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
          <div id="guide-ab-filters" className="flex flex-wrap items-center gap-2.5">
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
            id="guide-ab-export"
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

      {/* Printable Dashboard Body */}
      <div ref={dashboardRef} className="flex flex-col justify-between flex-1 min-h-0 gap-2.5">
        {/* Row 1: 8 Top Metric Stat Cards (Data/Number prominently highlighted) */}
        <div id="guide-ab-kpi-cards" className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 shrink-0">
        {/* 1. Account KPI Score */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group animate-fade-up" style={{ animationDelay: '80ms' }}>
          <div className="my-auto py-1 text-center">
            <span className="text-3xl lg:text-[35px] font-black tracking-tight text-slate-950 leading-none block font-jakarta">
              <AnimatedNumber value="89.1" duration={1600} delay={80} />
            </span>
          </div>
          <div className="text-center pt-1.5 border-t border-slate-100/80">
            <p className="text-[11px] lg:text-[12px] font-medium text-slate-600 leading-tight truncate font-jakarta">Account KPI Score</p>
          </div>
        </div>

        {/* 2. Cases Closed */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group animate-fade-up" style={{ animationDelay: '140ms' }}>
          <div className="my-auto py-1 text-center">
            <span className="text-3xl lg:text-[35px] font-black tracking-tight text-slate-950 leading-none block font-jakarta">
              <AnimatedNumber value="7,363" duration={1700} delay={140} />
            </span>
          </div>
          <div className="text-center pt-1.5 border-t border-slate-100/80">
            <p className="text-[11px] lg:text-[12px] font-medium text-slate-600 leading-tight truncate font-jakarta">Cases Closed</p>
          </div>
        </div>

        {/* 3. Answer Rate */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group animate-fade-up" style={{ animationDelay: '200ms' }}>
          <div className="my-auto py-1 text-center">
            <span className="text-3xl lg:text-[35px] font-black tracking-tight text-slate-950 leading-none block font-jakarta">
              <AnimatedNumber value="84%" duration={1600} delay={200} />
            </span>
          </div>
          <div className="text-center pt-1.5 border-t border-slate-100/80">
            <p className="text-[11px] lg:text-[12px] font-medium text-slate-600 leading-tight truncate font-jakarta">Answer Rate</p>
          </div>
        </div>

        {/* 4. Seven-day Closure */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group animate-fade-up" style={{ animationDelay: '260ms' }}>
          <div className="my-auto py-1 text-center">
            <span className="text-3xl lg:text-[35px] font-black tracking-tight text-slate-950 leading-none block font-jakarta">
              <AnimatedNumber value="61%" duration={1600} delay={260} />
            </span>
          </div>
          <div className="text-center pt-1.5 border-t border-slate-100/80">
            <p className="text-[11px] lg:text-[12px] font-medium text-slate-600 leading-tight truncate font-jakarta">Seven-day Closure</p>
          </div>
        </div>

        {/* 5. Sub-code Completion */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group animate-fade-up" style={{ animationDelay: '320ms' }}>
          <div className="my-auto py-1 text-center">
            <span className="text-3xl lg:text-[35px] font-black tracking-tight text-slate-950 leading-none block font-jakarta">
              <AnimatedNumber value="82%" duration={1600} delay={320} />
            </span>
          </div>
          <div className="text-center pt-1.5 border-t border-slate-100/80">
            <p className="text-[11px] lg:text-[12px] font-medium text-slate-600 leading-tight truncate font-jakarta">Sub-code Compl.</p>
          </div>
        </div>

        {/* 6. Unaccepted Calls */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group animate-fade-up" style={{ animationDelay: '380ms' }}>
          <div className="my-auto py-1 text-center">
            <span className="text-3xl lg:text-[35px] font-black tracking-tight text-slate-950 leading-none block font-jakarta">
              <AnimatedNumber value="16%" duration={1500} delay={380} />
            </span>
          </div>
          <div className="text-center pt-1.5 border-t border-slate-100/80">
            <p className="text-[11px] lg:text-[12px] font-medium text-slate-600 leading-tight truncate font-jakarta">Unaccepted Calls</p>
          </div>
        </div>

        {/* 7. Answered Calls */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group animate-fade-up" style={{ animationDelay: '440ms' }}>
          <div className="my-auto py-1 text-center">
            <span className="text-3xl lg:text-[35px] font-black tracking-tight text-slate-950 leading-none block font-jakarta">
              <AnimatedNumber value="2,789" duration={1700} delay={440} />
            </span>
          </div>
          <div className="text-center pt-1.5 border-t border-slate-100/80">
            <p className="text-[11px] lg:text-[12px] font-medium text-slate-600 leading-tight truncate font-jakarta">Answered Calls</p>
          </div>
        </div>

        {/* 8. Pending Reviews */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group animate-fade-up" style={{ animationDelay: '500ms' }}>
          <div className="my-auto py-1 text-center">
            <span className="text-3xl lg:text-[35px] font-black tracking-tight text-slate-950 leading-none block font-jakarta">
              <AnimatedNumber value="54" duration={1500} delay={500} />
            </span>
          </div>
          <div className="text-center pt-1.5 border-t border-slate-100/80">
            <p className="text-[11px] lg:text-[12px] font-medium text-slate-600 leading-tight truncate font-jakarta">Pending Reviews</p>
          </div>
        </div>
      </div>

      {/* Row 2: 2 Side-by-Side Charts */}
      <div id="guide-ab-weekly-charts" className="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-[1.1] min-h-0 animate-fade-up" style={{ animationDelay: '200ms' }}>
        {/* Left Chart: Cases Closed by weekly (Smooth Curved Area Line Chart) */}
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
              <div className="flex flex-col justify-between text-right font-jakarta text-[10px] font-bold text-slate-500 shrink-0 pb-1 select-none">
                <span>3,930</span>
                <span>2,947</span>
                <span>1,965</span>
                <span>982</span>
                <span className="text-slate-500 font-extrabold">0</span>
              </div>

              {/* Graphic Canvas */}
              <div className="flex-1 relative flex flex-col justify-end min-h-0">
                <svg viewBox="0 0 450 160" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                  <defs>
                    <filter id="shadowFilter" x="-10%" y="-10%" width="120%" height="120%">
                      <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#0f172a" floodOpacity="0.08" />
                    </filter>
                  </defs>

                  {/* Horizontal Grid lines */}
                  <line x1="0" y1="8" x2="450" y2="8" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="0" y1="44" x2="450" y2="44" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="0" y1="81" x2="450" y2="81" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="0" y1="117" x2="450" y2="117" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                  {/* Baseline 0 */}
                  <line x1="0" y1="154" x2="450" y2="154" stroke="#cbd5e1" strokeWidth="1.5" />

                  {/* Clean Straight Trend Line with Draw-in animation */}
                  <polyline
                    points="75,28 225,40 375,122"
                    fill="none"
                    stroke="#1b6ca8"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="400"
                    strokeDashoffset={isMounted ? 0 : 400}
                    style={{ transition: "stroke-dashoffset 1.8s cubic-bezier(0.2, 0.8, 0.2, 1) 0.15s" }}
                  />

                  {/* Data Point 1: W1 (3,421) */}
                  <g className="group/pt cursor-pointer">
                    <circle cx="75" cy="28" r="16" fill="transparent" />
                    <circle
                      cx="75"
                      cy="28"
                      r="5"
                      fill="#1b6ca8"
                      stroke="#ffffff"
                      strokeWidth="2.5"
                      className="drop-shadow-2xs group-hover/pt:r-6 transition-all"
                      style={{
                        transition: "transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s, opacity 0.45s ease 0.5s",
                        transform: isMounted ? "scale(1)" : "scale(0)",
                        opacity: isMounted ? 1 : 0,
                        transformOrigin: "75px 28px",
                      }}
                    />
                    <text x="75" y="16" textAnchor="middle" className="font-jakarta text-[12px] font-black fill-slate-950 opacity-0 group-hover/pt:opacity-100 transition-opacity pointer-events-none">3,421</text>
                  </g>

                  {/* Data Point 2: W2 (3,110) */}
                  <g className="group/pt cursor-pointer">
                    <circle cx="225" cy="40" r="16" fill="transparent" />
                    <circle
                      cx="225"
                      cy="40"
                      r="5"
                      fill="#1b6ca8"
                      stroke="#ffffff"
                      strokeWidth="2.5"
                      className="drop-shadow-2xs group-hover/pt:r-6 transition-all"
                      style={{
                        transition: "transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) 1.0s, opacity 0.45s ease 1.0s",
                        transform: isMounted ? "scale(1)" : "scale(0)",
                        opacity: isMounted ? 1 : 0,
                        transformOrigin: "225px 40px",
                      }}
                    />
                    <text x="225" y="28" textAnchor="middle" className="font-jakarta text-[12px] font-black fill-slate-950 opacity-0 group-hover/pt:opacity-100 transition-opacity pointer-events-none">3,110</text>
                  </g>

                  {/* Data Point 3: W3 (832) */}
                  <g className="group/pt cursor-pointer">
                    <circle cx="375" cy="122" r="16" fill="transparent" />
                    <circle
                      cx="375"
                      cy="122"
                      r="5"
                      fill="#1b6ca8"
                      stroke="#ffffff"
                      strokeWidth="2.5"
                      className="drop-shadow-2xs group-hover/pt:r-6 transition-all"
                      style={{
                        transition: "transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) 1.5s, opacity 0.45s ease 1.5s",
                        transform: isMounted ? "scale(1)" : "scale(0)",
                        opacity: isMounted ? 1 : 0,
                        transformOrigin: "375px 122px",
                      }}
                    />
                    <text x="375" y="110" textAnchor="middle" className="font-jakarta text-[12px] font-black fill-slate-950 opacity-0 group-hover/pt:opacity-100 transition-opacity pointer-events-none">832</text>
                  </g>
                </svg>
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
              <div className="flex flex-col justify-between text-right font-jakarta text-[10px] font-bold text-slate-500 shrink-0 pb-1 select-none">
                <span>2,179</span>
                <span>1,634</span>
                <span>1,090</span>
                <span>545</span>
                <span className="text-slate-500 font-extrabold">0</span>
              </div>

              {/* Graphic Canvas */}
              <div className="flex-1 relative flex flex-col justify-end min-h-0">
                <svg viewBox="0 0 450 160" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                  {/* Horizontal Grid lines */}
                  <line x1="0" y1="8" x2="450" y2="8" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="0" y1="44" x2="450" y2="44" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="0" y1="81" x2="450" y2="81" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="0" y1="117" x2="450" y2="117" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                  {/* Baseline 0 */}
                  <line x1="0" y1="154" x2="450" y2="154" stroke="#cbd5e1" strokeWidth="1.5" />

                  {/* Target benchmark dashed line with smooth fade */}
                  <line
                    x1="0"
                    y1="52"
                    x2="450"
                    y2="52"
                    stroke="#93c5fd"
                    strokeWidth="1.8"
                    strokeDasharray="4 4"
                    style={{
                      transition: "opacity 1.2s ease 0.3s",
                      opacity: isMounted ? 1 : 0,
                    }}
                  />

                  {/* Trend line with Draw-in animation */}
                  <polyline
                    points="75,44 225,81 375,127"
                    fill="none"
                    stroke="#1b6ca8"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="400"
                    strokeDashoffset={isMounted ? 0 : 400}
                    style={{ transition: "stroke-dashoffset 1.8s cubic-bezier(0.2, 0.8, 0.2, 1) 0.15s" }}
                  />

                  {/* Data Point 1: W1 (1,634) */}
                  <g className="group/pt cursor-pointer">
                    <circle cx="75" cy="44" r="16" fill="transparent" />
                    <circle
                      cx="75"
                      cy="44"
                      r="5"
                      fill="#1b6ca8"
                      stroke="#ffffff"
                      strokeWidth="2.5"
                      className="drop-shadow-2xs group-hover/pt:r-6 transition-all"
                      style={{
                        transition: "transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) 0.55s, opacity 0.45s ease 0.55s",
                        transform: isMounted ? "scale(1)" : "scale(0)",
                        opacity: isMounted ? 1 : 0,
                        transformOrigin: "75px 44px",
                      }}
                    />
                    <text x="75" y="32" textAnchor="middle" className="font-jakarta text-[12px] font-black fill-slate-950 opacity-0 group-hover/pt:opacity-100 transition-opacity pointer-events-none">1,634</text>
                  </g>

                  {/* Data Point 2: W2 (1,090) */}
                  <g className="group/pt cursor-pointer">
                    <circle cx="225" cy="81" r="16" fill="transparent" />
                    <circle
                      cx="225"
                      cy="81"
                      r="5"
                      fill="#1b6ca8"
                      stroke="#ffffff"
                      strokeWidth="2.5"
                      className="drop-shadow-2xs group-hover/pt:r-6 transition-all"
                      style={{
                        transition: "transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) 1.05s, opacity 0.45s ease 1.05s",
                        transform: isMounted ? "scale(1)" : "scale(0)",
                        opacity: isMounted ? 1 : 0,
                        transformOrigin: "225px 81px",
                      }}
                    />
                    <text x="225" y="69" textAnchor="middle" className="font-jakarta text-[12px] font-black fill-slate-950 opacity-0 group-hover/pt:opacity-100 transition-opacity pointer-events-none">1,090</text>
                  </g>

                  {/* Data Point 3: W3 (382) */}
                  <g className="group/pt cursor-pointer">
                    <circle cx="375" cy="127" r="16" fill="transparent" />
                    <circle
                      cx="375"
                      cy="127"
                      r="5"
                      fill="#1b6ca8"
                      stroke="#ffffff"
                      strokeWidth="2.5"
                      className="drop-shadow-2xs group-hover/pt:r-6 transition-all"
                      style={{
                        transition: "transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) 1.55s, opacity 0.45s ease 1.55s",
                        transform: isMounted ? "scale(1)" : "scale(0)",
                        opacity: isMounted ? 1 : 0,
                        transformOrigin: "375px 127px",
                      }}
                    />
                    <text x="375" y="115" textAnchor="middle" className="font-jakarta text-[12px] font-black fill-slate-950 opacity-0 group-hover/pt:opacity-100 transition-opacity pointer-events-none">382</text>
                  </g>
                </svg>
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

      {/* Row 4: 3 Bottom Summary Cards */}
      <div id="guide-ab-incentives" className="grid grid-cols-1 md:grid-cols-3 gap-3 shrink-0 animate-fade-up" style={{ animationDelay: '550ms' }}>
        {/* Monthly Incentive Projection */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
          <div className="pb-2 border-b border-slate-100">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-800">
              Monthly Incentive Projection
            </span>
          </div>
          <div className="flex items-baseline justify-between pt-2">
            <span className="text-3xl lg:text-[36px] xl:text-[40px] font-black text-slate-950 leading-none tracking-tight font-jakarta">
              <AnimatedNumber value="$0" duration={1400} delay={350} />
            </span>
            <span className="text-xs font-bold text-slate-600">
              Unapproved estimate
            </span>
          </div>
        </div>

        {/* Milestone Incentive Status */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
          <div className="pb-2 border-b border-slate-100">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-800">
              Milestone Incentive Status
            </span>
          </div>
          <div className="flex items-baseline justify-between pt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl lg:text-[36px] xl:text-[40px] font-black text-slate-950 leading-none tracking-tight font-jakarta">
                <AnimatedNumber value="0" duration={1400} delay={400} />
              </span>
              <span className="text-base lg:text-lg font-black text-slate-500 font-jakarta">
                / 67
              </span>
            </div>
            <span className="text-xs font-bold text-slate-600 truncate max-w-[55%] text-right" title="Meet score threshold; not approved">
              Threshold met; unapproved
            </span>
          </div>
        </div>

        {/* Pending Validations */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
          <div className="pb-2 border-b border-slate-100">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-800">
              Pending Validations
            </span>
          </div>
          <div className="flex items-baseline justify-between pt-2">
            <span className="text-3xl lg:text-[36px] xl:text-[40px] font-black text-slate-950 leading-none tracking-tight font-jakarta">
              <AnimatedNumber value="54" duration={1500} delay={450} />
            </span>
            <span className="text-xs font-bold text-slate-600">
              Require confirmation
            </span>
          </div>
        </div>
      </div>

      {/* Row 3: 3 Bottom Donut Charts */}
      <div id="guide-ab-distribution-donuts" className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-[1.2] min-h-0 animate-fade-up" style={{ animationDelay: '400ms' }}>
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
                  strokeDasharray={isMounted ? "206.97 339.29" : "0 339.29"}
                  strokeDashoffset="0"
                  style={{ transition: "stroke-dasharray 1.6s cubic-bezier(0.2, 0.8, 0.2, 1) 0.1s" }}
                />
                {/* 20% arc (339.29 * 0.20 = 67.86) */}
                <circle
                  cx="70"
                  cy="70"
                  r="54"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="24"
                  strokeDasharray={isMounted ? "67.86 339.29" : "0 339.29"}
                  strokeDashoffset="-206.97"
                  style={{ transition: "stroke-dasharray 1.6s cubic-bezier(0.2, 0.8, 0.2, 1) 0.3s" }}
                />
                {/* 19% arc (339.29 * 0.19 = 64.46) */}
                <circle
                  cx="70"
                  cy="70"
                  r="54"
                  fill="none"
                  stroke="#93c5fd"
                  strokeWidth="24"
                  strokeDasharray={isMounted ? "64.46 339.29" : "0 339.29"}
                  strokeDashoffset="-274.83"
                  style={{ transition: "stroke-dasharray 1.6s cubic-bezier(0.2, 0.8, 0.2, 1) 0.5s" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-3xl lg:text-4xl font-black text-slate-950 leading-none font-jakarta">
                  <AnimatedNumber value="61%" duration={1600} delay={250} />
                </span>
                <span className="text-[10px] font-black text-slate-600 mt-1 font-jakarta">Closed within 7 days</span>
              </div>
            </div>

            {/* Legend list */}
            <div className="flex flex-col gap-2.5 flex-1 text-[13px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="h-3 w-3 rounded-full bg-[#042c51]" />
                  <span className="text-slate-700 font-bold">Within 1 day</span>
                </div>
                <span className="font-black text-slate-950 text-sm font-jakarta">40%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="h-3 w-3 rounded-full bg-[#1e40af]" />
                  <span className="text-slate-700 font-bold">2–3 days</span>
                </div>
                <span className="font-black text-slate-950 text-sm font-jakarta">6%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="h-3 w-3 rounded-full bg-[#2563eb]" />
                  <span className="text-slate-700 font-bold">4–7 days</span>
                </div>
                <span className="font-black text-slate-950 text-sm font-jakarta">15%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="h-3 w-3 rounded-full bg-[#93c5fd]" />
                  <span className="text-slate-700 font-bold">Over 7 days</span>
                </div>
                <span className="font-black text-slate-950 text-sm font-jakarta">39%</span>
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
                  strokeDasharray={isMounted ? "305.36 339.29" : "0 339.29"}
                  strokeDashoffset="0"
                  style={{ transition: "stroke-dasharray 1.6s cubic-bezier(0.2, 0.8, 0.2, 1) 0.1s" }}
                />
                {/* 7% Tier 2 (339.29 * 0.07 = 23.75) */}
                <circle
                  cx="70"
                  cy="70"
                  r="54"
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="24"
                  strokeDasharray={isMounted ? "23.75 339.29" : "0 339.29"}
                  strokeDashoffset="-305.36"
                  style={{ transition: "stroke-dasharray 1.6s cubic-bezier(0.2, 0.8, 0.2, 1) 0.3s" }}
                />
                {/* 2% Unspecified (339.29 * 0.02 = 6.79) */}
                <circle
                  cx="70"
                  cy="70"
                  r="54"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="24"
                  strokeDasharray={isMounted ? "6.79 339.29" : "0 339.29"}
                  strokeDashoffset="-329.11"
                  style={{ transition: "stroke-dasharray 1.6s cubic-bezier(0.2, 0.8, 0.2, 1) 0.45s" }}
                />
                {/* 1% Other (339.29 * 0.01 = 3.39) */}
                <circle
                  cx="70"
                  cy="70"
                  r="54"
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="24"
                  strokeDasharray={isMounted ? "3.39 339.29" : "0 339.29"}
                  strokeDashoffset="-335.90"
                  style={{ transition: "stroke-dasharray 1.6s cubic-bezier(0.2, 0.8, 0.2, 1) 0.6s" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-3xl lg:text-4xl font-black text-slate-950 leading-none font-jakarta">
                  <AnimatedNumber value="7,363" duration={1700} delay={250} />
                </span>
                <span className="text-[10px] font-black text-slate-600 mt-1 font-jakarta">Total closed cases</span>
              </div>
            </div>

            {/* Legend list */}
            <div className="flex flex-col gap-2.5 flex-1 text-[13px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="h-3 w-3 rounded-full bg-[#042c51]" />
                  <span className="text-slate-700 font-bold">Tier 1</span>
                </div>
                <span className="font-black text-slate-950 text-sm font-jakarta">90%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="h-3 w-3 rounded-full bg-[#0284c7]" />
                  <span className="text-slate-700 font-bold">Tier 2</span>
                </div>
                <span className="font-black text-slate-950 text-sm font-jakarta">7%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="h-3 w-3 rounded-full bg-[#38bdf8]" />
                  <span className="text-slate-700 font-bold">Unspecified</span>
                </div>
                <span className="font-black text-slate-950 text-sm font-jakarta">2%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="h-3 w-3 rounded-full bg-[#94a3b8]" />
                  <span className="text-slate-700 font-bold">Other</span>
                </div>
                <span className="font-black text-slate-950 text-sm font-jakarta">1%</span>
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
                  strokeDasharray={isMounted ? "339.29 339.29" : "0 339.29"}
                  strokeDashoffset="0"
                  style={{ transition: "stroke-dasharray 1.6s cubic-bezier(0.2, 0.8, 0.2, 1) 0.1s" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-3xl lg:text-4xl font-black text-slate-950 leading-none font-jakarta">
                  <AnimatedNumber value="0%" duration={1400} delay={250} />
                </span>
                <span className="text-[10px] font-black text-slate-600 mt-1 font-jakarta">Satisfactory or higher</span>
              </div>
            </div>

            {/* Legend list */}
            <div className="flex flex-col gap-2.5 flex-1 text-[13px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="h-3 w-3 rounded-full bg-[#042c51]" />
                  <span className="text-slate-700 font-bold">Exceptional</span>
                </div>
                <span className="font-black text-slate-950 text-sm font-jakarta">0%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="h-3 w-3 rounded-full bg-[#2563eb]" />
                  <span className="text-slate-700 font-bold">Very Satisfactory</span>
                </div>
                <span className="font-black text-slate-950 text-sm font-jakarta">0%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="h-3 w-3 rounded-full bg-[#60a5fa]" />
                  <span className="text-slate-700 font-bold">Satisfactory</span>
                </div>
                <span className="font-black text-slate-950 text-sm font-jakarta">0%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="h-3 w-3 rounded-full bg-[#94a3b8]" />
                  <span className="text-slate-700 font-bold">Unsatisfactory</span>
                </div>
                <span className="font-black text-slate-950 text-sm font-jakarta">100%</span>
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
        steps={ACCOUNT_BASED_GUIDE_STEPS}
      />
    </div>
  );
}
