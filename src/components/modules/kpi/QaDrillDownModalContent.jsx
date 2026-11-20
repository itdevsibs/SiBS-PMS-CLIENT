import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, ChevronLeft, ChevronRight, Eye, Search } from "lucide-react";
import { getQualityAuditReport } from "@/lib/axios/kpis";
import QaAuditDetailModal from "./QaAuditDetailModal.jsx";

function formatNumber(value, digits = 0) {
  const num = Number(value || 0);
  return num.toLocaleString(undefined, { maximumFractionDigits: digits });
}

function normalizeQaScorePct(value) {
  const num = Number(value || 0);
  if (!Number.isFinite(num)) return 0;
  return num > 0 && num <= 1 ? num * 100 : num;
}

function formatPercent(value) {
  const num = Number(value || 0);
  if (num >= 100 || num.toFixed(2) === "100.00") return "100%";
  return `${formatNumber(num, 2)}%`;
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

function resolvePeriodDateRange(item) {
  if (!item) return { dateFrom: undefined, dateTo: undefined };

  const explicitFrom = toDateOnly(item.startDate || item.dateFrom);
  const explicitTo = toDateOnly(item.endDate || item.dateTo);
  if (explicitFrom) {
    return { dateFrom: explicitFrom, dateTo: explicitTo || explicitFrom };
  }

  const key = String(item.key || "").trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(key)) {
    return { dateFrom: key, dateTo: key };
  }

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

  const monthMatch = /^(\d{4})-(\d{2})$/.exec(key);
  if (monthMatch) {
    const year = Number(monthMatch[1]);
    const month = Number(monthMatch[2]);
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 0));
    return { dateFrom: formatUtcDate(start), dateTo: formatUtcDate(end) };
  }

  const quarterMatch = /^(\d{4})-Q([1-4])$/i.exec(key);
  if (quarterMatch) {
    const year = Number(quarterMatch[1]);
    const quarter = Number(quarterMatch[2]);
    const startMonth = (quarter - 1) * 3;
    const start = new Date(Date.UTC(year, startMonth, 1));
    const end = new Date(Date.UTC(year, startMonth + 3, 0));
    return { dateFrom: formatUtcDate(start), dateTo: formatUtcDate(end) };
  }

  if (/^\d{4}$/.test(key)) {
    return { dateFrom: `${key}-01-01`, dateTo: `${key}-12-31` };
  }

  return { dateFrom: undefined, dateTo: undefined };
}

