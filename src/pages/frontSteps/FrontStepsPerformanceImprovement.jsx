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
  FileText,
  User,
  ShieldCheck,
  ChevronRight,
  Target,
  Edit3,
  Save,
  ArrowRight,
  AlertTriangle,
  PlayCircle,
  Award,
  ChevronDown,
  XCircle,
  HelpCircle,
  Check,
  Activity,
  History,
  TrendingUp,
  Bell,
  ListFilter,
} from "lucide-react";
import SingleSelectDropdown from "../../components/common/filters/SingleSelectDropdown";
import TablePagination from "../../components/common/tables/TablePagination";
import DatePicker from "../../components/common/filters/DatePicker";

// Mock demonstration data representing FrontSteps Performance Improvement Records (PIPs)
// Adheres strictly to Requirement #12, #1, #2, #8, #9, #10 & FrontSteps PMP Policy Context
const INITIAL_PIP_RECORDS = [
  {
    id: "PIP-FS-001",
    employeeId: "FS-1004",
    employeeName: "Beatrice Anne Santos",
    account: "FrontSteps",
    supervisor: "Sarah Gomez",
    reportingPeriod: "October 2026",
    performanceConcern: "Persistent Cases Closed Volume Deficit (<85 benchmark across 2 consecutive cycles)",
    kpiArea: "Cases Closed / Volume",
    validatedKpiScore: 81.6,
    performanceRating: "Unsatisfactory",
    referralDate: "2026-10-14",
    pipStartDate: "2026-10-18",
    targetEndDate: "2026-11-17",
    status: "Active", // Formal PIP Stage
    referralJustification: "Despite coaching sessions on triage shortcuts, weekly volume remains below 115 cases against the 140 standard.",
    linkedCoachingRecords: [
      { id: "COACH-FS-001", date: "2026-10-14", gap: "Cases Closed (Weekly volume at 112 vs 140 target)", outcome: "Partial - Needs PIP consideration" },
    ],
    improvementPlan: {
      specificTargets: "Attain and sustain ≥ 135 closed cases/week with QA accuracy ≥ 95%.",
      requiredActions: "Daily triage shadowing for 30 minutes; implement two-monitor queuing; weekly review with TL.",
      responsiblePerson: "Beatrice Anne Santos (Agent) / Sarah Gomez (TL)",
      weeklySchedule: "Week 1: Macro mastery; Week 2: Queue triage; Week 3: Independent pacing; Week 4: Final audit.",
      supportNeeded: "Dual-monitor workstation setup, macro shortcut cheat-sheet, lead-agent buddying.",
    },
    managementReview: {
      reviewer: "Alexandria Chua (Operations Manager)",
      reviewDate: "2026-10-17",
      decision: "Approved",
      remarks: "Authorized formal 30-day PIP to provide structured recovery support before Month 12 evaluation.",
    },
    checkpoints: [
      {
        weekNumber: 1,
        date: "2026-10-25",
        results: "Volume improved to 124 cases closed; macro usage at 90%.",
        progress: "Improvement Ongoing",
        supervisorAssessment: "Positive engagement observed in triage shadowing.",
        employeeComments: "Dual-monitor setup helped significantly reduce ticket lookup lag.",
      },
      {
        weekNumber: 2,
        date: "2026-11-01",
        results: "Volume reached 131 cases closed; QA remained high at 96.5%.",
        progress: "Improvement Ongoing",
        supervisorAssessment: "Pacing is approaching the required 135 weekly milestone.",
        employeeComments: "Comfortable with macro shortcuts now.",
      },
    ],
    finalEvaluation: null,
    supportingEvidence: [
      { name: "Week_41_Queue_Output_Audit.xlsx", size: "48 KB", date: "2026-10-14", type: "Excel Sheet" },
      { name: "Cases_Triage_Shortcuts_Guide.pdf", size: "1.2 MB", date: "2026-10-14", type: "PDF Guide" },
    ],
    acknowledgment: {
      isAcknowledged: true,
      acknowledgedDate: "2026-10-18 10:15",
      employeeComments: "I acknowledge receipt of this formal 30-day improvement plan and will work with TL Sarah on queue pacing.",
    },
  },
  {
    id: "PIP-FS-002",
    employeeId: "FS-1007",
    employeeName: "Gabriel Joshua Tan",
    account: "FrontSteps",
    supervisor: "Alexandria Chua",
    reportingPeriod: "October 2026",
    performanceConcern: "AHT Compliance Outlier & Unverified Hold Time (>1,100s average vs ≤900s standard)",
    kpiArea: "AHT Compliance",
    validatedKpiScore: 79.3,
    performanceRating: "Unsatisfactory",
    referralDate: "2026-10-18",
    pipStartDate: "—",
    targetEndDate: "—",
    status: "Pending Review", // Referral Stage
    referralJustification: "Agent repeatedly stays on open lines during customer modem resets without following structured gate hardware triage.",
    linkedCoachingRecords: [
      { id: "COACH-FS-002", date: "2026-10-12", gap: "AHT Outlier on escalation tickets (Average 1,120s vs ≤900s)", outcome: "No Improvement - Hold times persisted" },
    ],
    improvementPlan: {
      specificTargets: "Reduce average call handling time to ≤ 900 seconds while retaining CSAT ≥ 90%.",
      requiredActions: "Apply 3-step probing checklist; enforce 2-minute max unverified hold times.",
      responsiblePerson: "Gabriel Joshua Tan (Agent) / Alexandria Chua (OM)",
      weeklySchedule: "Weekly audio-audit calibrations with QA and supervisor.",
      supportNeeded: "Gateway diagnostic quick-reference card.",
    },
    managementReview: {
      reviewer: "Pending Management Reviewer Assignment",
      reviewDate: "—",
      decision: "Pending",
      remarks: "Awaiting Ops Director / HR review for formal PIP authorization.",
    },
    checkpoints: [],
    finalEvaluation: null,
    supportingEvidence: [
      { name: "Call_ID_882914_Audit_Notes.pdf", size: "310 KB", date: "2026-10-12", type: "PDF Audit" },
      { name: "AHT_Distribution_Outlier_Log.xlsx", size: "64 KB", date: "2026-10-18", type: "Excel Log" },
    ],
    acknowledgment: {
      isAcknowledged: false,
      acknowledgedDate: null,
      employeeComments: "",
    },
  },
  {
    id: "PIP-FS-003",
    employeeId: "FS-1011",
    employeeName: "Patrick Sean Reyes",
    account: "FrontSteps",
    supervisor: "Sarah Gomez",
    reportingPeriod: "September 2026",
    performanceConcern: "Repeated Cases Closed Throughput Discrepancy (Sub-80% output benchmark)",
    kpiArea: "Cases Closed / Volume",
    validatedKpiScore: 78.4,
    performanceRating: "Unsatisfactory",
    referralDate: "2026-09-29",
    pipStartDate: "2026-10-02",
    targetEndDate: "2026-10-31",
    status: "Under Final Review", // Formal PIP Stage
    referralJustification: "Volume remained persistently at 95 closed cases despite two rounds of peer shadowing.",
    linkedCoachingRecords: [
      { id: "COACH-FS-008", date: "2026-09-28", gap: "Cases Closed Throughput (95 vs 140 benchmark)", outcome: "Referred for Management Review" },
    ],
    improvementPlan: {
      specificTargets: "Progressive volume escalation: 110 cases in W1, 125 in W2, 140 in W4.",
      requiredActions: "Dedicated lead shadowing, bi-weekly audit of open work queues.",
      responsiblePerson: "Patrick Sean Reyes (Agent) / Sarah Gomez (TL)",
      weeklySchedule: "Weekly formal touchpoints on Fridays at 16:00.",
      supportNeeded: "Lead agent buddying and macro library reload.",
    },
    managementReview: {
      reviewer: "Alexandria Chua (Operations Manager)",
      reviewDate: "2026-10-01",
      decision: "Approved",
      remarks: "Authorized formal 30-day PIP.",
    },
    checkpoints: [
      {
        weekNumber: 1,
        date: "2026-10-09",
        results: "Volume reached 112 cases closed.",
        progress: "Improvement Ongoing",
        supervisorAssessment: "Showed initial effort in morning queue triage.",
        employeeComments: "Working on faster classification.",
      },
      {
        weekNumber: 2,
        date: "2026-10-16",
        results: "Volume reached 128 cases closed.",
        progress: "Improvement Ongoing",
        supervisorAssessment: "Good pace acceleration.",
        employeeComments: "Macros helped reduce typing delays.",
      },
      {
        weekNumber: 3,
        date: "2026-10-23",
        results: "Volume reached 139 cases closed.",
        progress: "Improvement Achieved",
        supervisorAssessment: "Virtually at benchmark. Quality maintained at 97%.",
        employeeComments: "Pacing feels consistent now.",
      },
    ],
    finalEvaluation: {
      evaluationDate: "2026-10-31",
      overallResults: "Weekly volume stabilized at 141 cases with 98% resolution accuracy.",
      recommendation: "Improvement Achieved",
      managementOutcome: "Successful PIP Completion. Close formal intervention.",
      closureStatus: "Closed - Resolved",
      closureDate: "2026-10-31",
    },
    supportingEvidence: [
      { name: "September_Throughput_Audit.xlsx", size: "44 KB", date: "2026-09-29", type: "Excel Log" },
      { name: "Week_4_Final_Volume_Report.pdf", size: "180 KB", date: "2026-10-30", type: "PDF Audit" },
    ],
    acknowledgment: {
      isAcknowledged: true,
      acknowledgedDate: "2026-10-02 09:30",
      employeeComments: "Understood all expectations. Committed to hitting targets.",
    },
  },
  {
    id: "PIP-FS-004",
    employeeId: "FS-1003",
    employeeName: "Carlos Miguel Mendoza",
    account: "FrontSteps",
    supervisor: "Mark Ramos",
    reportingPeriod: "September 2026",
    performanceConcern: "AHT Escalation Deficit on Complex HOA Billing Complaints",
    kpiArea: "AHT Compliance",
    validatedKpiScore: 82.1,
    performanceRating: "Unsatisfactory",
    referralDate: "2026-09-15",
    pipStartDate: "2026-09-18",
    targetEndDate: "2026-10-18",
    status: "Closed", // Formal PIP Stage
    referralJustification: "Billing calls required extensive supervisor conference hold times exceeding policy allowances.",
    linkedCoachingRecords: [
      { id: "COACH-FS-005", date: "2026-09-14", gap: "AHT Compliance on Billing (74.2% vs ≥80%)", outcome: "Resolved via dedicated coaching & PIP" },
    ],
    improvementPlan: {
      specificTargets: "AHT Compliance ≥ 80% on billing ticket queues within 30 days.",
      requiredActions: "Utilize updated HOA dues escalation ledger; apply warm transfers promptly.",
      responsiblePerson: "Carlos Miguel Mendoza (Agent) / Mark Ramos (Supervisor)",
      weeklySchedule: "Audit 5 calls weekly for post-call processing wrap efficiency.",
      supportNeeded: "Billing lookup shortcut table.",
    },
    managementReview: {
      reviewer: "Mark Ramos (Supervisor) / Alexandria Chua (OM)",
      reviewDate: "2026-09-17",
      decision: "Approved",
      remarks: "Approved to provide clear wrap-up guidance.",
    },
    checkpoints: [
      {
        weekNumber: 2,
        date: "2026-10-02",
        results: "AHT compliance reached 83.5% across 45 audited interactions.",
        progress: "Improvement Achieved",
        supervisorAssessment: "Excellent turnaround in call wrap discipline.",
        employeeComments: "Ledger shortcut made finding HOA account numbers immediate.",
      },
    ],
    finalEvaluation: {
      evaluationDate: "2026-10-18",
      overallResults: "AHT compliance sustained at 84.8% over full 30-day window. Customer CSAT at 94%.",
      recommendation: "Improvement Achieved",
      managementOutcome: "Target sustained. Employee returned to standard coaching lifecycle.",
      closureStatus: "Closed - Resolved",
      closureDate: "2026-10-18",
    },
    supportingEvidence: [
      { name: "HOA_Billing_Audit_W38.pdf", size: "290 KB", date: "2026-09-15", type: "PDF Audit" },
      { name: "Closure_Signoff_Oct18.pdf", size: "115 KB", date: "2026-10-18", type: "Signoff Doc" },
    ],
    acknowledgment: {
      isAcknowledged: true,
      acknowledgedDate: "2026-09-18 14:00",
      employeeComments: "Understood and agreed. Will wrap calls on time.",
    },
  },
  {
    id: "PIP-FS-005",
    employeeId: "FS-1009",
    employeeName: "Lance Christian Lim",
    account: "FrontSteps",
    supervisor: "Mark Ramos",
    reportingPeriod: "October 2026",
    performanceConcern: "Aux Downtime & Schedule Adherence Discrepancies (<80% adherence)",
    kpiArea: "Attendance & Adherence",
    validatedKpiScore: 76.5,
    performanceRating: "Unsatisfactory",
    referralDate: "2026-10-19",
    pipStartDate: "—",
    targetEndDate: "—",
    status: "Additional Information Required", // Referral Stage
    referralJustification: "Repeated aux-4 overages exceeding 25 minutes on afternoon shifts.",
    linkedCoachingRecords: [
      { id: "COACH-FS-004", date: "2026-10-16", gap: "Aux 4 exceeds 20m threshold", outcome: "Pending further review" },
    ],
    improvementPlan: {
      specificTargets: "Strict adherence to 15m break windows; overall schedule adherence ≥ 95%.",
      requiredActions: "Sync workstation desktop timer; notify lead prior to aux toggle.",
      responsiblePerson: "Lance Christian Lim (Agent)",
      weeklySchedule: "Daily telephony aux audit.",
      supportNeeded: "Workstation notification sync.",
    },
    managementReview: {
      reviewer: "Alexandria Chua (Operations Manager)",
      reviewDate: "2026-10-20",
      decision: "Returned for Additional Information",
      remarks: "Requested telephony telecom vendor logs to verify if system network lag contributed to aux recording errors.",
    },
    checkpoints: [],
    finalEvaluation: null,
    supportingEvidence: [
      { name: "Avaya_Telephony_Log_W42.xlsx", size: "82 KB", date: "2026-10-19", type: "Excel Log" },
    ],
    acknowledgment: {
      isAcknowledged: false,
      acknowledgedDate: null,
      employeeComments: "",
    },
  },
  {
    id: "PIP-FS-006",
    employeeId: "FS-1011",
    employeeName: "Patrick Sean Reyes",
    account: "FrontSteps",
    supervisor: "Sarah Gomez",
    reportingPeriod: "September 2026",
    performanceConcern: "Cases Closed Throughput Deficit across successive quarters",
    kpiArea: "Cases Closed / Volume",
    validatedKpiScore: 78.4,
    performanceRating: "Unsatisfactory",
    referralDate: "2026-09-05",
    pipStartDate: "2026-09-10",
    targetEndDate: "2026-10-24", // Extended window
    status: "Extended",
    referralJustification: "Throughput metrics remained in lower quartile after initial 30 days. Management approved 14-day extension for coaching consolidation.",
    linkedCoachingRecords: [
      { id: "COACH-FS-008", date: "2026-09-28", gap: "Throughput shortfall", outcome: "Partial - Approved Extension" },
    ],
    improvementPlan: {
      specificTargets: "Close ≥ 125 cases weekly during extended monitoring period.",
      requiredActions: "Complete refresher ticketing triage; pair with Senior Support Engineer.",
      responsiblePerson: "Patrick Sean Reyes (Agent) / Sarah Gomez (TL)",
      weeklySchedule: "Week 1-4 completed; Extended Week 5-6 active.",
      supportNeeded: "Senior agent shadowing.",
    },
    managementReview: {
      reviewer: "Alexandria Chua (Operations Manager)",
      reviewDate: "2026-10-10",
      decision: "Approved Extension",
      remarks: "Granted 14-day extension based on partial queue recovery observed in Week 4.",
    },
    checkpoints: [
      {
        weekNumber: 4,
        date: "2026-10-08",
        results: "Throughput increased to 118 cases; queue discipline stabilized.",
        progress: "Partial Improvement",
        supervisorAssessment: "Demonstrating steady progression.",
        employeeComments: "Understood targets. Appreciate additional time to consolidate pacing.",
      },
    ],
    finalEvaluation: null,
    supportingEvidence: [
      { name: "Extension_Approval_Memo.pdf", size: "95 KB", date: "2026-10-10", type: "PDF Memo" },
    ],
    acknowledgment: {
      isAcknowledged: true,
      acknowledgedDate: "2026-09-10 11:00",
      employeeComments: "Acknowledged PIP extension terms.",
    },
  },
  {
    id: "PIP-FS-007",
    employeeId: "FS-1012",
    employeeName: "Mark Anthony Villanueva",
    account: "FrontSteps",
    supervisor: "Alexandria Chua",
    reportingPeriod: "August 2026",
    performanceConcern: "Chronic Schedule Adherence & QA Calibration Shortfall (<70%)",
    kpiArea: "QA Score & Adherence",
    validatedKpiScore: 68.2,
    performanceRating: "Unsatisfactory",
    referralDate: "2026-08-15",
    pipStartDate: "2026-08-20",
    targetEndDate: "2026-09-19",
    status: "Unsuccessful",
    referralJustification: "Multiple unexcused adherence lapses during PIP period with unclosed performance gaps.",
    linkedCoachingRecords: [],
    improvementPlan: {
      specificTargets: "Attain QA score ≥ 90% and schedule adherence ≥ 95%.",
      requiredActions: "Attendance compliance; daily QA calibration.",
      responsiblePerson: "Mark Anthony Villanueva (Agent)",
      weeklySchedule: "Week 1-4 monitoring.",
      supportNeeded: "QA listening sessions.",
    },
    managementReview: {
      reviewer: "Mark Ramos (Operations Lead)",
      reviewDate: "2026-08-18",
      decision: "Approved",
      remarks: "Authorized standard 30-day PIP.",
    },
    checkpoints: [
      {
        weekNumber: 4,
        date: "2026-09-18",
        results: "QA score remained at 71.4%; 4 instances of unnotified shift tardiness.",
        progress: "No Improvement",
        supervisorAssessment: "Failed to meet minimum policy threshold.",
        employeeComments: "Personal difficulties impacted schedule.",
      },
    ],
    finalEvaluation: {
      evaluationDate: "2026-09-20",
      closureStatus: "Unsuccessful / Escalated",
      outcomeRemarks: "Performance metrics below required standard at Day 30 checkpoint. Escalated to HR for administrative review.",
      evaluator: "Alexandria Chua (Operations Manager)",
    },
    supportingEvidence: [
      { name: "PIP_Final_NonCompliance_Report.pdf", size: "210 KB", date: "2026-09-20", type: "PDF Audit" },
    ],
    acknowledgment: {
      isAcknowledged: true,
      acknowledgedDate: "2026-08-20 15:30",
      employeeComments: "Received final evaluation.",
    },
  },
];

