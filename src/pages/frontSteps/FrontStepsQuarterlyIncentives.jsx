import React, { useMemo, useState } from "react";
import {
  Users,
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  RotateCcw,
  Eye,
  FileCheck2,
  FileText,
  User,
  ShieldCheck,
  Check,
  XCircle,
  DollarSign,
  AlertTriangle,
  HelpCircle,
  TrendingUp,
  Calendar,
  Bell,
  CheckCircle,
} from "lucide-react";
import SingleSelectDropdown from "../../components/common/filters/SingleSelectDropdown";
import TablePagination from "../../components/common/tables/TablePagination";

// Mock demonstration data representing FrontSteps Quarterly Retention and Consistency Incentive records (FS-MILESTONE-001)
// Q3 2026 Qualifying Period: July 2026, August 2026, September 2026
const INITIAL_INCENTIVE_RECORDS = [
  {
    employeeId: "FS-1001",
    employeeName: "Dwight Anthony Buma-at",
    account: "FrontSteps",
    supervisor: "Mark Ramos",
    period: "Q3 2026 (Jul - Sep)",
    consecutiveMonths: 3,
    avgScore: 95.82,
    eligibilityStatus: "Qualified", // "Qualified", "Pending Validation", "Not Qualified"
    approvalStatus: "Approved", // "Not Submitted", "Pending Review", "Approved", "Declined"
    incentiveAmount: 40,
    monthlyRecords: [
      { month: "July 2026", isFullProduction: true, score: 94.8, rating: "Very Satisfactory", status: "Validated" },
      { month: "August 2026", isFullProduction: true, score: 95.8, rating: "Exceptional", status: "Validated" },
      { month: "September 2026", isFullProduction: true, score: 96.85, rating: "Exceptional", status: "Validated" },
    ],
    otherConditions: [
      { condition: "Zero active formal disciplinary actions during quarter", status: "Met" },
      { condition: "Schedule adherence ≥ 95% maintained across 3 months", status: "Met" },
      { condition: "No unexcused absences or unauthorized downtime", status: "Met" },
      { condition: "Active employment on qualification disbursement date", status: "Met" },
    ],
    validationDetails: {
      isVerified: true,
      validator: "Sarah Gomez (Team Leader)",
      validationDate: "2026-10-05",
      dataQuality: "All 3 production months fully validated with zero discrepancies.",
      remarks: "Consistently exceeded 85 threshold with clean attendance record.",
    },
    approvalDetails: {
      reviewer: "Alexandria Chua (Operations Manager)",
      reviewDate: "2026-10-12",
      decision: "Approved",
      remarks: "Approved for proposed $40 milestone quarterly retention payout.",
    },
  },
  {
    employeeId: "FS-1002",
    employeeName: "Janine Marie Dela Cruz",
    account: "FrontSteps",
    supervisor: "Sarah Gomez",
    period: "Q3 2026 (Jul - Sep)",
    consecutiveMonths: 3,
    avgScore: 91.27,
    eligibilityStatus: "Qualified",
    approvalStatus: "Pending Review",
    incentiveAmount: 40,
    monthlyRecords: [
      { month: "July 2026", isFullProduction: true, score: 89.4, rating: "Satisfactory", status: "Validated" },
      { month: "August 2026", isFullProduction: true, score: 92.0, rating: "Very Satisfactory", status: "Validated" },
      { month: "September 2026", isFullProduction: true, score: 92.4, rating: "Very Satisfactory", status: "Validated" },
    ],
    otherConditions: [
      { condition: "Zero active formal disciplinary actions during quarter", status: "Met" },
      { condition: "Schedule adherence ≥ 95% maintained across 3 months", status: "Met" },
      { condition: "No unexcused absences or unauthorized downtime", status: "Met" },
      { condition: "Active employment on qualification disbursement date", status: "Met" },
    ],
    validationDetails: {
      isVerified: true,
      validator: "Alexandria Chua (Operations Manager)",
      validationDate: "2026-10-08",
      dataQuality: "Complete 3-month dataset verified against telephony and CRM logs.",
      remarks: "Eligible for management consideration. Above 85 average benchmark.",
    },
    approvalDetails: {
      reviewer: "Pending Operations Director Sign-Off",
      reviewDate: "—",
      decision: "Pending",
      remarks: "Submitted for final quarterly batch sign-off.",
    },
  },
  {
    employeeId: "FS-1003",
    employeeName: "Carlos Miguel Mendoza",
    account: "FrontSteps",
    supervisor: "Mark Ramos",
    period: "Q3 2026 (Jul - Sep)",
    consecutiveMonths: 3,
    avgScore: 87.15,
    eligibilityStatus: "Pending Validation",
    approvalStatus: "Not Submitted",
    incentiveAmount: 40,
    monthlyRecords: [
      { month: "July 2026", isFullProduction: true, score: 84.2, rating: "Unsatisfactory", status: "Validated" },
      { month: "August 2026", isFullProduction: true, score: 88.5, rating: "Satisfactory", status: "Validated" },
      { month: "September 2026", isFullProduction: true, score: 88.75, rating: "Satisfactory", status: "Corrected" },
    ],
    otherConditions: [
      { condition: "Zero active formal disciplinary actions during quarter", status: "Met" },
      { condition: "Schedule adherence ≥ 95% maintained across 3 months", status: "Awaiting WFM Audit" },
      { condition: "No unexcused absences or unauthorized downtime", status: "Met" },
      { condition: "Active employment on qualification disbursement date", status: "Met" },
    ],
    validationDetails: {
      isVerified: false,
      validator: "Mark Ramos (Supervisor)",
      validationDate: "—",
      dataQuality: "September 2026 score has pending correction audit; WFM adherence report pending.",
      remarks: "Requires QA reconciliation for September 2026 ticket logs before full verification.",
    },
    approvalDetails: {
      reviewer: "—",
      reviewDate: "—",
      decision: "Not Submitted",
      remarks: "Cannot be submitted for approval until validation is completed.",
    },
  },
  {
    employeeId: "FS-1004",
    employeeName: "Beatrice Anne Santos",
    account: "FrontSteps",
    supervisor: "Sarah Gomez",
    period: "Q3 2026 (Jul - Sep)",
    consecutiveMonths: 3,
    avgScore: 82.47,
    eligibilityStatus: "Not Qualified",
    approvalStatus: "Declined",
    incentiveAmount: 40,
    monthlyRecords: [
      { month: "July 2026", isFullProduction: true, score: 83.5, rating: "Unsatisfactory", status: "Validated" },
      { month: "August 2026", isFullProduction: true, score: 82.3, rating: "Unsatisfactory", status: "Validated" },
      { month: "September 2026", isFullProduction: true, score: 81.6, rating: "Unsatisfactory", status: "Validated" },
    ],
    otherConditions: [
      { condition: "Zero active formal disciplinary actions during quarter", status: "Met" },
      { condition: "Schedule adherence ≥ 95% maintained across 3 months", status: "Met" },
      { condition: "No unexcused absences or unauthorized downtime", status: "Met" },
      { condition: "Active employment on qualification disbursement date", status: "Met" },
    ],
    validationDetails: {
      isVerified: true,
      validator: "Sarah Gomez (Team Leader)",
      validationDate: "2026-10-06",
      dataQuality: "Validated scores complete across all 3 months.",
      remarks: "Average score of 82.47 is below required policy threshold of 85.00.",
    },
    approvalDetails: {
      reviewer: "Alexandria Chua (Operations Manager)",
      reviewDate: "2026-10-10",
      decision: "Declined",
      remarks: "Does not meet the ≥85.00 3-month average KPI threshold.",
    },
  },
  {
    employeeId: "FS-1005",
    employeeName: "Rafael Dominic Castro",
    account: "FrontSteps",
    supervisor: "Mark Ramos",
    period: "Q3 2026 (Jul - Sep)",
    consecutiveMonths: 3,
    avgScore: 92.83,
    eligibilityStatus: "Qualified",
    approvalStatus: "Approved",
    incentiveAmount: 40,
    monthlyRecords: [
      { month: "July 2026", isFullProduction: true, score: 91.1, rating: "Very Satisfactory", status: "Validated" },
      { month: "August 2026", isFullProduction: true, score: 93.2, rating: "Very Satisfactory", status: "Validated" },
      { month: "September 2026", isFullProduction: true, score: 94.2, rating: "Very Satisfactory", status: "Validated" },
    ],
    otherConditions: [
      { condition: "Zero active formal disciplinary actions during quarter", status: "Met" },
      { condition: "Schedule adherence ≥ 95% maintained across 3 months", status: "Met" },
      { condition: "No unexcused absences or unauthorized downtime", status: "Met" },
      { condition: "Active employment on qualification disbursement date", status: "Met" },
    ],
    validationDetails: {
      isVerified: true,
      validator: "Mark Ramos (Supervisor)",
      validationDate: "2026-10-07",
      dataQuality: "All monthly scorecards verified with subcode dispute resolved.",
      remarks: "Consistently met high quality standards across quarter.",
    },
    approvalDetails: {
      reviewer: "Alexandria Chua (Operations Manager)",
      reviewDate: "2026-10-14",
      decision: "Approved",
      remarks: "Authorized $40 retention incentive.",
    },
  },
  {
    employeeId: "FS-1006",
    employeeName: "Patricia Nicole Reyes",
    account: "FrontSteps",
    supervisor: "Alexandria Chua",
    period: "Q3 2026 (Jul - Sep)",
    consecutiveMonths: 3,
    avgScore: 96.73,
    eligibilityStatus: "Qualified",
    approvalStatus: "Approved",
    incentiveAmount: 40,
    monthlyRecords: [
      { month: "July 2026", isFullProduction: true, score: 95.8, rating: "Exceptional", status: "Validated" },
      { month: "August 2026", isFullProduction: true, score: 96.9, rating: "Exceptional", status: "Validated" },
      { month: "September 2026", isFullProduction: true, score: 97.5, rating: "Exceptional", status: "Validated" },
    ],
    otherConditions: [
      { condition: "Zero active formal disciplinary actions during quarter", status: "Met" },
      { condition: "Schedule adherence ≥ 95% maintained across 3 months", status: "Met" },
      { condition: "No unexcused absences or unauthorized downtime", status: "Met" },
      { condition: "Active employment on qualification disbursement date", status: "Met" },
    ],
    validationDetails: {
      isVerified: true,
      validator: "Alexandria Chua (Operations Manager)",
      validationDate: "2026-10-05",
      dataQuality: "Zero attendance errors; 100% audited scorecards.",
      remarks: "Top quarterly performer. Met all criteria flawlessly.",
    },
    approvalDetails: {
      reviewer: "Alexandria Chua (Operations Manager)",
      reviewDate: "2026-10-12",
      decision: "Approved",
      remarks: "Approved for full $40 payout.",
    },
  },
  {
    employeeId: "FS-1007",
    employeeName: "Gabriel Joshua Tan",
    account: "FrontSteps",
    supervisor: "Alexandria Chua",
    period: "Q3 2026 (Jul - Sep)",
    consecutiveMonths: 3,
    avgScore: 80.9,
    eligibilityStatus: "Not Qualified",
    approvalStatus: "Declined",
    incentiveAmount: 40,
    monthlyRecords: [
      { month: "July 2026", isFullProduction: true, score: 81.2, rating: "Unsatisfactory", status: "Validated" },
      { month: "August 2026", isFullProduction: true, score: 82.2, rating: "Unsatisfactory", status: "Validated" },
      { month: "September 2026", isFullProduction: true, score: 79.3, rating: "Unsatisfactory", status: "Validated" },
    ],
    otherConditions: [
      { condition: "Zero active formal disciplinary actions during quarter", status: "Under PIP Review" },
      { condition: "Schedule adherence ≥ 95% maintained across 3 months", status: "Met" },
      { condition: "No unexcused absences or unauthorized downtime", status: "Met" },
      { condition: "Active employment on qualification disbursement date", status: "Met" },
    ],
    validationDetails: {
      isVerified: true,
      validator: "Alexandria Chua (Operations Manager)",
      validationDate: "2026-10-08",
      dataQuality: "Validated data confirmed sub-85 average.",
      remarks: "Average 80.90 falls below 85 requirement; referred for performance improvement.",
    },
    approvalDetails: {
      reviewer: "Alexandria Chua (Operations Manager)",
      reviewDate: "2026-10-11",
      decision: "Declined",
      remarks: "Disqualified due to sub-85 score average and active PIP review.",
    },
  },
  {
    employeeId: "FS-1008",
    employeeName: "Kristine Joy Morales",
    account: "FrontSteps",
    supervisor: "Sarah Gomez",
    period: "Q3 2026 (Jul - Sep)",
    consecutiveMonths: 3,
    avgScore: 87.23,
    eligibilityStatus: "Qualified",
    approvalStatus: "Pending Review",
    incentiveAmount: 40,
    monthlyRecords: [
      { month: "July 2026", isFullProduction: true, score: 86.4, rating: "Satisfactory", status: "Validated" },
      { month: "August 2026", isFullProduction: true, score: 88.4, rating: "Satisfactory", status: "Validated" },
      { month: "September 2026", isFullProduction: true, score: 86.9, rating: "Satisfactory", status: "Validated" },
    ],
    otherConditions: [
      { condition: "Zero active formal disciplinary actions during quarter", status: "Met" },
      { condition: "Schedule adherence ≥ 95% maintained across 3 months", status: "Met" },
      { condition: "No unexcused absences or unauthorized downtime", status: "Met" },
      { condition: "Active employment on qualification disbursement date", status: "Met" },
    ],
    validationDetails: {
      isVerified: true,
      validator: "Sarah Gomez (Team Leader)",
      validationDate: "2026-10-09",
      dataQuality: "Clean validation; all 3 months validated.",
      remarks: "Solid consistency across all quarter metrics.",
    },
    approvalDetails: {
      reviewer: "Pending Review",
      reviewDate: "—",
      decision: "Pending",
      remarks: "Awaiting final batch approval.",
    },
  },
  {
    employeeId: "FS-1009",
    employeeName: "Lance Christian Lim",
    account: "FrontSteps",
    supervisor: "Mark Ramos",
    period: "Q3 2026 (Jul - Sep)",
    consecutiveMonths: 2, // New hire / onboarding in July
    avgScore: 78.2,
    eligibilityStatus: "Not Qualified",
    approvalStatus: "Declined",
    incentiveAmount: 40,
    monthlyRecords: [
      { month: "July 2026", isFullProduction: false, score: 0, rating: "Onboarding / Training", status: "Unvalidated" },
      { month: "August 2026", isFullProduction: true, score: 79.9, rating: "Unsatisfactory", status: "Validated" },
      { month: "September 2026", isFullProduction: true, score: 76.5, rating: "Unsatisfactory", status: "Validated" },
    ],
    otherConditions: [
      { condition: "Three consecutive full production months required", status: "Not Met (July was Onboarding)" },
      { condition: "Zero active formal disciplinary actions during quarter", status: "Met" },
      { condition: "Schedule adherence ≥ 95% maintained across 3 months", status: "Met" },
      { condition: "Active employment on qualification disbursement date", status: "Met" },
    ],
    validationDetails: {
      isVerified: true,
      validator: "Mark Ramos (Supervisor)",
      validationDate: "2026-10-07",
      dataQuality: "July noted as nesting/onboarding; not a full production month.",
      remarks: "Does not meet 3 consecutive full production months requirement.",
    },
    approvalDetails: {
      reviewer: "Alexandria Chua (Operations Manager)",
      reviewDate: "2026-10-10",
      decision: "Declined",
      remarks: "Disqualified: July was onboarding nesting period.",
    },
  },
  {
    employeeId: "FS-1006",
    employeeName: "Patricia Nicole Reyes",
    account: "FrontSteps",
    supervisor: "Alexandria Chua",
    period: "Q2 2026 (Apr - Jun)",
    year: "2026",
    consecutiveMonths: 3,
    avgScore: 97.5,
    eligibilityStatus: "Qualified",
    approvalStatus: "Paid",
    incentiveAmount: 40,
    monthlyRecords: [
      { month: "April 2026", isFullProduction: true, score: 96.5, rating: "Exceptional", status: "Validated" },
      { month: "May 2026", isFullProduction: true, score: 98.0, rating: "Exceptional", status: "Validated" },
      { month: "June 2026", isFullProduction: true, score: 98.0, rating: "Exceptional", status: "Validated" },
    ],
    otherConditions: [
      { condition: "Zero active formal disciplinary actions during quarter", status: "Met" },
      { condition: "Schedule adherence ≥ 95% maintained across 3 months", status: "Met" },
      { condition: "No unexcused absences or unauthorized downtime", status: "Met" },
      { condition: "Active employment on qualification disbursement date", status: "Met" },
    ],
    validationDetails: {
      isVerified: true,
      validator: "Alexandria Chua (Operations Manager)",
      validationDate: "2026-07-08",
      dataQuality: "Full 3-month dataset verified with 100% compliance.",
      remarks: "Disbursement completed via payroll on 2026-07-15.",
    },
    approvalDetails: {
      reviewer: "Mark Ramos (Operations Lead)",
      reviewDate: "2026-07-12",
      decision: "Approved",
      remarks: "Disbursed $40 milestone bonus on July 15 payroll run.",
    },
  },
];

