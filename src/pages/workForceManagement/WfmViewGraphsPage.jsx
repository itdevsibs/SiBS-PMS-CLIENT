// WFM Calls KPI dashboard. Data is aggregated by the backend from canonical PMS rows.
import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  Database,
  RefreshCw,
} from "lucide-react";

import AdminSidebar from "@/components/layout/AdminSidebar";
import AppHeader from "@/components/layout/AppHeader";
import ConfirmationModal from "@/components/ui/confirmation-modal";
import LoadingModal from "@/components/ui/loading-modal";
import WfmCallKpiDashboard from "@/components/workForceManagement/kpi/WfmCallKpiDashboard";
import WfmKpiDatePicker from "@/components/workForceManagement/kpi/WfmKpiDatePicker";
import useDashboardPage from "@/hooks/useDashboardPage";
import { getWfmCallKpis } from "@/lib/axios/wfm-kpis";

const PERIOD_OPTIONS = [
  {
    value: "weekly",
    label: "Weekly",
  },
  {
    value: "monthly",
    label: "Monthly",
  },
  {
    value: "quarterly",
    label: "Quarterly",
  },
  {
    value: "annually",
    label: "Annually",
  },
  {
    value: "custom",
    label: "Custom",
  },
];

const SOURCE_OPTIONS = [
  {
    value: "FUSECOM",
    label: "Fusecom",
  },
  {
    value: "HERODASH",
    label: "HeroDash",
  },
];

const DEFAULT_FILTERS = {
  sourceSystem: "FUSECOM",
  period: "weekly",
  referenceDate: "",
  from: "",
  to: "",
};

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

  return (
    labels[value] ||
    value ||
    "No available data grain returned by backend"
  );
}

function getSourceLabel(value) {
  return (
    SOURCE_OPTIONS.find((option) => option.value === value)?.label ||
    value ||
    "Selected source"
  );
}

function buildRequestParams(filters) {
  const params = {
    period: filters.period,
    sourceSystem: filters.sourceSystem,
  };

  if (filters.period === "custom") {
    if (filters.from) {
      params.from = filters.from;
    }

    if (filters.to) {
      params.to = filters.to;
    }

    return params;
  }

  if (filters.referenceDate) {
    params.referenceDate = filters.referenceDate;
  }

  return params;
}

