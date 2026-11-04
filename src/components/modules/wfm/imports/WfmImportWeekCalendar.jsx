import { useMemo, useEffect, useRef } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, FileCheck2, AlertCircle } from "lucide-react";
import { manilaDateKey } from "./WfmImportCalendar";

const WEEKDAYS = [
  { short: "SUN", full: "Sunday" },
  { short: "MON", full: "Monday" },
  { short: "TUE", full: "Tuesday" },
  { short: "WED", full: "Wednesday" },
  { short: "THU", full: "Thursday" },
  { short: "FRI", full: "Friday" },
  { short: "SAT", full: "Saturday" },
];

const HOURS = Array.from({ length: 24 }, (_, i) => i); // 0 to 23

function formatHourLabel(hour) {
  if (hour === 0) return "12 AM";
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return "12 PM";
  return `${hour - 12} PM`;
}

// Helper to get week start (Sunday) for a given date
function getSundayOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDateISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function WfmImportWeekCalendar({
  selectedDay,
  onSelectDay,
  days = [],
  loading = false,
  error = "",
  onNavigateWeek,
  currentWeekStart, // "YYYY-MM-DD"
}) {
  const scrollContainerRef = useRef(null);

  const todayStr = useMemo(() => manilaDateKey(), []);

  // Determine current week dates (Sunday - Saturday)
  const weekDates = useMemo(() => {
    const baseDate = currentWeekStart
      ? new Date(`${currentWeekStart}T12:00:00Z`)
      : new Date();
    const sunday = getSundayOfWeek(baseDate);

    return Array.from({ length: 7 }, (_, i) => {
      const dayDate = addDays(sunday, i);
      const iso = formatDateISO(dayDate);
      return {
        iso,
        dayNum: dayDate.getDate(),
        monthNum: dayDate.getMonth() + 1,
        year: dayDate.getFullYear(),
        dayOfWeek: WEEKDAYS[i],
        isToday: iso === todayStr,
      };
    });
  }, [currentWeekStart, todayStr]);

  const counts = useMemo(() => new Map(days.map((day) => [day.date, day])), [days]);

  // Current time in Manila (UTC+8) for the red line indicator
  const manilaNow = useMemo(() => {
    const now = new Date();
    // format in UTC+8
    const manilaString = now.toLocaleString("en-US", { timeZone: "Asia/Manila" });
    const manilaDate = new Date(manilaString);
    const hours = manilaDate.getHours();
    const minutes = manilaDate.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    const topPosition = (totalMinutes / 60) * 56; // 56px per hour row
    return {
      hours,
      minutes,
      topPosition,
      isCurrentWeek: weekDates.some((w) => w.iso === todayStr),
      dayIndex: weekDates.findIndex((w) => w.iso === todayStr),
    };
  }, [weekDates, todayStr]);

  // Always start at 12:00 AM (top) when toggled
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, []);

  const weekTitle = useMemo(() => {
    if (weekDates.length === 0) return "";
    const first = weekDates[0];
    const last = weekDates[6];
    const firstMonth = new Intl.DateTimeFormat("en-US", { month: "short" }).format(
      new Date(`${first.iso}T12:00:00Z`),
    );
    const lastMonth = new Intl.DateTimeFormat("en-US", { month: "short" }).format(
      new Date(`${last.iso}T12:00:00Z`),
    );

    if (firstMonth === lastMonth) {
      return `${firstMonth} ${first.dayNum} – ${last.dayNum}, ${first.year}`;
    }
    return `${firstMonth} ${first.dayNum} – ${lastMonth} ${last.dayNum}, ${last.year}`;
  }, [weekDates]);

  const weekBatchCount = useMemo(() => {
    return weekDates.reduce((sum, w) => {
      const data = counts.get(w.iso);
      return sum + (data?.batchCount || 0);
    }, 0);
  }, [weekDates, counts]);

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
              {weekTitle}
            </h3>
            <span className="inline-flex items-center rounded-full bg-slate-100 border border-slate-200/80 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
              {loading ? "Loading…" : `${weekBatchCount.toLocaleString()} files imported this week`}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="flex h-7.5 w-7.5 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            onClick={() => onNavigateWeek(-1)}
            aria-label="Previous week"
            title="Previous week"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="h-7.5 rounded-lg border border-slate-200 px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            onClick={() => onNavigateWeek(0)}
          >
            Today
          </button>
          <button
            type="button"
            className="flex h-7.5 w-7.5 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            onClick={() => onNavigateWeek(1)}
            aria-label="Next week"
            title="Next week"
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

      {/* Week Header: 7 Days columns with Timezone column on left */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-slate-200 bg-white shrink-0 shadow-2xs">
        {/* Timezone label cell */}
        <div className="flex items-center justify-center border-r border-slate-200/70 p-2 text-[10px] font-bold text-slate-400">
          GMT+8
        </div>

        {/* 7 Day Headers */}
        {weekDates.map((day) => {
          const isSelected = day.iso === selectedDay;
          const dayData = counts.get(day.iso);
          return (
            <div
              key={day.iso}
              onClick={() => onSelectDay(day.iso, dayData)}
              className={`flex flex-col items-center justify-center py-2 px-1 text-center cursor-pointer transition-colors border-r border-slate-200/70 last:border-r-0 hover:bg-sky-50/40 ${
                isSelected ? "bg-sky-50/50" : ""
              }`}
            >
              <span className={`text-[11px] font-bold uppercase tracking-wider ${
                day.isToday ? "text-[#0556bf]" : "text-slate-500"
              }`}>
                {day.dayOfWeek.short}
              </span>
              <span
                className={`mt-1 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  day.isToday
                    ? "bg-[#0556bf] text-white shadow-sm ring-2 ring-[#0556bf]/20"
                    : isSelected
                    ? "bg-slate-200 text-slate-800"
                    : "text-slate-800"
                }`}
              >
                {day.dayNum}
              </span>

              {/* Day file indicator badge if files exist */}
              {dayData?.batchCount > 0 && (
                <span className="mt-1 inline-flex items-center gap-1 rounded bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 leading-none">
                  <FileCheck2 className="h-2.5 w-2.5 shrink-0 text-emerald-600" />
                  <span>{dayData.batchCount}</span>
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Scrollable Hourly Time Grid */}
      <div
        ref={scrollContainerRef}
        className="relative flex-1 min-h-[300px] max-h-[calc(100vh-320px)] overflow-y-scroll bg-white"
        style={{ scrollBehavior: "smooth" }}
      >
        <div className="relative min-w-[700px]">
          {/* Real-time Indicator Line across the current day column */}
          {manilaNow.isCurrentWeek && manilaNow.dayIndex >= 0 && (
            <div
              className="pointer-events-none absolute z-20 flex items-center"
              style={{
                top: `${manilaNow.topPosition}px`,
                left: `calc(60px + (${manilaNow.dayIndex} * (100% - 60px) / 7))`,
                width: `calc((100% - 60px) / 7)`,
              }}
            >
              <div className="h-2.5 w-2.5 -translate-x-1.5 rounded-full bg-rose-500 ring-2 ring-white shadow-xs" />
              <div className="h-[2px] flex-1 bg-rose-500 shadow-2xs" />
            </div>
          )}

          {/* 24 Hour Rows */}
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="grid grid-cols-[60px_repeat(7,1fr)] h-14 border-b border-slate-100 group hover:bg-slate-50/30 transition-colors"
            >
              {/* Hour Label */}
              <div className="relative flex items-start justify-end pr-3 pt-1 text-[11px] font-medium text-slate-400 select-none border-r border-slate-200/70">
                {formatHourLabel(hour)}
              </div>

              {/* 7 Columns for this hour */}
              {weekDates.map((day) => {
                const isSelected = day.iso === selectedDay;
                const dayData = counts.get(day.iso);
                return (
                  <div
                    key={`${day.iso}-${hour}`}
                    onClick={() => onSelectDay(day.iso, dayData)}
                    className={`relative border-r border-slate-200/50 last:border-r-0 cursor-pointer transition-colors ${
                      isSelected ? "bg-sky-50/20" : ""
                    } hover:bg-sky-50/50`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Footer info */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 text-[10.5px] text-slate-500 sm:px-4 shrink-0 border-t border-slate-100 bg-white">
        <span>Click on any day column or time slot to view imported batches for that day.</span>
        <span>Dates and current time indicator use Philippine time (UTC+8).</span>
      </div>
    </div>
  );
}

