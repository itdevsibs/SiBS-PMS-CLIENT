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
    <div className="mt-3 flex-1 flex flex-col min-h-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
      <div className="flex flex-col gap-2 border-b border-slate-100 px-3.5 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sibs-primary-1/10 text-sibs-primary-1">
            <CalendarDays className="h-4.5 w-4.5"/>
          </span>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="m-0 text-sm sm:text-base font-bold text-sibs-primary-1 leading-tight">{title}</h3>
            <span className="inline-flex items-center rounded-full bg-slate-100 border border-slate-200/80 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
              {loading ? "Loading…" : `${monthCount.toLocaleString()} files imported`}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="flex h-7.5 w-7.5 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            onClick={() => onMonthChange(calendarMonthShift(month, -1))}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-3.5 w-3.5"/>
          </button>
          <button
            type="button"
            className="h-7.5 rounded-lg border border-slate-200 px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            onClick={() => onMonthChange(today.slice(0, 7))}
          >
            Today
          </button>
          <button
            type="button"
            className="flex h-7.5 w-7.5 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            onClick={() => onMonthChange(calendarMonthShift(month, 1))}
            aria-label="Next month"
          >
            <ChevronRight className="h-3.5 w-3.5"/>
          </button>
        </div>
      </div>
      {error ? <p role="alert" className="mx-3.5 mt-2 text-xs text-rose-700 shrink-0">{error}</p> : null}
      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50 shrink-0">
        {WEEKDAYS.map((day) => (
          <div key={day} className="py-1.5 text-center text-[10px] font-bold uppercase tracking-wide text-slate-500">
            {day}
          </div>
        ))}
      </div>
      <div
        className="flex-1 grid grid-cols-7 auto-rows-fr gap-px bg-slate-100 min-h-0"
        aria-label={`${title} import calendar`}
      >
        {cells.map((day, index) => {
          const data = counts.get(day);
          const active = day === selectedDay;
          return day ? (
            <button
              type="button"
              key={day}
              onClick={() => onSelectDay(day, data)}
              aria-pressed={active}
              aria-label={`${day}: ${data?.batchCount || 0} imported batches, ${data?.failedCount || 0} failed`}
              className={`relative flex h-full flex-col items-start gap-0.5 bg-white p-1.5 text-left transition-colors hover:bg-sky-50 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-sky-500 sm:p-2 ${
                active ? "!bg-sky-50 ring-2 ring-inset ring-sky-500" : ""
              } ${data?.batchCount > 0 ? "cursor-pointer" : "cursor-default"}`}
            >
              <div className="flex w-full items-center justify-between gap-1">
                <span
                  className={`inline-flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    day === today ? "bg-sibs-primary-1 text-white shadow-xs" : "text-slate-700"
                  }`}
                >
                  {Number(day.slice(-2))}
                </span>
                {data?.batchCount > 0 ? (
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 text-emerald-700 shadow-2xs">
                    <FileCheck2 className="h-3 w-3 shrink-0 text-emerald-600"/>
                    <span className="text-[10px] sm:text-[11px] font-bold leading-none">
                      {data.batchCount} {data.batchCount === 1 ? "file imported" : "files imported"}
                    </span>
                  </span>
                ) : null}
              </div>
              {(data?.failedCount > 0 || data?.issueCount > 0 || data?.duplicateCount > 0) ? (
                <div className="mt-auto flex w-full justify-end">
                  <span className="inline-flex items-center gap-1 rounded bg-amber-50 border border-amber-200/60 px-1.5 py-0.5 text-[8.5px] font-medium text-amber-700 sm:text-[9px]">
                    <AlertCircle className="h-2.5 w-2.5 shrink-0 text-amber-600"/>
                    <span>
                      {data.failedCount > 0
                        ? `${data.failedCount} failed`
                        : data.issueCount > 0
                        ? `${data.issueCount} issues`
                        : `${data.duplicateCount} dup`}
                    </span>
                  </span>
                </div>
              ) : null}
            </button>
          ) : (
            <div key={`empty-${index}`} className="h-full bg-slate-50/80" aria-hidden="true"/>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 text-[10.5px] text-slate-500 sm:px-4 shrink-0 border-t border-slate-100">
        <span>A blank day means no uploads were recorded — not necessarily a missed report.</span>
        <span>Dates use Philippine time (UTC+8).</span>
      </div>
    </div>
  );
}
