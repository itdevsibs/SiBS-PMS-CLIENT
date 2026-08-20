// Database-backed WFM History Logs page.
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, Trash2 } from "lucide-react";

import AdminSidebar from "@/components/layout/AdminSidebar";
import AppHeader from "@/components/layout/AppHeader";
import AppModal from "@/components/ui/app-modal";
import { Button } from "@/components/ui/button";
import ConfirmationModal from "@/components/ui/confirmation-modal";
import LoadingModal from "@/components/ui/loading-modal";
import useDashboardPage from "@/hooks/useDashboardPage";
import {
  clearWfmHistoryLogs,
  fetchWfmHistoryLogs,
} from "@/lib/axios/wfm-history-logs";

function getLogActionText(log) {
  if (log.action === "login") return "logged in";
  if (log.action === "logout") return "logged out";
  if (log.message === "logged-in") return "logged in";
  if (log.message === "logged-out") return "logged out";
  if (log.message === "login") return "logged in";
  if (log.message === "logout") return "logged out";

  return log.message || log.action || "performed an action";
}

function isAuthLog(log) {
  const actionText = getLogActionText(log);

  return actionText === "logged in" || actionText === "logged out";
}

function formatHistoryTime(value) {
  return String(value || "-").replace(/,\s+(\d{1,2}:\d{2}\s+[AP]M)$/i, " - $1");
}

function getHighlightedActionMessage(message) {
  const match = String(message || "").match(/^(Imported|Import|Removed|Remove)\b/i);

  if (!match) {
    return <span>{message}</span>;
  }

  const [actionWord] = match;
  const rest = String(message).slice(actionWord.length).trimStart();
  const actionColorClass = /^import/i.test(actionWord)
    ? "text-emerald-600"
    : "text-red-600";

  return (
    <>
      <span className={`font-extrabold ${actionColorClass}`}>{actionWord}</span>
      <span className="ml-1">{rest}</span>
    </>
  );
}

function waitForLoadingModal() {
  return new Promise((resolve) => {
    window.setTimeout(resolve, 900);
  });
}

function sortLatestLogsFirst(items) {
  return [...items].sort((first, second) => {
    const firstId = Number(first.id) || 0;
    const secondId = Number(second.id) || 0;

    if (firstId !== secondId) return secondId - firstId;

    const firstTime = new Date(first.createdAt || first.timestamp || 0).getTime();
    const secondTime = new Date(second.createdAt || second.timestamp || 0).getTime();

    return secondTime - firstTime;
  });
}

