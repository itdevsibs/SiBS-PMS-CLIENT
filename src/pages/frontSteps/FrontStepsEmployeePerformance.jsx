import React, { useMemo, useState } from "react";
import {
  Users,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  RotateCcw,
  UserCheck,
  User,
  ArrowRight,
  Info,
  X,
  Award,
  BarChart3,
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import SingleSelectDropdown from "../../components/common/filters/SingleSelectDropdown";
import DatePicker from "../../components/common/filters/DatePicker";
import TablePagination from "../../components/common/tables/TablePagination";
import FrontStepsViewPerformanceModal from "./FrontStepsViewPerformanceModal";

// Mock demonstration dataset representing FrontSteps personnel
const MOCK_EMPLOYEES = [
  {
    employeeId: "FS-1001",
    name: "Dwight Anthony Buma-at",
    account: "FrontSteps",
    supervisor: "Mark Ramos",
    reportingPeriod: "2026-10",
    score: 96.85,
    rating: "Exceptional",
    status: "Validated",
  },
  {
    employeeId: "FS-1002",
    name: "Janine Marie Dela Cruz",
    account: "FrontSteps",
    supervisor: "Sarah Gomez",
    reportingPeriod: "2026-10",
    score: 92.4,
    rating: "Very Satisfactory",
    status: "Validated",
  },
  {
    employeeId: "FS-1003",
    name: "Carlos Miguel Mendoza",
    account: "FrontSteps",
    supervisor: "Mark Ramos",
    reportingPeriod: "2026-10",
    score: 88.75,
    rating: "Satisfactory",
    status: "Validated",
  },
  {
    employeeId: "FS-1004",
    name: "Beatrice Anne Santos",
    account: "FrontSteps",
    supervisor: "Sarah Gomez",
    reportingPeriod: "2026-10",
    score: 81.6,
    rating: "Unsatisfactory",
    status: "Pending Validation",
  },
  {
    employeeId: "FS-1005",
    name: "Rafael Dominic Castro",
    account: "FrontSteps",
    supervisor: "Mark Ramos",
    reportingPeriod: "2026-10",
    score: 94.2,
    rating: "Very Satisfactory",
    status: "Corrected",
  },
  {
    employeeId: "FS-1006",
    name: "Patricia Nicole Reyes",
    account: "FrontSteps",
    supervisor: "Alexandria Chua",
    reportingPeriod: "2026-10",
    score: 97.5,
    rating: "Exceptional",
    status: "Validated",
  },
  {
    employeeId: "FS-1007",
    name: "Gabriel Joshua Tan",
    account: "FrontSteps",
    supervisor: "Alexandria Chua",
    reportingPeriod: "2026-10",
    score: 79.3,
    rating: "Unsatisfactory",
    status: "Validated",
  },
  {
    employeeId: "FS-1008",
    name: "Kristine Joy Morales",
    account: "FrontSteps",
    supervisor: "Sarah Gomez",
    reportingPeriod: "2026-10",
    score: 86.9,
    rating: "Satisfactory",
    status: "Validated",
  },
  {
    employeeId: "FS-1009",
    name: "Lance Christian Lim",
    account: "FrontSteps",
    supervisor: "Mark Ramos",
    reportingPeriod: "2026-10",
    score: null,
    rating: null,
    status: "Incomplete",
  },
  {
    employeeId: "FS-1010",
    name: "Danielle Grace Villanueva",
    account: "FrontSteps",
    supervisor: "Alexandria Chua",
    reportingPeriod: "2026-10",
    score: null,
    rating: null,
    status: "Unvalidated",
  },
  {
    employeeId: "FS-1011",
    name: "Joshua Paul Alcantara",
    account: "FrontSteps",
    supervisor: "Mark Ramos",
    reportingPeriod: "2026-10",
    score: 93.1,
    rating: "Very Satisfactory",
    status: "Validated",
  },
  {
    employeeId: "FS-1012",
    name: "Samantha Rose Valenzuela",
    account: "FrontSteps",
    supervisor: "Sarah Gomez",
    reportingPeriod: "2026-10",
    score: 89.4,
    rating: "Satisfactory",
    status: "Validated",
  },
  {
    employeeId: "FS-1013",
    name: "Nathaniel James Cruz",
    account: "FrontSteps",
    supervisor: "Alexandria Chua",
    reportingPeriod: "2026-10",
    score: 82.5,
    rating: "Unsatisfactory",
    status: "Pending Validation",
  },
];

// Helper to format reporting period to human-readable month and year (e.g., '2026-10' -> 'October 2026')
function formatReportingPeriod(periodStr) {
  if (!periodStr) return "—";
  if (periodStr.includes("-")) {
    const [year, month] = periodStr.split("-");
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const monthIdx = parseInt(month, 10) - 1;
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${monthNames[monthIdx]} ${year}`;
    }
  }
  return periodStr;
}

// Helper to style rating badges based on policy
function getRatingBadge(rating) {
  switch (rating) {
    case "Exceptional":
      return "bg-emerald-50 text-emerald-700 border border-emerald-200/80";
    case "Very Satisfactory":
      return "bg-blue-50 text-blue-700 border border-blue-200/80";
    case "Satisfactory":
      return "bg-amber-50 text-amber-700 border border-amber-200/80";
    case "Unsatisfactory":
      return "bg-rose-50 text-rose-700 border border-rose-200/80";
    default:
      return "bg-slate-100 text-slate-500 border border-slate-200";
  }
}

// Helper to style data status badges
function getStatusBadge(status) {
  switch (status) {
    case "Validated":
      return "bg-emerald-50 text-emerald-700 border border-emerald-200/80";
    case "Pending Validation":
      return "bg-amber-50 text-amber-700 border border-amber-200/80";
    case "Incomplete":
      return "bg-rose-50 text-rose-700 border border-rose-200/80";
    case "Corrected":
      return "bg-purple-50 text-purple-700 border border-purple-200/80";
    case "Unvalidated":
      return "bg-slate-100 text-slate-600 border border-slate-200";
    default:
      return "bg-slate-100 text-slate-500 border border-slate-200";
  }
}

export default function FrontStepsEmployeePerformance() {
  const [infoEmployee, setInfoEmployee] = useState(null); // For View Performance full modal

  // Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSupervisor, setSelectedSupervisor] = useState("ALL");
  const [selectedDate, setSelectedDate] = useState("2026-10-21");
  const [selectedRating, setSelectedRating] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  // Pagination state — 10 items per page to fill the table completely
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filter handlers
  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedSupervisor("ALL");
    setSelectedDate("");
    setSelectedRating("ALL");
    setSelectedStatus("ALL");
    setCurrentPage(1);
  };

  // Filtered dataset
  const filteredEmployees = useMemo(() => {
    const selectedMonth = selectedDate ? selectedDate.slice(0, 7) : "";
    return MOCK_EMPLOYEES.filter((emp) => {
      // Search filter
      const matchesSearch =
        !searchTerm.trim() ||
        emp.name.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase().trim());

      // Supervisor filter
      const matchesSupervisor =
        selectedSupervisor === "ALL" || emp.supervisor === selectedSupervisor;

      // Period / Date filter (matches month e.g. "2026-10" or exact reporting period)
      const matchesPeriod =
        !selectedMonth || emp.reportingPeriod === selectedMonth;

      // Rating filter
      const matchesRating =
        selectedRating === "ALL" || emp.rating === selectedRating;

      // Status filter
      const matchesStatus =
        selectedStatus === "ALL" || emp.status === selectedStatus;

      return (
        matchesSearch &&
        matchesSupervisor &&
        matchesPeriod &&
        matchesRating &&
        matchesStatus
      );
    });
  }, [searchTerm, selectedSupervisor, selectedDate, selectedRating, selectedStatus]);

  // Pagination calculations
  const totalItems = filteredEmployees.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEmployees.slice(start, start + pageSize);
  }, [filteredEmployees, currentPage, pageSize]);

  // Overall KPI statistics based on current mock dataset (Improvement 2: Only validated records count towards averages and targets)
  const summaryStats = useMemo(() => {
    const total = MOCK_EMPLOYEES.length;
    const validatedRecords = MOCK_EMPLOYEES.filter(
      (e) => e.status === "Validated" && typeof e.score === "number",
    );
    const avgScore =
      validatedRecords.length > 0
        ? (
            validatedRecords.reduce((acc, curr) => acc + (curr.score || 0), 0) /
            validatedRecords.length
          ).toFixed(2)
        : "—";
    const meetingTarget = validatedRecords.filter((e) => (e.score || 0) >= 85).length;
    const belowTarget = validatedRecords.filter((e) => (e.score || 0) < 85).length;

    return { total, avgScore, meetingTarget, belowTarget, validatedCount: validatedRecords.length };
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2.5 sm:gap-3 overflow-hidden">
      {/* Section 2 — 4 KPI Summary Cards with Clear Supporting Sublabels */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 shrink-0">
              {/* Card 1 — Total Employees */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                <div className="min-w-0">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Total Employees
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-lg font-extrabold text-slate-800">
                      {summaryStats.total}
                    </span>
                    <span className="text-xs font-medium text-slate-400">FrontSteps</span>
                  </div>
                  <span className="block text-[10px] text-slate-400 mt-0.5">
                    All assigned personnel
                  </span>
                </div>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-[#042c51] border border-slate-200/60">
                  <Users size={15} />
                </div>
              </div>

              {/* Card 2 — Average KPI Score */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                <div className="min-w-0">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Average KPI Score
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-lg font-extrabold text-slate-800">
                      {summaryStats.avgScore}
                    </span>
                    <span className="text-xs font-bold text-slate-400">/ 100</span>
                  </div>
                  <span className="block text-[10px] text-slate-400 mt-0.5 truncate" title="Validated final scores only">
                    Validated scores only ({summaryStats.validatedCount})
                  </span>
                </div>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                  <TrendingUp size={15} />
                </div>
              </div>

              {/* Card 3 — Meeting Target */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                <div className="min-w-0">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Meeting Target
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-lg font-extrabold text-emerald-600">
                      {summaryStats.meetingTarget}
                    </span>
                    <span className="text-xs font-semibold text-emerald-600/80">&ge; 85.00</span>
                  </div>
                  <span className="block text-[10px] text-emerald-600/80 mt-0.5 truncate" title="Validated scores ≥ 85.00">
                    Validated &ge; 85.00
                  </span>
                </div>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <CheckCircle2 size={15} />
                </div>
              </div>

              {/* Card 4 — Below Target */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                <div className="min-w-0">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Below Target
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-lg font-extrabold text-rose-600">
                      {summaryStats.belowTarget}
                    </span>
                    <span className="text-xs font-semibold text-rose-600/80">&lt; 85.00</span>
                  </div>
                  <span className="block text-[10px] text-rose-600/80 mt-0.5 truncate" title="Validated scores < 85.00">
                    Validated &lt; 85.00
                  </span>
                </div>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
                  <AlertTriangle size={15} />
                </div>
              </div>
            </div>

            {/* Section 3 — Search and Filters */}
            <div className="rounded-xl border border-slate-200/80 bg-white px-3.5 py-2.5 shadow-xs shrink-0">
              <div className="flex flex-wrap items-center gap-2">
                {/* Search input */}
                <div className="flex-1 min-w-[200px]">
                  <div className="relative flex h-8 items-center rounded-lg border border-slate-200 bg-white px-2.5 transition-colors focus-within:border-[#ff5c28] focus-within:ring-1 focus-within:ring-[#ff5c28]/20">
                    <Search size={13} className="text-slate-400 shrink-0 mr-2" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="Search employee or ID..."
                      className="w-full bg-transparent text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none"
                    />
                  </div>
                </div>

                {/* Supervisor filter */}
                <div className="w-[185px]">
                  <SingleSelectDropdown
                    value={selectedSupervisor}
                    onChange={(e) => {
                      setSelectedSupervisor(e.target.value);
                      setCurrentPage(1);
                    }}
                    options={[
                      { value: "ALL", label: "All Supervisors" },
                      { value: "Mark Ramos", label: "Mark Ramos" },
                      { value: "Sarah Gomez", label: "Sarah Gomez" },
                      { value: "Alexandria Chua", label: "Alexandria Chua" },
                    ]}
                    buttonClassName="h-8 rounded-lg border-slate-200 px-3 text-xs"
                  />
                </div>

                {/* Date Picker filter (Select Date with calendar dropdown) */}
                <div className="w-[170px]">
                  <DatePicker
                    value={selectedDate}
                    onChange={(val) => {
                      setSelectedDate(val || "");
                      setCurrentPage(1);
                    }}
                    label=""
                    buttonClassName="h-8 rounded-lg border-slate-200 px-3 text-xs"
                  />
                </div>

                {/* Performance Rating filter */}
                <div className="w-[185px]">
                  <SingleSelectDropdown
                    value={selectedRating}
                    onChange={(e) => {
                      setSelectedRating(e.target.value);
                      setCurrentPage(1);
                    }}
                    options={[
                      { value: "ALL", label: "All Ratings" },
                      { value: "Exceptional", label: "Exceptional" },
                      { value: "Very Satisfactory", label: "Very Satisfactory" },
                      { value: "Satisfactory", label: "Satisfactory" },
                      { value: "Unsatisfactory", label: "Unsatisfactory" },
                    ]}
                    buttonClassName="h-8 rounded-lg border-slate-200 px-3 text-xs"
                  />
                </div>

                {/* Data Status filter */}
                <div className="w-[180px]">
                  <SingleSelectDropdown
                    value={selectedStatus}
                    onChange={(e) => {
                      setSelectedStatus(e.target.value);
                      setCurrentPage(1);
                    }}
                    options={[
                      { value: "ALL", label: "All Statuses" },
                      { value: "Validated", label: "Validated" },
                      { value: "Pending Validation", label: "Pending Validation" },
                      { value: "Incomplete", label: "Incomplete" },
                      { value: "Corrected", label: "Corrected" },
                      { value: "Unvalidated", label: "Unvalidated" },
                    ]}
                    buttonClassName="h-8 rounded-lg border-slate-200 px-3 text-xs"
                  />
                </div>

                {/* Reset Filters button */}
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
                  title="Reset all filters"
                >
                  <RotateCcw size={12} />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* Section 4 — Employee Directory Table */}
            <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden flex flex-col flex-1 min-h-0">
              {/* Table Body */}
              <div className="overflow-auto flex-1 min-h-0 sibs-scrollbar">
                <table className="w-full table-fixed text-left text-xs border-collapse min-w-[980px]">
                  <thead className="sticky top-0 z-10">
                    <tr className="border-b border-[#042c51] bg-[#042c51] text-[11px] font-bold uppercase tracking-wider text-white select-none shadow-xs">
                      <th className="py-3 px-4 w-[10%]">Employee ID</th>
                      <th className="py-3 px-4 w-[17%]">Employee Name</th>
                      <th className="py-3 px-4 w-[9%]">Account</th>
                      <th className="py-3 px-4 w-[11%]">Supervisor</th>
                      <th className="py-3 px-4 w-[12%]">Reporting Period</th>
                      <th className="py-3 px-4 w-[13%]">Final KPI Score</th>
                      <th className="py-3 px-4 w-[12%]">Performance Rating</th>
                      <th className="py-3 px-4 w-[11%]">Data Status</th>
                      <th className="py-3 px-4 w-[15%] text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {paginatedEmployees.length > 0 ? (
                      paginatedEmployees.map((emp) => {
                        // Improvement 1: Validation handling per policy status
                        const isValidated = emp.status === "Validated";
                        const isPending = emp.status === "Pending Validation";
                        const isCorrected = emp.status === "Corrected";
                        const isIncomplete = emp.status === "Incomplete";
                        const isUnvalidated = emp.status === "Unvalidated";

                        return (
                          <tr
                            key={emp.employeeId}
                            className="hover:bg-slate-50/70 transition-colors h-[54px]"
                          >
                            <td className="py-3 px-4 font-mono font-bold text-slate-800 text-[13px] whitespace-nowrap">
                              {emp.employeeId}
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-900 text-[13.5px] truncate" title={emp.name}>
                              {emp.name}
                            </td>
                            <td className="py-3 px-4 text-slate-600 text-[13px] whitespace-nowrap">{emp.account}</td>
                            <td className="py-3 px-4 text-slate-600 text-[13px] truncate" title={emp.supervisor}>{emp.supervisor}</td>
                            <td className="py-3 px-4 text-slate-700 text-[13px] font-medium whitespace-nowrap">
                              {/* Improvement 3: Human-readable Month & Year */}
                              {formatReportingPeriod(emp.reportingPeriod)}
                            </td>

                            {/* Final KPI Score with Status Handling */}
                            <td className="py-3 px-4 whitespace-nowrap">
                              {isValidated && typeof emp.score === "number" ? (
                                <span className="font-bold text-slate-900 text-[13.5px]">
                                  {emp.score.toFixed(2)}
                                </span>
                              ) : isPending && typeof emp.score === "number" ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-slate-700 text-[13.5px]">
                                    {emp.score.toFixed(2)}
                                  </span>
                                  <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                    Provisional
                                  </span>
                                </div>
                              ) : isCorrected && typeof emp.score === "number" ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-purple-700 text-[13.5px]">
                                    {emp.score.toFixed(2)}
                                  </span>
                                  <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                    Pending Revalidation
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-400 font-normal italic text-[13px]">—</span>
                              )}
                            </td>

                            {/* Performance Rating with Status Handling */}
                            <td className="py-3 px-4 whitespace-nowrap">
                              {isValidated && emp.rating ? (
                                <span
                                  className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${getRatingBadge(
                                    emp.rating,
                                  )}`}
                                >
                                  {emp.rating}
                                </span>
                              ) : isPending || isCorrected ? (
                                <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                  Pending Validation
                                </span>
                              ) : (
                                <span className="text-slate-400 font-normal italic text-xs">
                                  Pending
                                </span>
                              )}
                            </td>

                            {/* Data Status Badge */}
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span
                                className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadge(
                                  emp.status,
                                )} `}
                              >
                                {emp.status}
                              </span>
                            </td>

                            {/* Actions Column (Improvement 5: View Performance informational modal notice) */}
                            <td className="py-3 px-4 text-center whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => setInfoEmployee(emp)}
                                className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-[#ff5c28] hover:bg-orange-50 transition-colors cursor-pointer whitespace-nowrap"
                                title="View individual employee performance scorecard"
                              >
                                <span>View Performance</span>
                                <ArrowRight size={13} className="shrink-0" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      /* Section 4.1 — Empty State */
                      <tr>
                        <td colSpan={9} className="py-10 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-1.5">
                              <Users size={18} />
                            </div>
                            <p className="text-xs font-bold text-slate-700">
                              No employees found
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5 max-w-sm">
                              No FrontSteps records match your selected filter criteria. Try
                              clearing or adjusting your filters.
                            </p>
                            <button
                              type="button"
                              onClick={handleResetFilters}
                              className="mt-2.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#042c51] text-white hover:bg-[#073966] transition-colors"
                            >
                              <RotateCcw size={11} />
                              <span>Reset Filters</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Section 5 — TablePagination Component */}
              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={(page) => setCurrentPage(page)}
                itemLabel="employees"
                className="shrink-0"
              />
            </div>

      {/* View Performance Modal */}
      {infoEmployee && (
        <FrontStepsViewPerformanceModal
          employee={infoEmployee}
          onClose={() => setInfoEmployee(null)}
          formatReportingPeriod={formatReportingPeriod}
        />
      )}
    </div>
  );
}
