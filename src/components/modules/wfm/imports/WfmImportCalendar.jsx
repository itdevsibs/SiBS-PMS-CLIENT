import { useMemo } from "react";
import { AlertCircle, CalendarDays, ChevronLeft, ChevronRight, FileCheck2 } from "lucide-react";

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

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
  showInternalNavigation = true,
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
    <div className="mt-3 flex-1 flex flex-col min-h-0 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_8px_28px_rgba(15,47,77,0.06)]">
      <div className="flex flex-col gap-2 border-b border-slate-100 p-4 sm:p-5 pb-3 sm:flex-row sm:items-center sm:justify-between shrink-0">
        <div>
          <h3 className="m-0 text-base font-black text-sibs-primary-1 leading-tight">{title}</h3>
          <p className="mt-0.5 text-[11px] text-slate-500 font-medium">
            {loading ? "Loading…" : `${monthCount.toLocaleString()} files imported`}
          </p>
        </div>
        {showInternalNavigation && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-xs hover:border-[#0b3b68] hover:bg-slate-50 hover:text-[#0b3b68] transition active:scale-95 cursor-pointer"
              onClick={() => onMonthChange(calendarMonthShift(month, -1))}
              aria-label="Previous month"
            >
              <ChevronLeft size={18} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              className="h-8 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-xs hover:border-[#0b3b68] hover:bg-slate-50 hover:text-[#0b3b68] transition active:scale-95 cursor-pointer"
              onClick={() => onMonthChange(today.slice(0, 7))}
            >
              Today
            </button>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-xs hover:border-[#0b3b68] hover:bg-slate-50 hover:text-[#0b3b68] transition active:scale-95 cursor-pointer"
              onClick={() => onMonthChange(calendarMonthShift(month, 1))}
              aria-label="Next month"
            >
              <ChevronRight size={18} strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>
      {error ? <p role="alert" className="mx-4 mt-2 text-xs text-rose-700 shrink-0">{error}</p> : null}
      
      {/* Calendar Grid Container: Vertical agenda on small screens (<sm), 7-day grid on sm and larger */}
      {/* Mobile Vertical Day-by-Day Agenda View */}
      <div className="flex-1 min-h-[300px] overflow-y-auto sibs-scrollbar divide-y divide-slate-100 sm:hidden">
        {cells
          .filter(Boolean)
          .map((day) => {
            const data = counts.get(day);
            const active = day === selectedDay;
            const dayNum = Number(day.slice(-2));
            const dayDate = new Date(`${day}T12:00:00Z`);
            const weekdayName = WEEKDAYS[dayDate.getUTCDay()];
            const hasData = data?.batchCount > 0;

            return (
              <button
                type="button"
                key={`mobile-${day}`}
                onClick={() => onSelectDay(day, data)}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-left transition ${
                  active ? "bg-blue-50/90 ring-1 ring-inset ring-blue-500" : "bg-white hover:bg-blue-50/30"
                } ${hasData ? "cursor-pointer" : "cursor-default"}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 shrink-0 flex-col items-center justify-center rounded-lg font-bold ${
                      day === today
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    <span className="text-[9px] uppercase leading-none font-semibold text-slate-400">
                      {weekdayName}
                    </span>
                    <span className="text-xs leading-none mt-0.5">
                      {dayNum}
                    </span>
                  </div>
                  <div>
                    <p className="m-0 text-xs font-bold text-slate-800">
                      {weekdayName}, {day}
                    </p>
                    <p className="m-0 text-[11px] text-slate-500">
                      {hasData ? (
                        <span className="text-[#042c51] font-bold">
                          {data.batchCount} {data.batchCount === 1 ? "file imported" : "files imported"}
                        </span>
                      ) : (
                        <span className="text-slate-400">No imports</span>
                      )}
                    </p>
                  </div>
                </div>

                {hasData ? (
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                      <FileCheck2 className="h-3 w-3 text-white" />
                      <span>{data.batchCount}</span>
                    </span>
                    {(data?.failedCount > 0 || data?.issueCount > 0 || data?.duplicateCount > 0) && (
                      <span className="inline-flex items-center gap-1 rounded bg-amber-50 border border-amber-200/60 px-1.5 py-0.5 text-[9px] font-medium text-amber-700">
                        <AlertCircle className="h-2.5 w-2.5 text-amber-600" />
                        <span>{data.failedCount || data.issueCount || data.duplicateCount}</span>
                      </span>
                    )}
                  </div>
                ) : null}
              </button>
            );
          })}
      </div>

      {/* Desktop/Tablet 7-Day Grid View (sm and larger) */}
      <div className="hidden sm:flex flex-1 min-h-0 flex-col bg-slate-200 overflow-hidden">
        {/* Flat dark navy header with vertical column divider lines */}
        <div className="grid grid-cols-7 bg-[#042c51] text-white shrink-0 border-b border-[#032240] divide-x divide-blue-900/60">
          {WEEKDAYS.map((day) => (
            <div key={day} className="py-2.5 text-center text-[10px] sm:text-[11px] font-extrabold tracking-[0.14em] text-white/95">
              {day}
            </div>
          ))}
        </div>
        <div
          className="flex-1 grid grid-cols-7 auto-rows-fr gap-px bg-slate-200 min-h-0 h-full"
          aria-label={`${title} import calendar`}
        >
          {cells.map((day, index) => {
            const data = counts.get(day);
            const active = day === selectedDay;
            const isToday = day === today;
            return day ? (
              <button
                type="button"
                key={day}
                onClick={() => onSelectDay(day, data)}
                aria-pressed={active}
                aria-label={`${day}: ${data?.batchCount || 0} imported batches, ${data?.failedCount || 0} failed`}
                className={`group relative flex h-full min-h-[92px] flex-col p-2 text-left transition duration-150 sm:p-2.5 ${
                  active
                    ? "bg-blue-50/90 ring-2 ring-inset ring-blue-500 z-10"
                    : "bg-white hover:bg-blue-50/30"
                } ${data?.batchCount > 0 ? "cursor-pointer" : "cursor-default"}`}
              >
                <div className="flex w-full items-center justify-between gap-1">
                  <span
                    className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold ${
                      active
                        ? "bg-blue-600 text-white"
                        : "text-slate-800"
                    }`}
                  >
                    {Number(day.slice(-2))}
                  </span>
                  <div className="flex items-center gap-1">
                    {isToday && (
                      <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-blue-700">
                        Today
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-auto w-full pt-2">
                  <div className="flex items-center justify-between gap-1">
                    <div className={`inline-flex rounded-md px-1.5 py-0.5 text-[9px] leading-none font-bold ${
                      data?.batchCount > 0
                        ? "bg-blue-600 text-white shadow-xs"
                        : "border-transparent px-0 text-slate-400 font-semibold"
                    }`}>
                      {data?.batchCount > 0
                        ? `${data.batchCount} ${data.batchCount === 1 ? "File Imported" : "Files Imported"}`
                        : "—"}
                    </div>

                    {(data?.failedCount > 0 || data?.issueCount > 0 || data?.duplicateCount > 0) && (
                      <span className="inline-flex items-center gap-1 rounded bg-amber-50 border border-amber-200/60 px-1.5 py-0.5 text-[8.5px] font-medium text-amber-700 sm:text-[9px]">
                        <AlertCircle className="h-2.5 w-2.5 shrink-0 text-amber-600" />
                        <span>
                          {data.failedCount > 0
                            ? `${data.failedCount} failed`
                            : data.issueCount > 0
                            ? `${data.issueCount} ${data.issueCount === 1 ? "issue" : "issues"}`
                            : `${data.duplicateCount} dup`}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ) : (
              <div key={`empty-${index}`} className="h-full bg-slate-50/80" aria-hidden="true" />
            );
          })}
        </div>
      </div>
    </div>
  );
}
