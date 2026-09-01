import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  Clock,
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
    value: "US_VISA",
    label: "US Visa",
  },
  {
    value: "FUSECOM",
    label: "Fusecom",
  },
  {
    value: "HERODASH",
    label: "HeroDash",
  },
];

const TASK_ORDER_OPTIONS_BY_SOURCE = {
  US_VISA: [
    { value: "", label: "All Task Orders" },
    { value: "TO4", label: "TO4 - PAC" },
    { value: "TO10", label: "TO10 - SEASIA" },
    { value: "TO12", label: "TO12 - NICE" },
    { value: "TO16", label: "TO16 - SEURECA" },
  ],
  FUSECOM: [
    { value: "", label: "All Task Orders" },
    { value: "TO12", label: "TO12 - NICE" },
    { value: "TO16", label: "TO16 - SEURECA" },
  ],
  HERODASH: [
    { value: "", label: "All Task Orders" },
    { value: "TO4", label: "TO4 - PAC" },
    { value: "TO10", label: "TO10 - SEASIA" },
  ],
};

const SKILL_OPTIONS = [
  { value: "", label: "All Skills" },
  { value: "English All", label: "English All" },
  { value: "English NIV", label: "English NIV" },
  { value: "English IV", label: "English IV" },
  { value: "English ACS", label: "English ACS" },
  { value: "Non English", label: "Non English" },
];

