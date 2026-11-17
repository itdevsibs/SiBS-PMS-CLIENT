// Defines frontend routes and protects dashboard pages using centralized permissions.
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import ProtectedRoute from "./components/common/auth/ProtectedRoute";
import AiReportWrapper from "./components/modules/ai-report/AiReportWrapper";
import { PERMISSIONS } from "./config/accessControl";
import { useAuthAccess } from "./context/AuthAccessContext";
import AIAttendancePage from "./modules/ai-report/pages/operations/AIAttendancePage";
import AICallsReportPage from "./modules/ai-report/pages/operations/AICallsReportPage";
import AIChatReportsPage from "./modules/ai-report/pages/operations/AIChatReportsPage";
import AIOccupancyPage from "./modules/ai-report/pages/operations/AIOccupancyPage";
import AIEmployeeLedgerPage from "./modules/ai-report/pages/workforce/AIEmployeeLedgerPage";
import AIStaffingRequirementsPage from "./modules/ai-report/pages/workforce/AIStaffingRequirementsPage";
import AIWowReportPage from "./modules/ai-report/pages/wow/AIWowReportPage";
import AgentsPage from "./pages/dashboard/AgentsPage";
import BoardOfDirectorsPage from "./pages/dashboard/BoardOfDirectorsPage";
import ClientPage from "./pages/dashboard/ClientPage";
import SuperAdminDashboard from "./pages/dashboard/SuperAdminDashboard";
import SeniorOperationsManagerPage from "@/pages/dashboard/SeniorOperationsManagerPage";
import EmployeeMasterDataPage from "./pages/employeeMasterData/EmployeeMasterDataPage";
import ViewGraphsPage from "./pages/graphs/ViewGraphsPage";
import InterfaceAccessHistory from "./pages/historyLogs/InterfaceAccessHistory";
import AttendanceSheetPage from "./pages/attendanceSheet/AttendanceSheetPage";
import CallsReportPage from "./pages/callsReport/CallsReportPage";
import ChatReportsPage from "./pages/chatReports/ChatReportsPage";
import FrontStepsDashboard from "./pages/frontSteps/FrontStepsDashboard";
import FrontStepsAiSummaryPage from "./modules/frontsteps-ai-report/pages/FrontStepsAiSummaryPage";
import FrontStepsAiAccountKpiPage from "./modules/frontsteps-ai-report/pages/FrontStepsAiAccountKpiPage";
import FrontStepsAiPmpPipPage from "./modules/frontsteps-ai-report/pages/FrontStepsAiPmpPipPage";
import FrontStepsAiPolicyProcessingPage from "./modules/frontsteps-ai-report/pages/FrontStepsAiPolicyProcessingPage";
import Login from "./pages/login/Login";
import OccupancyPage from "./pages/occupancy/OccupancyPage";
import PolicyProcessingPage from "./pages/policyProcessing/PolicyProcessingPage";
import OperationsManagementPage from "./pages/operationsManager/OperationsManagementPage";
import TaskOrderLedger from "./pages/TaskOrderLedger/TaskOrderLedger";
import UsVisaKpiTargetSettingsPage from "./pages/usVisaKpiConfig/UsVisaKpiTargetSettingsPage";
import StaffingRequirementsPage from "./pages/workForceManagement/StaffingRequirementsPage";
import TeamLeaderPage from "./pages/teamLeader/TeamLeaderPage";
import WfmHistoryLogs from "./pages/workForceManagement/WfmHistoryLogs";
import WfmImportDataPage from "./pages/workForceManagement/WfmImportDataPage";
import WfmImportedRepository from "./pages/workForceManagement/WfmImportedRepository";

function Protected({ permission, children }) {
  return (
    <ProtectedRoute permission={permission}>
      {children}
    </ProtectedRoute>
  );
}

function HomeRedirect() {
  const { authUser, homeRoute } = useAuthAccess();

  return (
    <Navigate
      to={authUser ? homeRoute : "/login"}
      replace
    />
  );
}

function LegacyRedirect({ to }) {
  const location = useLocation();

  return (
    <Navigate
      to={`${to}${location.search}${location.hash}`}
      replace
    />
  );
}

