import { Route, Routes } from "react-router-dom";
import EmployeePerformance from "./pages/employee-performance/EmployeePerformance";
import Login from "./pages/login/Login";
import RoleDashboard from "./pages/role-dashboard/RoleDashboard";

const Router = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<RoleDashboard />} />
      <Route path="/dashboard/:role" element={<RoleDashboard />} />
      <Route path="/employee-performance" element={<EmployeePerformance />} />
    </Routes>
  );
};

export default Router;
