import { Route, Routes } from "react-router-dom";
import AgentsPage from "./pages/agents/AgentsPage";
import BoardOfDirectorsPage from "./pages/board-of-directors/BoardOfDirectorsPage";
import ClientPage from "./pages/client/ClientPage";
import DashboardLayout from "./components/layout/DashboardLayout";
import Login from "./pages/login/Login";
import OperationsManagementPage from "./pages/operations-management/OperationsManagementPage";
import TeamLeaderPage from "./pages/team-leader/TeamLeaderPage";
import WorkforceManagementPage from "./pages/workforce-management/WorkforceManagementPage";

const Router = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<DashboardLayout />} />
      <Route path="/dashboard/agent" element={<AgentsPage />} />
      <Route path="/dashboard/agents" element={<AgentsPage />} />
      <Route path="/dashboard/wfm" element={<WorkforceManagementPage />} />
      <Route path="/dashboard/om" element={<OperationsManagementPage />} />
      <Route path="/dashboard/tl" element={<TeamLeaderPage />} />
      <Route path="/dashboard/client" element={<ClientPage />} />
      <Route path="/dashboard/bod" element={<BoardOfDirectorsPage />} />
      <Route path="/dashboard/superadmin" element={<DashboardLayout />} />
      <Route path="/dashboard/:role" element={<DashboardLayout />} />
      <Route path="/dashboard/:role/:module" element={<DashboardLayout />} />
    </Routes>
  );
};

export default Router;
