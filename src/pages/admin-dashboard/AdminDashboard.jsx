import { useEffect, useState } from "react";
import { Clock3, Search, Settings, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

import AppHeader from "@/components/layout/AppHeader";
import AdminSidebar from "@/components/layout/AdminSidebar";
import ConfirmationModal from "@/components/ui/confirmation-modal";
import LoadingModal from "@/components/ui/loading-modal";

import {
  activityItems,
  chartCards,
  performanceRows,
  sidebarModules,
  stats,
} from "./admin-dashboard.data";

const ChartPreview = ({ type, values }) => {
  if (type === "bar") {
    return (
      <div className="flex h-32 items-end gap-3 border-b border-sibs-tertiary-10 px-3 pt-6">
        {values.map((value, index) => (
          <div
            key={`${value}-${index}`}
            className="flex flex-1 flex-col items-center gap-3"
          >
            <div
              className="w-full rounded-t-md bg-sibs-tertiary-4"
              style={{ height: `${value}%` }}
            />
            <span className="text-xs text-sibs-tertiary-5">
              {"MTWTFSS"[index]}
            </span>
          </div>
        ))}
      </div>
    );
  }

  const points = values
    .map((value, index) => `${index * 10},${90 - value}`)
    .join(" ");

  return (
    <div className="h-32 border-b border-sibs-tertiary-10 pt-6">
      <svg
        className="h-full w-full overflow-visible"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <polyline
          fill="none"
          points={points}
          stroke="var(--sibs-tertiary-4)"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
        {values.map((value, index) => (
          <circle
            key={`${value}-${index}`}
            cx={index * 10}
            cy={90 - value}
            fill="var(--sibs-tertiary-4)"
            r="1.5"
          />
        ))}
      </svg>
    </div>
  );
};

const AdminDashboard = () => {
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
          title="Admin Dashboard"
          subtitle="Performance Management System"
          onMenuClick={() => setIsMobileSidebarOpen(true)}
        />

        <div className="sibs-scrollbar max-h-[calc(100vh-74px)] overflow-y-auto p-4 sm:p-5 lg:p-6">
          <div className="sibs-page-header-in mb-6 flex justify-end">
            <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
              <div className="relative min-w-0 sm:w-[280px]">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sibs-tertiary-5"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  placeholder="Type here..."
                  className="form-input h-10 rounded-lg pl-10"
                />
              </div>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-sibs-tertiary-9 bg-white text-sibs-primary-1 transition hover:bg-sibs-tertiary-4 hover:text-white"
                aria-label="Settings"
              >
                <Settings className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((item) => (
              <div key={item.label} className="sibs-card sibs-page-card-in p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="m-0 text-sm font-medium text-sibs-tertiary-5">
                      {item.label}
                    </p>
                    <p className="mt-1 mb-0 text-2xl font-bold text-sibs-primary-1">
                      {item.value}
                    </p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-sibs-primary-1 text-white shadow-sm">
                    <item.icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                </div>
                <div className="mt-4 border-t border-sibs-tertiary-10 pt-3">
                  <p className="m-0 text-sm text-sibs-tertiary-5">
                    <span className="font-bold text-sibs-success">
                      {item.change}
                    </span>{" "}
                    {item.note}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-3">
            {chartCards.map((chart) => {
              const Icon = chart.icon;

              return (
                <div key={chart.title} className="sibs-card sibs-page-card-in p-4">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <p className="m-0 text-base font-bold text-sibs-primary-1">
                        {chart.title}
                      </p>
                      <p className="mt-1 mb-0 text-sm text-sibs-tertiary-5">
                        {chart.subtitle}
                      </p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sibs-primary-1 text-white">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                  </div>
                  <ChartPreview type={chart.type} values={chart.values} />
                  <p className="mt-4 mb-0 flex items-center gap-2 text-sm text-sibs-tertiary-5">
                    <Clock3 className="h-4 w-4" aria-hidden="true" />
                    {chart.footer}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-[1.7fr_0.8fr]">
            <div className="sibs-card sibs-page-card-in overflow-hidden">
              <div className="border-b border-sibs-tertiary-10 px-5 py-4">
                <p className="m-0 text-base font-bold text-sibs-primary-1">
                  Performance Projects
                </p>
                <p className="mt-1 mb-0 text-sm text-sibs-tertiary-5">
                  30 completed this month
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-left">
                  <thead className="text-xs uppercase text-sibs-tertiary-5">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Department</th>
                      <th className="px-5 py-3 font-semibold">Owner</th>
                      <th className="px-5 py-3 font-semibold">Score</th>
                      <th className="px-5 py-3 font-semibold">Completion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performanceRows.map((row) => (
                      <tr
                        key={row.name}
                        className="border-t border-sibs-tertiary-10 transition hover:bg-sibs-primary-3"
                      >
                        <td className="px-5 py-4 text-sm font-semibold text-sibs-primary-1">
                          {row.name}
                        </td>
                        <td className="px-5 py-4 text-sm text-sibs-tertiary-5">
                          {row.owner}
                        </td>
                        <td className="px-5 py-4 text-sm font-semibold text-sibs-primary-1">
                          {row.score}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className="w-10 text-sm text-sibs-tertiary-5">
                              {row.progress}%
                            </span>
                            <div className="h-1.5 w-28 overflow-hidden rounded-full bg-sibs-tertiary-10">
                              <div
                                className="h-full rounded-full bg-sibs-tertiary-4"
                                style={{ width: `${row.progress}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="sibs-card sibs-page-card-in p-5">
              <div className="mb-5 flex items-center gap-3">
                <div className="sibs-icon-box h-10 w-10">
                  <Users className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="m-0 text-base font-bold text-sibs-primary-1">
                    Activity Overview
                  </p>
                  <p className="m-0 text-xs text-sibs-tertiary-5">
                    24% this month
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                {activityItems.map((item) => (
                  <div key={item.title} className="flex gap-3">
                    <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-sibs-primary-2" />
                    <div>
                      <p className="m-0 text-sm font-bold text-sibs-primary-1">
                        {item.title}
                      </p>
                      <p className="mt-1 mb-0 text-xs font-semibold uppercase text-sibs-tertiary-5">
                        {item.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <ConfirmationModal
        isOpen={showLogoutModal}
        title="Confirm logout"
        message="Are you sure you want to logout from the admin dashboard?"
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

export default AdminDashboard;
