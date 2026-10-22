import React, { useMemo, useState } from "react";
import {
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  RotateCcw,
  Eye,
  FileCheck2,
  Paperclip,
  CheckCircle,
  TrendingUp,
  FileText,
  User,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  X,
  Target,
  Edit3,
  Save,
  ArrowRight,
  AlertTriangle,
  PlayCircle,
  Award,
  Upload,
  ChevronDown,
  Bell,
  ListFilter,
  Check,
} from "lucide-react";
import SingleSelectDropdown from "../../components/common/filters/SingleSelectDropdown";
import TablePagination from "../../components/common/tables/TablePagination";
import DatePicker from "../../components/common/filters/DatePicker";

// Mock demonstration data representing FrontSteps Coaching Records
// Workflow statuses: "Scheduled", "In Progress", "Pending Follow-Up", "Completed"
const INITIAL_COACHING_RECORDS = [
  {
    id: "COACH-FS-001",
    employeeId: "FS-1004",
    employeeName: "Beatrice Anne Santos",
    account: "FrontSteps",
    coach: "Sarah Gomez",
    coachingType: "Scheduled",
    performanceGap: "Cases Closed (Weekly volume at 112 vs 140 target)",
    coachingDate: "2026-10-14",
    targetDate: "2026-10-28",
    reviewDate: "2026-11-04",
    status: "Pending Follow-Up",
    needsManagementReview: false,
    kpiArea: "Cases Closed / Volume",
    discussionNotes: "Reviewed case queue triage habits. Observed unnecessary hold time during ticket lookup.",
    actions: "Agent to practice dual-screen queue triage, utilize macro shortcuts for common HOA inquiries, and shadow high-performing peers.",
    responsiblePerson: "Beatrice Anne Santos (Agent) / Sarah Gomez (TL)",
    acknowledgment: {
      isAcknowledged: true,
      acknowledgedDate: "2026-10-14 15:30",
      employeeComments: "Understood the action items. Will apply the shortcut guide provided by TL Sarah.",
    },
    supportingEvidence: [
      { name: "Week_41_Queue_Output_Audit.xlsx", size: "48 KB", date: "2026-10-14", type: "Excel Sheet" },
      { name: "Cases_Triage_Shortcuts_Guide.pdf", size: "1.2 MB", date: "2026-10-14", type: "PDF Guide" },
    ],
    followUp: null,
  },
  {
    id: "COACH-FS-002",
    employeeId: "FS-1007",
    employeeName: "Gabriel Joshua Tan",
    account: "FrontSteps",
    coach: "Alexandria Chua",
    coachingType: "Unscheduled",
    performanceGap: "AHT Outlier on escalation tickets (Average 1,120s vs ≤900s)",
    coachingDate: "2026-10-12",
    targetDate: "2026-10-26",
    reviewDate: "2026-11-02",
    status: "In Progress",
    needsManagementReview: false,
    kpiArea: "AHT Compliance",
    discussionNotes: "Agent stays on unverified line waiting for customers to restart gate modems without structured triage.",
    actions: "Implement structured 3-step probing questions to identify community association gate hardware faults faster.",
    responsiblePerson: "Gabriel Joshua Tan (Agent)",
    acknowledgment: {
      isAcknowledged: true,
      acknowledgedDate: "2026-10-12 11:15",
      employeeComments: "Agreed. I spent too much time on unconfirmed customer hold times.",
    },
    supportingEvidence: [
      { name: "Call_ID_882914_Audit_Notes.pdf", size: "310 KB", date: "2026-10-12", type: "PDF Audit" },
      { name: "Hardware_Probing_Checklist.docx", size: "64 KB", date: "2026-10-12", type: "Document" },
    ],
    followUp: null,
  },
  {
    id: "COACH-FS-003",
    employeeId: "FS-1005",
    employeeName: "Rafael Dominic Castro",
    account: "FrontSteps",
    coach: "Mark Ramos",
    coachingType: "Scheduled",
    performanceGap: "Resolution Sub Code & Case Summary Documentation Completion (<95%)",
    coachingDate: "2026-10-09",
    targetDate: "2026-10-23",
    reviewDate: "2026-10-30",
    status: "Completed",
    needsManagementReview: false,
    kpiArea: "Data & Subcode Accuracy",
    discussionNotes: "Walked through 5 closed cases missing required resolution tags in Salesforce CRM.",
    actions: "Mandatory checklist verification prior to case resolution state commit in Salesforce.",
    responsiblePerson: "Rafael Dominic Castro (Agent) / Mark Ramos (Supervisor)",
    acknowledgment: {
      isAcknowledged: true,
      acknowledgedDate: "2026-10-09 16:45",
      employeeComments: "Will strictly fill subcode before closing cases.",
    },
    supportingEvidence: [
      { name: "CRM_Case_Discrepancy_Log_Oct08.pdf", size: "112 KB", date: "2026-10-09", type: "PDF Report" },
    ],
    followUp: {
      actualFollowUpDate: "2026-10-23",
      followUpResults: "Documentation completion rate rose to 98.4% over 14 consecutive days. Subcode accuracy audited at 100%.",
      improvementStatus: "Improved / Target Met",
      supervisorRemarks: "Great turnaround. Consistent documentation adherence observed.",
      closureStatus: "Closed - Resolved",
      needsReview: false,
    },
  },
  {
    id: "COACH-FS-004",
    employeeId: "FS-1009",
    employeeName: "Lance Christian Lim",
    account: "FrontSteps",
    coach: "Mark Ramos",
    coachingType: "Scheduled",
    performanceGap: "Schedule Adherence & Unplanned Aux Downtime (Aux 4 exceeds 20m threshold)",
    coachingDate: "2026-10-22",
    targetDate: "2026-11-05",
    reviewDate: "2026-11-12",
    status: "Scheduled",
    needsManagementReview: false,
    kpiArea: "Attendance & Adherence",
    discussionNotes: "Planned bi-weekly scheduled touchpoint to review break schedule compliance.",
    actions: "Review shift break timings and ensure proper auxiliary code toggling in telephony system.",
    responsiblePerson: "Lance Christian Lim (Agent)",
    acknowledgment: {
      isAcknowledged: false,
      acknowledgedDate: null,
      employeeComments: "",
    },
    supportingEvidence: [
      { name: "Avaya_Telephony_Aux_Report_W41.xlsx", size: "75 KB", date: "2026-10-16", type: "Excel Sheet" },
    ],
    followUp: null,
  },
  {
    id: "COACH-FS-005",
    employeeId: "FS-1003",
    employeeName: "Carlos Miguel Mendoza",
    account: "FrontSteps",
    coach: "Mark Ramos",
    coachingType: "Scheduled",
    performanceGap: "AHT Compliance (74.2% vs ≥80% requirement)",
    coachingDate: "2026-10-05",
    targetDate: "2026-10-19",
    reviewDate: "2026-10-26",
    status: "Completed",
    needsManagementReview: false,
    kpiArea: "AHT Compliance",
    discussionNotes: "Agent tends to keep callers on line during post-ticket survey transfer.",
    actions: "Practice call wraps while caller is finishing remarks; avoid delayed post-call processing.",
    responsiblePerson: "Carlos Miguel Mendoza (Agent)",
    acknowledgment: {
      isAcknowledged: true,
      acknowledgedDate: "2026-10-05 14:00",
      employeeComments: "Understood. Wrap up time improved by 45 seconds.",
    },
    supportingEvidence: [
      { name: "AHT_Distribution_Curve_Oct04.pdf", size: "320 KB", date: "2026-10-05", type: "PDF Audit" },
    ],
    followUp: {
      actualFollowUpDate: "2026-10-19",
      followUpResults: "AHT Compliance achieved 83.1% in the latest audit period.",
      improvementStatus: "Improved / Target Met",
      supervisorRemarks: "Target successfully achieved. Coaching concluded.",
      closureStatus: "Closed - Resolved",
      needsReview: false,
    },
  },
  {
    id: "COACH-FS-006",
    employeeId: "FS-1013",
    employeeName: "Nathaniel James Cruz",
    account: "FrontSteps",
    coach: "Alexandria Chua",
    coachingType: "Scheduled",
    performanceGap: "Customer Satisfaction (CSAT low scores regarding follow-up commitment)",
    coachingDate: "2026-10-15",
    targetDate: "2026-10-29",
    reviewDate: "2026-11-05",
    status: "Pending Follow-Up",
    needsManagementReview: false,
    kpiArea: "CSAT / Quality",
    discussionNotes: "Resident complaints regarding unreturned callbacks within agreed 24h SLA.",
    actions: "Set explicit reminder calendar alerts for ticket call-backs within 24 hours.",
    responsiblePerson: "Nathaniel James Cruz (Agent)",
    acknowledgment: {
      isAcknowledged: true,
      acknowledgedDate: "2026-10-15 10:20",
      employeeComments: "Will implement proactive email updates for pending resident tickets.",
    },
    supportingEvidence: [
      { name: "CSAT_Survey_Verbatim_Oct14.csv", size: "32 KB", date: "2026-10-15", type: "CSV Log" },
    ],
    followUp: null,
  },
  {
    id: "COACH-FS-007",
    employeeId: "FS-1008",
    employeeName: "Kristine Joy Morales",
    account: "FrontSteps",
    coach: "Sarah Gomez",
    coachingType: "Unscheduled",
    performanceGap: "Quality Assurance Calibration (Empathy statement missing on distressed callers)",
    coachingDate: "2026-10-07",
    targetDate: "2026-10-21",
    reviewDate: "2026-10-28",
    status: "Completed",
    needsManagementReview: false,
    kpiArea: "QA Score",
    discussionNotes: "Call recording listening session on 2 escalated homeowner billing calls.",
    actions: "Review soft-skills toolkit and utilize active listening phrases during call opening.",
    responsiblePerson: "Kristine Joy Morales (Agent)",
    acknowledgment: {
      isAcknowledged: true,
      acknowledgedDate: "2026-10-07 17:10",
      employeeComments: "Practiced with TL Sarah. Applied on queue today.",
    },
    supportingEvidence: [
      { name: "QA_Scorecard_Eval_#99142.pdf", size: "210 KB", date: "2026-10-07", type: "PDF Audit" },
    ],
    followUp: {
      actualFollowUpDate: "2026-10-21",
      followUpResults: "QA score improved to 96% on 3 consecutive audited interactions.",
      improvementStatus: "Improved / Target Met",
      supervisorRemarks: "Customer empathy handled exceptionally well.",
      closureStatus: "Closed - Resolved",
      needsReview: false,
    },
  },
  {
    id: "COACH-FS-008",
    employeeId: "FS-1011",
    employeeName: "Patrick Sean Reyes",
    account: "FrontSteps",
    coach: "Sarah Gomez",
    coachingType: "Scheduled",
    performanceGap: "Cases Closed Throughput (95 vs 140 benchmark)",
    coachingDate: "2026-09-28",
    targetDate: "2026-10-12",
    reviewDate: "2026-10-19",
    status: "Pending Follow-Up",
    needsManagementReview: true,
    kpiArea: "Cases Closed / Volume",
    discussionNotes: "Repeated throughput shortfall over 2 consecutive reporting cycles.",
    actions: "Daily triage shadowing for 30 minutes with lead agent.",
    responsiblePerson: "Patrick Sean Reyes (Agent)",
    acknowledgment: {
      isAcknowledged: true,
      acknowledgedDate: "2026-09-28 11:30",
      employeeComments: "Understood the volume targets.",
    },
    supportingEvidence: [
      { name: "Throughput_Deficit_W39.xlsx", size: "42 KB", date: "2026-09-28", type: "Excel Sheet" },
    ],
    followUp: {
      actualFollowUpDate: "2026-10-19",
      followUpResults: "Cases closed remained at 98 vs 140 benchmark. No significant pace improvement.",
      improvementStatus: "No Improvement",
      supervisorRemarks: "Flagged for management review to determine appropriate operational support.",
      closureStatus: "Pending Management Review",
      needsReview: true,
    },
  },
  {
    id: "COACH-FS-009",
    employeeId: "FS-1002",
    employeeName: "Janine Marie Dela Cruz",
    account: "FrontSteps",
    coach: "Sarah Gomez",
    coachingType: "Scheduled",
    performanceGap: "Omni Availability & Idle Aux Variance (91.4% vs 95% target)",
    coachingDate: "2026-10-18",
    targetDate: "2026-11-01",
    reviewDate: "2026-11-08",
    status: "Pending Acknowledgment",
    needsManagementReview: false,
    kpiArea: "Omni Channel Availability",
    discussionNotes: "Reviewed telephony auxiliary state transitions. Employee agreed on tighter state management during queue peaks.",
    actions: "Commit to minimizing unauthorized aux pauses; monitor real-time adherence dashboard.",
    responsiblePerson: "Janine Marie Dela Cruz (Agent)",
    acknowledgment: {
      isAcknowledged: false,
      acknowledgedDate: null,
      employeeComments: "",
    },
    supportingEvidence: [
      { name: "Omni_Aux_Variance_Report_Oct17.pdf", size: "88 KB", date: "2026-10-18", type: "PDF Audit" },
    ],
    followUp: null,
  },
  {
    id: "COACH-FS-010",
    employeeId: "FS-1006",
    employeeName: "Sophia Isabelle Reyes",
    account: "FrontSteps",
    coach: "Alexandria Chua",
    coachingType: "Scheduled",
    performanceGap: "AHT Compliance & Lengthy Call Holds (1,040s average)",
    coachingDate: "2026-09-20",
    targetDate: "2026-10-04",
    reviewDate: "2026-10-11",
    status: "Overdue",
    needsManagementReview: false,
    kpiArea: "AHT Compliance",
    discussionNotes: "Identified delayed call transfer procedure during homeowner escalation triage.",
    actions: "Utilize warm-transfer guide and reduce hold times below 120s limit.",
    responsiblePerson: "Sophia Isabelle Reyes (Agent)",
    acknowledgment: {
      isAcknowledged: true,
      acknowledgedDate: "2026-09-20 16:00",
      employeeComments: "Understood the transfer protocol.",
    },
    supportingEvidence: [
      { name: "Call_Hold_Time_Audit_W38.xlsx", size: "62 KB", date: "2026-09-20", type: "Excel Sheet" },
    ],
    followUp: null,
  },
  {
    id: "COACH-FS-011",
    employeeId: "FS-1010",
    employeeName: "Hannah Nicole Diaz",
    account: "FrontSteps",
    coach: "Mark Ramos",
    coachingType: "Scheduled",
    performanceGap: "Attendance & Unscheduled Leave Adherence",
    coachingDate: "2026-09-10",
    targetDate: "2026-09-24",
    reviewDate: "2026-10-01",
    status: "Closed",
    needsManagementReview: false,
    kpiArea: "Attendance & Punctuality",
    discussionNotes: "Addressed attendance discrepancies and shift swap procedures.",
    actions: "Adhere to standard notification window of at least 2 hours before shift start.",
    responsiblePerson: "Hannah Nicole Diaz (Agent)",
    acknowledgment: {
      isAcknowledged: true,
      acknowledgedDate: "2026-09-10 10:00",
      employeeComments: "Acknowledge and resolved.",
    },
    supportingEvidence: [
      { name: "Attendance_Scorecard_W36.pdf", size: "105 KB", date: "2026-09-10", type: "PDF Audit" },
    ],
    followUp: {
      actualFollowUpDate: "2026-10-01",
      followUpResults: "Zero unplanned absences or tardiness recorded in 30 days. Full compliance achieved.",
      improvementStatus: "Improved / Target Met",
      supervisorRemarks: "Coaching goals completely satisfied. Case closed.",
      closureStatus: "Closed - Resolved",
      needsReview: false,
    },
  },
];

