import React, { useEffect, useMemo, useState } from "react";
import {
  Activity, AlertCircle, ArrowRight, Award, BarChart3, CalendarDays,
  CheckCircle2, ChevronDown, ChevronRight, ClipboardList, Clock3,
  Download, Eye, FileSpreadsheet, FileText, FilterX, Info, LockKeyhole,
  PhoneCall, Printer, Search, ShieldCheck, TrendingDown, TrendingUp, Users, X,
} from "lucide-react";

/**
 * FrontSteps Reports & Analytics — FRONTEND WIREFRAME ONLY.
 * All numbers, employee names, validation labels and report references below
 * are illustrative. No API, authorization, reporting or KPI calculations.
 * WFM / Operations must confirm actual datasets, reporting intervals,
 * formulas, KPIs and client-reporting permissions before production use.
 */
const NAVY = "#042c51";
const ORANGE = "#ff5c28";

const MONTHS = [
  { value: "2026-10", label: "October 2026", factor: 1 },
  { value: "2026-09", label: "September 2026", factor: 0.94 },
  { value: "2026-08", label: "August 2026", factor: 1.06 },
];

const PERIOD_OPTIONS = [
  { value: "mtd", label: "MTD (Month-to-Date)" },
  { value: "monthly", label: "Monthly Full" },
  { value: "historical", label: "Historical (Multi-Quarter)" },
];

const DATE_INTERVAL_OPTIONS = [
  { value: "all", label: "Entire Month (Full Range)" },
  { value: "w1", label: "Week 1 (Oct 1 - Oct 7)" },
  { value: "w2", label: "Week 2 (Oct 8 - Oct 14)" },
  { value: "w3", label: "Week 3 (Oct 15 - Oct 21)" },
  { value: "w4", label: "Week 4 (Oct 22 - Oct 31)" },
];

const TEAM_OPTIONS = [
  { value: "ALL", label: "All Teams & Shifts" },
  { value: "Team Alpha", label: "Team Alpha (Sarah Gomez - Day)" },
  { value: "Team Bravo", label: "Team Bravo (Mark Ramos - Mid)" },
  { value: "Team Charlie", label: "Team Charlie (Alexandria Chua - Night)" },
];

const INTERVAL_BASE = [
  { label: "08:00–10:00", offered: 142, answered: 138, received: 98, closed: 92, aht: 840, quality: "Validated" },
  { label: "10:00–12:00", offered: 198, answered: 191, received: 145, closed: 136, aht: 885, quality: "Validated" },
  { label: "12:00–14:00", offered: 165, answered: 158, received: 120, closed: 114, aht: 820, quality: "Corrected" },
  { label: "14:00–16:00", offered: 215, answered: 202, received: 168, closed: 150, aht: 915, quality: "Unvalidated" },
  { label: "16:00–18:00", offered: 180, answered: 174, received: 134, closed: 129, aht: 860, quality: "Validated" },
  { label: "18:00–20:00", offered: 110, answered: 107, received: 76, closed: 74, aht: 790, quality: "Incomplete" },
];

const CASE_AGING = [
  { label: "Under 4 hours", count: 342 },
  { label: "4–8 hours", count: 210 },
  { label: "8–24 hours", count: 112 },
  { label: "Over 24 hours", count: 42 },
];

const ACCOUNT_TRENDS = {
  mtd: [
    { label: "Week 1", volume: 1640, compliance: 81 },
    { label: "Week 2", volume: 1720, compliance: 84 },
    { label: "Week 3", volume: 1690, compliance: 82 },
    { label: "Week 4*", volume: 1750, compliance: 86 },
  ],
  monthly: [
    { label: "Jun", volume: 6600, compliance: 80 },
    { label: "Jul", volume: 6810, compliance: 82 },
    { label: "Aug", volume: 7040, compliance: 85 },
    { label: "Sep", volume: 6900, compliance: 83 },
    { label: "Oct*", volume: 6750, compliance: 84 },
  ],
  historical: [
    { label: "Q4 '25", volume: 19800, compliance: 79 },
    { label: "Q1 '26", volume: 20400, compliance: 82 },
    { label: "Q2 '26", volume: 21100, compliance: 85 },
    { label: "Q3 '26", volume: 20900, compliance: 84 },
  ],
};

const EMPLOYEES = [
  { id: "FS-1001", name: "Dwight Anthony Buma-at", supervisor: "Supervisor A", team: "Team Alpha", score: 96.4, cases: 154, aht: 780, compliance: 91.2, quality: "Validated" },
  { id: "FS-1002", name: "Janine Marie Dela Cruz", supervisor: "Supervisor B", team: "Team Bravo", score: 92.8, cases: 142, aht: 810, compliance: 88.5, quality: "Validated" },
  { id: "FS-1003", name: "Carlos Miguel Mendoza", supervisor: "Supervisor A", team: "Team Alpha", score: 88.5, cases: 138, aht: 845, compliance: 84, quality: "Validated" },
  { id: "FS-1004", name: "Alyssa Nicole Bautista", supervisor: "Supervisor B", team: "Team Bravo", score: 81.6, cases: 118, aht: 890, compliance: 76.5, quality: "Validated" },
  { id: "FS-1005", name: "Rafael Dominic Castro", supervisor: "Supervisor A", team: "Team Alpha", score: 94.2, cases: 146, aht: 800, compliance: 89, quality: "Validated" },
  { id: "FS-1006", name: "Patricia Nicole Reyes", supervisor: "Supervisor C", team: "Team Charlie", score: 97.5, cases: 162, aht: 740, compliance: 94.5, quality: "Validated" },
  { id: "FS-1007", name: "Gabriel Joshua Tan", supervisor: "Supervisor C", team: "Team Charlie", score: 79.3, cases: 112, aht: 1110, compliance: 68, quality: "Validated" },
  { id: "FS-1008", name: "Bea Clarisse Santos", supervisor: "Supervisor B", team: "Team Bravo", score: 86.9, cases: 135, aht: 860, compliance: 82, quality: "Validated" },
  { id: "FS-1009", name: "Lance Christian Lim", supervisor: "Supervisor A", team: "Team Alpha", score: null, cases: null, aht: null, compliance: null, quality: "Incomplete" },
  { id: "FS-1010", name: "Kaye Andrea Villanueva", supervisor: "Supervisor C", team: "Team Charlie", score: null, cases: null, aht: null, compliance: null, quality: "Unvalidated" },
  { id: "FS-1011", name: "Mark Anthony Rivera", supervisor: "Supervisor A", team: "Team Alpha", score: 93.1, cases: 145, aht: 795, compliance: 87.5, quality: "Corrected" },
  { id: "FS-1012", name: "Chloe Danielle Ocampo", supervisor: "Supervisor B", team: "Team Bravo", score: 89.4, cases: 139, aht: 830, compliance: 85, quality: "Validated" },
];