function WfmHistoryLogs() {
  const dashboard = useDashboardPage();
  const userName = dashboard.authUser?.name || dashboard.authUser?.username || "User";
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isClearingLogs, setIsClearingLogs] = useState(false);
  const [showClearLogsModal, setShowClearLogsModal] = useState(false);
  const [showClearLogsSuccess, setShowClearLogsSuccess] = useState(false);
  const [error, setError] = useState("");

  const loadLogs = async (page = pagination.page) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetchWfmHistoryLogs({
        page,
        limit: pagination.limit,
      });

      setLogs(
        Array.isArray(response?.data) ? sortLatestLogsFirst(response.data) : [],
      );
      setPagination((current) => ({
        ...current,
        page: response?.pagination?.page || page,
        total: response?.pagination?.total || 0,
        totalPages: response?.pagination?.totalPages || 1,
      }));
    } catch (loadError) {
      setError(
        loadError?.response?.data?.message ||
          loadError?.message ||
          "Unable to load WFM history logs.",
      );
      setLogs([]);
      setPagination((current) => ({ ...current, total: 0, totalPages: 1 }));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs(1);
  }, []);

  const handleClearLogs = async () => {
    setShowClearLogsModal(false);
    setIsClearingLogs(true);
    setShowClearLogsSuccess(false);
    setError("");

    try {
      await Promise.all([
        clearWfmHistoryLogs(),
        waitForLoadingModal(),
      ]);
      setLogs([]);
      setPagination((current) => ({
        ...current,
        page: 1,
        total: 0,
        totalPages: 1,
      }));
      setIsClearingLogs(false);
      setShowClearLogsSuccess(true);
    } catch (clearError) {
      setError(
        clearError?.response?.data?.message ||
          clearError?.message ||
          "Unable to clear WFM history logs.",
      );
      setIsClearingLogs(false);
    }
  };

  const showingText = useMemo(() => {
    if (!pagination.total) return "No logs to show";

    const start = (pagination.page - 1) * pagination.limit + 1;
    const end = Math.min(pagination.page * pagination.limit, pagination.total);

    return `Showing ${start}-${end} of ${pagination.total} logs`;
  }, [pagination]);

  return (
    <section className="font-jakarta flex min-h-screen bg-[#eef3f7] text-sibs-primary-1">
      <AdminSidebar
        isMobileOpen={dashboard.isMobileSidebarOpen}
        modules={dashboard.modules}
        onLogoutClick={() => dashboard.setShowLogoutModal(true)}
        onMobileClose={() => dashboard.setIsMobileSidebarOpen(false)}
        userName={userName}
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
          <section className="sibs-card overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-sibs-tertiary-10 bg-sibs-primary-3/30 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
              <h1 className="m-0 text-base font-extrabold text-sibs-primary-1">
                History Logs
              </h1>

              <Button
                type="button"
                onClick={() => setShowClearLogsModal(true)}
                disabled={isLoading || isClearingLogs || pagination.total === 0}
                className="h-9 gap-2 rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-bold text-red-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-red-500 hover:bg-red-600 hover:text-white hover:shadow-md focus-visible:ring-red-200 disabled:translate-y-0 disabled:border-sibs-tertiary-10 disabled:bg-sibs-tertiary-10 disabled:text-sibs-tertiary-5 disabled:shadow-none"
              >
                {isClearingLogs ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                )}
                {isClearingLogs ? "Clearing..." : "Clear Logs"}
              </Button>
            </div>

            <div className="divide-y divide-sibs-tertiary-10">
              {error ? (
                <div className="bg-[#f8fbfd] px-5 py-8 text-center text-sm font-semibold text-sibs-danger">
                  {error}
                </div>
              ) : null}

              {!error && isLoading ? (
                <div className="bg-[#f8fbfd] px-5 py-8 text-center text-sm text-sibs-tertiary-5">
                  Loading history logs...
                </div>
              ) : null}

              {!error && !isLoading && logs.length === 0 ? (
                <div className="bg-[#f8fbfd] px-5 py-8 text-center text-sm text-sibs-tertiary-5">
                  No history logs found.
                </div>
              ) : null}

              {!error && !isLoading
                ? logs.map((log) => {
                    const actionText = getLogActionText(log);
                    const isAuthAction = isAuthLog(log);
                    const formattedTime = formatHistoryTime(log.formattedTime);

                    return (
                      <article
                        key={log.id}
                        className="bg-[#f8fbfd] px-5 py-2.5"
                      >
                        <p className="m-0 min-w-0 truncate text-sm text-sibs-primary-1">
                          <span className="font-semibold text-sibs-tertiary-5">
                            {formattedTime}
                          </span>
                          {isAuthAction ? (
                            <>
                              <span className="text-sibs-tertiary-5"> - </span>
                              <span>({log.userId || "N/A"}) </span>
                              <span className="font-bold">
                                {log.userName || "User"}
                              </span>{" "}
                              <span>{actionText}</span>
                            </>
                          ) : (
                            <>
                              <span className="text-sibs-tertiary-5">, </span>
                              {getHighlightedActionMessage(actionText)}
                              <span className="text-sibs-tertiary-5">
                                {" - "}
                              </span>
                              <span className="font-semibold text-sibs-tertiary-5">
                                Action performed
                              </span>
                              <span> </span>
                              <span>({log.userId || "N/A"}) </span>
                              <span className="font-bold">
                                {log.userName || "User"}
                              </span>
                            </>
                          )}
                        </p>
                      </article>
                    );
                  })
                : null}
            </div>

            <div className="flex flex-col gap-3 border-t border-sibs-tertiary-10 bg-white px-5 py-3 text-sm text-sibs-tertiary-6 sm:flex-row sm:items-center sm:justify-between">
              <span>{showingText}</span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={pagination.page <= 1 || isLoading}
                  onClick={() => loadLogs(Math.max(1, pagination.page - 1))}
                  className="h-9 rounded-lg px-4"
                >
                  Previous
                </Button>
                <span className="text-xs font-bold text-sibs-tertiary-6">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  disabled={pagination.page >= pagination.totalPages || isLoading}
                  onClick={() => loadLogs(Math.min(pagination.totalPages, pagination.page + 1))}
                  className="h-9 rounded-lg px-4"
                >
                  Next
                </Button>
              </div>
            </div>
          </section>
        </div>
      </main>

      <ConfirmationModal
        isOpen={showClearLogsModal}
        title="Clear history logs"
        message="This will permanently remove all WFM history logs from the database."
        cancelText="Cancel"
        confirmText="Clear Logs"
        onCancel={() => setShowClearLogsModal(false)}
        onConfirm={handleClearLogs}
        tone="danger"
      />

      <LoadingModal
        isOpen={isClearingLogs}
        title="Clearing logs"
        message="Please wait while we remove the history logs."
      />

      <AppModal
        isOpen={showClearLogsSuccess}
        className="max-w-sm"
        textAlign="center"
        zIndex="z-[130]"
      >
        <div className="flex items-center justify-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="m-0 text-lg font-extrabold text-sibs-primary-1">
            Logs cleared
          </p>
        </div>
        <p className="mt-2 mb-0 text-sm text-sibs-tertiary-5">
          WFM history logs were removed from the database.
        </p>
        <Button
          type="button"
          onClick={() => setShowClearLogsSuccess(false)}
          className="mt-6 h-10 rounded-xl bg-sibs-primary-1 px-5 font-semibold text-white hover:bg-sibs-tertiary-4"
        >
          Done
        </Button>
      </AppModal>

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
