// Shows super admin interface access history logs.
import { useEffect, useMemo, useState } from "react";

import AdminSidebar from "@/components/layout/AdminSidebar";
import AppHeader from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import ConfirmationModal from "@/components/ui/confirmation-modal";
import LoadingModal from "@/components/ui/loading-modal";
import useDashboardPage from "@/hooks/useDashboardPage";
import api from "@/lib/axios/api-template";

function formatLogTime(timestamp, log) {
  if (log?.formattedTime) {
    return log.formattedTime;
  }
  if (!timestamp) return "-";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

function SuperAdminHistoryLogs() {
  const dashboard = useDashboardPage();
  const [logs, setLogs] = useState([]);
  const [dateFilter, setDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const rowsPerPage = 10;
  const userName = dashboard.authUser?.name || dashboard.authUser?.username || "User";

  const filteredLogs = useMemo(
    () =>
      dateFilter
        ? logs.filter((log) => log.date === dateFilter)
        : logs,
    [dateFilter, logs],
  );
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / rowsPerPage));
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );

  const formatLogMessage = (log) => {
    if (!log?.employeeId) {
      return log?.message || "-";
    }

    const action = log.action || (String(log.message || "").includes("removed") ? "removed" : "added");
    const direction = action === "removed" ? "from" : "to";

    return `Employee ID ${log.employeeId} ${action} ${direction} ${log.interfaceName}`;
  };

  const handleDateFilterChange = (value) => {
    setDateFilter(value);
    setCurrentPage(1);
  };

  useEffect(() => {
    const loadLogs = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await api.get("/super-admin/interface-access");
        setLogs(response.data?.logs || []);
      } catch {
        setError("Unable to load history logs.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadLogs();
  }, []);

  return (
    <section className="font-jakarta flex h-screen max-h-[100dvh] min-h-screen bg-[#eef3f7] text-sibs-primary-1 overflow-hidden">
      <AdminSidebar
        isMobileOpen={dashboard.isMobileSidebarOpen}
        modules={dashboard.modules}
        onLogoutClick={() => dashboard.setShowLogoutModal(true)}
        onMobileClose={() => dashboard.setIsMobileSidebarOpen(false)}
        userName={userName}
        userRole={dashboard.authUser?.email || dashboard.authUser?.roleLabel || "User"}
      />

      <main className="min-w-0 flex-1 flex flex-col h-full overflow-hidden">
        <AppHeader
          title={`${dashboard.authUser?.roleLabel || "User"} Dashboard`}
          subtitle="Performance Management System"
          onMenuClick={() => dashboard.setIsMobileSidebarOpen(true)}
          onLogoutClick={() => dashboard.setShowLogoutModal(true)}
        />

        <div className="sibs-scrollbar flex-1 overflow-y-auto p-3 sm:p-4 lg:p-5 pb-8 sm:pb-6">
      <section className="sibs-card sibs-page-card-in overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-sibs-tertiary-10 bg-sibs-primary-3/30 px-4 py-3 sm:px-5 sm:py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="m-0 text-base font-bold text-sibs-primary-1">
            History Logs
          </h3>
          <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-sibs-tertiary-5 shadow-xs">
            {filteredLogs.length} logs
          </span>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="date"
            value={dateFilter}
            onChange={(event) => handleDateFilterChange(event.target.value)}
            className="form-input h-9 rounded-lg py-0 sm:w-52"
          />
          {dateFilter ? (
            <button
              type="button"
              onClick={() => handleDateFilterChange("")}
              className="h-9 rounded-lg px-3 text-sm font-semibold text-sibs-primary-2 cursor-pointer"
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="border-b border-sibs-danger/20 bg-sibs-danger/10 px-5 py-2 text-sm font-semibold text-sibs-danger">
          {error}
        </div>
      ) : null}

      <div className="divide-y divide-sibs-tertiary-10">
        {isLoading ? (
          <div className="bg-[#f8fbfd] px-5 py-8 text-center text-sm text-sibs-tertiary-5">
            Loading history logs...
          </div>
        ) : paginatedLogs.length > 0 ? (
          paginatedLogs.map((log) => (
            <div key={log.id} className="flex flex-col gap-1 bg-[#f8fbfd] px-4 py-3 transition hover:bg-white/90 sm:px-5 sm:py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="min-w-0 flex-1 break-words">
                <p className="m-0 text-sm font-bold text-sibs-primary-1 leading-relaxed">
                  {formatLogMessage(log)}
                </p>
              </div>
              <p className="m-0 shrink-0 text-xs text-sibs-tertiary-5 sm:text-sm sm:text-right">
                {formatLogTime(log.timestamp, log)}
              </p>
            </div>
          ))
        ) : (
          <div className="bg-[#f8fbfd] px-5 py-8 text-center text-sm text-sibs-tertiary-5">
            No logs found.
          </div>
        )}
      </div>

      {!isLoading && filteredLogs.length > 0 ? (
        <div className="flex flex-col gap-3 border-t border-sibs-tertiary-10 px-4 py-3 text-sm text-sibs-tertiary-6 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <span className="text-center sm:text-left">
            Showing {paginatedLogs.length} of {filteredLogs.length} logs
          </span>
          <div className="flex items-center justify-center gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="h-8 rounded-lg px-3 text-xs sm:h-9 sm:px-4 sm:text-sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            >
              Previous
            </Button>
            <span className="text-xs font-bold text-sibs-tertiary-6 whitespace-nowrap">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              className="h-8 rounded-lg px-3 text-xs sm:h-9 sm:px-4 sm:text-sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
      </section>
        </div>
      </main>

      <ConfirmationModal
        isOpen={dashboard.showLogoutModal}
        title="Confirm logout"
        message="Are you sure you want to logout?"
        cancelText="Cancel"
        confirmText="Logout"
        onCancel={() => dashboard.setShowLogoutModal(false)}
        onConfirm={dashboard.handleLogout}
        tone="neutral"
      />

      <LoadingModal
        isOpen={dashboard.isLoggingOut}
        title="Logging out"
        message="Please wait while we end your session."
      />
    </section>
  );
}

export default SuperAdminHistoryLogs;
