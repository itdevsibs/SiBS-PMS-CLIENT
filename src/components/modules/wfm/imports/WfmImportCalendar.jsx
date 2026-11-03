import { useMemo } from "react";
import { AlertCircle, CalendarDays, ChevronLeft, ChevronRight, FileCheck2 } from "lucide-react";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function calendarMonthShift(monthKey, delta) {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function manilaDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(date);
  const part = (key) => parts.find((item) => item.type === key)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export default function WfmImportCalendar({
  month, onMonthChange, selectedDay, onSelectDay,
  days = [], loading = false, error = "",
}) {
  const { cells, title } = useMemo(() => {
    const [year, monthNumber] = month.split("-").map(Number);
    const count = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
    const start = new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay();
    const array = [ ...Array.from({ length: start }, () => null),
      ...Array.from({ length: count }, (_, i) => dateKey(year, monthNumber - 1, i + 1)) ];
    while (array.length % 7 !== 0) array.push(null);
    const label = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" })
      .format(new Date(Date.UTC(year, monthNumber - 1, 1)));
    return { cells: array, title: label };
  }, [month]);
  const counts = useMemo(() => new Map(days.map((day) => [day.date, day])), [days]);
  const monthCount = days.reduce((sum, day) => sum + (day.batchCount || 0), 0);
  const today = manilaDateKey();
  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sibs-primary-1/10 text-sibs-primary-1"><CalendarDays className="h-5 w-5"/></span>
          <div>
            <h3 className="m-0 text-base font-bold text-sibs-primary-1">{title}</h3>
            <p className="mt-0.5 text-xs text-slate-500">{loading ? "Loading calendar…" : `${monthCount.toLocaleString()} imported batches`}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50" onClick={() => onMonthChange(calendarMonthShift(month, -1))} aria-label="Previous month"><ChevronLeft className="h-4 w-4"/></button>
          <button type="button" className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50" onClick={() => onMonthChange(today.slice(0, 7))}>Today</button>
          <button type="button" className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50" onClick={() => onMonthChange(calendarMonthShift(month, 1))} aria-label="Next month"><ChevronRight className="h-4 w-4"/></button>
        </div>
      </div>
      {error ? <p role="alert" className="mx-4 mt-3 text-xs text-rose-700">{error}</p> : null}
      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
        {WEEKDAYS.map((day) => <div key={day} className="py-2.5 text-center text-[10px] font-bold uppercase tracking-wide text-slate-500">{day}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-px bg-slate-100" aria-label={`${title} import calendar`}>
        {cells.map((day, index) => {
          const data = counts.get(day);
          const active = day === selectedDay;
          return day ? (
            <button type="button" key={day} onClick={() => onSelectDay(day)} aria-pressed={active}
              aria-label={`${day}: ${data?.batchCount || 0} imported batches, ${data?.failedCount || 0} failed`}
              className={`relative flex min-h-16 flex-col items-start gap-1 bg-white p-1.5 text-left transition-colors hover:bg-sky-50 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-sky-500 sm:min-h-24 sm:p-3 ${active ? "!bg-sky-50 ring-2 ring-inset ring-sky-500" : ""}`}>
              <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${day === today ? "bg-sibs-primary-1 text-white" : "text-slate-700"}`}>{Number(day.slice(-2))}</span>
              {data?.batchCount > 0 ? <span className="inline-flex max-w-full items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 sm:text-[11px]"><FileCheck2 className="hidden h-3 w-3 shrink-0 sm:block"/>{data.batchCount} <span className="hidden sm:inline">batch(es)</span></span> : null}
              {(data?.failedCount > 0 || data?.issueCount > 0 || data?.duplicateCount > 0) ? <span className="flex items-center gap-1 text-[9px] font-medium text-amber-700 sm:text-[10px]"><AlertCircle className="h-3 w-3 shrink-0"/>{data.failedCount > 0 ? `${data.failedCount} failed` : data.issueCount > 0 ? `${data.issueCount} issues` : `${data.duplicateCount} duplicate`}</span> : null}
            </button>
          ) : <div key={`empty-${index}`} className="min-h-16 bg-slate-50/80 sm:min-h-24" aria-hidden="true"/>;
        })}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-[11px] text-slate-500 sm:px-5">
        <span>A blank day means no uploads were recorded — not necessarily a missed report.</span>
        <span>Dates use Philippine time (UTC+8).</span>
      </div>
    </div>
  );
}