// Mock FrontSteps Employees for searchable selection in Create Modal
const MOCK_FRONTSTEPS_EMPLOYEES = [
  { employeeId: "FS-1001", name: "Dwight Anthony Buma-at", account: "FrontSteps", supervisor: "Mark Ramos", reportingPeriod: "October 2026", score: 96.85, rating: "Exceptional" },
  { employeeId: "FS-1002", name: "Janine Marie Dela Cruz", account: "FrontSteps", supervisor: "Sarah Gomez", reportingPeriod: "October 2026", score: 92.4, rating: "Very Satisfactory" },
  { employeeId: "FS-1003", name: "Carlos Miguel Mendoza", account: "FrontSteps", supervisor: "Mark Ramos", reportingPeriod: "October 2026", score: 88.75, rating: "Satisfactory" },
  { employeeId: "FS-1004", name: "Beatrice Anne Santos", account: "FrontSteps", supervisor: "Sarah Gomez", reportingPeriod: "October 2026", score: 81.6, rating: "Unsatisfactory" },
  { employeeId: "FS-1005", name: "Rafael Dominic Castro", account: "FrontSteps", supervisor: "Mark Ramos", reportingPeriod: "October 2026", score: 94.2, rating: "Very Satisfactory" },
  { employeeId: "FS-1006", name: "Patricia Nicole Reyes", account: "FrontSteps", supervisor: "Alexandria Chua", reportingPeriod: "October 2026", score: 97.5, rating: "Exceptional" },
  { employeeId: "FS-1007", name: "Gabriel Joshua Tan", account: "FrontSteps", supervisor: "Alexandria Chua", reportingPeriod: "October 2026", score: 79.3, rating: "Unsatisfactory" },
  { employeeId: "FS-1008", name: "Kristine Joy Morales", account: "FrontSteps", supervisor: "Sarah Gomez", reportingPeriod: "October 2026", score: 86.9, rating: "Satisfactory" },
  { employeeId: "FS-1009", name: "Lance Christian Lim", account: "FrontSteps", supervisor: "Mark Ramos", reportingPeriod: "October 2026", score: 76.5, rating: "Unsatisfactory" },
  { employeeId: "FS-1010", name: "Danielle Grace Villanueva", account: "FrontSteps", supervisor: "Alexandria Chua", reportingPeriod: "October 2026", score: 85.0, rating: "Satisfactory" },
  { employeeId: "FS-1011", name: "Patrick Sean Reyes", account: "FrontSteps", supervisor: "Sarah Gomez", reportingPeriod: "September 2026", score: 78.4, rating: "Unsatisfactory" },
];