const TEAM_BENCHMARKS = [
  { team: "Team Alpha", supervisor: "Sarah Gomez", avgScore: 93.05, cases: 583, ahtCompliance: 88.4, members: 4, deltaVsPrior: "+2.3%" },
  { team: "Team Bravo", supervisor: "Mark Ramos", avgScore: 87.68, cases: 534, ahtCompliance: 83.0, members: 4, deltaVsPrior: "+1.1%" },
  { team: "Team Charlie", supervisor: "Alexandria Chua", avgScore: 91.43, cases: 563, ahtCompliance: 86.3, members: 4, deltaVsPrior: "-0.8%" },
];

const ACCOUNT_COMPARISON_TABLE = [
  { kpi: "Cases Closed (Weekly Avg)", target: "140 / agent", actual: "143.2", priorPeriod: "138.5", delta: "+3.4%", status: "Met" },
  { kpi: "AHT (Average Handle Time)", target: "< 900 sec (15m)", actual: "824 sec", priorPeriod: "852 sec", delta: "-3.3% (Faster)", status: "Met" },
  { kpi: "AHT Compliance (&ge; 80%)", target: "80.0%", actual: "84.2%", priorPeriod: "82.1%", delta: "+2.1%", status: "Met" },
  { kpi: "Calls Answer Rate", target: "&ge; 95.0%", actual: "96.4%", priorPeriod: "95.8%", delta: "+0.6%", status: "Met" },
  { kpi: "Resolution Code Completion", target: "100.0%", actual: "99.1%", priorPeriod: "98.7%", delta: "+0.4%", status: "Near Target" },
  { kpi: "Case Summary Completion", target: "&ge; 95.0%", actual: "96.8%", priorPeriod: "94.9%", delta: "+1.9%", status: "Met" },
];

const COACHING = {
  types: [{ label: "Scheduled", value: 11 }, { label: "Unscheduled", value: 7 }],
  outcomes: [
    { label: "Improved", value: 7 },
    { label: "Partial improvement", value: 5 },
    { label: "Awaiting follow-up", value: 4 },
    { label: "Management review", value: 2 },
  ],
  pips: [{ label: "Pending review", value: 1 }, { label: "Active", value: 2 }, { label: "Closed", value: 2 }],
};

const INCENTIVES = {
  quarter: "Q3 2026 (July–September)",
  statuses: [
    { label: "Potentially qualified", value: 8 },
    { label: "Pending validation", value: 1 },
    { label: "Not qualified", value: 3 },
  ],
  approvals: [
    { label: "Approved qualification", value: 6 },
    { label: "Pending decision", value: 2 },
    { label: "Not submitted", value: 4 },
  ],
  months: [{ label: "July", value: 10 }, { label: "August", value: 9 }, { label: "September", value: 8 }],
};

const AGENT_KPIS = [
  { label: "Cases Closed", target: "140 per week (eligible proration)", weight: "45%" },
  { label: "AHT", target: "15 minutes or less", weight: "10%" },
  { label: "AHT Compliance", target: "At least 80% of answered calls within 15 minutes", weight: "15%" },
  { label: "Resolution Completion", target: "100%", weight: "10%" },
  { label: "Resolution Sub Code Completion", target: "At least 95%", weight: "10%" },
  { label: "Case Summary Completion", target: "At least 95%", weight: "10%" },
];

const TABS = [
  { id: "operational", label: "Interval Reports", icon: PhoneCall, client: true },
  { id: "account", label: "Account KPIs & Benchmarks", icon: TrendingUp, client: true },
  { id: "team", label: "Team & Individual Performance", icon: Users, client: false },
  { id: "coaching", label: "Coaching & PIP Reports", icon: ClipboardList, client: false },
  { id: "incentives", label: "Quarterly Incentives", icon: Award, client: false },
];

const number = (value) => new Intl.NumberFormat("en-US").format(value);
const percent = (numerator, denominator) => denominator ? `${((numerator / denominator) * 100).toFixed(1)}%` : "—";
const rating = (score) => score == null ? "Awaiting validation" : score >= 95 ? "Exceptional" : score >= 90 ? "Very Satisfactory" : score >= 85 ? "Satisfactory" : "Unsatisfactory";
const tw = (...parts) => parts.filter(Boolean).join(" ");

function Pill({ children, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-100 text-slate-600 border-slate-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-800 border-amber-200",
    red: "bg-rose-50 text-rose-700 border-rose-200",
  };
  return <span className={tw("inline-flex items-center whitespace-nowrap rounded-md border px-2 py-0.5 text-[11px] font-semibold", tones[tone])}>{children}</span>;
}

function QualityPill({ value }) {
  const tone = value === "Validated" ? "green" : value === "Corrected" ? "blue" : value === "Incomplete" || value === "Missing" ? "red" : "amber";
  return <Pill tone={tone}>{value}</Pill>;
}

