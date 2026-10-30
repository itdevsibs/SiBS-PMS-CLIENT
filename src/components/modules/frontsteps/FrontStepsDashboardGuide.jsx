import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Compass,
} from "lucide-react";

export const SUMMARY_GUIDE_STEPS = [
  {
    targetId: "guide-view-mode",
    title: "View Mode",
    description:
      "Switches between Summary, Account-based KPI, and Individual Employee KPI views.",
  },
  {
    targetId: "guide-report-type",
    title: "Report Type",
    description:
      "Sets report interval: Bi-Hourly, Weekly, Monthly, MTD, or Milestone.",
  },
  {
    targetId: "guide-summary-export",
    title: "Export Dashboard",
    description:
      "Exports the current Summary dashboard view as a high-resolution, print-ready PDF report.",
  },
  {
    targetId: "guide-summary-kpis",
    title: "11 Summary KPI Cards",
    description:
      "Tracks volume & SLAs: Offered, Open Cases, Repeat Open, aging (<1d, 2d, >2d), Closed, Closed <2d, Handled, Backlog Rate, and Closed SLA %.",
  },
  {
    targetId: "guide-chart-offered-handled",
    title: "Offered vs Handled Calls",
    description:
      "Compares incoming offered calls (blue) against answered calls (green) by interval.",
  },
  {
    targetId: "guide-section-call-performance",
    title: "Call Performance Summary",
    description:
      "Aggregates Offered, Handled, Abandoned, Answer %, Abandon %, ASA, and AHT.",
  },
  {
    targetId: "guide-section-interval-details",
    title: "Interval Performance Details",
    description:
      "Bi-hourly auditing table with dual EST/MT timezones and interval metric breakdowns.",
  },
  {
    targetId: "guide-section-case-drivers",
    title: "Top Case Drivers",
    description:
      "Categorizes closed cases into 5 drivers: Non-billable, Uncategorized, Urgent, Billing, and Chargeable.",
  },
];

export const ACCOUNT_BASED_GUIDE_STEPS = [
  {
    targetId: "guide-ab-view-mode",
    title: "View Mode",
    description:
      "Switches between Summary, Account-based KPI, and Individual Employee KPI views.",
  },
  {
    targetId: "guide-ab-filters",
    title: "Employee & Reporting Period",
    description:
      "Filters account performance by team member, timeframe (Daily, Weekly, Monthly, Annually), and Month.",
  },
  {
    targetId: "guide-ab-export",
    title: "Export Dashboard",
    description:
      "Exports the current Account-based KPI dashboard and performance metrics as a landscape PDF report.",
  },
  {
    targetId: "guide-ab-kpi-cards",
    title: "8 Account KPI Stat Cards",
    description:
      "Highlights key account metrics: KPI Score, Cases Closed, Answer Rate, 7-Day Closure, Sub-code Compliance, Unaccepted Calls, Answered Calls, and Pending Reviews.",
  },
  {
    targetId: "guide-ab-weekly-charts",
    title: "Weekly Performance Trends",
    description:
      "Dual trend line charts showing Cases Closed by weekly and Calls Received & Answered against targets.",
  },
  {
    targetId: "guide-ab-incentives",
    title: "Incentives & Validations",
    description:
      "Tracks Monthly Incentive Projection, Milestone Incentive threshold status, and items Pending Validation.",
  },
  {
    targetId: "guide-ab-distribution-donuts",
    title: "Distribution & Mix Charts",
    description:
      "Donut breakdowns for Case Closure Timeliness (within 7 days), Queue / Work Mix (tiers), and Employee Performance Distribution.",
  },
];