const Router = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/dashboard" element={<HomeRedirect />} />

      {/* Canonical feature routes */}
      <Route
        path="/employee-master-data"
        element={(
          <Protected permission={PERMISSIONS.VIEW_EMPLOYEE_LEDGER}>
            <EmployeeMasterDataPage />
          </Protected>
        )}
      />
      <Route
        path="/task-order-ledger"
        element={(
          <Protected permission={PERMISSIONS.WFM_TASK_ORDER_LEDGER}>
            <TaskOrderLedger />
          </Protected>
        )}
      />
      <Route
        path="/us-visa-kpi-configuration"
        element={(
          <Protected permission={PERMISSIONS.US_VISA_KPI_TARGET_SETTINGS}>
            <UsVisaKpiTargetSettingsPage />
          </Protected>
        )}
      />
      <Route
        path="/staffing-requirements"
        element={(
          <Protected permission={PERMISSIONS.WFM_STAFFING_CALENDAR}>
            <StaffingRequirementsPage />
          </Protected>
        )}
      />
      <Route
        path="/import-data"
        element={(
          <Protected permission={PERMISSIONS.WFM_IMPORT_DATA}>
            <WfmImportDataPage />
          </Protected>
        )}
      />
      <Route
        path="/import-repository"
        element={(
          <Protected permission={PERMISSIONS.WFM_IMPORT_REPOSITORY}>
            <WfmImportedRepository />
          </Protected>
        )}
      />
      <Route
        path="/history"
        element={(
          <Protected permission={PERMISSIONS.WFM_HISTORY_LOGS}>
            <WfmHistoryLogs />
          </Protected>
        )}
      />
      <Route
        path="/view-graphs"
        element={(
          <Protected permission={PERMISSIONS.VIEW_WOW_REPORT}>
            <ViewGraphsPage />
          </Protected>
        )}
      />
      <Route
        path="/occupancy"
        element={(
          <Protected permission={PERMISSIONS.VIEW_OCCUPANCY}>
            <OccupancyPage />
          </Protected>
        )}
      />
      <Route
        path="/attendance-sheet"
        element={(
          <Protected permission={PERMISSIONS.VIEW_ATTENDANCE_SHEET}>
            <AttendanceSheetPage />
          </Protected>
        )}
      />
      <Route
        path="/calls-report"
        element={(
          <Protected permission={PERMISSIONS.VIEW_CALLS_REPORT}>
            <CallsReportPage />
          </Protected>
        )}
      />
      <Route
        path="/chat-reports"
        element={(
          <Protected permission={PERMISSIONS.VIEW_CHAT_REPORT}>
            <ChatReportsPage />
          </Protected>
        )}
      />
      <Route
        path="/frontsteps"
        element={(
          <Protected permission={PERMISSIONS.VIEW_FRONTSTEPS}>
            <FrontStepsDashboard />
          </Protected>
        )}
      />
      <Route
        path="/frontsteps/ai-report"
        element={<Navigate to="/frontsteps/ai-report/summary" replace />}
      />
      <Route
        path="/frontsteps/ai-report/summary"
        element={(
          <Protected permission={PERMISSIONS.VIEW_FRONTSTEPS}>
            <FrontStepsAiSummaryPage />
          </Protected>
        )}
      />
      <Route
        path="/frontsteps/ai-report/account-kpi"
        element={(
          <Protected permission={PERMISSIONS.VIEW_FRONTSTEPS}>
            <FrontStepsAiAccountKpiPage />
          </Protected>
        )}
      />
      <Route
        path="/frontsteps/ai-report/pmp-pip"
        element={(
          <Protected permission={PERMISSIONS.VIEW_FRONTSTEPS}>
            <FrontStepsAiPmpPipPage />
          </Protected>
        )}
      />
      <Route
        path="/frontsteps/ai-report/policy-processing"
        element={(
          <Protected permission={PERMISSIONS.VIEW_FRONTSTEPS}>
            <FrontStepsAiPolicyProcessingPage />
          </Protected>
        )}
      />

      {/* Dedicated AI Report feature routes wrapped for future Hermes AI integration */}
      <Route
        path="/ai-report/view-graphs"
        element={(
          <Protected permission={PERMISSIONS.VIEW_WOW_REPORT}>
            <AiReportWrapper reportId="wow-report" category="WoW Report" title="WoW Report">
              <AIWowReportPage />
            </AiReportWrapper>
          </Protected>
        )}
      />
      <Route
        path="/ai-report/employee-master-data"
        element={(
          <Protected permission={PERMISSIONS.VIEW_EMPLOYEE_LEDGER}>
            <AiReportWrapper reportId="employee-ledger" category="Workforce Management" title="Employee Master Data Ledger">
              <AIEmployeeLedgerPage />
            </AiReportWrapper>
          </Protected>
        )}
      />
      <Route
        path="/ai-report/staffing-requirements"
        element={(
          <Protected permission={PERMISSIONS.WFM_STAFFING_CALENDAR}>
            <AiReportWrapper reportId="staffing-requirements" category="Workforce Management" title="Staffing Requirements">
              <AIStaffingRequirementsPage />
            </AiReportWrapper>
          </Protected>
        )}
      />
      <Route
        path="/ai-report/occupancy"
        element={(
          <Protected permission={PERMISSIONS.VIEW_OCCUPANCY}>
            <AiReportWrapper reportId="occupancy" category="Operations Tracking" title="Occupancy">
              <AIOccupancyPage />
            </AiReportWrapper>
          </Protected>
        )}
      />
      <Route
        path="/ai-report/attendance-sheet"
        element={(
          <Protected permission={PERMISSIONS.VIEW_ATTENDANCE_SHEET}>
            <AiReportWrapper reportId="attendance-sheet" category="Operations Tracking" title="Attendance Sheet">
              <AIAttendancePage />
            </AiReportWrapper>
          </Protected>
        )}
      />
      <Route
        path="/ai-report/calls-report"
        element={(
          <Protected permission={PERMISSIONS.VIEW_CALLS_REPORT}>
            <AiReportWrapper reportId="calls-report" category="Operations Tracking" title="Calls Report">
              <AICallsReportPage />
            </AiReportWrapper>
          </Protected>
        )}
      />
      <Route
        path="/ai-report/chat-reports"
        element={(
          <Protected permission={PERMISSIONS.VIEW_CHAT_REPORT}>
            <AiReportWrapper reportId="chat-reports" category="Operations Tracking" title="Chat Reports">
              <AIChatReportsPage />
            </AiReportWrapper>
          </Protected>
        )}
      />
      <Route
        path="/ai-report/policy-processing"
        element={(
          <Protected permission={PERMISSIONS.VIEW_POLICY_PROCESSING}>
            <AiReportWrapper reportId="policy-processing" category="AI Report" title="Policy Processing">
              <PolicyProcessingPage />
            </AiReportWrapper>
          </Protected>
        )}
      />

      {/* Canonical role landing routes */}
      <Route
        path="/agent"
        element={(
          <Protected permission={PERMISSIONS.VIEW_OWN_PERFORMANCE}>
            <AgentsPage />
          </Protected>
        )}
      />
      <Route
        path="/om"
        element={(
          <Protected permission={PERMISSIONS.VIEW_OPERATIONS_PERFORMANCE}>
            <OperationsManagementPage />
          </Protected>
        )}
      />
      <Route
        path="/tl"
        element={(
          <Protected permission={PERMISSIONS.VIEW_TEAM_PERFORMANCE}>
            <TeamLeaderPage />
          </Protected>
        )}
      />
      <Route
        path="/client"
        element={(
          <Protected permission={PERMISSIONS.CLIENT_DASHBOARD}>
            <ClientPage />
          </Protected>
        )}
      />
      <Route
        path="/bod"
        element={(
          <Protected permission={PERMISSIONS.VIEW_WOW_REPORT}>
            <BoardOfDirectorsPage />
          </Protected>
        )}
      />
      <Route
        path="/superadmin"
        element={(
          <Protected permission={PERMISSIONS.SUPER_ADMIN_ACCESS}>
            <SuperAdminDashboard />
          </Protected>
        )}
      />
      <Route
        path="/som"
        element={(
          <Protected permission={PERMISSIONS.VIEW_WOW_REPORT}>
            <SeniorOperationsManagerPage />
          </Protected>
        )}
      />
      <Route
        path="/interface-access-history"
        element={(
          <Protected permission={PERMISSIONS.SUPER_ADMIN_HISTORY}>
            <InterfaceAccessHistory />
          </Protected>
        )}
      />

      {/* Legacy URLs remain as compatibility redirects and preserve query/hash. */}
      <Route path="/dashboard/agent" element={<LegacyRedirect to="/agent" />} />
      <Route path="/dashboard/agents" element={<LegacyRedirect to="/agent" />} />
      <Route path="/dashboard/tl" element={<LegacyRedirect to="/tl" />} />
      <Route path="/dashboard/om" element={<LegacyRedirect to="/om" />} />
      <Route path="/dashboard/client" element={<LegacyRedirect to="/client" />} />
      <Route path="/dashboard/bod" element={<LegacyRedirect to="/bod" />} />
      <Route path="/dashboard/superadmin" element={<LegacyRedirect to="/superadmin" />} />
      <Route path="/dashboard/som" element={<LegacyRedirect to="/som" />} />
      <Route path="/dashboard/superadmin/history-logs" element={<LegacyRedirect to="/interface-access-history" />} />
      <Route path="/dashboard/wfm" element={<LegacyRedirect to="/view-graphs" />} />
      <Route path="/dashboard/wfm/view-graphs" element={<LegacyRedirect to="/view-graphs" />} />
      <Route path="/dashboard/wfm/import-data" element={<LegacyRedirect to="/import-data" />} />
      <Route path="/dashboard/wfm/import-repository" element={<LegacyRedirect to="/import-repository" />} />
      <Route path="/dashboard/wfm/history" element={<LegacyRedirect to="/history" />} />
      <Route path="/dashboard/wfm/history-logs" element={<LegacyRedirect to="/history" />} />
      <Route path="/dashboard/wfm/staffing-requirements" element={<LegacyRedirect to="/staffing-requirements" />} />
      <Route path="/dashboard/wfm/task-order-ledger" element={<LegacyRedirect to="/task-order-ledger" />} />
      <Route path="/dashboard/wfm/skills-ledger" element={<LegacyRedirect to="/task-order-ledger" />} />
      <Route path="/dashboard/employee-master-data" element={<LegacyRedirect to="/employee-master-data" />} />
      <Route path="/dashboard/masterdata" element={<LegacyRedirect to="/employee-master-data" />} />
      <Route path="/dashboard/occupancy" element={<LegacyRedirect to="/occupancy" />} />
      <Route path="/dashboard/wfm/occupancy" element={<LegacyRedirect to="/occupancy" />} />

      {/* AI Report aliases & compatibility redirects */}
      <Route path="/ai-report" element={<LegacyRedirect to="/ai-report/view-graphs" />} />
      <Route path="/ai-report/wow-report" element={<LegacyRedirect to="/ai-report/view-graphs" />} />
      <Route path="/ai-report/calls" element={<LegacyRedirect to="/ai-report/view-graphs?section=calls" />} />
      <Route path="/ai-report/emails" element={<LegacyRedirect to="/ai-report/view-graphs?section=emails" />} />
      <Route path="/ai-report/qa" element={<LegacyRedirect to="/ai-report/view-graphs?section=qa" />} />
      <Route path="/ai-report/occupancy-hc" element={<LegacyRedirect to="/ai-report/view-graphs?section=occupancy" />} />
      <Route path="/ai-report/employee-ledger" element={<LegacyRedirect to="/ai-report/employee-master-data" />} />
      <Route path="/ai-report/policy" element={<LegacyRedirect to="/ai-report/policy-processing" />} />
      <Route path="/ai-report/policies" element={<LegacyRedirect to="/ai-report/policy-processing" />} />

      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
};

export default Router;
