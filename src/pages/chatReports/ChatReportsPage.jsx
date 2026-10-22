import React, { useEffect, useMemo, useState } from "react";
import AdminSidebar from "@/components/common/layout/AdminSidebar";
import AppHeader from "@/components/common/layout/AppHeader";
import ConfirmationModal from "@/components/common/ui/ConfirmationModal";
import LoadingModal from "@/components/common/ui/LoadingModal";
import DatePicker from "@/components/common/filters/DatePicker";
import MultiSelectDropdown from "@/components/common/filters/MultiSelectDropdown";
import useDashboardPage from "@/hooks/useDashboardPage";
import { getChatReport, getCallSkills } from "@/lib/axios/kpis";
import {
  SOURCE_OPTIONS as KPI_SOURCE_OPTIONS,
  SKILLS_BY_COUNTRY,
  getTaskOrderOptions,
  getCountryOptions,
  getSkillOptions,
} from "@/config/kpiFiltersConfig";
import {
  AlertCircle,
  Calendar,
  Clock,
  MessageCircle,
  MessageSquareCheck,
  MessageSquareOff,
  Percent,
  RefreshCw,
  Search,
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
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function formatDuration(seconds) {
  if (!Number.isFinite(Number(seconds)) || Number(seconds) <= 0) return "--";
  const total = Math.round(Number(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function ChatReportsPage() {
  const dashboard = useDashboardPage();
  const userName = dashboard.authUser?.name || dashboard.authUser?.username || dashboard.userName || "User";

  const [reportData, setReportData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => formatManilaDate());
  const [selectedSources, setSelectedSources] = useState([]); // Empty means all sources
  const [selectedTaskOrders, setSelectedTaskOrders] = useState([]); // Empty means all task orders
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]); // Empty means all skills
  const [skillsByCountry, setSkillsByCountry] = useState(SKILLS_BY_COUNTRY);

  const fetchReport = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const params = {
        date: selectedDate || undefined,
        sourceSystem: selectedSources.length ? selectedSources.join(",") : "US_VISA",
        taskOrder: selectedTaskOrders.length ? selectedTaskOrders.join(",") : undefined,
        country: selectedCountries.length ? selectedCountries.join(",") : undefined,
        skill: selectedSkills.length ? selectedSkills.join(",") : undefined,
      };
      const res = await getChatReport(params);
      setReportData(Array.isArray(res?.data) ? res.data : []);
      if (res?.resolvedDate && res.resolvedDate !== selectedDate) setSelectedDate(res.resolvedDate);
    } catch (err) {
      console.error("Failed to load Chat Report:", err);
      setFetchError(err?.response?.data?.message || err?.message || "Failed to load Chat Report from server.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchReport();
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

  const sourceOptions = useMemo(() => KPI_SOURCE_OPTIONS, []);

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

  const filteredData = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return reportData;
    return reportData.filter((row) =>
      String(row.country || "").toLowerCase().includes(term)
      || String(row.taskOrderId || "").toLowerCase().includes(term)
    );
  }, [reportData, searchTerm]);

  const totals = useMemo(() => {
    const total = filteredData.reduce((acc, row) => {
      acc.received += Number(row.chatsReceived || 0);
      acc.answered += Number(row.chatsAnswered || 0);
      acc.noResponse += Number(row.noResponse || 0);
      acc.abandoned += Number(row.chatsAbandoned || 0);
      acc.duration += Number(row.durationSecondsNumerator || 0);
      acc.durationCount += Number(row.durationSecondsDenominator || 0);
      return acc;
    }, { received: 0, answered: 0, noResponse: 0, abandoned: 0, duration: 0, durationCount: 0 });

    total.ahtSeconds = total.durationCount > 0 ? total.duration / total.durationCount : 0;
    total.sla = total.received > 0 ? (total.answered / total.received) * 100 : 0;
    return total;
  }, [filteredData]);

  const summaryCards = [
    { label: "Date", value: selectedDate ? formatDisplayDate(selectedDate) : "All Dates", icon: Calendar },
    { label: "Chats Received", value: totals.received.toLocaleString(), icon: MessageCircle },
    { label: "Chats Answered", value: totals.answered.toLocaleString(), icon: MessageSquareCheck },
    { label: "No Response", value: totals.noResponse.toLocaleString(), icon: MessageSquareOff },
    { label: "Chats Abandoned", value: totals.abandoned.toLocaleString(), icon: MessageSquareOff },
    { label: "Average AHT", value: formatDuration(totals.ahtSeconds), icon: Clock },
    { label: "SLA", value: `${totals.sla.toFixed(2)}%`, icon: Percent },
  ];

  return (
    <section className="font-jakarta flex h-screen max-h-[100dvh] min-h-screen overflow-hidden bg-[#eef3f7] text-sibs-primary-1">
      <AdminSidebar
        isMobileOpen={dashboard.isMobileSidebarOpen}
        modules={dashboard.modules}
        onLogoutClick={() => dashboard.setShowLogoutModal(true)}
        onMobileClose={() => dashboard.setIsMobileSidebarOpen(false)}
        userName={userName}
        userRole={dashboard.authUser?.email || dashboard.authUser?.roleLabel || "Workforce Management"}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AppHeader
          title="Chat Reports"
          subtitle="Workforce Management System"
          userName={userName}
          onMenuClick={() => dashboard.setIsMobileSidebarOpen(true)}
          onLogoutClick={() => dashboard.setShowLogoutModal(true)}
        />

        <main className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-hidden px-2.5 pb-2.5 pt-2.5 sm:gap-3 sm:px-4 sm:pt-3 lg:px-5">
          <div className="sibs-card relative z-40 shrink-0 overflow-visible bg-white p-2 shadow-xs sm:p-2.5">
            <div className="grid grid-cols-1 items-end gap-2 sm:grid-cols-2 sm:gap-2.5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
              <MultiSelectDropdown
                label="Source System"
                value={selectedSources}
                onChange={(value) => setSelectedSources(Array.isArray(value) ? value : [])}
                options={sourceOptions}
                placeholder="All Sources"
                allOptionLabel="All Sources"
              />

              <MultiSelectDropdown
                label="Task Order"
                value={selectedTaskOrders}
                onChange={(value) => setSelectedTaskOrders(Array.isArray(value) ? value : [])}
                options={taskOrderOptions}
                placeholder="All Task Orders"
                allOptionLabel="All Task Orders"
              />

              <MultiSelectDropdown
                label="Country"
                value={selectedCountries}
                onChange={(value) => setSelectedCountries(Array.isArray(value) ? value : [])}
                options={countryOptions}
                placeholder="All Countries"
                allOptionLabel="All Countries"
              />

              <MultiSelectDropdown
                label="Skill"
                value={selectedSkills}
                onChange={(value) => setSelectedSkills(Array.isArray(value) ? value : [])}
                options={skillOptions}
                placeholder="All Skills"
                allOptionLabel="All Skills"
              />

              <DatePicker
                label="Select Date"
                value={selectedDate}
                onChange={(value) => setSelectedDate(value || "")}
              />

              <div className="w-full">
                <span className="mb-0.5 block text-[9.5px] font-extrabold uppercase text-sibs-tertiary-5">Search</span>
                <div className="relative flex h-8 items-center rounded-lg border border-sibs-tertiary-8 bg-white px-2.5 transition-colors hover:border-sibs-primary-1 focus-within:border-sibs-primary-1 focus-within:ring-1 focus-within:ring-sibs-primary-1/20">
                  <Search size={12} className="mr-1.5 shrink-0 text-slate-400" />
                  <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search country..." className="w-full bg-transparent text-xs font-semibold text-slate-800 outline-none placeholder:text-slate-400" />
                  {searchTerm && <button type="button" onClick={() => setSearchTerm("")} className="ml-1 cursor-pointer text-slate-400 hover:text-slate-600"><X size={12} /></button>}
                </div>
              </div>

              <div className="flex w-full items-center justify-end gap-1.5">
                <button type="button" onClick={fetchReport} disabled={isLoading} className="inline-flex h-8 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-sibs-tertiary-8 bg-white px-3 text-xs font-bold text-sibs-primary-1 shadow-2xs transition hover:border-sibs-primary-1 hover:bg-sibs-primary-1 hover:text-white disabled:cursor-not-allowed disabled:opacity-40">
                  <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} /> Refresh
                </button>
              </div>
            </div>
          </div>

          <div className="grid shrink-0 grid-cols-2 gap-1.5 sm:grid-cols-3 sm:gap-2 md:grid-cols-4 xl:grid-cols-7">
            {summaryCards.map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 shadow-2xs transition-all hover:border-slate-300 sm:px-3 sm:py-2">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="truncate text-[10px] font-bold uppercase tracking-wider text-slate-500" title={label}>{label}</span>
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-slate-100 text-slate-600"><Icon size={11} /></div>
                </div>
                <div className="mt-0.5 text-base font-bold leading-snug text-slate-900 sm:text-lg">
                  {isLoading ? <div className="my-0.5 h-6 w-16 animate-pulse rounded bg-slate-200" /> : value}
                </div>
              </div>
            ))}
          </div>

          {fetchError && (
            <div className="shrink-0 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-700">
              <div className="flex items-start gap-2"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><p className="m-0 font-medium">{fetchError}</p></div>
            </div>
          )}

          <div className="flex min-h-[360px] flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs lg:min-h-0">
            <div className="min-h-0 flex-1 overflow-auto sibs-scrollbar">
              <table className="w-full border-collapse text-left text-xs">
                <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-100/90 shadow-2xs backdrop-blur-xs">
                  <tr>
                    {["Country", "Chats Received", "Chats Answered", "No Response", "Chats Abandoned", "AHT", "SLA"].map((column, index) => (
                      <th key={column} className={`whitespace-nowrap px-4 py-3 text-[11px] font-extrabold uppercase tracking-wider text-slate-700 ${index ? "text-right" : ""}`}>{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {isLoading ? Array.from({ length: 7 }).map((_, index) => (
                    <tr key={`loading-${index}`} className="animate-pulse">
                      {Array.from({ length: 7 }).map((__, cell) => <td key={cell} className="px-4 py-3"><div className={`h-4 rounded bg-slate-200 ${cell ? "ml-auto w-14" : "w-28"}`} /></td>)}
                    </tr>
                  )) : filteredData.length ? (
                    <>
                      {filteredData.map((row, index) => (
                        <tr key={`${row.country}-${row.taskOrderId || ""}-${index}`} className={`${index % 2 ? "bg-slate-50/40" : "bg-white"} transition-colors hover:bg-sky-50/60`}>
                          <td className="whitespace-nowrap px-4 py-3 font-bold text-slate-900">{row.country || "Other"}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-slate-900">{Number(row.chatsReceived || 0).toLocaleString()}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-emerald-600">{Number(row.chatsAnswered || 0).toLocaleString()}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-amber-600">{Number(row.noResponse || 0).toLocaleString()}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-rose-600">{Number(row.chatsAbandoned || 0).toLocaleString()}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-right font-mono font-semibold text-slate-800">{row.aht || "--"}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-[#0b3b68]">{row.sla || "0.00%"}</td>
                        </tr>
                      ))}
                      <tr className="sticky bottom-0 border-t-2 border-slate-300 bg-amber-50 font-extrabold text-slate-900 shadow-[0_-1px_0_rgba(148,163,184,0.35)]">
                        <td className="whitespace-nowrap px-4 py-3 uppercase">EOD Total</td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">{totals.received.toLocaleString()}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">{totals.answered.toLocaleString()}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">{totals.noResponse.toLocaleString()}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">{totals.abandoned.toLocaleString()}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-right font-mono">{formatDuration(totals.ahtSeconds)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">{totals.sla.toFixed(2)}%</td>
                      </tr>
                    </>
                  ) : (
                    <tr><td colSpan={7} className="py-24 text-center text-sm text-slate-400">No chat records found for the selected filters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      <ConfirmationModal isOpen={dashboard.showLogoutModal} title="Confirm logout" message="Are you sure you want to logout?" cancelText="Cancel" confirmText="Logout" onCancel={() => dashboard.setShowLogoutModal(false)} onConfirm={dashboard.handleLogout} tone="neutral" />
      <LoadingModal isOpen={dashboard.isLoggingOut} title="Logging out" message="Please wait while we end your session." />
    </section>
  );
}
