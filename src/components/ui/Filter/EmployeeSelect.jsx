import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

export default function EmployeeSelect({
  value = [],
  onChange,
  options = [],
  placeholder = "All Matched Employees",
  disabled = false,
  className = "",
  buttonClassName = "h-9.5",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const listRef = useRef(null);

  // Normalize value to array
  const selectedList = Array.isArray(value)
    ? value
    : value
    ? [value]
    : [];

  const isNoneSelected = selectedList.includes("__NONE__");

  const isAllSelected =
    !isNoneSelected &&
    (selectedList.length === 0 ||
      (options.length > 0 && selectedList.length === options.length));

  // Close on outside click or Esc key
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
    if (isOpen && listRef.current && selectedList.length > 0) {
      const activeEl = listRef.current.querySelector("[data-selected='true']");
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [isOpen, selectedList]);

  const toggleAll = () => {
    if (isAllSelected) {
      // If currently full, uncheck all so user can pick individual employees
      onChange?.(["__NONE__"]);
    } else {
      // If none or some selected, select all ("full always")
      onChange?.([]);
    }
  };

  const toggleEmployee = (emp) => {
    if (isAllSelected) {
      // When all are checked (full), clicking one employee unchecks only that employee
      const remaining = options.filter((e) => e !== emp);
      onChange?.(remaining.length === 0 ? ["__NONE__"] : remaining);
      return;
    }

    if (isNoneSelected) {
      // When none are checked, check only this employee
      onChange?.([emp]);
      return;
    }

    if (selectedList.includes(emp)) {
      const remaining = selectedList.filter((e) => e !== emp);
      if (remaining.length === 0) {
        onChange?.(["__NONE__"]);
      } else {
        onChange?.(remaining);
      }
    } else {
      const updated = [...selectedList, emp];
      if (options.length > 0 && updated.length === options.length) {
        // If all employees are checked, reset to all
        onChange?.([]);
      } else {
        onChange?.(updated);
      }
    }
  };

  const isEmployeeChecked = (emp) => {
    // All employees checked by default (full checklist)
    if (isAllSelected) return true;
    if (isNoneSelected) return false;
    return selectedList.includes(emp);
  };

  // Label to show on trigger button
  const triggerLabel = () => {
    if (isAllSelected) {
      return placeholder;
    }
    if (isNoneSelected) {
      return "0 Employees Selected";
    }
    if (selectedList.length === 1) {
      return selectedList[0];
    }
    return `${selectedList.length} Employees Selected`;
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`group flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border bg-white px-3 text-left outline-none transition disabled:cursor-not-allowed disabled:opacity-50 ${buttonClassName} ${
          isOpen
            ? "border-[#18466b] ring-1 ring-[#18466b]"
            : "border-slate-200 hover:border-slate-300"
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <span
            className={`truncate text-xs sm:text-[13px] ${
              !isAllSelected ? "font-bold text-[#18466b]" : "font-medium text-slate-700"
            }`}
          >
            {triggerLabel()}
          </span>
          {/* Reflect employee count badge */}
          {options.length > 0 && (
            <span
              className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-extrabold transition-colors ${
                !isAllSelected
                  ? "bg-[#18466b] text-white"
                  : "bg-[#18466b]/10 text-[#18466b]"
              }`}
              title={
                isAllSelected
                  ? `All ${options.length} matched employees selected`
                  : `${isNoneSelected ? 0 : selectedList.length} of ${options.length} employees selected`
              }
            >
              {isAllSelected
                ? `${options.length}/${options.length}`
                : isNoneSelected
                ? `0/${options.length}`
                : `${selectedList.length}/${options.length}`}
            </span>
          )}
        </div>
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
          className="absolute top-full left-0 mt-1.5 z-50 max-h-60 w-full min-w-[220px] overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-[0_12px_32px_rgba(4,44,81,0.14)] [scrollbar-width:thin] [scrollbar-color:#042c51_#f1f5f9]"
        >
          {/* Default "All Matched Employees" option with total count reflection and checkbox */}
          <button
            type="button"
            data-selected={isAllSelected}
            onClick={toggleAll}
            className={`group/opt flex w-full cursor-pointer items-center px-3.5 py-2.5 text-left text-xs sm:text-[13px] transition-colors border-b border-slate-100 ${
              isAllSelected
                ? "bg-[#f2f7fb] font-semibold text-[#18466b] hover:bg-[#e8f1f7]"
                : "font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-950"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="truncate font-bold">{placeholder}</span>
              {options.length > 0 && (
                <span className="shrink-0 rounded-full bg-[#18466b]/10 px-2 py-0.5 text-[10px] font-extrabold text-[#18466b]">
                  {options.length} Employees
                </span>
              )}
            </div>
          </button>

          {options.map((emp) => {
            const isChecked = isEmployeeChecked(emp);

            return (
              <button
                key={emp}
                type="button"
                data-selected={isChecked}
                onClick={() => toggleEmployee(emp)}
                className={`group/opt flex w-full cursor-pointer items-center justify-between px-3.5 py-2.5 text-left text-xs sm:text-[13px] transition-colors ${
                  isChecked
                    ? "bg-[#f2f7fb]/70 font-semibold text-[#18466b] hover:bg-[#e8f1f7]"
                    : "font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                <span className="truncate pr-2">{emp}</span>
                <div
                  className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-[4px] border transition-all ${
                    isChecked
                      ? "border-[#18466b] bg-[#18466b] text-white shadow-2xs"
                      : "border-slate-300 bg-white group-hover/opt:border-[#18466b]/60"
                  }`}
                >
                  {isChecked && (
                    <Check size={12} strokeWidth={3} className="text-white" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