function ProgressRow({ label, valueText, pct, barColor = "bg-[#174f7f]", subtext = null }) {
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

export default function QaDrillDownModalContent({
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
  const [selectedAgent, setSelectedAgent] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedLob, setSelectedLob] = useState("");
  const [reportView, setReportView] = useState("report1");
  const [viewingAudit, setViewingAudit] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const tableContainerRef = useRef(null);

  const { dateFrom, dateTo } = useMemo(
    () => resolvePeriodDateRange(activeItem),
    [activeItem],
  );

  useEffect(() => {
    let isCancelled = false;

    async function fetchDrillDown() {
      setIsLoading(true);
      setError(null);
      setCurrentPage(1);
      setSelectedAgent("");
      setSelectedCountry("");
      setSelectedLob("");
      setSearchQuery("");
      try {
        const params = {
          taskOrder: filters?.taskOrder || undefined,
          country: filters?.country || undefined,
          lob: filters?.lob || undefined,
          auditType: filters?.auditType || undefined,
          dateFrom,
          dateTo,
        };
        const res = await getQualityAuditReport(params);
        if (isCancelled) return;
        const nextRows = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setRows(nextRows);
      } catch (err) {
        if (isCancelled) return;
        setRows([]);
        setError(
          err?.response?.data?.message || err?.message || "Failed to load QA drill-down data.",
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
    filters?.taskOrder,
    filters?.country,
    filters?.lob,
    filters?.auditType,
  ]);

  useEffect(() => {
    const el = tableContainerRef.current;
    if (!el || reportView !== "report1") return undefined;

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
  }, [isLoading, rows.length, reportView]);

  const countryOptions = useMemo(() => {
    const set = new Set();
    rows.forEach((row) => {
      if (row?.country) set.add(String(row.country));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const lobOptions = useMemo(() => {
    const set = new Set();
    rows.forEach((row) => {
      if (selectedCountry && String(row?.country || "") !== selectedCountry) return;
      if (row?.lob && row.lob !== "—") set.add(String(row.lob));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rows, selectedCountry]);

  useEffect(() => {
    if (selectedLob && !lobOptions.includes(selectedLob)) {
      setSelectedLob("");
    }
  }, [lobOptions, selectedLob]);

  const agentOptions = useMemo(() => {
    const set = new Set();
    rows.forEach((row) => {
      if (selectedCountry && String(row?.country || "") !== selectedCountry) return;
      if (selectedLob && String(row?.lob || "") !== selectedLob) return;
      if (row?.agentName && row.agentName !== "—") set.add(String(row.agentName));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rows, selectedCountry, selectedLob]);

  useEffect(() => {
    if (selectedAgent && !agentOptions.includes(selectedAgent)) {
      setSelectedAgent("");
    }
  }, [agentOptions, selectedAgent]);

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return rows.filter((row) => {
      if (selectedAgent && String(row?.agentName || "") !== selectedAgent) return false;
      if (selectedCountry && String(row?.country || "") !== selectedCountry) return false;
      if (selectedLob && String(row?.lob || "") !== selectedLob) return false;
      if (!q) return true;
      return [
        row.agentName,
        row.sibsId,
        row.phase,
        row.lob,
        row.callCaseId,
        row.auditWeek,
        row.country,
        row.auditType,
      ]
        .filter(Boolean)
        .some((val) => String(val).toLowerCase().includes(q));
    });
  }, [rows, searchQuery, selectedAgent, selectedCountry, selectedLob]);

  const summary = useMemo(() => {
    let totalAudits = 0;
    let callAudits = 0;
    let caseAudits = 0;
    let scoreSum = 0;

    filteredRows.forEach((row) => {
      totalAudits += 1;
      scoreSum += normalizeQaScorePct(row?.totalAuditScore);
      const lobLower = String(row?.lob || "").toLowerCase();
      const typeLower = String(row?.auditType || "").toLowerCase();
      if (lobLower.includes("call") || typeLower.includes("call") || lobLower.includes("voice")) {
        callAudits += 1;
      } else if (
        lobLower.includes("case") ||
        lobLower.includes("email") ||
        typeLower.includes("case") ||
        typeLower.includes("email")
      ) {
        caseAudits += 1;
      }
    });

    const qaScorePct = totalAudits > 0 ? scoreSum / totalAudits : 0;
    const callSharePct = totalAudits > 0 ? (callAudits / totalAudits) * 100 : 0;
    const caseSharePct = totalAudits > 0 ? (caseAudits / totalAudits) * 100 : 0;

    return {
      totalAudits,
      callAudits,
      caseAudits,
      qaScorePct,
      callSharePct,
      caseSharePct,
    };
  }, [filteredRows]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * pageSize;
  const paginatedData = filteredRows.slice(startIdx, startIdx + pageSize);

  useEffect(() => {
    const el = tableContainerRef.current;
    if (!el || isLoading || reportView !== "report1") return;
    if (el.scrollHeight > el.clientHeight + 1 && pageSize > 5) {
      setPageSize((prev) => prev - 1);
    }
  }, [pageSize, safePage, isLoading, filteredRows.length, reportView]);

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

  const targetQaPct = Number(targets?.qaScorePct ?? 90);

  return (
    <div className="flex h-full min-h-0 flex-col gap-2.5">
      {/* Top Toolbar: Search + Country/LOB Filters + Report 1/2 Toggle + Date Range */}
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
              placeholder="Search agent, SiBS ID, call/case ID..."
              className="w-full rounded border border-slate-300 bg-white py-1 pl-8 pr-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#103B63] focus:outline-none"
            />
          </div>

          <select
            value={selectedAgent}
            onChange={(e) => {
              setSelectedAgent(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter by agent"
            className="max-w-[180px] rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 focus:border-[#103B63] focus:outline-none cursor-pointer"
          >
            <option value="">All Agents ({agentOptions.length})</option>
            {agentOptions.map((agent) => (
              <option key={agent} value={agent}>
                {agent}
              </option>
            ))}
          </select>

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
            value={selectedLob}
            onChange={(e) => {
              setSelectedLob(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter by LOB"
            className="rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 focus:border-[#103B63] focus:outline-none cursor-pointer"
          >
            <option value="">All LOB ({lobOptions.length})</option>
            {lobOptions.map((lob) => (
              <option key={lob} value={lob}>
                {lob}
              </option>
            ))}
          </select>

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

          {(selectedAgent || selectedCountry || selectedLob || searchQuery) ? (
            <button
              type="button"
              onClick={() => {
                setSelectedAgent("");
                setSelectedCountry("");
                setSelectedLob("");
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

      {/* 4 Live Summary Cards */}
      <div className="shrink-0 grid grid-cols-2 lg:grid-cols-4 gap-2">
        <div className="rounded border border-slate-200 bg-white px-3 py-2 shadow-2xs">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
            Total Audits
          </div>
          <div className="mt-0.5 text-lg font-black text-[#103B63] tabular-nums">
            {isLoading ? "--" : summary.totalAudits.toLocaleString()}
          </div>
        </div>

        <div className="rounded border border-slate-200 bg-white px-3 py-2 shadow-2xs">
          <div className="flex items-center justify-between gap-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
            <span>Call Audits</span>
            {!isLoading ? (
              <span className="text-[10px] font-bold text-[#0b3b68]">
                {summary.callSharePct.toFixed(1)}%
              </span>
            ) : null}
          </div>
          <div className="mt-0.5 text-lg font-black text-[#0b3b68] tabular-nums">
            {isLoading ? "--" : summary.callAudits.toLocaleString()}
          </div>
        </div>

        <div className="rounded border border-slate-200 bg-white px-3 py-2 shadow-2xs">
          <div className="flex items-center justify-between gap-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
            <span>Case Audits</span>
            {!isLoading ? (
              <span className="text-[10px] font-bold text-[#2f6f9f]">
                {summary.caseSharePct.toFixed(1)}%
              </span>
            ) : null}
          </div>
          <div className="mt-0.5 text-lg font-black text-[#2f6f9f] tabular-nums">
            {isLoading ? "--" : summary.caseAudits.toLocaleString()}
          </div>
        </div>

        <div className="rounded border border-slate-200 bg-white px-3 py-2 shadow-2xs">
          <div className="flex items-center justify-between gap-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
            <span>Avg QA Score</span>
            {!isLoading ? (
              <span
                className={`text-[10px] font-bold ${
                  summary.qaScorePct >= targetQaPct ? "text-emerald-700" : "text-amber-700"
                }`}
              >
                Target {targetQaPct}%
              </span>
            ) : null}
          </div>
          <div
            className={`mt-0.5 text-lg font-black tabular-nums ${
              isLoading
                ? "text-slate-400"
                : summary.qaScorePct >= targetQaPct
                ? "text-emerald-600"
                : "text-amber-600"
            }`}
          >
            {isLoading ? "--" : `${summary.qaScorePct.toFixed(2)}%`}
          </div>
        </div>
      </div>

      {reportView === "report2" ? (
        (() => {
          const qaMet = summary.qaScorePct >= targetQaPct;
          const qaVariance = summary.qaScorePct - targetQaPct;
          const scoreGap = Math.max(0, 100 - summary.qaScorePct);

          return (
            <div className="flex-1 min-h-0 flex flex-col gap-2.5 overflow-hidden">
              <div className="shrink-0 grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                <div className="rounded border border-slate-200 bg-white px-4 py-2.5 shadow-2xs flex flex-col justify-between gap-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <h3 className="m-0 text-[11px] font-black uppercase tracking-wider text-[#103B63]">
                      Quality Score &amp; Audit Mix
                    </h3>
                    <span className="text-[10.5px] font-semibold text-slate-400">
                      {activeItem?.label}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <ProgressRow
                      label="QA Score Achieved"
                      valueText={formatPercent(summary.qaScorePct)}
                      subtext={`Target ${targetQaPct}%`}
                      pct={summary.qaScorePct}
                      barColor={qaMet ? "bg-[#174f7f]" : "bg-amber-500"}
                    />
                    <ProgressRow
                      label="Quality Gap to 100%"
                      valueText={formatPercent(scoreGap)}
                      pct={scoreGap}
                      barColor="bg-slate-300"
                    />
                    <ProgressRow
                      label="Call Audits Share"
                      valueText={formatNumber(summary.callAudits)}
                      subtext={formatPercent(summary.callSharePct)}
                      pct={summary.callSharePct}
                      barColor="bg-[#0b3b68]"
                    />
                    <ProgressRow
                      label="Case Audits Share"
                      valueText={formatNumber(summary.caseAudits)}
                      subtext={formatPercent(summary.caseSharePct)}
                      pct={summary.caseSharePct}
                      barColor="bg-[#42719b]"
                    />
                  </div>
                </div>

                <div className="rounded border border-slate-200 bg-white px-4 py-2.5 shadow-2xs flex flex-col justify-between gap-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <h3 className="m-0 text-[11px] font-black uppercase tracking-wider text-[#103B63]">
                      Benchmark &amp; Target Comparison
                    </h3>
                    <span className="text-[10.5px] font-semibold text-slate-400">
                      Compliance Overview
                    </span>
                  </div>

                  <div className="grid flex-1 grid-cols-2 gap-2">
                    <div className="rounded bg-slate-50 px-2.5 py-2 border border-slate-100">
                      <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500">
                        QA Variance vs Target
                      </div>
                      <div className={`mt-0.5 text-sm font-black tabular-nums ${qaMet ? "text-emerald-700" : "text-amber-700"}`}>
                        {qaVariance >= 0 ? `+${qaVariance.toFixed(2)}%` : `${qaVariance.toFixed(2)}%`}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Actual {formatPercent(summary.qaScorePct)} vs {targetQaPct}%
                      </div>
                    </div>

                    <div className="rounded bg-slate-50 px-2.5 py-2 border border-slate-100">
                      <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500">
                        Compliance Status
                      </div>
                      <div className={`mt-0.5 text-sm font-black ${qaMet ? "text-emerald-700" : "text-amber-700"}`}>
                        {qaMet ? "Target Met" : "Below Target"}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Threshold {targetQaPct}%
                      </div>
                    </div>

                    <div className="rounded bg-slate-50 px-2.5 py-2 border border-slate-100">
                      <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500">
                        Total Audits
                      </div>
                      <div className="mt-0.5 text-sm font-black text-[#103B63] tabular-nums">
                        {formatNumber(summary.totalAudits)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Across {filteredRows.length} breakdown groups
                      </div>
                    </div>

                    <div className="rounded bg-slate-50 px-2.5 py-2 border border-slate-100">
                      <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500">
                        Gap to 100%
                      </div>
                      <div className="mt-0.5 text-sm font-black text-[#103B63] tabular-nums">
                        {formatPercent(scoreGap)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Remaining quality opportunity
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
                    Complete quality audit summary
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
                        <td className="px-3.5 py-1 font-semibold text-slate-700">Total Quality Audits</td>
                        <td className="px-3 py-1 text-right font-bold text-[#103B63] tabular-nums">{formatNumber(summary.totalAudits)}</td>
                        <td className="px-3 py-1 text-right text-slate-500 tabular-nums">100% of audits</td>
                        <td className="px-3.5 py-1 text-right text-slate-400">--</td>
                      </tr>
                      <tr>
                        <td className="px-3.5 py-1 font-semibold text-slate-700">Average QA Score %</td>
                        <td className="px-3 py-1 text-right font-bold text-[#103B63] tabular-nums">{formatPercent(summary.qaScorePct)}</td>
                        <td className="px-3 py-1 text-right text-slate-500 tabular-nums">Target {targetQaPct}%</td>
                        <td className="px-3.5 py-1 text-right">
                          <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold ${qaMet ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                            {qaMet ? "Target Met" : "Below Target"}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3.5 py-1 font-semibold text-slate-700">Call Audits</td>
                        <td className="px-3 py-1 text-right font-bold text-[#103B63] tabular-nums">{formatNumber(summary.callAudits)}</td>
                        <td className="px-3 py-1 text-right text-slate-500 tabular-nums">{formatPercent(summary.callSharePct)} of total</td>
                        <td className="px-3.5 py-1 text-right text-slate-400">--</td>
                      </tr>
                      <tr>
                        <td className="px-3.5 py-1 font-semibold text-slate-700">Case Audits</td>
                        <td className="px-3 py-1 text-right font-bold text-[#103B63] tabular-nums">{formatNumber(summary.caseAudits)}</td>
                        <td className="px-3 py-1 text-right text-slate-500 tabular-nums">{formatPercent(summary.caseSharePct)} of total</td>
                        <td className="px-3.5 py-1 text-right text-slate-400">--</td>
                      </tr>
                      <tr>
                        <td className="px-3.5 py-1 font-semibold text-slate-700">Variance vs Target</td>
                        <td className={`px-3 py-1 text-right font-bold tabular-nums ${qaMet ? "text-emerald-700" : "text-amber-700"}`}>
                          {qaVariance >= 0 ? `+${qaVariance.toFixed(2)}%` : `${qaVariance.toFixed(2)}%`}
                        </td>
                        <td className="px-3 py-1 text-right text-slate-500 tabular-nums">Gap to 100%: {formatPercent(scoreGap)}</td>
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
                      Audit Date
                    </th>
                    <th className="px-2.5 py-2 text-[10px] font-extrabold uppercase tracking-wider leading-tight text-white">
                      Agent Name
                    </th>
                    <th className="px-2.5 py-2 text-[10px] font-extrabold uppercase tracking-wider leading-tight text-white">
                      SiBS ID
                    </th>
                    <th className="px-2.5 py-2 text-[10px] font-extrabold uppercase tracking-wider leading-tight text-white">
                      Country
                    </th>
                    <th className="px-2.5 py-2 text-[10px] font-extrabold uppercase tracking-wider leading-tight text-white">
                      Phase
                    </th>
                    <th className="px-2.5 py-2 text-[10px] font-extrabold uppercase tracking-wider leading-tight text-white">
                      LOB
                    </th>
                    <th className="px-2.5 py-2 text-[10px] font-extrabold uppercase tracking-wider leading-tight text-white">
                      Call / Case ID
                    </th>
                    <th className="px-2.5 py-2 text-right text-[10px] font-extrabold uppercase tracking-wider leading-tight text-white">
                      Total Audit Score
                    </th>
                    <th className="px-2.5 py-2 text-center text-[10px] font-extrabold uppercase tracking-wider leading-tight text-white">
                      Audit Week
                    </th>
                    <th className="px-2.5 py-2 text-center text-[10px] font-extrabold uppercase tracking-wider leading-tight text-white">
                      Action
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
                                colIdx < 7 ? "w-20" : "mx-auto w-12"
                              }`}
                            />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : paginatedData.length > 0 ? (
                    paginatedData.map((row, idx) => {
                      const scorePct = normalizeQaScorePct(row.totalAuditScore);
                      const isMet = scorePct >= targetQaPct;

                      return (
                        <tr
                          key={`${row.id || row.callCaseId}-${idx}`}
                          className={`transition-colors hover:bg-sky-50/60 ${
                            idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"
                          }`}
                        >
                          <td className="whitespace-nowrap px-2.5 py-1.5 font-mono text-[11px] font-semibold text-slate-700">
                            {row.auditDate || "—"}
                          </td>
                          <td className="whitespace-nowrap px-2.5 py-1.5 font-bold text-slate-900 max-w-[170px] truncate" title={row.agentName || ""}>
                            {row.agentName || "—"}
                          </td>
                          <td className="whitespace-nowrap px-2.5 py-1.5 font-mono text-[11px] font-semibold text-slate-700">
                            {row.sibsId || "—"}
                          </td>
                          <td className="whitespace-nowrap px-2.5 py-1.5 font-semibold text-slate-800 max-w-[130px] truncate" title={row.country || ""}>
                            {row.country || "—"}
                          </td>
                          <td className="whitespace-nowrap px-2.5 py-1.5 font-semibold text-slate-700">
                            {row.phase || "—"}
                          </td>
                          <td className="whitespace-nowrap px-2.5 py-1.5">
                            <span className="inline-flex items-center rounded-md bg-sky-50 px-2 py-0.5 text-[11px] font-bold text-[#0b3b68] border border-sky-200/80 shadow-2xs">
                              {row.lob || "—"}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-2.5 py-1.5 font-mono text-[11px] font-semibold text-slate-800 max-w-[155px] truncate" title={row.callCaseId || ""}>
                            {row.callCaseId || "—"}
                          </td>
                          <td className="whitespace-nowrap px-2.5 py-1.5 text-right tabular-nums">
                            <span className={`font-extrabold ${isMet ? "text-emerald-600" : "text-amber-600"}`}>
                              {formatPercent(scorePct)}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-2.5 py-1.5 text-center font-semibold text-slate-700">
                            {row.auditWeek && row.auditWeek !== "—" ? row.auditWeek : activeItem?.label || "—"}
                          </td>
                          <td className="whitespace-nowrap px-2.5 py-1.5 text-center">
                            <button
                              type="button"
                              onClick={() => setViewingAudit(row)}
                              className="inline-flex items-center gap-1 rounded bg-[#103B63] px-2.5 py-0.5 text-[11px] font-bold text-white transition-colors hover:bg-[#174f7f] cursor-pointer"
                            >
                              <Eye size={11} />
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={10} className="px-4 py-12 text-center text-xs font-semibold text-slate-500">
                        No quality audit records found for {activeItem?.label || "this period"}.
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

      {/* Audit Record Detail Modal when clicking View */}
      {viewingAudit ? (
        <QaAuditDetailModal
          audit={viewingAudit}
          periodLabel={activeItem?.label}
          targetQaPct={targetQaPct}
          onClose={() => setViewingAudit(null)}
        />
      ) : null}
    </div>
  );
}
