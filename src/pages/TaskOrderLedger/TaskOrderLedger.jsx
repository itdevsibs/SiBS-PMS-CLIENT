// Task-Order Ledger module for Workforce Management.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  Loader2,
  RotateCcw,
  Search,
  X,
} from "lucide-react";

import AdminSidebar from "@/components/layout/AdminSidebar";
import AppHeader from "@/components/layout/AppHeader";
import ConfirmationModal from "@/components/ui/confirmation-modal";
import LoadingModal from "@/components/ui/loading-modal";
import TablePagination from "@/components/tables/TablePagination";
import useDashboardPage from "@/hooks/useDashboardPage";
import { getAuthDisplayName } from "@/lib/auth";
import { fetchTaskOrderLedger } from "@/lib/axios/task-order-ledger";

const TASK_ORDER_OPTIONS = [
  "All Task Orders",
  "GSS 2.0 TO10 - SEASIA",
  "GSS 2.0 TO12 - NICE",
  "GSS 2.0 TO14 - NESAMI",
  "GSS 2.0 TO4 - PAC",
  "GSS 2.0 TO16 - SEURECA",
];

export default function TaskOrderLedger() {
  const dashboard = useDashboardPage();
  const userName = dashboard.userName || getAuthDisplayName(dashboard.authUser);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTaskOrder, setSelectedTaskOrder] = useState("All Task Orders");
  const [selectedCountry, setSelectedCountry] = useState("All Countries");
  const [selectedSkill, setSelectedSkill] = useState("All Skills");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [isSkillDropdownOpen, setIsSkillDropdownOpen] = useState(false);
  const [countrySearchTerm, setCountrySearchTerm] = useState("");
  const [skillSearchTerm, setSkillSearchTerm] = useState("");
  const [taskOrderAllRecords, setTaskOrderAllRecords] = useState([]);
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const dropdownRef = useRef(null);
  const countryDropdownRef = useRef(null);
  const skillDropdownRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (
        countryDropdownRef.current &&
        !countryDropdownRef.current.contains(event.target)
      ) {
        setIsCountryDropdownOpen(false);
        setCountrySearchTerm("");
      }
      if (
        skillDropdownRef.current &&
        !skillDropdownRef.current.contains(event.target)
      ) {
        setIsSkillDropdownOpen(false);
        setSkillSearchTerm("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch full records for the selected Task Order to build available countries and skills
  useEffect(() => {
    let isCancelled = false;

    async function fetchOptionsForTaskOrder() {
      try {
        const response = await fetchTaskOrderLedger({
          taskOrder:
            selectedTaskOrder === "All Task Orders" ? null : selectedTaskOrder,
        });

        const data =
          response?.data && Array.isArray(response.data)
            ? response.data
            : Array.isArray(response)
            ? response
            : [];

        if (!isCancelled) {
          setTaskOrderAllRecords(data);
        }
      } catch (err) {
        console.error("Failed to fetch task order options:", err);
      }
    }

    void fetchOptionsForTaskOrder();

    return () => {
      isCancelled = true;
    };
  }, [selectedTaskOrder]);

  // Reset selected country & skill when Task Order changes
  useEffect(() => {
    setSelectedCountry("All Countries");
    setSelectedSkill("All Skills");
    setCountrySearchTerm("");
    setSkillSearchTerm("");
  }, [selectedTaskOrder]);

  // Reset selected skill when Country changes
  useEffect(() => {
    setSelectedSkill("All Skills");
    setSkillSearchTerm("");
  }, [selectedCountry]);

  // Unique country options derived from taskOrderAllRecords
  const availableCountries = useMemo(() => {
    const set = new Set();
    taskOrderAllRecords.forEach((item) => {
      const c = String(item.country || "").trim();
      if (c) set.add(c);
    });
    return ["All Countries", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [taskOrderAllRecords]);

  // Unique skill options derived from taskOrderAllRecords (filtered by selectedCountry if set)
  const availableSkills = useMemo(() => {
    const set = new Set();
    taskOrderAllRecords.forEach((item) => {
      if (
        selectedCountry === "All Countries" ||
        String(item.country || "").trim().toUpperCase() ===
          selectedCountry.trim().toUpperCase()
      ) {
        const s = String(item.skill || "").trim();
        if (s) set.add(s);
      }
    });
    return ["All Skills", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [taskOrderAllRecords, selectedCountry]);

  // Filter countries based on user search in dropdown
  const filteredCountryOptions = useMemo(() => {
    const term = countrySearchTerm.trim().toLowerCase();
    if (!term) return availableCountries;
    return availableCountries.filter(
      (opt) => opt === "All Countries" || opt.toLowerCase().includes(term),
    );
  }, [availableCountries, countrySearchTerm]);

  // Filter skills based on user search in dropdown
  const filteredSkillOptions = useMemo(() => {
    const term = skillSearchTerm.trim().toLowerCase();
    if (!term) return availableSkills;
    return availableSkills.filter(
      (opt) => opt === "All Skills" || opt.toLowerCase().includes(term),
    );
  }, [availableSkills, skillSearchTerm]);

  // Fetch task order ledger data from API
  const loadLedgerRecords = useCallback(
    async (taskOrder, country, skill, search) => {
      setIsLoading(true);
      setErrorMsg("");

      try {
        const response = await fetchTaskOrderLedger({
          taskOrder: taskOrder === "All Task Orders" ? null : taskOrder,
          country: country === "All Countries" ? null : country,
          skill: skill === "All Skills" ? null : skill,
          search,
        });

        if (response?.data && Array.isArray(response.data)) {
          setRecords(response.data);
        } else if (Array.isArray(response)) {
          setRecords(response);
        } else {
          setRecords([]);
        }
      } catch (err) {
        console.error("Failed to load task order ledger records:", err);
        setErrorMsg(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to load task order records.",
        );
        setRecords([]);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // Trigger fetch whenever filter, country, skill, or search term changes
  useEffect(() => {
    const handler = setTimeout(() => {
      void loadLedgerRecords(
        selectedTaskOrder,
        selectedCountry,
        selectedSkill,
        searchTerm,
      );
    }, 250);

    return () => clearTimeout(handler);
  }, [
    selectedTaskOrder,
    selectedCountry,
    selectedSkill,
    searchTerm,
    loadLedgerRecords,
  ]);

  // Pagination state (using reusable TablePagination component)
  const PAGE_SIZE = 18;
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 whenever filter or search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTaskOrder, selectedCountry, selectedSkill, searchTerm]);

  const totalItems = records.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return records.slice(startIndex, startIndex + PAGE_SIZE);
  }, [records, currentPage, PAGE_SIZE]);

  const handleReset = () => {
    setSearchTerm("");
    setSelectedTaskOrder("All Task Orders");
    setSelectedCountry("All Countries");
    setSelectedSkill("All Skills");
    setCountrySearchTerm("");
    setSkillSearchTerm("");
    setIsDropdownOpen(false);
    setIsCountryDropdownOpen(false);
    setIsSkillDropdownOpen(false);
    setCurrentPage(1);
  };

  return (
    <section className="font-jakarta flex h-screen max-h-[100dvh] min-h-screen bg-[#eef3f7] text-sibs-primary-1 overflow-hidden">
      <AdminSidebar
        isMobileOpen={dashboard.isMobileSidebarOpen}
        modules={dashboard.modules}
        onLogoutClick={() => dashboard.setShowLogoutModal(true)}
        onMobileClose={() => dashboard.setIsMobileSidebarOpen(false)}
        userName={userName}
        userRole={
          dashboard.authUser?.email ||
          dashboard.authUser?.roleLabel ||
          "Workforce Management"
        }
      />

      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <AppHeader
          title={
            <>
              <span className="sm:hidden">Task-Order Ledger</span>
              <span className="hidden sm:inline">
                Task-Order Ledger
              </span>
            </>
          }
          subtitle="Workforce Management System"
          userName={userName}
          onMenuClick={() => dashboard.setIsMobileSidebarOpen(true)}
          onLogoutClick={() => dashboard.setShowLogoutModal(true)}
        />

        <main className="flex flex-1 min-h-0 flex-col gap-2.5 sm:gap-3 overflow-hidden px-2.5 sm:px-4 lg:px-5 pt-2.5 sm:pt-3 pb-2">
          {/* ── Toolbar ────────────────────────────────────────────── */}
          <div className="shrink-0 flex flex-col lg:flex-row lg:items-center gap-2.5 sm:gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:px-4 sm:py-3 shadow-xs">
            {/* Task Order select + Skill select + Reset (Left) */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0 w-full lg:w-auto">
              {/* Task Order Dropdown */}
              <div className="relative flex-1 sm:w-44 md:w-52 lg:w-56 sm:flex-none" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen((prev) => !prev);
                    setIsCountryDropdownOpen(false);
                    setIsSkillDropdownOpen(false);
                  }}
                  title="Click to select task order"
                  className="flex h-9 w-full sm:w-44 md:w-52 lg:w-56 cursor-pointer items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-100 focus:border-[#0b3b68] focus:outline-none"
                >
                  <span className="truncate">{selectedTaskOrder}</span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-slate-400 transition-transform ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute left-0 top-full z-50 mt-1 max-h-96 w-full sm:w-60 md:w-64 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg shadow-slate-900/10">
                    <div className="overflow-y-auto max-h-72 sibs-scrollbar">
                      {TASK_ORDER_OPTIONS.map((option) => {
                        const isSelected = selectedTaskOrder === option;
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => {
                              setSelectedTaskOrder(option);
                              setIsDropdownOpen(false);
                            }}
                            className={`flex w-full cursor-pointer items-center justify-between px-3 py-2 text-xs text-left transition ${
                              isSelected
                                ? "bg-sky-50 font-bold text-[#0b3b68]"
                                : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                            }`}
                          >
                            <span className="truncate">{option}</span>
                            {isSelected && (
                              <Check className="h-3.5 w-3.5 text-[#0b3b68]" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Country Dropdown (Between All Task Orders and All Skills) */}
              <div className="relative flex-1 sm:w-40 md:w-48 lg:w-52 sm:flex-none" ref={countryDropdownRef}>
                <button
                  type="button"
                  onClick={() => {
                    setIsCountryDropdownOpen((prev) => !prev);
                    setIsDropdownOpen(false);
                    setIsSkillDropdownOpen(false);
                  }}
                  title="Click to select country"
                  className="flex h-9 w-full sm:w-40 md:w-48 lg:w-52 cursor-pointer items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-100 focus:border-[#0b3b68] focus:outline-none"
                >
                  <span className="truncate">{selectedCountry}</span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-slate-400 transition-transform ${
                      isCountryDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Country Dropdown Menu with Search */}
                {isCountryDropdownOpen && (
                  <div className="absolute left-0 top-full z-50 mt-1 max-h-96 w-full sm:w-60 md:w-64 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg shadow-slate-900/10">
                    <div className="border-b border-slate-100 p-1.5">
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                        <input
                          type="text"
                          value={countrySearchTerm}
                          onChange={(e) => setCountrySearchTerm(e.target.value)}
                          placeholder="Search countries…"
                          className="h-7.5 w-full rounded-md border border-slate-200 bg-slate-50 pl-7 pr-7 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#0b3b68] focus:bg-white focus:outline-none"
                        />
                        {countrySearchTerm && (
                          <button
                            type="button"
                            onClick={() => setCountrySearchTerm("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="overflow-y-auto max-h-72 sibs-scrollbar">
                      {filteredCountryOptions.length === 0 ? (
                        <div className="px-3 py-4 text-center text-xs text-slate-400">
                          No matching countries found
                        </div>
                      ) : (
                        filteredCountryOptions.map((option) => {
                          const isSelected = selectedCountry === option;
                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() => {
                                setSelectedCountry(option);
                                setIsCountryDropdownOpen(false);
                                setCountrySearchTerm("");
                              }}
                              className={`flex w-full cursor-pointer items-center justify-between px-3 py-2 text-xs text-left transition ${
                                isSelected
                                  ? "bg-sky-50 font-bold text-[#0b3b68]"
                                  : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                              }`}
                            >
                              <span className="truncate">{option}</span>
                              {isSelected && (
                                <Check className="h-3.5 w-3.5 text-[#0b3b68]" />
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Skill Dropdown */}
              <div className="relative flex-1 sm:w-44 md:w-52 lg:w-56 sm:flex-none" ref={skillDropdownRef}>
                <button
                  type="button"
                  onClick={() => {
                    setIsSkillDropdownOpen((prev) => !prev);
                    setIsDropdownOpen(false);
                    setIsCountryDropdownOpen(false);
                  }}
                  title="Click to select skill"
                  className="flex h-9 w-full sm:w-44 md:w-52 lg:w-56 cursor-pointer items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-100 focus:border-[#0b3b68] focus:outline-none"
                >
                  <span className="truncate">{selectedSkill}</span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-slate-400 transition-transform ${
                      isSkillDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Skill Dropdown Menu with Search */}
                {isSkillDropdownOpen && (
                  <div className="absolute left-0 top-full z-50 mt-1 max-h-96 w-full sm:w-64 md:w-72 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg shadow-slate-900/10">
                    <div className="border-b border-slate-100 p-1.5">
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                        <input
                          type="text"
                          value={skillSearchTerm}
                          onChange={(e) => setSkillSearchTerm(e.target.value)}
                          placeholder="Search skills…"
                          className="h-7.5 w-full rounded-md border border-slate-200 bg-slate-50 pl-7 pr-7 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#0b3b68] focus:bg-white focus:outline-none"
                        />
                        {skillSearchTerm && (
                          <button
                            type="button"
                            onClick={() => setSkillSearchTerm("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="overflow-y-auto max-h-72 sibs-scrollbar">
                      {filteredSkillOptions.length === 0 ? (
                        <div className="px-3 py-4 text-center text-xs text-slate-400">
                          No matching skills found
                        </div>
                      ) : (
                        filteredSkillOptions.map((option) => {
                          const isSelected = selectedSkill === option;
                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() => {
                                setSelectedSkill(option);
                                setIsSkillDropdownOpen(false);
                                setSkillSearchTerm("");
                              }}
                              className={`flex w-full cursor-pointer items-center justify-between px-3 py-2 text-xs text-left transition ${
                                isSelected
                                  ? "bg-sky-50 font-bold text-[#0b3b68]"
                                  : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                              }`}
                            >
                              <span className="truncate">{option}</span>
                              {isSelected && (
                                <Check className="h-3.5 w-3.5 text-[#0b3b68]" />
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-600 hover:bg-slate-100 transition cursor-pointer shrink-0"
              >
                <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
                Reset
              </button>
            </div>

            {/* Search (Middle) */}
            <div className="relative flex-1 w-full min-w-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by skill, country, or task order…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-8 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#0b3b68] focus:bg-white focus:ring-2 focus:ring-[#0b3b68]/10 focus:outline-none transition"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* ── Table Card ─────────────────────────────────────────── */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
            {/* Table wrapper without slider/scrollbar */}
            <div
              className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              <table className="w-full table-fixed text-left text-xs border-collapse">
                <colgroup>
                  <col style={{ width: "28%" }} />
                  <col style={{ width: "42%" }} />
                  <col style={{ width: "30%" }} />
                </colgroup>
                {/* ── Table head ──────────────────────────────────── */}
                <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 shadow-xs">
                  <tr>
                    <th className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-600 whitespace-nowrap overflow-hidden">
                      COUNTRY
                    </th>
                    <th className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-600 whitespace-nowrap overflow-hidden">
                      SKILLS
                    </th>
                    <th className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-600 whitespace-nowrap overflow-hidden">
                      TASK ORDER
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  {isLoading ? (
                    <tr>
                      <td colSpan={3} className="py-20 text-center text-xs text-slate-400">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-[#ff5c28]" />
                          <span>Loading task order ledger records…</span>
                        </div>
                      </td>
                    </tr>
                  ) : errorMsg ? (
                    <tr>
                      <td colSpan={3} className="py-16 text-center text-xs text-rose-500 font-semibold">
                        {errorMsg}
                      </td>
                    </tr>
                  ) : records.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="py-20 text-center text-xs font-semibold text-slate-400"
                      >
                        No task order records found for the selected filter.
                      </td>
                    </tr>
                  ) : (
                    paginatedRecords.map((item, idx) => (
                      <tr
                        key={item.id || idx}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="px-6 py-1.5 sm:py-2 text-slate-900 font-semibold truncate" title={item.country}>
                          {item.country}
                        </td>
                        <td className="px-6 py-1.5 sm:py-2 text-slate-700 font-medium truncate" title={item.skill}>
                          {item.skill}
                        </td>
                        <td className="px-6 py-1.5 sm:py-2">
                          <span className="inline-flex items-center rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[10.5px] font-bold text-blue-700">
                            {item.task_order || "GSS 2.0 TO10 - SEASIA"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Reusable Clean Table Pagination Footer */}
            {!isLoading && !errorMsg && totalItems > 0 && (
              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={PAGE_SIZE}
                onPageChange={setCurrentPage}
                itemLabel="records"
                className="shrink-0"
              />
            )}
          </div>
        </main>
      </div>

      <ConfirmationModal
        isOpen={dashboard.showLogoutModal}
        title="Confirm logout"
        message="Are you sure you want to logout?"
        cancelText="Cancel"
        confirmText="Logout"
        onCancel={() => dashboard.setShowLogoutModal(false)}
        onConfirm={dashboard.handleLogout}
        tone="neutral"
      />

      <LoadingModal
        isOpen={dashboard.isLoggingOut}
        title="Logging out"
        message="Please wait while we end your session."
      />
    </section>
  );
}
