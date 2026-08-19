// WFM Calls KPI dashboard. Data is aggregated by the backend from canonical PMS rows.
import { useCallback, useEffect, useState } from "react";
import { AlertCircle, BarChart3, Database, RefreshCw } from "lucide-react";

import AdminSidebar from "@/components/layout/AdminSidebar";
import AppHeader from "@/components/layout/AppHeader";
import WfmCallKpiDashboard from "@/components/workForceManagement/kpi/WfmCallKpiDashboard";
import useDashboardPage from "@/hooks/useDashboardPage";
import { getWfmCallKpis } from "@/lib/axios/wfm-kpis";

const PERIOD_OPTIONS = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annually", label: "Annually" },
];

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Unable to load Calls KPI data."
  );
}

function formatGrain(value) {
  const labels = {
    SKILL_DAY: "Daily source",
    SKILL_15_MINUTE: "15-minute source",
    SKILL_30_MINUTE: "30-minute source",
    SKILL_REPORT_SUMMARY: "Report summary source",
  };
  return labels[value] || value || "No source data";
}

export default function WfmViewGraphsPage() {
  const dashboard = useDashboardPage();
  const userName = dashboard.authUser?.name || dashboard.authUser?.username || "User";
  const isWfmUser = dashboard.authUser?.role === "wfm" || Number(dashboard.authUser?.adminAccess || 0) === 9;

  const [period, setPeriod] = useState("weekly");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [draftDateFrom, setDraftDateFrom] = useState("");
  const [draftDateTo, setDraftDateTo] = useState("");
  const [kpiData, setKpiData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadKpis = useCallback(async () => {
    if (!isWfmUser) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await getWfmCallKpis({
        period,
        ...(dateFrom ? { from: dateFrom } : {}),
        ...(dateTo ? { to: dateTo } : {}),
      });
      const data = response?.data || null;
      setKpiData(data);

      if (!dateFrom && data?.filters?.dateFrom) {
        setDraftDateFrom(data.filters.dateFrom);
      }
      if (!dateTo && data?.filters?.dateTo) {
        setDraftDateTo(data.filters.dateTo);
      }
    } catch (loadError) {
      setError(getErrorMessage(loadError));
      setKpiData(null);
    } finally {
      setIsLoading(false);
    }
  }, [dateFrom, dateTo, isWfmUser, period]);

  useEffect(() => {
    loadKpis();
  }, [loadKpis]);

  const handlePeriodChange = (event) => {
    setPeriod(event.target.value);
    setDateFrom("");
    setDateTo("");
    setDraftDateFrom("");
    setDraftDateTo("");
  };

  const handleApplyDateRange = () => {
    setDateFrom(draftDateFrom);
    setDateTo(draftDateTo);
  };

  const handleLatestRange = () => {
    setDateFrom("");
    setDateTo("");
    setDraftDateFrom("");
    setDraftDateTo("");
  };

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
          {!isWfmUser ? (
            <div className="sibs-card p-6 text-center">
              <AlertCircle className="mx-auto mb-3 text-amber-500" size={34} />
              <h2 className="m-0 text-lg font-bold text-sibs-primary-1">WFM access required</h2>
              <p className="mt-2 mb-0 text-sm text-sibs-tertiary-5">Calls KPI reporting is currently available only on the WFM dashboard.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <section className="sibs-card overflow-hidden">
                <div className="flex flex-col gap-3 border-b border-sibs-tertiary-10 bg-sibs-primary-3/30 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <BarChart3 size={20} className="text-sibs-primary-1" />
                      <h1 className="m-0 text-lg font-extrabold text-sibs-primary-1">Calls KPI Performance</h1>
                    </div>
                    <p className="mt-1 mb-0 text-sm text-sibs-tertiary-5">Backend-aggregated KPI reporting from validated call data stored in PMS.</p>
                  </div>
                  <button
                    type="button"
                    onClick={loadKpis}
                    disabled={isLoading}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-sibs-tertiary-8 bg-white px-4 text-sm font-bold text-sibs-primary-1 shadow-sm disabled:opacity-50"
                  >
                    <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
                    Refresh
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 xl:grid-cols-5 xl:items-end">
                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-extrabold uppercase text-sibs-tertiary-5">Account</span>
                    <div className="flex h-10 items-center rounded-lg border border-sibs-tertiary-8 bg-sibs-tertiary-10/40 px-3 text-sm font-bold text-sibs-primary-1">US VISA</div>
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-extrabold uppercase text-sibs-tertiary-5">Reporting Period</span>
                    <select value={period} onChange={handlePeriodChange} className="h-10 w-full rounded-lg border border-sibs-tertiary-8 bg-white px-3 text-sm font-semibold outline-none">
                      {PERIOD_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-extrabold uppercase text-sibs-tertiary-5">From</span>
                    <input type="date" value={draftDateFrom} onChange={(event) => setDraftDateFrom(event.target.value)} className="h-10 w-full rounded-lg border border-sibs-tertiary-8 bg-white px-3 text-sm font-semibold outline-none" />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-extrabold uppercase text-sibs-tertiary-5">To</span>
                    <input type="date" value={draftDateTo} onChange={(event) => setDraftDateTo(event.target.value)} className="h-10 w-full rounded-lg border border-sibs-tertiary-8 bg-white px-3 text-sm font-semibold outline-none" />
                  </label>

                  <div className="flex gap-2">
                    <button type="button" onClick={handleApplyDateRange} className="h-10 flex-1 rounded-lg bg-sibs-primary-1 px-4 text-sm font-bold text-white">Apply</button>
                    <button type="button" onClick={handleLatestRange} className="h-10 rounded-lg border border-sibs-tertiary-8 bg-white px-3 text-xs font-bold text-sibs-primary-1">Latest</button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-sibs-tertiary-10 px-5 py-3 text-xs font-semibold text-sibs-tertiary-5">
                  <span className="inline-flex items-center gap-1.5"><Database size={14} />{formatGrain(kpiData?.filters?.dataGrain)}</span>
                  <span>Source: {kpiData?.filters?.sourceSystem || "FUSECOM"}</span>
                  <span>Task Order: Not configured yet</span>
                  {kpiData?.filters?.dateFrom && kpiData?.filters?.dateTo ? <span>Range: {kpiData.filters.dateFrom} to {kpiData.filters.dateTo}</span> : null}
                </div>
              </section>

              {error ? (
                <div className="sibs-card flex items-start gap-3 border border-red-200 p-4 text-sm text-red-700">
                  <AlertCircle size={20} className="mt-0.5 shrink-0" />
                  <div><p className="m-0 font-bold">Unable to load KPI data</p><p className="mt-1 mb-0">{error}</p></div>
                </div>
              ) : null}

              {isLoading ? (
                <div className="sibs-card flex min-h-72 flex-col items-center justify-center gap-3 p-6 text-center">
                  <RefreshCw size={30} className="animate-spin text-sibs-primary-1" />
                  <div><p className="m-0 font-bold text-sibs-primary-1">Loading Calls KPI data</p><p className="mt-1 mb-0 text-sm text-sibs-tertiary-5">Aggregating validated records from the PMS database.</p></div>
                </div>
              ) : !error ? (
                <WfmCallKpiDashboard data={kpiData} />
              ) : null}
            </div>
          )}
        </div>
      </main>
    </section>
  );
}
