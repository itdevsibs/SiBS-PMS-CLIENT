import { Route, Routes } from "react-router-dom";
import AdminDashboard from "./pages/admin-dashboard/AdminDashboard";
import EmployeePerformance from "./pages/employee-performance/EmployeePerformance";
import Login from "./pages/login/Login";

const Router = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
      <Route path="/employee-performance" element={<EmployeePerformance />} />
    </Routes>
  );
};

export default Router;
