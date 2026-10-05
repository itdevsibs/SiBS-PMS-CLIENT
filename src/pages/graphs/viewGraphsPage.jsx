import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  AlertCircle,
  BarChart3,
  ChevronDown,
  Clock,
  Database,
  Download,
  Filter,
  Loader2,
  Menu,
  RefreshCw,
  Users,
} from "lucide-react";

import AdminSidebar from "@/components/layout/AdminSidebar";
import AppHeader from "@/components/layout/AppHeader";
import ConfirmationModal from "@/components/ui/confirmation-modal";
import LoadingModal from "@/components/ui/loading-modal";
import CallKpiDashboard from "@/components/kpi/CallKpiDashboard";
import EmailKpiDashboard, {
  EmailSummaryCards,
} from "@/components/kpi/EmailKpiDashboard";
import QualityAuditKpiDashboard, {
  QualityAuditSummaryCards,
} from "@/components/kpi/QualityAuditKpiDashboard";
import DownloadPdfModal from "@/components/kpi/DownloadPdfModal";
import AllReportsExecutivePdfView from "@/components/kpi/AllReportsExecutivePdfView";
import {
  downloadKpiGraphsAsPdf,
  downloadSelectedKpiReportsAsPdf,
} from "@/components/kpi/callKpiDashboardUtils";
import DatePicker from "@/components/ui/Filter/DatePicker";
import MultiSelectDropdown from "@/components/ui/Filter/MultiSelectDropdown";
import SingleSelectDropdown from "@/components/ui/Filter/SingleSelectDropdown";
import { PERMISSIONS } from "@/config/accessControl";
import useDashboardPage from "@/hooks/useDashboardPage";
import {
  getWfmCallKpis,
  getWfmCallSkills,
  getWfmEmailKpis,
  getWfmQualityAuditKpis,
} from "@/lib/axios/wfm-kpis";
import {
  PERIOD_OPTIONS,
  SOURCE_OPTIONS,
  LOB_OPTIONS,
  DEFAULT_FILTERS,
  SKILLS_BY_COUNTRY,
  getTaskOrderOptions,
  getTaskOrderLabel,
  getSkillOptions,
  getSkillLabel,
  getCountryOptions,
  getCountryLabel,
} from "@/config/kpiFiltersConfig";

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

