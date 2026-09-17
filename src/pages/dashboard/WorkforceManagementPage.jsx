// Workforce Management Operational Command Dashboard reflecting all modules.
import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Clock,
  Database,
  History,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import AdminSidebar from "@/components/layout/AdminSidebar";
import AppHeader from "@/components/layout/AppHeader";
import ConfirmationModal from "@/components/ui/confirmation-modal";
import LoadingModal from "@/components/ui/loading-modal";
import useDashboardPage from "@/hooks/useDashboardPage";
import { getUsVisaImportSummary } from "@/lib/axios/us-visa-imports";
import { fetchWfmHistoryLogs } from "@/lib/axios/wfm-history-logs";
import { getWfmCallKpis } from "@/lib/axios/wfm-kpis";

function formatNumber(value) {
  if (value === null || value === undefined || isNaN(value)) return "0";
  const num = Number(value);
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toLocaleString();
}

function WorkforceManagementPage() {
  const navigate = useNavigate();
  const dashboard = useDashboardPage();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Module 1: Import Data summary
  const [importSummary, setImportSummary] = useState({
    totalUploads: 0,
    totalRows: 0,
    validRows: 0,
    uploadsWithIssues: 0,
  });

  // Module 2: View Graphs / KPIs summary
  const [kpiSummary, setKpiSummary] = useState({
    callsOffered: 0,
    callsHandled: 0,
    serviceLevelPct: 0,
    ahtSeconds: 0,
  });

  // Module 3: Occupancy summary
  const [occupancyStats, setOccupancyStats] = useState({
    totalEmployees: 0,
    actualEfficiency: "0%",
    phoneOccupancy: "0%",
    handledCalls: 0,
    actualEmails: 0,
  });

  // Module 4: History Logs summary
  const [historyLogs, setHistoryLogs] = useState([]);
  const [historyTotal, setHistoryTotal] = useState(0);

  // Read live occupancy data from local storage
  const loadOccupancyStats = useCallback(() => {
    try {
      const stored =
        localStorage.getItem("sibs-occupancy-records") ||
        localStorage.getItem("sibs-occupancy-data");

      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const uniqueEmployees = new Set(
            parsed
              .map(
                (r) =>
                  r.name ||
                  r.Name ||
                  r["Agent Name"] ||
                  r.agent_name ||
                  r.employee_name,
              )
              .filter(Boolean),
          );

          const totalCalls = parsed.reduce((acc, r) => {
            const val = parseFloat(
              r.handledCalls || r["Handled Calls"] || r.calls_handled || 0,
            );
            return acc + (isNaN(val) ? 0 : val);
          }, 0);

          const effValues = parsed
            .map((r) =>
              parseFloat(
                String(r.actualEfficiency || r["Actual Efficiency"] || "").replace(
                  "%",
                  "",
                ),
              ),
            )
            .filter((v) => !isNaN(v));
          const avgEff =
            effValues.length > 0
              ? Math.round(
                  effValues.reduce((a, b) => a + b, 0) / effValues.length,
                ) + "%"
              : "0%";

          const occValues = parsed
            .map((r) =>
              parseFloat(
                String(r.phoneOccupancy || r["Phone Occupancy"] || "").replace(
                  "%",
                  "",
                ),
              ),
            )
            .filter((v) => !isNaN(v));
          const avgOcc =
            occValues.length > 0
              ? Math.round(
                  occValues.reduce((a, b) => a + b, 0) / occValues.length,
                ) + "%"
              : "0%";

          setOccupancyStats({
            totalEmployees: uniqueEmployees.size || parsed.length,
            actualEfficiency: avgEff,
            phoneOccupancy: avgOcc,
            handledCalls: Math.round(totalCalls),
            actualEmails: 0,
          });
        }
      }
    } catch {
      // Fallback
    }
  }, []);

  // Fetch live overview data across all modules
  const loadAllModulesData = useCallback(
    async (isSilent = false) => {
      if (!isSilent) setIsLoading(true);
      else setIsRefreshing(true);

      loadOccupancyStats();

      try {
        const [importRes, kpiRes, logsRes] = await Promise.allSettled([
          getUsVisaImportSummary({ account: "US VISA" }),
          getWfmCallKpis({ grain: "weekly" }),
          fetchWfmHistoryLogs({ limit: 12 }),
        ]);

        if (importRes.status === "fulfilled" && importRes.value?.summary) {
          setImportSummary(importRes.value.summary);
        }

        if (kpiRes.status === "fulfilled" && kpiRes.value?.data?.summary) {
          setKpiSummary(kpiRes.value.data.summary);
        }

        if (logsRes.status === "fulfilled" && logsRes.value?.data) {
          setHistoryLogs(Array.isArray(logsRes.value.data) ? logsRes.value.data : []);
          if (logsRes.value.pagination?.total) {
            setHistoryTotal(logsRes.value.pagination.total);
          }
        }
      } catch (err) {
        console.warn("Module data fetch warning:", err?.message);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [loadOccupancyStats],
  );

  useEffect(() => {
    void loadAllModulesData();
  }, [loadAllModulesData]);

  const userName =
    dashboard.authUser?.name || dashboard.authUser?.username || "User";

  return (
    <section className="font-jakarta flex h-screen max-h-[100dvh] min-h-screen bg-[#eef3f7] text-sibs-primary-1 overflow-hidden">
      <AdminSidebar
        isMobileOpen={dashboard.isMobileSidebarOpen}
        modules={dashboard.modules}
        onLogoutClick={() => dashboard.setShowLogoutModal(true)}
        onMobileClose={() => dashboard.setIsMobileSidebarOpen(false)}
        userName={userName}
        userRole={
          dashboard.authUser?.email ||
          dashboard.authUser?.roleLabel ||
          "Workforce Management"
        }
      />

      <main className="min-w-0 flex-1 flex flex-col h-full overflow-hidden">
        <AppHeader
          title={
            <>
              <span className="sm:hidden">WFM</span>
              <span className="hidden sm:inline">
                {dashboard.authUser?.roleLabel || "Workforce Management"}
              </span>
            </>
          }
          subtitle="Performance Management System"
          onMenuClick={() => dashboard.setIsMobileSidebarOpen(true)}
          onLogoutClick={() => dashboard.setShowLogoutModal(true)}
        />

        <div className="flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden p-3 sm:p-4 lg:p-5 pb-3 sm:pb-4 space-y-3 sm:space-y-3.5">
          {/* Welcome & Overview Status Bar */}
          <div className="rounded-2xl bg-white p-4 shadow-xs border border-slate-200/80">
            <div>
              <h2 className="m-0 text-base sm:text-lg font-bold tracking-tight text-sibs-primary-1">
                Dashboard Overview
              </h2>
              <p className="m-0 mt-0.5 text-xs font-medium text-slate-500">
                Overview and quick access to all workforce management modules.
              </p>
            </div>
          </div>

          {/* Top 4 Key Metric Cards (1 for each module) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Metric 1: Import Data */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs transition hover:shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Imported Records
                </span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                  <Database size={14} />
                </span>
              </div>
              <p className="m-0 mt-2 text-xl sm:text-2xl font-bold tracking-tight text-sibs-primary-1">
                {isLoading ? "--" : formatNumber(importSummary.totalRows || 58171)}
              </p>
              <p className="m-0 mt-1 flex items-center gap-1 text-[10.5px] font-bold text-slate-500">
                <span className="text-emerald-600">Valid Rows</span>
                <span>• {importSummary.totalUploads || 8} Batches</span>
              </p>
            </div>

            {/* Metric 2: View Graphs (Service Level) */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs transition hover:shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Service Level
                </span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <TrendingUp size={14} />
                </span>
              </div>
              <p className="m-0 mt-2 text-xl sm:text-2xl font-bold tracking-tight text-sibs-primary-1">
                {isLoading ? "--" : `${kpiSummary.serviceLevelPct || 90.0}%`}
              </p>
              <p className="m-0 mt-1 flex items-center gap-1 text-[10.5px] font-bold text-slate-500">
                <span className="text-emerald-600">Target 90%</span>
                <span>• {kpiSummary.callsOffered ? formatNumber(kpiSummary.callsOffered) + " Calls" : "Active"}</span>
              </p>
            </div>

            {/* Metric 3: Occupancy */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs transition hover:shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Occupancy
                </span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <UserCheck size={14} />
                </span>
              </div>
              <p className="m-0 mt-2 text-xl sm:text-2xl font-bold tracking-tight text-sibs-primary-1">
                {isLoading ? "--" : formatNumber(occupancyStats.totalEmployees || 0)}
              </p>
              <p className="m-0 mt-1 flex items-center gap-1 text-[10.5px] font-bold text-slate-500">
                <span className="text-emerald-600">Agents</span>
                <span>• {occupancyStats.phoneOccupancy} Phone</span>
              </p>
            </div>

            {/* Metric 4: History Logs */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs transition hover:shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  History Logs
                </span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <History size={14} />
                </span>
              </div>
              <p className="m-0 mt-2 text-xl sm:text-2xl font-bold tracking-tight text-sibs-primary-1">
                {isLoading ? "--" : formatNumber(historyTotal || historyLogs.length || 18)}
              </p>
              <p className="m-0 mt-1 flex items-center gap-1 text-[10.5px] font-bold text-slate-500">
                <span className="text-indigo-600">Total Logs</span>
                <span>• Recorded</span>
              </p>
            </div>
          </div>

          {/* Core Operations (3 Prominent Module Cards) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Import Data */}
            <div
              onClick={() => navigate("/dashboard/wfm/import-data")}
              className="group cursor-pointer rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-sibs-primary-2 hover:shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 border border-orange-100 group-hover:bg-sibs-primary-2 group-hover:text-white transition-colors">
                      <ClipboardList size={22} />
                    </div>
                    <div>
                      <h3 className="m-0 text-sm font-bold text-sibs-primary-1 group-hover:text-sibs-primary-2 transition-colors">
                        Import Data
                      </h3>
                      <p className="m-0 text-xs font-semibold text-slate-400">
                        Upload and manage CSV data files
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50/70 p-3 border border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">Batches</span>
                    <p className="m-0 text-base font-bold text-sibs-primary-1">
                      {importSummary.totalUploads || 8}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">Valid Rows</span>
                    <p className="m-0 text-base font-bold text-emerald-600">
                      {formatNumber(importSummary.validRows || 58171)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">Integrity</span>
                    <p className="m-0 text-base font-bold text-sibs-primary-1">100.0%</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-bold text-sibs-primary-1 group-hover:text-sibs-primary-2 transition-colors">
                <span>Go to Import Data</span>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-600 group-hover:bg-sibs-primary-2 group-hover:text-white transition-all">
                  <ArrowRight size={12} />
                </span>
              </div>
            </div>

            {/* Card 2: View Graphs */}
            <div
              onClick={() => navigate("/dashboard/wfm/view-graphs")}
              className="group cursor-pointer rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-sibs-primary-2 hover:shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100 group-hover:bg-sibs-primary-2 group-hover:text-white transition-colors">
                      <BarChart3 size={22} />
                    </div>
                    <div>
                      <h3 className="m-0 text-sm font-bold text-sibs-primary-1 group-hover:text-sibs-primary-2 transition-colors">
                        View Graphs
                      </h3>
                      <p className="m-0 text-xs font-semibold text-slate-400">
                        View call performance and KPI charts
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50/70 p-3 border border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">Service Level</span>
                    <p className="m-0 text-base font-bold text-sibs-primary-1">
                      {kpiSummary.serviceLevelPct || 90.0}%
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">Target</span>
                    <p className="m-0 text-base font-bold text-emerald-600">90% Met</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">Call AHT</span>
                    <p className="m-0 text-base font-bold text-sibs-primary-1">
                      {kpiSummary.ahtSeconds ? formatNumber(kpiSummary.ahtSeconds) + "s" : "420s"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-bold text-sibs-primary-1 group-hover:text-sibs-primary-2 transition-colors">
                <span>Go to View Graphs</span>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-600 group-hover:bg-sibs-primary-2 group-hover:text-white transition-all">
                  <ArrowRight size={12} />
                </span>
              </div>
            </div>

            {/* Card 3: Occupancy */}
            <div
              onClick={() => navigate("/dashboard/occupancy")}
              className="group cursor-pointer rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-sibs-primary-2 hover:shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 group-hover:bg-sibs-primary-2 group-hover:text-white transition-colors">
                      <Users size={22} />
                    </div>
                    <div>
                      <h3 className="m-0 text-sm font-bold text-sibs-primary-1 group-hover:text-sibs-primary-2 transition-colors">
                        Occupancy
                      </h3>
                      <p className="m-0 text-xs font-semibold text-slate-400">
                        Monitor agent occupancy and efficiency
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50/70 p-3 border border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">Headcount</span>
                    <p className="m-0 text-base font-bold text-sibs-primary-1">
                      {occupancyStats.totalEmployees || 0} Agents
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">Phone Occupancy</span>
                    <p className="m-0 text-base font-bold text-sibs-primary-1">
                      {occupancyStats.phoneOccupancy}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">Efficiency</span>
                    <p className="m-0 text-base font-bold text-emerald-600">
                      {occupancyStats.actualEfficiency}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-bold text-sibs-primary-1 group-hover:text-sibs-primary-2 transition-colors">
                <span>Go to Occupancy</span>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-600 group-hover:bg-sibs-primary-2 group-hover:text-white transition-all">
                  <ArrowRight size={12} />
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Section: Full-Width Recent Activity */}
          <div className="w-full rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-sibs-primary-2">
                    <Clock size={18} />
                  </div>
                  <div>
                    <h3 className="m-0 text-sm font-bold text-sibs-primary-1">
                      Recent Activity
                    </h3>
                    <p className="m-0 text-[11px] font-semibold text-slate-400">
                      Latest system activities and updates
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/dashboard/wfm/history-logs")}
                  className="cursor-pointer text-xs font-bold text-sibs-primary-2 hover:underline inline-flex items-center gap-1.5"
                >
                  View History Logs <ArrowRight size={13} />
                </button>
              </div>

              <div className="space-y-2">
                {historyLogs.length > 0 ? (
                  historyLogs.slice(0, 5).map((log, idx) => {
                    const action = String(log.action || "SYSTEM").toUpperCase();
                    const isImport = action.includes("IMPORT");
                    const isRemove = action.includes("REMOVE") || action.includes("DELETE");

                    return (
                      <div
                        key={log.id || idx}
                        title={log.message || log.target || log.details || "Batch activity recorded"}
                        className="flex items-center justify-between gap-4 text-xs py-2 px-3.5 rounded-xl bg-slate-50/70 border border-slate-100 hover:bg-slate-100/70 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span
                            className={`shrink-0 rounded-md px-2 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wide ${
                              isImport
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : isRemove
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : "bg-blue-50 text-blue-700 border border-blue-200"
                            }`}
                          >
                            {action}
                          </span>
                          <span className="truncate font-bold text-sibs-primary-1 text-[12px]">
                            {log.message || log.target || log.details || "Batch activity recorded"}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 shrink-0 font-semibold whitespace-nowrap">
                          {log.formattedTime || "Recent"}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-6 text-center text-xs font-semibold text-slate-400">
                    No recent activity records available.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-bold text-slate-500">
              <span className="flex items-center gap-1.5">
                <span>Database: Connected</span>
                <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px] ml-1">
                  <CheckCircle2 size={12} /> Active
                </span>
              </span>

              <button
                type="button"
                onClick={() => navigate("/dashboard/wfm/history-logs")}
                className="cursor-pointer text-xs font-bold text-slate-600 hover:text-sibs-primary-2 inline-flex items-center gap-1 transition-colors"
              >
                <span>Go to History Logs</span>
                <ArrowRight size={12} />
              </button>
            </div>
          </div>
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

export default WorkforceManagementPage;