function formatReadableDate(dateString) {
  if (!dateString || dateString === "—") return "—";
  const dateObj = new Date(dateString);
  if (isNaN(dateObj.getTime())) return dateString;
  return dateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function FrontStepsPerformanceImprovement() {
  const [records, setRecords] = useState(INITIAL_PIP_RECORDS);

  // Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSupervisor, setSelectedSupervisor] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedPeriod, setSelectedPeriod] = useState("ALL");
  const [selectedDate, setSelectedDate] = useState("");
  const [activeViewTab, setActiveViewTab] = useState("table"); // "table" | "timeline"

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState(null);
  const [evaluatingRecord, setEvaluatingRecord] = useState(null);
  const [viewingConcernRecord, setViewingConcernRecord] = useState(null);

  // Form state for Modal 1: Create PIP Referral
  const [createForm, setCreateForm] = useState({
    employeeName: "",
    employeeId: "",
    account: "FrontSteps",
    supervisor: "Sarah Gomez",
    reportingPeriod: "October 2026",
    kpiArea: "Cases Closed / Volume",
    validatedKpiScore: 81.6,
    performanceRating: "Unsatisfactory",
    performanceGap: "",
    referralReason: "",
    linkedCoachingId: "COACH-FS-001",
    supportingReport: "FrontSteps_W42_Operational_Report.xlsx",
    additionalRemarks: "",
  });

  const [employeeSearchQuery, setEmployeeSearchQuery] = useState("");
  const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState(false);

  // Form state for Modal 3: Record Weekly Checkpoint / Progress Evaluation
  const [checkpointForm, setCheckpointForm] = useState({
    checkpointDate: "2026-10-20",
    results: "",
    progress: "Improvement Ongoing",
    supervisorAssessment: "",
    employeeComments: "",
    isFinalEvaluation: false,
    finalRecommendation: "Improvement Ongoing",
    managementOutcome: "Continue Weekly Monitoring",
    closureStatus: "In Progress",
  });

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      const matchSearch =
        searchTerm === "" ||
        rec.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.performanceConcern.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.supervisor.toLowerCase().includes(searchTerm.toLowerCase());

      const matchSupervisor =
        selectedSupervisor === "ALL" || rec.supervisor === selectedSupervisor;

      let matchStatus = true;
      if (selectedStatus === "ALL") {
        matchStatus = true;
      } else if (selectedStatus === "Overdue Reviews") {
        matchStatus =
          (rec.status === "Active" || rec.status === "Extended") &&
          rec.targetEndDate !== "—" &&
          rec.targetEndDate < "2026-10-20";
      } else {
        matchStatus = rec.status === selectedStatus;
      }

      const matchPeriod =
        selectedPeriod === "ALL" || rec.reportingPeriod === selectedPeriod;

      const matchDate =
        !selectedDate ||
        rec.referralDate === selectedDate ||
        rec.pipStartDate === selectedDate ||
        rec.targetEndDate === selectedDate;

      return matchSearch && matchSupervisor && matchStatus && matchPeriod && matchDate;
    });
  }, [records, searchTerm, selectedSupervisor, selectedStatus, selectedPeriod, selectedDate]);

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
    setSelectedSupervisor("ALL");
    setSelectedStatus("ALL");
    setSelectedPeriod("ALL");
    setSelectedDate("");
    setCurrentPage(1);
  };

  // 4 Summary KPI Cards
  const summaryStats = useMemo(() => {
    const total = records.length;
    const pendingReviews = records.filter(
      (r) => r.status === "Pending Review" || r.status === "Additional Information Required"
    ).length;
    const activePIPs = records.filter(
      (r) => r.status === "Active" || r.status === "Under Final Review" || r.status === "Extended"
    ).length;
    const completedPIPs = records.filter(
      (r) => r.status === "Closed" || r.status === "Unsuccessful"
    ).length;

    return { total, pendingReviews, activePIPs, completedPIPs };
  }, [records]);

  // Management Alert notifications calculation (Requirement #12)
  const managementAlerts = useMemo(() => {
    const pendingApprovals = records.filter(
      (r) => r.status === "Pending Review" || r.status === "Additional Information Required"
    );
    const overdueWeekly = records.filter(
      (r) =>
        (r.status === "Active" || r.status === "Extended") &&
        r.targetEndDate !== "—" &&
        r.targetEndDate < "2026-10-20"
    );
    const underReview = records.filter((r) => r.status === "Under Final Review");

    return {
      pendingApprovalsCount: pendingApprovals.length,
      overdueCount: overdueWeekly.length,
      underReviewCount: underReview.length,
      totalAlerts: pendingApprovals.length + overdueWeekly.length + underReview.length,
    };
  }, [records]);

  // Status badge styling helper (Requirement #11)
  const getStatusBadge = (status) => {
    switch (status) {
      case "Pending Review":
        return "bg-amber-50 text-amber-700 border border-amber-200/90";
      case "Additional Information Required":
        return "bg-orange-50 text-orange-700 border border-orange-200/90";
      case "Declined":
        return "bg-slate-100 text-slate-700 border border-slate-200";
      case "Approved":
        return "bg-blue-50 text-blue-700 border border-blue-200/90";
      case "Active":
        return "bg-purple-50 text-purple-700 border border-purple-200/90";
      case "Extended":
        return "bg-cyan-50 text-cyan-700 border border-cyan-200/90";
      case "Under Final Review":
        return "bg-indigo-50 text-indigo-700 border border-indigo-200/90";
      case "Closed":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200/90";
      case "Unsuccessful":
        return "bg-rose-50 text-rose-700 border border-rose-200/90";
      default:
        return "bg-slate-100 text-slate-600 border border-slate-200";
    }
  };

  // Handle Create PIP Referral Submit
  const handleSaveCreateReferral = (e) => {
    e.preventDefault();
    if (!createForm.employeeName.trim()) {
      alert("Please select an employee.");
      return;
    }
    if (!createForm.performanceGap.trim() || !createForm.referralReason.trim()) {
      alert("Please enter both the identified performance gap and the referral justification.");
      return;
    }

    const newRecord = {
      id: `PIP-FS-${String(records.length + 1).padStart(3, "0")}`,
      employeeId: createForm.employeeId || "FS-TEMP",
      employeeName: createForm.employeeName,
      account: "FrontSteps",
      supervisor: createForm.supervisor,
      reportingPeriod: createForm.reportingPeriod,
      performanceConcern: createForm.performanceGap,
      kpiArea: createForm.kpiArea,
      validatedKpiScore: createForm.validatedKpiScore,
      performanceRating: createForm.performanceRating,
      referralDate: "2026-10-20",
      pipStartDate: "—",
      targetEndDate: "—",
      status: "Pending Review", // Stays in Referral Stage awaiting management review
      referralJustification: createForm.referralReason,
      linkedCoachingRecords: [
        {
          id: createForm.linkedCoachingId,
          date: "2026-10-14",
          gap: createForm.performanceGap,
          outcome: "Documented in coaching record. Escalated for review.",
        },
      ],
      improvementPlan: {
        specificTargets: `Improve and sustain ${createForm.kpiArea} to standard policy benchmark.`,
        requiredActions: "Dedicated supervisor shadowing, weekly progress check-ins.",
        responsiblePerson: `${createForm.employeeName} / ${createForm.supervisor}`,
        weeklySchedule: "Weekly formal checkpoints scheduled every 7 days.",
        supportNeeded: "Refresher guides and peer-buddy pairing.",
      },
      managementReview: {
        reviewer: "Pending Reviewer",
        reviewDate: "—",
        decision: "Pending",
        remarks: "Referral submitted. Pending management evaluation.",
      },
      checkpoints: [],
      finalEvaluation: null,
      supportingEvidence: [
        { name: createForm.supportingReport, size: "54 KB", date: "2026-10-20", type: "Operational Audit" },
      ],
      acknowledgment: {
        isAcknowledged: false,
        acknowledgedDate: null,
        employeeComments: "",
      },
    };

    setRecords([newRecord, ...records]);
    setIsCreateModalOpen(false);
    setCreateForm({
      employeeName: "",
      employeeId: "",
      account: "FrontSteps",
      supervisor: "Sarah Gomez",
      reportingPeriod: "October 2026",
      kpiArea: "Cases Closed / Volume",
      validatedKpiScore: 81.6,
      performanceRating: "Unsatisfactory",
      performanceGap: "",
      referralReason: "",
      linkedCoachingId: "COACH-FS-001",
      supportingReport: "FrontSteps_W42_Operational_Report.xlsx",
      additionalRemarks: "",
    });
    setEmployeeSearchQuery("");
  };

  // Handle Management Review Decision (Approved, Declined, Additional Information Required)
  const handleManagementReviewDecision = (recordId, decision, remarks) => {
    const updated = records.map((r) => {
      if (r.id === recordId) {
        let nextStatus = r.status;
        let newStartDate = r.pipStartDate;
        let newEndDate = r.targetEndDate;

        if (decision === "Approved") {
          nextStatus = "Active";
          newStartDate = "2026-10-21";
          newEndDate = "2026-11-20";
        } else if (decision === "Declined") {
          nextStatus = "Declined";
        } else if (decision === "Returned for Additional Information") {
          nextStatus = "Additional Information Required";
        }

        return {
          ...r,
          status: nextStatus,
          pipStartDate: newStartDate,
          targetEndDate: newEndDate,
          managementReview: {
            reviewer: "Alexandria Chua (Operations Manager)",
            reviewDate: "2026-10-20",
            decision,
            remarks: remarks || "Management review recorded.",
          },
        };
      }
      return r;
    });

    setRecords(updated);
    if (viewingRecord && viewingRecord.id === recordId) {
      const match = updated.find((x) => x.id === recordId);
      if (match) setViewingRecord(match);
    }
  };

  // Handle Save Checkpoint in Modal 3
  const handleSaveCheckpoint = (e) => {
    e.preventDefault();
    if (!evaluatingRecord) return;

    const newCheckpoint = {
      weekNumber: (evaluatingRecord.checkpoints?.length || 0) + 1,
      date: checkpointForm.checkpointDate,
      results: checkpointForm.results,
      progress: checkpointForm.progress,
      supervisorAssessment: checkpointForm.supervisorAssessment,
      employeeComments: checkpointForm.employeeComments,
    };

    let nextStatus = evaluatingRecord.status;
    let finalEval = evaluatingRecord.finalEvaluation;

    if (checkpointForm.isFinalEvaluation) {
      if (checkpointForm.finalRecommendation === "Improvement Achieved") {
        nextStatus = "Closed";
        finalEval = {
          evaluationDate: checkpointForm.checkpointDate,
          overallResults: checkpointForm.results,
          recommendation: "Improvement Achieved",
          managementOutcome: "Successful PIP Completion. Close formal intervention.",
          closureStatus: "Closed - Resolved",
          closureDate: checkpointForm.checkpointDate,
        };
      } else if (checkpointForm.finalRecommendation === "Improvement Ongoing") {
        nextStatus = "Active";
      } else {
        nextStatus = "Under Final Review";
        finalEval = {
          evaluationDate: checkpointForm.checkpointDate,
          overallResults: checkpointForm.results,
          recommendation: "Improvement Not Achieved",
          managementOutcome: "Referred for Final Management / HR Review.",
          closureStatus: "Under Final Review",
          closureDate: checkpointForm.checkpointDate,
        };
      }
    }

    const updated = records.map((r) => {
      if (r.id === evaluatingRecord.id) {
        return {
          ...r,
          status: nextStatus,
          checkpoints: [...(r.checkpoints || []), newCheckpoint],
          finalEvaluation: finalEval,
        };
      }
      return r;
    });

    setRecords(updated);
    setEvaluatingRecord(null);
  };

  // Handle Employee Acknowledgment in Modal 2
  const handleEmployeeAcknowledge = (recordId, comments) => {
    const updated = records.map((r) => {
      if (r.id === recordId) {
        return {
          ...r,
          acknowledgment: {
            isAcknowledged: true,
            acknowledgedDate: "2026-10-20 17:30",
            employeeComments: comments || "PIP acknowledged by employee.",
          },
        };
      }
      return r;
    });

    setRecords(updated);
    if (viewingRecord && viewingRecord.id === recordId) {
      const match = updated.find((x) => x.id === recordId);
      if (match) setViewingRecord(match);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2.5 sm:gap-3 overflow-hidden font-jakarta text-slate-800">
      {/* 1. Summary Cards (4 Interactive Quick-Filter Cards) */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 shrink-0">
        {/* Card 1 — Total PIP Records */}
        <div
          onClick={() => {
            setSelectedStatus("ALL");
            setCurrentPage(1);
          }}
          className={`flex items-center justify-between rounded-xl border bg-white px-4 py-2.5 shadow-xs cursor-pointer transition-all hover:border-slate-300 ${
            selectedStatus === "ALL" ? "border-[#042c51] ring-1 ring-[#042c51]/20" : "border-slate-200/90"
          }`}
          title="Filter: All PIP records"
        >
          <div className="min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total PIP Records
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-extrabold text-slate-800">
                {summaryStats.total}
              </span>
              <span className="text-xs font-medium text-slate-400">Total</span>
            </div>
            <span className="block text-[10px] text-slate-400 mt-0.5">
              All frontSteps referrals
            </span>
          </div>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-600 border border-slate-100">
            <Users size={15} />
          </div>
        </div>

        {/* Card 2 — Pending Management Reviews */}
        <div
          onClick={() => {
            setSelectedStatus(selectedStatus === "Pending Review" ? "ALL" : "Pending Review");
            setCurrentPage(1);
          }}
          className={`flex items-center justify-between rounded-xl border bg-white px-4 py-2.5 shadow-xs cursor-pointer transition-all hover:border-amber-300 ${
            selectedStatus === "Pending Review" ? "border-amber-400 ring-1 ring-amber-400/20" : "border-slate-200/90"
          }`}
          title="Filter: Pending management reviews"
        >
          <div className="min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Pending Management Reviews
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-extrabold text-amber-700">
                {summaryStats.pendingReviews}
              </span>
              <span className="text-xs font-medium text-amber-600/80">Pending</span>
            </div>
            <span className="block text-[10px] text-amber-600 font-semibold mt-0.5">
              Awaiting review decision
            </span>
          </div>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
            <Clock size={15} />
          </div>
        </div>

        {/* Card 3 — Active & Extended PIPs */}
        <div
          onClick={() => {
            setSelectedStatus(selectedStatus === "Active" ? "ALL" : "Active");
            setCurrentPage(1);
          }}
          className={`flex items-center justify-between rounded-xl border bg-white px-4 py-2.5 shadow-xs cursor-pointer transition-all hover:border-purple-300 ${
            selectedStatus === "Active" ? "border-purple-400 ring-1 ring-purple-400/20" : "border-slate-200/90"
          }`}
          title="Filter: Active & extended PIPs"
        >
          <div className="min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Active & Extended PIPs
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-extrabold text-purple-700">
                {summaryStats.activePIPs}
              </span>
              <span className="text-xs font-medium text-purple-600/80">Active</span>
            </div>
            <span className="block text-[10px] text-purple-600 font-semibold mt-0.5">
              In monitoring window
            </span>
          </div>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600 border border-purple-100">
            <Activity size={15} />
          </div>
        </div>

        {/* Card 4 — Completed & Concluded */}
        <div
          onClick={() => {
            setSelectedStatus(selectedStatus === "Closed" ? "ALL" : "Closed");
            setCurrentPage(1);
          }}
          className={`flex items-center justify-between rounded-xl border bg-white px-4 py-2.5 shadow-xs cursor-pointer transition-all hover:border-emerald-300 ${
            selectedStatus === "Closed" ? "border-emerald-400 ring-1 ring-emerald-400/20" : "border-slate-200/90"
          }`}
          title="Filter: Completed & concluded PIPs"
        >
          <div className="min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Completed & Concluded
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-extrabold text-emerald-700">
                {summaryStats.completedPIPs}
              </span>
              <span className="text-xs font-medium text-emerald-600/80">Closed</span>
            </div>
            <span className="block text-[10px] text-slate-400 mt-0.5">
              Evaluated and concluded
            </span>
          </div>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
            <CheckCircle2 size={15} />
          </div>
        </div>
      </div>

      {/* Requirement #12: Management Notification & Action Center Banner */}
      {managementAlerts.totalAlerts > 0 && (
        <div className="rounded-xl border border-amber-200/90 bg-amber-50/70 px-4 py-2.5 shadow-xs shrink-0 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
              <Bell size={14} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-900">
                  Management Attention Required
                </span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-amber-200 text-amber-900">
                  {managementAlerts.totalAlerts} Active
                </span>
              </div>
              <p className="text-[11px] text-amber-800/90 mt-0.5">
                FrontSteps PIP referrals pending authorization, weekly checkpoints, or final evaluation reviews.
              </p>
            </div>
          </div>

          {/* Quick interactive filter pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {managementAlerts.pendingApprovalsCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSelectedStatus("Pending Review");
                  setCurrentPage(1);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                  selectedStatus === "Pending Review"
                    ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                    : "bg-white text-amber-800 border-amber-300 hover:bg-amber-50"
                }`}
              >
                <Clock size={12} />
                <span>{managementAlerts.pendingApprovalsCount} Pending Authorizations</span>
              </button>
            )}

            {managementAlerts.underReviewCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSelectedStatus("Under Final Review");
                  setCurrentPage(1);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                  selectedStatus === "Under Final Review"
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                    : "bg-white text-indigo-800 border-indigo-200 hover:bg-indigo-50"
                }`}
              >
                <ShieldCheck size={12} />
                <span>{managementAlerts.underReviewCount} Final Reviews</span>
              </button>
            )}

            {managementAlerts.overdueCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSelectedStatus("Overdue Reviews");
                  setCurrentPage(1);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                  selectedStatus === "Overdue Reviews"
                    ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                    : "bg-white text-rose-700 border-rose-200 hover:bg-rose-50"
                }`}
              >
                <AlertCircle size={12} />
                <span>{managementAlerts.overdueCount} Overdue Targets</span>
              </button>
            )}

            {(selectedStatus !== "ALL" || searchTerm || selectedDate) && (
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

      {/* 3. Search and Filter Bar with Create PIP Referral Button */}
      <div className="rounded-xl border border-slate-200/80 bg-white px-3.5 py-2.5 shadow-xs shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Left: View Toggle + Search and Filters */}
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[300px]">
            {/* View Mode Toggle: Table vs Timeline */}
            <div className="flex items-center rounded-lg bg-slate-100 p-0.5 border border-slate-200 shrink-0">
              <button
                type="button"
                onClick={() => setActiveViewTab("table")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                  activeViewTab === "table"
                    ? "bg-[#042c51] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <ListFilter size={13} />
                <span>PIP Records</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveViewTab("timeline")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                  activeViewTab === "timeline"
                    ? "bg-[#042c51] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Calendar size={13} />
                <span>Schedule & Milestones</span>
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
                  placeholder="Search employee, ID, or PIP record ID..."
                  className="w-full bg-transparent text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none"
                />
              </div>
            </div>

            {/* DatePicker Filter (Requirement #16) */}
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

            {/* Status Filter (Requirement #11) */}
            <div className="w-[195px]">
              <SingleSelectDropdown
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: "ALL", label: "All PIP Statuses" },
                  { value: "Pending Review", label: "Pending Review" },
                  { value: "Additional Information Required", label: "Add'l Info Required" },
                  { value: "Active", label: "Active PIP" },
                  { value: "Extended", label: "Extended PIP" },
                  { value: "Under Final Review", label: "Under Final Review" },
                  { value: "Overdue Reviews", label: "Overdue Reviews" },
                  { value: "Closed", label: "Closed PIP" },
                  { value: "Unsuccessful", label: "Unsuccessful / Escalated" },
                  { value: "Declined", label: "Declined" },
                ]}
                buttonClassName="h-8 rounded-lg border-slate-200 px-3 text-xs"
              />
            </div>

            {/* Reporting Period Filter */}
            <div className="w-[145px]">
              <SingleSelectDropdown
                value={selectedPeriod}
                onChange={(e) => {
                  setSelectedPeriod(e.target.value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: "ALL", label: "All Periods" },
                  { value: "October 2026", label: "October 2026" },
                  { value: "September 2026", label: "September 2026" },
                  { value: "August 2026", label: "August 2026" },
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

          {/* Right: Create PIP Referral Primary Button */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="flex h-8 items-center gap-1.5 rounded-lg bg-[#ff5c28] px-3.5 text-xs font-bold text-white hover:bg-[#e04816] transition-colors cursor-pointer shadow-xs"
            >
              <Plus size={14} />
              <span>Create PIP Referral</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Performance Improvement Directory Table OR Schedule Timeline */}
      {activeViewTab === "table" ? (
        <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden flex flex-col flex-1 min-h-0">
        {/* Table Body */}
        <div className="overflow-auto flex-1 min-h-0 sibs-scrollbar">
          <table className="w-full table-fixed text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-[#042c51] bg-[#042c51] text-[11px] font-bold uppercase tracking-wider text-white select-none shadow-xs">
                <th className="py-3 px-3 w-[15%]">Employee Name / ID</th>
                <th className="py-3 px-3 w-[10%]">PIP Record ID</th>
                <th className="py-3 px-3 w-[11%]">Assigned Supervisor</th>
                <th className="py-3 px-2 w-[11%] text-center">Performance Concern</th>
                <th className="py-3 px-2.5 w-[9%]">Referral Date</th>
                <th className="py-3 px-2.5 w-[8%]">PIP Start</th>
                <th className="py-3 px-2.5 w-[8%]">Target End</th>
                <th className="py-3 px-3 w-[10%]">Status</th>
                <th className="py-3 px-4 w-[25%] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {paginatedRecords.length > 0 ? (
                paginatedRecords.map((rec) => {
                  return (
                    <tr
                      key={rec.id}
                      className="hover:bg-slate-50/70 transition-colors h-[54px]"
                    >
                      {/* Employee Name / Employee ID */}
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
                            {rec.account}
                          </span>
                        </div>
                      </td>

                      {/* PIP Record ID */}
                      <td className="py-3 px-3 font-mono text-[11.5px] font-bold text-slate-700 whitespace-nowrap">
                        {rec.id}
                      </td>

                      {/* Assigned Supervisor */}
                      <td className="py-3 px-3 text-slate-700 text-xs truncate" title={rec.supervisor}>
                        {rec.supervisor}
                      </td>

                      {/* Performance Concern (Compact 'View Concern' Button) */}
                      <td className="py-3 px-2 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setViewingConcernRecord(rec)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold text-[#ff5c28] bg-orange-50 hover:bg-orange-100 transition-colors cursor-pointer border border-orange-200/80 shadow-2xs"
                          title="Click to view performance concern details"
                        >
                          <Eye size={12} />
                          <span>View Concern</span>
                        </button>
                      </td>

                      {/* Referral Date */}
                      <td className="py-3 px-2.5 font-mono text-[11.5px] text-slate-600 whitespace-nowrap">
                        {formatReadableDate(rec.referralDate)}
                      </td>

                      {/* PIP Start Date */}
                      <td className="py-3 px-2.5 font-mono text-[11.5px] text-slate-600 whitespace-nowrap">
                        {rec.pipStartDate === "—" ? "—" : formatReadableDate(rec.pipStartDate)}
                      </td>

                      {/* Target End Date */}
                      <td className="py-3 px-2.5 font-mono text-[11.5px] text-slate-600 whitespace-nowrap">
                        {rec.targetEndDate === "—" ? "—" : formatReadableDate(rec.targetEndDate)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${getStatusBadge(
                            rec.status
                          )}`}
                        >
                          {rec.status}
                        </span>
                      </td>

                      {/* Actions Column: View button + Context-Aware action pill */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-3">
                          {/* 1. View button */}
                          <button
                            type="button"
                            onClick={() => setViewingRecord(rec)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-[#042c51] transition-colors cursor-pointer shrink-0"
                            title="View PIP details"
                          >
                            <Eye size={14} className="text-slate-500" />
                            <span>View</span>
                          </button>

                          {/* 2. Status-specific Action Button (rounded-xl pill) */}
                          <div className="w-[142px] flex items-center justify-start">
                            {/* Case 1: Pending Review or Additional Information Required */}
                            {(rec.status === "Pending Review" ||
                              rec.status === "Additional Information Required") && (
                              <button
                                type="button"
                                onClick={() => setViewingRecord(rec)}
                                className="inline-flex items-center justify-center gap-1.5 w-full h-[28px] px-3 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors cursor-pointer border border-amber-300/80"
                                title="Review PIP referral and document management decision"
                              >
                                <FileCheck2 size={13} className="shrink-0" />
                                <span>Review Referral</span>
                              </button>
                            )}

                            {/* Case 2: Active or Extended PIP */}
                            {(rec.status === "Active" || rec.status === "Extended") && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEvaluatingRecord(rec);
                                  setCheckpointForm({
                                    checkpointDate: "2026-10-20",
                                    results: "",
                                    progress: rec.status === "Extended" ? "Partial Improvement" : "Improvement Ongoing",
                                    supervisorAssessment: "",
                                    employeeComments: "",
                                    isFinalEvaluation: false,
                                    finalRecommendation: "Improvement Ongoing",
                                    managementOutcome: "Continue Weekly Monitoring",
                                    closureStatus: "In Progress",
                                  });
                                }}
                                className={`inline-flex items-center justify-center gap-1.5 w-full h-[28px] px-3 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                                  rec.status === "Extended"
                                    ? "text-cyan-700 bg-cyan-50 hover:bg-cyan-100 border-cyan-200"
                                    : "text-purple-700 bg-purple-50 hover:bg-purple-100 border-purple-200"
                                }`}
                                title="Record weekly checkpoint evaluation"
                              >
                                <PlayCircle size={13} className="shrink-0" />
                                <span>{rec.status === "Extended" ? "Extended Review" : "Record Checkpoint"}</span>
                              </button>
                            )}

                            {/* Case 3: Under Final Review */}
                            {rec.status === "Under Final Review" && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEvaluatingRecord(rec);
                                  setCheckpointForm({
                                    checkpointDate: "2026-10-20",
                                    results: rec.finalEvaluation?.overallResults || "",
                                    progress: "Improvement Ongoing",
                                    supervisorAssessment: "Final performance review submission.",
                                    employeeComments: "",
                                    isFinalEvaluation: true,
                                    finalRecommendation: rec.finalEvaluation?.recommendation || "Improvement Ongoing",
                                    managementOutcome: rec.finalEvaluation?.managementOutcome || "Awaiting Final Closure",
                                    closureStatus: rec.finalEvaluation?.closureStatus || "Under Final Review",
                                  });
                                }}
                                className="inline-flex items-center justify-center gap-1.5 w-full h-[28px] px-3 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors cursor-pointer border border-indigo-200"
                                title="Review final evaluation outcome"
                              >
                                <ShieldCheck size={13} className="shrink-0" />
                                <span>Final Evaluation</span>
                              </button>
                            )}

                            {/* Case 4: Closed */}
                            {rec.status === "Closed" && (
                              <button
                                type="button"
                                onClick={() => setViewingRecord(rec)}
                                className="inline-flex items-center justify-center gap-1.5 w-full h-[28px] px-3 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer border border-emerald-300/80"
                                title="View finalized PIP results and resolution"
                              >
                                <Award size={13} className="shrink-0" />
                                <span>View Results</span>
                              </button>
                            )}

                            {/* Case 5: Unsuccessful */}
                            {rec.status === "Unsuccessful" && (
                              <button
                                type="button"
                                onClick={() => setViewingRecord(rec)}
                                className="inline-flex items-center justify-center gap-1.5 w-full h-[28px] px-3 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer border border-rose-300"
                                title="View unsuccessful PIP evaluation and HR escalation"
                              >
                                <AlertTriangle size={13} className="shrink-0" />
                                <span>View Outcome</span>
                              </button>
                            )}

                            {/* Case 6: Declined */}
                            {rec.status === "Declined" && (
                              <button
                                type="button"
                                onClick={() => setViewingRecord(rec)}
                                className="inline-flex items-center justify-center gap-1.5 w-full h-[28px] px-3 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer border border-slate-300/80"
                                title="View declined referral details"
                              >
                                <Eye size={13} className="shrink-0" />
                                <span>View Referral</span>
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
                        No Performance Improvement records found
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        No FrontSteps PIP referrals match your filter criteria.
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
          itemLabel="PIP records"
          className="shrink-0"
        />
      </div>
      ) : (
        /* Schedule & Milestones Dedicated View (Requirement #7 & #8) */
        <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs p-4 flex-1 overflow-y-auto sibs-scrollbar">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Calendar size={14} className="text-[#042c51]" />
                <span>FrontSteps Performance Improvement 30-Day Timeline & Milestones</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Overview of PIP referral reviews, active 30-day monitoring cycles, and formal outcomes.
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
              Reference Date: Oct 20, 2026
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Column 1: Pending Authorizations */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/30 p-3.5 flex flex-col min-h-[300px]">
              <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-amber-100">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                    Pending Authorizations
                  </h4>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  {records.filter((r) => r.status === "Pending Review" || r.status === "Additional Information Required").length}
                </span>
              </div>

              <div className="space-y-2.5 overflow-y-auto pr-1">
                {records
                  .filter((r) => r.status === "Pending Review" || r.status === "Additional Information Required")
                  .map((rec) => (
                    <div
                      key={rec.id}
                      className="bg-white rounded-lg p-3 border border-amber-200 shadow-2xs hover:shadow-xs transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs truncate">
                          {rec.employeeName}
                        </span>
                        <span className="font-mono text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.2 rounded">
                          {rec.id}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                        {rec.performanceConcern}
                      </p>
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10.5px]">
                        <span className="text-amber-700 font-bold">
                          Referred: {formatReadableDate(rec.referralDate)}
                        </span>
                        <button
                          type="button"
                          onClick={() => setViewingRecord(rec)}
                          className="text-[#042c51] hover:underline font-bold cursor-pointer"
                        >
                          Review Referral →
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Column 2: Active 30-Day & Extended PIPs */}
            <div className="rounded-xl border border-purple-200 bg-purple-50/30 p-3.5 flex flex-col min-h-[300px]">
              <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-purple-100">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                  <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wider">
                    Active & Extended PIPs
                  </h4>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                  {records.filter((r) => r.status === "Active" || r.status === "Extended" || r.status === "Under Final Review").length}
                </span>
              </div>

              <div className="space-y-2.5 overflow-y-auto pr-1">
                {records
                  .filter((r) => r.status === "Active" || r.status === "Extended" || r.status === "Under Final Review")
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
                        {rec.performanceConcern}
                      </p>
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10.5px]">
                        <span className="text-purple-700 font-bold">
                          Target End: {formatReadableDate(rec.targetEndDate)}
                        </span>
                        <button
                          type="button"
                          onClick={() => setViewingRecord(rec)}
                          className="text-[#042c51] hover:underline font-bold cursor-pointer"
                        >
                          Checkpoints ({rec.checkpoints?.length || 0}) →
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Column 3: Concluded / Outcomes */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-3.5 flex flex-col min-h-[300px]">
              <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-emerald-100">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                  <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                    Concluded Outcomes
                  </h4>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                  {records.filter((r) => r.status === "Closed" || r.status === "Unsuccessful" || r.status === "Declined").length}
                </span>
              </div>

              <div className="space-y-2.5 overflow-y-auto pr-1">
                {records
                  .filter((r) => r.status === "Closed" || r.status === "Unsuccessful" || r.status === "Declined")
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
                        {rec.performanceConcern}
                      </p>
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10.5px]">
                        <span className="text-slate-600 font-medium">
                          Supervisor: <strong>{rec.supervisor}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => setViewingRecord(rec)}
                          className="text-[#042c51] hover:underline font-bold cursor-pointer"
                        >
                          View Results →
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
      {/* MODAL 1: CREATE PIP REFERRAL                              */}
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
                    Create Formal PIP Referral
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Requirement #12 — Controlled PIP Referral and Escalation Workflow
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

            {/* Form Body organized into 4 clear sections A-D */}
            <form onSubmit={handleSaveCreateReferral} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto sibs-scrollbar p-6 space-y-5 text-xs">
                {/* SECTION A: Employee Information */}
                <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded-md bg-[#042c51]/10 text-[#042c51] flex items-center justify-center font-bold text-[11px]">
                        A
                      </div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Employee Information
                      </h4>
                    </div>
                    <span className="text-[10.5px] text-slate-400 font-medium">Section A of D</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {/* Employee Name: Searchable Dropdown */}
                    <div className="relative sm:col-span-2">
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
                                      supervisor: emp.supervisor || prev.supervisor,
                                      reportingPeriod: emp.reportingPeriod || prev.reportingPeriod,
                                      validatedKpiScore: emp.score,
                                      performanceRating: emp.rating,
                                      performanceGap: `Performance score of ${emp.score} (${emp.rating}) identified during ${emp.reportingPeriod}.`,
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
                                      Score: {emp.score} • {emp.rating}
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

                    {/* Supervisor */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Supervisor <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={createForm.supervisor}
                        onChange={(e) =>
                          setCreateForm({ ...createForm, supervisor: e.target.value })
                        }
                        className="w-full h-8 px-2 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#ff5c28] cursor-pointer"
                      >
                        <option value="Sarah Gomez">Sarah Gomez</option>
                        <option value="Mark Ramos">Mark Ramos</option>
                        <option value="Alexandria Chua">Alexandria Chua</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* SECTION B: Performance Concern */}
                <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded-md bg-[#042c51]/10 text-[#042c51] flex items-center justify-center font-bold text-[11px]">
                        B
                      </div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Performance Concern & Validated Results
                      </h4>
                    </div>
                    <span className="text-[10.5px] text-slate-400 font-medium">Section B of D</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Related KPI Area <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={createForm.kpiArea}
                        onChange={(e) => setCreateForm({ ...createForm, kpiArea: e.target.value })}
                        className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#ff5c28] cursor-pointer"
                      >
                        <option value="Cases Closed / Volume">Cases Closed / Volume</option>
                        <option value="AHT Compliance">AHT Compliance</option>
                        <option value="QA Score">Quality Assurance (QA)</option>
                        <option value="Attendance & Adherence">Attendance & Schedule Adherence</option>
                        <option value="CSAT / Quality">Customer Satisfaction (CSAT)</option>
                        <option value="Data & Subcode Accuracy">Data & Subcode Accuracy</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Validated KPI Score
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={createForm.validatedKpiScore ? `${createForm.validatedKpiScore} / 100` : "—"}
                        className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-mono font-bold text-slate-700 outline-none select-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Performance Rating
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={createForm.performanceRating || "—"}
                        className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold text-rose-700 outline-none select-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Identified Performance Gap <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={createForm.performanceGap}
                      onChange={(e) => setCreateForm({ ...createForm, performanceGap: e.target.value })}
                      placeholder="State the observed deficit or operational discrepancy (e.g. Cases closed weekly volume at 112 vs 140 benchmark)..."
                      className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#ff5c28] resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Referral Reason / Justification <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={createForm.referralReason}
                      onChange={(e) => setCreateForm({ ...createForm, referralReason: e.target.value })}
                      placeholder="Explain why formal PIP intervention is recommended after coaching support..."
                      className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#ff5c28] resize-none"
                    />
                  </div>
                </div>

                {/* SECTION C: Previous Coaching History */}
                <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded-md bg-[#042c51]/10 text-[#042c51] flex items-center justify-center font-bold text-[11px]">
                        C
                      </div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Previous Coaching Interventions
                      </h4>
                    </div>
                    <span className="text-[10.5px] text-slate-400 font-medium">Section C of D</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Linked Coaching Record
                      </label>
                      <select
                        value={createForm.linkedCoachingId}
                        onChange={(e) => setCreateForm({ ...createForm, linkedCoachingId: e.target.value })}
                        className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#ff5c28] cursor-pointer"
                      >
                        <option value="COACH-FS-001">COACH-FS-001 (Cases Closed Volume Deficit)</option>
                        <option value="COACH-FS-002">COACH-FS-002 (AHT Outlier on Escalation Tickets)</option>
                        <option value="COACH-FS-008">COACH-FS-008 (Throughput Benchmarking)</option>
                        <option value="COACH-FS-NONE">No Prior Coaching Logged</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Previous Coaching Outcome Summary
                      </label>
                      <input
                        type="text"
                        readOnly
                        value="Coaching conducted; persistent gap documented in follow-up review."
                        className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-600 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION D: Supporting Evidence */}
                <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded-md bg-[#042c51]/10 text-[#042c51] flex items-center justify-center font-bold text-[11px]">
                        D
                      </div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Supporting Evidence & Attachments
                      </h4>
                    </div>
                    <span className="text-[10.5px] text-slate-400 font-medium">Section D of D</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Supporting Performance Report
                      </label>
                      <input
                        type="text"
                        value={createForm.supportingReport}
                        onChange={(e) => setCreateForm({ ...createForm, supportingReport: e.target.value })}
                        className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#ff5c28]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Additional Supervisor Remarks
                      </label>
                      <input
                        type="text"
                        value={createForm.additionalRemarks}
                        onChange={(e) => setCreateForm({ ...createForm, additionalRemarks: e.target.value })}
                        placeholder="Optional remarks for management consideration..."
                        className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#ff5c28]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 bg-slate-50 shrink-0">
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  <span>Submitting creates a 'Pending Review' record — does NOT auto-activate a PIP</span>
                </div>
                <div className="flex items-center gap-2">
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
                    Submit for Review
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: VIEW PIP / MANAGEMENT REVIEW (4 Tabs)             */}
      {/* ========================================================= */}
      {viewingRecord && (
        <ViewPipManagementModal
          record={viewingRecord}
          onClose={() => setViewingRecord(null)}
          onDecision={handleManagementReviewDecision}
          onAcknowledge={handleEmployeeAcknowledge}
        />
      )}

      {/* ========================================================= */}
      {/* MODAL 3: PIP PROGRESS & EVALUATION (Weekly Checkpoints)     */}
      {/* ========================================================= */}
      {evaluatingRecord && (
        <PipProgressEvaluationModal
          record={evaluatingRecord}
          form={checkpointForm}
          setForm={setCheckpointForm}
          onClose={() => setEvaluatingRecord(null)}
          onSave={handleSaveCheckpoint}
        />
      )}

      {/* ========================================================= */}
      {/* MODAL 4: PERFORMANCE CONCERN INSPECTION MODAL             */}
      {/* ========================================================= */}
      {viewingConcernRecord && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/25 p-4 sm:p-6 overflow-hidden animate-in fade-in duration-200">
          <div className="relative w-[90vw] max-w-lg h-auto max-h-[82vh] rounded-2xl bg-white shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 bg-[#042c51] text-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white border border-white/20">
                  <Target size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Performance Concern & Gap</h3>
                  <p className="text-[11px] text-slate-300">
                    {viewingConcernRecord.employeeName} ({viewingConcernRecord.id})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingConcernRecord(null)}
                className="px-3.5 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors font-bold text-xs cursor-pointer border border-white/15"
              >
                Close
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-[11px]">
                <div>
                  <span className="text-slate-400 block font-bold uppercase text-[10px]">Employee</span>
                  <span className="font-semibold text-slate-800">{viewingConcernRecord.employeeName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold uppercase text-[10px]">Supervisor</span>
                  <span className="font-semibold text-slate-800">{viewingConcernRecord.supervisor}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold uppercase text-[10px]">KPI Category</span>
                  <span className="font-semibold text-[#042c51]">{viewingConcernRecord.kpiArea}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold uppercase text-[10px]">Validated Score</span>
                  <span className="font-mono font-bold text-rose-700">
                    {viewingConcernRecord.validatedKpiScore ? `${viewingConcernRecord.validatedKpiScore} / 100` : "—"} ({viewingConcernRecord.performanceRating})
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 font-bold uppercase text-[10.5px] block mb-1">
                  Identified Performance Concern / Gap
                </span>
                <div className="p-3.5 rounded-xl border border-rose-100 bg-rose-50/50 text-slate-800 font-medium text-xs leading-relaxed">
                  {viewingConcernRecord.performanceConcern}
                </div>
              </div>

              {viewingConcernRecord.referralJustification && (
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[10.5px] block mb-1">
                    Referral Justification & Observed Shortfall
                  </span>
                  <div className="p-3 rounded-lg border border-slate-200 bg-white text-slate-700 leading-relaxed font-medium">
                    {viewingConcernRecord.referralJustification}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-mono">
                <span>Referral Date: <strong className="text-slate-700">{formatReadableDate(viewingConcernRecord.referralDate)}</strong></span>
                <span>Target End: <strong className="text-slate-700">{formatReadableDate(viewingConcernRecord.targetEndDate)}</strong></span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end px-6 py-3 border-t border-slate-100 bg-slate-50 shrink-0">
              <button
                type="button"
                onClick={() => setViewingConcernRecord(null)}
                className="px-4 py-1.5 rounded-lg bg-[#042c51] text-white hover:bg-[#073966] transition-colors font-bold text-xs cursor-pointer shadow-xs"
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

// =========================================================================
// MODAL 2 COMPONENT: View PIP / Management Review (4 Tabs)
// =========================================================================
function ViewPipManagementModal({ record, onClose, onDecision, onAcknowledge }) {
  const [activeTab, setActiveTab] = useState("referral");
  const [mgmtRemarks, setMgmtRemarks] = useState(record.managementReview?.remarks || "");
  const [ackComment, setAckComment] = useState("");

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
                <span className="px-2 py-0.5 rounded bg-[#ff5c28] text-white text-[10.5px] font-bold uppercase tracking-wider">
                  {record.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                FrontSteps Performance Improvement Record • Supervisor: {record.supervisor}
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

        {/* 4 Tabs Navigation */}
        <div className="flex items-center gap-1 px-6 border-b border-slate-200 bg-white shrink-0">
          {[
            { id: "referral", label: "Referral Details" },
            { id: "plan", label: "Improvement Plan" },
            { id: "review", label: "Management Review" },
            { id: "supporting", label: "Supporting Records" },
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
          {/* TAB 1: REFERRAL DETAILS */}
          {activeTab === "referral" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Employee and Supervisor Information
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-500">Referral Date:</span>
                    <span className="font-mono font-bold text-[#042c51]">
                      {formatReadableDate(record.referralDate)}
                    </span>
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
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Supervisor</span>
                    <span className="font-semibold text-slate-800 text-xs">{record.supervisor}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Reporting Period</span>
                    <span className="font-semibold text-slate-800 text-xs">{record.reportingPeriod}</span>
                  </div>
                </div>
              </div>

              {/* Performance Concern & Validated Results */}
              <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100">
                  Performance Concern & Validated Results
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">KPI Area</span>
                    <span className="font-bold text-slate-800 text-xs">{record.kpiArea}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Validated Score</span>
                    <span className="font-mono font-bold text-slate-800 text-xs">
                      {record.validatedKpiScore} / 100
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Rating</span>
                    <span className="font-bold text-rose-700 text-xs">{record.performanceRating}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Identified Gap</span>
                  <p className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-700 font-medium">
                    {record.performanceConcern}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Referral Justification</span>
                  <p className="p-2.5 rounded-lg bg-orange-50/60 border border-orange-200/80 text-slate-800 font-medium">
                    {record.referralJustification}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: IMPROVEMENT PLAN */}
          {activeTab === "plan" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Formal 30-Day PIP Structure & Milestones
                  </h4>
                  <div className="flex items-center gap-3 font-mono text-xs">
                    <span>Start: <strong>{formatReadableDate(record.pipStartDate)}</strong></span>
                    <span>Target End: <strong>{formatReadableDate(record.targetEndDate)}</strong></span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Specific Performance Targets
                    </span>
                    <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-200/70 text-slate-800 font-semibold">
                      {record.improvementPlan?.specificTargets}
                    </div>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Required Improvement Actions
                    </span>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-700">
                      {record.improvementPlan?.requiredActions}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Responsible Person
                      </span>
                      <span className="font-semibold text-slate-800">
                        {record.improvementPlan?.responsiblePerson}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Weekly Review Schedule
                      </span>
                      <span className="font-medium text-slate-700">
                        {record.improvementPlan?.weeklySchedule}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Support or Resources Provided
                    </span>
                    <p className="text-slate-600">
                      {record.improvementPlan?.supportNeeded}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MANAGEMENT REVIEW */}
          {activeTab === "review" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Management Review Decision Record
                  </h4>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      record.managementReview?.decision === "Approved"
                        ? "bg-emerald-100 text-emerald-800"
                        : record.managementReview?.decision === "Declined"
                        ? "bg-slate-200 text-slate-700"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {record.managementReview?.decision || "Pending"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">
                      Assigned Reviewer
                    </span>
                    <span className="font-semibold text-slate-800">
                      {record.managementReview?.reviewer}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">
                      Review Date
                    </span>
                    <span className="font-mono text-slate-700">
                      {formatReadableDate(record.managementReview?.reviewDate)}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Management Remarks & Guidance
                  </span>
                  <textarea
                    rows={2}
                    value={mgmtRemarks}
                    onChange={(e) => setMgmtRemarks(e.target.value)}
                    placeholder="Enter management review comments..."
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#ff5c28] resize-none"
                  />
                </div>

                {/* Simulated Authorized Management Actions */}
                <div className="pt-2 border-t border-slate-100">
                  <span className="block text-[11px] font-bold text-slate-700 uppercase mb-2">
                    Authorized Management Action (Simulated Decision)
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onDecision(record.id, "Approved", mgmtRemarks)}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors font-bold text-xs cursor-pointer shadow-xs"
                    >
                      Approve Formal PIP (Activate 30-Day Window)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onDecision(record.id, "Returned for Additional Information", mgmtRemarks)
                      }
                      className="px-3.5 py-1.5 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors font-bold text-xs cursor-pointer shadow-xs"
                    >
                      Request Additional Information
                    </button>
                    <button
                      type="button"
                      onClick={() => onDecision(record.id, "Declined", mgmtRemarks)}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-600 text-white hover:bg-slate-700 transition-colors font-bold text-xs cursor-pointer shadow-xs"
                    >
                      Decline Referral
                    </button>
                  </div>
                  <p className="text-[10.5px] text-slate-400 mt-2">
                    * Approval explicitly activates the PIP and creates the 30-day monitoring window. It is never triggered automatically.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SUPPORTING RECORDS & ACKNOWLEDGMENT */}
          {activeTab === "supporting" && (
            <div className="space-y-4">
              {/* Linked Coaching Records */}
              <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100">
                  Linked Coaching Records
                </h4>
                <div className="space-y-2">
                  {record.linkedCoachingRecords?.map((coach, cIdx) => (
                    <div
                      key={cIdx}
                      className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-mono text-xs font-bold text-[#042c51]">
                          {coach.id}
                        </span>
                        <p className="text-xs text-slate-700 mt-0.5">{coach.gap}</p>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500 font-mono">
                        {formatReadableDate(coach.date)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Employee Acknowledgment */}
              <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Employee Acknowledgment & Comments
                  </h4>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      record.acknowledgment?.isAcknowledged
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {record.acknowledgment?.isAcknowledged ? "Acknowledged" : "Pending Acknowledgment"}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Acknowledged Timestamp:</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {record.acknowledgment?.acknowledgedDate || "Not yet signed"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Employee Statement
                    </span>
                    <p className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-700 italic">
                      "{record.acknowledgment?.employeeComments || "No statement recorded."}"
                    </p>
                  </div>

                  {!record.acknowledgment?.isAcknowledged && (
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <span className="text-xs font-bold text-slate-700 block">
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
                        Sign & Acknowledge PIP Record
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// MODAL 3 COMPONENT: PIP Progress & Evaluation (Weekly Checkpoints)
// =========================================================================
function PipProgressEvaluationModal({ record, form, setForm, onClose, onSave }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/25 p-4 sm:p-6 overflow-hidden animate-in fade-in duration-200">
      <div className="relative w-[90vw] max-w-4xl h-[82vh] max-h-[85vh] rounded-2xl bg-white shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 bg-[#042c51] text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white border border-white/20">
              <Activity size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                PIP Progress & Evaluation
              </h3>
              <p className="text-[11px] text-slate-300">
                Weekly Monitoring & Milestone Evaluation — {record.employeeName} ({record.id})
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

        {/* Form Body organized into Sections A to D */}
        <form onSubmit={onSave} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto sibs-scrollbar p-6 space-y-5 text-xs">
            {/* Section A: PIP Summary */}
            <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  A. PIP Summary & Targets
                </h4>
                <div className="flex items-center gap-3 font-mono text-xs">
                  <span>Start: <strong>{formatReadableDate(record.pipStartDate)}</strong></span>
                  <span>Target End: <strong>{formatReadableDate(record.targetEndDate)}</strong></span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">
                    Performance Concern
                  </span>
                  <p className="text-slate-800 font-semibold">{record.performanceConcern}</p>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">
                    Approved Improvement Target
                  </span>
                  <p className="text-slate-800 font-medium">
                    {record.improvementPlan?.specificTargets}
                  </p>
                </div>
              </div>
            </div>

            {/* Section B: Weekly Checkpoint Entry */}
            <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100">
                B. Document Weekly Checkpoint
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Checkpoint Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={form.checkpointDate}
                    onChange={(e) => setForm({ ...form, checkpointDate: e.target.value })}
                    className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#ff5c28]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Progress Classification <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={form.progress}
                    onChange={(e) => setForm({ ...form, progress: e.target.value })}
                    className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-bold outline-none focus:border-[#ff5c28] cursor-pointer"
                  >
                    <option value="Improvement Ongoing">Improvement Ongoing</option>
                    <option value="Improvement Achieved">Improvement Achieved</option>
                    <option value="Improvement Not Achieved">Improvement Not Achieved</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Observed Performance Results / Metric Measurements <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={form.results}
                  onChange={(e) => setForm({ ...form, results: e.target.value })}
                  placeholder="Document quantitative outcomes (e.g. Volume reached 128 cases, AHT lowered to 880s)..."
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#ff5c28] resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Supervisor Assessment & Guidance
                  </label>
                  <textarea
                    rows={2}
                    value={form.supervisorAssessment}
                    onChange={(e) => setForm({ ...form, supervisorAssessment: e.target.value })}
                    placeholder="Leadership observations on pacing, consistency, and focus areas..."
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#ff5c28] resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Employee Comments & Feedback
                  </label>
                  <textarea
                    rows={2}
                    value={form.employeeComments}
                    onChange={(e) => setForm({ ...form, employeeComments: e.target.value })}
                    placeholder="Employee feedback, reflections, and support requirements..."
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#ff5c28] resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Section C: Progress Monitoring (History) */}
            {record.checkpoints && record.checkpoints.length > 0 && (
              <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100">
                  C. Checkpoint History
                </h4>
                <div className="space-y-2">
                  {record.checkpoints.map((cp, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#042c51]">
                          Week {cp.weekNumber} Checkpoint — {formatReadableDate(cp.date)}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-purple-100 text-purple-800">
                          {cp.progress}
                        </span>
                      </div>
                      <p className="text-slate-700"><strong>Results:</strong> {cp.results}</p>
                      {cp.supervisorAssessment && (
                        <p className="text-slate-600 italic">"{cp.supervisorAssessment}"</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section D: Final Evaluation (Optional / Conclusion toggle) */}
            <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  D. Final Evaluation & Closure Recommendation
                </h4>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isFinalEvaluation}
                    onChange={(e) => setForm({ ...form, isFinalEvaluation: e.target.checked })}
                    className="accent-[#ff5c28] h-4 w-4 rounded cursor-pointer"
                  />
                  <span className="text-xs font-bold text-[#ff5c28]">
                    This is a Final PIP Evaluation
                  </span>
                </label>
              </div>

              {form.isFinalEvaluation && (
                <div className="p-3.5 rounded-xl bg-orange-50/50 border border-orange-200/70 space-y-3 animate-in fade-in duration-150">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Final Improvement Recommendation
                    </label>
                    <select
                      value={form.finalRecommendation}
                      onChange={(e) => setForm({ ...form, finalRecommendation: e.target.value })}
                      className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-bold outline-none focus:border-[#ff5c28] cursor-pointer"
                    >
                      <option value="Improvement Achieved">Improvement Achieved (Authorize PIP Closure)</option>
                      <option value="Improvement Ongoing">Improvement Ongoing (Continue Monitoring)</option>
                      <option value="Improvement Not Achieved">Improvement Not Achieved (Refer to HR/Management Review)</option>
                    </select>
                  </div>

                  <p className="text-[11px] text-slate-500">
                    * Policy Disclaimer: Final PIP closure or referral remains subject to authorized management review and applicable due process. Automatic employment separation is strictly prohibited.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-slate-100 bg-slate-50 shrink-0">
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
              Save Checkpoint Evaluation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