export default function WfmViewGraphsPage() {
  const dashboard = useDashboardPage();

  const userName =
    dashboard.authUser?.name ||
    dashboard.authUser?.username ||
    "User";

  const isWfmUser =
    dashboard.authUser?.role === "wfm" ||
    Number(dashboard.authUser?.adminAccess || 0) === 9;

  const [draftFilters, setDraftFilters] =
    useState(DEFAULT_FILTERS);

  const [appliedFilters, setAppliedFilters] =
    useState(DEFAULT_FILTERS);

  const [kpiResponse, setKpiResponse] =
    useState(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadKpis = useCallback(async () => {
    if (!isWfmUser) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const params = buildRequestParams(appliedFilters);

      const response = await getWfmCallKpis(params);

      setKpiResponse(response);

      const dashboardData =
        response?.data?.data || null;

      const returnedFilters =
        dashboardData?.filters || {};

      setDraftFilters((current) => {
        if (
          current.sourceSystem !== appliedFilters.sourceSystem ||
          current.period !== appliedFilters.period
        ) {
          return current;
        }

        if (appliedFilters.period === "custom") {
          return current;
        }

        if (appliedFilters.referenceDate) {
          return current;
        }

        return {
          ...current,
          referenceDate:
            returnedFilters.referenceDate || "",
        };
      });
    } catch (loadError) {
      setError(getErrorMessage(loadError));
      setKpiResponse(null);
    } finally {
      setIsLoading(false);
    }
  }, [appliedFilters, isWfmUser]);

  useEffect(() => {
    loadKpis();
  }, [loadKpis]);

  const handleSourceChange = (event) => {
    const sourceSystem = event.target.value;

    setDraftFilters((current) => ({
      ...current,
      sourceSystem,
      referenceDate: "",
      from: "",
      to: "",
    }));
  };

  const handlePeriodChange = (event) => {
    const nextPeriod = event.target.value;

    const currentDashboardFilters =
      kpiResponse?.data?.data?.filters || {};

    setDraftFilters((current) => {
      const canReuseDashboardRange =
        current.sourceSystem ===
        currentDashboardFilters.sourceSystem;

      return {
        ...current,
        period: nextPeriod,

        referenceDate:
          nextPeriod === "custom"
            ? current.referenceDate
            : current.referenceDate ||
              (canReuseDashboardRange
                ? currentDashboardFilters.referenceDate
                : "") ||
              "",

        from:
          nextPeriod === "custom"
            ? current.from ||
              (canReuseDashboardRange
                ? currentDashboardFilters.dateFrom
                : "") ||
              ""
            : "",

        to:
          nextPeriod === "custom"
            ? current.to ||
              (canReuseDashboardRange
                ? currentDashboardFilters.dateTo
                : "") ||
              ""
            : "",
      };
    });
  };

  const handleApplyFilters = () => {
    if (draftFilters.period === "custom") {
      if (!draftFilters.from || !draftFilters.to) {
        setError(
          "Custom reporting requires both From and To dates.",
        );

        return;
      }

      if (draftFilters.from > draftFilters.to) {
        setError(
          "The start date cannot be later than the end date.",
        );

        return;
      }
    }

    setError("");

    setAppliedFilters({
      sourceSystem: draftFilters.sourceSystem,
      period: draftFilters.period,

      referenceDate:
        draftFilters.period === "custom"
          ? ""
          : draftFilters.referenceDate,

      from:
        draftFilters.period === "custom"
          ? draftFilters.from
          : "",

      to:
        draftFilters.period === "custom"
          ? draftFilters.to
          : "",
    });
  };

  const handleLatestRange = () => {
    if (draftFilters.period === "custom") {
      return;
    }

    const latestFilters = {
      sourceSystem: draftFilters.sourceSystem,
      period: draftFilters.period,
      referenceDate: "",
      from: "",
      to: "",
    };

    setError("");
    setDraftFilters(latestFilters);
    setAppliedFilters(latestFilters);
  };

  const dashboardData =
    kpiResponse?.data?.data || {};

  const availableGrains =
    Array.isArray(dashboardData.availableGrains)
      ? dashboardData.availableGrains
      : [];

  const series =
    Array.isArray(dashboardData.series)
      ? dashboardData.series
      : [];

  const activeSourceSystem =
    dashboardData.filters?.sourceSystem ||
    appliedFilters.sourceSystem;

  const emptyDataMessage =
    !availableGrains.length
      ? `No validated ${getSourceLabel(
          activeSourceSystem,
        )} KPI data is available.`
      : !series.length
        ? "No KPI data is available for the selected reporting range."
        : "";

  const isCustomPeriod =
    draftFilters.period === "custom";

  return (
    <section className="font-jakarta flex min-h-screen bg-[#eef3f7] text-sibs-primary-1">
      <AdminSidebar
        isMobileOpen={dashboard.isMobileSidebarOpen}
        modules={dashboard.modules}
        onLogoutClick={() =>
          dashboard.setShowLogoutModal(true)
        }
        onMobileClose={() =>
          dashboard.setIsMobileSidebarOpen(false)
        }
        userName={userName}
        userRole={
          dashboard.authUser?.email ||
          dashboard.authUser?.roleLabel ||
          "User"
        }
      />

      <main className="min-w-0 flex-1">
        <AppHeader
          title={`${
            dashboard.authUser?.roleLabel || "User"
          } Dashboard`}
          subtitle="Performance Management System"
          onMenuClick={() =>
            dashboard.setIsMobileSidebarOpen(true)
          }
          onLogoutClick={() =>
            dashboard.setShowLogoutModal(true)
          }
        />

        <div className="sibs-scrollbar max-h-[calc(100vh-74px)] overflow-y-auto p-3 sm:p-4 lg:p-5">
          {!isWfmUser ? (
            <div className="sibs-card p-6 text-center">
              <AlertCircle
                className="mx-auto mb-3 text-amber-500"
                size={34}
              />

              <h2 className="m-0 text-lg font-bold text-sibs-primary-1">
                WFM access required
              </h2>

              <p className="mt-2 mb-0 text-sm text-sibs-tertiary-5">
                Calls KPI reporting is currently available
                only on the WFM dashboard.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <section className="sibs-card relative z-40 overflow-visible">
                <div className="flex flex-col gap-3 border-b border-sibs-tertiary-10 bg-sibs-primary-3/30 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <BarChart3
                        size={20}
                        className="text-sibs-primary-1"
                      />

                      <h1 className="m-0 text-lg font-extrabold text-sibs-primary-1">
                        Calls KPI Performance
                      </h1>
                    </div>

                    <p className="mt-1 mb-0 text-sm text-sibs-tertiary-5">
                      Backend-aggregated KPI reporting from
                      validated call data stored in PMS.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={loadKpis}
                    disabled={isLoading}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-sibs-tertiary-8 bg-white px-4 text-sm font-bold text-sibs-primary-1 shadow-sm disabled:opacity-50"
                  >
                    <RefreshCw
                      size={15}
                      className={
                        isLoading ? "animate-spin" : ""
                      }
                    />

                    Refresh
                  </button>
                </div>

                <div
                  className={`grid grid-cols-1 gap-3 p-4 md:grid-cols-2 ${
                    isCustomPeriod
                      ? "xl:grid-cols-5"
                      : "xl:grid-cols-4"
                  } xl:items-end`}
                >
                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-extrabold uppercase text-sibs-tertiary-5">
                      Account / Source
                    </span>

                    <select
                      value={draftFilters.sourceSystem}
                      onChange={handleSourceChange}
                      className="h-10 w-full rounded-lg border border-sibs-tertiary-8 bg-white px-3 text-sm font-semibold outline-none"
                    >
                      {SOURCE_OPTIONS.map((option) => (
                        <option
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-extrabold uppercase text-sibs-tertiary-5">
                      Reporting Period
                    </span>

                    <select
                      value={draftFilters.period}
                      onChange={handlePeriodChange}
                      className="h-10 w-full rounded-lg border border-sibs-tertiary-8 bg-white px-3 text-sm font-semibold outline-none"
                    >
                      {PERIOD_OPTIONS.map((option) => (
                        <option
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  {isCustomPeriod ? (
                    <>
                      <WfmKpiDatePicker
                        label="From"
                        value={draftFilters.from}
                        onChange={(from) =>
                          setDraftFilters(
                            (current) => ({
                              ...current,
                              from,
                            }),
                          )
                        }
                      />

                      <WfmKpiDatePicker
                        label="To"
                        value={draftFilters.to}
                        onChange={(to) =>
                          setDraftFilters(
                            (current) => ({
                              ...current,
                              to,
                            }),
                          )
                        }
                      />
                    </>
                  ) : (
                    <WfmKpiDatePicker
                      label="Reference Date"
                      value={draftFilters.referenceDate}
                      onChange={(referenceDate) =>
                        setDraftFilters(
                          (current) => ({
                            ...current,
                            referenceDate,
                          }),
                        )
                      }
                    />
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleApplyFilters}
                      disabled={isLoading}
                      className="h-10 flex-1 rounded-lg bg-sibs-primary-1 px-4 text-sm font-bold text-white disabled:opacity-50"
                    >
                      Apply
                    </button>

                    <button
                      type="button"
                      onClick={handleLatestRange}
                      disabled={
                        isLoading || isCustomPeriod
                      }
                      title={
                        isCustomPeriod
                          ? "Latest is available for weekly, monthly, quarterly, and annual reporting."
                          : "Use the latest available KPI date."
                      }
                      className="h-10 rounded-lg border border-sibs-tertiary-8 bg-white px-3 text-xs font-bold text-sibs-primary-1 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Latest
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-sibs-tertiary-10 px-5 py-3 text-xs font-semibold text-sibs-tertiary-5">
                  <span className="inline-flex items-center gap-1.5">
                    <Database size={14} />

                    {formatGrain(
                      dashboardData.filters?.dataGrain,
                    )}
                  </span>

                  <span>
                    Source:{" "}
                    {dashboardData.filters?.sourceSystem ||
                      "No source returned"}
                  </span>

                  <span>
                    Task Order: Not configured yet
                  </span>

                  {dashboardData.filters?.period !==
                  "custom" ? (
                    <span>
                      Reference date:{" "}
                      {dashboardData.filters
                        ?.referenceDate ||
                        "Not available"}
                    </span>
                  ) : null}

                  <span>
                    Range:{" "}
                    {dashboardData.filters?.dateFrom ||
                      "Not available"}{" "}
                    to{" "}
                    {dashboardData.filters?.dateTo ||
                      "Not available"}
                  </span>

                  {dashboardData.filters?.period !==
                  "custom" ? (
                    <span>
                      Comparison: 6 periods including the
                      selected/current period
                    </span>
                  ) : (
                    <span>
                      Comparison: Custom daily range
                    </span>
                  )}

                  <span>
                    Available grains:{" "}
                    {availableGrains.length
                      ? availableGrains.join(", ")
                      : "None returned"}
                  </span>

                  <span>
                    Available date range:{" "}
                    {dashboardData.availableDateRange
                      ?.minDate ||
                      "Not available"}{" "}
                    to{" "}
                    {dashboardData.availableDateRange
                      ?.maxDate ||
                      "Not available"}
                  </span>
                </div>
              </section>

              {error ? (
                <div className="sibs-card relative z-0 flex items-start gap-3 border border-red-200 p-4 text-sm text-red-700">
                  <AlertCircle
                    size={20}
                    className="mt-0.5 shrink-0"
                  />

                  <div>
                    <p className="m-0 font-bold">
                      Unable to load KPI data
                    </p>

                    <p className="mt-1 mb-0">
                      {error}
                    </p>
                  </div>
                </div>
              ) : null}

              {isLoading ? (
                <div className="sibs-card relative z-0 flex min-h-72 flex-col items-center justify-center gap-3 p-6 text-center">
                  <RefreshCw
                    size={30}
                    className="animate-spin text-sibs-primary-1"
                  />

                  <div>
                    <p className="m-0 font-bold text-sibs-primary-1">
                      Loading Calls KPI data
                    </p>

                    <p className="mt-1 mb-0 text-sm text-sibs-tertiary-5">
                      Aggregating validated records from
                      the PMS database.
                    </p>
                  </div>
                </div>
              ) : !error ? (
                <div className="relative z-0">
                  {emptyDataMessage ? (
                    <div className="sibs-card p-4 text-sm font-semibold text-sibs-tertiary-5">
                      {emptyDataMessage}
                    </div>
                  ) : null}

                  <WfmCallKpiDashboard
                    data={dashboardData}
                  />
                </div>
              ) : null}
            </div>
          )}
        </div>
      </main>

      <ConfirmationModal
        isOpen={dashboard.showLogoutModal}
        title="Confirm logout"
        message="Are you sure you want to logout?"
        cancelText="Cancel"
        confirmText="Logout"
        onCancel={() =>
          dashboard.setShowLogoutModal(false)
        }
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