// Mock FrontSteps Employees for searchable selection in Create Coaching Modal
const MOCK_FRONTSTEPS_EMPLOYEES = [
  { employeeId: "FS-1001", name: "Dwight Anthony Buma-at", account: "FrontSteps", supervisor: "Mark Ramos" },
  { employeeId: "FS-1002", name: "Janine Marie Dela Cruz", account: "FrontSteps", supervisor: "Sarah Gomez" },
  { employeeId: "FS-1003", name: "Carlos Miguel Mendoza", account: "FrontSteps", supervisor: "Mark Ramos" },
  { employeeId: "FS-1004", name: "Beatrice Anne Santos", account: "FrontSteps", supervisor: "Sarah Gomez" },
  { employeeId: "FS-1005", name: "Rafael Dominic Castro", account: "FrontSteps", supervisor: "Mark Ramos" },
  { employeeId: "FS-1006", name: "Patricia Nicole Reyes", account: "FrontSteps", supervisor: "Alexandria Chua" },
  { employeeId: "FS-1007", name: "Gabriel Joshua Tan", account: "FrontSteps", supervisor: "Alexandria Chua" },
  { employeeId: "FS-1008", name: "Kristine Joy Morales", account: "FrontSteps", supervisor: "Sarah Gomez" },
  { employeeId: "FS-1009", name: "Lance Christian Lim", account: "FrontSteps", supervisor: "Mark Ramos" },
  { employeeId: "FS-1010", name: "Danielle Grace Villanueva", account: "FrontSteps", supervisor: "Alexandria Chua" },
  { employeeId: "FS-1011", name: "Patrick Sean Reyes", account: "FrontSteps", supervisor: "Sarah Gomez" },
];

