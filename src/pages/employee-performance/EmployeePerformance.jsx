import { useEffect, useState } from "react";
import { Search, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

import AppHeader from "@/components/layout/AppHeader";
import AdminSidebar from "@/components/layout/AdminSidebar";
import ConfirmationModal from "@/components/ui/confirmation-modal";
import LoadingModal from "@/components/ui/loading-modal";

import { sidebarModules } from "../admin-dashboard/admin-dashboard.data";
import {
  employeeRows,
  focusAreas,
  performanceStats,
} from "./employee-performance.data";

const EmployeePerformance = () => {
  const navigate = useNavigate();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("pms-auth-user") !== "admin") {
      navigate("/");
    }
  }, [navigate]);

  const handleLogout = () => {
    setShowLogoutModal(false);
    setIsLoggingOut(true);

    window.setTimeout(() => {
      localStorage.removeItem("pms-auth-user");
      navigate("/");
    }, 2500);
  };

  return (
    <section className="font-jakarta flex min-h-screen bg-sibs-tertiary-10 text-sibs-primary-1">
      <AdminSidebar
        isMobileOpen={isMobileSidebarOpen}
        modules={sidebarModules}
        onLogoutClick={() => setShowLogoutModal(true)}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
        userName="admin"
      />

      <main className="min-w-0 flex-1">
        <AppHeader
          title="Employee Performance"
          subtitle="Performance Management System"
          onMenuClick={() => setIsMobileSidebarOpen(true)}
        />

        <div className="sibs-scrollbar max-h-[calc(100vh-74px)] overflow-y-auto p-4 sm:p-5 lg:p-6">
          <div className="mb-6 flex justify-end">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative min-w-0 sm:w-[280px]">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sibs-tertiary-5"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  placeholder="Search employee..."
                  className="form-input h-10 rounded-lg pl-10"
                />
              </div>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-sibs-tertiary-9 bg-white text-sibs-primary-1 transition hover:bg-sibs-tertiary-4 hover:text-white"
                aria-label="Performance settings"
              >
                <Settings className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {performanceStats.map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.label} className="sibs-card p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="m-0 text-sm font-medium text-sibs-tertiary-5">
                        {item.label}
                      </p>
                      <p className="mt-1 mb-0 text-2xl font-bold text-sibs-primary-1">
                        {item.value}
                      </p>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-sibs-primary-1 text-white">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                  </div>
                  <p className="mt-4 mb-0 border-t border-sibs-tertiary-10 pt-3 text-sm text-sibs-tertiary-5">
                    {item.note}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-[1.5fr_0.8fr]">
            <div className="sibs-card overflow-hidden">
              <div className="border-b border-sibs-tertiary-10 px-5 py-4">
                <p className="m-0 text-base font-bold text-sibs-primary-1">
                  Employee Scorecard
                </p>
                <p className="mt-1 mb-0 text-sm text-sibs-tertiary-5">
                  Current performance cycle
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] border-collapse text-left">
                  <thead className="text-xs uppercase text-sibs-tertiary-5">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Employee</th>
                      <th className="px-5 py-3 font-semibold">Department</th>
                      <th className="px-5 py-3 font-semibold">Role</th>
                      <th className="px-5 py-3 font-semibold">Score</th>
                      <th className="px-5 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employeeRows.map((row) => (
                      <tr
                        key={row.employee}
                        className="border-t border-sibs-tertiary-10 transition hover:bg-sibs-primary-3"
                      >
                        <td className="px-5 py-4 text-sm font-bold text-sibs-primary-1">
                          {row.employee}
                        </td>
                        <td className="px-5 py-4 text-sm text-sibs-tertiary-5">
                          {row.department}
                        </td>
                        <td className="px-5 py-4 text-sm text-sibs-tertiary-5">
                          {row.role}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className="w-9 text-sm font-semibold text-sibs-primary-1">
                              {row.score}
                            </span>
                            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-sibs-tertiary-10">
                              <div
                                className="h-full rounded-full bg-sibs-tertiary-4"
                                style={{ width: `${row.score}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-full bg-sibs-primary-3 px-3 py-1 text-xs font-bold text-sibs-primary-1">
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="sibs-card p-5">
              <p className="m-0 text-base font-bold text-sibs-primary-1">
                Focus Areas
              </p>
              <p className="mt-1 mb-5 text-sm text-sibs-tertiary-5">
                Key review dimensions
              </p>

              <div className="space-y-5">
                {focusAreas.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div key={item.label}>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Icon
                            className="h-4 w-4 text-sibs-primary-1"
                            aria-hidden="true"
                          />
                          <span className="text-sm font-semibold text-sibs-primary-1">
                            {item.label}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-sibs-primary-1">
                          {item.value}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-sibs-tertiary-10">
                        <div
                          className="h-full rounded-full bg-sibs-primary-1"
                          style={{ width: `${item.value}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>

      <ConfirmationModal
        isOpen={showLogoutModal}
        title="Confirm logout"
        message="Are you sure you want to logout from the employee performance module?"
        cancelText="Cancel"
        confirmText="Logout"
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        tone="neutral"
      />

      <LoadingModal
        isOpen={isLoggingOut}
        title="Logging out"
        message="Please wait while we end your session."
      />
    </section>
  );
};

export default EmployeePerformance;