const COUNTRY_OPTIONS_BY_SOURCE_AND_TO = {
  US_VISA: {
    "": [
      { value: "", label: "All Countries" },
      { value: "australia", label: "Australia" },
      { value: "austria", label: "Austria" },
      { value: "cambodia", label: "Cambodia" },
      { value: "china", label: "China" },
      { value: "czech republic", label: "Czech Republic" },
      { value: "denmark", label: "Denmark" },
      { value: "estonia", label: "Estonia" },
      { value: "fiji", label: "Fiji" },
      { value: "finland", label: "Finland" },
      { value: "germany", label: "Germany" },
      { value: "hong kong", label: "Hong Kong" },
      { value: "hungary", label: "Hungary" },
      { value: "indonesia", label: "Indonesia" },
      { value: "japan", label: "Japan" },
      { value: "korea", label: "Korea" },
      { value: "laos", label: "Laos" },
      { value: "latvia", label: "Latvia" },
      { value: "malaysia", label: "Malaysia" },
      { value: "montenegro", label: "Montenegro" },
      { value: "new zealand", label: "New Zealand" },
      { value: "norway", label: "Norway" },
      { value: "philippines", label: "Philippines" },
      { value: "singapore", label: "Singapore" },
      { value: "slovakia", label: "Slovakia" },
      { value: "sweden", label: "Sweden" },
      { value: "switzerland", label: "Switzerland" },
      { value: "taiwan", label: "Taiwan" },
      { value: "thailand", label: "Thailand" },
      { value: "vietnam", label: "Vietnam" },
    ],
    TO4: [
      { value: "", label: "All Countries (TO4)" },
      { value: "australia", label: "Australia" },
      { value: "fiji", label: "Fiji" },
      { value: "japan", label: "Japan" },
      { value: "korea", label: "Korea" },
      { value: "new zealand", label: "New Zealand" },
    ],
    TO10: [
      { value: "", label: "All Countries (TO10)" },
      { value: "cambodia", label: "Cambodia" },
      { value: "indonesia", label: "Indonesia" },
      { value: "laos", label: "Laos" },
      { value: "malaysia", label: "Malaysia" },
      { value: "philippines", label: "Philippines" },
      { value: "singapore", label: "Singapore" },
      { value: "taiwan", label: "Taiwan" },
      { value: "thailand", label: "Thailand" },
      { value: "vietnam", label: "Vietnam" },
    ],
    TO12: [
      { value: "", label: "All Countries (TO12)" },
      { value: "austria", label: "Austria" },
      { value: "czech republic", label: "Czech Republic" },
      { value: "denmark", label: "Denmark" },
      { value: "estonia", label: "Estonia" },
      { value: "finland", label: "Finland" },
      { value: "germany", label: "Germany" },
      { value: "hungary", label: "Hungary" },
      { value: "latvia", label: "Latvia" },
      { value: "montenegro", label: "Montenegro" },
      { value: "norway", label: "Norway" },
      { value: "slovakia", label: "Slovakia" },
      { value: "sweden", label: "Sweden" },
      { value: "switzerland", label: "Switzerland" },
    ],
    TO16: [
      { value: "", label: "All Countries (TO16)" },
      { value: "china", label: "China" },
      { value: "hong kong", label: "Hong Kong" },
    ],
  },
  FUSECOM: {
    "": [
      { value: "", label: "All Countries" },
      { value: "austria", label: "Austria" },
      { value: "china", label: "China" },
      { value: "czech republic", label: "Czech Republic" },
      { value: "denmark", label: "Denmark" },
      { value: "estonia", label: "Estonia" },
      { value: "finland", label: "Finland" },
      { value: "germany", label: "Germany" },
      { value: "hong kong", label: "Hong Kong" },
      { value: "hungary", label: "Hungary" },
      { value: "latvia", label: "Latvia" },
      { value: "montenegro", label: "Montenegro" },
      { value: "norway", label: "Norway" },
      { value: "slovakia", label: "Slovakia" },
      { value: "sweden", label: "Sweden" },
      { value: "switzerland", label: "Switzerland" },
    ],
    TO12: [
      { value: "", label: "All Countries (TO12)" },
      { value: "austria", label: "Austria" },
      { value: "czech republic", label: "Czech Republic" },
      { value: "denmark", label: "Denmark" },
      { value: "estonia", label: "Estonia" },
      { value: "finland", label: "Finland" },
      { value: "germany", label: "Germany" },
      { value: "hungary", label: "Hungary" },
      { value: "latvia", label: "Latvia" },
      { value: "montenegro", label: "Montenegro" },
      { value: "norway", label: "Norway" },
      { value: "slovakia", label: "Slovakia" },
      { value: "sweden", label: "Sweden" },
      { value: "switzerland", label: "Switzerland" },
    ],
    TO16: [
      { value: "", label: "All Countries (TO16)" },
      { value: "china", label: "China" },
      { value: "hong kong", label: "Hong Kong" },
    ],
  },
  HERODASH: {
    "": [
      { value: "", label: "All Countries" },
      { value: "australia", label: "Australia" },
      { value: "cambodia", label: "Cambodia" },
      { value: "fiji", label: "Fiji" },
      { value: "indonesia", label: "Indonesia" },
      { value: "japan", label: "Japan" },
      { value: "korea", label: "Korea" },
      { value: "laos", label: "Laos" },
      { value: "malaysia", label: "Malaysia" },
      { value: "new zealand", label: "New Zealand" },
      { value: "philippines", label: "Philippines" },
      { value: "singapore", label: "Singapore" },
      { value: "taiwan", label: "Taiwan" },
      { value: "thailand", label: "Thailand" },
      { value: "vietnam", label: "Vietnam" },
    ],
    TO4: [
      { value: "", label: "All Countries (TO4)" },
      { value: "australia", label: "Australia" },
      { value: "fiji", label: "Fiji" },
      { value: "japan", label: "Japan" },
      { value: "korea", label: "Korea" },
      { value: "new zealand", label: "New Zealand" },
    ],
    TO10: [
      { value: "", label: "All Countries (TO10)" },
      { value: "cambodia", label: "Cambodia" },
      { value: "indonesia", label: "Indonesia" },
      { value: "laos", label: "Laos" },
      { value: "malaysia", label: "Malaysia" },
      { value: "philippines", label: "Philippines" },
      { value: "singapore", label: "Singapore" },
      { value: "taiwan", label: "Taiwan" },
      { value: "thailand", label: "Thailand" },
      { value: "vietnam", label: "Vietnam" },
    ],
  },
};