export default function FrontStepsQuarterlyIncentives() {
  const [records, setRecords] = useState(INITIAL_INCENTIVE_RECORDS);

  // Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState("ALL");
  const [selectedPeriod, setSelectedPeriod] = useState("ALL");
  const [selectedSupervisor, setSelectedSupervisor] = useState("ALL");
  const [selectedUnifiedStatus, setSelectedUnifiedStatus] = useState("ALL");

  // Helper to derive the required 5-state Unified Status:
  // 1. Pending Validation
  // 2. Qualified
  // 3. Not Qualified
  // 4. Approved
  // 5. Paid
  const getUnifiedStatus = (rec) => {
    if (rec.approvalStatus === "Paid") return "Paid";
    if (rec.approvalStatus === "Approved") return "Approved";
    if (rec.eligibilityStatus === "Pending Validation") return "Pending Validation";
    if (rec.eligibilityStatus === "Not Qualified" || rec.approvalStatus === "Declined") return "Not Qualified";
    if (rec.eligibilityStatus === "Qualified") return "Qualified";
    return "Pending Validation";
  };

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modals state
  const [detailsRecord, setDetailsRecord] = useState(null); // Modal 1: Employee Incentive Details
  const [validatingRecord, setValidatingRecord] = useState(null); // Modal 2: Eligibility Validation
  const [approvingRecord, setApprovingRecord] = useState(null); // Modal 3: Incentive Approval

  // Form state for Modal 2: Eligibility Validation
  const [validationForm, setValidationForm] = useState({
    verifiedProductionMonths: true,
    verifiedScorecards: true,
    verifiedAvgScore: true,
    verifiedOtherRequirements: true,
    remarks: "",
  });

  // Form state for Modal 3: Incentive Approval
  const [approvalForm, setApprovalForm] = useState({
    decision: "Approved",
    remarks: "",
  });

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      const matchSearch =
        searchTerm === "" ||
        rec.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.supervisor.toLowerCase().includes(searchTerm.toLowerCase());

      const matchYear =
        selectedYear === "ALL" ||
        (rec.year ? rec.year === selectedYear : rec.period.includes(selectedYear));

      const matchPeriod =
        selectedPeriod === "ALL" || rec.period === selectedPeriod;

      const matchSupervisor =
        selectedSupervisor === "ALL" || rec.supervisor === selectedSupervisor;

      const unifiedStatus = getUnifiedStatus(rec);
      const matchStatus =
        selectedUnifiedStatus === "ALL" || unifiedStatus === selectedUnifiedStatus;

      return matchSearch && matchYear && matchPeriod && matchSupervisor && matchStatus;
    });
  }, [records, searchTerm, selectedYear, selectedPeriod, selectedSupervisor, selectedUnifiedStatus]);

  // Paginated records
  const totalItems = filteredRecords.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredRecords.slice(startIndex, startIndex + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  // Reset filters
  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedYear("ALL");
    setSelectedPeriod("ALL");
    setSelectedSupervisor("ALL");
    setSelectedUnifiedStatus("ALL");
    setCurrentPage(1);
  };

  // 4 Summary KPI Cards
  const summaryStats = useMemo(() => {
    const total = records.length;
    const qualified = records.filter((r) => ["Qualified", "Approved", "Paid"].includes(getUnifiedStatus(r))).length;
    const pendingValidation = records.filter(
      (r) => getUnifiedStatus(r) === "Pending Validation"
    ).length;
    const paidOrApproved = records.filter(
      (r) => ["Approved", "Paid"].includes(getUnifiedStatus(r))
    ).length;
    const notQualified = records.filter(
      (r) => getUnifiedStatus(r) === "Not Qualified"
    ).length;

    return { total, qualified, pendingValidation, paidOrApproved, notQualified };
  }, [records]);

  // Management Attention Items
  const attentionStats = useMemo(() => {
    const pendingValidation = records.filter((r) => getUnifiedStatus(r) === "Pending Validation");
    const pendingApproval = records.filter((r) => r.eligibilityStatus === "Qualified" && r.approvalStatus === "Pending Review");
    return {
      pendingValidationCount: pendingValidation.length,
      pendingApprovalCount: pendingApproval.length,
      totalNeedingAttention: pendingValidation.length + pendingApproval.length,
    };
  }, [records]);

  // Unified status badge helper
  const getUnifiedStatusBadge = (status) => {
    switch (status) {
      case "Paid":
        return "bg-teal-50 text-teal-700 border border-teal-200/90";
      case "Approved":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200/90";
      case "Qualified":
        return "bg-blue-50 text-blue-700 border border-blue-200/90";
      case "Pending Validation":
        return "bg-amber-50 text-amber-700 border border-amber-200/90";
      case "Not Qualified":
        return "bg-rose-50 text-rose-700 border border-rose-200/90";
      default:
        return "bg-slate-100 text-slate-700 border border-slate-200";
    }
  };

  // Legacy badges helper for modals
  const getEligibilityBadge = (status) => {
    switch (status) {
      case "Qualified":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200/90";
      case "Pending Validation":
        return "bg-amber-50 text-amber-700 border border-amber-200/90";
      case "Not Qualified":
        return "bg-rose-50 text-rose-700 border border-rose-200/90";
      default:
        return "bg-slate-100 text-slate-700 border border-slate-200";
    }
  };

  const getApprovalBadge = (status) => {
    switch (status) {
      case "Paid":
        return "bg-teal-100 text-teal-800 border border-teal-300/80";
      case "Approved":
        return "bg-emerald-100 text-emerald-800 border border-emerald-300/80";
      case "Pending Review":
        return "bg-purple-50 text-purple-700 border border-purple-200/90";
      case "Not Submitted":
        return "bg-slate-100 text-slate-600 border border-slate-200";
      case "Declined":
        return "bg-rose-100 text-rose-800 border border-rose-300/80";
      default:
        return "bg-slate-100 text-slate-600 border border-slate-200";
    }
  };

  // Handle Save Eligibility Validation (Modal 2)
  const handleSaveValidation = (e) => {
    e.preventDefault();
    if (!validatingRecord) return;

    const allChecked =
      validationForm.verifiedProductionMonths &&
      validationForm.verifiedScorecards &&
      validationForm.verifiedAvgScore &&
      validationForm.verifiedOtherRequirements;

    const newEligStatus = allChecked && validatingRecord.avgScore >= 85 ? "Qualified" : "Not Qualified";
    const newApprStatus = newEligStatus === "Qualified" ? "Pending Review" : "Declined";

    const updated = records.map((r) => {
      if (r.employeeId === validatingRecord.employeeId) {
        return {
          ...r,
          eligibilityStatus: newEligStatus,
          approvalStatus: newApprStatus,
          validationDetails: {
            isVerified: true,
            validator: "Current Reviewer (Authorized Staff)",
            validationDate: "2026-10-20",
            dataQuality: allChecked ? "All checklist verifications passed." : "Checklist items flagged during validation.",
            remarks: validationForm.remarks || "Validation verified by authorized reviewer.",
          },
        };
      }
      return r;
    });

    setRecords(updated);
    setValidatingRecord(null);
  };

  // Handle Save Incentive Approval (Modal 3)
  const handleSaveApproval = (e) => {
    e.preventDefault();
    if (!approvingRecord) return;

    const updated = records.map((r) => {
      if (r.employeeId === approvingRecord.employeeId) {
        return {
          ...r,
          approvalStatus: approvalForm.decision,
          approvalDetails: {
            reviewer: "Alexandria Chua (Operations Manager)",
            reviewDate: "2026-10-20",
            decision: approvalForm.decision,
            remarks: approvalForm.remarks || "Decision recorded.",
          },
        };
      }
      return r;
    });

    setRecords(updated);
    setApprovingRecord(null);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2.5 sm:gap-3 overflow-hidden font-jakarta text-slate-800">
      {/* Management Attention Center Banner (Req #15) */}
      {attentionStats.totalNeedingAttention > 0 && (
        <div className="flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl bg-amber-50/90 border border-amber-200/90 text-amber-900 shadow-xs shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <Bell size={14} className="animate-pulse" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-amber-900">
                Management Attention Required ({attentionStats.totalNeedingAttention})
              </span>
              <p className="text-[11px] text-amber-700 leading-tight">
                {attentionStats.pendingValidationCount > 0 && (
                  <span>{attentionStats.pendingValidationCount} pending scorecard/attendance validation. </span>
                )}
                {attentionStats.pendingApprovalCount > 0 && (
                  <span>{attentionStats.pendingApprovalCount} qualified and awaiting management sign-off.</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {attentionStats.pendingValidationCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSelectedUnifiedStatus("Pending Validation");
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white text-amber-800 border border-amber-300 hover:bg-amber-100/70 transition-colors cursor-pointer shadow-2xs"
              >
                View Pending Validations ({attentionStats.pendingValidationCount})
              </button>
            )}
            {attentionStats.pendingApprovalCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSelectedUnifiedStatus("Qualified");
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-600 text-white hover:bg-amber-700 transition-colors cursor-pointer shadow-2xs"
              >
                Review Approvals ({attentionStats.pendingApprovalCount})
              </button>
            )}
          </div>
        </div>
      )}

      {/* 1. Summary Cards (4 Interactive KPI Cards) */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 shrink-0">
        {/* Card 1 — Total Employees Monitored */}
        <button
          type="button"
          onClick={() => {
            setSelectedUnifiedStatus("ALL");
            setCurrentPage(1);
          }}
          className={`flex items-center justify-between rounded-xl border bg-white px-4 py-2.5 shadow-xs text-left cursor-pointer transition-all hover:border-slate-300 ${
            selectedUnifiedStatus === "ALL" ? "border-[#042c51] ring-1 ring-[#042c51]/20 bg-slate-50/50" : "border-slate-200/90"
          }`}
        >
          <div className="min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Employees Monitored
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-extrabold text-slate-800">
                {summaryStats.total}
              </span>
              <span className="text-xs font-medium text-slate-400">FrontSteps</span>
            </div>
            <span className="block text-[10px] text-slate-400 mt-0.5">
              Active production rosters
            </span>
          </div>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-600 border border-slate-100">
            <Users size={15} />
          </div>
        </button>

        {/* Card 2 — Qualified & Approved */}
        <button
          type="button"
          onClick={() => {
            setSelectedUnifiedStatus("Qualified");
            setCurrentPage(1);
          }}
          className={`flex items-center justify-between rounded-xl border bg-white px-4 py-2.5 shadow-xs text-left cursor-pointer transition-all hover:border-emerald-300 ${
            selectedUnifiedStatus === "Qualified" || selectedUnifiedStatus === "Approved" ? "border-emerald-500 ring-1 ring-emerald-500/20 bg-emerald-50/30" : "border-slate-200/90"
          }`}
        >
          <div className="min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Qualified & Approved
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-extrabold text-emerald-700">
                {summaryStats.qualified}
              </span>
              <span className="text-xs font-medium text-emerald-600/80">Avg &ge; 85%</span>
            </div>
            <span className="block text-[10px] text-emerald-600 font-semibold mt-0.5">
              {summaryStats.paidOrApproved} authorized / paid
            </span>
          </div>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
            <Award size={15} />
          </div>
        </button>

        {/* Card 3 — Pending Validation */}
        <button
          type="button"
          onClick={() => {
            setSelectedUnifiedStatus("Pending Validation");
            setCurrentPage(1);
          }}
          className={`flex items-center justify-between rounded-xl border bg-white px-4 py-2.5 shadow-xs text-left cursor-pointer transition-all hover:border-amber-300 ${
            selectedUnifiedStatus === "Pending Validation" ? "border-amber-500 ring-1 ring-amber-500/20 bg-amber-50/30" : "border-slate-200/90"
          }`}
        >
          <div className="min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Pending Validation
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-extrabold text-amber-700">
                {summaryStats.pendingValidation}
              </span>
              <span className="text-xs font-medium text-amber-600/80">Action Req.</span>
            </div>
            <span className="block text-[10px] text-amber-600 font-semibold mt-0.5">
              Requires data check
            </span>
          </div>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
            <Clock size={15} />
          </div>
        </button>

        {/* Card 4 — Not Qualified */}
        <button
          type="button"
          onClick={() => {
            setSelectedUnifiedStatus("Not Qualified");
            setCurrentPage(1);
          }}
          className={`flex items-center justify-between rounded-xl border bg-white px-4 py-2.5 shadow-xs text-left cursor-pointer transition-all hover:border-rose-300 ${
            selectedUnifiedStatus === "Not Qualified" ? "border-rose-500 ring-1 ring-rose-500/20 bg-rose-50/30" : "border-slate-200/90"
          }`}
        >
          <div className="min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Not Qualified
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-extrabold text-rose-700">
                {summaryStats.notQualified}
              </span>
              <span className="text-xs font-medium text-rose-600/80">Ineligible</span>
            </div>
            <span className="block text-[10px] text-slate-400 mt-0.5">
              Below 85 or nesting month
            </span>
          </div>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
            <XCircle size={15} />
          </div>
        </button>
      </div>

      {/* 2. Filter Bar */}
      <div className="rounded-xl border border-slate-200/80 bg-white px-3.5 py-2.5 shadow-xs shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[300px]">
            {/* Search Input */}
            <div className="flex-1 min-w-[180px]">
              <div className="relative flex h-8 items-center rounded-lg border border-slate-200 bg-white px-2.5 transition-colors focus-within:border-[#ff5c28] focus-within:ring-1 focus-within:ring-[#ff5c28]/20">
                <Search size={13} className="text-slate-400 shrink-0 mr-2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search employee name or ID..."
                  className="w-full bg-transparent text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none"
                />
              </div>
            </div>

            {/* Year Filter (Req #14) */}
            <div className="w-[125px]">
              <SingleSelectDropdown
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: "ALL", label: "All Years" },
                  { value: "2026", label: "Year 2026" },
                  { value: "2025", label: "Year 2025" },
                ]}
                buttonClassName="h-8 rounded-lg border-slate-200 px-3 text-xs"
              />
            </div>

            {/* Quarter / Evaluation Period Filter */}
            <div className="w-[185px]">
              <SingleSelectDropdown
                value={selectedPeriod}
                onChange={(e) => {
                  setSelectedPeriod(e.target.value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: "ALL", label: "All Evaluation Periods" },
                  { value: "Q3 2026 (Jul - Sep)", label: "Q3 2026 (Jul - Sep)" },
                  { value: "Q2 2026 (Apr - Jun)", label: "Q2 2026 (Apr - Jun)" },
                ]}
                buttonClassName="h-8 rounded-lg border-slate-200 px-3 text-xs"
              />
            </div>

            {/* Supervisor Filter */}
            <div className="w-[160px]">
              <SingleSelectDropdown
                value={selectedSupervisor}
                onChange={(e) => {
                  setSelectedSupervisor(e.target.value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: "ALL", label: "All Supervisors" },
                  { value: "Sarah Gomez", label: "Sarah Gomez" },
                  { value: "Mark Ramos", label: "Mark Ramos" },
                  { value: "Alexandria Chua", label: "Alexandria Chua" },
                ]}
                buttonClassName="h-8 rounded-lg border-slate-200 px-3 text-xs"
              />
            </div>

            {/* Unified Status Filter (Req #10, #14) */}
            <div className="w-[185px]">
              <SingleSelectDropdown
                value={selectedUnifiedStatus}
                onChange={(e) => {
                  setSelectedUnifiedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: "ALL", label: "All Statuses (5 Lifecycle)" },
                  { value: "Pending Validation", label: "Pending Validation" },
                  { value: "Qualified", label: "Qualified (Pending Sign-off)" },
                  { value: "Not Qualified", label: "Not Qualified" },
                  { value: "Approved", label: "Approved" },
                  { value: "Paid", label: "Paid ($40 Disbursed)" },
                ]}
                buttonClassName="h-8 rounded-lg border-slate-200 px-3 text-xs"
              />
            </div>

            {/* Reset Filters button */}
            <button
              type="button"
              onClick={handleResetFilters}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
              title="Reset all filters"
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main Directory Table (Fixed height & layout matching Employee Performance) */}
      <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden flex flex-col flex-1 min-h-0">
        {/* Table Body */}
        <div className="overflow-auto flex-1 min-h-0 sibs-scrollbar">
          <table className="w-full table-fixed text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-[#042c51] bg-[#042c51] text-[11px] font-bold uppercase tracking-wider text-white select-none shadow-xs">
                <th className="py-3 px-3 w-[15%]">Employee Name / ID</th>
                <th className="py-3 px-3 w-[9%]">Account</th>
                <th className="py-3 px-3 w-[13%]">Evaluation Period</th>
                <th className="py-3 px-3 w-[12%] text-center">Consecutive Months</th>
                <th className="py-3 px-3 w-[13%] text-center">Avg Validated KPI</th>
                <th className="py-3 px-3 w-[13%]">Incentive Status</th>
                <th className="py-3 px-3 w-[10%] text-center">Bonus Amount</th>
                <th className="py-3 px-4 w-[15%] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {paginatedRecords.length > 0 ? (
                paginatedRecords.map((rec) => {
                  const unifiedStatus = getUnifiedStatus(rec);
                  return (
                    <tr
                      key={`${rec.employeeId}-${rec.period}`}
                      className="hover:bg-slate-50/70 transition-colors h-[54px]"
                    >
                      {/* Employee Name / ID */}
                      <td className="py-3 px-3">
                        <div
                          className="truncate font-semibold text-slate-900 text-[13px] leading-tight"
                          title={rec.employeeName}
                        >
                          {rec.employeeName}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[10.5px] text-slate-500 font-bold leading-none">
                            {rec.employeeId}
                          </span>
                          <span className="text-slate-300 leading-none">•</span>
                          <span className="text-[10px] text-slate-400 leading-none">
                            {rec.supervisor}
                          </span>
                        </div>
                      </td>

                      {/* Account */}
                      <td className="py-3 px-3 text-slate-700 text-xs truncate">
                        {rec.account}
                      </td>

                      {/* Evaluation Period */}
                      <td className="py-3 px-3 text-slate-700 text-xs whitespace-nowrap">
                        {rec.period}
                      </td>

                      {/* Consecutive Full Production Months */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[11px] font-bold ${
                            rec.consecutiveMonths >= 3
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {rec.consecutiveMonths} of 3 Months
                        </span>
                      </td>

                      {/* Average Validated Final KPI */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="font-mono text-[13px] font-bold text-slate-800">
                            {rec.avgScore.toFixed(2)}
                          </span>
                          {rec.avgScore >= 85 ? (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">
                              &ge;85
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1 py-0.5 rounded border border-rose-200">
                              &lt;85
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Unified Status (Req #10) */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${getUnifiedStatusBadge(
                            unifiedStatus
                          )}`}
                        >
                          {unifiedStatus}
                        </span>
                      </td>

                      {/* Quarterly Incentive Amount (Req #9) */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {["Qualified", "Approved", "Paid"].includes(unifiedStatus) ? (
                          <span className="font-mono font-bold text-emerald-700 text-xs">
                            ${rec.incentiveAmount || 40}.00
                          </span>
                        ) : (
                          <span className="font-mono text-slate-400 text-xs">$0.00</span>
                        )}
                      </td>

                      {/* Actions Column: View Details + Context-Aware Review / Validate Pill */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          {/* 1. View Button */}
                          <button
                            type="button"
                            onClick={() => setDetailsRecord(rec)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-[#042c51] transition-colors cursor-pointer shrink-0"
                            title="View three-month incentive scorecard & details"
                          >
                            <Eye size={14} className="text-slate-500" />
                            <span>View</span>
                          </button>

                          {/* 2. Context Action (Validate or Approve) */}
                          {unifiedStatus === "Pending Validation" && (
                            <button
                              type="button"
                              onClick={() => {
                                setValidatingRecord(rec);
                                setValidationForm({
                                  verifiedProductionMonths: rec.consecutiveMonths >= 3,
                                  verifiedScorecards: true,
                                  verifiedAvgScore: rec.avgScore >= 85,
                                  verifiedOtherRequirements: true,
                                  remarks: rec.validationDetails?.remarks || "",
                                });
                              }}
                              className="inline-flex items-center justify-center gap-1 h-[26px] px-2.5 rounded-lg text-[11px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 transition-colors cursor-pointer border border-amber-300"
                              title="Validate qualification data"
                            >
                              <FileCheck2 size={12} className="shrink-0" />
                              <span>Validate</span>
                            </button>
                          )}

                          {unifiedStatus === "Qualified" && (
                            <button
                              type="button"
                              onClick={() => {
                                setApprovingRecord(rec);
                                setApprovalForm({
                                  decision: "Approved",
                                  remarks: "Approved for $40 retention incentive payout.",
                                });
                              }}
                              className="inline-flex items-center justify-center gap-1 h-[26px] px-2.5 rounded-lg text-[11px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors cursor-pointer border border-purple-300"
                              title="Record management approval decision"
                            >
                              <ShieldCheck size={12} className="shrink-0" />
                              <span>Approve</span>
                            </button>
                          )}

                          {unifiedStatus === "Approved" && (
                            <button
                              type="button"
                              onClick={() => {
                                const updated = records.map((r) =>
                                  r.employeeId === rec.employeeId && r.period === rec.period
                                    ? { ...r, approvalStatus: "Paid" }
                                    : r
                                );
                                setRecords(updated);
                              }}
                              className="inline-flex items-center justify-center gap-1 h-[26px] px-2 rounded-lg text-[10.5px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer border border-emerald-300"
                              title="Mark bonus as Paid / Disbursed"
                            >
                              <CheckCircle2 size={11} />
                              <span>Mark Paid</span>
                            </button>
                          )}

                          {unifiedStatus === "Paid" && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700">
                              <CheckCircle size={12} />
                              <span>Paid ($40)</span>
                            </span>
                          )}

                          {unifiedStatus === "Not Qualified" && (
                            <span className="text-[11px] text-slate-400">
                              Ineligible
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                /* Empty state */
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                        <Award size={18} />
                      </div>
                      <p className="text-xs font-bold text-slate-700">
                        No quarterly incentive records found
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        No FrontSteps employees match your filter criteria.
                      </p>
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="mt-2.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#042c51] text-white hover:bg-[#073966] transition-colors"
                      >
                        <RotateCcw size={11} />
                        <span>Reset Filters</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Section 5 — Pagination */}
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={(page) => setCurrentPage(page)}
          itemLabel="incentive records"
          className="shrink-0"
        />
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: EMPLOYEE INCENTIVE DETAILS                       */}
      {/* ========================================================= */}
      {detailsRecord && (
        <EmployeeIncentiveDetailsModal
          record={detailsRecord}
          onClose={() => setDetailsRecord(null)}
          onValidateClick={(rec) => {
            setDetailsRecord(null);
            setValidatingRecord(rec);
            setValidationForm({
              verifiedProductionMonths: rec.consecutiveMonths >= 3,
              verifiedScorecards: true,
              verifiedAvgScore: rec.avgScore >= 85,
              verifiedOtherRequirements: true,
              remarks: rec.validationDetails?.remarks || "",
            });
          }}
          onApproveClick={(rec) => {
            setDetailsRecord(null);
            setApprovingRecord(rec);
            setApprovalForm({
              decision: "Approved",
              remarks: "Approved for $40 retention incentive payout.",
            });
          }}
        />
      )}

      {/* ========================================================= */}
      {/* MODAL 2: ELIGIBILITY VALIDATION                           */}
      {/* ========================================================= */}
      {validatingRecord && (
        <EligibilityValidationModal
          record={validatingRecord}
          form={validationForm}
          setForm={setValidationForm}
          onClose={() => setValidatingRecord(null)}
          onSave={handleSaveValidation}
        />
      )}

      {/* ========================================================= */}
      {/* MODAL 3: INCENTIVE APPROVAL                               */}
      {/* ========================================================= */}
      {approvingRecord && (
        <IncentiveApprovalModal
          record={approvingRecord}
          form={approvalForm}
          setForm={setApprovalForm}
          onClose={() => setApprovingRecord(null)}
          onSave={handleSaveApproval}
        />
      )}
    </div>
  );
}

// =========================================================================
// MODAL 1: EMPLOYEE INCENTIVE DETAILS COMPONENT
// =========================================================================
function EmployeeIncentiveDetailsModal({ record, onClose, onValidateClick, onApproveClick }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/25 p-4 sm:p-6 overflow-hidden animate-in fade-in duration-200">
      <div className="relative w-[90vw] max-w-4xl h-[82vh] max-h-[85vh] rounded-2xl bg-white shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 bg-[#042c51] text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white border border-white/20">
              <Award size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  {record.employeeName}
                </h3>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-white/15 text-slate-100">
                  {record.employeeId}
                </span>
                <span className="px-2 py-0.5 rounded bg-[#ff5c28] text-white text-[10.5px] font-bold uppercase tracking-wider">
                  {record.period}
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                FrontSteps Quarterly Retention and Consistency Incentive (FS-MILESTONE-001)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors font-bold text-xs cursor-pointer border border-white/15"
          >
            Close
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto sibs-scrollbar p-6 space-y-4 text-xs bg-slate-50/40">
          {/* Section A: Employee Information */}
          <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100">
              A. Employee Information & Assigned Hierarchy
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Employee</span>
                <span className="font-semibold text-slate-800 text-xs">{record.employeeName}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Employee ID</span>
                <span className="font-mono text-slate-700 text-xs">{record.employeeId}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Account</span>
                <span className="font-semibold text-slate-800 text-xs">{record.account}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Assigned Supervisor</span>
                <span className="font-semibold text-slate-800 text-xs">{record.supervisor}</span>
              </div>
            </div>
          </div>

          {/* Section B: Three-Month Qualification Summary */}
          <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                B. Three-Month Production & Validated KPI Performance
              </h4>
              <span className="font-mono text-xs font-bold text-[#042c51]">
                Target Threshold: &ge; 85.00 Average
              </span>
            </div>

            {/* Monthly Breakout Table */}
            <div className="overflow-x-auto rounded-lg border border-slate-200/80">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10.5px] font-bold uppercase text-slate-500 border-b border-slate-200">
                    <th className="py-2.5 px-3">Production Month</th>
                    <th className="py-2.5 px-3 text-center">Full Production Status</th>
                    <th className="py-2.5 px-3 text-center">Validated Final KPI</th>
                    <th className="py-2.5 px-3 text-center">Performance Rating</th>
                    <th className="py-2.5 px-3 text-center">Data Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {record.monthlyRecords.map((m, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{m.month}</td>
                      <td className="py-2.5 px-3 text-center">
                        {m.isFullProduction ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                            <Check size={12} /> Full Month
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600">
                            <XCircle size={12} /> Training / Partial
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">
                        {m.score > 0 ? m.score.toFixed(2) : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="text-[11px] font-medium text-slate-700">{m.rating}</span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            m.status === "Validated"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : m.status === "Corrected"
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Scorecard Summary Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-orange-50/40 border border-orange-200/80">
              <div>
                <span className="block text-[10px] font-bold text-slate-500 uppercase">
                  Qualifying Months
                </span>
                <span className="font-mono text-xs font-bold text-slate-900">
                  {record.consecutiveMonths} of 3 Consecutive Months
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-500 uppercase">
                  3-Month Validated Average
                </span>
                <span className="font-mono text-sm font-extrabold text-[#ff5c28]">
                  {record.avgScore.toFixed(2)} / 100
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-500 uppercase">
                  Policy Threshold
                </span>
                <span className="font-mono text-xs font-semibold text-slate-700">
                  &ge; 85.00 Average
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-500 uppercase">
                  Proposed Incentive
                </span>
                <span className="font-bold text-emerald-700 text-xs flex items-center gap-0.5">
                  <DollarSign size={13} /> {record.incentiveAmount}.00 (Quarterly)
                </span>
              </div>
            </div>
          </div>

          {/* Section C: Other Eligibility Conditions */}
          <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100">
              C. Policy Eligibility Checklist (FS-MILESTONE-001)
            </h4>
            <div className="space-y-2">
              {record.otherConditions.map((cond, cIdx) => (
                <div
                  key={cIdx}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50"
                >
                  <span className="text-xs text-slate-700 font-medium">{cond.condition}</span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold ${
                      cond.status === "Met"
                        ? "bg-emerald-100 text-emerald-800"
                        : cond.status.includes("Awaiting")
                        ? "bg-amber-100 text-amber-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {cond.status === "Met" ? <Check size={11} /> : <AlertTriangle size={11} />}
                    {cond.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Section D: Qualification Result & Status */}
          <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                D. Qualification Outcome & Reviewer Notes
              </h4>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-[11px]">Eligibility:</span>
                <span className="font-bold text-[#042c51]">{record.eligibilityStatus}</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500 text-[11px]">Approval:</span>
                <span className="font-bold text-[#ff5c28]">{record.approvalStatus}</span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <p className="text-slate-700">
                <strong>Validation Status:</strong> {record.validationDetails?.dataQuality}
              </p>
              {record.validationDetails?.remarks && (
                <p className="text-slate-600 italic">
                  "{record.validationDetails.remarks}" — {record.validationDetails.validator} ({record.validationDetails.validationDate})
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 bg-slate-50 shrink-0">
          <span className="text-[11px] text-slate-400">
            FS-MILESTONE-001 • Proposed Quarterly Retention Incentive Wireframe
          </span>
          <div className="flex items-center gap-2">
            {record.eligibilityStatus === "Pending Validation" && (
              <button
                type="button"
                onClick={() => onValidateClick(record)}
                className="px-3.5 py-1.5 rounded-lg bg-[#042c51] text-white hover:bg-[#073966] transition-colors font-bold text-xs cursor-pointer shadow-xs"
              >
                Open Eligibility Validation
              </button>
            )}
            {record.eligibilityStatus === "Qualified" && record.approvalStatus === "Pending Review" && (
              <button
                type="button"
                onClick={() => onApproveClick(record)}
                className="px-3.5 py-1.5 rounded-lg bg-[#ff5c28] text-white hover:bg-[#e04816] transition-colors font-bold text-xs cursor-pointer shadow-xs"
              >
                Open Incentive Approval
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// MODAL 2: ELIGIBILITY VALIDATION COMPONENT
// =========================================================================
function EligibilityValidationModal({ record, form, setForm, onClose, onSave }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/25 p-4 sm:p-6 overflow-hidden animate-in fade-in duration-200">
      <div className="relative w-[90vw] max-w-3xl h-[80vh] max-h-[82vh] rounded-2xl bg-white shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 bg-[#042c51] text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white border border-white/20">
              <FileCheck2 size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Eligibility Validation Review
              </h3>
              <p className="text-[11px] text-slate-300">
                Confirm whether employee incentive data is complete, accurate, and verified.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors font-bold text-xs cursor-pointer border border-white/15"
          >
            Close
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={onSave} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto sibs-scrollbar p-6 space-y-4 text-xs">
            {/* Section A: Employee and Period Summary */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 text-xs block">
                  {record.employeeName}
                </span>
                <span className="font-mono text-[10.5px] text-slate-500">
                  ID: {record.employeeId} • Period: {record.period}
                </span>
              </div>
              <div className="text-right">
                <span className="block text-[10px] uppercase font-bold text-slate-400">
                  3-Month Avg Score
                </span>
                <span className="font-mono font-extrabold text-sm text-[#042c51]">
                  {record.avgScore.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Section B: Validation Checklist */}
            <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100">
                B. Data Quality & Eligibility Validation Checklist
              </h4>

              <div className="space-y-2.5">
                <label className="flex items-start gap-2.5 cursor-pointer p-2 rounded-lg hover:bg-slate-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={form.verifiedProductionMonths}
                    onChange={(e) =>
                      setForm({ ...form, verifiedProductionMonths: e.target.checked })
                    }
                    className="accent-[#ff5c28] h-4 w-4 rounded mt-0.5 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-slate-800 text-xs block">
                      Three consecutive full production months verified
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Confirmed that none of the qualifying months were nesting, onboarding, or training.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer p-2 rounded-lg hover:bg-slate-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={form.verifiedScorecards}
                    onChange={(e) =>
                      setForm({ ...form, verifiedScorecards: e.target.checked })
                    }
                    className="accent-[#ff5c28] h-4 w-4 rounded mt-0.5 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-slate-800 text-xs block">
                      Monthly Final KPI scorecards validated
                    </span>
                    <span className="text-[11px] text-slate-500">
                      No unresolved disputes, pending corrections, or missing raw metrics.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer p-2 rounded-lg hover:bg-slate-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={form.verifiedAvgScore}
                    onChange={(e) =>
                      setForm({ ...form, verifiedAvgScore: e.target.checked })
                    }
                    className="accent-[#ff5c28] h-4 w-4 rounded mt-0.5 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-slate-800 text-xs block">
                      Average Final KPI meets proposed &ge;85.00 threshold
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Candidate achieved an average of {record.avgScore.toFixed(2)} across the 3 months.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer p-2 rounded-lg hover:bg-slate-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={form.verifiedOtherRequirements}
                    onChange={(e) =>
                      setForm({ ...form, verifiedOtherRequirements: e.target.checked })
                    }
                    className="accent-[#ff5c28] h-4 w-4 rounded mt-0.5 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-slate-800 text-xs block">
                      Other documented eligibility criteria reviewed
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Zero active disciplinary notices and verified active employment status.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Section C: Validator Remarks */}
            <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-2">
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Validator Remarks & Explanation <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                placeholder="Document your verification findings, data reconciliation, or reasons for return..."
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#ff5c28] resize-none"
              />
            </div>

            <p className="text-[11px] text-slate-400">
              * Note: Validation verifies data completeness and policy compliance. It does not constitute final management authorization.
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 bg-slate-50 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-[#042c51] text-white hover:bg-[#073966] transition-colors font-bold text-xs cursor-pointer shadow-xs"
            >
              Save Validation Status
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =========================================================================
// MODAL 3: INCENTIVE APPROVAL COMPONENT
// =========================================================================
function IncentiveApprovalModal({ record, form, setForm, onClose, onSave }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/25 p-4 sm:p-6 overflow-hidden animate-in fade-in duration-200">
      <div className="relative w-[90vw] max-w-2xl h-[75vh] max-h-[78vh] rounded-2xl bg-white shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 bg-[#042c51] text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white border border-white/20">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Incentive Management Approval
              </h3>
              <p className="text-[11px] text-slate-300">
                Authorized management sign-off for proposed $40 milestone incentive.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors font-bold text-xs cursor-pointer border border-white/15"
          >
            Close
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={onSave} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto sibs-scrollbar p-6 space-y-4 text-xs">
            {/* Section A: Incentive Summary */}
            <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100">
                Incentive Qualification Summary
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Employee</span>
                  <span className="font-semibold text-slate-800">{record.employeeName}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Quarter</span>
                  <span className="font-semibold text-slate-800">{record.period}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">3-Mo KPI Avg</span>
                  <span className="font-mono font-extrabold text-[#ff5c28] text-sm">
                    {record.avgScore.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Incentive Amount</span>
                  <span className="font-bold text-emerald-700 text-sm">
                    ${record.incentiveAmount}.00
                  </span>
                </div>
              </div>
            </div>

            {/* Section B: Management Decision */}
            <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100">
                Management Decision & Remarks
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Approver / Reviewer
                  </label>
                  <input
                    type="text"
                    readOnly
                    value="Alexandria Chua (Operations Manager)"
                    className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Approval Decision <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={form.decision}
                    onChange={(e) => setForm({ ...form, decision: e.target.value })}
                    className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-bold outline-none focus:border-[#ff5c28] cursor-pointer"
                  >
                    <option value="Approved">Approved (Authorize Payout Qualification)</option>
                    <option value="Returned for Review">Returned for Review</option>
                    <option value="Declined">Declined</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Management Remarks & Notes <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                  placeholder="Record formal management approval comments or justification..."
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#ff5c28] resize-none"
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              * Policy Guardrail: This is a wireframe demonstration. Final payout disbursements remain subject to client QTM, HR, and payroll schedule authorization.
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 bg-slate-50 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-[#ff5c28] text-white hover:bg-[#e04816] transition-colors font-bold text-xs cursor-pointer shadow-xs"
            >
              Record Management Decision
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
