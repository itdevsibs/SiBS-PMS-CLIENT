import { PERMISSIONS } from "@/config/accessControl";
import AIWowReportPage from "../pages/wow/AIWowReportPage";
import AICallsPage from "../pages/wow/AICallsPage";
import AIEmailsPage from "../pages/wow/AIEmailsPage";
import AIQAPage from "../pages/wow/AIQAPage";
import AIOccupancyHCPage from "../pages/wow/AIOccupancyHCPage";
import AIEmployeeLedgerPage from "../pages/workforce/AIEmployeeLedgerPage";
import AIStaffingRequirementsPage from "../pages/workforce/AIStaffingRequirementsPage";
import AIOccupancyPage from "../pages/operations/AIOccupancyPage";
import AIAttendancePage from "../pages/operations/AIAttendancePage";
import AICallsReportPage from "../pages/operations/AICallsReportPage";
import AIChatReportsPage from "../pages/operations/AIChatReportsPage";
import PolicyProcessingPage from "../pages/PolicyProcessingPage";

/**
 * Route configurations for the AI Report module.
 * Fully isolated from original PMS report routes.
 */
export const aiReportRouteConfigs = [
  // WoW Report group
  {
    path: "/ai-report/view-graphs",
    permission: PERMISSIONS.VIEW_WOW_REPORT,
    reportId: "wow-report",
    category: "WoW Report",
    title: "WoW Report",
    component: AIWowReportPage,
  },
  {
    path: "/ai-report/calls",
    permission: PERMISSIONS.VIEW_WOW_REPORT,
    reportId: "calls",
    category: "WoW Report",
    title: "Calls Report",
    component: AICallsPage,
  },
  {
    path: "/ai-report/emails",
    permission: PERMISSIONS.VIEW_WOW_REPORT,
    reportId: "emails",
    category: "WoW Report",
    title: "Emails Report",
    component: AIEmailsPage,
  },
  {
    path: "/ai-report/qa",
    permission: PERMISSIONS.VIEW_WOW_REPORT,
    reportId: "qa",
    category: "WoW Report",
    title: "QA Report",
    component: AIQAPage,
  },
  {
    path: "/ai-report/occupancy-hc",
    permission: PERMISSIONS.VIEW_WOW_REPORT,
    reportId: "occupancy-hc",
    category: "WoW Report",
    title: "Occupancy & HC",
    component: AIOccupancyHCPage,
  },

  // Workforce Management group
  {
    path: "/ai-report/employee-master-data",
    permission: PERMISSIONS.VIEW_EMPLOYEE_LEDGER,
    reportId: "employee-ledger",
    category: "Workforce Management",
    title: "Employee Master Data Ledger",
    component: AIEmployeeLedgerPage,
  },
  {
    path: "/ai-report/staffing-requirements",
    permission: PERMISSIONS.WFM_STAFFING_CALENDAR,
    reportId: "staffing-requirements",
    category: "Workforce Management",
    title: "Staffing Requirements",
    component: AIStaffingRequirementsPage,
  },

  // Operations Tracking group
  {
    path: "/ai-report/occupancy",
    permission: PERMISSIONS.VIEW_OCCUPANCY,
    reportId: "occupancy",
    category: "Operations Tracking",
    title: "Occupancy",
    component: AIOccupancyPage,
  },
  {
    path: "/ai-report/attendance-sheet",
    permission: PERMISSIONS.VIEW_ATTENDANCE_SHEET,
    reportId: "attendance-sheet",
    category: "Operations Tracking",
    title: "Attendance Sheet",
    component: AIAttendancePage,
  },
  {
    path: "/ai-report/calls-report",
    permission: PERMISSIONS.VIEW_CALLS_REPORT,
    reportId: "calls-report",
    category: "Operations Tracking",
    title: "Calls Report",
    component: AICallsReportPage,
  },
  {
    path: "/ai-report/chat-reports",
    permission: PERMISSIONS.VIEW_CHAT_REPORT,
    reportId: "chat-reports",
    category: "Operations Tracking",
    title: "Chat Reports",
    component: AIChatReportsPage,
  },

  // Policy Processing
  {
    path: "/ai-report/policy-processing",
    permission: PERMISSIONS.VIEW_POLICY_PROCESSING,
    reportId: "policy-processing",
    category: "AI Report",
    title: "Policy Processing",
    component: PolicyProcessingPage,
  },
];

export {
  AIWowReportPage,
  AICallsPage,
  AIEmailsPage,
  AIQAPage,
  AIOccupancyHCPage,
  AIEmployeeLedgerPage,
  AIStaffingRequirementsPage,
  AIOccupancyPage,
  AIAttendancePage,
  AICallsReportPage,
  AIChatReportsPage,
  PolicyProcessingPage,
};
