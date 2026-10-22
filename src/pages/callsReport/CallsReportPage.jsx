import React, { useEffect, useMemo, useState } from "react";
import AdminSidebar from "@/components/common/layout/AdminSidebar";
import AppHeader from "@/components/common/layout/AppHeader";
import ConfirmationModal from "@/components/common/ui/ConfirmationModal";
import LoadingModal from "@/components/common/ui/LoadingModal";
import TablePagination from "@/components/common/tables/TablePagination";
import DatePicker from "@/components/common/filters/DatePicker";
import MultiSelectDropdown from "@/components/common/filters/MultiSelectDropdown";
import useDashboardPage from "@/hooks/useDashboardPage";
import { getCallsReport, getCallSkills } from "@/lib/axios/kpis";
import {
  SOURCE_OPTIONS,
  SKILLS_BY_COUNTRY,
  getTaskOrderOptions,
  getCountryOptions,
  getSkillOptions,
} from "@/config/kpiFiltersConfig";
import {
  AlertCircle,
  Calendar,
  Check,
  ChevronDown,
  Clock,
  Loader2,
  Percent,
  PhoneCall,
  PhoneIncoming,
  PhoneOff,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";

function formatManilaDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return "—";
  const [year, month, day] = dateStr.split("-").map(Number);
  if (!year || !month || !day) return dateStr;
  const dateObj = new Date(year, month - 1, day);
  return dateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

export default function CallsReportPage() {
  const dashboard = useDashboardPage();

  const userName =
    dashboard.authUser?.name || dashboard.authUser?.username || dashboard.userName || "User";

  const columns = [
    "Country",
    "Language",
    "Skills",
    "Calls Received",
    "Calls Answered",
    "Calls Abandoned",
    "Calls Abandoned after SL",
    "Calls Answered within SL",
    "AHT",
    "Abandoned Rate",
    "SL (Answered within 60 secs.)",
  ];

  // States
  const [reportData, setReportData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => formatManilaDate()); // Default to today's date
  const [selectedSources, setSelectedSources] = useState([]); // Empty means all sources
  const [selectedTaskOrders, setSelectedTaskOrders] = useState([]); // Empty means all task orders
  const [selectedCountries, setSelectedCountries] = useState([]); // Empty means all countries
  const [selectedSkills, setSelectedSkills] = useState([]); // Empty means all skills
  const [skillsByCountry, setSkillsByCountry] = useState(SKILLS_BY_COUNTRY);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const fetchCallsReport = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const params = {
        sourceSystem: selectedSources.length ? selectedSources.join(",") : "US_VISA",
        taskOrder: selectedTaskOrders.length ? selectedTaskOrders.join(",") : undefined,
        country: selectedCountries.length ? selectedCountries.join(",") : undefined,
        skill: selectedSkills.length ? selectedSkills.join(",") : undefined,
      };
      if (selectedDate) {
        params.date = selectedDate;
      }
      const [res] = await Promise.all([
        getCallsReport(params),
        new Promise((resolve) => setTimeout(resolve, 550)),
      ]);
      const rows = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setReportData(rows);
      if (res?.resolvedDate && res.resolvedDate !== selectedDate) {
        setSelectedDate(res.resolvedDate);
      }
    } catch (err) {
      console.error("Failed to load calls report:", err);
      setFetchError(
        err?.response?.data?.message || err?.message || "Failed to load calls report from server.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchCallsReport();
  }, [selectedDate, selectedSources, selectedTaskOrders, selectedCountries, selectedSkills]);

  useEffect(() => {
    let isMounted = true;
    getCallSkills()
      .then((res) => {
        if (!isMounted || !res?.data) return;
        setSkillsByCountry((prev) => {
          const merged = { ...prev };
          for (const [country, skills] of Object.entries(res.data)) {
            const current = [...(merged[country] || [])];
            for (const skill of skills || []) {
              const key = String(skill).toLowerCase().replace(/[^a-z0-9]/g, "");
              if (!current.some((item) => String(item).toLowerCase().replace(/[^a-z0-9]/g, "") === key)) {
                current.push(skill);
              }
            }
            merged[country] = current;
          }
          return merged;
        });
      })
      .catch((err) => console.warn("Could not load dynamic source skills:", err?.message));

    return () => {
      isMounted = false;
    };
  }, []);

  const sourceOptions = useMemo(() => SOURCE_OPTIONS, []);

  const taskOrderOptions = useMemo(
    () => getTaskOrderOptions(selectedSources),
    [selectedSources],
  );

  const countryOptions = useMemo(
    () => getCountryOptions(selectedSources, selectedTaskOrders),
    [selectedSources, selectedTaskOrders],
  );

  const skillOptions = useMemo(
    () => getSkillOptions(
      selectedSources,
      selectedCountries,
      selectedTaskOrders,
      skillsByCountry,
    ),
    [selectedSources, selectedCountries, selectedTaskOrders, skillsByCountry],
  );

  useEffect(() => {
    const valid = new Set(taskOrderOptions.map((option) => option.value));
    setSelectedTaskOrders((current) => {
      const next = current.filter((taskOrder) => valid.has(taskOrder));
      return next.length === current.length && next.every((item, index) => item === current[index])
        ? current
        : next;
    });
  }, [taskOrderOptions]);

  useEffect(() => {
    const validCountries = new Set(countryOptions.map((option) => option.value));
    setSelectedCountries((current) => {
      const next = current.filter((country) => validCountries.has(country));
      return next.length === current.length && next.every((item, index) => item === current[index])
        ? current
        : next;
    });
  }, [countryOptions]);

  useEffect(() => {
    const validSkills = new Set(skillOptions.map((option) => String(option.value).toLowerCase()));
    setSelectedSkills((current) => {
      const next = current.filter((skill) => validSkills.has(String(skill).toLowerCase()));
      return next.length === current.length && next.every((item, index) => item === current[index])
        ? current
        : next;
    });
  }, [skillOptions]);

  // Source / Task Order / Country / Skill filters are applied by the API.
  // Search only narrows the currently loaded report rows.
  const filteredData = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return reportData;

    return reportData.filter((row) => {
      const country = String(row.country || "").toLowerCase();
      const language = String(row.language || "").toLowerCase();
      const skill = String(row.skill || "").toLowerCase();
      return country.includes(term) || language.includes(term) || skill.includes(term);
    });
  }, [reportData, searchTerm]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedSources, selectedTaskOrders, selectedCountries, selectedSkills]);

  // Paginated Rows
  const totalItems = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedData = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, safeCurrentPage, pageSize]);

  // Summary Totals
  const totals = useMemo(() => {
    let callsReceived = 0;
    let callsAnswered = 0;
    let callsAbandoned = 0;
    let callsAbandonedAfterSl = 0;
    let callsAnsweredWithinSl = 0;
    let totalSeconds = 0;

    filteredData.forEach((r) => {
      callsReceived += Number(r.callsReceived || 0);
      callsAnswered += Number(r.callsAnswered || 0);
      callsAbandoned += Number(r.callsAbandoned || 0);
      callsAbandonedAfterSl += Number(r.callsAbandonedAfterSl || 0);
      callsAnsweredWithinSl += Number(r.callsAnsweredWithinSl || 0);
      totalSeconds += Number(r.ahtSeconds || 0) * Number(r.callsAnswered || 0);
    });

    const avgAhtSec = callsAnswered > 0 ? Math.round(totalSeconds / callsAnswered) : 0;
    const ahtMin = Math.floor(avgAhtSec / 60);
    const ahtRem = avgAhtSec % 60;
    const ahtStr = totalSeconds > 0
      ? `${String(ahtMin).padStart(2, "0")}:${String(ahtRem).padStart(2, "0")}`
      : "--";

    const abandonedRate =
      callsReceived > 0 ? ((callsAbandoned / callsReceived) * 100).toFixed(2) + "%" : "0.00%";
    const sl =
      callsAnswered > 0 ? ((callsAnsweredWithinSl / callsAnswered) * 100).toFixed(2) + "%" : "0.00%";

    return {
      callsReceived,
      callsAnswered,
      callsAbandoned,
      callsAbandonedAfterSl,
      callsAnsweredWithinSl,
      aht: ahtStr,
      abandonedRate,
      sl,
    };
  }, [filteredData]);

  return (
    <section className="font-jakarta flex h-screen max-h-[100dvh] min-h-screen overflow-hidden bg-[#eef3f7] text-sibs-primary-1">
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

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AppHeader
          title="Calls Report"
          subtitle="Workforce Management System"
          userName={userName}
          onMenuClick={() => dashboard.setIsMobileSidebarOpen(true)}
          onLogoutClick={() => dashboard.setShowLogoutModal(true)}
        />

        <main className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-hidden px-2.5 pb-2.5 pt-2.5 sm:gap-3 sm:px-4 sm:pt-3 lg:px-5">
          {/* Search & Filter Toolbar (Matching WOW Report Filter Design) */}
          <div className="sibs-card relative z-40 overflow-visible shadow-xs shrink-0 p-2 sm:p-2.5 bg-white">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2 sm:gap-2.5 items-end">
              {/* 1. Source System */}
              <div className="w-full">
                <MultiSelectDropdown
                  label="Source System"
                  value={selectedSources}
                  onChange={(value) => setSelectedSources(Array.isArray(value) ? value : [])}
                  options={sourceOptions}
                  placeholder="All Sources"
                  allOptionLabel="All Sources"
                />
              </div>

              {/* 2. Task Order */}
              <div className="w-full">
                <MultiSelectDropdown
                  label="Task Order"
                  value={selectedTaskOrders}
                  onChange={(value) => setSelectedTaskOrders(Array.isArray(value) ? value : [])}
                  options={taskOrderOptions}
                  placeholder="All Task Orders"
                  allOptionLabel="All Task Orders"
                />
              </div>

              {/* 3. Country */}
              <div className="w-full">
                <MultiSelectDropdown
                  label="Country"
                  value={selectedCountries}
                  onChange={(val) => setSelectedCountries(Array.isArray(val) ? val : [])}
                  options={countryOptions}
                  placeholder="All Countries"
                  allOptionLabel="All Countries"
                />
              </div>

              {/* 4. Skill */}
              <div className="w-full">
                <MultiSelectDropdown
                  label="Skill"
                  value={selectedSkills}
                  onChange={(value) => setSelectedSkills(Array.isArray(value) ? value : [])}
                  options={skillOptions}
                  placeholder="All Skills"
                  allOptionLabel="All Skills"
                />
              </div>

              {/* 5. Select Date */}
              <div className="w-full">
                <DatePicker
                  label="Select Date"
                  value={selectedDate}
                  onChange={(val) => setSelectedDate(val || "")}
                />
              </div>

              {/* 6. Search */}
              <div className="w-full">
                <span className="mb-0.5 block text-[9.5px] font-extrabold uppercase text-sibs-tertiary-5">
                  Search
                </span>
                <div className="relative flex h-8 items-center rounded-lg border border-sibs-tertiary-8 bg-white px-2.5 hover:border-sibs-primary-1 transition-colors focus-within:border-sibs-primary-1 focus-within:ring-1 focus-within:ring-sibs-primary-1/20">
                  <Search size={12} className="text-slate-400 shrink-0 mr-1.5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search country/lang..."
                    className="w-full bg-transparent text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm("")}
                      className="ml-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* 7. Refresh Action */}
              <div className="flex items-center gap-1.5 w-full justify-end">
                <button
                  type="button"
                  onClick={fetchCallsReport}
                  disabled={isLoading}
                  title="Refresh data"
                  className="inline-flex h-8 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-sibs-tertiary-8 bg-white px-3 text-xs font-bold text-sibs-primary-1 shadow-2xs transition hover:border-sibs-primary-1 hover:bg-sibs-primary-1 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <RefreshCw
                    size={12}
                    className={`shrink-0 ${isLoading ? "animate-spin text-inherit" : ""}`}
                  />
                  <span>Refresh</span>
                </button>
              </div>
            </div>
          </div>

          {/* High-level KPI summary cards - Compact corporate sizing matching Occupancy */}
          <div className="shrink-0 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7 gap-1.5 sm:gap-2">
            {/* 1. Date */}
            <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-2xs transition-all hover:border-slate-300">
              <div className="flex items-center justify-between gap-1.5">
                <span
                  className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate"
                  title="Report Date"
                >
                  Date
                </span>
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-slate-100 text-slate-600">
                  <Calendar size={11} />
                </div>
              </div>
              <div className="mt-0.5 text-xs sm:text-sm font-extrabold text-sibs-primary-1 leading-snug truncate" title={selectedDate || "All Dates"}>
                {selectedDate ? formatDisplayDate(selectedDate) : "All Dates"}
              </div>
            </div>

            {/* 2. Calls Received */}
            <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-2xs transition-all hover:border-slate-300">
              <div className="flex items-center justify-between gap-1.5">
                <span
                  className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate"
                  title="Calls Received"
                >
                  Calls Received
                </span>
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-slate-100 text-slate-600">
                  <PhoneIncoming size={11} />
                </div>
              </div>
              <div className="mt-0.5 text-base sm:text-lg font-bold text-slate-900 leading-snug">
                {isLoading ? (
                  <div className="h-6 w-16 rounded bg-slate-200 animate-pulse my-0.5" />
                ) : (
                  totals.callsReceived.toLocaleString()
                )}
              </div>
            </div>

            {/* 3. Calls Answered */}
            <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-2xs transition-all hover:border-slate-300">
              <div className="flex items-center justify-between gap-1.5">
                <span
                  className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate"
                  title="Calls Answered"
                >
                  Calls Answered
                </span>
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-slate-100 text-slate-600">
                  <PhoneCall size={11} />
                </div>
              </div>
              <div className="mt-0.5 text-base sm:text-lg font-bold text-slate-900 leading-snug">
                {isLoading ? (
                  <div className="h-6 w-16 rounded bg-slate-200 animate-pulse my-0.5" />
                ) : (
                  totals.callsAnswered.toLocaleString()
                )}
              </div>
            </div>

            {/* 4. Calls Abandoned */}
            <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-2xs transition-all hover:border-slate-300">
              <div className="flex items-center justify-between gap-1.5">
                <span
                  className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate"
                  title="Calls Abandoned"
                >
                  Calls Abandoned
                </span>
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-slate-100 text-slate-600">
                  <PhoneOff size={11} />
                </div>
              </div>
              <div className="mt-0.5 text-base sm:text-lg font-bold text-slate-900 leading-snug">
                {isLoading ? (
                  <div className="h-6 w-14 rounded bg-slate-200 animate-pulse my-0.5" />
                ) : (
                  totals.callsAbandoned.toLocaleString()
                )}
              </div>
            </div>

            {/* 5. Average AHT */}
            <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-2xs transition-all hover:border-slate-300">
              <div className="flex items-center justify-between gap-1.5">
                <span
                  className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate"
                  title="Average AHT"
                >
                  Average AHT
                </span>
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-slate-100 text-slate-600">
                  <Clock size={11} />
                </div>
              </div>
              <div className="mt-0.5 text-base sm:text-lg font-bold text-slate-900 leading-snug">
                {isLoading ? (
                  <div className="h-6 w-14 rounded bg-slate-200 animate-pulse my-0.5" />
                ) : (
                  totals.aht
                )}
              </div>
            </div>

            {/* 6. Abandoned Rate */}
            <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-2xs transition-all hover:border-slate-300">
              <div className="flex items-center justify-between gap-1.5">
                <span
                  className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate"
                  title="Abandoned Rate"
                >
                  Abandoned Rate
                </span>
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-slate-100 text-slate-600">
                  <Percent size={11} />
                </div>
              </div>
              <div className="mt-0.5 text-base sm:text-lg font-bold text-slate-900 leading-snug">
                {isLoading ? (
                  <div className="h-6 w-16 rounded bg-slate-200 animate-pulse my-0.5" />
                ) : (
                  totals.abandonedRate
                )}
              </div>
            </div>

            {/* 7. Service Level (60s) */}
            <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-2xs transition-all hover:border-slate-300">
              <div className="flex items-center justify-between gap-1.5">
                <span
                  className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate"
                  title="Service Level (60s)"
                >
                  Service Level (60s)
                </span>
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-slate-100 text-slate-600">
                  <ShieldCheck size={11} />
                </div>
              </div>
              <div className="mt-0.5 text-base sm:text-lg font-bold text-slate-900 leading-snug">
                {isLoading ? (
                  <div className="h-6 w-16 rounded bg-slate-200 animate-pulse my-0.5" />
                ) : (
                  totals.sl
                )}
              </div>
            </div>
          </div>

          {fetchError && (
            <div className="shrink-0 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-700">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="m-0 font-medium">{fetchError}</p>
              </div>
            </div>
          )}

          {/* Table Container */}
          <div className="flex min-h-[360px] lg:min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden sibs-scrollbar">
              <table className="w-full table-auto border-collapse text-left text-xs">
                <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-100/90 backdrop-blur-xs shadow-2xs">
                  <tr>
                    <th className="whitespace-nowrap px-4 py-3 text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                      Country
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                      Language
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                      Skills
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-right text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                      Calls Received
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-right text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                      Calls Answered
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-right text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                      Calls Abandoned
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-right text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                      Calls Abandoned after SL
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-right text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                      Calls Answered within SL
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-right text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                      AHT
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-right text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                      Abandoned Rate
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-right text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                      SL (Answered within 60 secs.)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {isLoading ? (
                    Array.from({ length: 10 }).map((_, i) => (
                      <tr key={`skeleton-${i}`} className="animate-pulse">
                        <td className="px-4 py-3">
                          <div className="h-4 w-28 bg-slate-200 rounded-md" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-4 w-24 bg-slate-200 rounded-md" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-5 w-20 bg-slate-200 rounded-md" />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="h-4 w-14 bg-slate-200 rounded-md ml-auto" />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="h-4 w-14 bg-slate-200 rounded-md ml-auto" />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="h-4 w-14 bg-slate-200 rounded-md ml-auto" />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="h-4 w-14 bg-slate-200 rounded-md ml-auto" />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="h-4 w-14 bg-slate-200 rounded-md ml-auto" />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="h-4 w-14 bg-slate-200 rounded-md ml-auto" />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="h-4 w-14 bg-slate-200 rounded-md ml-auto" />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="h-4 w-16 bg-slate-200 rounded-md ml-auto" />
                        </td>
                      </tr>
                    ))
                  ) : paginatedData.length > 0 ? (
                    paginatedData.map((row, idx) => {
                      const isAbandonedZero = Number(row.callsAbandoned || 0) === 0;
                      const isAbandonedAfterSlZero = Number(row.callsAbandonedAfterSl || 0) === 0;
                      const slNumber = parseFloat(row.sl) || 0;
                      const isHighSL = slNumber >= 80;

                      return (
                        <tr
                          key={`${row.country}-${row.language}-${row.skill || ""}-${idx}`}
                          className={`transition-colors hover:bg-sky-50/60 ${
                            idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"
                          }`}
                        >
                          <td className="whitespace-nowrap px-4 py-3 font-bold text-slate-900">
                            {row.country || "—"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-800">
                            {row.language || "—"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <span className="inline-flex items-center rounded-md bg-sky-50 px-2 py-0.5 text-[11px] font-bold text-[#0b3b68] border border-sky-200/80 shadow-2xs">
                              {row.skill || "—"}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-slate-900">
                            {(row.callsReceived ?? 0).toLocaleString()}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-emerald-600">
                            {(row.callsAnswered ?? 0).toLocaleString()}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right">
                            <span
                              className={`font-semibold ${
                                isAbandonedZero
                                  ? "text-slate-400"
                                  : "text-rose-600 font-bold"
                              }`}
                            >
                              {(row.callsAbandoned ?? 0).toLocaleString()}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right">
                            <span
                              className={`font-semibold ${
                                isAbandonedAfterSlZero
                                  ? "text-slate-400"
                                  : "text-amber-600 font-bold"
                              }`}
                            >
                              {(row.callsAbandonedAfterSl ?? 0).toLocaleString()}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-[#0b3b68]">
                            {(row.callsAnsweredWithinSl ?? 0).toLocaleString()}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right font-mono font-semibold text-slate-800">
                            {row.aht || "00:00"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right">
                            <span
                              className={`inline-block font-bold ${
                                isAbandonedZero
                                  ? "text-slate-400"
                                  : "text-rose-600"
                              }`}
                            >
                              {row.abandonedRate || "0.00%"}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right">
                            <span
                              className={`inline-flex items-center justify-end font-bold ${
                                isHighSL
                                  ? "text-emerald-700"
                                  : "text-amber-600"
                              }`}
                            >
                              {row.sl || "0.00%"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={11} className="py-24 text-center text-sm text-slate-400">
                        {reportData.length === 0
                          ? "No calls recorded in us_visa_raw_skill_statistics."
                          : "No matching records found."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {filteredData.length > 0 && (
              <TablePagination
                currentPage={safeCurrentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={(page) => setCurrentPage(page)}
                itemLabel="records"
                className="shrink-0"
                extraLeft={
                  <div className="flex items-center gap-1.5 ml-2">
                    <span className="text-slate-500 font-normal">Rows per page:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="rounded border border-slate-300 bg-white px-2 py-0.5 text-xs font-medium text-slate-700 shadow-2xs outline-none focus:border-[#0b3b68] cursor-pointer"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                }
              />
            )}
          </div>
        </main>
      </div>

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
