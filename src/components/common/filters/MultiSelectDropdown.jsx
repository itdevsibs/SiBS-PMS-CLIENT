import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

// Helper to classify skill into quick category filters
function matchesSkillCategory(skillName, category) {
  const s = String(skillName || "");
  const isEnglish = /english/i.test(s);
  const hasNiv = /niv/i.test(s);
  const hasIv = /(^|[^a-zA-Z])IV($|[^a-zA-Z])/i.test(s) && !hasNiv;
  const hasAcs = /acs/i.test(s);

  const cat = String(category || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

  if (cat === "allenglish" || cat === "englishall" || cat === "english") {
    return isEnglish;
  }
  if (cat === "englishniv") {
    return isEnglish && hasNiv;
  }
  if (cat === "englishiv") {
    return isEnglish && hasIv;
  }
  if (cat === "englishacs") {
    return isEnglish && hasAcs;
  }
  if (cat === "nonenglish") {
    return !isEnglish;
  }
  if (cat === "nonenglishiv") {
    return !isEnglish && hasIv;
  }
  return false;
}

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
  menuClassName = "",
  enableSearchThreshold = 8,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef(null);
  const listContainerRef = useRef(null);

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

  // Separate category filters (e.g. All English, English NIV, Non English IV) from individual items
  const categoryOptions = useMemo(
    () => validOptions.filter((o) => o.isCategory),
    [validOptions],
  );

  const itemOptions = useMemo(
    () => validOptions.filter((o) => !o.isCategory),
    [validOptions],
  );

  const hasCategories = categoryOptions.length > 0;

  // Active checked category filters
  const activeCategories = useMemo(() => {
    return categoryOptions
      .filter((cat) => selectedList.includes(cat.value))
      .map((cat) => cat.value);
  }, [categoryOptions, selectedList]);

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

  // Reset scroll to top whenever the dropdown opens
  useEffect(() => {
    if (isOpen && listContainerRef.current) {
      listContainerRef.current.scrollTop = 0;
    }
  }, [isOpen]);

  const toggleAll = () => {
    if (isAllSelected) {
      onChange?.([]);
    } else {
      onChange?.(validOptions.map((o) => o.value));
    }
  };

  // When a category filter is clicked:
  // Automatically filters the skills below AND checks all matching skills already!
  const toggleCategory = (catValue) => {
    const isCatChecked = selectedList.includes(catValue);
    const matchingItems = itemOptions
      .filter((item) => matchesSkillCategory(item.value, catValue))
      .map((item) => item.value);

    if (isCatChecked) {
      // Uncheck category and uncheck its matching items
      const otherActiveCategories = activeCategories.filter((c) => c !== catValue);
      const nextSelected = selectedList.filter((v) => {
        if (v === catValue) return false;
        if (matchingItems.includes(v)) {
          return otherActiveCategories.some((otherCat) =>
            matchesSkillCategory(v, otherCat),
          );
        }
        return true;
      });
      onChange?.(nextSelected);
    } else {
      // Check category AND automatically check all its matching skills!
      const nextSelected = Array.from(
        new Set([...selectedList, catValue, ...matchingItems]),
      );
      onChange?.(nextSelected);
    }
  };

  // Toggle individual item
  const toggleOption = (optValue) => {
    if (selectedList.includes(optValue)) {
      const remaining = selectedList.filter((v) => v !== optValue);
      // Uncheck any category that included this item since it is no longer 100% selected
      const nextSelected = remaining.filter((v) => {
        if (categoryOptions.some((cat) => cat.value === v && matchesSkillCategory(optValue, v))) {
          return false;
        }
        return true;
      });
      onChange?.(nextSelected);
    } else {
      const updated = [...selectedList, optValue];
      onChange?.(updated);
    }
  };

  const isOptionChecked = (optValue) => {
    return selectedList.includes(optValue);
  };

  // Filter individual items:
  // When category filters are active, ONLY matching skills are displayed!
  const visibleItemOptions = useMemo(() => {
    let list = itemOptions;
    if (activeCategories.length > 0) {
      list = list.filter((item) =>
        activeCategories.some((cat) => matchesSkillCategory(item.value, cat)),
      );
    }
    if (searchTerm) {
      const term = searchTerm.trim().toLowerCase();
      list = list.filter(
        (opt) =>
          opt.label.toLowerCase().includes(term) ||
          String(opt.value || "").toLowerCase().includes(term),
      );
    }
    return list;
  }, [itemOptions, activeCategories, searchTerm]);

  // Filter category options if search is active
  const filteredCategoryOptions = useMemo(() => {
    if (!searchTerm) return categoryOptions;
    const term = searchTerm.trim().toLowerCase();
    return categoryOptions.filter(
      (opt) =>
        opt.label.toLowerCase().includes(term) ||
        String(opt.value || "").toLowerCase().includes(term),
    );
  }, [categoryOptions, searchTerm]);

  // Fallback filtered options when no categories exist
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
      return placeholder || allOptionLabel;
    }
    if (isAllSelected) {
      return allOptionLabel || placeholder;
    }
    if (hasCategories && activeCategories.length > 0) {
      if (activeCategories.length === 1) {
        const matchingCount = itemOptions.filter((item) =>
          selectedList.includes(item.value),
        ).length;
        return `${activeCategories[0]}${matchingCount > 0 ? ` (${matchingCount})` : ""}`;
      }
      return `${activeCategories.length} Categories (${selectedList.length})`;
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
  }, [selectedList, isAllSelected, options, allOptionLabel, placeholder, hasCategories, activeCategories, itemOptions]);

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
        <div
          className={`absolute top-full left-0 z-50 mt-1 flex flex-col max-h-[min(88vh,620px)] w-max min-w-[min(300px,calc(100vw-1.5rem))] max-w-[min(95vw,520px)] rounded-xl border border-slate-200 bg-white py-1 shadow-xl shadow-slate-900/15 ${menuClassName}`}
        >
          {/* Search input for large lists */}
          {validOptions.length > enableSearchThreshold && (
            <div className="shrink-0 border-b border-slate-100 px-2.5 pb-2 pt-1">
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

          {/* If Dropdown has Category Filters (Skill dropdown) */}
          {hasCategories ? (
            <>
              {/* 1. FIXED TOP SECTION (Never scrolls away!) */}
              <div className="shrink-0">
                {/* All Option row */}
                {!searchTerm && (
                  <button
                    type="button"
                    onClick={toggleAll}
                    className={`group/opt flex w-full cursor-pointer items-center justify-between border-b border-slate-100 px-3 py-1.5 text-left text-xs transition-colors ${
                      isAllSelected
                        ? "bg-sky-50/70 font-bold text-sibs-primary-1 hover:bg-sky-50"
                        : "font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0 pr-2.5">
                      <span className="whitespace-nowrap">{allOptionLabel || placeholder}</span>
                      <span className="shrink-0 rounded-full bg-slate-200/70 px-1.5 py-0.2 text-[9px] font-extrabold text-slate-600">
                        {itemOptions.length}
                      </span>
                    </div>

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

                {/* Quick Category Filters Section */}
                {filteredCategoryOptions.length > 0 && (
                  <div className="border-b border-slate-200/80 bg-slate-50/30 pb-0.5">
                    <div className="flex items-center justify-between bg-slate-100/70 px-3 py-1 text-[9.5px] font-extrabold uppercase tracking-wider text-sibs-tertiary-5">
                      <span className="flex items-center gap-1">
                        <span>Quick Category Filters</span>
                      </span>
                      <span className="text-[8.5px] font-semibold text-slate-400">
                        Auto-selects matching skills
                      </span>
                    </div>

                    {filteredCategoryOptions.map((opt) => {
                      const isChecked = isOptionChecked(opt.value);
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => toggleCategory(opt.value)}
                          className={`group/opt flex w-full cursor-pointer items-center justify-between px-3 py-1.5 text-left text-xs transition-colors ${
                            isChecked
                              ? "bg-sky-50/70 font-bold text-sibs-primary-1 hover:bg-sky-50"
                              : "font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2.5">
                            <span
                              className={`h-1.5 w-1.5 rounded-full shrink-0 transition-all ${
                                isChecked
                                  ? "bg-sibs-primary-1 ring-2 ring-sibs-primary-1/20"
                                  : "bg-slate-300 group-hover/opt:bg-sibs-primary-1/50"
                              }`}
                            />
                            <span className="whitespace-nowrap text-xs">{opt.label}</span>
                          </div>

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
                    })}
                  </div>
                )}

                {/* Divider & Header for Individual Skills */}
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-3 py-1 text-[9.5px] font-extrabold uppercase tracking-wider text-sibs-tertiary-5">
                  <span>
                    {activeCategories.length > 0 ? "Filtered Skills" : "Individual Skills"}
                  </span>
                  <span className="text-[9px] font-bold text-slate-500">
                    {visibleItemOptions.length} {visibleItemOptions.length === 1 ? "skill" : "skills"}
                  </span>
                </div>
              </div>

              {/* 2. SCROLLABLE INDIVIDUAL SKILLS LIST (Longer container!) */}
              <div
                ref={listContainerRef}
                className="max-h-[min(48vh,360px)] min-h-[140px] overflow-y-auto [scrollbar-width:thin] [scrollbar-color:#0b3b68_#f1f5f9]"
              >
                {visibleItemOptions.length > 0 ? (
                  visibleItemOptions.map((opt) => {
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
                        <span
                          className="whitespace-nowrap pr-2.5 text-xs text-slate-700"
                          title={opt.label}
                        >
                          {opt.label}
                        </span>

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
                  <div className="px-3 py-4 text-center text-xs text-slate-400">
                    No matching skills
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Standard rendering when dropdown has no categories (e.g. Country, Task Order, Source) */
            <>
              {/* All Option row */}
              {!searchTerm && (
                <div className="shrink-0">
                  <button
                    type="button"
                    onClick={toggleAll}
                    className={`group/opt flex w-full cursor-pointer items-center justify-between border-b border-slate-100 px-3 py-1.5 text-left text-xs transition-colors ${
                      isAllSelected
                        ? "bg-sky-50/70 font-bold text-sibs-primary-1 hover:bg-sky-50"
                        : "font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0 pr-2.5">
                      <span className="whitespace-nowrap">{allOptionLabel || placeholder}</span>
                      <span className="shrink-0 rounded-full bg-slate-200/70 px-1.5 py-0.2 text-[9px] font-extrabold text-slate-600">
                        {validOptions.length}
                      </span>
                    </div>

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
                </div>
              )}

              {/* Scrollable Items */}
              <div
                ref={listContainerRef}
                className="max-h-[min(65vh,440px)] overflow-y-auto [scrollbar-width:thin] [scrollbar-color:#0b3b68_#f1f5f9]"
              >
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
                        <span className="whitespace-nowrap pr-2.5 text-xs" title={opt.label}>
                          {opt.label}
                        </span>

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
            </>
          )}
        </div>
      )}
    </div>
  );
}
