import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export const DEFAULT_TIME_OPTIONS = [
  "12:00 AM",
  "01:00 AM",
  "02:00 AM",
  "03:00 AM",
  "04:00 AM",
  "05:00 AM",
  "06:00 AM",
  "07:00 AM",
  "08:00 AM",
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
  "06:00 PM",
  "07:00 PM",
  "08:00 PM",
  "09:00 PM",
  "10:00 PM",
  "11:00 PM",
];

export function TimeSelect({
  value,
  onChange,
  placeholder = "Select time...",
  options = DEFAULT_TIME_OPTIONS,
  disabled = false,
  className = "",
  buttonClassName = "h-9.5 w-full sm:min-w-[120px]",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const listRef = useRef(null);

  // Close on outside click or Esc
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Scroll active item into view when dropdown opens
  useEffect(() => {
    if (isOpen && listRef.current && value) {
      const activeEl = listRef.current.querySelector("[data-selected='true']");
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [isOpen, value]);

  const handleSelect = (time) => {
    if (time === value) {
      onChange?.("");
    } else {
      onChange?.(time);
    }
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`group flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border bg-white px-2.5 sm:px-3 text-left outline-none transition disabled:cursor-not-allowed disabled:opacity-50 ${buttonClassName} ${
          isOpen
            ? "border-[#18466b] ring-1 ring-[#18466b]"
            : "border-slate-200 hover:border-slate-300"
        }`}
      >
        <span
          className={`truncate text-xs sm:text-[13px] ${
            value ? "font-bold text-[#18466b]" : "font-medium text-slate-400"
          }`}
        >
          {value || placeholder}
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-[#18466b] transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          ref={listRef}
          className="absolute top-full left-0 mt-1.5 z-50 max-h-56 w-full min-w-[130px] max-w-[calc(100vw-32px)] overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-[0_12px_32px_rgba(4,44,81,0.14)] [scrollbar-width:thin] [scrollbar-color:#042c51_#f1f5f9]"
        >
          {value && (
            <button
              type="button"
              onClick={() => handleSelect("")}
              className="flex w-full cursor-pointer items-center justify-between border-b border-slate-100 px-3.5 py-1.5 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <span>Clear time</span>
              <span className="text-[10px] text-rose-400 font-normal">reset</span>
            </button>
          )}
          {options.map((time) => {
            const isSelected = time === value;

            return (
              <button
                key={time}
                type="button"
                data-selected={isSelected}
                onClick={() => handleSelect(time)}
                className={`flex w-full cursor-pointer items-center justify-between px-3.5 py-2 text-left text-xs sm:text-[13px] transition-colors ${
                  isSelected
                    ? "bg-[#e6f0f8] font-bold text-[#18466b] hover:bg-[#dce9f4]"
                    : "font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                <span>{time}</span>
                {isSelected && (
                  <Check
                    size={14}
                    className="text-[#18466b] shrink-0 stroke-[2.5]"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function TimeRangePicker({
  label = "Time Range",
  labelClassName = "text-xs font-bold text-slate-800 block mb-1.5",
  fromTime = "",
  toTime = "",
  onFromChange,
  onToChange,
  fromPlaceholder = "From time...",
  toPlaceholder = "To time...",
  options = DEFAULT_TIME_OPTIONS,
  disabled = false,
  className = "",
  buttonClassName = "h-9.5 w-full sm:min-w-[120px]",
}) {
  return (
    <div className={`w-full sm:w-auto min-w-0 sm:min-w-[260px] ${className}`}>
      {label && <label className={labelClassName}>{label}</label>}

      <div className="flex items-center gap-1.5 sm:gap-2 w-full">
        <div className="flex-1 min-w-0">
          <TimeSelect
            value={fromTime}
            onChange={onFromChange}
            placeholder={fromPlaceholder}
            options={options}
            disabled={disabled}
            buttonClassName={buttonClassName}
          />
        </div>

        <span className="shrink-0 text-xs font-medium text-slate-500">to</span>

        <div className="flex-1 min-w-0">
          <TimeSelect
            value={toTime}
            onChange={onToChange}
            placeholder={toPlaceholder}
            options={options}
            disabled={disabled}
            buttonClassName={buttonClassName}
          />
        </div>
      </div>
    </div>
  );
}

