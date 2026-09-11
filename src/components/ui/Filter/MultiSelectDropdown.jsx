import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

export default function MultiSelectDropdown({
  label,
  value = [],
  onChange,
  options = [],
  placeholder = "Select...",
  allOptionLabel = "All",
  disabled = false,
  className = "",
  buttonClassName = "",
  enableSearchThreshold = 8,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef(null);

  // Normalize value to array of checked values
  const selectedList = useMemo(() => {
    if (Array.isArray(value)) {
      return value.filter((v) => v && v !== "__NONE__");
    }
    if (value && typeof value === "string") {
      return value
        .split(",")
        .map((s) => s.trim())
        .filter((v) => v && v !== "__NONE__");
    }
    return [];
  }, [value]);

  // Valid options (excluding empty placeholder options)
  const validOptions = useMemo(
    () => options.filter((o) => o.value !== ""),
    [options],
  );

  // All options are explicitly checked only when every valid option is in selectedList
  const isAllSelected = useMemo(() => {
    if (!validOptions.length || !selectedList.length) return false;
    return validOptions.every((opt) => selectedList.includes(opt.value));
  }, [validOptions, selectedList]);

  // Close on outside click or Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const toggleAll = () => {
    if (isAllSelected) {
      // If all are checked, uncheck all (empty array = no check)
      onChange?.([]);
    } else {
      // Check all valid options
      onChange?.(validOptions.map((o) => o.value));
    }
  };

  const toggleOption = (optValue) => {
    if (selectedList.includes(optValue)) {
      const remaining = selectedList.filter((v) => v !== optValue);
      onChange?.(remaining);
    } else {
      const updated = [...selectedList, optValue];
      onChange?.(updated);
    }
  };

  const isOptionChecked = (optValue) => {
    // Only checked if explicitly in selectedList (default is NO check)
    return selectedList.includes(optValue);
  };

  // Filter options if search is enabled
  const filteredOptions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return validOptions;
    return validOptions.filter(
      (opt) =>
        opt.label.toLowerCase().includes(term) ||
        String(opt.value || "").toLowerCase().includes(term),
    );
  }, [validOptions, searchTerm]);

  // Display label on trigger button
  const triggerText = useMemo(() => {
    if (selectedList.length === 0) {
      return allOptionLabel || placeholder;
    }
    if (isAllSelected) {
      return allOptionLabel || placeholder;
    }
    if (selectedList.length === 1) {
      const match = options.find((o) => o.value === selectedList[0]);
      return match?.label || selectedList[0];
    }
    if (selectedList.length === 2) {
      const match1 = options.find((o) => o.value === selectedList[0]);
      const match2 = options.find((o) => o.value === selectedList[1]);
      if (match1 && match2 && match1.label.length + match2.label.length < 22) {
        return `${match1.label}, ${match2.label}`;
      }
    }
    return `${selectedList.length} Selected`;
  }, [selectedList, isAllSelected, options, allOptionLabel, placeholder]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <span className="mb-0.5 block text-[9.5px] font-extrabold uppercase text-sibs-tertiary-5">
          {label}
        </span>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`group flex h-8 w-full cursor-pointer items-center justify-between gap-1.5 rounded-lg border bg-white px-2.5 text-left text-xs font-semibold outline-none transition disabled:cursor-not-allowed disabled:opacity-50 ${
          isOpen
            ? "border-sibs-primary-1 ring-1 ring-sibs-primary-1/20"
            : "border-sibs-tertiary-8 hover:border-sibs-primary-1 hover:bg-slate-50/50"
        } ${buttonClassName}`}
      >
        <span
          className={`truncate min-w-0 flex-1 text-xs ${
            selectedList.length > 0
              ? "font-bold text-sibs-primary-1"
              : "font-semibold text-slate-800"
          }`}
          title={triggerText}
        >
          {triggerText}
        </span>

        <div className="flex items-center gap-1 shrink-0">
          {/* Active selection count badge only when options are checked */}
          {selectedList.length > 0 && (
            <span className="shrink-0 rounded-full bg-sibs-primary-1 px-1.5 py-0.2 text-[9px] font-extrabold text-white transition-colors">
              {isAllSelected ? "All" : selectedList.length}
            </span>
          )}

          <ChevronDown
            size={13}
            className={`shrink-0 text-slate-500 transition-transform duration-200 group-hover:text-sibs-primary-1 ${
              isOpen ? "rotate-180 text-sibs-primary-1" : ""
            }`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-1 max-h-64 w-full min-w-[200px] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg shadow-slate-900/10">
          {/* Optional search input for large lists */}
          {validOptions.length > enableSearchThreshold && (
            <div className="border-b border-slate-100 px-2 pb-1.5 pt-1">
              <div className="relative flex h-7 items-center rounded-md border border-slate-200 bg-slate-50/80 px-2">
                <Search size={12} className="shrink-0 text-slate-400 mr-1.5" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-transparent text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none"
                  autoFocus
                />
              </div>
            </div>
          )}

          <div className="max-h-52 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:#0b3b68_#f1f5f9]">
            {/* 1. All Option row with Checkbox on the right (NO check by default) */}
            {!searchTerm && (
              <button
                type="button"
                onClick={toggleAll}
                className={`group/opt flex w-full cursor-pointer items-center justify-between border-b border-slate-100 px-3 py-2 text-left text-xs transition-colors ${
                  isAllSelected
                    ? "bg-sky-50/70 font-bold text-sibs-primary-1 hover:bg-sky-50"
                    : "font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="truncate">{allOptionLabel || placeholder}</span>
                  <span className="shrink-0 rounded-full bg-slate-200/70 px-1.5 py-0.2 text-[9px] font-extrabold text-slate-600">
                    {validOptions.length}
                  </span>
                </div>

                {/* Checkbox on the right side - UNCHECKED by default */}
                <div
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all ${
                    isAllSelected
                      ? "border-sibs-primary-1 bg-sibs-primary-1 text-white shadow-2xs"
                      : "border-slate-300 bg-white group-hover/opt:border-sibs-primary-1/60"
                  }`}
                >
                  {isAllSelected && (
                    <Check size={11} strokeWidth={3} className="text-white" />
                  )}
                </div>
              </button>
            )}

            {/* 2. Individual options with Checkbox on the right (NO check by default) */}
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isChecked = isOptionChecked(opt.value);

                return (
                  <button
                    key={opt.value || opt.label}
                    type="button"
                    onClick={() => toggleOption(opt.value)}
                    className={`group/opt flex w-full cursor-pointer items-center justify-between px-3 py-1.5 text-left text-xs transition-colors ${
                      isChecked
                        ? "bg-sky-50/50 font-bold text-sibs-primary-1 hover:bg-sky-50"
                        : "font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <span className="truncate pr-2">{opt.label}</span>

                    {/* Checkbox on the right side */}
                    <div
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all ${
                        isChecked
                          ? "border-sibs-primary-1 bg-sibs-primary-1 text-white shadow-2xs"
                          : "border-slate-300 bg-white group-hover/opt:border-sibs-primary-1/60"
                      }`}
                    >
                      {isChecked && (
                        <Check size={11} strokeWidth={3} className="text-white" />
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-3 text-center text-xs text-slate-400">
                No matching options
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