function SectionCard({ title, subtitle, action, children, className = "" }) {
  return (
    <section className={tw("min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs", className)}>
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slate-800">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function SummaryCard({ title, value, detail, delta, isPositive = true, icon: Icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-w-0 items-center justify-between gap-2 rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 text-left shadow-2xs transition-all hover:border-[#ff5c28]/40 hover:shadow-xs cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff5c28]"
    >
      <div className="min-w-0">
        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">
          {title}
        </span>
        <div className="flex items-baseline gap-2 mt-0.5">
          <span className="text-lg font-extrabold text-slate-800 leading-tight">
            {value}
          </span>
          {delta && (
            <span
              className={tw(
                "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold font-mono",
                isPositive
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-rose-50 text-rose-700 border border-rose-200"
              )}
            >
              {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              {delta}
            </span>
          )}
        </div>
        <span className="block text-[10px] text-slate-400 mt-0.5 truncate">
          {detail}
        </span>
      </div>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-[#042c51] border border-slate-200/60">
        <Icon size={15} />
      </div>
    </button>
  );
}

function BreakdownBars({ items, maxValue, formatValue = number, onSelect, tint = "navy" }) {
  const max = maxValue || Math.max(1, ...items.map((item) => item.value || 0));
  return (
    <div className="space-y-2.5 pt-1">
      {items.map((item, index) => {
        const pct = Math.min(100, Math.max(0, (item.value / max) * 100));
        const isOrange = tint === "orange";
        const barGradient = isOrange
          ? "bg-gradient-to-r from-[#ff5c28] via-[#ff7849] to-[#ff916b]"
          : "bg-gradient-to-r from-[#042c51] via-[#094175] to-[#125899]";
        const badgeColor = isOrange
          ? "bg-orange-50/90 text-[#d84d20] border border-orange-200/90 shadow-2xs"
          : "bg-slate-50/90 text-[#042c51] border border-slate-200/90 shadow-2xs";

        const inner = (
          <div className="group/bar p-2 rounded-xl border border-transparent transition-all duration-200 hover:border-slate-200 hover:bg-slate-50/70 hover:shadow-2xs">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-700 group-hover/bar:text-[#042c51] transition-colors">
                {item.label}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-medium text-slate-400 group-hover/bar:text-slate-600 transition-colors">
                  {pct.toFixed(0)}%
                </span>
                <span className={tw("px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold tracking-tight", badgeColor)}>
                  {formatValue(item.value)}
                </span>
              </div>
            </div>
            <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100/90 shadow-inner p-[1px]">
              <div
                className={tw("h-full rounded-full transition-all duration-500 ease-out shadow-xs", barGradient)}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );

        return onSelect ? (
          <button
            key={`${item.label}-${index}`}
            type="button"
            className="block w-full text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-[#ff5c28] rounded-xl"
            onClick={() => onSelect(item)}
          >
            {inner}
          </button>
        ) : (
          <div key={`${item.label}-${index}`}>{inner}</div>
        );
      })}
    </div>
  );
}

function CompareBars({ items, first, second, firstLabel, secondLabel, firstColor = "from-[#042c51] via-[#083a6b] to-[#0d4d8c]", secondColor = "from-[#ff5c28] via-[#ff703d] to-[#ff8c60]", onSelect }) {
  const max = Math.max(1, ...items.map((item) => Math.max(item[first] || 0, item[second] || 0)));
  const yAxisTicks = [100, 75, 50, 25, 0];

  return (
    <div className="pt-2">
      <div className="mb-4 flex items-center justify-between text-xs border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-[#042c51] shadow-2xs" />
            <span className="font-semibold text-slate-700">{firstLabel}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-[#ff5c28] shadow-2xs" />
            <span className="font-semibold text-slate-700">{secondLabel}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-md bg-slate-50 border border-slate-200/80 px-2 py-0.5 text-[10px] font-mono font-medium text-slate-500">
            Ceiling: {Math.round(max * 1.05)}
          </span>
        </div>
      </div>

      <div className="relative h-56 w-full pt-4 pb-2">
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-7">
          {yAxisTicks.map((tick) => (
            <div key={tick} className="w-full flex items-center gap-2">
              <span className="text-[9.5px] font-mono text-slate-400 w-7 text-right select-none font-medium">
                {Math.round((max * tick) / 100)}
              </span>
              <div className="flex-1 border-b border-dashed border-slate-200/70" />
            </div>
          ))}
        </div>

        <div className="relative ml-9 flex h-full items-end gap-2.5 sm:gap-4 pb-7">
          {items.map((item, idx) => {
            const firstHeight = Math.max(3, (item[first] / max) * 100);
            const secondHeight = Math.max(3, (item[second] / max) * 100);

            return (
              <button
                key={item.label || idx}
                type="button"
                onClick={() => onSelect?.(item)}
                className="group relative flex h-full min-w-0 flex-1 flex-col justify-end items-center cursor-pointer outline-none transition-transform hover:-translate-y-0.5 duration-200"
              >
                <div className="absolute -top-11 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-30 flex flex-col items-center shadow-xl bg-slate-900/95 backdrop-blur-xs text-white rounded-lg px-2.5 py-1.5 text-[10.5px] whitespace-nowrap border border-slate-800">
                  <span className="font-bold tracking-tight text-white">{item.label}</span>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                    <span className="text-slate-300">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-sky-400 mr-1" />
                      {firstLabel}: <strong className="text-white">{item[first]}</strong>
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-300">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-orange-400 mr-1" />
                      {secondLabel}: <strong className="text-white">{item[second]}</strong>
                    </span>
                  </div>
                  <div className="w-1.5 h-1.5 bg-slate-900/95 rotate-45 -mb-1 mt-0.5 border-r border-b border-slate-800" />
                </div>

                <div className="flex items-end justify-center gap-1.5 w-full max-w-[44px] h-full">
                  <div
                    style={{ height: `${firstHeight}%` }}
                    className={tw(
                      "w-1/2 rounded-t-md bg-gradient-to-t transition-all duration-300 group-hover:brightness-110 shadow-xs ring-1 ring-black/5",
                      firstColor
                    )}
                  />
                  <div
                    style={{ height: `${secondHeight}%` }}
                    className={tw(
                      "w-1/2 rounded-t-md bg-gradient-to-t transition-all duration-300 group-hover:brightness-110 shadow-xs ring-1 ring-black/5",
                      secondColor
                    )}
                  />
                </div>

                <span className="truncate text-center text-[10px] font-mono font-medium text-slate-500 mt-2.5 group-hover:font-bold group-hover:text-[#042c51] transition-all">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="flex min-w-[130px] flex-col gap-1 text-xs font-semibold text-slate-600">
      <span>{label}</span>
      <select
        className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-800 outline-none focus:border-[#ff5c28] focus:ring-2 focus:ring-orange-100 cursor-pointer"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function DataTable({ columns, rows, empty = "No records match the selected filters." }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full min-w-[680px] border-collapse text-left text-xs">
        <thead className="bg-[#042c51] text-white">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="px-3 py-2.5 font-semibold">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length ? (
            rows.map((row, index) => (
              <tr key={row.key || index} className="hover:bg-slate-50 transition-colors">
                {columns.map((column) => (
                  <td key={column.key} className="px-3 py-2.5 align-middle text-slate-700">
                    {column.render ? column.render(row) : row[column.key] ?? "—"}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500">
                {empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function DetailModal({ data, onClose }) {
  useEffect(() => {
    if (!data) return undefined;
    const listener = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, [data, onClose]);

  if (!data) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-3 sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={data.title}
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between gap-3 bg-[#042c51] px-5 py-4 text-white">
          <div className="min-w-0">
            <h2 className="text-base font-bold">{data.title}</h2>
            <p className="mt-1 text-xs text-slate-300">
              {data.subtitle || "FrontSteps — sample report detail"}
            </p>
          </div>
          <button
            type="button"
            autoFocus
            onClick={onClose}
            className="rounded-lg border border-white/30 px-3 py-1.5 text-xs font-semibold hover:bg-white/10 cursor-pointer"
          >
            Close
          </button>
        </header>
        <div className="space-y-4 overflow-y-auto p-5">
          <div className="flex flex-wrap gap-2">
            <Pill tone="blue">Report Drill-down</Pill>
            {data.quality && <QualityPill value={data.quality} />}
          </div>
          {data.description && (
            <p className="text-sm leading-6 text-slate-700">{data.description}</p>
          )}
          {data.rows?.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-slate-200">
              {data.rows.map((row, index) => (
                <div
                  key={index}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-3 py-2.5 text-xs last:border-b-0"
                >
                  <span className="font-medium text-slate-600">{row.label}</span>
                  <span className="font-semibold text-slate-900">{row.value}</span>
                </div>
              ))}
            </div>
          )}
          {data.note && (
            <p className="rounded-lg bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-900">
              {data.note}
            </p>
          )}
        </div>
        <footer className="border-t border-slate-100 bg-slate-50 px-5 py-3 text-right">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[#042c51] px-4 py-2 text-xs font-semibold text-white hover:bg-[#083f72] cursor-pointer"
          >
            Close
          </button>
        </footer>
      </section>
    </div>
  );
}

export default function FrontStepsReportsAnalytics() {
  const [view, setView] = useState("internal"); // "internal" | "client"
  const [tab, setTab] = useState("operational");
  const [period, setPeriod] = useState("2026-10");
  const [dateInterval, setDateInterval] = useState("all");
  const [range, setRange] = useState("mtd");
  const [team, setTeam] = useState("ALL");
  const [supervisor, setSupervisor] = useState("ALL");
  const [quality, setQuality] = useState("ALL");
  const [search, setSearch] = useState("");
  const [showIntervalTable, setShowIntervalTable] = useState(false);
  const [detail, setDetail] = useState(null);
  const [exportNotice, setExportNotice] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);

  const client = view === "client";
  const month = MONTHS.find((item) => item.value === period) || MONTHS[0];

  const openDetail = (title, rows, description = "", options = {}) =>
    setDetail({
      title,
      rows,
      description,
      subtitle: `${month.label} · ${client ? "Client preview" : "Internal preview"}`,
      ...options,
    });

  const reset = () => {
    setPeriod("2026-10");
    setDateInterval("all");
    setRange("mtd");
    setTeam("ALL");
    setSupervisor("ALL");
    setQuality("ALL");
    setSearch("");
  };

  const switchView = (next) => {
    setView(next);
    setDetail(null);
    if (next === "client" && !TABS.find((item) => item.id === tab)?.client) {
      setTab("operational");
    }
  };

  const handleExport = (format) => {
    setShowExportMenu(false);
    const scope = client ? "Client_Sanitized" : "Internal_Management";
    const filename = `FrontSteps_${tab.toUpperCase()}_Report_${month.value}_${scope}.${format.toLowerCase()}`;
    setExportNotice(`Export Generated: ${filename} downloaded successfully.`);
    setTimeout(() => setExportNotice(""), 4500);
  };

  // Mock interval adjustments
  const intervals = useMemo(() => {
    return INTERVAL_BASE.map((item) => ({
      ...item,
      offered: Math.round(item.offered * month.factor),
      answered: Math.round(item.answered * month.factor),
      received: Math.round(item.received * month.factor),
      closed: Math.round(item.closed * month.factor),
    }));
  }, [month.factor]);

  const totals = useMemo(() => {
    return intervals.reduce(
      (result, item) => ({
        offered: result.offered + item.offered,
        answered: result.answered + item.answered,
        received: result.received + item.received,
        closed: result.closed + item.closed,
      }),
      { offered: 0, answered: 0, received: 0, closed: 0 }
    );
  }, [intervals]);

  // Filtered employees
  const employees = useMemo(() => {
    return EMPLOYEES.filter((employee) => {
      // In client view, unvalidated records are sanitized
      if (client && employee.quality !== "Validated") return false;
      const matchTeam = team === "ALL" || employee.team === team;
      const matchSupervisor = supervisor === "ALL" || employee.supervisor === supervisor;
      const matchQuality = quality === "ALL" || employee.quality === quality;
      const matchSearch = `${employee.name} ${employee.id}`
        .toLowerCase()
        .includes(search.trim().toLowerCase());
      return matchTeam && matchSupervisor && matchQuality && matchSearch;
    });
  }, [client, team, supervisor, quality, search]);

  const rated = employees.filter(
    (employee) => employee.score !== null && employee.quality === "Validated"
  );
  const averageScore = rated.length
    ? rated.reduce((sum, employee) => sum + employee.score, 0) / rated.length
    : null;
  const pendingCount = EMPLOYEES.filter((employee) => employee.quality !== "Validated").length;

  const trendData = ACCOUNT_TRENDS[range].map((entry) => ({
    ...entry,
    volume: Math.round(entry.volume * month.factor),
  }));

  const filteredIntervals =
    quality === "ALL" ? intervals : intervals.filter((item) => item.quality === quality);

  const tabs = TABS.filter((item) => !client || item.client);

  // Summary indicators with period-over-period deltas (Req #7)
  const summary = client
    ? [
        {
          title: "Calls Offered",
          value: number(totals.offered),
          delta: "+4.1%",
          isPositive: true,
          detail: "vs. prior month",
          icon: PhoneCall,
          rows: [
            { label: "Calls answered", value: number(totals.answered) },
            { label: "Calls offered", value: number(totals.offered) },
          ],
        },
        {
          title: "Calls Answer Rate",
          value: percent(totals.answered, totals.offered),
          delta: "+0.6%",
          isPositive: true,
          detail: "Target: 95.0%",
          icon: Activity,
          rows: [
            { label: "Answered", value: number(totals.answered) },
            { label: "Offered", value: number(totals.offered) },
          ],
        },
        {
          title: "Cases Received",
          value: number(totals.received),
          delta: "+2.8%",
          isPositive: true,
          detail: "Sample interval total",
          icon: FileText,
          rows: [{ label: "Cases received", value: number(totals.received) }],
        },
        {
          title: "Cases Closed",
          value: number(totals.closed),
          delta: "+3.4%",
          isPositive: true,
          detail: "Sample interval total",
          icon: CheckCircle2,
          rows: [{ label: "Cases closed", value: number(totals.closed) }],
        },
      ]
    : [
        {
          title: "Cases Closed",
          value: number(totals.closed),
          delta: "+3.4%",
          isPositive: true,
          detail: "vs. prior month",
          icon: CheckCircle2,
          rows: [
            { label: "Cases closed", value: number(totals.closed) },
            { label: "Cases received", value: number(totals.received) },
          ],
        },
        {
          title: "Avg Validated KPI",
          value: averageScore == null ? "—" : `${averageScore.toFixed(1)}%`,
          delta: "+1.8%",
          isPositive: true,
          detail: `${rated.length} validated agents`,
          icon: TrendingUp,
          rows: [
            { label: "Included validated records", value: rated.length },
            {
              label: "Illustrative mean score",
              value: averageScore == null ? "Unavailable" : averageScore.toFixed(1),
            },
          ],
        },
        {
          title: "Calls Answer Rate",
          value: percent(totals.answered, totals.offered),
          delta: "+0.6%",
          isPositive: true,
          detail: "Benchmark: &ge; 95%",
          icon: PhoneCall,
          rows: [
            { label: "Answered", value: number(totals.answered) },
            { label: "Offered", value: number(totals.offered) },
          ],
        },
        {
          title: "Data Quality Flagged",
          value: pendingCount,
          delta: "-2 items",
          isPositive: true,
          detail: "Requires review/audit",
          icon: AlertCircle,
          rows: [
            { label: "Employee records needing review", value: pendingCount },
            { label: "Selected quality filter", value: quality === "ALL" ? "All" : quality },
          ],
        },
      ];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-8 pr-1 text-slate-900 font-jakarta sibs-scrollbar">
      {/* Toast Notification for Export Actions */}
      {exportNotice && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-900 shadow-sm shrink-0 animate-fade-in"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{exportNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setExportNotice("")}
            className="text-emerald-700 hover:text-emerald-900 text-xs cursor-pointer font-bold"
          >
            &times;
          </button>
        </div>
      )}

      {/* Client-Facing Safeguard Notice Banner (Req #16) */}
      {client && (
        <div className="flex items-center justify-between gap-3 px-4 py-2 rounded-xl bg-blue-50/90 border border-blue-200/90 text-blue-900 shadow-2xs shrink-0">
          <div className="flex items-center gap-2 text-xs">
            <LockKeyhole size={14} className="text-blue-700 shrink-0" />
            <span className="font-semibold">
              Client Preview View Active — Only authorized operational summaries are displayed. Internal coaching, PIP referrals, and unvalidated draft records are strictly sanitized.
            </span>
          </div>
          <Pill tone="blue">Client Authorized</Pill>
        </div>
      )}

      {/* 1. Summary Indicator Cards (with Trend Deltas) */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 shrink-0">
        {summary.map((card) => (
          <SummaryCard
            key={card.title}
            {...card}
            onClick={() => openDetail(card.title, card.rows, card.detail)}
          />
        ))}
      </div>

      {/* 2. Comprehensive Filter & Report Generation Bar (Clean & Organized 2-Tier Layout) */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-xs shrink-0 flex flex-col gap-2.5">
        {/* Tier 1: Primary Controls & Global Context */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-3">
            {/* Reporting Audience Toggle (Internal vs Client) */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">View:</span>
              <div
                className="inline-flex h-8 rounded-lg bg-slate-100 p-0.5 border border-slate-200"
                role="group"
                aria-label="Reporting view"
              >
                <button
                  type="button"
                  aria-pressed={!client}
                  onClick={() => switchView("internal")}
                  className={tw(
                    "rounded-md px-3 py-1 text-xs font-semibold transition cursor-pointer",
                    !client
                      ? "bg-[#042c51] text-white shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  Internal Management
                </button>
                <button
                  type="button"
                  aria-pressed={client}
                  onClick={() => switchView("client")}
                  className={tw(
                    "flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition cursor-pointer",
                    client
                      ? "bg-[#042c51] text-white shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  <LockKeyhole size={11} />
                  Client Preview
                </button>
              </div>
            </div>

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            {/* Reporting Month */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Month:</span>
              <select
                className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-[#ff5c28] focus:ring-1 focus:ring-orange-100 cursor-pointer shadow-2xs"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            {/* Trend Graph Range */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Interval:</span>
              <select
                className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-[#ff5c28] focus:ring-1 focus:ring-orange-100 cursor-pointer shadow-2xs"
                value={range}
                onChange={(e) => setRange(e.target.value)}
              >
                {PERIOD_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Center: Report Preview & Export Center */}
          <div className="flex items-center gap-2">
            {/* 1. Preview Report Modal Button */}
            <button
              type="button"
              onClick={() =>
                setDetail({
                  title: "Generated Report Summary",
                  subtitle: `${month.label} · ${client ? "Client Sanitized View" : "Internal Management"}`,
                  description:
                    "Consolidated report criteria generated from your active selections. All underlying figures match current validation checks.",
                  rows: [
                    { label: "Account", value: "FrontSteps Customer Support" },
                    { label: "Reporting Period", value: month.label },
                    {
                      label: "Date Interval Filter",
                      value: DATE_INTERVAL_OPTIONS.find((d) => d.value === dateInterval)?.label,
                    },
                    {
                      label: "Active Report Tab",
                      value: TABS.find((item) => item.id === tab)?.label,
                    },
                    {
                      label: "Team / Shift Scope",
                      value: client ? "FrontSteps Account Total" : team,
                    },
                    {
                      label: "Audience Security",
                      value: client
                        ? "Client Preview (Sanitized — zero internal PII)"
                        : "Internal Management (Full Audit Access)",
                    },
                    {
                      label: "Data Quality Benchmark",
                      value: `${rated.length} Validated Agent Records`,
                    },
                  ],
                  note: "Report snapshot is ready for export. You may download it in Excel, CSV, or PDF format below.",
                })
              }
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs transition-colors"
            >
              <Eye size={13} className="text-[#042c51]" />
              Preview Report
            </button>

            {/* 2. Export Dropdown Menu (Excel, CSV, PDF) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#042c51] px-3.5 text-xs font-bold text-white hover:bg-[#073966] transition-colors cursor-pointer shadow-2xs"
              >
                <Download size={13} />
                <span>Export Report</span>
                <ChevronDown size={12} className={showExportMenu ? "rotate-180" : ""} />
              </button>

              {showExportMenu && (
                <div className="absolute right-0 top-9.5 z-30 w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Export Formats
                  </div>
                  <button
                    type="button"
                    onClick={() => handleExport("XLSX")}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors cursor-pointer text-left"
                  >
                    <FileSpreadsheet size={15} className="text-emerald-600" />
                    <div>
                      <span className="block font-bold">Excel (.xlsx)</span>
                      <span className="text-[10px] text-slate-400">Formatted multi-tab sheet</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExport("CSV")}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-800 transition-colors cursor-pointer text-left"
                  >
                    <FileText size={15} className="text-blue-600" />
                    <div>
                      <span className="block font-bold">CSV (.csv)</span>
                      <span className="text-[10px] text-slate-400">Raw operational dataset</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExport("PDF")}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-rose-50 hover:text-rose-800 transition-colors cursor-pointer text-left"
                  >
                    <Printer size={15} className="text-rose-600" />
                    <div>
                      <span className="block font-bold">PDF Document (.pdf)</span>
                      <span className="text-[10px] text-slate-400">Printable management summary</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tier 2: Refined Filters (Date Interval, Team, Supervisor, Quality, Reset) */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-0.5">
          <div className="flex flex-wrap items-center gap-2">
            {/* Date Range / Interval Picker */}
            <div className="w-[180px]">
              <select
                className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 outline-none focus:border-[#ff5c28] focus:ring-1 focus:ring-orange-100 cursor-pointer shadow-2xs"
                value={dateInterval}
                onChange={(e) => setDateInterval(e.target.value)}
                title="Date Range Interval"
              >
                {DATE_INTERVAL_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Team / Shift Filter */}
            {!client && (
              <div className="w-[185px]">
                <select
                  className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 outline-none focus:border-[#ff5c28] focus:ring-1 focus:ring-orange-100 cursor-pointer shadow-2xs"
                  value={team}
                  onChange={(e) => setTeam(e.target.value)}
                  title="Team & Shift"
                >
                  {TEAM_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Supervisor Filter */}
            {!client && (
              <div className="w-[160px]">
                <select
                  className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 outline-none focus:border-[#ff5c28] focus:ring-1 focus:ring-orange-100 cursor-pointer shadow-2xs"
                  value={supervisor}
                  onChange={(e) => setSupervisor(e.target.value)}
                  title="Supervisor"
                >
                  <option value="ALL">All Supervisors</option>
                  <option value="Supervisor A">Supervisor A (Sarah)</option>
                  <option value="Supervisor B">Supervisor B (Mark)</option>
                  <option value="Supervisor C">Supervisor C (Alexandria)</option>
                </select>
              </div>
            )}

            {/* Data Quality Filter */}
            {!client && (
              <div className="w-[145px]">
                <select
                  className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 outline-none focus:border-[#ff5c28] focus:ring-1 focus:ring-orange-100 cursor-pointer shadow-2xs"
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                  title="Data Quality"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Validated">Validated</option>
                  <option value="Corrected">Corrected</option>
                  <option value="Unvalidated">Unvalidated</option>
                  <option value="Incomplete">Incomplete</option>
                  <option value="Missing">Missing</option>
                </select>
              </div>
            )}

            {/* Reset Filters */}
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer shadow-2xs"
              title="Reset all filters"
            >
              <FilterX size={12} />
              Reset
            </button>
          </div>

          <div className="text-[11px] text-slate-400 font-medium">
            {employees.length} employee records matching active criteria
          </div>
        </div>
      </div>

      {/* 3. Category Tabs */}
      <div className="rounded-xl border border-slate-200 bg-white px-2 pt-1 shadow-xs shrink-0">
        <nav aria-label="Report categories" className="flex gap-1 overflow-x-auto">
          {tabs.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                aria-current={active ? "page" : undefined}
                className={tw(
                  "flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-xs font-semibold transition cursor-pointer",
                  active
                    ? "border-[#ff5c28] text-[#d84d20] font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                )}
              >
                <Icon size={15} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* 4. Tab Body Content */}
      <main className="space-y-3">
        {/* Tab 1: Operational & Interval Reports */}
        {tab === "operational" && (
          <>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <SectionCard
                title="Calls Offered vs. Answered"
                subtitle="Two-hour intervals · Click any bar for detailed service level breakdown"
                action={<Pill tone="blue">Calls</Pill>}
              >
                <CompareBars
                  items={intervals}
                  first="offered"
                  second="answered"
                  firstLabel="Offered"
                  secondLabel="Answered"
                  onSelect={(item) =>
                    openDetail(
                      `Interval Analysis · ${item.label}`,
                      [
                        { label: "Offered Calls", value: item.offered },
                        { label: "Answered Calls", value: item.answered },
                        { label: "Answer Rate", value: percent(item.answered, item.offered) },
                        { label: "Average Handle Time", value: `${item.aht} seconds` },
                        { label: "Data Quality Flag", value: item.quality },
                      ],
                      "Interval breakdown from CRM telephony switch records.",
                      { quality: item.quality }
                    )
                  }
                />
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2">
                  <span>
                    Offered: <strong className="text-slate-800">{number(totals.offered)}</strong> · Answered:{" "}
                    <strong className="text-slate-800">{number(totals.answered)}</strong>
                  </span>
                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Overall Answer Rate: {percent(totals.answered, totals.offered)}
                  </span>
                </div>
              </SectionCard>

              <SectionCard
                title="Case Aging & Backlog Distribution"
                subtitle="Open ticket duration distribution against resolution targets"
                action={<Pill tone="blue">Cases</Pill>}
              >
                <BreakdownBars
                  items={CASE_AGING.map((item) => ({
                    label: item.label,
                    value: Math.round(item.count * month.factor),
                  }))}
                  tint="orange"
                  onSelect={(item) =>
                    openDetail(
                      `Case Aging Bucket · ${item.label}`,
                      [{ label: "Open Cases in Queue", value: number(item.value) }],
                      "Illustrative open-case queue backlog breakdown."
                    )
                  }
                />
                <p className="mt-3 text-xs text-slate-500 border-t border-slate-100 pt-2">
                  Target: 85% of standard cases resolved within 24 hours.
                </p>
              </SectionCard>
            </div>

            {/* Expandable Underlying Interval Table */}
            <SectionCard
              title="Operational Interval Log Detail"
              subtitle="Audited interval data with AHT, cases received, and data quality audits"
              action={
                <button
                  type="button"
                  onClick={() => setShowIntervalTable(!showIntervalTable)}
                  aria-expanded={showIntervalTable}
                  className="flex items-center gap-1 text-xs font-bold text-[#042c51] hover:text-[#ff5c28] cursor-pointer"
                >
                  {showIntervalTable ? "Hide Log Table" : "Show Log Table"}
                  <ChevronDown
                    size={15}
                    className={showIntervalTable ? "rotate-180 transition-transform" : "transition-transform"}
                  />
                </button>
              }
            >
              {!showIntervalTable ? (
                <p className="flex items-center gap-2 text-xs text-slate-500">
                  <ChevronRight size={14} />
                  Click to view underlying timestamps, call volumes, case closures, and data audit status.
                </p>
              ) : (
                <DataTable
                  rows={filteredIntervals}
                  columns={[
                    { key: "label", label: "Interval Time" },
                    { key: "offered", label: "Calls Offered" },
                    { key: "answered", label: "Calls Answered" },
                    { key: "received", label: "Cases Received" },
                    { key: "closed", label: "Cases Closed" },
                    { key: "aht", label: "AHT (sec)" },
                    {
                      key: "quality",
                      label: "Data Quality",
                      render: (row) => <QualityPill value={row.quality} />,
                    },
                  ]}
                />
              )}
            </SectionCard>
          </>
        )}

        {/* Tab 2: Account KPIs, Performance Comparison & Benchmarks (Req #2, #3, #7) */}
        {tab === "account" && (
          <>
            {/* Performance Comparison vs Prior Period Table (Req #7) */}
            <SectionCard
              title="Performance Comparison: Target vs. Actual vs. Prior Period"
              subtitle="Month-over-month delta analysis against contractual benchmarks"
              action={<Pill tone="green">Target Met: 5 of 6</Pill>}
            >
              <DataTable
                rows={ACCOUNT_COMPARISON_TABLE}
                columns={[
                  { key: "kpi", label: "Metric / KPI Area", render: (r) => <span className="font-semibold text-slate-900">{r.kpi}</span> },
                  { key: "target", label: "Contractual Benchmark" },
                  { key: "actual", label: "Current Actual", render: (r) => <strong className="text-[#042c51]">{r.actual}</strong> },
                  { key: "priorPeriod", label: "Prior Month" },
                  {
                    key: "delta",
                    label: "Period Delta",
                    render: (r) => (
                      <span
                        className={tw(
                          "inline-flex items-center gap-1 font-mono text-[11px] font-bold px-2 py-0.5 rounded",
                          r.delta.startsWith("+") || r.delta.includes("Faster")
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        )}
                      >
                        {r.delta}
                      </span>
                    ),
                  },
                  {
                    key: "status",
                    label: "Status",
                    render: (r) => (
                      <Pill tone={r.status === "Met" ? "green" : "amber"}>{r.status}</Pill>
                    ),
                  },
                ]}
              />
            </SectionCard>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <SectionCard
                title="Case Throughput Trend"
                subtitle={`${range.toUpperCase()} · Volume progression across reporting intervals`}
              >
                <BreakdownBars
                  items={trendData.map((entry) => ({
                    label: entry.label,
                    value: entry.volume,
                  }))}
                  onSelect={(item) =>
                    openDetail(
                      `Throughput Trend · ${item.label}`,
                      [{ label: "Case Volume", value: number(item.value) }],
                      "Account-level throughput trend."
                    )
                  }
                />
              </SectionCard>

              <SectionCard
                title="AHT Compliance Trend (&ge; 80% Benchmark)"
                subtitle={`${range.toUpperCase()} · Percentage of calls answered within 15 minutes`}
              >
                <BreakdownBars
                  items={trendData.map((entry) => ({
                    label: entry.label,
                    value: entry.compliance,
                  }))}
                  maxValue={100}
                  formatValue={(value) => `${value}%`}
                  tint="orange"
                  onSelect={(item) =>
                    openDetail(
                      `AHT Compliance · ${item.label}`,
                      [{ label: "Compliance Score", value: `${item.value}%` }],
                      "Percentage of calls handled within the contractual 15-minute standard."
                    )
                  }
                />
              </SectionCard>
            </div>
          </>
        )}

        {/* Tab 3: Team Performance Analysis & Individual Breakdown (Req #4, #5) */}
        {!client && tab === "team" && (
          <>
            {/* Team Performance Analysis (Req #5) */}
            <SectionCard
              title="Team & Supervisor Performance Comparison"
              subtitle="Benchmarking KPI scores, volume, and compliance across operational teams"
              action={<Pill tone="blue">3 Teams Monitored</Pill>}
            >
              <div className="grid gap-3 sm:grid-cols-3">
                {TEAM_BENCHMARKS.map((item) => (
                  <div
                    key={item.team}
                    onClick={() =>
                      openDetail(
                        `${item.team} (${item.supervisor})`,
                        [
                          { label: "Supervisor", value: item.supervisor },
                          { label: "Team Average Score", value: `${item.avgScore}%` },
                          { label: "Total Cases Closed", value: item.cases },
                          { label: "AHT Compliance", value: `${item.ahtCompliance}%` },
                          { label: "Active Team Members", value: item.members },
                          { label: "Month-over-Month Delta", value: item.deltaVsPrior },
                        ],
                        `Aggregated performance metrics for ${item.team}.`
                      )
                    }
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-[#ff5c28]/40 hover:shadow-xs transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">{item.team}</span>
                      <span className="text-[10px] font-mono text-slate-500 font-semibold">
                        {item.members} Agents
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{item.supervisor}</p>
                    <div className="flex items-baseline justify-between mt-3">
                      <div>
                        <span className="text-lg font-extrabold text-[#042c51]">
                          {item.avgScore}%
                        </span>
                        <span className="block text-[10px] text-slate-400">Avg KPI Score</span>
                      </div>
                      <span
                        className={tw(
                          "px-2 py-0.5 rounded text-[10.5px] font-bold font-mono",
                          item.deltaVsPrior.startsWith("+")
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        )}
                      >
                        {item.deltaVsPrior}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Rating Distribution & 6 Individual KPIs Reference */}
            <div className="grid gap-3 lg:grid-cols-2">
              <SectionCard
                title="Performance Rating Distribution"
                subtitle={`Validated records in current filters · ${rated.length} included`}
              >
                <BreakdownBars
                  items={["Exceptional", "Very Satisfactory", "Satisfactory", "Unsatisfactory"].map(
                    (label) => ({
                      label,
                      value: rated.filter((item) => rating(item.score) === label).length,
                    })
                  )}
                  maxValue={Math.max(1, rated.length)}
                  onSelect={(item) =>
                    openDetail(
                      `Rating Category: ${item.label}`,
                      employees
                        .filter(
                          (employee) =>
                            employee.quality === "Validated" && rating(employee.score) === item.label
                        )
                        .map((employee) => ({
                          label: employee.name,
                          value: `${employee.score.toFixed(1)}% (${employee.team})`,
                        })),
                      "Only validated records are included in the distribution."
                    )
                  }
                />
              </SectionCard>

              <SectionCard
                title="Interim Individual KPI Standards"
                subtitle="Six scored KPIs forming the composite Final KPI score"
              >
                <div className="space-y-2">
                  {AGENT_KPIS.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-start justify-between gap-3 rounded-lg bg-slate-50 p-2.5"
                    >
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{item.label}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500">{item.target}</p>
                      </div>
                      <Pill tone="blue">{item.weight}</Pill>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>

            {/* Employee Performance Breakdown Table (Req #4) */}
            <SectionCard
              title="Employee Performance Breakdown"
              subtitle="Individual employee metrics, supervisor, AHT compliance, and validation quality"
              action={<Pill tone="slate">{employees.length} matching records</Pill>}
            >
              <DataTable
                rows={employees}
                columns={[
                  {
                    key: "name",
                    label: "Employee",
                    render: (row) => (
                      <span>
                        <span className="block font-semibold text-slate-900">{row.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{row.id}</span>
                      </span>
                    ),
                  },
                  { key: "team", label: "Team" },
                  { key: "supervisor", label: "Supervisor" },
                  { key: "cases", label: "Cases Closed" },
                  { key: "aht", label: "AHT (sec)" },
                  {
                    key: "compliance",
                    label: "AHT Compliance",
                    render: (row) => (row.compliance == null ? "—" : `${row.compliance}%`),
                  },
                  {
                    key: "score",
                    label: "Final Score",
                    render: (row) => (row.score == null ? "—" : `${row.score.toFixed(1)}%`),
                  },
                  {
                    key: "scoreRating",
                    label: "Rating",
                    render: (row) => rating(row.score),
                  },
                  {
                    key: "quality",
                    label: "Data Quality",
                    render: (row) => <QualityPill value={row.quality} />,
                  },
                ]}
              />
            </SectionCard>
          </>
        )}

        {/* Tab 4: Coaching & PIP Reports (Req #8, #9) */}
        {!client && tab === "coaching" && (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                { label: "Coaching Sessions Logged", value: 18 },
                { label: "Pending Follow-Ups", value: 5 },
                { label: "Active PIP Plans", value: 2 },
                { label: "PIP Referrals for Review", value: 1 },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
                  <div className="text-xs text-slate-500 font-medium">{item.label}</div>
                  <div className="mt-1 text-xl font-extrabold text-[#042c51]">{item.value}</div>
                </div>
              ))}
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <SectionCard
                title="Coaching Session Types"
                subtitle="Scheduled vs Unscheduled coaching engagements"
              >
                <BreakdownBars
                  items={COACHING.types}
                  onSelect={(item) =>
                    openDetail(item.label, [{ label: "Coaching Sessions", value: item.value }])
                  }
                />
              </SectionCard>

              <SectionCard
                title="Coaching Follow-Up Outcomes"
                subtitle="Observed performance improvement after follow-up reviews"
              >
                <BreakdownBars
                  items={COACHING.outcomes}
                  tint="orange"
                  onSelect={(item) =>
                    openDetail(item.label, [{ label: "Logged Outcomes", value: item.value }])
                  }
                />
              </SectionCard>
            </div>

            <SectionCard
              title="Performance Improvement Plan (PIP) Status Overview"
              subtitle="Controlled referral, 30-day monitoring, and final closure outcomes"
            >
              <BreakdownBars
                items={COACHING.pips}
                onSelect={(item) =>
                  openDetail(item.label, [{ label: "PIP Records", value: item.value }])
                }
              />
            </SectionCard>
          </>
        )}

        {/* Tab 5: Quarterly Incentives Reports (Req #10) */}
        {!client && tab === "incentives" && (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                { label: "Monitored FrontSteps Agents", value: 12 },
                { label: "Potentially Qualified", value: 8 },
                { label: "Pending Validation Checks", value: 1 },
                { label: "Qualification Approved", value: 6 },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
                  <div className="text-xs text-slate-500 font-medium">{item.label}</div>
                  <div className="mt-1 text-xl font-extrabold text-[#042c51]">{item.value}</div>
                </div>
              ))}
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <SectionCard
                title="Quarterly Incentive Eligibility"
                subtitle={INCENTIVES.quarter}
              >
                <BreakdownBars
                  items={INCENTIVES.statuses}
                  tint="orange"
                  onSelect={(item) =>
                    openDetail(item.label, [{ label: "Employees", value: item.value }])
                  }
                />
              </SectionCard>

              <SectionCard
                title="Management Approval Pipeline ($40 Bonus)"
                subtitle="Sign-off progression from supervisor validation to operations sign-off"
              >
                <BreakdownBars
                  items={INCENTIVES.approvals}
                  onSelect={(item) =>
                    openDetail(item.label, [{ label: "Employees", value: item.value }])
                  }
                />
              </SectionCard>
            </div>

            <SectionCard
              title="Three-Month Consistency Benchmark (&ge; 85% Benchmark)"
              subtitle="Illustrative progression of agents maintaining high performance across consecutive months"
            >
              <BreakdownBars
                items={INCENTIVES.months}
                maxValue={12}
                onSelect={(item) =>
                  openDetail(
                    item.label,
                    [{ label: "Agents Meeting &ge; 85 Benchmark", value: item.value }],
                    "Progression across July, August, and September."
                  )
                }
              />
            </SectionCard>
          </>
        )}
      </main>

      <DetailModal data={detail} onClose={() => setDetail(null)} />
    </div>
  );
}
