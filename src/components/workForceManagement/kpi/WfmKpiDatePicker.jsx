import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import {
  buildCalendarDays,
  formatDateForDisplay,
  getMonthLabel,
  getTodayIso,
  parseIsoDate,
  shiftMonth,
} from "./wfmKpiDatePickerUtils.js";

const WEEK_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function getInitialView(value) {
  const parsed = parseIsoDate(value);

  if (parsed) {
    return {
      year: parsed.year,
      month: parsed.month,
    };
  }

  const today = new Date();

  return {
    year: today.getFullYear(),
    month: today.getMonth(),
  };
}

export default function WfmKpiDatePicker({
  label,
  value,
  onChange,
  disabled = false,
}) {
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState(() => getInitialView(value));
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  const todayIso = getTodayIso();

  const days = useMemo(
    () => buildCalendarDays(view.year, view.month),
    [view.year, view.month],
  );

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const calendarWidth = 320;
    const calendarHeight = 350;

    const spaceBelow = window.innerHeight - rect.bottom;
    const showAbove = spaceBelow < calendarHeight && rect.top > calendarHeight;

    const left = Math.max(
      12,
      Math.min(rect.left, window.innerWidth - calendarWidth - 12),
    );

    const top = showAbove
      ? rect.top - calendarHeight - 6
      : rect.bottom + 6;

    setDropdownPosition({
      top: Math.max(8, top),
      left,
      width: calendarWidth,
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;

    updatePosition();

    const handlePointerDown = (event) => {
      if (
        triggerRef.current?.contains(event.target) ||
        dropdownRef.current?.contains(event.target)
      ) {
        return;
      }
      setIsOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    const handleScrollOrResize = () => {
      updatePosition();
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen, updatePosition]);

  const openCalendar = () => {
    if (disabled) return;
    setView(getInitialView(value));
    updatePosition();
    setIsOpen((current) => !current);
  };

  const moveMonth = (amount) => {
    setView((current) => shiftMonth(current.year, current.month, amount));
  };

  const chooseDate = (iso, year, month) => {
    onChange(iso);
    setView({ year, month });
    setIsOpen(false);
  };

  const chooseToday = () => {
    const parsed = parseIsoDate(todayIso);
    if (!parsed) return;
    onChange(todayIso);
    setView({ year: parsed.year, month: parsed.month });
    setIsOpen(false);
  };

  const clearDate = () => {
    onChange("");
    setIsOpen(false);
  };

  return (
    <div className="relative min-w-0">
      <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
        {label}
      </span>

      <button
        ref={triggerRef}
        type="button"
        onClick={openCalendar}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className={`group flex h-10 w-full min-w-0 items-center gap-2.5 rounded-xl border bg-white px-3 text-left shadow-sm outline-none transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${
          isOpen
            ? "border-sibs-primary-1 ring-2 ring-sibs-primary-1/10"
            : "border-sibs-tertiary-8 hover:border-sibs-primary-1/50 hover:shadow-md"
        }`}
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sibs-primary-3/50 text-sibs-primary-1">
          <CalendarDays size={15} strokeWidth={2.2} />
        </span>

        <span
          className={`min-w-0 flex-1 truncate text-sm font-bold ${
            value ? "text-sibs-primary-1" : "text-sibs-tertiary-5"
          }`}
        >
          {formatDateForDisplay(value)}
        </span>

        <ChevronDown
          size={16}
          className={`shrink-0 text-sibs-tertiary-5 transition-transform duration-150 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            role="dialog"
            aria-label={`${label} calendar`}
            style={{
              position: "fixed",
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`,
              zIndex: 999999,
            }}
            className="animate-in fade-in zoom-in-95 duration-100 overflow-hidden rounded-2xl border border-sibs-tertiary-9 bg-white shadow-[0_20px_60px_rgba(4,44,81,0.28)]"
          >
            <div className="flex items-center justify-between border-b border-sibs-tertiary-10 bg-sibs-primary-3/30 px-3.5 py-3">
              <button
                type="button"
                onClick={() => moveMonth(-1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-sibs-primary-1 transition hover:bg-white hover:shadow-sm"
                aria-label="Previous month"
              >
                <ChevronLeft size={17} />
              </button>

              <div className="text-center">
                <p className="m-0 text-sm font-extrabold text-sibs-primary-1">
                  {getMonthLabel(view.year, view.month)}
                </p>

                <p className="mt-0.5 mb-0 text-[9px] font-bold uppercase tracking-[0.16em] text-sibs-tertiary-5">
                  Select a date
                </p>
              </div>

              <button
                type="button"
                onClick={() => moveMonth(1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-sibs-primary-1 transition hover:bg-white hover:shadow-sm"
                aria-label="Next month"
              >
                <ChevronRight size={17} />
              </button>
            </div>

            <div className="p-3">
              <div className="mb-1 grid grid-cols-7">
                {WEEK_DAYS.map((day) => (
                  <span
                    key={day}
                    className="flex h-7 items-center justify-center text-[10px] font-extrabold uppercase text-sibs-tertiary-5"
                  >
                    {day}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-0.5">
                {days.map((day) => {
                  const isSelected = day.iso === value;
                  const isToday = day.iso === todayIso;

                  return (
                    <button
                      key={day.iso}
                      type="button"
                      onClick={() =>
                        chooseDate(day.iso, day.year, day.month)
                      }
                      className={`relative flex aspect-square items-center justify-center rounded-lg text-xs font-bold transition-all duration-100 ${
                        isSelected
                          ? "bg-sibs-primary-1 text-white shadow-sm"
                          : day.inCurrentMonth
                          ? "text-sibs-primary-1 hover:bg-sibs-primary-3/70"
                          : "text-sibs-tertiary-6/50 hover:bg-sibs-tertiary-10/70"
                      }`}
                    >
                      {day.day}

                      {isToday && !isSelected ? (
                        <span className="absolute bottom-1 h-1 w-1 rounded-full bg-sibs-primary-1" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-sibs-tertiary-10 bg-sibs-tertiary-10/30 px-3.5 py-2.5">
              <button
                type="button"
                onClick={clearDate}
                className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-sibs-tertiary-5 transition hover:bg-white hover:text-sibs-primary-1"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={chooseToday}
                className="rounded-lg bg-sibs-primary-3/60 px-3.5 py-1.5 text-xs font-extrabold text-sibs-primary-1 transition hover:bg-sibs-primary-3 hover:shadow-sm"
              >
                Today
              </button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}