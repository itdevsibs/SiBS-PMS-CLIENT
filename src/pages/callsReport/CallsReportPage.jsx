import React, { useEffect, useMemo, useState } from "react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import AppHeader from "@/components/layout/AppHeader";
import ConfirmationModal from "@/components/ui/confirmation-modal";
import LoadingModal from "@/components/ui/loading-modal";
import TablePagination from "@/components/tables/TablePagination";
import useDashboardPage from "@/hooks/useDashboardPage";
import { getCallsReport } from "@/lib/axios/wfm-kpis";
import {
  AlertCircle,
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
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [selectedSkill, setSelectedSkill] = useState("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const fetchCallsReport = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const res = await getCallsReport();
      const rows = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setReportData(rows);
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
  }, []);

  // Unique country list
  const countryOptions = useMemo(() => {
    const set = new Set();
    reportData.forEach((row) => {
      if (row.country && row.country !== "—") set.add(row.country);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [reportData]);

  // Unique language list
  const languageOptions = useMemo(() => {
    const set = new Set();
    reportData.forEach((row) => {
      if (
        (selectedCountry === "all" || row.country === selectedCountry) &&
        row.language &&
        row.language !== "—"
      ) {
        set.add(row.language);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [reportData, selectedCountry]);

  // Unique skills list
  const skillOptions = useMemo(() => {
    const set = new Set();
    reportData.forEach((row) => {
      if (row.skill && row.skill !== "—") set.add(row.skill);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [reportData]);

  // Filter rows by Search, Country, Language, and Skill
  const filteredData = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return reportData.filter((row) => {
      const matchesCountry =
        selectedCountry === "all" || row.country === selectedCountry;
      const matchesLanguage =
        selectedLanguage === "all" || row.language === selectedLanguage;
      const matchesSkill =
        selectedSkill === "all" || row.skill === selectedSkill;

      if (!matchesCountry || !matchesLanguage || !matchesSkill) return false;

      if (!term) return true;
      const country = String(row.country || "").toLowerCase();
      const language = String(row.language || "").toLowerCase();
      const skill = String(row.skill || "").toLowerCase();
      return (
        country.includes(term) ||
        language.includes(term) ||
        skill.includes(term)
      );
    });
  }, [reportData, searchTerm, selectedCountry, selectedLanguage, selectedSkill]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCountry, selectedLanguage, selectedSkill]);

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
    const ahtStr = `${String(ahtMin).padStart(2, "0")}:${String(ahtRem).padStart(2, "0")}`;

    const abandonedRate =
      callsReceived > 0 ? ((callsAbandoned / callsReceived) * 100).toFixed(2) + "%" : "0.00%";
    const sl =
      callsReceived > 0 ? ((callsAnsweredWithinSl / callsReceived) * 100).toFixed(2) + "%" : "0.00%";

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

  const tableMinWidth = 1150;

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

        <main className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-hidden px-2.5 pb-2 pt-2.5 sm:gap-3 sm:px-4 sm:pt-3 lg:px-5">
          {/* High-level KPI summary cards - Compact corporate sizing matching Occupancy */}
          <div className="shrink-0 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {/* 1. Calls Received */}
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
                {isLoading ? "--" : totals.callsReceived.toLocaleString()}
              </div>
            </div>

            {/* 2. Calls Answered */}
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
                {isLoading ? "--" : totals.callsAnswered.toLocaleString()}
              </div>
            </div>

            {/* 3. Calls Abandoned */}
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
                {isLoading ? "--" : totals.callsAbandoned.toLocaleString()}
              </div>
            </div>

            {/* 4. Average AHT */}
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
                {isLoading ? "--" : totals.aht}
              </div>
            </div>

            {/* 5. Abandoned Rate */}
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
                {isLoading ? "--" : totals.abandonedRate}
              </div>
            </div>

            {/* 6. Service Level (60s) */}
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
                {isLoading ? "--" : totals.sl}
              </div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="shrink-0 flex flex-col lg:flex-row lg:items-end justify-between gap-3 sm:gap-3.5 rounded-xl border border-slate-200 bg-white p-3 sm:p-4 shadow-xs">
            <div className="flex flex-wrap items-end gap-3 sm:gap-3.5 flex-1 min-w-0 w-full">
              {/* 1. Search Employee / Skill */}
              <div className="w-full sm:w-auto sm:flex-1 sm:min-w-[200px] lg:max-w-xs">
                <label className="text-xs font-bold text-slate-800 block mb-1.5">
                  Search
                </label>
                <div className="relative flex h-9.5 items-center rounded-lg border border-slate-200 bg-white px-3 hover:border-slate-300 transition-colors focus-within:border-[#0b3b68] focus-within:ring-1 focus-within:ring-[#0b3b68]/20">
                  <Search className="h-4 w-4 text-slate-400 shrink-0 mr-2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search country or language..."
                    className="w-full bg-transparent text-xs sm:text-[13px] font-medium text-slate-800 placeholder:text-slate-400 outline-none"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm("")}
                      className="ml-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* 2. Country Dropdown */}
              <div className="w-full sm:w-auto sm:flex-1 sm:min-w-[170px] lg:max-w-xs">
                <label className="text-xs font-bold text-slate-800 block mb-1.5">
                  Country
                </label>
                <select
                  value={selectedCountry}
                  onChange={(e) => {
                    setSelectedCountry(e.target.value);
                    setSelectedLanguage("all");
                  }}
                  className="h-9.5 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none hover:border-slate-300 focus:border-[#0b3b68] focus:ring-1 focus:ring-[#0b3b68]/20 cursor-pointer"
                >
                  <option value="all">All Countries</option>
                  {countryOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Language Dropdown */}
              <div className="w-full sm:w-auto sm:flex-1 sm:min-w-[160px] lg:max-w-xs">
                <label className="text-xs font-bold text-slate-800 block mb-1.5">
                  Language
                </label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="h-9.5 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none hover:border-slate-300 focus:border-[#0b3b68] focus:ring-1 focus:ring-[#0b3b68]/20 cursor-pointer"
                >
                  <option value="all">All Languages</option>
                  {languageOptions.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Skills Dropdown */}
              <div className="w-full sm:w-auto sm:flex-1 sm:min-w-[140px] lg:max-w-xs">
                <label className="text-xs font-bold text-slate-800 block mb-1.5">
                  Skills
                </label>
                <select
                  value={selectedSkill}
                  onChange={(e) => setSelectedSkill(e.target.value)}
                  className="h-9.5 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none hover:border-slate-300 focus:border-[#0b3b68] focus:ring-1 focus:ring-[#0b3b68]/20 cursor-pointer"
                >
                  <option value="all">All Skills</option>
                  {skillOptions.map((sk) => (
                    <option key={sk} value={sk}>
                      {sk}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reset Filters (shown if active) */}
              {(selectedCountry !== "all" || selectedLanguage !== "all" || selectedSkill !== "all" || searchTerm) && (
                <div className="w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCountry("all");
                      setSelectedLanguage("all");
                      setSelectedSkill("all");
                      setSearchTerm("");
                    }}
                    className="inline-flex h-9.5 items-center justify-center px-3.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer border border-rose-200"
                    title="Clear filters"
                  >
                    Reset
                  </button>
                </div>
              )}

              {/* Refresh button */}
              <div className="w-full sm:w-auto sm:ml-auto">
                <button
                  type="button"
                  onClick={fetchCallsReport}
                  disabled={isLoading}
                  title="Refresh data"
                  className="inline-flex h-9.5 w-full sm:w-auto items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer disabled:opacity-60"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 text-slate-500 ${
                      isLoading ? "animate-spin text-[#ff5c28]" : ""
                    }`}
                  />
                  <span>Refresh</span>
                </button>
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
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
            <div className="min-h-0 flex-1 overflow-auto sibs-scrollbar">
              <table
                className="w-full table-auto border-collapse text-left text-xs"
                style={{ minWidth: `${tableMinWidth}px` }}
              >
                <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 shadow-xs">
                  <tr>
                    <th className="whitespace-nowrap px-3.5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Country
                    </th>
                    <th className="whitespace-nowrap px-3.5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Language
                    </th>
                    <th className="whitespace-nowrap px-3.5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Skills
                    </th>
                    <th className="whitespace-nowrap px-3.5 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Calls Received
                    </th>
                    <th className="whitespace-nowrap px-3.5 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Calls Answered
                    </th>
                    <th className="whitespace-nowrap px-3.5 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Calls Abandoned
                    </th>
                    <th className="whitespace-nowrap px-3.5 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Calls Abandoned after SL
                    </th>
                    <th className="whitespace-nowrap px-3.5 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Calls Answered within SL
                    </th>
                    <th className="whitespace-nowrap px-3.5 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      AHT
                    </th>
                    <th className="whitespace-nowrap px-3.5 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Abandoned Rate
                    </th>
                    <th className="whitespace-nowrap px-3.5 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      SL (Answered within 60 secs.)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {paginatedData.length > 0 ? (
                    paginatedData.map((row, idx) => (
                      <tr
                        key={`${row.country}-${row.language}-${row.skill || ""}-${idx}`}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="whitespace-nowrap px-3.5 py-2.5 font-bold text-slate-900">
                          {row.country || "—"}
                        </td>
                        <td className="whitespace-nowrap px-3.5 py-2.5 font-semibold text-slate-700">
                          {row.language || "—"}
                        </td>
                        <td className="whitespace-nowrap px-3.5 py-2.5 font-semibold text-[#0b3b68]">
                          <span className="inline-flex items-center rounded-md bg-sky-50 px-2 py-0.5 text-[11px] font-bold text-[#0b3b68] border border-sky-100">
                            {row.skill || "—"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3.5 py-2.5 text-right font-medium text-slate-800">
                          {(row.callsReceived ?? 0).toLocaleString()}
                        </td>
                        <td className="whitespace-nowrap px-3.5 py-2.5 text-right font-semibold text-emerald-700">
                          {(row.callsAnswered ?? 0).toLocaleString()}
                        </td>
                        <td className="whitespace-nowrap px-3.5 py-2.5 text-right font-medium text-rose-700">
                          {(row.callsAbandoned ?? 0).toLocaleString()}
                        </td>
                        <td className="whitespace-nowrap px-3.5 py-2.5 text-right font-medium text-amber-700">
                          {(row.callsAbandonedAfterSl ?? 0).toLocaleString()}
                        </td>
                        <td className="whitespace-nowrap px-3.5 py-2.5 text-right font-medium text-[#0b3b68]">
                          {(row.callsAnsweredWithinSl ?? 0).toLocaleString()}
                        </td>
                        <td className="whitespace-nowrap px-3.5 py-2.5 text-right font-mono font-medium text-slate-700">
                          {row.aht || "00:00"}
                        </td>
                        <td className="whitespace-nowrap px-3.5 py-2.5 text-right font-semibold text-rose-600">
                          {row.abandonedRate || "0.00%"}
                        </td>
                        <td className="whitespace-nowrap px-3.5 py-2.5 text-right font-bold text-[#0b3b68]">
                          {row.sl || "0.00%"}
                        </td>
                      </tr>
                    ))
                  ) : isLoading ? (
                    Array.from({ length: 10 }).map((_, i) => (
                      <tr key={`skeleton-${i}`} className="animate-pulse">
                        <td className="px-3.5 py-2.5">
                          <div className="h-4 w-28 bg-slate-200 rounded-md" />
                        </td>
                        <td className="px-3.5 py-2.5">
                          <div className="h-4 w-24 bg-slate-200 rounded-md" />
                        </td>
                        <td className="px-3.5 py-2.5">
                          <div className="h-4 w-12 bg-slate-200 rounded-md ml-auto" />
                        </td>
                        <td className="px-3.5 py-2.5">
                          <div className="h-4 w-12 bg-slate-200 rounded-md ml-auto" />
                        </td>
                        <td className="px-3.5 py-2.5">
                          <div className="h-4 w-12 bg-slate-200 rounded-md ml-auto" />
                        </td>
                        <td className="px-3.5 py-2.5">
                          <div className="h-4 w-12 bg-slate-200 rounded-md ml-auto" />
                        </td>
                        <td className="px-3.5 py-2.5">
                          <div className="h-4 w-12 bg-slate-200 rounded-md ml-auto" />
                        </td>
                        <td className="px-3.5 py-2.5">
                          <div className="h-4 w-14 bg-slate-200 rounded-md ml-auto" />
                        </td>
                        <td className="px-3.5 py-2.5">
                          <div className="h-4 w-16 bg-slate-200 rounded-md" />
                        </td>
                        <td className="px-3.5 py-2.5">
                          <div className="h-4 w-14 bg-slate-200 rounded-md ml-auto" />
                        </td>
                        <td className="px-3.5 py-2.5">
                          <div className="h-4 w-14 bg-slate-200 rounded-md ml-auto" />
                        </td>
                        <td className="px-3.5 py-2.5">
                          <div className="h-4 w-14 bg-slate-200 rounded-md ml-auto" />
                        </td>
                      </tr>
                    ))
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
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 font-medium">Rows per page:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="rounded border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold text-slate-700 outline-none focus:border-[#0b3b68] cursor-pointer"
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