const DEFAULT_FILTERS = {
  sourceSystem: "US_VISA",
  taskOrder: "",
  skill: "",
  country: "",
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

function getTaskOrderOptions(sourceSystem) {
  return (
    TASK_ORDER_OPTIONS_BY_SOURCE[sourceSystem] ||
    [{ value: "", label: "All Task Orders" }]
  );
}

function getTaskOrderLabel(sourceSystem, value) {
  return (
    getTaskOrderOptions(sourceSystem).find(
      (option) => option.value === String(value || ""),
    )?.label || "All Task Orders"
  );
}

function getSkillOptions() {
  return SKILL_OPTIONS;
}

function getSkillLabel(_sourceSystem, value) {
  const target = value !== undefined ? value : _sourceSystem;
  return (
    SKILL_OPTIONS.find(
      (option) =>
        option.value.toLowerCase() === String(target || "").toLowerCase(),
    )?.label || target || "All Skills"
  );
}

function getCountryOptions(sourceSystem, taskOrder) {
  const sourceCountries = COUNTRY_OPTIONS_BY_SOURCE_AND_TO[sourceSystem] || {};
  return (
    sourceCountries[taskOrder] ||
    sourceCountries[""] ||
    [{ value: "", label: "All Countries" }]
  );
}

function getCountryLabel(sourceSystem, taskOrder, value) {
  return (
    getCountryOptions(sourceSystem, taskOrder).find(
      (option) => option.value === String(value || "").toLowerCase(),
    )?.label || "All Countries"
  );
}

function buildRequestParams(filters) {
  const params = {
    period: filters.period,
    sourceSystem: filters.sourceSystem,
  };

  if (filters.taskOrder) {
    params.taskOrder = filters.taskOrder;
  }

  if (filters.skill) {
    params.skill = filters.skill;
  }

  if (filters.country) {
    params.country = filters.country;
  }

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

export default function ViewGraphsPage() {
  const dashboard = useDashboardPage();

  const userName =
    dashboard.authUser?.name ||
    dashboard.authUser?.username ||
    "User";

  const canViewGraphs = [
    "admin",
    "bod",
    "som",
    "wfm",
  ].includes(dashboard.authUser?.role) ||
    [7, 6, 10, 9].includes(
      Number(dashboard.authUser?.adminAccess || 0),
    );

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [kpiResponse, setKpiResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadKpis = useCallback(async () => {
    if (!canViewGraphs) {
      return;
    }

    if (filters.period === "custom") {
      if (!filters.from || !filters.to) {
        return;
      }

      if (filters.from > filters.to) {
        setError({
          title: "Invalid Date Range",
          message: "The start date cannot be later than the end date.",
        });
        return;
      }
    }

    setIsLoading(true);
    setError("");

    try {
      const params = buildRequestParams(filters);
      const response = await getWfmCallKpis(params);

      setKpiResponse(response);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
      setKpiResponse(null);
    } finally {
      setIsLoading(false);
    }
  }, [canViewGraphs, filters]);

  useEffect(() => {
    loadKpis();
  }, [loadKpis]);

  useEffect(() => {
    const returnedFilters = kpiResponse?.data?.data?.filters || {};
    if (
      returnedFilters.referenceDate &&
      !filters.referenceDate &&
      filters.period !== "custom"
    ) {
      setFilters((current) => ({
        ...current,
        referenceDate: returnedFilters.referenceDate,
      }));
    }
  }, [kpiResponse, filters.referenceDate, filters.period]);

  const handleSourceChange = (event) => {
    const sourceSystem = event.target.value;

    setFilters((current) => ({
      ...current,
      sourceSystem,
      taskOrder: "",
      skill: "",
      country: "",
      referenceDate: "",
      from: "",
      to: "",
    }));
  };

  const handleTaskOrderChange = (event) => {
    const taskOrder = event.target.value;

    setFilters((current) => ({
      ...current,
      taskOrder,
      country: "",
      referenceDate: "",
      from: "",
      to: "",
    }));
  };

  const handleSkillChange = (event) => {
    const skill = event.target.value;

    setFilters((current) => ({
      ...current,
      skill,
      referenceDate: "",
      from: "",
      to: "",
    }));
  };

  const handleCountryChange = (event) => {
    const country = event.target.value;

    setFilters((current) => ({
      ...current,
      country,
      referenceDate: "",
      from: "",
      to: "",
    }));
  };

  const handlePeriodChange = (event) => {
    const nextPeriod = event.target.value;

    setFilters((current) => ({
      ...current,
      period: nextPeriod,
      referenceDate: "",
      from: "",
      to: "",
    }));
  };

  const handleReferenceDateChange = (referenceDate) => {
    setFilters((current) => ({
      ...current,
      referenceDate: referenceDate || "",
    }));
  };

  const handleLatestRange = () => {
    if (filters.period === "custom") {
      return;
    }

    setFilters((current) => ({
      ...current,
      referenceDate: "",
      from: "",
      to: "",
    }));
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
    filters.sourceSystem;

  const taskOrderOptions = getTaskOrderOptions(
    filters.sourceSystem,
  );

  const skillOptions = getSkillOptions(
    filters.sourceSystem,
  );

  const countryOptions = getCountryOptions(
    filters.sourceSystem,
    filters.taskOrder,
  );

  const activeTaskOrder =
    dashboardData.filters?.taskOrder ||
    filters.taskOrder;

  const emptyDataMessage =
    !availableGrains.length
      ? `No validated ${getSourceLabel(
          activeSourceSystem,
        )} KPI data is available.`
      : !series.length
        ? "No KPI data is available for the selected reporting range."
        : "";

  const isCustomPeriod =
    filters.period === "custom";

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

        <div className="sibs-scrollbar max-h-[calc(100vh-74px)] overflow-y-auto p-3 sm:p-3.5">
          {!canViewGraphs ? (
            <div className="sibs-card p-6 text-center">
              <AlertCircle
                className="mx-auto mb-3 text-amber-500"
                size={34}
              />

              <h2 className="m-0 text-lg font-bold text-sibs-primary-1">
                Graph access required
              </h2>

              <p className="mt-2 mb-0 text-sm text-sibs-tertiary-5">
                Calls KPI reporting is available for
                WFM, BOD, Admin, and SOM dashboards.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <section className="sibs-card relative z-40 overflow-visible shadow-xs">
                <div className="border-b border-sibs-tertiary-10 bg-sibs-primary-3/30 px-3.5 py-1.5">
                  <div className="flex items-center gap-2">
                    <BarChart3
                      size={16}
                      className="text-sibs-primary-1"
                    />

                    <h1 className="m-0 text-sm font-extrabold text-sibs-primary-1">
                      Calls KPI Performance
                    </h1>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 p-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 xl:items-end">
                  {/* 1. Account / Source */}
                  <label className="block">
                    <span className="mb-0.5 block text-[9.5px] font-extrabold uppercase text-sibs-tertiary-5">
                      Account / Source
                    </span>

                    <select
                      value={filters.sourceSystem}
                      onChange={handleSourceChange}
                      className="h-8 w-full cursor-pointer rounded-lg border border-sibs-tertiary-8 bg-white px-2.5 text-xs font-semibold text-sibs-primary-1 outline-none transition hover:border-sibs-primary-1 hover:bg-slate-50/50 focus:border-sibs-primary-1 focus:ring-1 focus:ring-sibs-primary-1/20"
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

                  {/* 2. Task Order */}
                  <label className="block">
                    <span className="mb-0.5 block text-[9.5px] font-extrabold uppercase text-sibs-tertiary-5">
                      Task Order
                    </span>

                    <select
                      value={filters.taskOrder}
                      onChange={handleTaskOrderChange}
                      className="h-8 w-full cursor-pointer rounded-lg border border-sibs-tertiary-8 bg-white px-2.5 text-xs font-semibold text-sibs-primary-1 outline-none transition hover:border-sibs-primary-1 hover:bg-slate-50/50 focus:border-sibs-primary-1 focus:ring-1 focus:ring-sibs-primary-1/20"
                    >
                      {taskOrderOptions.map((option) => (
                        <option
                          key={option.value || "ALL"}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  {/* 3. Skill */}
                  <label className="block">
                    <span className="mb-0.5 block text-[9.5px] font-extrabold uppercase text-sibs-tertiary-5">
                      Skill
                    </span>

                    <select
                      value={filters.skill}
                      onChange={handleSkillChange}
                      className="h-8 w-full cursor-pointer rounded-lg border border-sibs-tertiary-8 bg-white px-2.5 text-xs font-semibold text-sibs-primary-1 outline-none transition hover:border-sibs-primary-1 hover:bg-slate-50/50 focus:border-sibs-primary-1 focus:ring-1 focus:ring-sibs-primary-1/20"
                    >
                      {skillOptions.map((option) => (
                        <option
                          key={option.value || "ALL_SKILLS"}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  {/* 4. Country */}
                  <label className="block">
                    <span className="mb-0.5 block text-[9.5px] font-extrabold uppercase text-sibs-tertiary-5">
                      Country
                    </span>

                    <select
                      value={filters.country}
                      onChange={handleCountryChange}
                      className="h-8 w-full cursor-pointer rounded-lg border border-sibs-tertiary-8 bg-white px-2.5 text-xs font-semibold text-sibs-primary-1 outline-none transition hover:border-sibs-primary-1 hover:bg-slate-50/50 focus:border-sibs-primary-1 focus:ring-1 focus:ring-sibs-primary-1/20"
                    >
                      {countryOptions.map((option) => (
                        <option
                          key={option.value || "ALL_COUNTRIES"}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  {/* 5. Reporting Period */}
                  <label className="block">
                    <span className="mb-0.5 block text-[9.5px] font-extrabold uppercase text-sibs-tertiary-5">
                      Reporting Period
                    </span>

                    <select
                      value={filters.period}
                      onChange={handlePeriodChange}
                      className="h-8 w-full cursor-pointer rounded-lg border border-sibs-tertiary-8 bg-white px-2.5 text-xs font-semibold text-sibs-primary-1 outline-none transition hover:border-sibs-primary-1 hover:bg-slate-50/50 focus:border-sibs-primary-1 focus:ring-1 focus:ring-sibs-primary-1/20"
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

                  {/* 6. Reference Date (or From + To) */}
                  {isCustomPeriod ? (
                    <>
                      <WfmKpiDatePicker
                        label="From"
                        value={filters.from}
                        onChange={(from) =>
                          setFilters((current) => ({
                            ...current,
                            from: from || "",
                          }))
                        }
                      />

                      <WfmKpiDatePicker
                        label="To"
                        value={filters.to}
                        onChange={(to) =>
                          setFilters((current) => ({
                            ...current,
                            to: to || "",
                          }))
                        }
                      />
                    </>
                  ) : (
                    <>
                      <WfmKpiDatePicker
                        label="Reference Date"
                        value={filters.referenceDate}
                        onChange={handleReferenceDateChange}
                      />

                      {/* 7. Latest button */}
                      <div>
                        <button
                          type="button"
                          onClick={handleLatestRange}
                          disabled={isLoading}
                          title="Use the latest available KPI date."
                          className="inline-flex h-8 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-sibs-primary-1 shadow-xs transition hover:border-sibs-primary-1 hover:bg-sibs-primary-1 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Clock size={12} className="shrink-0" />
                          <span>Latest</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 border-t border-sibs-tertiary-10 px-3.5 py-1 text-[10px] font-semibold text-sibs-tertiary-5">
                  <span className="inline-flex items-center gap-1">
                    <Database size={11} />

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
                    Task Order:{" "}
                    {getTaskOrderLabel(
                      activeSourceSystem,
                      activeTaskOrder,
                    )}
                  </span>

                  {filters.skill ? (
                    <span>
                      Skill:{" "}
                      {getSkillLabel(
                        activeSourceSystem,
                        filters.skill,
                      )}
                    </span>
                  ) : null}

                  {filters.country ? (
                    <span>
                      Country:{" "}
                      {getCountryLabel(
                        activeSourceSystem,
                        activeTaskOrder,
                        filters.country,
                      )}
                    </span>
                  ) : null}

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
                      Comparison: 6 periods
                    </span>
                  ) : (
                    <span>
                      Comparison: Custom range
                    </span>
                  )}

                  <span>
                    Available:{" "}
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
                <div className="sibs-card relative z-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-red-200 bg-red-50/60 p-3 text-xs text-red-800 shadow-xs">
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
