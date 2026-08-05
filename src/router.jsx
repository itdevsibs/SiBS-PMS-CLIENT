import { Route, Routes } from "react-router-dom";
import DashboardPage from "./pages/dashboard/DashboardPage";
import EmployeePerformance from "./pages/employee-performance/EmployeePerformance";
import Login from "./pages/login/Login";

const Router = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/dashboard/:role" element={<DashboardPage />} />
      <Route path="/dashboard/:role/:module" element={<DashboardPage />} />
      <Route path="/employee-performance" element={<EmployeePerformance />} />
    </Routes>
  );
};

export default Router;
