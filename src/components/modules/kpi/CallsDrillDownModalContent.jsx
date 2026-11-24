import { callRate, completeCallSum, callCount, formatCallRate } from "./callRate.js";
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { getCallsReport } from "@/lib/axios/kpis";
import { convertDurationToSeconds } from "./callKpiDashboardUtils.js";

function formatNumber(value, digits = 0) {
  if (callCount(value) === null) return "--";
  const num = Number(value || 0);
  return num.toLocaleString(undefined, { maximumFractionDigits: digits });
}

function formatPercent(value) {
  if (value == null || !Number.isFinite(Number(value))) return "--";
  const num = Number(value || 0);
  if (num >= 100 || num.toFixed(2) === "100.00") return "100%";
  return `${formatNumber(num, 2)}%`;
}

function formatDuration(seconds) {
  const value = Number(seconds || 0);
  if (!Number.isFinite(value) || value <= 0) return "--";
  const minutes = Math.floor(value / 60);
  const remainingSeconds = Math.round(value % 60);
  return minutes > 0
    ? `${minutes}m ${String(remainingSeconds).padStart(2, "0")}s`
    : `${remainingSeconds}s`;
}

function ProgressRow({ label, valueText, pct, barColor = "bg-[#0b3b68]", subtext = null }) {
  const clamped = Math.max(0, Math.min(100, Number(pct || 0)));
  return (
    <div className="space-y-0.5">
      <div className="flex items-baseline justify-between gap-2 text-[11px]">
        <span className="font-bold text-slate-700">{label}</span>
        <div className="flex items-baseline gap-2">
          {subtext ? <span className="text-[10.5px] font-medium text-slate-400">{subtext}</span> : null}
          <span className="font-extrabold text-[#103B63] tabular-nums">{valueText}</span>
        </div>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

function formatUtcDate(date) {
  return date.toISOString().slice(0, 10);
}

function toDateOnly(value) {
  if (!value) return undefined;
  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return formatUtcDate(parsed);
}

// Mirrors server WoW rule in callKpiService.js: weeks start Sunday and end Saturday,
// where Week 1 is the Sunday-Saturday week containing January 1.
function resolvePeriodDateRange(item) {
  if (!item) return { dateFrom: undefined, dateTo: undefined };

  const explicitFrom = toDateOnly(item.startDate || item.dateFrom);
  const explicitTo = toDateOnly(item.endDate || item.dateTo);
  if (explicitFrom) {
    return { dateFrom: explicitFrom, dateTo: explicitTo || explicitFrom };
  }

  const key = String(item.key || "").trim();

  // Daily / custom: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(key)) {
    return { dateFrom: key, dateTo: key };
  }

  // Weekly: YYYY-W##
  const weekMatch = /^(\d{4})-W(\d{1,2})$/i.exec(key);
  if (weekMatch) {
    const year = Number(weekMatch[1]);
    const week = Number(weekMatch[2]);
    const jan1 = new Date(Date.UTC(year, 0, 1));
    const firstSunday = new Date(Date.UTC(year, 0, 1 - jan1.getUTCDay()));
    const start = new Date(firstSunday.getTime());
    start.setUTCDate(start.getUTCDate() + (week - 1) * 7);
    const end = new Date(start.getTime());
    end.setUTCDate(end.getUTCDate() + 6);
    return { dateFrom: formatUtcDate(start), dateTo: formatUtcDate(end) };
  }

  // Monthly: YYYY-MM
  const monthMatch = /^(\d{4})-(\d{2})$/.exec(key);
  if (monthMatch) {
    const year = Number(monthMatch[1]);
    const month = Number(monthMatch[2]);
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 0));
    return { dateFrom: formatUtcDate(start), dateTo: formatUtcDate(end) };
  }

  // Quarterly: YYYY-Q#
  const quarterMatch = /^(\d{4})-Q([1-4])$/i.exec(key);
  if (quarterMatch) {
    const year = Number(quarterMatch[1]);
    const quarter = Number(quarterMatch[2]);
    const startMonth = (quarter - 1) * 3;
    const start = new Date(Date.UTC(year, startMonth, 1));
    const end = new Date(Date.UTC(year, startMonth + 3, 0));
    return { dateFrom: formatUtcDate(start), dateTo: formatUtcDate(end) };
  }

  // Annually: YYYY
  if (/^\d{4}$/.test(key)) {
    return { dateFrom: `${key}-01-01`, dateTo: `${key}-12-31` };
  }

  return { dateFrom: undefined, dateTo: undefined };
}

