// WFM Calls KPI dashboard. Data is aggregated by the backend from canonical PMS rows.
import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Clock,
  Database,
  Filter,
  RefreshCw,
} from "lucide-react";

import AdminSidebar from "@/components/layout/AdminSidebar";
import AppHeader from "@/components/layout/AppHeader";
import AppModal from "@/components/ui/app-modal";
import { Button } from "@/components/ui/button";
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
  const raw =
    error?.response?.data?.message ||
    error?.message ||
    "";

  if (!raw) {
    return {
      title: "No KPI Data Available",
      message: "No call records were found for the selected filter criteria.",
    };
  }

  const match = raw.match(
    /Reference date must be between (\d{4}-\d{2}-\d{2}) and (\d{4}-\d{2}-\d{2})/i,
  );

  if (match) {
    const [, minDate, maxDate] = match;
    return {
      title: "No Call Records for This Date",
      message: `There is no imported call data for the selected date. Call records are available from ${minDate} to ${maxDate}. Please choose a date within this range or click "Latest".`,
      isDateRangeError: true,
    };
  }

  if (/Reference date must be between/i.test(raw)) {
    return {
      title: "Date Outside Available Range",
      message: "There is no imported call data for the selected date. Please choose an available date or click 'Latest'.",
      isDateRangeError: true,
    };
  }

  if (/Custom reporting requires both/i.test(raw)) {
    return {
      title: "Missing Date Range",
      message: "Custom reporting requires both a 'From' and 'To' date.",
    };
  }

  if (/start date cannot be later/i.test(raw)) {
    return {
      title: "Invalid Date Range",
      message: "The start date cannot be later than the end date.",
    };
  }

  return {
    title: "Unable to Load KPI Data",
    message: raw,
  };
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

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null,
    title: "",
    message: "",
  });

  const [isProcessingModal, setIsProcessingModal] = useState(false);
  const [processingModalInfo, setProcessingModalInfo] = useState({
    title: "Loading KPI Data",
    message: "Please wait while we calculate and load KPI metrics.",
  });

  const [successModal, setSuccessModal] = useState({
    isOpen: false,
    title: "",
    message: "",
  });

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
        setError({
          title: "Missing Date Range",
          message: "Custom reporting requires both a 'From' and 'To' date.",
        });

        return;
      }

      if (draftFilters.from > draftFilters.to) {
        setError({
          title: "Invalid Date Range",
          message: "The start date cannot be later than the end date.",
        });

        return;
      }
    }

    setConfirmModal({
      isOpen: true,
      type: "apply",
      title: "Apply KPI Filters?",
      message:
        "Are you sure you want to apply the selected filters and generate the KPI performance graphs?",
    });
  };

  const handleLatestRange = () => {
    if (draftFilters.period === "custom") {
      return;
    }

    setConfirmModal({
      isOpen: true,
      type: "latest",
      title: "Load Latest KPI Data?",
      message:
        "Are you sure you want to switch to the latest available KPI reporting period?",
    });
  };

  const handleConfirmAction = async () => {
    const actionType = confirmModal.type;
    setConfirmModal({ isOpen: false, type: null, title: "", message: "" });

    let targetFilters;

    if (actionType === "apply") {
      targetFilters = {
        sourceSystem: draftFilters.sourceSystem,
        period: draftFilters.period,
        referenceDate:
          draftFilters.period === "custom" ? "" : draftFilters.referenceDate,
        from: draftFilters.period === "custom" ? draftFilters.from : "",
        to: draftFilters.period === "custom" ? draftFilters.to : "",
      };
      setProcessingModalInfo({
        title: "Applying KPI Filters",
        message:
          "Please wait while we aggregate records and generate performance metrics...",
      });
    } else if (actionType === "latest") {
      targetFilters = {
        sourceSystem: draftFilters.sourceSystem,
        period: draftFilters.period,
        referenceDate: "",
        from: "",
        to: "",
      };
      setDraftFilters(targetFilters);
      setProcessingModalInfo({
        title: "Loading Latest KPI Data",
        message:
          "Please wait while we retrieve the latest available KPI reporting period...",
      });
    } else {
      return;
    }

    setIsProcessingModal(true);
    setError(null);

    try {
      const params = buildRequestParams(targetFilters);
      const response = await getWfmCallKpis(params);

      setKpiResponse(response);
      setAppliedFilters(targetFilters);

      const dashboardData = response?.data?.data || null;
      const returnedFilters = dashboardData?.filters || {};

      if (actionType === "latest" && returnedFilters.referenceDate) {
        setDraftFilters((curr) => ({
          ...curr,
          referenceDate: returnedFilters.referenceDate,
        }));
      }

      await new Promise((resolve) => setTimeout(resolve, 350));
      setIsProcessingModal(false);

      setSuccessModal({
        isOpen: true,
        title:
          actionType === "apply"
            ? "Filters Applied Successfully"
            : "Latest KPI Data Loaded",
        message: "Calls KPI metrics and performance graphs have been updated.",
      });
    } catch (err) {
      setIsProcessingModal(false);
      setError(getErrorMessage(err));
      setKpiResponse(null);
    }
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
                    className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-bold text-sibs-primary-1 shadow-xs transition hover:border-sibs-primary-1 hover:bg-sibs-primary-1 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
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

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={handleApplyFilters}
                      disabled={isLoading}
                      className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-sibs-primary-1 px-3 text-sm font-bold text-white shadow-xs transition hover:bg-sibs-tertiary-4 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Filter size={15} className="shrink-0" />
                      <span>Apply</span>
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
                      className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-sibs-primary-1 shadow-xs transition hover:border-sibs-primary-1 hover:bg-sibs-primary-1 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Clock size={14} className="shrink-0" />
                      <span>Latest</span>
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
                <div className="sibs-card relative z-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-red-200 bg-red-50/60 p-4 text-sm text-red-800 shadow-sm">
                  <div className="flex items-start gap-3">
                    <AlertCircle
                      size={20}
                      className="mt-0.5 shrink-0 text-red-600"
                    />

                    <div>
                      <p className="m-0 font-bold text-red-900">
                        {typeof error === "object" ? error.title : "No Call Records for This Date"}
                      </p>

                      <p className="mt-1 mb-0 text-xs sm:text-sm text-red-700">
                        {typeof error === "object" ? error.message : error}
                      </p>
                    </div>
                  </div>

                  {typeof error === "object" && error.isDateRangeError ? (
                    <button
                      type="button"
                      onClick={handleLatestRange}
                      className="inline-flex shrink-0 items-center justify-center rounded-lg border border-red-300 bg-white px-3.5 py-1.5 text-xs font-extrabold text-red-700 shadow-sm transition hover:bg-red-50"
                    >
                      Use Latest Available Date
                    </button>
                  ) : null}
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
              ) : (
                <div className="relative z-0">
                  {emptyDataMessage && !error ? (
                    <div className="sibs-card mb-4 p-4 text-sm font-semibold text-sibs-tertiary-5">
                      {emptyDataMessage}
                    </div>
                  ) : null}

                  <WfmCallKpiDashboard
                    data={dashboardData || {}}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Action Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        cancelText="Cancel"
        confirmText={confirmModal.type === "apply" ? "Apply Filters" : "Load Latest"}
        onCancel={() =>
          setConfirmModal({ isOpen: false, type: null, title: "", message: "" })
        }
        onConfirm={handleConfirmAction}
        tone="neutral"
      />

      {/* Action Processing Loading Modal */}
      <LoadingModal
        isOpen={isProcessingModal}
        title={processingModalInfo.title}
        message={processingModalInfo.message}
      />

      {/* Action Success Modal */}
      <AppModal
        isOpen={successModal.isOpen}
        textAlign="center"
        zIndex="z-[140]"
      >
        <div className="flex items-center justify-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 shadow-xs ring-4 ring-emerald-50/60">
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="m-0 text-lg font-extrabold text-sibs-primary-1">
            {successModal.title}
          </p>
        </div>

        <p className="mt-2.5 mb-0 text-sm text-sibs-tertiary-5">
          {successModal.message}
        </p>

        <div className="mt-6 flex justify-center">
          <Button
            type="button"
            onClick={() =>
              setSuccessModal({ isOpen: false, title: "", message: "" })
            }
            className="h-10 min-w-[120px] cursor-pointer rounded-xl bg-sibs-primary-1 px-6 font-bold text-white shadow-xs transition hover:bg-sibs-tertiary-4"
          >
            Done
          </Button>
        </div>
      </AppModal>

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