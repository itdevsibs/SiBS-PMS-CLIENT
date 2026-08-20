import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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

const WEEK_DAYS = [
  "Su",
  "Mo",
  "Tu",
  "We",
  "Th",
  "Fr",
  "Sa",
];

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
  const wrapperRef = useRef(null);

  const [isOpen, setIsOpen] =
    useState(false);

  const [view, setView] = useState(() =>
    getInitialView(value),
  );

  const todayIso = getTodayIso();

  const days = useMemo(
    () =>
      buildCalendarDays(
        view.year,
        view.month,
      ),
    [view.year, view.month],
  );

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (
        !wrapperRef.current?.contains(
          event.target,
        )
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handlePointerDown,
    );

    document.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handlePointerDown,
      );

      document.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [isOpen]);

  const openCalendar = () => {
    if (disabled) {
      return;
    }

    setView(getInitialView(value));

    setIsOpen((current) => !current);
  };

  const moveMonth = (amount) => {
    setView((current) =>
      shiftMonth(
        current.year,
        current.month,
        amount,
      ),
    );
  };

  const chooseDate = (
    iso,
    year,
    month,
  ) => {
    onChange(iso);

    setView({
      year,
      month,
    });

    setIsOpen(false);
  };

  const chooseToday = () => {
    const parsed =
      parseIsoDate(todayIso);

    if (!parsed) {
      return;
    }

    onChange(todayIso);

    setView({
      year: parsed.year,
      month: parsed.month,
    });

    setIsOpen(false);
  };

  const clearDate = () => {
    onChange("");
    setIsOpen(false);
  };

  return (
    <div
      ref={wrapperRef}
      className="relative z-50 min-w-0"
    >
      <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
        {label}
      </span>

      <button
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
          <CalendarDays
            size={15}
            strokeWidth={2.2}
          />
        </span>

        <span
          className={`min-w-0 flex-1 truncate text-sm font-bold ${
            value
              ? "text-sibs-primary-1"
              : "text-sibs-tertiary-5"
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

      {isOpen ? (
        <div
          role="dialog"
          aria-label={`${label} calendar`}
          className="absolute left-0 top-[calc(100%+8px)] z-[9999] w-[min(320px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-sibs-tertiary-9 bg-white shadow-[0_20px_55px_rgba(15,45,72,0.24)]"
        >
          <div className="flex items-center justify-between border-b border-sibs-tertiary-10 bg-sibs-primary-3/20 px-3 py-3">
            <button
              type="button"
              onClick={() =>
                moveMonth(-1)
              }
              className="flex h-8 w-8 items-center justify-center rounded-lg text-sibs-primary-1 transition hover:bg-white hover:shadow-sm"
              aria-label="Previous month"
            >
              <ChevronLeft size={17} />
            </button>

            <div className="text-center">
              <p className="m-0 text-sm font-extrabold text-sibs-primary-1">
                {getMonthLabel(
                  view.year,
                  view.month,
                )}
              </p>

              <p className="mt-0.5 mb-0 text-[9px] font-bold uppercase tracking-[0.16em] text-sibs-tertiary-5">
                Select a date
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                moveMonth(1)
              }
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
                const isSelected =
                  day.iso === value;

                const isToday =
                  day.iso === todayIso;

                return (
                  <button
                    key={day.iso}
                    type="button"
                    onClick={() =>
                      chooseDate(
                        day.iso,
                        day.year,
                        day.month,
                      )
                    }
                    className={`relative flex aspect-square items-center justify-center rounded-lg text-xs font-bold transition-all duration-100 ${
                      isSelected
                        ? "bg-sibs-primary-1 text-white shadow-sm"
                        : day.inCurrentMonth
                          ? "text-sibs-primary-1 hover:bg-sibs-primary-3/60"
                          : "text-sibs-tertiary-6/55 hover:bg-sibs-tertiary-10/70"
                    }`}
                  >
                    {day.day}

                    {isToday &&
                    !isSelected ? (
                      <span className="absolute bottom-1 h-1 w-1 rounded-full bg-sibs-primary-1" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-sibs-tertiary-10 bg-sibs-tertiary-10/25 px-3 py-2.5">
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
              className="rounded-lg bg-sibs-primary-3/50 px-3 py-1.5 text-xs font-extrabold text-sibs-primary-1 transition hover:bg-sibs-primary-3"
            >
              Today
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}