export const KPI_INDIV_GUIDE_STEPS = [
  {
    targetId: "guide-indiv-view-mode",
    title: "View Mode",
    description:
      "Switches between Summary, Account-based KPI, and Individual Employee KPI views.",
  },
  {
    targetId: "guide-indiv-filters",
    title: "Employee & Reporting Period",
    description:
      "Filters individual employee scorecards by agent name, period, and reporting month.",
  },
  {
    targetId: "guide-indiv-export",
    title: "Export Dashboard",
    description:
      "Exports the agent's individual scorecard, tier status, and pillar breakdowns as a PDF report.",
  },
  {
    targetId: "guide-indiv-agent-profile",
    title: "Agent Profile Card",
    description:
      "Displays agent photo, Name, Employee ID, Program/Account, and Supervisor with live typing indicators.",
  },
  {
    targetId: "guide-indiv-overall-kpi",
    title: "Overall KPI Score Donut",
    description:
      "Visualizes total weighted performance score and the 4 scorecard pillars: Productivity (45%), CRM Documentation (30%), Consistency (15%), and Efficiency (10%).",
  },
  {
    targetId: "guide-indiv-prod-cons",
    title: "Productivity & Consistency",
    description:
      "Interactive progress bars comparing Cases Closed against Target, and Weekly Case Consistency benchmarks.",
  },
  {
    targetId: "guide-indiv-efficiency-gauge",
    title: "Efficiency Gauge",
    description:
      "Radial gauge scoring Average Handling Time (AHT) against target thresholds with status tiers.",
  },
  {
    targetId: "guide-indiv-crm-docs",
    title: "CRM Documentation Quality",
    description:
      "Evaluates mandatory case sub-coding and call tagging accuracy with sub-code compliance scores.",
  },
];

