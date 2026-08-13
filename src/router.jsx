// Defines all frontend routes and page mappings.
import { Route, Routes } from "react-router-dom";
import AgentsPage from "./pages/dashboard/AgentsPage";
import BoardOfDirectorsPage from "./pages/dashboard/BoardOfDirectorsPage";
import ClientPage from "./pages/dashboard/ClientPage";
import Login from "./pages/login/Login";
import OperationsManagementPage from "./pages/dashboard/OperationsManagementPage";
import SuperAdminDashboard from "./pages/dashboard/SuperAdminDashboard";
import SuperAdminHistoryLogs from "./pages/historyLogs/SuperAdminHistoryLogs";
import TeamLeaderPage from "./pages/dashboard/TeamLeaderPage";
import WfmHistoryLogs from "./pages/historyLogs/WfmHistoryLogs";
import WfmImportDataPage from "./pages/wfmImportantData/WfmImportDataPage";
import WfmViewGraphsPage from "./pages/wfmViewGraphs/WfmViewGraphsPage";
import WorkforceManagementPage from "./pages/dashboard/WorkforceManagementPage";
import SeniorOperationsManagerPage from "@/pages/dashboard/SeniorOperationsManagerPage";

const Router = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<AgentsPage />} />
      <Route path="/dashboard/agent" element={<AgentsPage />} />
      <Route path="/dashboard/agents" element={<AgentsPage />} />
      <Route path="/dashboard/wfm" element={<WorkforceManagementPage />} />
      <Route
        path="/dashboard/wfm/import-data"
        element={<WfmImportDataPage />}
      />
      <Route
        path="/dashboard/wfm/history-logs"
        element={<WfmHistoryLogs />}
      />
      <Route
        path="/dashboard/wfm/view-graphs"
        element={<WfmViewGraphsPage />}
      />
      <Route path="/dashboard/om" element={<OperationsManagementPage />} />
      <Route path="/dashboard/tl" element={<TeamLeaderPage />} />
      <Route path="/dashboard/client" element={<ClientPage />} />
      <Route path="/dashboard/bod" element={<BoardOfDirectorsPage />} />
      <Route path="/dashboard/superadmin" element={<SuperAdminDashboard />} />
      <Route path="/dashboard/som" element={<SeniorOperationsManagerPage />} />
      <Route
        path="/dashboard/superadmin/history-logs"
        element={<SuperAdminHistoryLogs />}
      />
    </Routes>
  );
};

export default Router;
