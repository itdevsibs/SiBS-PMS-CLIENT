// Shows WFM import, graph, and removal history logs.
import { useEffect, useMemo, useState } from "react";

import AdminSidebar from "@/components/layout/AdminSidebar";
import AppHeader from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import ConfirmationModal from "@/components/ui/confirmation-modal";
import LoadingModal from "@/components/ui/loading-modal";
import useDashboardPage from "@/hooks/useDashboardPage";
import { getAuthDisplayName } from "@/lib/auth";
import { fetchWfmHistoryLogs } from "@/lib/axios/wfm-history-logs";
import { readWfmHistoryLogs } from "@/lib/wfm-history-logs";

function formatLogTime(timestamp) {
  if (!timestamp) return "-";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

function formatLogMessage(log) {
  if (log?.message) {
    return log.message;
  }

  if (log?.action === "removed") {
    return `Removed ${log.fileName} from ${log.rawDataTitle}`;
  }

  if (log?.action === "dashboard-imported") {
    return `Imported to Work Force Management Dashboard: ${log.fileName}`;
  }

  if (log?.action === "dashboard-removed") {
    return "Removed data from Work Force Management Dashboard table";
  }

  if (log?.action === "graph-generated") {
    return `Generated graphs from Work Force Management Dashboard: ${log.fileName}`;
  }

  return `Imported ${log.fileName} to ${log.rawDataTitle}`;
}

function WfmHistoryLogs() {
  const dashboard = useDashboardPage();
  const currentUserName = dashboard.userName || getAuthDisplayName(dashboard.authUser);
  const [localLogs] = useState(() => readWfmHistoryLogs());
  const [serverLogs, setServerLogs] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [serverTotal, setServerTotal] = useState(0);
  const rowsPerPage = 10;

  useEffect(() => {
    let isMounted = true;

    fetchWfmHistoryLogs({
      date: dateFilter || undefined,
      page: currentPage,
      limit: rowsPerPage,
    })
      .then((response) => {
        if (!isMounted) return;
        if (response?.data) {
          setServerLogs(response.data);
          setServerTotal(response.pagination?.total || response.data.length);
        }
      })
      .catch((error) => {
        if (!isMounted) return;
        console.warn("Could not fetch server history logs, using local cache:", error?.message);
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [dateFilter, currentPage]);

  const fallbackFilteredLogs = useMemo(
    () => (dateFilter ? localLogs.filter((log) => log.date === dateFilter) : localLogs),
    [dateFilter, localLogs],
  );

  const displayLogs = serverLogs !== null ? serverLogs : fallbackFilteredLogs.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );

  const totalLogsCount = serverLogs !== null ? serverTotal : fallbackFilteredLogs.length;
  const totalPages = Math.max(1, Math.ceil(totalLogsCount / rowsPerPage));

  const handleDateFilterChange = (value) => {
    setDateFilter(value);
    setCurrentPage(1);
  };

  return (
    <section className="font-jakarta flex min-h-screen bg-[#eef3f7] text-sibs-primary-1">
      <AdminSidebar
        isMobileOpen={dashboard.isMobileSidebarOpen}
        modules={dashboard.modules}
        onLogoutClick={() => dashboard.setShowLogoutModal(true)}
        onMobileClose={() => dashboard.setIsMobileSidebarOpen(false)}
        userName={currentUserName}
        userRole={dashboard.authUser?.email || dashboard.authUser?.roleLabel || "User"}
      />

      <main className="min-w-0 flex-1">
        <AppHeader
          title={`${dashboard.authUser?.roleLabel || "User"} Dashboard`}
          subtitle="Performance Management System"
          onMenuClick={() => dashboard.setIsMobileSidebarOpen(true)}
          onLogoutClick={() => dashboard.setShowLogoutModal(true)}
        />

        <div className="sibs-scrollbar max-h-[calc(100vh-74px)] overflow-y-auto p-3 sm:p-4 lg:p-5">
          <section className="sibs-card sibs-page-card-in overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-sibs-tertiary-10 bg-sibs-primary-3/30 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="m-0 text-base font-bold text-sibs-primary-1">
                  History Logs
                </h3>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-sibs-tertiary-5">
                  {totalLogsCount} logs
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
                    className="h-9 rounded-lg px-3 text-sm font-semibold text-sibs-primary-2"
                  >
                    Clear
                  </button>
                ) : null}
              </div>
            </div>

            <div className="divide-y divide-sibs-tertiary-10">
              {displayLogs.length > 0 ? (
                displayLogs.map((log) => {
                  const targetLabel = [log.account, log.rawDataTitle].filter(Boolean).join(" - ");
                  const actionUser = log.userName || currentUserName;

                  return (
                    <div
                      key={log.id}
                      className="grid gap-2 bg-[#f8fbfd] px-5 py-3 md:grid-cols-[1fr_210px] md:items-center"
                    >
                      <div className="min-w-0">
                        <p className="m-0 truncate text-sm font-bold text-sibs-primary-1">
                          {formatLogMessage(log)}
                        </p>
                        <p className="mt-1 mb-0 flex flex-wrap items-center gap-1 text-xs text-sibs-tertiary-5">
                          {targetLabel ? (
                            <>
                              <span>{targetLabel}</span>
                              <span className="text-sibs-tertiary-8">•</span>
                            </>
                          ) : null}
                          <span>
                            Action taken by <span className="font-semibold text-sibs-primary-1">{actionUser}</span>
                          </span>
                        </p>
                      </div>
                      <p className="m-0 text-sm text-sibs-tertiary-5 md:text-right">
                        {formatLogTime(log.timestamp || log.createdAt)}
                      </p>
                    </div>
                  );
                })
              ) : (
                <div className="bg-[#f8fbfd] px-5 py-8 text-center text-sm text-sibs-tertiary-5">
                  {isLoading ? "Loading logs..." : "No logs found."}
                </div>
              )}
            </div>

            {totalLogsCount > 0 ? (
              <div className="flex flex-col gap-3 border-t border-sibs-tertiary-10 px-5 py-3 text-sm text-sibs-tertiary-6 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  Showing {displayLogs.length} of {totalLogsCount} logs
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 rounded-lg px-4"
                    disabled={currentPage === 1 || isLoading}
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  >
                    Previous
                  </Button>
                  <span className="text-xs font-bold text-sibs-tertiary-6">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 rounded-lg px-4"
                    disabled={currentPage === totalPages || isLoading}
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

export default WfmHistoryLogs;