export default function CallsDrillDownModalContent({
  series = [],
  selectedIndex = 0,
  filters = {},
  targets = {},
}) {
  const activeItem = series[selectedIndex] || null;
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [reportView, setReportView] = useState("report1");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(18);
  const tableContainerRef = useRef(null);

  useEffect(() => {
    const el = tableContainerRef.current;
    if (!el) return undefined;

    const updatePageSize = () => {
      const headerHeight = el.querySelector("thead")?.getBoundingClientRect().height || 34;
      const sampleRowHeight = el.querySelector("tbody tr")?.getBoundingClientRect().height || 33;
      const available = el.clientHeight - headerHeight - 1;
      const fitCount = Math.max(8, Math.floor(available / Math.max(28, sampleRowHeight)));
      setPageSize((prev) => (prev === fitCount ? prev : fitCount));
    };

    updatePageSize();
    const observer = new ResizeObserver(updatePageSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, [isLoading, rows.length]);

  const { dateFrom, dateTo } = useMemo(
    () => resolvePeriodDateRange(activeItem),
    [activeItem],
  );

  useEffect(() => {
    let isCancelled = false;

    async function fetchDrillDown() {
      setIsLoading(true);
      setRows([]);
      setError(null);
      setCurrentPage(1);
      setSelectedCountry("");
      setSelectedLanguage("");
      setSearchQuery("");
      try {
        const params = {
          sourceSystem: filters?.sourceSystem || filters?.source || "US_VISA",
          taskOrder: filters?.taskOrder || undefined,
          country: filters?.country || undefined,
          skill: filters?.skill || undefined,
          taskOrderVersionId: filters?.taskOrderVersionId || "current",
          dateFrom,
          dateTo,
        };
        const res = await getCallsReport(params);
        if (isCancelled) return;
        const nextRows = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setRows(nextRows);
      } catch (err) {
        if (isCancelled) return;
        setRows([]);
        setError(
          err?.response?.data?.message || err?.message || "Failed to load calls drill-down data.",
        );
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    if (activeItem) {
      void fetchDrillDown();
    } else {
      setRows([]);
      setIsLoading(false);
    }

    return () => {
      isCancelled = true;
    };
  }, [
    activeItem?.key,
    dateFrom,
    dateTo,
    filters?.sourceSystem,
    filters?.source,
    filters?.taskOrder,
    filters?.country,
    filters?.skill,
    filters?.taskOrderVersionId,
  ]);

  const countryOptions = useMemo(() => {
    const set = new Set();
    rows.forEach((row) => {
      if (row?.country) set.add(String(row.country));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const languageOptions = useMemo(() => {
    const set = new Set();
    rows.forEach((row) => {
      if (selectedCountry && String(row?.country || "") !== selectedCountry) return;
      if (row?.language) set.add(String(row.language));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rows, selectedCountry]);

  useEffect(() => {
    if (selectedLanguage && !languageOptions.includes(selectedLanguage)) {
      setSelectedLanguage("");
    }
  }, [languageOptions, selectedLanguage]);

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return rows.filter((row) => {
      if (selectedCountry && String(row?.country || "") !== selectedCountry) return false;
      if (selectedLanguage && String(row?.language || "") !== selectedLanguage) return false;
      if (!q) return true;
      return [row.country, row.language, row.skill]
        .filter(Boolean)
        .some((val) => String(val).toLowerCase().includes(q));
    });
  }, [rows, searchQuery, selectedCountry, selectedLanguage]);

  const summary = useMemo(() => {
    const callsReceived = completeCallSum(filteredRows, "callsReceived");
    const callsAnswered = completeCallSum(filteredRows, "callsAnswered");
    const callsAbandoned = completeCallSum(filteredRows, "callsAbandoned");
    const callsAnsweredWithinSl = completeCallSum(filteredRows, "callsAnsweredWithinSl");
    const answerRatePct = callRate(callsAnswered, callsReceived);
    const abandonedRatePct = callRate(callsAbandoned, callsReceived);
    const slPct = callRate(callsAnsweredWithinSl, callsAnswered);

    return {
      callsReceived,
      callsAnswered,
      callsAbandoned,
      callsAnsweredWithinSl,
      answerRatePct,
      abandonedRatePct,
      slPct,
    };
  }, [filteredRows]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * pageSize;
  const paginatedData = filteredRows.slice(startIdx, startIdx + pageSize);

  // Safety check: if rendered rows ever exceed container height, step down pageSize by 1
  useEffect(() => {
    const el = tableContainerRef.current;
    if (!el || isLoading) return;
    if (el.scrollHeight > el.clientHeight + 1 && pageSize > 5) {
      setPageSize((prev) => prev - 1);
    }
  }, [pageSize, safePage, isLoading, filteredRows.length]);

  const pageNumbers = useMemo(() => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i += 1) pages.push(i);
      return pages;
    }
    pages.push(1);
    if (safePage > 3) pages.push("...");
    const start = Math.max(2, safePage - 1);
    const end = Math.min(totalPages - 1, safePage + 1);
    for (let i = start; i <= end; i += 1) pages.push(i);
    if (safePage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  }, [safePage, totalPages]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-2.5">
      {/* Top Toolbar: Search + Country/Language Filters + Date Range Info */}
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 rounded border border-slate-200 bg-white px-3.5 py-2 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-56">
            <Search
              size={13}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search country, language, skill..."
              className="w-full rounded border border-slate-300 bg-white py-1 pl-8 pr-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#103B63] focus:outline-none"
            />
          </div>

          <select
            value={selectedCountry}
            onChange={(e) => {
              setSelectedCountry(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter by country"
            className="rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 focus:border-[#103B63] focus:outline-none cursor-pointer"
          >
            <option value="">All Countries ({countryOptions.length})</option>
            {countryOptions.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>

          <select
            value={selectedLanguage}
            onChange={(e) => {
              setSelectedLanguage(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter by language"
            className="rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 focus:border-[#103B63] focus:outline-none cursor-pointer"
          >
            <option value="">All Languages ({languageOptions.length})</option>
            {languageOptions.map((language) => (
              <option key={language} value={language}>
                {language}
              </option>
            ))}
          </select>

          {/* 2-Report View Toggle */}
          <div
            className="inline-flex items-center rounded border border-slate-300 bg-slate-100 p-0.5"
            role="group"
            aria-label="Report view toggle"
          >
            <button
              type="button"
              onClick={() => {
                setReportView("report1");
                setCurrentPage(1);
              }}
              className={`rounded px-2.5 py-0.5 text-xs font-bold transition-colors cursor-pointer ${
                reportView === "report1"
                  ? "bg-[#103B63] text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Report 1
            </button>
            <button
              type="button"
              onClick={() => {
                setReportView("report2");
                setCurrentPage(1);
              }}
              className={`rounded px-2.5 py-0.5 text-xs font-bold transition-colors cursor-pointer ${
                reportView === "report2"
                  ? "bg-[#103B63] text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Report 2
            </button>
          </div>

          {(selectedCountry || selectedLanguage || searchQuery) ? (
            <button
              type="button"
              onClick={() => {
                setSelectedCountry("");
                setSelectedLanguage("");
                setSearchQuery("");
                setCurrentPage(1);
              }}
              className="rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Reset
            </button>
          ) : null}
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          {dateFrom && dateTo ? (
            <span>
              Date Range: <strong className="text-[#103B63]">{dateFrom}</strong> to{" "}
              <strong className="text-[#103B63]">{dateTo}</strong>
            </span>
          ) : null}
        </div>
      </div>

      {/* Compact Live Summary Cards (updates with Country / Language / Search filters) */}
      <div className="shrink-0 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        <div className="rounded border border-slate-200 bg-white px-3 py-2 shadow-2xs">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
            Calls Received
          </div>
          <div className="mt-0.5 text-lg font-black text-[#103B63] tabular-nums">
            {isLoading ? "--" : formatNumber(summary.callsReceived)}
          </div>
        </div>

        <div className="rounded border border-slate-200 bg-white px-3 py-2 shadow-2xs">
          <div className="flex items-center justify-between gap-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
            <span>Calls Answered</span>
            {!isLoading ? (
              <span className="text-[10px] font-bold text-emerald-700">
                {formatCallRate(summary.answerRatePct)}
              </span>
            ) : null}
          </div>
          <div className="mt-0.5 text-lg font-black text-emerald-600 tabular-nums">
            {isLoading ? "--" : formatNumber(summary.callsAnswered)}
          </div>
        </div>

        <div className="rounded border border-slate-200 bg-white px-3 py-2 shadow-2xs">
          <div className="flex items-center justify-between gap-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
            <span>Calls Abandoned</span>
            {!isLoading ? (
              <span className="text-[10px] font-bold text-rose-600">
                {formatCallRate(summary.abandonedRatePct)}
              </span>
            ) : null}
          </div>
          <div className="mt-0.5 text-lg font-black text-rose-600 tabular-nums">
            {isLoading ? "--" : formatNumber(summary.callsAbandoned)}
          </div>
        </div>

        <div className="rounded border border-slate-200 bg-white px-3 py-2 shadow-2xs">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
            Answered Within SL
          </div>
          <div className="mt-0.5 text-lg font-black text-[#0b3b68] tabular-nums">
            {isLoading ? "--" : formatNumber(summary.callsAnsweredWithinSl)}
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 rounded border border-slate-200 bg-white px-3 py-2 shadow-2xs">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
            SL (Within 60s)
          </div>
          <div
            className={`mt-0.5 text-lg font-black tabular-nums ${
              isLoading || summary.slPct === null
                ? "text-slate-400"
                : summary.slPct >= 80
                ? "text-emerald-600"
                : "text-amber-600"
            }`}
          >
            {isLoading ? "--" : formatCallRate(summary.slPct)}
          </div>
        </div>
      </div>

      {reportView === "report2" ? (
        (() => {
          const offered = summary.callsReceived;
          const handled = summary.callsAnswered;
          const handledSla = summary.callsAnsweredWithinSl;
          const abandoned = summary.callsAbandoned;
          const outsideSla = handled === null || handledSla === null ? null : Math.max(0, handled - handledSla);
          const outsideSlaPct = callRate(outsideSla, handled);
          const answerRatePct = summary.answerRatePct;
          const serviceLevelPct = summary.slPct;
          const abandonRatePct = summary.abandonedRatePct;

          const ahtSeconds = convertDurationToSeconds(activeItem?.ahtSeconds);
          const asaSeconds = convertDurationToSeconds(activeItem?.asaSeconds);
          const totalQueueSeconds = Number(activeItem?.totalQueueSeconds || 0);
          const ahtCalls = Number(activeItem?.ahtCalls || 0);
          const ahtCoveragePct = activeItem?.ahtCoveragePct;

          const targetSlPct = Number(targets?.serviceLevelPct ?? 90);
          const targetAhtSec = convertDurationToSeconds(targets?.ahtSeconds ?? 420);
          const slMet = serviceLevelPct !== null && serviceLevelPct >= targetSlPct;
          const ahtMet = ahtSeconds > 0 && ahtSeconds <= targetAhtSec;
          const slVariance = serviceLevelPct === null ? null : serviceLevelPct - targetSlPct;
          const ahtVariance = ahtSeconds - targetAhtSec;

          return (
            <div className="flex-1 min-h-0 flex flex-col gap-2.5 overflow-hidden">
              <div className="shrink-0 grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                <div className="rounded border border-slate-200 bg-white px-4 py-2.5 shadow-2xs flex flex-col justify-between gap-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <h3 className="m-0 text-[11px] font-black uppercase tracking-wider text-[#103B63]">
                      Call Volume Breakdown
                    </h3>
                    <span className="text-[10.5px] font-semibold text-slate-400">
                      {activeItem?.label}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <ProgressRow
                      label="Total Calls Offered"
                      valueText={formatNumber(offered)}
                      pct={offered > 0 ? 100 : null}
                      barColor="bg-[#0b3b68]"
                    />
                    <ProgressRow
                      label="Calls Handled"
                      valueText={formatNumber(handled)}
                      subtext={formatPercent(answerRatePct)}
                      pct={answerRatePct}
                      barColor="bg-[#2f6f9f]"
                    />
                    <ProgressRow
                      label="Handled Within SLA"
                      valueText={formatNumber(handledSla)}
                      subtext={`${formatPercent(serviceLevelPct)} of handled`}
                      pct={serviceLevelPct}
                      barColor="bg-[#4c9aca]"
                    />
                    <ProgressRow
                      label="Handled Outside SLA"
                      valueText={formatNumber(outsideSla)}
                      subtext={`${formatPercent(outsideSlaPct)} of handled`}
                      pct={outsideSlaPct}
                      barColor="bg-amber-400"
                    />
                    <ProgressRow
                      label="Abandoned / Unhandled"
                      valueText={formatNumber(abandoned)}
                      subtext={formatPercent(abandonRatePct)}
                      pct={abandonRatePct}
                      barColor="bg-rose-400"
                    />
                  </div>
                </div>

                <div className="rounded border border-slate-200 bg-white px-4 py-2.5 shadow-2xs flex flex-col justify-between gap-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <h3 className="m-0 text-[11px] font-black uppercase tracking-wider text-[#103B63]">
                      Target &amp; Efficiency Metrics
                    </h3>
                    <span className="text-[10.5px] font-semibold text-slate-400">
                      Variance &amp; Speed
                    </span>
                  </div>

                  <div className="grid flex-1 grid-cols-2 gap-2">
                    <div className="rounded bg-slate-50 px-2.5 py-2 border border-slate-100">
                      <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500">
                        SL Variance vs Target
                      </div>
                      <div className={`mt-0.5 text-sm font-black tabular-nums ${slVariance === null ? "text-slate-400" : slMet ? "text-emerald-700" : "text-amber-700"}`}>
                        {slVariance === null ? "--" : slVariance >= 0 ? `+${slVariance.toFixed(2)}%` : `${slVariance.toFixed(2)}%`}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Actual {formatPercent(serviceLevelPct)} vs {targetSlPct}%
                      </div>
                    </div>

                    <div className="rounded bg-slate-50 px-2.5 py-2 border border-slate-100">
                      <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500">
                        AHT Variance vs Target
                      </div>
                      <div className={`mt-0.5 text-sm font-black tabular-nums ${ahtSeconds <= 0 ? "text-slate-400" : ahtMet ? "text-emerald-700" : "text-amber-700"}`}>
                        {ahtSeconds > 0
                          ? `${ahtVariance > 0 ? "+" : ""}${formatNumber(ahtVariance)}s`
                          : "--"}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Target {formatNumber(targetAhtSec)}s ({formatDuration(targetAhtSec)})
                      </div>
                    </div>

                    <div className="rounded bg-slate-50 px-2.5 py-2 border border-slate-100">
                      <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500">
                        Avg Speed of Answer (ASA)
                      </div>
                      <div className="mt-0.5 text-sm font-black text-[#103B63] tabular-nums">
                        {asaSeconds > 0 ? `${formatNumber(asaSeconds)}s` : "--"}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Total queue: {totalQueueSeconds > 0 ? formatDuration(totalQueueSeconds) : "--"}
                      </div>
                    </div>

                    <div className="rounded bg-slate-50 px-2.5 py-2 border border-slate-100">
                      <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500">
                        AHT Sample Coverage
                      </div>
                      <div className="mt-0.5 text-sm font-black text-[#103B63] tabular-nums">
                        {ahtCoveragePct != null ? formatPercent(ahtCoveragePct) : "--"}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {ahtCalls > 0 ? `${formatNumber(ahtCalls)} documented calls` : "Pending AHT source"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 min-h-0 flex flex-col rounded border border-slate-200 bg-white shadow-2xs overflow-hidden">
                <div className="shrink-0 flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-1.5">
                  <h3 className="m-0 text-[11px] font-black uppercase tracking-wider text-[#103B63]">
                    Detailed Metrics
                  </h3>
                  <span className="text-[10.5px] font-semibold text-slate-500">
                    Complete call performance summary
                  </span>
                </div>

                <div className="flex-1 min-h-0 overflow-hidden">
                  <table className="h-full w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/70 text-[9.5px] font-extrabold uppercase tracking-wider text-slate-500">
                        <th className="px-3.5 py-1.5">Metric</th>
                        <th className="px-3 py-1.5 text-right">Value</th>
                        <th className="px-3 py-1.5 text-right">Share / Benchmark</th>
                        <th className="px-3.5 py-1.5 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="px-3.5 py-1 font-semibold text-slate-700">Calls Offered</td>
                        <td className="px-3 py-1 text-right font-bold text-[#103B63] tabular-nums">{formatNumber(offered)}</td>
                        <td className="px-3 py-1 text-right text-slate-500 tabular-nums">100% of volume</td>
                        <td className="px-3.5 py-1 text-right text-slate-400">--</td>
                      </tr>
                      <tr>
                        <td className="px-3.5 py-1 font-semibold text-slate-700">Calls Handled</td>
                        <td className="px-3 py-1 text-right font-bold text-[#103B63] tabular-nums">{formatNumber(handled)}</td>
                        <td className="px-3 py-1 text-right text-slate-500 tabular-nums">{formatPercent(answerRatePct)} answer rate</td>
                        <td className="px-3.5 py-1 text-right text-slate-400">--</td>
                      </tr>
                      <tr>
                        <td className="px-3.5 py-1 font-semibold text-slate-700">Handled Within SLA</td>
                        <td className="px-3 py-1 text-right font-bold text-[#103B63] tabular-nums">{formatNumber(handledSla)}</td>
                        <td className="px-3 py-1 text-right text-slate-500 tabular-nums">{formatPercent(serviceLevelPct)} vs {targetSlPct}% target</td>
                        <td className="px-3.5 py-1 text-right">
                          <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold ${serviceLevelPct === null ? "text-slate-400" : slMet ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                            {serviceLevelPct === null ? "--" : slMet ? "Target Met" : "Below Target"}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3.5 py-1 font-semibold text-slate-700">Handled Outside SLA</td>
                        <td className="px-3 py-1 text-right font-bold text-[#103B63] tabular-nums">{formatNumber(outsideSla)}</td>
                        <td className="px-3 py-1 text-right text-slate-500 tabular-nums">{formatPercent(outsideSlaPct)} of handled</td>
                        <td className="px-3.5 py-1 text-right text-slate-400">--</td>
                      </tr>
                      <tr>
                        <td className="px-3.5 py-1 font-semibold text-slate-700">Abandoned / Unhandled</td>
                        <td className="px-3 py-1 text-right font-bold text-[#103B63] tabular-nums">{formatNumber(abandoned)}</td>
                        <td className="px-3 py-1 text-right text-slate-500 tabular-nums">{formatPercent(abandonRatePct)} of offered</td>
                        <td className="px-3.5 py-1 text-right text-slate-400">--</td>
                      </tr>
                      <tr>
                        <td className="px-3.5 py-1 font-semibold text-slate-700">Average Handling Time (AHT)</td>
                        <td className="px-3 py-1 text-right font-bold text-[#103B63] tabular-nums">
                          {ahtSeconds > 0 ? `${formatNumber(ahtSeconds)}s (${formatDuration(ahtSeconds)})` : "--"}
                        </td>
                        <td className="px-3 py-1 text-right text-slate-500 tabular-nums">Target {formatNumber(targetAhtSec)}s</td>
                        <td className="px-3.5 py-1 text-right">
                          {ahtSeconds > 0 ? (
                            <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold ${ahtMet ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                              {ahtMet ? "On Target" : "Over Target"}
                            </span>
                          ) : (
                            <span className="text-slate-400">--</span>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3.5 py-1 font-semibold text-slate-700">Average Speed of Answer (ASA)</td>
                        <td className="px-3 py-1 text-right font-bold text-[#103B63] tabular-nums">
                          {asaSeconds > 0 ? `${formatNumber(asaSeconds)}s` : "--"}
                        </td>
                        <td className="px-3 py-1 text-right text-slate-500 tabular-nums">
                          Total queue: {totalQueueSeconds > 0 ? formatDuration(totalQueueSeconds) : "--"}
                        </td>
                        <td className="px-3.5 py-1 text-right text-slate-400">--</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()
      ) : (
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden rounded border border-slate-200 bg-white shadow-2xs">

      {/* Table Area */}
      <div ref={tableContainerRef} className="flex-1 min-h-0 overflow-hidden">
        {error ? (
          <div className="flex h-full items-center justify-center p-6">
            <div className="flex items-center gap-2 rounded border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        ) : (
          <table className="w-full table-auto border-collapse text-left text-xs">
            <thead className="sticky top-0 z-10 bg-[#103B63]">
              <tr>
                <th className="px-2.5 py-2 text-[10px] font-extrabold uppercase tracking-wider leading-tight text-white">
                  Country
                </th>
                <th className="px-2.5 py-2 text-[10px] font-extrabold uppercase tracking-wider leading-tight text-white">
                  Language
                </th>
                <th className="px-2.5 py-2 text-[10px] font-extrabold uppercase tracking-wider leading-tight text-white">
                  Skills
                </th>
                <th className="px-2.5 py-2 text-right text-[10px] font-extrabold uppercase tracking-wider leading-tight text-white">
                  Calls Received
                </th>
                <th className="px-2.5 py-2 text-right text-[10px] font-extrabold uppercase tracking-wider leading-tight text-white">
                  Calls Answered
                </th>
                <th className="px-2.5 py-2 text-right text-[10px] font-extrabold uppercase tracking-wider leading-tight text-white">
                  Calls Abandoned
                </th>
                <th className="px-2.5 py-2 text-right text-[10px] font-extrabold uppercase tracking-wider leading-tight text-white">
                  Abandoned After SL
                </th>
                <th className="px-2.5 py-2 text-right text-[10px] font-extrabold uppercase tracking-wider leading-tight text-white">
                  Answered Within SL
                </th>
                <th className="px-2.5 py-2 text-right text-[10px] font-extrabold uppercase tracking-wider leading-tight text-white">
                  Abandoned Rate
                </th>
                <th className="px-2.5 py-2 text-right text-[10px] font-extrabold uppercase tracking-wider leading-tight text-white">
                  SL (Within 60s)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {isLoading ? (
                Array.from({ length: 15 }).map((_, i) => (
                  <tr key={`skeleton-${i}`} className="animate-pulse">
                    {Array.from({ length: 10 }).map((__, colIdx) => (
                      <td key={colIdx} className="px-2.5 py-1.5">
                        <div
                          className={`h-3.5 rounded bg-slate-200 ${
                            colIdx < 3 ? "w-20" : "ml-auto w-12"
                          }`}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginatedData.length > 0 ? (
                paginatedData.map((row, idx) => {
                  const isAbandonedZero = row.callsAbandoned === 0;
                  const isAbandonedAfterSlZero = row.callsAbandonedAfterSl === 0;
                  const slNumber = parseFloat(row.sl) || 0;
                  const isHighSL = slNumber >= 80;

                  return (
                    <tr
                      key={`${row.country}-${row.language}-${row.skill || ""}-${idx}`}
                      className={`transition-colors hover:bg-sky-50/60 ${
                        idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"
                      }`}
                    >
                      <td className="whitespace-nowrap px-2.5 py-1.5 font-bold text-slate-900">
                        {row.country || "—"}
                      </td>
                      <td className="whitespace-nowrap px-2.5 py-1.5 font-semibold text-slate-800">
                        {row.language || "—"}
                      </td>
                      <td className="px-2.5 py-1.5">
                        <span className="inline-flex items-center rounded-md bg-sky-50 px-2 py-0.5 text-[11px] font-bold text-[#0b3b68] border border-sky-200/80 shadow-2xs">
                          {row.skill || "—"}
                        </span>
                      </td>
                      <td className="px-2.5 py-1.5 text-right font-bold text-slate-900 tabular-nums">
                        {(row.callsReceived ?? 0).toLocaleString()}
                      </td>
                      <td className="px-2.5 py-1.5 text-right font-bold text-emerald-600 tabular-nums">
                        {(row.callsAnswered ?? 0).toLocaleString()}
                      </td>
                      <td className="px-2.5 py-1.5 text-right tabular-nums">
                        <span
                          className={`font-semibold ${
                            isAbandonedZero ? "text-slate-400" : "text-rose-600 font-bold"
                          }`}
                        >
                          {row.callsAbandoned === null
                            ? "—"
                            : (row.callsAbandoned ?? 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-2.5 py-1.5 text-right tabular-nums">
                        <span
                          className={`font-semibold ${
                            isAbandonedAfterSlZero ? "text-slate-400" : "text-amber-600 font-bold"
                          }`}
                        >
                          {row.callsAbandonedAfterSl === null
                            ? "—"
                            : (row.callsAbandonedAfterSl ?? 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-2.5 py-1.5 text-right font-semibold text-[#0b3b68] tabular-nums">
                        {row.callsAnsweredWithinSl === null
                          ? "—"
                          : (row.callsAnsweredWithinSl ?? 0).toLocaleString()}
                      </td>
                      <td className="px-2.5 py-1.5 text-right tabular-nums">
                        <span
                          className={`inline-block font-bold ${
                            isAbandonedZero ? "text-slate-400" : "text-rose-600"
                          }`}
                        >
                          {row.abandonedRate ?? "--"}
                        </span>
                      </td>
                      <td className="px-2.5 py-1.5 text-right tabular-nums">
                        <span
                          className={`inline-block font-extrabold ${
                            row.sl === null || row.sl === undefined || row.sl === "—" || row.sl === "--"
                              ? "text-slate-400"
                              : isHighSL
                              ? "text-emerald-600"
                              : "text-amber-600"
                          }`}
                        >
                          {row.sl ?? "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-xs font-semibold text-slate-500">
                    No calls report records found for {activeItem?.label || "this period"}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50/80 px-4 py-2 text-xs text-slate-600">
        <span>
          Showing{" "}
          <strong className="text-slate-900">
            {filteredRows.length === 0 ? 0 : startIdx + 1}
          </strong>{" "}
          to{" "}
          <strong className="text-slate-900">
            {Math.min(startIdx + pageSize, filteredRows.length)}
          </strong>{" "}
          of <strong className="text-slate-900">{filteredRows.length}</strong> records
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft size={13} />
            Previous
          </button>

          {pageNumbers.map((page, i) =>
            page === "..." ? (
              <span key={`ellipsis-${i}`} className="px-1.5 text-slate-400">
                ...
              </span>
            ) : (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`min-w-[28px] rounded px-2 py-1 text-xs font-bold transition-colors cursor-pointer ${
                  page === safePage
                    ? "bg-[#103B63] text-white"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                }`}
              >
                {page}
              </button>
            ),
          )}

          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Next
            <ChevronRight size={13} />
          </button>
        </div>
      </div>
      </div>
      )}
    </div>
  );
}