export default function FrontStepsDashboardGuide({
  isOpen,
  onClose,
  steps = SUMMARY_GUIDE_STEPS,
}) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const modalRef = useRef(null);

  const step = steps[currentStepIndex] || steps[0];
  const totalSteps = steps.length;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;

  // Recalculate target position
  const updateTargetPosition = useCallback(() => {
    if (!isOpen || !step) return;

    const el = document.getElementById(step.targetId);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        bottom: rect.bottom,
        right: rect.right,
      });

      el.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      });
    } else {
      setTargetRect(null);
    }
  }, [isOpen, step]);

  useEffect(() => {
    if (isOpen) {
      updateTargetPosition();
      const timer = setTimeout(updateTargetPosition, 80);
      window.addEventListener("resize", updateTargetPosition);
      window.addEventListener("scroll", updateTargetPosition, true);

      return () => {
        clearTimeout(timer);
        window.removeEventListener("resize", updateTargetPosition);
        window.removeEventListener("scroll", updateTargetPosition, true);
      };
    } else {
      setTargetRect(null);
    }
  }, [isOpen, currentStepIndex, updateTargetPosition]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowRight") {
        if (!isLastStep) setCurrentStepIndex((prev) => prev + 1);
      } else if (e.key === "ArrowLeft") {
        if (!isFirstStep) setCurrentStepIndex((prev) => prev - 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isFirstStep, isLastStep, onClose]);

  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
    }
  }, [isOpen]);

  if (!isOpen || !step) return null;

  const handleNext = () => {
    if (isLastStep) {
      onClose();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  // Modal placement logic
  let modalPlacementStyle = {};
  const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1200;
  const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 800;

  let leftSafetyMargin = 16;
  const sidebarEl = typeof document !== "undefined" ? document.querySelector(".sibs-sidebar") : null;
  if (sidebarEl) {
    const sideRect = sidebarEl.getBoundingClientRect();
    if (sideRect.width > 50) {
      leftSafetyMargin = Math.max(leftSafetyMargin, sideRect.right + 16);
    }
  }

  const modalWidth = Math.min(400, viewportWidth - leftSafetyMargin - 24);

  if (targetRect) {
    const spaceBelow = viewportHeight - targetRect.bottom;
    const spaceAbove = targetRect.top;

    if (spaceBelow >= 200) {
      let idealLeft = targetRect.left + targetRect.width / 2 - modalWidth / 2;
      idealLeft = Math.max(leftSafetyMargin, Math.min(idealLeft, viewportWidth - modalWidth - 16));

      modalPlacementStyle = {
        top: `${targetRect.bottom + 12}px`,
        left: `${idealLeft}px`,
        width: `${modalWidth}px`,
        position: "fixed",
      };
    } else if (spaceAbove >= 200) {
      let idealLeft = targetRect.left + targetRect.width / 2 - modalWidth / 2;
      idealLeft = Math.max(leftSafetyMargin, Math.min(idealLeft, viewportWidth - modalWidth - 16));

      modalPlacementStyle = {
        bottom: `${viewportHeight - targetRect.top + 12}px`,
        left: `${idealLeft}px`,
        width: `${modalWidth}px`,
        position: "fixed",
      };
    } else {
      modalPlacementStyle = {
        bottom: "24px",
        right: "24px",
        width: `${modalWidth}px`,
        position: "fixed",
      };
    }
  } else {
    modalPlacementStyle = {
      top: "50%",
      left: `calc(50% + ${leftSafetyMargin / 2}px)`,
      transform: "translate(-50%, -50%)",
      width: `${modalWidth}px`,
      position: "fixed",
    };
  }

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden font-jakarta pointer-events-auto select-none">
      {/* Dimmed backdrop with spotlight cutout */}
      {targetRect ? (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-auto cursor-pointer"
          onClick={onClose}
        >
          <defs>
            <mask id="guide-spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              <rect
                x={Math.max(0, targetRect.left - 4)}
                y={Math.max(0, targetRect.top - 4)}
                width={targetRect.width + 8}
                height={targetRect.height + 8}
                rx="12"
                fill="black"
              />
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(4, 44, 81, 0.45)"
            mask="url(#guide-spotlight-mask)"
          />
        </svg>
      ) : (
        <div
          className="absolute inset-0 bg-slate-950/45 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Target Glow Outline */}
      {targetRect && (
        <div
          className="fixed pointer-events-none rounded-xl transition-all duration-300 ease-out z-[10000] border-2 border-[#38bdf8] shadow-[0_0_20px_rgba(56,189,248,0.7)]"
          style={{
            top: `${Math.max(0, targetRect.top - 4)}px`,
            left: `${Math.max(0, targetRect.left - 4)}px`,
            width: `${targetRect.width + 8}px`,
            height: `${targetRect.height + 8}px`,
          }}
        >
          <span className="absolute -top-3.5 -left-2 flex h-5.5 w-5.5 items-center justify-center rounded-full bg-[#042c51] border border-white text-[11px] font-black text-white shadow-sm">
            {currentStepIndex + 1}
          </span>
        </div>
      )}

      {/* Simple, Direct & Clean Guide Modal */}
      <div
        ref={modalRef}
        style={modalPlacementStyle}
        className="z-[10001] rounded-2xl border border-slate-200/90 bg-white p-4.5 shadow-2xl text-slate-800 transition-all duration-200 animate-in fade-in zoom-in-95"
      >
        {/* Header: Title and Close button */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="flex h-6.5 w-6.5 items-center justify-center rounded-lg bg-[#042c51] text-sky-300 shadow-2xs">
              <Compass className="h-4 w-4" />
            </span>
            <h3 className="text-[13.5px] font-black text-[#042c51] tracking-wide">
              {step.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Short & Direct Description with Comfortable Readability */}
        <div className="py-2.5 text-[13px] text-slate-650 leading-relaxed font-medium">
          {step.description}
        </div>

        {/* Navigation Footer */}
        <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-400 font-mono">
            {currentStepIndex + 1} / {totalSteps}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1 text-xs font-semibold text-slate-400 hover:text-slate-700 rounded-md transition-colors cursor-pointer"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={handleBack}
              disabled={isFirstStep}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                isFirstStep
                  ? "border-slate-100 text-slate-300 cursor-not-allowed bg-slate-50/50"
                  : "border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95 cursor-pointer"
              }`}
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#042c51] hover:bg-[#084175] active:scale-95 rounded-lg shadow-2xs hover:shadow-xs transition-all cursor-pointer"
            >
              {isLastStep ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
