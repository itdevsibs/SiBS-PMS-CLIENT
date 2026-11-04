import { useMemo, useEffect, useRef } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, FileCheck2 } from "lucide-react";
import { manilaDateKey } from "./WfmImportCalendar";

const HOURS = Array.from({ length: 24 }, (_, i) => i); // 0 to 23

function formatHourLabel(hour) {
  if (hour === 0) return "12 AM";
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return "12 PM";
  return `${hour - 12} PM`;
}

function shiftDay(dateStr, delta) {
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setDate(d.getDate() + delta);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function WfmImportDayCalendar({
  selectedDay,
  onSelectDay,
  days = [],
  loading = false,
  error = "",
  currentDay, // "YYYY-MM-DD"
  onNavigateDay,
}) {
  const scrollContainerRef = useRef(null);
  const todayStr = useMemo(() => manilaDateKey(), []);

  const activeDayStr = currentDay || selectedDay || todayStr;

  const dayInfo = useMemo(() => {
    const d = new Date(`${activeDayStr}T12:00:00Z`);
    const dayOfWeekShort = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" })
      .format(d)
      .toUpperCase();
    const dayOfWeekFull = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "UTC" }).format(d);
    const monthName = new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "UTC" }).format(d);
    const dayNum = d.getUTCDate();
    const year = d.getUTCFullYear();

    return {
      iso: activeDayStr,
      dayNum,
      dayOfWeekShort,
      dayOfWeekFull,
      monthName,
      year,
      title: `${monthName} ${dayNum}, ${year}`,
      isToday: activeDayStr === todayStr,
    };
  }, [activeDayStr, todayStr]);

  const dayData = useMemo(() => {
    return days.find((d) => d.date === activeDayStr);
  }, [days, activeDayStr]);

  // Current time in Manila (UTC+8) for the red line indicator
  const manilaNow = useMemo(() => {
    const now = new Date();
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
      isToday: activeDayStr === todayStr,
    };
  }, [activeDayStr, todayStr]);

  // Always start at 12 AM (top)
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [activeDayStr]);

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
              {dayInfo.title}
            </h3>
            <span className="inline-flex items-center rounded-full bg-slate-100 border border-slate-200/80 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
              {loading
                ? "Loading…"
                : `${(dayData?.batchCount || 0).toLocaleString()} ${
                    dayData?.batchCount === 1 ? "file imported" : "files imported"
                  }`}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="flex h-7.5 w-7.5 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            onClick={() => onNavigateDay(-1)}
            aria-label="Previous day"
            title="Previous day"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="h-7.5 rounded-lg border border-slate-200 px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            onClick={() => onNavigateDay(0)}
          >
            Today
          </button>
          <button
            type="button"
            className="flex h-7.5 w-7.5 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            onClick={() => onNavigateDay(1)}
            aria-label="Next day"
            title="Next day"
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

      {/* Day Header matching your image (GMT+8 label on left, Day name & Day circle) */}
      <div className="grid grid-cols-[60px_1fr] border-b border-slate-200 bg-white shrink-0 shadow-2xs">
        {/* Timezone label cell */}
        <div className="flex items-center justify-center border-r border-slate-200/70 p-2 text-[10px] font-bold text-slate-400">
          GMT+8
        </div>

        {/* Selected Day Header */}
        <div
          onClick={() => onSelectDay(dayInfo.iso, dayData)}
          className="flex items-center gap-3 py-2 px-4 cursor-pointer hover:bg-sky-50/40 transition-colors"
        >
          <div className="flex flex-col items-center">
            <span
              className={`text-[11px] font-bold uppercase tracking-wider ${
                dayInfo.isToday ? "text-[#0556bf]" : "text-slate-500"
              }`}
            >
              {dayInfo.dayOfWeekShort}
            </span>
            <span
              className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                dayInfo.isToday
                  ? "bg-[#0556bf] text-white shadow-sm ring-2 ring-[#0556bf]/20"
                  : "bg-[#0556bf] text-white shadow-sm"
              }`}
            >
              {dayInfo.dayNum}
            </span>
          </div>

          {/* Badge if files imported */}
          {dayData?.batchCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 text-xs font-bold text-emerald-700">
              <FileCheck2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
              <span>
                {dayData.batchCount} {dayData.batchCount === 1 ? "file imported" : "files imported"}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Scrollable Hourly Time Grid for the Single Day */}
      <div
        ref={scrollContainerRef}
        className="relative flex-1 min-h-[300px] max-h-[calc(100vh-320px)] overflow-y-scroll bg-white"
        style={{ scrollBehavior: "smooth" }}
      >
        <div className="relative">
          {/* Real-time Indicator Line across the day column */}
          {manilaNow.isToday && (
            <div
              className="pointer-events-none absolute z-20 flex items-center left-[60px] right-0"
              style={{
                top: `${manilaNow.topPosition}px`,
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
              onClick={() => onSelectDay(dayInfo.iso, dayData)}
              className="grid grid-cols-[60px_1fr] h-14 border-b border-slate-100 group hover:bg-slate-50/50 cursor-pointer transition-colors"
            >
              {/* Hour Label */}
              <div className="relative flex items-start justify-end pr-3 pt-1 text-[11px] font-medium text-slate-400 select-none border-r border-slate-200/70">
                {formatHourLabel(hour)}
              </div>

              {/* Day Time Slot Cell */}
              <div className="relative hover:bg-sky-50/20 transition-colors" />
            </div>
          ))}
        </div>
      </div>

      {/* Footer info */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 text-[10.5px] text-slate-500 sm:px-4 shrink-0 border-t border-slate-100 bg-white">
        <span>Click anywhere on the day or time slots to view imported batches for this day.</span>
        <span>Dates and current time indicator use Philippine time (UTC+8).</span>
      </div>
    </div>
  );
}

