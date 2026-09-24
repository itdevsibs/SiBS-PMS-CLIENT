import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export default function SingleSelectDropdown({
  label,
  value,
  onChange,
  options = [],
  placeholder = "Select...",
  disabled = false,
  className = "",
  buttonClassName = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const normalizedOptions = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === "object" && opt !== null) {
        return opt;
      }
      return { value: opt, label: String(opt) };
    });
  }, [options]);

  const selectedOption = useMemo(() => {
    return normalizedOptions.find((opt) => opt.value === value) || null;
  }, [normalizedOptions, value]);

  const displayText = selectedOption?.label || placeholder;

  const handleSelect = (optValue) => {
    const syntheticEvent = {
      target: { value: optValue },
      currentTarget: { value: optValue },
      value: optValue,
    };
    onChange?.(syntheticEvent);
    setIsOpen(false);
  };

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
        className={`group flex w-full cursor-pointer items-center justify-between gap-1.5 border bg-white text-left font-semibold outline-none transition disabled:cursor-not-allowed disabled:opacity-50 ${
          buttonClassName
            ? buttonClassName
            : "h-8 rounded-lg border-sibs-tertiary-8 px-2.5 text-xs"
        } ${
          isOpen
            ? "border-sibs-primary-1 ring-1 ring-sibs-primary-1/20"
            : "hover:border-sibs-primary-1 hover:bg-slate-50/50"
        }`}
      >
        <span
          className={`truncate min-w-0 flex-1 ${
            selectedOption
              ? "font-semibold text-sibs-primary-1"
              : "font-semibold text-slate-800"
          }`}
          title={displayText}
        >
          {displayText}
        </span>

        <ChevronDown
          size={14}
          className={`shrink-0 text-[#18466b] transition-transform duration-200 group-hover:text-sibs-primary-1 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-1 max-h-60 w-full min-w-full sm:min-w-[150px] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg shadow-slate-900/10">
          <div className="max-h-52 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:#0b3b68_#f1f5f9]">
            {normalizedOptions.map((opt) => {
              const isSelected = opt.value === value;

              return (
                <button
                  key={opt.value || opt.label}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`group/opt flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left text-xs transition-colors ${
                    isSelected
                      ? "bg-sky-50/70 font-bold text-sibs-primary-1 hover:bg-sky-50"
                      : "font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <span className="truncate pr-2">{opt.label}</span>
                  {isSelected && (
                    <Check size={14} className="shrink-0 text-sibs-primary-1" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
