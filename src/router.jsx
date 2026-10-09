// Defines frontend routes and protects dashboard pages using centralized permissions.
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import ProtectedRoute from "./components/auth/ProtectedRoute";
import { PERMISSIONS } from "./config/accessControl";
import { useAuthAccess } from "./context/AuthAccessContext";
import AgentsPage from "./pages/dashboard/AgentsPage";
import BoardOfDirectorsPage from "./pages/dashboard/BoardOfDirectorsPage";
import ClientPage from "./pages/dashboard/ClientPage";
import SuperAdminDashboard from "./pages/dashboard/SuperAdminDashboard";
import SeniorOperationsManagerPage from "@/pages/dashboard/SeniorOperationsManagerPage";
import EmployeeMasterDataPage from "./pages/employeeMasterData/EmployeeMasterDataPage";
import ViewGraphsPage from "./pages/graphs/viewGraphsPage";
import InterfaceAccessHistory from "./pages/historyLogs/InterfaceAccessHistory";
import AttendanceSheetPage from "./pages/attendanceSheet/AttendanceSheetPage";
import CallsReportPage from "./pages/callsReport/CallsReportPage";
import Login from "./pages/login/Login";
import OccupancyPage from "./pages/occupancy/OccupancyPage";
import OperationsManagementPage from "./pages/operationsManager/OperationsManagementPage";
import TaskOrderLedger from "./pages/TaskOrderLedger/TaskOrderLedger";
import TeamLeaderPage from "./pages/teamLeader/TeamLeaderPage";
import WfmHistoryLogs from "./pages/workForceManagement/wfmHistoryLogs";
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
      <Route path="/dashboard/wfm/task-order-ledger" element={<LegacyRedirect to="/task-order-ledger" />} />
      <Route path="/dashboard/wfm/skills-ledger" element={<LegacyRedirect to="/task-order-ledger" />} />
      <Route path="/dashboard/employee-master-data" element={<LegacyRedirect to="/employee-master-data" />} />
      <Route path="/dashboard/masterdata" element={<LegacyRedirect to="/employee-master-data" />} />
      <Route path="/dashboard/occupancy" element={<LegacyRedirect to="/occupancy" />} />
      <Route path="/dashboard/wfm/occupancy" element={<LegacyRedirect to="/occupancy" />} />

      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
};

export default Router;
