import { useMemo } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { manilaDateKey } from "./WfmImportCalendar";

const MONTH_NAMES = [
  "January", "February", "March", "April",
  "May", "June", "July", "August",
  "September", "October", "November", "December",
];

const WEEK_HEADER_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

function dateKey(year, monthIndex, day) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// Generate calendar cells for a month, including leading/trailing neighbor month dates to form complete 7-col weeks
function getMonthCells(year, monthIndex) {
  const firstDayOfWeek = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay(); // 0 (Sun) - 6 (Sat)
  const daysInCurrentMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const daysInPrevMonth = new Date(Date.UTC(year, monthIndex, 0)).getUTCDate();

  const cells = [];

  // Trailing days of previous month
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const prevMonthIdx = monthIndex === 0 ? 11 : monthIndex - 1;
    const prevYear = monthIndex === 0 ? year - 1 : year;
    cells.push({
      dayNum: d,
      iso: dateKey(prevYear, prevMonthIdx, d),
      isCurrentMonth: false,
    });
  }

  // Days of current month
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    cells.push({
      dayNum: d,
      iso: dateKey(year, monthIndex, d),
      isCurrentMonth: true,
    });
  }

  // Leading days of next month to complete the grid (multiples of 7, up to 35 or 42)
  let nextDay = 1;
  while (cells.length % 7 !== 0 || cells.length < 35) {
    const nextMonthIdx = monthIndex === 11 ? 0 : monthIndex + 1;
    const nextYear = monthIndex === 11 ? year + 1 : year;
    cells.push({
      dayNum: nextDay,
      iso: dateKey(nextYear, nextMonthIdx, nextDay),
      isCurrentMonth: false,
    });
    nextDay++;
  }

  return cells;
}

export default function WfmImportYearCalendar({
  year = 2026,
  onNavigateYear,
  selectedDay,
  onSelectDay,
  days = [],
  loading = false,
  error = "",
  onSelectMonth,
}) {
  const todayStr = useMemo(() => manilaDateKey(), []);
  const counts = useMemo(() => new Map(days.map((day) => [day.date, day])), [days]);

  const yearTotalImports = useMemo(() => {
    return days.reduce((sum, d) => sum + (d.batchCount || 0), 0);
  }, [days]);

  return (
    <div className="mt-3 flex-1 flex flex-col min-h-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
      {/* Top Header Controls */}
      <div className="flex flex-col gap-2 border-b border-slate-100 px-3.5 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-4 shrink-0 bg-white">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sibs-primary-1/10 text-sibs-primary-1">
            <CalendarDays className="h-4.5 w-4.5" />
          </span>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="m-0 text-sm sm:text-base font-bold text-sibs-primary-1 leading-tight">
              {year}
            </h3>
            <span className="inline-flex items-center rounded-full bg-slate-100 border border-slate-200/80 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
              {loading ? "Loading…" : `${yearTotalImports.toLocaleString()} files imported in ${year}`}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="flex h-7.5 w-7.5 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            onClick={() => onNavigateYear(-1)}
            aria-label="Previous year"
            title="Previous year"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="h-7.5 rounded-lg border border-slate-200 px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            onClick={() => onNavigateYear(0)}
          >
            Today
          </button>
          <button
            type="button"
            className="flex h-7.5 w-7.5 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            onClick={() => onNavigateYear(1)}
            aria-label="Next year"
            title="Next year"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {error ? (
        <p role="alert" className="mx-3.5 mt-2 text-xs text-rose-700 shrink-0">
          {error}
        </p>
      ) : null}

      {/* 12 Months Grid (4 columns x 3 rows) - compact & fitting without outer scrolling */}
      <div className="flex-1 min-h-0 overflow-hidden px-3.5 py-2.5 sm:px-4 sm:py-3 bg-white flex flex-col justify-between">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 lg:gap-x-6 gap-y-2.5 sm:gap-y-3.5 my-auto">
          {MONTH_NAMES.map((monthName, monthIndex) => {
            const cells = getMonthCells(year, monthIndex);
            const monthKey = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;

            return (
              <div key={monthName} className="flex flex-col select-none">
                {/* Month Name Title */}
                <button
                  type="button"
                  onClick={() => onSelectMonth && onSelectMonth(monthKey)}
                  className="text-left font-bold text-[11px] sm:text-xs text-slate-800 mb-1 hover:text-sibs-primary-2 cursor-pointer transition-colors"
                >
                  {monthName}
                </button>

                {/* Week Day Letters (S M T W T F S) */}
                <div className="grid grid-cols-7 mb-0.5 text-center">
                  {WEEK_HEADER_LETTERS.map((letter, i) => (
                    <span
                      key={`${monthName}-${letter}-${i}`}
                      className="text-[9px] font-semibold text-slate-400 py-0"
                    >
                      {letter}
                    </span>
                  ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-y-0.5 text-center">
                  {cells.map((cell, idx) => {
                    const isSelected = cell.iso === selectedDay;
                    const isToday = cell.iso === todayStr;
                    const dayData = counts.get(cell.iso);
                    const hasData = dayData?.batchCount > 0;

                    return (
                      <button
                        type="button"
                        key={`${cell.iso}-${idx}`}
                        onClick={() => onSelectDay(cell.iso, dayData)}
                        className={`group relative flex h-4.5 w-4.5 mx-auto items-center justify-center rounded-full text-[9px] transition-all cursor-pointer ${
                          !cell.isCurrentMonth
                            ? "text-slate-300 font-normal hover:bg-slate-100"
                            : isToday
                            ? "bg-[#0556bf] text-white font-bold shadow-xs"
                            : isSelected
                            ? "ring-1.5 ring-[#0556bf] text-[#0556bf] font-bold"
                            : hasData
                            ? "font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                            : "text-slate-700 hover:bg-slate-100"
                        }`}
                        title={`${cell.iso}${hasData ? `: ${dayData.batchCount} imported files` : ""}`}
                      >
                        {cell.dayNum}

                        {/* Tiny indicator dot for days with imports */}
                        {hasData && !isToday && (
                          <span className="absolute -bottom-0.5 left-1/2 h-0.5 w-0.5 -translate-x-1/2 rounded-full bg-emerald-500" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer info */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 text-[10.5px] text-slate-500 sm:px-4 shrink-0 border-t border-slate-100 bg-white">
        <span>Click on any month title or day number to view import details.</span>
        
      </div>
    </div>
  );
}