// FrontSteps PMP documented KPIs and placeholder targets
const FRONTSTEPS_KPI_TARGETS = {
  "Cases Closed / Volume": {
    target: "≥ 140 cases / week (Volume Benchmark)",
    actualPlaceholder: "112 cases closed (Last audited week)",
  },
  "QA Score (Quality Assurance)": {
    target: "≥ 95.0% Overall QA Score",
    actualPlaceholder: "88.5% audited QA score",
  },
  "AHT Compliance (Handling Time)": {
    target: "≥ 80.0% AHT Compliance (< 480s)",
    actualPlaceholder: "74.2% AHT compliance",
  },
  "Answer Rate & Telephony Adherence": {
    target: "≥ 90.0% Answer Rate / < 5% Abandonment",
    actualPlaceholder: "83.4% Answer Rate",
  },
  "Attendance & Punctuality": {
    target: "100% Attendance / < 3 unplanned aux incidents",
    actualPlaceholder: "92.0% Schedule adherence (2 tardiness incidents)",
  },
  "CSAT / Customer Satisfaction": {
    target: "≥ 90.0% Top-Box Positive Customer Rating",
    actualPlaceholder: "82.5% CSAT score",
  },
  "Data & Subcode Accuracy": {
    target: "100% Correct Ticket Subcoding in CRM",
    actualPlaceholder: "91.0% Subcoding accuracy (5 discrepancies)",
  },
};
function formatReadableDate(dateString) {
  if (!dateString) return "—";
  const dateObj = new Date(dateString);
  if (isNaN(dateObj.getTime())) return dateString;
  return dateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Helper to check if a date string is past today ("2026-10-20")
function isPastDate(dateString) {
  if (!dateString) return false;
  return dateString < "2026-10-20";
}

export default function FrontStepsCoachingManagement() {
  const [records, setRecords] = useState(INITIAL_COACHING_RECORDS);

  // Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSupervisor, setSelectedSupervisor] = useState("ALL");
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedDate, setSelectedDate] = useState("");
  const [activeViewTab, setActiveViewTab] = useState("records"); // "records" | "schedule"

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createMode, setCreateMode] = useState("plan"); // "plan" (for Scheduled future) or "document" (conducted)
  const [viewingRecord, setViewingRecord] = useState(null);
  const [viewingGapRecord, setViewingGapRecord] = useState(null);
  const [followingUpRecord, setFollowingUpRecord] = useState(null);
  const [recordingSessionRecord, setRecordingSessionRecord] = useState(null);

  // Form state for Create Coaching Modal
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState("");
  const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    employeeName: "",
    employeeId: "",
    account: "FrontSteps",
    coach: "Sarah Gomez",
    coachingType: "Scheduled",
    coachingDate: "2026-10-24",
    coachingTime: "14:00",
    kpiArea: "Cases Closed / Volume",
    performanceGap: "",
    actualPerformance: FRONTSTEPS_KPI_TARGETS["Cases Closed / Volume"]?.actualPlaceholder || "",
    requiredTarget: FRONTSTEPS_KPI_TARGETS["Cases Closed / Volume"]?.target || "",
    discussionNotes: "",
    actions: "",
    responsiblePerson: "Employee (Self)",
    targetDate: "2026-11-07",
    reviewDate: "2026-11-14",
    supportNeeded: "",
    coachingCommitments: "",
    supportingRef: "FrontSteps_W42_Operational_Report.xlsx",
    additionalRemarks: "",
    uploadedFiles: [
      { name: "Week_42_Queue_Output_Audit.xlsx", size: "48 KB", date: "2026-10-20", type: "Excel Sheet" },
    ],
  });

  // Form state for Follow-Up Modal
  const [followUpForm, setFollowUpForm] = useState({
    actualFollowUpDate: "2026-10-20",
    followUpResults: "",
    improvementStatus: "Improved / Target Met", // "Improved / Target Met" | "Partial Improvement" | "No Improvement"
    supervisorRemarks: "",
    newReviewDate: "2026-11-03",
    closureStatus: "Closed - Resolved",
    flagManagementReview: false,
  });

  // Reset filter handler
  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedSupervisor("ALL");
    setSelectedType("ALL");
    setSelectedStatus("ALL");
    setSelectedDate("");
    setCurrentPage(1);
  };

  // Filtered dataset
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        rec.employeeName.toLowerCase().includes(q) ||
        rec.employeeId.toLowerCase().includes(q) ||
        rec.id.toLowerCase().includes(q) ||
        rec.performanceGap.toLowerCase().includes(q);

      const matchesSupervisor =
        selectedSupervisor === "ALL" || rec.coach === selectedSupervisor;

      const matchesType =
        selectedType === "ALL" || rec.coachingType === selectedType;

      let matchesStatus = true;
      if (selectedStatus === "ALL") {
        matchesStatus = true;
      } else if (selectedStatus === "Overdue") {
        matchesStatus =
          rec.status === "Overdue" ||
          (rec.status !== "Completed" && rec.status !== "Closed" && (isPastDate(rec.targetDate) || isPastDate(rec.reviewDate)));
      } else {
        matchesStatus = rec.status === selectedStatus;
      }

      const matchesDate =
        !selectedDate ||
        rec.coachingDate === selectedDate ||
        rec.targetDate === selectedDate ||
        rec.reviewDate === selectedDate;

      return matchesSearch && matchesSupervisor && matchesType && matchesStatus && matchesDate;
    });
  }, [records, searchTerm, selectedSupervisor, selectedType, selectedStatus, selectedDate]);

  // Pagination calculations
  const totalItems = filteredRecords.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  // 4 KPI Summary Cards calculations
  const summaryStats = useMemo(() => {
    const total = records.length;
    const scheduled = records.filter((r) => r.status === "Scheduled").length;
    const overdue = records.filter(
      (r) =>
        r.status === "Overdue" ||
        (r.status !== "Completed" && r.status !== "Closed" && (isPastDate(r.targetDate) || isPastDate(r.reviewDate)))
    ).length;
    const completedOrClosed = records.filter(
      (r) => r.status === "Completed" || r.status === "Closed"
    ).length;

    return { total, scheduled, overdue, completedOrClosed };
  }, [records]);

  // Notification items calculation for management alerts
  const managementAlerts = useMemo(() => {
    const overdueFollowUps = records.filter(
      (r) =>
        r.status === "Overdue" ||
        (r.status !== "Completed" && r.status !== "Closed" && (isPastDate(r.targetDate) || isPastDate(r.reviewDate)))
    );
    const pendingReviews = records.filter((r) => r.needsManagementReview);
    const pendingAcks = records.filter((r) => r.status === "Pending Acknowledgment");

    return {
      overdueCount: overdueFollowUps.length,
      reviewCount: pendingReviews.length,
      ackCount: pendingAcks.length,
      totalAlerts: overdueFollowUps.length + pendingReviews.length + pendingAcks.length,
    };
  }, [records]);

  // Status badge styling helper (supports all required workflow states)
  const getStatusBadge = (status, needsReview) => {
    if (needsReview) {
      return "bg-rose-50 text-rose-700 border border-rose-200/90";
    }
    switch (status) {
      case "Scheduled":
        return "bg-blue-50 text-blue-700 border border-blue-200/90";
      case "Pending Acknowledgment":
        return "bg-amber-50 text-amber-700 border border-amber-200/90";
      case "In Progress":
        return "bg-purple-50 text-purple-700 border border-purple-200/90";
      case "Pending Follow-Up":
        return "bg-indigo-50 text-indigo-700 border border-indigo-200/90";
      case "Overdue":
        return "bg-rose-50 text-rose-700 border border-rose-200/90";
      case "Completed":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200/90";
      case "Closed":
        return "bg-teal-50 text-teal-700 border border-teal-200/90";
      default:
        return "bg-slate-100 text-slate-600 border border-slate-200";
    }
  };

  // Coaching Type badge styling helper
  const getTypeBadge = (type) => {
    return type === "Scheduled"
      ? "bg-slate-100 text-slate-700 border border-slate-200"
      : "bg-orange-50 text-[#ff5c28] border border-orange-200/70";
  };

  // Handle Save Create Coaching
  const handleSaveCreateCoaching = (e) => {
    e.preventDefault();
    if (!createForm.employeeName.trim()) {
      alert("Please select an employee from the dropdown list.");
      return;
    }
    if (!createForm.performanceGap.trim()) {
      alert("Please enter the identified performance gap.");
      return;
    }

    // Determine initial status based on type and planning mode
    const isFutureScheduled = createForm.coachingType === "Scheduled" && createMode === "plan";
    const initialStatus = isFutureScheduled ? "Scheduled" : "In Progress";

    // Combine any uploaded files or fallback to default brief
    const evidenceList =
      createForm.uploadedFiles && createForm.uploadedFiles.length > 0
        ? createForm.uploadedFiles
        : createForm.supportingRef
        ? [{ name: createForm.supportingRef, size: "52 KB", date: createForm.coachingDate, type: "Performance Audit" }]
        : [{ name: "Initial_Coaching_Brief.pdf", size: "45 KB", date: createForm.coachingDate, type: "PDF Brief" }];

    const newRecord = {
      id: `COACH-FS-${String(records.length + 1).padStart(3, "0")}`,
      employeeId: createForm.employeeId || "FS-TEMP",
      employeeName: createForm.employeeName,
      account: "FrontSteps",
      coach: createForm.coach,
      coachingType: createForm.coachingType,
      performanceGap: createForm.performanceGap,
      coachingDate: createForm.coachingDate,
      coachingTime: createForm.coachingTime || "14:00",
      targetDate: createForm.targetDate,
      reviewDate: createForm.reviewDate,
      status: initialStatus,
      needsManagementReview: false,
      kpiArea: createForm.kpiArea || "Production Metric",
      actualPerformance: createForm.actualPerformance,
      requiredTarget: createForm.requiredTarget,
      discussionNotes:
        createForm.discussionNotes ||
        (isFutureScheduled
          ? "Session scheduled on calendar; agenda prepared."
          : "Coaching session conducted and action plan established."),
      actions: createForm.actions || "Action plan committed during coaching touchpoint.",
      responsiblePerson: createForm.responsiblePerson || createForm.employeeName,
      supportNeeded: createForm.supportNeeded || "",
      coachingCommitments: createForm.coachingCommitments || "",
      supportingRef: createForm.supportingRef || "",
      additionalRemarks: createForm.additionalRemarks || "",
      acknowledgment: {
        isAcknowledged: false,
        acknowledgedDate: null,
        employeeComments: "",
      },
      supportingEvidence: evidenceList,
      followUp: null,
    };

    setRecords([newRecord, ...records]);
    setIsCreateModalOpen(false);
    // Reset createForm
    setCreateForm({
      employeeName: "",
      employeeId: "",
      account: "FrontSteps",
      coach: "Sarah Gomez",
      coachingType: "Scheduled",
      coachingDate: "2026-10-24",
      coachingTime: "14:00",
      kpiArea: "Cases Closed / Volume",
      performanceGap: "",
      actualPerformance: FRONTSTEPS_KPI_TARGETS["Cases Closed / Volume"]?.actualPlaceholder || "",
      requiredTarget: FRONTSTEPS_KPI_TARGETS["Cases Closed / Volume"]?.target || "",
      discussionNotes: "",
      actions: "",
      responsiblePerson: "Employee (Self)",
      targetDate: "2026-11-07",
      reviewDate: "2026-11-14",
      supportNeeded: "",
      coachingCommitments: "",
      supportingRef: "FrontSteps_W42_Operational_Report.xlsx",
      additionalRemarks: "",
      uploadedFiles: [
        { name: "Week_42_Queue_Output_Audit.xlsx", size: "48 KB", date: "2026-10-20", type: "Excel Sheet" },
      ],
    });
    setEmployeeSearchQuery("");
    setIsEmployeeDropdownOpen(false);
  };

  // Handle Save Follow-Up Outcome
  const handleSaveFollowUp = (e) => {
    e.preventDefault();
    if (!followingUpRecord) return;

    let nextStatus = "Completed";
    let nextClosure = followUpForm.closureStatus;
    let needsMgmt = followUpForm.flagManagementReview;

    if (followUpForm.improvementStatus === "Improved / Target Met") {
      nextStatus = "Completed";
      nextClosure = "Closed - Resolved";
      needsMgmt = false;
    } else if (followUpForm.improvementStatus === "Partial Improvement") {
      nextStatus = "In Progress";
      nextClosure = "Extended Monitoring";
      needsMgmt = false;
    } else if (followUpForm.improvementStatus === "No Improvement") {
      nextStatus = "Pending Follow-Up";
      nextClosure = "Needs Management Review";
      needsMgmt = true;
    }

    const updatedRecords = records.map((r) => {
      if (r.id === followingUpRecord.id) {
        return {
          ...r,
          status: nextStatus,
          needsManagementReview: needsMgmt,
          reviewDate:
            followUpForm.improvementStatus === "Partial Improvement"
              ? followUpForm.newReviewDate
              : r.reviewDate,
          followUp: {
            actualFollowUpDate: followUpForm.actualFollowUpDate,
            followUpResults:
              followUpForm.followUpResults || "Observed performance assessment documented.",
            improvementStatus: followUpForm.improvementStatus,
            supervisorRemarks:
              followUpForm.supervisorRemarks || "Follow-up outcome recorded by supervisor.",
            closureStatus: nextClosure,
            needsReview: needsMgmt,
          },
        };
      }
      return r;
    });

    setRecords(updatedRecords);
    setFollowingUpRecord(null);
  };

  // Handle Record Session for Scheduled records (opens documentation mode)
  const handleRecordConductedSession = (e) => {
    e.preventDefault();
    if (!recordingSessionRecord) return;

    const updated = records.map((r) => {
      if (r.id === recordingSessionRecord.id) {
        return {
          ...r,
          status: "In Progress",
          discussionNotes:
            recordingSessionRecord.discussionNotes ||
            "Conducted scheduled coaching session. Agreed on improvement milestones.",
          actions: recordingSessionRecord.actions || r.actions,
          coachingDate: "2026-10-20",
        };
      }
      return r;
    });

    setRecords(updated);
    setRecordingSessionRecord(null);
  };

  // Handle generic record update
  const handleUpdateRecord = (updatedRecord) => {
    setRecords((prev) => prev.map((r) => (r.id === updatedRecord.id ? updatedRecord : r)));
    if (viewingRecord && viewingRecord.id === updatedRecord.id) {
      setViewingRecord(updatedRecord);
    }
  };

  // Handle Employee Acknowledgment submission
  const handleEmployeeAcknowledge = (recordId, comments) => {
    const updatedRecords = records.map((r) => {
      if (r.id === recordId) {
        return {
          ...r,
          status: r.status === "Scheduled" ? "In Progress" : r.status,
          acknowledgment: {
            isAcknowledged: true,
            acknowledgedDate: "2026-10-20 17:15",
            employeeComments: comments || "Coaching touched base and received.",
          },
        };
      }
      return r;
    });

    setRecords(updatedRecords);
    if (viewingRecord && viewingRecord.id === recordId) {
      const target = updatedRecords.find((x) => x.id === recordId);
      if (target) setViewingRecord(target);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2.5 sm:gap-3 overflow-hidden font-jakarta text-slate-800">
      {/* 1. Summary Cards (4 Metrics matching Administration and other FrontSteps modules) */}
      {/* 1. Summary Cards (4 Metrics with interactive quick-filter click) */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 shrink-0">
        {/* Card 1 — Total Coaching Records */}
        <div
          onClick={() => {
            setSelectedStatus("ALL");
            setCurrentPage(1);
          }}
          className={`flex items-center justify-between rounded-xl border bg-white px-4 py-2.5 shadow-xs cursor-pointer transition-all hover:border-slate-300 ${
            selectedStatus === "ALL" ? "border-[#042c51] ring-1 ring-[#042c51]/20" : "border-slate-200/90"
          }`}
          title="Filter: All sessions"
        >
          <div className="min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Coaching Records
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-extrabold text-slate-800">
                {summaryStats.total}
              </span>
              <span className="text-xs font-medium text-slate-400">Sessions</span>
            </div>
            <span className="block text-[10px] text-slate-400 mt-0.5">
              All FrontSteps sessions
            </span>
          </div>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
            <Users size={15} />
          </div>
        </div>

        {/* Card 2 — Scheduled Coaching */}
        <div
          onClick={() => {
            setSelectedStatus(selectedStatus === "Scheduled" ? "ALL" : "Scheduled");
            setCurrentPage(1);
          }}
          className={`flex items-center justify-between rounded-xl border bg-white px-4 py-2.5 shadow-xs cursor-pointer transition-all hover:border-orange-300 ${
            selectedStatus === "Scheduled" ? "border-[#ff5c28] ring-1 ring-[#ff5c28]/20" : "border-slate-200/90"
          }`}
          title="Filter: Scheduled sessions"
        >
          <div className="min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Scheduled Coaching
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-extrabold text-[#042c51]">
                {summaryStats.scheduled}
              </span>
              <span className="text-xs font-medium text-slate-400">Planned</span>
            </div>
            <span className="block text-[10px] text-slate-400 mt-0.5">
              Upcoming touchpoints
            </span>
          </div>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-[#ff5c28] border border-orange-100">
            <Calendar size={15} />
          </div>
        </div>

        {/* Card 3 — Overdue Follow-Ups */}
        <div
          onClick={() => {
            setSelectedStatus(selectedStatus === "Overdue" ? "ALL" : "Overdue");
            setCurrentPage(1);
          }}
          className={`flex items-center justify-between rounded-xl border bg-white px-4 py-2.5 shadow-xs cursor-pointer transition-all hover:border-rose-300 ${
            selectedStatus === "Overdue" ? "border-rose-400 ring-1 ring-rose-400/20" : "border-slate-200/90"
          }`}
          title="Filter: Overdue action items & follow-ups"
        >
          <div className="min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Overdue Follow-Ups
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-extrabold text-rose-600">
                {summaryStats.overdue}
              </span>
              <span className="text-xs font-medium text-rose-500">Urgent</span>
            </div>
            <span className="block text-[10px] text-rose-500 font-semibold mt-0.5">
              Past target or review date
            </span>
          </div>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
            <AlertCircle size={15} />
          </div>
        </div>

        {/* Card 4 — Completed & Closed */}
        <div
          onClick={() => {
            setSelectedStatus(selectedStatus === "Completed" ? "ALL" : "Completed");
            setCurrentPage(1);
          }}
          className={`flex items-center justify-between rounded-xl border bg-white px-4 py-2.5 shadow-xs cursor-pointer transition-all hover:border-emerald-300 ${
            selectedStatus === "Completed" ? "border-emerald-500 ring-1 ring-emerald-500/20" : "border-slate-200/90"
          }`}
          title="Filter: Completed & closed sessions"
        >
          <div className="min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Completed & Closed
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-extrabold text-emerald-700">
                {summaryStats.completedOrClosed}
              </span>
              <span className="text-xs font-medium text-emerald-600/80">Closed</span>
            </div>
            <span className="block text-[10px] text-emerald-600/80 mt-0.5">
              Target met & resolved
            </span>
          </div>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
            <CheckCircle2 size={15} />
          </div>
        </div>
      </div>

      {/* Requirement #15: Management Notification & Action Center Banner */}
      {managementAlerts.totalAlerts > 0 && (
        <div className="rounded-xl border border-amber-200/90 bg-amber-50/70 px-4 py-2.5 shadow-xs shrink-0 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
              <Bell size={14} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-900">
                  Supervisor Attention Required
                </span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-amber-200 text-amber-900">
                  {managementAlerts.totalAlerts} Active
                </span>
              </div>
              <p className="text-[11px] text-amber-800/90 mt-0.5">
                FrontSteps coaching items require acknowledgment, follow-up evaluation, or managerial review.
              </p>
            </div>
          </div>

          {/* Quick interactive filter pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {managementAlerts.overdueCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSelectedStatus("Overdue");
                  setCurrentPage(1);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                  selectedStatus === "Overdue"
                    ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                    : "bg-white text-rose-700 border-rose-200 hover:bg-rose-50"
                }`}
              >
                <AlertCircle size={12} />
                <span>{managementAlerts.overdueCount} Overdue Follow-ups</span>
              </button>
            )}

            {managementAlerts.ackCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSelectedStatus("Pending Acknowledgment");
                  setCurrentPage(1);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                  selectedStatus === "Pending Acknowledgment"
                    ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                    : "bg-white text-amber-800 border-amber-300 hover:bg-amber-50"
                }`}
              >
                <Clock size={12} />
                <span>{managementAlerts.ackCount} Pending Ack</span>
              </button>
            )}

            {managementAlerts.reviewCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("Patrick Sean Reyes");
                  setCurrentPage(1);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white text-rose-700 border border-rose-200 hover:bg-rose-50 transition-all cursor-pointer"
              >
                <AlertTriangle size={12} />
                <span>{managementAlerts.reviewCount} Mgmt Escalation</span>
              </button>
            )}

            {(selectedStatus !== "ALL" || searchTerm) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-[11px] font-bold text-slate-500 hover:text-slate-800 underline ml-1 cursor-pointer"
              >
                Clear Filter
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. Search, Filters, and Schedule Switcher Bar */}
      <div className="rounded-xl border border-slate-200/80 bg-white px-3.5 py-2.5 shadow-xs shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Left: View Tabs + Search and Filters */}
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[300px]">
            {/* View Mode Toggle: All Records vs Schedule & Timeline */}
            <div className="flex items-center rounded-lg bg-slate-100 p-0.5 border border-slate-200 shrink-0">
              <button
                type="button"
                onClick={() => setActiveViewTab("records")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                  activeViewTab === "records"
                    ? "bg-[#042c51] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <ListFilter size={13} />
                <span>Records Table</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveViewTab("schedule")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                  activeViewTab === "schedule"
                    ? "bg-[#042c51] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Calendar size={13} />
                <span>Schedule & Timeline</span>
              </button>
            </div>

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
                  placeholder="Search employee, ID, record #, or gap..."
                  className="w-full bg-transparent text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none"
                />
              </div>
            </div>

            {/* DatePicker Filter */}
            <div className="w-[155px]">
              <DatePicker
                value={selectedDate}
                onChange={(iso) => {
                  setSelectedDate(iso);
                  setCurrentPage(1);
                }}
                buttonClassName="h-8 rounded-lg border-slate-200 px-2.5 text-xs font-medium"
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

            {/* Coaching Type Filter */}
            <div className="w-[145px]">
              <SingleSelectDropdown
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: "ALL", label: "All Types" },
                  { value: "Scheduled", label: "Scheduled" },
                  { value: "Unscheduled", label: "Unscheduled" },
                ]}
                buttonClassName="h-8 rounded-lg border-slate-200 px-3 text-xs"
              />
            </div>

            {/* Coaching Status Filter (All 6 Required States + Overdue) */}
            <div className="w-[185px]">
              <SingleSelectDropdown
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: "ALL", label: "All Statuses" },
                  { value: "Scheduled", label: "Scheduled" },
                  { value: "Pending Acknowledgment", label: "Pending Acknowledgment" },
                  { value: "In Progress", label: "In Progress" },
                  { value: "Pending Follow-Up", label: "Pending Follow-Up" },
                  { value: "Overdue", label: "Overdue" },
                  { value: "Completed", label: "Completed" },
                  { value: "Closed", label: "Closed" },
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

          {/* Right: Create Coaching Primary Button */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => {
                setCreateMode("plan");
                setIsCreateModalOpen(true);
              }}
              className="flex h-8 items-center gap-1.5 rounded-lg bg-[#ff5c28] px-3.5 text-xs font-bold text-white hover:bg-[#e04816] transition-colors cursor-pointer shadow-xs"
            >
              <Plus size={14} />
              <span>Create Coaching</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main Content: Records Table OR Schedule & Timeline View */}
      {activeViewTab === "records" ? (
        <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden flex flex-col flex-1 min-h-0">
        {/* Table Body */}
        <div className="overflow-auto flex-1 min-h-0 sibs-scrollbar">
          <table className="w-full table-fixed text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-[#042c51] bg-[#042c51] text-[11px] font-bold uppercase tracking-wider text-white select-none shadow-xs">
                <th className="py-3 px-4 w-[16%]">Employee & Record</th>
                <th className="py-3 px-4 w-[11%]">Coach / Supervisor</th>
                <th className="py-3 px-4 w-[10%]">Coaching Type</th>
                <th className="py-3 px-4 w-[10%] text-center">Performance Gap</th>
                <th className="py-3 px-4 w-[9%]">Coaching Date</th>
                <th className="py-3 px-4 w-[9%]">Target Date</th>
                <th className="py-3 px-4 w-[9%]">Review Date</th>
                <th className="py-3 px-4 w-[11%]">Status</th>
                <th className="py-3 px-4 w-[15%] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {paginatedRecords.length > 0 ? (
                paginatedRecords.map((rec) => {
                  const isReviewOverdue =
                    rec.status !== "Completed" && isPastDate(rec.reviewDate);
                  const isTargetOverdue =
                    rec.status !== "Completed" && isPastDate(rec.targetDate);

                  return (
                    <tr
                      key={rec.id}
                      className="hover:bg-slate-50/70 transition-colors h-[54px]"
                    >
                      {/* Employee Name & Coaching Record ID */}
                      <td className="py-3 px-4">
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
                          <span className="font-mono text-[10px] text-slate-400 leading-none">
                            {rec.id}
                          </span>
                        </div>
                      </td>

                      {/* Coach / Supervisor */}
                      <td
                        className="py-3 px-4 text-slate-700 text-xs truncate"
                        title={rec.coach}
                      >
                        {rec.coach}
                      </td>

                      {/* Coaching Type */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${getTypeBadge(
                            rec.coachingType
                          )}`}
                        >
                          {rec.coachingType}
                        </span>
                      </td>

                      {/* Performance Gap (Compact 'View' Button to save horizontal space) */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setViewingGapRecord(rec)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold text-[#ff5c28] bg-orange-50 hover:bg-orange-100 transition-colors cursor-pointer border border-orange-200/80 shadow-2xs"
                          title="Click to view identified performance gap details"
                        >
                          <Eye size={12} />
                          <span>View Gap</span>
                        </button>
                      </td>

                      {/* Coaching Date */}
                      <td className="py-3 px-4 font-mono text-[11.5px] text-slate-600 whitespace-nowrap">
                        {formatReadableDate(rec.coachingDate)}
                      </td>

                      {/* Target Date with Overdue Indicator */}
                      <td className="py-3 px-4 font-mono text-[11.5px] text-slate-600 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <span>{formatReadableDate(rec.targetDate)}</span>
                          {isTargetOverdue && (
                            <span
                              className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0"
                              title="Target date has passed"
                            />
                          )}
                        </div>
                      </td>

                      {/* Review Date with Overdue Indicator */}
                      <td className="py-3 px-4 font-mono text-[11.5px] text-slate-600 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <span
                            className={
                              isReviewOverdue ? "text-amber-700 font-semibold" : ""
                            }
                          >
                            {formatReadableDate(rec.reviewDate)}
                          </span>
                          {isReviewOverdue && (
                            <span
                              className="px-1 py-0.2 rounded text-[9.5px] font-bold bg-amber-100 text-amber-800"
                              title="Review date reached"
                            >
                              Due
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status + Management Review Flag */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${getStatusBadge(
                              rec.status,
                              rec.needsManagementReview
                            )}`}
                          >
                            {rec.status}
                          </span>
                          {rec.needsManagementReview && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600">
                              <AlertTriangle size={10} />
                              <span>Needs Mgmt Review</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Context-Aware Actions Column formatted exactly per user screenshot */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-3">
                          {/* 1. View button */}
                          <button
                            type="button"
                            onClick={() => setViewingRecord(rec)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-[#042c51] transition-colors cursor-pointer shrink-0"
                            title="View coaching details"
                          >
                            <Eye size={14} className="text-slate-500" />
                            <span>View</span>
                          </button>

                          {/* 2. Status-specific Action Button (rounded-xl pill) */}
                          <div className="w-[142px] flex items-center justify-start">
                            {rec.status === "Scheduled" && (
                              <button
                                type="button"
                                onClick={() => setRecordingSessionRecord(rec)}
                                className="inline-flex items-center justify-center gap-1.5 w-full h-[28px] px-3 rounded-xl text-xs font-bold text-blue-600 bg-blue-50/70 hover:bg-blue-100 transition-colors cursor-pointer border border-blue-200"
                                title="Record completed coaching session"
                              >
                                <PlayCircle size={13} className="shrink-0" />
                                <span>Record Session</span>
                              </button>
                            )}

                            {rec.status === "In Progress" && (
                              <button
                                type="button"
                                onClick={() => {
                                  setFollowingUpRecord(rec);
                                  setFollowUpForm({
                                    actualFollowUpDate: "2026-10-20",
                                    followUpResults: rec.followUp?.followUpResults || "",
                                    improvementStatus: "Improved / Target Met",
                                    supervisorRemarks: rec.followUp?.supervisorRemarks || "",
                                    newReviewDate: "2026-11-03",
                                    closureStatus: "Closed - Resolved",
                                    flagManagementReview: false,
                                  });
                                }}
                                className="inline-flex items-center justify-center gap-1.5 w-full h-[28px] px-3 rounded-xl text-xs font-bold text-purple-600 bg-purple-50/70 hover:bg-purple-100 transition-colors cursor-pointer border border-purple-200"
                                title="Conduct follow-up evaluation"
                              >
                                <FileCheck2 size={13} className="shrink-0" />
                                <span>Follow-Up</span>
                              </button>
                            )}

                            {rec.status === "Pending Follow-Up" && (
                              <button
                                type="button"
                                onClick={() => {
                                  setFollowingUpRecord(rec);
                                  setFollowUpForm({
                                    actualFollowUpDate: "2026-10-20",
                                    followUpResults: rec.followUp?.followUpResults || "",
                                    improvementStatus: rec.needsManagementReview
                                      ? "No Improvement"
                                      : "Improved / Target Met",
                                    supervisorRemarks: rec.followUp?.supervisorRemarks || "",
                                    newReviewDate: "2026-11-03",
                                    closureStatus: rec.needsManagementReview
                                      ? "Needs Management Review"
                                      : "Closed - Resolved",
                                    flagManagementReview: rec.needsManagementReview || false,
                                  });
                                }}
                                className="inline-flex items-center justify-center gap-1.5 w-full h-[28px] px-3 rounded-xl text-xs font-bold text-amber-800 bg-amber-50/70 hover:bg-amber-100 transition-colors cursor-pointer border border-amber-300/80"
                                title="Evaluate coaching review outcome"
                              >
                                <FileCheck2 size={13} className="shrink-0" />
                                <span>Conduct Follow-Up</span>
                              </button>
                            )}

                            {rec.status === "Pending Acknowledgment" && (
                              <button
                                type="button"
                                onClick={() => setViewingRecord(rec)}
                                className="inline-flex items-center justify-center gap-1.5 w-full h-[28px] px-3 rounded-xl text-xs font-bold text-amber-700 bg-amber-50/70 hover:bg-amber-100 transition-colors cursor-pointer border border-amber-200"
                                title="Review and acknowledge session"
                              >
                                <CheckCircle size={13} className="shrink-0" />
                                <span>Acknowledge</span>
                              </button>
                            )}

                            {rec.status === "Overdue" && (
                              <button
                                type="button"
                                onClick={() => {
                                  setFollowingUpRecord(rec);
                                  setFollowUpForm({
                                    actualFollowUpDate: "2026-10-20",
                                    followUpResults: rec.followUp?.followUpResults || "",
                                    improvementStatus: "No Improvement",
                                    supervisorRemarks: rec.followUp?.supervisorRemarks || "",
                                    newReviewDate: "2026-11-03",
                                    closureStatus: "Needs Management Review",
                                    flagManagementReview: true,
                                  });
                                }}
                                className="inline-flex items-center justify-center gap-1.5 w-full h-[28px] px-3 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer border border-rose-300"
                                title="Overdue follow-up requires immediate review"
                              >
                                <AlertCircle size={13} className="shrink-0 text-rose-600" />
                                <span>Overdue Review</span>
                              </button>
                            )}

                            {(rec.status === "Completed" || rec.status === "Closed") && (
                              <button
                                type="button"
                                onClick={() => setViewingRecord(rec)}
                                className="inline-flex items-center justify-center gap-1.5 w-full h-[28px] px-3 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100 transition-colors cursor-pointer border border-emerald-300/80"
                                title="View finalized coaching outcome"
                              >
                                <Award size={13} className="shrink-0" />
                                <span>View Results</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                /* Empty state */
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                        <FileText size={18} />
                      </div>
                      <p className="text-xs font-bold text-slate-700">
                        No coaching records found
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        No FrontSteps sessions match your filter criteria.
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
          itemLabel="coaching sessions"
          className="shrink-0"
        />
      </div>
      ) : (
        /* Requirement #6: Coaching Schedule & Timeline Dedicated View */
        <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs p-4 flex-1 overflow-y-auto sibs-scrollbar">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Calendar size={14} className="text-[#042c51]" />
                <span>FrontSteps Coaching Schedule & Milestone Timeline</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Overview of upcoming touchpoints, overdue action items, and completed sessions.
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
              Reference Date: Oct 20, 2026
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Column 1: Overdue Sessions */}
            <div className="rounded-xl border border-rose-200 bg-rose-50/30 p-3.5 flex flex-col min-h-[300px]">
              <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-rose-100">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-rose-500"></div>
                  <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider">
                    Overdue Sessions
                  </h4>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                  {records.filter((r) => r.status === "Overdue" || (r.status !== "Completed" && r.status !== "Closed" && (isPastDate(r.targetDate) || isPastDate(r.reviewDate)))).length}
                </span>
              </div>

              <div className="space-y-2.5 overflow-y-auto pr-1">
                {records
                  .filter(
                    (r) =>
                      r.status === "Overdue" ||
                      (r.status !== "Completed" &&
                        r.status !== "Closed" &&
                        (isPastDate(r.targetDate) || isPastDate(r.reviewDate)))
                  )
                  .map((rec) => (
                    <div
                      key={rec.id}
                      className="bg-white rounded-lg p-3 border border-rose-200 shadow-2xs hover:shadow-xs transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs truncate">
                          {rec.employeeName}
                        </span>
                        <span className="font-mono text-[10px] text-rose-600 font-bold bg-rose-50 px-1.5 py-0.2 rounded">
                          {rec.id}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                        {rec.performanceGap}
                      </p>
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10.5px]">
                        <span className="text-rose-600 font-bold">
                          Target: {formatReadableDate(rec.targetDate)}
                        </span>
                        <button
                          type="button"
                          onClick={() => setViewingRecord(rec)}
                          className="text-[#042c51] hover:underline font-bold cursor-pointer"
                        >
                          View Details →
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Column 2: Upcoming & Active Touchpoints */}
            <div className="rounded-xl border border-blue-200 bg-blue-50/30 p-3.5 flex flex-col min-h-[300px]">
              <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-blue-100">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                    Upcoming & Active
                  </h4>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                  {records.filter((r) => r.status === "Scheduled" || r.status === "In Progress" || r.status === "Pending Acknowledgment" || r.status === "Pending Follow-Up").length}
                </span>
              </div>

              <div className="space-y-2.5 overflow-y-auto pr-1">
                {records
                  .filter(
                    (r) =>
                      r.status === "Scheduled" ||
                      r.status === "In Progress" ||
                      r.status === "Pending Acknowledgment" ||
                      (r.status === "Pending Follow-Up" && !isPastDate(r.reviewDate))
                  )
                  .map((rec) => (
                    <div
                      key={rec.id}
                      className="bg-white rounded-lg p-3 border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs truncate">
                          {rec.employeeName}
                        </span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${getStatusBadge(rec.status)}`}>
                          {rec.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                        {rec.performanceGap}
                      </p>
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10.5px]">
                        <span className="text-slate-600 font-medium">
                          Coach: <strong>{rec.coach}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => setViewingRecord(rec)}
                          className="text-[#042c51] hover:underline font-bold cursor-pointer"
                        >
                          Inspect →
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Column 3: Completed & Closed Sessions */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-3.5 flex flex-col min-h-[300px]">
              <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-emerald-100">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                  <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                    Completed & Closed
                  </h4>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                  {records.filter((r) => r.status === "Completed" || r.status === "Closed").length}
                </span>
              </div>

              <div className="space-y-2.5 overflow-y-auto pr-1">
                {records
                  .filter((r) => r.status === "Completed" || r.status === "Closed")
                  .map((rec) => (
                    <div
                      key={rec.id}
                      className="bg-white rounded-lg p-3 border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs truncate">
                          {rec.employeeName}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {rec.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                        {rec.performanceGap}
                      </p>
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10.5px]">
                        <span className="text-emerald-700 font-bold">
                          Resolved: {rec.followUp?.closureStatus || "Target Met"}
                        </span>
                        <button
                          type="button"
                          onClick={() => setViewingRecord(rec)}
                          className="text-[#042c51] hover:underline font-bold cursor-pointer"
                        >
                          View Outcome →
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. CREATE COACHING MODAL (Organized into Sections A-D)   */}
      {/* ========================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/25 p-4 sm:p-6 overflow-hidden animate-in fade-in duration-200">
          <div className="relative w-[90vw] max-w-4xl h-[82vh] max-h-[85vh] rounded-2xl bg-white shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 bg-[#042c51] text-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white border border-white/20">
                  <Plus size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {createForm.coachingType === "Scheduled" && createMode === "plan"
                      ? "Schedule Future Coaching Touchpoint"
                      : "Record & Document Coaching Session"}
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    FrontSteps Performance Management Policy (PMP)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-3.5 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors font-bold text-xs cursor-pointer border border-white/15"
              >
                Close
              </button>
            </div>

            {/* Form Body organized into 5 clearly labeled sections */}
            <form
              onSubmit={handleSaveCreateCoaching}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto sibs-scrollbar p-6 space-y-5 text-xs">
                {/* ========================================================= */}
                {/* SECTION 1: Employee Information                           */}
                {/* ========================================================= */}
                <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded-md bg-[#042c51]/10 text-[#042c51] flex items-center justify-center font-bold text-[11px]">
                        1
                      </div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Employee Information
                      </h4>
                    </div>
                    <span className="text-[10.5px] text-slate-400 font-medium">Section 1 of 4</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Employee Name: Searchable Dropdown */}
                    <div className="relative">
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Employee Name <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <div
                          tabIndex={0}
                          onClick={() => setIsEmployeeDropdownOpen(!isEmployeeDropdownOpen)}
                          className={`w-full h-8 px-2.5 rounded-lg border bg-white text-xs flex items-center justify-between cursor-pointer transition-colors ${
                            isEmployeeDropdownOpen
                              ? "border-[#ff5c28] ring-1 ring-[#ff5c28]/20"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <span
                            className={
                              createForm.employeeName
                                ? "font-semibold text-slate-800 truncate"
                                : "text-slate-400"
                            }
                          >
                            {createForm.employeeName || "Select Employee..."}
                          </span>
                          <ChevronDown
                            size={14}
                            className={`text-slate-400 transition-transform shrink-0 ml-1 ${
                              isEmployeeDropdownOpen ? "rotate-180 text-[#ff5c28]" : ""
                            }`}
                          />
                        </div>

                        {/* Searchable dropdown menu */}
                        {isEmployeeDropdownOpen && (
                          <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                            {/* Filter input */}
                            <div className="p-2 border-b border-slate-100 bg-slate-50/70">
                              <div className="relative">
                                <Search
                                  size={12}
                                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                                />
                                <input
                                  type="text"
                                  autoFocus
                                  value={employeeSearchQuery}
                                  onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                                  placeholder="Search employee name or ID..."
                                  className="w-full h-7 pl-7 pr-2.5 rounded-md border border-slate-200 bg-white text-[11px] outline-none focus:border-[#ff5c28]"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                            </div>

                            {/* Dropdown list */}
                            <div className="max-h-48 overflow-y-auto sibs-scrollbar divide-y divide-slate-50">
                              {MOCK_FRONTSTEPS_EMPLOYEES.filter(
                                (emp) =>
                                  emp.name
                                    .toLowerCase()
                                    .includes(employeeSearchQuery.toLowerCase()) ||
                                  emp.employeeId
                                    .toLowerCase()
                                    .includes(employeeSearchQuery.toLowerCase())
                              ).map((emp) => (
                                <button
                                  type="button"
                                  key={emp.employeeId}
                                  onClick={() => {
                                    setCreateForm((prev) => ({
                                      ...prev,
                                      employeeName: emp.name,
                                      employeeId: emp.employeeId,
                                      account: emp.account || "FrontSteps",
                                      coach: emp.supervisor || prev.coach,
                                    }));
                                    setIsEmployeeDropdownOpen(false);
                                    setEmployeeSearchQuery("");
                                  }}
                                  className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-orange-50/70 transition-colors cursor-pointer ${
                                    createForm.employeeId === emp.employeeId
                                      ? "bg-orange-50 text-[#ff5c28] font-bold"
                                      : "text-slate-700"
                                  }`}
                                >
                                  <div>
                                    <div className="text-xs font-semibold">{emp.name}</div>
                                    <div className="text-[10px] text-slate-400 font-mono">
                                      Supervisor: {emp.supervisor}
                                    </div>
                                  </div>
                                  <span className="font-mono text-[10.5px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                                    {emp.employeeId}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Employee ID: Read-Only */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Employee ID
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={createForm.employeeId}
                        placeholder="Auto-populated"
                        className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-mono font-bold text-slate-600 cursor-not-allowed outline-none select-none"
                      />
                    </div>

                    {/* Account: Read-Only */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Account
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={createForm.account || "FrontSteps"}
                        className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 cursor-not-allowed outline-none select-none"
                      />
                    </div>

                    {/* Coach / Supervisor */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Coach / Supervisor <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={createForm.coach}
                        onChange={(e) =>
                          setCreateForm({ ...createForm, coach: e.target.value })
                        }
                        className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#ff5c28] cursor-pointer"
                      >
                        <option value="Sarah Gomez">Sarah Gomez (Team Leader)</option>
                        <option value="Mark Ramos">Mark Ramos (Supervisor)</option>
                        <option value="Alexandria Chua">Alexandria Chua (Operations)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* ========================================================= */}
                {/* SECTION 2: Coaching Details                               */}
                {/* ========================================================= */}
                <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded-md bg-[#042c51]/10 text-[#042c51] flex items-center justify-center font-bold text-[11px]">
                        2
                      </div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Coaching Details
                      </h4>
                    </div>
                    <span className="text-[10.5px] text-slate-400 font-medium">Section 2 of 4</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Coaching Type */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Coaching Type <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={createForm.coachingType}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCreateForm({ ...createForm, coachingType: val });
                          if (val === "Unscheduled") setCreateMode("document");
                        }}
                        className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#ff5c28] cursor-pointer"
                      >
                        <option value="Scheduled">Scheduled (Planned Session)</option>
                        <option value="Unscheduled">Unscheduled (Ad-Hoc / Outlier)</option>
                      </select>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {createForm.coachingType === "Scheduled"
                          ? "Represents a planned forward touchpoint on calendar."
                          : "Represents an immediate ad-hoc or outlier coaching session."}
                      </p>
                    </div>

                    {/* Coaching Date */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        {createForm.coachingType === "Scheduled" ? "Planned Date" : "Actual Coaching Date"}{" "}
                        <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={createForm.coachingDate}
                        onChange={(e) =>
                          setCreateForm({ ...createForm, coachingDate: e.target.value })
                        }
                        className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#ff5c28]"
                      />
                    </div>

                    {/* Coaching Time */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        {createForm.coachingType === "Scheduled" ? "Planned Time" : "Session Time"}
                      </label>
                      <input
                        type="time"
                        value={createForm.coachingTime || "14:00"}
                        onChange={(e) =>
                          setCreateForm({ ...createForm, coachingTime: e.target.value })
                        }
                        className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#ff5c28]"
                      />
                    </div>
                  </div>

                  {/* Scheduled Planning vs Documenting Mode */}
                  {createForm.coachingType === "Scheduled" && (
                    <div className="flex flex-wrap items-center gap-4 pt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <span className="text-[11px] font-bold text-slate-600">
                        Workflow Mode:
                      </span>
                      <label className="inline-flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="createMode"
                          checked={createMode === "plan"}
                          onChange={() => setCreateMode("plan")}
                          className="accent-[#ff5c28]"
                        />
                        <span className="text-xs font-semibold text-slate-700">
                          Plan Future Session (Initial Status: <span className="text-blue-700 font-bold">Scheduled</span>)
                        </span>
                      </label>
                      <label className="inline-flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="createMode"
                          checked={createMode === "document"}
                          onChange={() => setCreateMode("document")}
                          className="accent-[#ff5c28]"
                        />
                        <span className="text-xs font-semibold text-slate-700">
                          Document Completed Session (Initial Status: <span className="text-purple-700 font-bold">In Progress</span>)
                        </span>
                      </label>
                    </div>
                  )}
                </div>

                {/* ========================================================= */}
                {/* SECTION 3: Performance Gap                                */}
                {/* ========================================================= */}
                <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded-md bg-[#042c51]/10 text-[#042c51] flex items-center justify-center font-bold text-[11px]">
                        3
                      </div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Performance Gap
                      </h4>
                    </div>
                    <span className="text-[10.5px] text-slate-400 font-medium">Section 3 of 4</span>
                  </div>

                  {/* Related KPI / Concern Dropdown */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Related KPI / Performance Concern <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={createForm.kpiArea}
                      onChange={(e) => {
                        const selectedKpi = e.target.value;
                        const targets = FRONTSTEPS_KPI_TARGETS[selectedKpi] || {
                          target: "Adhere to FrontSteps standard operating procedures",
                          actualPlaceholder: "Observed operational deviation",
                        };
                        setCreateForm({
                          ...createForm,
                          kpiArea: selectedKpi,
                          requiredTarget: targets.target,
                          actualPerformance: targets.actualPlaceholder,
                        });
                      }}
                      className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#ff5c28] cursor-pointer"
                    >
                      <option value="Cases Closed / Volume">Cases Closed (Volume Benchmark)</option>
                      <option value="QA Score (Quality Assurance)">QA Score (Quality Assurance Calibration)</option>
                      <option value="AHT Compliance (Handling Time)">AHT Compliance (Average Handling Time)</option>
                      <option value="Answer Rate & Telephony Adherence">Answer Rate & Telephony Adherence</option>
                      <option value="Attendance & Punctuality">Attendance & Punctuality</option>
                      <option value="CSAT / Customer Satisfaction">Customer Satisfaction (CSAT)</option>
                      <option value="Data & Subcode Accuracy">Data & Subcode Accuracy (CRM Tagging)</option>
                    </select>
                  </div>

                  {/* Identified Performance Gap */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Identified Performance Gap <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={createForm.performanceGap}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, performanceGap: e.target.value })
                      }
                      placeholder="e.g. Weekly closed case volume at 112 vs 140 benchmark; queue idle time during high volume window..."
                      className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#ff5c28] resize-none"
                    />
                  </div>

                  {/* Read-only Placeholders: Actual Performance vs Required Target */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Actual Performance <span className="text-slate-400 font-normal">(Read-only)</span>
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={createForm.actualPerformance || "112 cases closed (Last audited week)"}
                        className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-mono font-medium text-slate-700 cursor-not-allowed outline-none select-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Required Target <span className="text-slate-400 font-normal">(Read-only)</span>
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={createForm.requiredTarget || "≥ 140 cases / week (Volume Benchmark)"}
                        className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-mono font-bold text-[#ff5c28] cursor-not-allowed outline-none select-none"
                      />
                    </div>
                  </div>

                  {/* Root Cause / Discussion Notes */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Root Cause / Discussion Notes
                      {createForm.coachingType === "Scheduled" && createMode === "plan" && (
                        <span className="text-slate-400 font-normal ml-1">
                          (Optional during session scheduling; complete when session is conducted)
                        </span>
                      )}
                    </label>
                    <textarea
                      rows={2}
                      value={createForm.discussionNotes}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, discussionNotes: e.target.value })
                      }
                      placeholder="Identified root cause from QA calibration, employee feedback, or queue monitoring..."
                      className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#ff5c28] resize-none"
                    />
                  </div>
                </div>

                {/* ========================================================= */}
                {/* SECTION 4: Improvement Action Plan                        */}
                {/* ========================================================= */}
                <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded-md bg-[#042c51]/10 text-[#042c51] flex items-center justify-center font-bold text-[11px]">
                        4
                      </div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Improvement Action Plan
                      </h4>
                    </div>
                    <span className="text-[10.5px] text-slate-400 font-medium">Section 4 of 4</span>
                  </div>

                  {/* Required Improvement Actions */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Required Improvement Actions
                      {createForm.coachingType === "Scheduled" && createMode === "plan" && (
                        <span className="text-slate-400 font-normal ml-1">
                          (Can be refined during the session)
                        </span>
                      )}
                    </label>
                    <textarea
                      rows={2}
                      value={createForm.actions}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, actions: e.target.value })
                      }
                      placeholder="Concrete actions the employee must execute to close the performance gap..."
                      className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#ff5c28] resize-none"
                    />
                  </div>

                  {/* Responsible Person, Target Date, Review Date */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Responsible Person
                      </label>
                      <select
                        value={createForm.responsiblePerson}
                        onChange={(e) =>
                          setCreateForm({ ...createForm, responsiblePerson: e.target.value })
                        }
                        className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#ff5c28] cursor-pointer"
                      >
                        <option value="Employee (Self)">Employee (Self)</option>
                        <option value="Supervisor / Coach">Supervisor / Coach</option>
                        <option value="Joint (Employee & Coach)">Joint (Employee & Coach)</option>
                        <option value="QA Specialist & Lead">QA Specialist & Lead</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Target Completion Date
                      </label>
                      <input
                        type="date"
                        value={createForm.targetDate}
                        onChange={(e) =>
                          setCreateForm({ ...createForm, targetDate: e.target.value })
                        }
                        className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#ff5c28]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Review / Follow-Up Date
                      </label>
                      <input
                        type="date"
                        value={createForm.reviewDate}
                        onChange={(e) =>
                          setCreateForm({ ...createForm, reviewDate: e.target.value })
                        }
                        className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#ff5c28]"
                      />
                    </div>
                  </div>

                  {/* Support Needed & Coaching Commitments */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Support / Assistance Needed
                      </label>
                      <textarea
                        rows={2}
                        value={createForm.supportNeeded}
                        onChange={(e) =>
                          setCreateForm({ ...createForm, supportNeeded: e.target.value })
                        }
                        placeholder="e.g. Peer shadowing, updated macro shortcut cheat sheet, weekly 15m touchpoint..."
                        className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#ff5c28] resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Coaching Commitments
                      </label>
                      <textarea
                        rows={2}
                        value={createForm.coachingCommitments}
                        onChange={(e) =>
                          setCreateForm({ ...createForm, coachingCommitments: e.target.value })
                        }
                        placeholder="Agreed mutual commitments between employee and coach for this performance cycle..."
                        className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#ff5c28] resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer with Cancel & Primary Action Button */}
              <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-slate-100 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#ff5c28] text-white hover:bg-[#e04816] transition-colors font-bold text-xs cursor-pointer shadow-xs"
                >
                  {createForm.coachingType === "Scheduled" && createMode === "plan"
                    ? "Schedule Coaching"
                    : "Save Coaching Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. RECORD SESSION MODAL (For Scheduled Coaching)           */}
      {/* ========================================================= */}
      {recordingSessionRecord && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/25 p-4 sm:p-6 overflow-hidden animate-in fade-in duration-200">
          <div className="relative w-[90vw] max-w-2xl h-auto max-h-[82vh] rounded-2xl bg-white shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 bg-[#042c51] text-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white border border-white/20">
                  <PlayCircle size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Record Conducted Session</h3>
                  <p className="text-[11px] text-slate-300">
                    {recordingSessionRecord.employeeName} ({recordingSessionRecord.id})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRecordingSessionRecord(null)}
                className="px-3.5 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors font-bold text-xs cursor-pointer border border-white/15"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleRecordConductedSession} className="flex-1 flex flex-col p-6 space-y-4 text-xs">
              <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-slate-700">
                <span className="font-bold text-[10px] uppercase text-blue-800 block">Performance Concern</span>
                <p className="font-medium text-xs mt-0.5">{recordingSessionRecord.performanceGap}</p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Session Discussion Notes & Observations *
                </label>
                <textarea
                  rows={3}
                  required
                  defaultValue={recordingSessionRecord.discussionNotes}
                  onChange={(e) =>
                    setRecordingSessionRecord({
                      ...recordingSessionRecord,
                      discussionNotes: e.target.value,
                    })
                  }
                  placeholder="Document specific points discussed and feedback provided..."
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#ff5c28] resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Agreed Action Items *
                </label>
                <textarea
                  rows={2}
                  required
                  defaultValue={recordingSessionRecord.actions}
                  onChange={(e) =>
                    setRecordingSessionRecord({
                      ...recordingSessionRecord,
                      actions: e.target.value,
                    })
                  }
                  placeholder="Actions agent must execute..."
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#ff5c28] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRecordingSessionRecord(null)}
                  className="px-4 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#042c51] text-white hover:bg-[#073966] transition-colors font-bold text-xs cursor-pointer shadow-xs"
                >
                  Complete & Transition to In Progress
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. PERFORMANCE GAP INSPECTION MODAL                       */}
      {/* ========================================================= */}
      {viewingGapRecord && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/25 p-4 sm:p-6 overflow-hidden animate-in fade-in duration-200">
          <div className="relative w-[90vw] max-w-lg h-auto max-h-[82vh] rounded-2xl bg-white shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 bg-[#042c51] text-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white border border-white/20">
                  <Target size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Performance Concern & Gap</h3>
                  <p className="text-[11px] text-slate-300">
                    {viewingGapRecord.employeeName} ({viewingGapRecord.id})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingGapRecord(null)}
                className="px-3.5 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors font-bold text-xs cursor-pointer border border-white/15"
              >
                Close
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-[11px]">
                <div>
                  <span className="text-slate-400 block font-bold uppercase text-[10px]">Employee</span>
                  <span className="font-semibold text-slate-800">{viewingGapRecord.employeeName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold uppercase text-[10px]">Supervisor / Coach</span>
                  <span className="font-semibold text-slate-800">{viewingGapRecord.coach}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold uppercase text-[10px]">Focus Area</span>
                  <span className="font-semibold text-[#042c51]">{viewingGapRecord.kpiArea || "Production Metric"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold uppercase text-[10px]">Coaching Type</span>
                  <span className="font-semibold text-[#ff5c28]">{viewingGapRecord.coachingType}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 font-bold uppercase text-[10.5px] block mb-1">
                  Identified Performance Gap / Shortfall
                </span>
                <div className="p-3.5 rounded-xl border border-rose-100 bg-rose-50/50 text-slate-800 font-medium text-xs leading-relaxed">
                  {viewingGapRecord.performanceGap}
                </div>
              </div>

              {viewingGapRecord.discussionNotes && (
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[10.5px] block mb-1">
                    Discussion Notes & Observations
                  </span>
                  <div className="p-3 rounded-lg border border-slate-200 bg-white text-slate-700 leading-relaxed font-medium">
                    {viewingGapRecord.discussionNotes}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                <span>Target Date: <strong className="text-slate-700">{formatReadableDate(viewingGapRecord.targetDate)}</strong></span>
                <span>Review Date: <strong className="text-slate-700">{formatReadableDate(viewingGapRecord.reviewDate)}</strong></span>
              </div>
            </div>

            <div className="flex items-center justify-end px-6 py-3 border-t border-slate-100 bg-slate-50 shrink-0">
              <button
                type="button"
                onClick={() => setViewingGapRecord(null)}
                className="px-4 py-1.5 rounded-lg bg-[#042c51] text-white hover:bg-[#073966] transition-colors font-bold text-xs cursor-pointer shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. VIEW COACHING MODAL (4 Organized Tabs + Progress Bar)   */}
      {/* ========================================================= */}
      {viewingRecord && (
        <ViewCoachingModal
          record={viewingRecord}
          onClose={() => setViewingRecord(null)}
          onUpdate={handleUpdateRecord}
          onAcknowledge={handleEmployeeAcknowledge}
        />
      )}

      {/* ========================================================= */}
      {/* 5. COACHING FOLLOW-UP EVALUATION MODAL                     */}
      {/* ========================================================= */}
      {followingUpRecord && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/25 p-4 sm:p-6 overflow-hidden animate-in fade-in duration-200">
          <div className="relative w-[90vw] max-w-3xl h-[82vh] max-h-[85vh] rounded-2xl bg-white shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 bg-[#042c51] text-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white border border-white/20">
                  <FileCheck2 size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Coaching Follow-Up Evaluation</h3>
                  <p className="text-[11px] text-slate-300">
                    FrontSteps Performance Management Policy (PMP)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFollowingUpRecord(null)}
                className="px-3.5 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors font-bold text-xs cursor-pointer border border-white/15"
              >
                Close
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveFollowUp} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto sibs-scrollbar p-6 space-y-4 text-xs">
                {/* SECTION A: Original Coaching Summary */}
                <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-4 space-y-2">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60">
                    <span className="font-bold text-slate-700 uppercase text-[11px]">
                      A. Original Coaching Summary
                    </span>
                    <span className="font-mono text-[10.5px] text-slate-500">
                      Record: {followingUpRecord.id}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Employee</span>
                      <span className="font-semibold text-slate-800">{followingUpRecord.employeeName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Coached Date</span>
                      <span className="font-mono text-slate-700">{formatReadableDate(followingUpRecord.coachingDate)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Target Date</span>
                      <span className="font-mono text-slate-700">{formatReadableDate(followingUpRecord.targetDate)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Review Date</span>
                      <span className="font-mono text-slate-700">{formatReadableDate(followingUpRecord.reviewDate)}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 mt-1">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Original Gap & Agreed Actions:</span>
                    <p className="font-semibold text-slate-800 text-xs mt-0.5">{followingUpRecord.performanceGap}</p>
                    <p className="text-slate-600 text-[11.5px] mt-1 italic">{followingUpRecord.actions}</p>
                  </div>
                </div>

                {/* SECTION B: Follow-Up Evaluation */}
                <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3">
                  <h4 className="font-bold text-slate-700 uppercase text-[11px] pb-1.5 border-b border-slate-100">
                    B. Follow-Up Evaluation & Observations
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Actual Follow-Up Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={followUpForm.actualFollowUpDate}
                        onChange={(e) =>
                          setFollowUpForm({ ...followUpForm, actualFollowUpDate: e.target.value })
                        }
                        className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#ff5c28]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Observed Improvement Status *
                      </label>
                      <select
                        value={followUpForm.improvementStatus}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFollowUpForm({
                            ...followUpForm,
                            improvementStatus: val,
                            flagManagementReview: val === "No Improvement",
                            closureStatus:
                              val === "Improved / Target Met"
                                ? "Closed - Resolved"
                                : val === "Partial Improvement"
                                ? "Extended Monitoring"
                                : "Needs Management Review",
                          });
                        }}
                        className="w-full h-8 px-2.5 rounded-lg border-2 border-[#ff5c28] bg-white text-xs font-bold text-slate-800 outline-none"
                      >
                        <option value="Improved / Target Met">1. Improved / Target Met (Recommend Closure)</option>
                        <option value="Partial Improvement">2. Partial Improvement (Continue Monitoring)</option>
                        <option value="No Improvement">3. No Improvement (Flag for Management Review)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Observed Performance Results & Metrics *
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={followUpForm.followUpResults}
                      onChange={(e) =>
                        setFollowUpForm({ ...followUpForm, followUpResults: e.target.value })
                      }
                      placeholder="e.g. Throughput rose to 142 cases/week; QA accuracy verified at 96%."
                      className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#ff5c28] resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Supervisor Remarks & Recommendations
                    </label>
                    <textarea
                      rows={2}
                      value={followUpForm.supervisorRemarks}
                      onChange={(e) =>
                        setFollowUpForm({ ...followUpForm, supervisorRemarks: e.target.value })
                      }
                      placeholder="Leadership feedback, recognition, or rationale for continuation..."
                      className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#ff5c28] resize-none"
                    />
                  </div>
                </div>

                {/* SECTION C & D: Outcome & Closure Next Steps */}
                <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3">
                  <h4 className="font-bold text-slate-700 uppercase text-[11px] pb-1.5 border-b border-slate-100">
                    C & D. Follow-Up Outcome & Closure Decision
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Proposed Outcome & Closure Action
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={followUpForm.closureStatus}
                        className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 font-semibold text-slate-800 text-xs outline-none"
                      />
                    </div>

                    {followUpForm.improvementStatus === "Partial Improvement" ? (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                          Next Review Date (Extended Monitoring) *
                        </label>
                        <input
                          type="date"
                          required
                          value={followUpForm.newReviewDate}
                          onChange={(e) =>
                            setFollowUpForm({ ...followUpForm, newReviewDate: e.target.value })
                          }
                          className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#ff5c28]"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                          Management Review Flag
                        </label>
                        <div className="h-8 px-2.5 flex items-center rounded-lg border border-slate-200 bg-slate-50 text-xs">
                          {followUpForm.flagManagementReview ? (
                            <span className="font-bold text-rose-600 flex items-center gap-1">
                              <AlertTriangle size={12} />
                              Flagged for Management Review
                            </span>
                          ) : (
                            <span className="text-slate-500">Standard Coaching Lifecycle</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-slate-100 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => setFollowingUpRecord(null)}
                  className="px-4 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#042c51] text-white hover:bg-[#073966] transition-colors font-bold text-xs cursor-pointer shadow-xs"
                >
                  Save Follow-Up Outcome
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// VIEW COACHING MODAL (4 Organized Tabs + Compact Workflow Stage Indicator)
// =========================================================================
function ViewCoachingModal({ record, onClose, onUpdate, onAcknowledge }) {
  const [activeTab, setActiveTab] = useState("details");
  const [isEditing, setIsEditing] = useState(false);
  const [ackComment, setAckComment] = useState("");
  const [editForm, setEditForm] = useState({
    coachingType: record.coachingType,
    coach: record.coach,
    coachingDate: record.coachingDate,
    targetDate: record.targetDate,
    reviewDate: record.reviewDate,
    performanceGap: record.performanceGap,
    discussionNotes: record.discussionNotes,
    actions: record.actions,
    responsiblePerson: record.responsiblePerson,
  });

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (onUpdate) {
      onUpdate({
        ...record,
        ...editForm,
      });
    }
    setIsEditing(false);
  };

  // Workflow progress stages
  const STAGES = ["Scheduled", "Pending Acknowledgment", "In Progress", "Pending Follow-Up", "Completed", "Closed"];
  const currentStageIndex = Math.max(
    0,
    record.status === "Overdue" ? STAGES.indexOf("In Progress") : STAGES.indexOf(record.status)
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/25 p-4 sm:p-6 overflow-hidden animate-in fade-in duration-200">
      <div className="relative w-[90vw] max-w-5xl h-[82vh] max-h-[85vh] rounded-2xl bg-white shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 bg-[#042c51] text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white border border-white/20">
              <User size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  {record.employeeName}
                </h3>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-white/15 text-slate-100">
                  {record.employeeId}
                </span>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-white/10 text-slate-300">
                  {record.id}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-white border border-white/25">
                  {record.status}
                </span>
                {record.needsManagementReview && (
                  <span className="px-2 py-0.5 rounded bg-rose-500 text-white text-[10.5px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <AlertTriangle size={10} />
                    Needs Review
                  </span>
                )}
                {isEditing && (
                  <span className="px-2 py-0.5 rounded bg-[#ff5c28] text-white text-[10.5px] font-bold uppercase tracking-wider">
                    Edit Mode
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-2">
                <span>Account: <strong className="text-white font-medium">{record.account}</strong></span>
                <span>•</span>
                <span>Coach: <strong className="text-white font-medium">{record.coach}</strong></span>
                <span>•</span>
                <span>Coaching Date: <strong className="text-white font-medium">{formatReadableDate(record.coachingDate)}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ff5c28] text-white hover:bg-[#e04816] transition-colors font-bold text-xs cursor-pointer shadow-xs"
                title="Edit this coaching session"
              >
                <Edit3 size={13} />
                <span>Edit Record</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors font-bold text-xs cursor-pointer border border-white/15"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors font-bold text-xs cursor-pointer shadow-xs"
                >
                  <Save size={13} />
                  <span>Save Changes</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors font-bold text-xs cursor-pointer border border-white/15"
            >
              Close
            </button>
          </div>
        </div>

        {/* Compact Workflow Stage Progress Bar */}
        <div className="px-6 py-2 bg-slate-50 border-b border-slate-200/70 shrink-0">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {STAGES.map((stg, idx) => {
              const isPast = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;
              return (
                <div key={stg} className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isCurrent
                          ? "bg-[#ff5c28] text-white ring-2 ring-[#ff5c28]/30"
                          : isPast
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {isPast ? "✓" : idx + 1}
                    </span>
                    <span
                      className={`text-[11px] font-bold ${
                        isCurrent
                          ? "text-[#ff5c28]"
                          : isPast
                          ? "text-emerald-700"
                          : "text-slate-400"
                      }`}
                    >
                      {stg}
                    </span>
                  </div>
                  {idx < STAGES.length - 1 && (
                    <div
                      className={`w-8 sm:w-14 h-0.5 ${
                        idx < currentStageIndex ? "bg-emerald-500" : "bg-slate-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 4 Tabs Bar */}
        <div className="px-6 border-b border-slate-200/80 bg-white shrink-0 flex items-center gap-1 pt-2">
          {[
            { id: "details", label: "Coaching Details" },
            { id: "actionPlan", label: "Action Plan" },
            { id: "acknowledgment", label: "Acknowledgment" },
            { id: "evidence", label: "Supporting Evidence" },
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

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto sibs-scrollbar p-6 bg-slate-50/40 text-xs">
          {/* TAB 1: COACHING DETAILS */}
          {activeTab === "details" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Session Background & General Information
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-500">Status:</span>
                    <span className="font-bold text-[#042c51]">{record.status}</span>
                  </div>
                </div>

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
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Assigned Coach</span>
                    {isEditing ? (
                      <select
                        value={editForm.coach}
                        onChange={(e) => setEditForm({ ...editForm, coach: e.target.value })}
                        className="mt-1 w-full h-8 px-2 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#ff5c28]"
                      >
                        <option value="Sarah Gomez">Sarah Gomez</option>
                        <option value="Mark Ramos">Mark Ramos</option>
                        <option value="Alexandria Chua">Alexandria Chua</option>
                      </select>
                    ) : (
                      <span className="font-semibold text-slate-800 text-xs block mt-1">{record.coach}</span>
                    )}
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Coaching Type</span>
                    {isEditing ? (
                      <select
                        value={editForm.coachingType}
                        onChange={(e) => setEditForm({ ...editForm, coachingType: e.target.value })}
                        className="mt-1 w-full h-8 px-2 rounded-lg border-2 border-[#ff5c28] bg-orange-50/40 text-xs font-bold text-slate-800 outline-none"
                      >
                        <option value="Scheduled">Scheduled</option>
                        <option value="Unscheduled">Unscheduled</option>
                      </select>
                    ) : (
                      <span className="font-semibold text-[#ff5c28] text-xs block mt-1">
                        {record.coachingType}
                      </span>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-500 uppercase mb-1">
                        Coaching Date
                      </label>
                      <input
                        type="date"
                        value={editForm.coachingDate}
                        onChange={(e) => setEditForm({ ...editForm, coachingDate: e.target.value })}
                        className="w-full h-8 px-2 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#ff5c28]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-500 uppercase mb-1">
                        Target Date
                      </label>
                      <input
                        type="date"
                        value={editForm.targetDate}
                        onChange={(e) => setEditForm({ ...editForm, targetDate: e.target.value })}
                        className="w-full h-8 px-2 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#ff5c28]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-500 uppercase mb-1">
                        Review Date
                      </label>
                      <input
                        type="date"
                        value={editForm.reviewDate}
                        onChange={(e) => setEditForm({ ...editForm, reviewDate: e.target.value })}
                        className="w-full h-8 px-2 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#ff5c28]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Performance Gap Card */}
              <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100">
                  Identified Performance Concern / Gap
                </h4>
                {isEditing ? (
                  <textarea
                    rows={2}
                    value={editForm.performanceGap}
                    onChange={(e) => setEditForm({ ...editForm, performanceGap: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 outline-none focus:border-[#ff5c28]"
                  />
                ) : (
                  <p className="text-xs text-slate-700 leading-relaxed font-semibold bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {record.performanceGap}
                  </p>
                )}
              </div>

              {/* Discussion Notes Card */}
              <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100">
                  Coaching Discussion Notes & Observations
                </h4>
                {isEditing ? (
                  <textarea
                    rows={2}
                    value={editForm.discussionNotes}
                    onChange={(e) => setEditForm({ ...editForm, discussionNotes: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 outline-none focus:border-[#ff5c28]"
                  />
                ) : (
                  <p className="text-xs text-slate-700 leading-relaxed font-medium bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {record.discussionNotes || "No specific discussion notes documented."}
                  </p>
                )}
              </div>

              {/* If follow up exists */}
              {record.followUp && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-2">
                  <div className="flex items-center justify-between pb-1.5 border-b border-emerald-100">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                      Follow-Up Outcome: {record.followUp.closureStatus}
                    </span>
                    <span className="font-mono text-[11px] text-emerald-700">
                      Evaluated: {formatReadableDate(record.followUp.actualFollowUpDate)}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-900 font-medium">
                    {record.followUp.followUpResults}
                  </p>
                  <p className="text-[11px] text-emerald-800 italic mt-1">
                    Supervisor Note: {record.followUp.supervisorRemarks}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ACTION PLAN */}
          {activeTab === "actionPlan" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100">
                  Structured Performance Action Plan
                </h4>

                <div>
                  <span className="block text-[10.5px] font-bold text-slate-400 uppercase mb-1">
                    Required Improvement Actions
                  </span>
                  {isEditing ? (
                    <textarea
                      rows={3}
                      value={editForm.actions}
                      onChange={(e) => setEditForm({ ...editForm, actions: e.target.value })}
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 outline-none focus:border-[#ff5c28]"
                    />
                  ) : (
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs font-medium text-slate-700 leading-relaxed">
                      {record.actions}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">
                      Responsible Person
                    </span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.responsiblePerson}
                        onChange={(e) =>
                          setEditForm({ ...editForm, responsiblePerson: e.target.value })
                        }
                        className="mt-1 w-full h-7 px-2 rounded border border-slate-200 text-xs font-medium"
                      />
                    ) : (
                      <span className="font-semibold text-slate-800">{record.responsiblePerson}</span>
                    )}
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">
                      Target Completion Date
                    </span>
                    <span className="font-mono font-semibold text-slate-800">
                      {formatReadableDate(record.targetDate)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">
                      Review / Follow-Up Date
                    </span>
                    <span className="font-mono font-semibold text-slate-800">
                      {formatReadableDate(record.reviewDate)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ACKNOWLEDGMENT (With Functional Mock Interaction) */}
          {activeTab === "acknowledgment" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Employee Acknowledgment & Feedback
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Receipt & review of the coaching record (does not denote fault admission).
                    </p>
                  </div>
                  <span
                    className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                      record.acknowledgment.isAcknowledged
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {record.acknowledgment.isAcknowledged
                      ? "Acknowledged"
                      : "Pending Acknowledgment"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="block text-[10.5px] font-bold text-slate-400 uppercase">
                      Acknowledgment Timestamp
                    </span>
                    <span className="font-mono font-semibold text-slate-800">
                      {record.acknowledgment.acknowledgedDate || "Not Yet Acknowledged"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10.5px] font-bold text-slate-400 uppercase">
                      Signoff Record ID
                    </span>
                    <span className="font-mono text-slate-600">
                      {record.acknowledgment.isAcknowledged ? `ACK-${record.id}` : "Pending"}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="block text-[10.5px] font-bold text-slate-400 uppercase mb-1">
                    Documented Employee Comments & Notes
                  </span>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs font-medium text-slate-700 italic">
                    {record.acknowledgment.employeeComments ||
                      "No employee comments submitted yet."}
                  </div>
                </div>

                {/* Demonstration Employee Acknowledgment Action */}
                {!record.acknowledgment.isAcknowledged && (
                  <div className="mt-4 p-4 rounded-xl border border-dashed border-[#ff5c28]/40 bg-orange-50/30 space-y-2.5">
                    <span className="text-xs font-bold text-slate-800 block">
                      Demonstration Action: Submit Employee Acknowledgment
                    </span>
                    <textarea
                      rows={2}
                      value={ackComment}
                      onChange={(e) => setAckComment(e.target.value)}
                      placeholder="Enter employee acknowledgment reflection or commitments..."
                      className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#ff5c28] resize-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        onAcknowledge(record.id, ackComment);
                        setAckComment("");
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-[#ff5c28] text-white hover:bg-[#e04816] transition-colors font-bold text-xs cursor-pointer shadow-xs"
                    >
                      Sign & Acknowledge Coaching Record
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: SUPPORTING EVIDENCE */}
          {activeTab === "evidence" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Attached Supporting Evidence & Call Records
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Available demonstration performance audit attachments.
                    </p>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {record.supportingEvidence.length} files attached
                  </span>
                </div>

                <div className="space-y-2">
                  {record.supportingEvidence.map((file, fIdx) => (
                    <div
                      key={fIdx}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-200/80 bg-slate-50/70 hover:bg-slate-100/80 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-[#042c51]/10 flex items-center justify-center text-[#042c51]">
                          <FileText size={16} />
                        </div>
                        <div>
                          <span className="font-semibold text-slate-800 text-xs block">
                            {file.name}
                          </span>
                          <span className="text-[10.5px] text-slate-400 font-mono">
                            {file.size} • {file.type || "Document"} • Attached{" "}
                            {formatReadableDate(file.date)}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          alert(`Previewing demonstration file: ${file.name}`)
                        }
                        className="text-xs font-bold text-[#ff5c28] hover:underline cursor-pointer px-2.5 py-1 rounded bg-white border border-slate-200 shadow-2xs"
                      >
                        Preview Attachment
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
