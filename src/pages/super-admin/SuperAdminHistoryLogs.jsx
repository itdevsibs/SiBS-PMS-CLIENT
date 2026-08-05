import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import api from "@/lib/axios/api-template";

function formatLogTime(timestamp) {
  if (!timestamp) return "-";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

function SuperAdminHistoryLogs() {
  const [logs, setLogs] = useState([]);
  const [dateFilter, setDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const rowsPerPage = 10;

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
    <section className="sibs-card sibs-page-card-in overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-sibs-tertiary-10 bg-sibs-primary-3/30 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="m-0 text-base font-bold text-sibs-primary-1">
            History Logs
          </h3>
          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-sibs-tertiary-5">
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
              className="h-9 rounded-lg px-3 text-sm font-semibold text-sibs-primary-2"
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
            <div key={log.id} className="grid gap-2 bg-[#f8fbfd] px-5 py-3 md:grid-cols-[1fr_190px] md:items-center">
              <div className="min-w-0">
                <p className="m-0 truncate text-sm font-bold text-sibs-primary-1">
                  {formatLogMessage(log)}
                </p>
              </div>
              <p className="m-0 text-sm text-sibs-tertiary-5 md:text-right">
                {formatLogTime(log.timestamp)}
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
        <div className="flex flex-col gap-3 border-t border-sibs-tertiary-10 px-5 py-3 text-sm text-sibs-tertiary-6 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Showing {paginatedLogs.length} of {filteredLogs.length} logs
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-lg px-4"
              disabled={currentPage === 1}
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
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default SuperAdminHistoryLogs;