function buildRequestParams(filters) {
  const params = {
    period: filters.period,
  };

  // 1. Source System
  if (Array.isArray(filters.sourceSystem) && filters.sourceSystem.length > 0) {
    if (!filters.sourceSystem.includes("__NONE__")) {
      params.sourceSystem = filters.sourceSystem.join(",");
    }
  } else if (typeof filters.sourceSystem === "string" && filters.sourceSystem) {
    params.sourceSystem = filters.sourceSystem;
  } else {
    params.sourceSystem = "US_VISA";
  }

  // 2. Task Order
  if (Array.isArray(filters.taskOrder) && filters.taskOrder.length > 0) {
    if (!filters.taskOrder.includes("__NONE__")) {
      params.taskOrder = filters.taskOrder.join(",");
    }
  } else if (typeof filters.taskOrder === "string" && filters.taskOrder) {
    params.taskOrder = filters.taskOrder;
  }

  // 3. Skill
  if (Array.isArray(filters.skill) && filters.skill.length > 0) {
    if (!filters.skill.includes("__NONE__")) {
      params.skill = filters.skill.join(",");
    }
  } else if (typeof filters.skill === "string" && filters.skill) {
    params.skill = filters.skill;
  }

  // 4. Country
  if (Array.isArray(filters.country) && filters.country.length > 0) {
    if (!filters.country.includes("__NONE__")) {
      params.country = filters.country.join(",");
    }
  } else if (typeof filters.country === "string" && filters.country) {
    params.country = filters.country;
  }

  // 5. Period / Date
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

function buildEmailRequestParams(filters) {
  const params = {
    period: filters.period,
  };

  if (Array.isArray(filters.taskOrder) && filters.taskOrder.length > 0) {
    const taskOrders = filters.taskOrder.filter((value) => value && value !== "__NONE__");
    if (taskOrders.length) params.taskOrder = taskOrders.join(",");
  } else if (typeof filters.taskOrder === "string" && filters.taskOrder) {
    params.taskOrder = filters.taskOrder;
  }

  if (Array.isArray(filters.country) && filters.country.length > 0) {
    const countries = filters.country.filter((value) => value && value !== "__NONE__");
    if (countries.length) params.country = countries.join(",");
  } else if (typeof filters.country === "string" && filters.country) {
    params.country = filters.country;
  }

  if (filters.period === "custom") {
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;
  } else if (filters.referenceDate) {
    params.referenceDate = filters.referenceDate;
  }

  return params;
}

function buildQualityAuditRequestParams(filters) {
  // Quality Audit uses the shared reporting range, Task Order, Country, and LOB.
  // Account/Source and Skill are Calls-only filters and must not affect QA.
  const params = buildEmailRequestParams(filters);

  if (filters.lob && typeof filters.lob === "string") {
    params.lob = filters.lob;
  } else if (Array.isArray(filters.lob) && filters.lob.length > 0) {
    const lobs = filters.lob.filter((value) => value && value !== "__NONE__");
    if (lobs.length) params.lob = lobs.join(",");
  }

  return params;
}

export default function ViewGraphsPage() {
  const dashboard = useDashboardPage();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const currentSection = (searchParams.get("section") || "").toLowerCase();
  const isCallsOnly = currentSection === "calls";
  const isEmailsOnly = currentSection === "emails";
  const isQaOnly = currentSection === "qa";
  const isOccupancyOnly = currentSection === "occupancy";

  const showCalls = !currentSection || isCallsOnly;
  const showEmails = !currentSection || isEmailsOnly;
  const showQa = !currentSection || isQaOnly;
  const showOccupancy = isOccupancyOnly;

  useEffect(() => {
    const mainContainer = document.querySelector(".sibs-scrollbar");
    if (mainContainer) {
      mainContainer.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [location.search]);

  const userName =
    dashboard.authUser?.name ||
    dashboard.authUser?.username ||
    "User";

  const canViewGraphs = dashboard.hasPermission(
    PERMISSIONS.VIEW_WOW_REPORT,
  );

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [kpiResponse, setKpiResponse] = useState(null);
  const [emailKpiResponse, setEmailKpiResponse] = useState(null);
  const [qualityAuditKpiResponse, setQualityAuditKpiResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [qualityAuditError, setQualityAuditError] = useState("");
  const [skillsByCountryState, setSkillsByCountryState] = useState(SKILLS_BY_COUNTRY);
  const [showFilters, setShowFilters] = useState(true);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [showDownloadPdfModal, setShowDownloadPdfModal] = useState(false);
  const [exportingSections, setExportingSections] = useState([]);
  const skipNextFetchRef = useRef(false);

  const handleExecutePdfDownload = async (selectedReportIds = []) => {
    if (isDownloadingPdf || !selectedReportIds.length) return;
    try {
      setIsDownloadingPdf(true);
      setExportingSections(selectedReportIds);

      const isAllReports =
        selectedReportIds.length >= 4 ||
        (selectedReportIds.includes("calls") &&
          selectedReportIds.includes("emails") &&
          selectedReportIds.includes("qa") &&
          selectedReportIds.includes("occupancy"));

      // Ensure data is loaded for any selected report that isn't currently loaded
      const fetches = [];
      if ((isAllReports || selectedReportIds.includes("calls")) && !kpiResponse) {
        fetches.push(
          getWfmCallKpis(buildRequestParams(filters)).then((res) => setKpiResponse(res)),
        );
      }
      if ((isAllReports || selectedReportIds.includes("emails")) && !emailKpiResponse) {
        fetches.push(
          getWfmEmailKpis(buildEmailRequestParams(filters)).then((res) => setEmailKpiResponse(res)),
        );
      }
      if ((isAllReports || selectedReportIds.includes("qa")) && !qualityAuditKpiResponse) {
        fetches.push(
          getWfmQualityAuditKpis(buildQualityAuditRequestParams(filters)).then((res) => setQualityAuditKpiResponse(res)),
        );
      }

      if (fetches.length > 0) {
        await Promise.allSettled(fetches);
      }

      // Allow DOM to settle and render charts
      await new Promise((resolve) => setTimeout(resolve, 400));

      if (isAllReports) {
        await downloadSelectedKpiReportsAsPdf({
          isAllReportsDashboard: true,
          allReportsElementId: "export-all-reports-dashboard",
        });
        setShowDownloadPdfModal(false);
        return;
      }

      const sectionsToExport = [];

      if (selectedReportIds.includes("calls")) {
        const elId = showCalls ? "calls-section" : "export-calls-section";
        sectionsToExport.push({
          id: "calls",
          name: "Calls",
          title: "CALLS KPI PERFORMANCE GRAPHS",
          elementId: elId,
        });
      }

      if (selectedReportIds.includes("emails")) {
        const elId = showEmails ? "emails-section" : "export-emails-section";
        sectionsToExport.push({
          id: "emails",
          name: "Email",
          title: "EMAIL KPI PERFORMANCE GRAPHS",
          elementId: elId,
        });
      }

      if (selectedReportIds.includes("qa")) {
        const elId = showQa ? "qa-section" : "export-qa-section";
        sectionsToExport.push({
          id: "qa",
          name: "Quality-Audit",
          title: "QUALITY AUDIT PERFORMANCE GRAPHS",
          elementId: elId,
        });
      }

      if (selectedReportIds.includes("occupancy")) {
        const elId = showOccupancy ? "occupancy-section" : "export-occupancy-section";
        sectionsToExport.push({
          id: "occupancy",
          name: "Occupancy",
          title: "OCCUPANCY & HEADCOUNT PERFORMANCE",
          elementId: elId,
        });
      }

      await downloadSelectedKpiReportsAsPdf({ sections: sectionsToExport });
      setShowDownloadPdfModal(false);
    } catch (err) {
      console.error("Failed to download PDF report:", err);
    } finally {
      setIsDownloadingPdf(false);
      setExportingSections([]);
    }
  };

  useEffect(() => {
    let isMounted = true;
    getWfmCallSkills()
      .then((res) => {
        if (!isMounted || !res?.data) return;
        const serverMap = res.data;
        setSkillsByCountryState((prev) => {
          const merged = { ...prev };
          for (const [country, skills] of Object.entries(serverMap)) {
            if (!merged[country]) {
              merged[country] = skills;
            } else {
              const current = [...merged[country]];
              for (const s of skills) {
                const key = s.toLowerCase().replace(/[^a-z0-9]/g, "");
                if (!current.some((c) => c.toLowerCase().replace(/[^a-z0-9]/g, "") === key)) {
                  current.push(s);
                }
              }
              merged[country] = current;
            }
          }
          return merged;
        });
      })
      .catch((err) => {
        console.warn("Could not load dynamic source skills:", err?.message);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const loadKpis = useCallback(async () => {
    if (!canViewGraphs) {
      return;
    }

    if (skipNextFetchRef.current) {
      skipNextFetchRef.current = false;
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
    setEmailError("");
    setQualityAuditError("");

    try {
      const promises = [];

      if (showCalls) {
        const callParams = buildRequestParams(filters);
        promises.push(
          getWfmCallKpis(callParams)
            .then((res) => {
              setKpiResponse(res);
            })
            .catch((err) => {
              setError(getErrorMessage(err));
              setKpiResponse(null);
            }),
        );
      } else {
        setKpiResponse(null);
      }

      if (showEmails) {
        const emailParams = buildEmailRequestParams(filters);
        promises.push(
          getWfmEmailKpis(emailParams)
            .then((res) => {
              setEmailKpiResponse(res);
            })
            .catch((err) => {
              const emailMessage =
                err?.response?.data?.message ||
                err?.message ||
                "Unable to load Email KPI data.";
              setEmailError(emailMessage);
              setEmailKpiResponse(null);
            }),
        );
      } else {
        setEmailKpiResponse(null);
      }

      if (showQa) {
        const qualityAuditParams = buildQualityAuditRequestParams(filters);
        promises.push(
          getWfmQualityAuditKpis(qualityAuditParams)
            .then((res) => {
              setQualityAuditKpiResponse(res);
            })
            .catch((err) => {
              const qualityMessage =
                err?.response?.data?.message ||
                err?.message ||
                "Unable to load Quality Audit KPI data.";
              setQualityAuditError(qualityMessage);
              setQualityAuditKpiResponse(null);
            }),
        );
      } else {
        setQualityAuditKpiResponse(null);
      }

      await Promise.allSettled(promises);
    } finally {
      setIsLoading(false);
    }
  }, [canViewGraphs, filters, showCalls, showEmails, showQa]);

  useEffect(() => {
    loadKpis();
  }, [loadKpis]);

  useEffect(() => {
    const callReturnedFilters = kpiResponse?.data?.data?.filters || {};
    const emailReturnedFilters = emailKpiResponse?.data?.data?.filters || {};
    const qualityAuditReturnedFilters = qualityAuditKpiResponse?.data?.data?.filters || {};
    const returnedReferenceDate =
      callReturnedFilters.referenceDate ||
      emailReturnedFilters.referenceDate ||
      qualityAuditReturnedFilters.referenceDate ||
      "";
    if (
      returnedReferenceDate &&
      !filters.referenceDate &&
      filters.period !== "custom"
    ) {
      const allAligned =
        callReturnedFilters.referenceDate === returnedReferenceDate &&
        emailReturnedFilters.referenceDate === returnedReferenceDate &&
        qualityAuditReturnedFilters.referenceDate === returnedReferenceDate;
      skipNextFetchRef.current = allAligned;
      setFilters((current) => ({
        ...current,
        referenceDate: returnedReferenceDate,
      }));
    }
  }, [
    kpiResponse,
    emailKpiResponse,
    qualityAuditKpiResponse,
    filters.referenceDate,
    filters.period,
  ]);

  const handleSourceChange = (newSources) => {
    setFilters((current) => {
      const nextSource = Array.isArray(newSources) ? newSources : [newSources];
      const validTaskOrders = new Set(
        getTaskOrderOptions(nextSource).map((to) => to.value),
      );
      const nextTaskOrder = Array.isArray(current.taskOrder)
        ? current.taskOrder.filter((to) => validTaskOrders.has(to))
        : [];
      const validCountries = new Set(
        getCountryOptions(nextSource, nextTaskOrder).map((c) => c.value),
      );
      const nextCountry = Array.isArray(current.country)
        ? current.country.filter((c) => validCountries.has(c))
        : [];

      const newSkillOptions = getSkillOptions(
        nextSource,
        nextCountry,
        nextTaskOrder,
      );
      const validSkills = new Set(
        newSkillOptions.map((s) => s.value.toLowerCase()),
      );
      const nextSkill = Array.isArray(current.skill)
        ? current.skill.filter((s) => validSkills.has(s.toLowerCase()))
        : [];

      return {
        ...current,
        sourceSystem: newSources,
        taskOrder: nextTaskOrder,
        country: nextCountry,
        skill: nextSkill,
      };
    });
  };

  const handleTaskOrderChange = (newTaskOrders) => {
    setFilters((current) => {
      const nextTaskOrders = Array.isArray(newTaskOrders)
        ? newTaskOrders
        : [newTaskOrders];
      const newCountryOptions = getCountryOptions(
        current.sourceSystem,
        nextTaskOrders,
      );
      const validCountryValues = new Set(
        newCountryOptions.map((c) => c.value),
      );
      const nextCountry = Array.isArray(current.country)
        ? current.country.filter((c) => validCountryValues.has(c))
        : [];

      const newSkillOptions = getSkillOptions(
        current.sourceSystem,
        nextCountry,
        nextTaskOrders,
        skillsByCountryState,
      );
      const validSkills = new Set(
        newSkillOptions.map((s) => s.value.toLowerCase()),
      );
      const nextSkill = Array.isArray(current.skill)
        ? current.skill.filter((s) => validSkills.has(s.toLowerCase()))
        : [];

      return {
        ...current,
        taskOrder: newTaskOrders,
        country: nextCountry,
        skill: nextSkill,
      };
    });
  };

  const handleCountryChange = (newCountries) => {
    setFilters((current) => {
      const nextCountries = Array.isArray(newCountries)
        ? newCountries
        : [newCountries];
      const newSkillOptions = getSkillOptions(
        current.sourceSystem,
        nextCountries,
        current.taskOrder,
        skillsByCountryState,
      );
      const validSkills = new Set(
        newSkillOptions.map((s) => s.value.toLowerCase()),
      );
      const nextSkill = Array.isArray(current.skill)
        ? current.skill.filter((s) => validSkills.has(s.toLowerCase()))
        : [];

      return {
        ...current,
        country: newCountries,
        skill: nextSkill,
      };
    });
  };

  const handleSkillChange = (newSkills) => {
    setFilters((current) => ({
      ...current,
      skill: newSkills,
    }));
  };

  const handleLobChange = (eventOrValue) => {
    const nextLob =
      typeof eventOrValue === "object" && eventOrValue?.target
        ? eventOrValue.target.value
        : eventOrValue;

    setFilters((current) => ({
      ...current,
      lob: nextLob || "",
    }));
  };

  const handlePeriodChange = (eventOrValue) => {
    const nextPeriod =
      typeof eventOrValue === "object" && eventOrValue?.target
        ? eventOrValue.target.value
        : eventOrValue;

    setFilters((current) => ({
      ...current,
      period: nextPeriod,
      referenceDate: current.referenceDate || "2026-07-31",
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
      referenceDate: "2026-07-31",
      from: "",
      to: "",
    }));
  };

  const dashboardData =
    kpiResponse?.data?.data || {};

  const emailDashboardData =
    emailKpiResponse?.data?.data || {};

  const qualityAuditDashboardData =
    qualityAuditKpiResponse?.data?.data || {};

  const availableGrains =
    Array.isArray(dashboardData.availableGrains)
      ? dashboardData.availableGrains
      : [];

  const series =
    Array.isArray(dashboardData.series)
      ? dashboardData.series
      : [];

  const taskOrderOptions = getTaskOrderOptions(
    filters.sourceSystem,
  );

  const baseCountryOptions = getCountryOptions(
    filters.sourceSystem,
    filters.taskOrder,
  );
  const emailCountryOptions = Array.isArray(emailDashboardData.availableCountries)
    ? emailDashboardData.availableCountries
    : [];
  const qualityAuditCountryOptions = Array.isArray(qualityAuditDashboardData.availableCountries)
    ? qualityAuditDashboardData.availableCountries
    : [];
  const countryOptions = Array.from(
    [...baseCountryOptions, ...emailCountryOptions, ...qualityAuditCountryOptions].reduce((map, option) => {
      const key = String(option?.value || "").trim().toLowerCase();
      if (key && !map.has(key)) map.set(key, option);
      return map;
    }, new Map()).values(),
  ).sort((left, right) => String(left.label || "").localeCompare(String(right.label || "")));

  const skillOptions = getSkillOptions(
    filters.sourceSystem,
    filters.country,
    filters.taskOrder,
    skillsByCountryState,
  );

  const activeTaskOrder =
    dashboardData.filters?.taskOrder ||
    filters.taskOrder;

  const emailSeries = Array.isArray(emailDashboardData.series)
    ? emailDashboardData.series
    : [];
  const qualityAuditSeries = Array.isArray(qualityAuditDashboardData.series)
    ? qualityAuditDashboardData.series
    : [];
  const hasAnyKpiSeries =
    (showCalls && series.length > 0) ||
    (showEmails && emailSeries.length > 0) ||
    (showQa && qualityAuditSeries.length > 0) ||
    showOccupancy;

  const emptyDataMessage =
    !hasAnyKpiSeries && !availableGrains.length
      ? isCallsOnly
        ? "No validated Calls KPI data is available."
        : isEmailsOnly
        ? "No validated Email KPI data is available."
        : isQaOnly
        ? "No validated Quality Audit KPI data is available."
        : "No validated Calls, Email, or Quality Audit KPI data is available."
      : !hasAnyKpiSeries
        ? "No KPI data is available for the selected reporting range."
        : "";

  const isPdfDisabled = isDownloadingPdf;

  const isCustomPeriod =
    filters.period === "custom";

  return (
    <section className="font-jakarta flex h-screen max-h-[100dvh] min-h-screen bg-[#eef3f7] text-sibs-primary-1 overflow-hidden">
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

      <main className="min-w-0 flex-1 flex flex-col h-full overflow-hidden">
        <AppHeader
          title={
            isCallsOnly
              ? "Calls Performance"
              : isEmailsOnly
              ? "Emails Performance"
              : isQaOnly
              ? "Quality Audit Performance"
              : isOccupancyOnly
              ? "Occupancy & Headcount"
              : "Calls, Emails & Quality Performance"
          }
          subtitle="Performance Management System"
          userName={dashboard.userName}
          onMenuClick={() => dashboard.setIsMobileSidebarOpen(true)}
          onLogoutClick={() => dashboard.setShowLogoutModal(true)}
        />

        <div className="sibs-scrollbar flex-1 overflow-y-auto overflow-x-hidden p-1.5 sm:p-2 pb-1 sm:pb-1.5">
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
                KPI reporting is available for OM, TL, BOD,
                WFM, Admin, and SOM dashboards.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <section className="sibs-card relative z-40 overflow-visible shadow-xs">
                <div
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-sibs-primary-3/30 px-3 sm:px-3.5 py-2 sm:py-1.5 select-none ${showFilters ? "border-b border-sibs-tertiary-10" : ""
                    }`}
                >
                  <div className="flex items-center gap-2 min-w-0">

                    <BarChart3
                      size={16}
                      className="text-sibs-primary-1 shrink-0"
                    />

                    <h1 className="m-0 text-sm font-extrabold text-sibs-primary-1">
                      Calls, Emails & Quality Performance
                    </h1>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 justify-between sm:justify-end w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDownloadPdfModal(true);
                      }}
                      disabled={isPdfDisabled}
                      className="inline-flex cursor-pointer select-none items-center gap-1.5 rounded-md border border-sibs-tertiary-9 bg-white px-2.5 py-1 text-xs font-semibold text-sibs-primary-1 shadow-xs transition-colors hover:border-sibs-primary-1 hover:bg-sibs-primary-1 hover:text-white disabled:pointer-events-none disabled:opacity-50"
                      title="Download performance graphs as a PDF file"
                    >
                      {isDownloadingPdf ? (
                        <Loader2 size={12} className="animate-spin text-inherit shrink-0" />
                      ) : (
                        <Download size={12} className="text-inherit shrink-0" />
                      )}
                      <span>{isDownloadingPdf ? "Downloading..." : "Download as PDF"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowFilters((prev) => !prev);
                      }}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-sibs-primary-1 hover:bg-sibs-primary-1/10 transition-colors"
                      title={showFilters ? "Hide filters and KPI cards to conserve space" : "Show filters and KPI cards"}
                    >
                      <Filter size={12} className="shrink-0" />
                      <span>{showFilters ? "Hide Filters & KPIs" : "Show Filters & KPIs"}</span>
                      <ChevronDown
                        size={14}
                        className={`shrink-0 transition-transform duration-200 ${showFilters ? "rotate-180" : ""
                          }`}
                      />
                    </button>
                  </div>
                </div>

                {showFilters && (
                  <div className={`grid grid-cols-1 gap-2 p-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 ${isCustomPeriod ? "xl:grid-cols-8" : "xl:grid-cols-7"} items-end`}>
                    {/* 1. Account / Source (Hidden in QA) */}
                    {!isQaOnly && (
                      <MultiSelectDropdown
                        label="Account / Source"
                        value={filters.sourceSystem}
                        onChange={handleSourceChange}
                        options={SOURCE_OPTIONS}
                        placeholder="All Sources"
                        allOptionLabel="US Visa (All Sources)"
                      />
                    )}

                    {/* 2. Task Order */}
                    <MultiSelectDropdown
                      label="Task Order"
                      value={filters.taskOrder}
                      onChange={handleTaskOrderChange}
                      options={taskOrderOptions}
                      placeholder="All Task Orders"
                      allOptionLabel="All Task Orders"
                    />

                    {/* 3. Country */}
                    <MultiSelectDropdown
                      label="Country"
                      value={filters.country}
                      onChange={handleCountryChange}
                      options={countryOptions}
                      placeholder="All Countries"
                      allOptionLabel="All Countries"
                    />

                    {/* 4. Skill */}
                    <MultiSelectDropdown
                      label="Skill"
                      value={filters.skill}
                      onChange={handleSkillChange}
                      options={skillOptions}
                      placeholder="All Skills"
                      allOptionLabel="All Skills"
                    />

                    {/* 5. LOB (Only in QA Module) */}
                    {isQaOnly && (
                      <SingleSelectDropdown
                        label="LOB"
                        value={filters.lob}
                        onChange={handleLobChange}
                        options={LOB_OPTIONS}
                        placeholder="All LOBs"
                      />
                    )}

                    {/* 6. Reporting Period */}
                    <SingleSelectDropdown
                      label="Reporting Period"
                      value={filters.period}
                      onChange={handlePeriodChange}
                      options={PERIOD_OPTIONS}
                      placeholder="Weekly"
                    />

                    {/* 6. Reference Date (or From + To) */}
                    {isCustomPeriod ? (
                      <>
                        <DatePicker
                          label="From"
                          value={filters.from}
                          onChange={(from) =>
                            setFilters((current) => ({
                              ...current,
                              from: from || "",
                            }))
                          }
                        />

                        <DatePicker
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
                        <DatePicker
                          label="Reference Date"
                          value={filters.referenceDate}
                          onChange={handleReferenceDateChange}
                        />

                        {/* 7. Latest button */}
                        <div className="flex flex-col justify-end">
                          <span
                            className="mb-0.5 block text-[9.5px] font-extrabold uppercase select-none text-transparent"
                            aria-hidden="true"
                          >
                            &nbsp;
                          </span>
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
                )}
              </section>

              {showCalls && error ? (
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
                      {isCallsOnly
                        ? "Loading Calls KPI data"
                        : isEmailsOnly
                        ? "Loading Email KPI data"
                        : isQaOnly
                        ? "Loading Quality KPI data"
                        : "Loading Calls, Email & Quality KPI data"}
                    </p>

                    <p className="mt-1 mb-0 text-sm text-sibs-tertiary-5">
                      Aggregating validated records from
                      the PMS database.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative z-0 min-w-0 w-full">
                  {emptyDataMessage && !error ? (
                    <div className="sibs-card mb-4 p-4 text-sm font-semibold text-sibs-tertiary-5">
                      {emptyDataMessage}
                    </div>
                  ) : null}

                  {showCalls && (
                    <div id="calls-section">
                      <CallKpiDashboard
                        data={dashboardData || {}}
                        showSummaryCards={showFilters}
                        isSubmodule={isCallsOnly}
                        showFilters={showFilters}
                        afterCards={
                          !currentSection ? (
                            <div className="space-y-1.5 sm:space-y-2">
                              <EmailSummaryCards
                                summary={emailDashboardData?.summary || {}}
                              />
                              <QualityAuditSummaryCards
                                summary={qualityAuditDashboardData?.summary || {}}
                              />
                            </div>
                          ) : null
                        }
                      />
                    </div>
                  )}

                  {showEmails && (
                    <div id="emails-section" className={!currentSection ? "mt-1 sm:mt-1.5" : ""}>
                      {emailError ? (
                        <div className="sibs-card mb-2 flex items-start gap-2 border border-amber-200 bg-amber-50/70 p-2.5 text-xs font-semibold text-amber-800">
                          <AlertCircle size={16} className="mt-0.5 shrink-0" />
                          <span>{emailError}</span>
                        </div>
                      ) : null}
                      <EmailKpiDashboard
                        data={emailDashboardData || {}}
                        showSummaryCards={isEmailsOnly ? showFilters : false}
                        isSubmodule={isEmailsOnly}
                        showFilters={showFilters}
                      />
                    </div>
                  )}

                  {showQa && (
                    <div id="qa-section" className={!currentSection ? "mt-1 sm:mt-1.5" : ""}>
                      {qualityAuditError ? (
                        <div className="sibs-card mb-2 flex items-start gap-2 border border-amber-200 bg-amber-50/70 p-2.5 text-xs font-semibold text-amber-800">
                          <AlertCircle size={16} className="mt-0.5 shrink-0" />
                          <span>{qualityAuditError}</span>
                        </div>
                      ) : null}
                      <QualityAuditKpiDashboard
                        data={qualityAuditDashboardData || {}}
                        showSummaryCards={isQaOnly ? showFilters : false}
                        period={filters.period}
                        isSubmodule={isQaOnly}
                        showFilters={showFilters}
                      />
                    </div>
                  )}

                  {showOccupancy && (
                    <div id="occupancy-section" className="sibs-card p-8 text-center">
                      <Users className="mx-auto mb-3 text-sibs-primary-1/60" size={36} />
                      <h2 className="m-0 text-base font-bold text-sibs-primary-1">
                        Occupancy & Headcount Performance
                      </h2>
                      <p className="mt-1 text-xs text-sibs-tertiary-5">
                        Occupancy & HC reporting metrics will be displayed here.
                      </p>
                    </div>
                  )}
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

      <DownloadPdfModal
        isOpen={showDownloadPdfModal}
        onClose={() => !isDownloadingPdf && setShowDownloadPdfModal(false)}
        onDownload={handleExecutePdfDownload}
        isDownloading={isDownloadingPdf}
        activeSection={currentSection}
      />

      {/* Off-screen render container for PDF export when sections are not currently visible */}
      {exportingSections.length > 0 && (
        <div
          id="pdf-offscreen-export-container"
          style={{
            position: "fixed",
            left: "-9999px",
            top: 0,
            width: "1500px",
            opacity: 0,
            pointerEvents: "none",
            zIndex: -1,
          }}
          aria-hidden="true"
        >
          {/* Executive Consolidated Single-Page Dashboard for All Reports */}
          <div id="export-all-reports-dashboard" style={{ width: "1500px", background: "#ffffff" }}>
            <AllReportsExecutivePdfView
              callData={kpiResponse?.data?.data || dashboardData || {}}
              emailData={emailKpiResponse?.data?.data || emailDashboardData || {}}
              qualityAuditData={qualityAuditKpiResponse?.data?.data || qualityAuditDashboardData || {}}
            />
          </div>

          {exportingSections.includes("calls") && !showCalls && (
            <div id="export-calls-section" style={{ width: "1350px", background: "#f8fbfd", padding: "16px" }}>
              <CallKpiDashboard
                data={dashboardData || {}}
                showSummaryCards={true}
                isSubmodule={false}
                showFilters={false}
              />
            </div>
          )}
          {exportingSections.includes("emails") && !showEmails && (
            <div id="export-emails-section" style={{ width: "1350px", background: "#f8fbfd", padding: "16px" }}>
              <EmailKpiDashboard
                data={emailDashboardData || {}}
                showSummaryCards={true}
                isSubmodule={true}
                showFilters={false}
              />
            </div>
          )}
          {exportingSections.includes("qa") && !showQa && (
            <div id="export-qa-section" style={{ width: "1350px", background: "#f8fbfd", padding: "16px" }}>
              <QualityAuditKpiDashboard
                data={qualityAuditDashboardData || {}}
                showSummaryCards={true}
                period={filters.period}
                isSubmodule={true}
                showFilters={false}
              />
            </div>
          )}
          {exportingSections.includes("occupancy") && !showOccupancy && (
            <div id="export-occupancy-section" className="sibs-card p-8 text-center" style={{ width: "1350px", background: "#f8fbfd", padding: "16px" }}>
              <Users className="mx-auto mb-3 text-sibs-primary-1/60" size={36} />
              <h2 className="m-0 text-base font-bold text-sibs-primary-1">
                Occupancy & Headcount Performance
              </h2>
              <p className="mt-1 text-xs text-sibs-tertiary-5">
                Occupancy & HC reporting metrics will be displayed here.
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
