import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  Pencil,
  RotateCcw,
  Search,
  Upload,
  Users,
  X,
} from "lucide-react";

import AdminSidebar from "@/components/layout/AdminSidebar";
import AppHeader from "@/components/layout/AppHeader";
import ConfirmationModal from "@/components/ui/confirmation-modal";
import LoadingModal from "@/components/ui/loading-modal";
import EditToolAlignmentModal from "@/components/ui/masterdata/EditToolAlignmentModal";
import useDashboardPage from "@/hooks/useDashboardPage";
import {
  fetchMasterDataAccounts,
  fetchMasterDataLedger,
  updateEmployeeToolAliases,
} from "@/lib/axios/masterdata";

/* ─── Status badge ──────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const map = {
    UNIFIED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    ALIASED:  "bg-blue-50   text-blue-700   border-blue-200",
    INCOMPLETE: "bg-rose-50 text-rose-600   border-rose-200",
  };
  const cls = map[status] || "bg-slate-100 text-slate-600 border-slate-200";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider ${cls}`}
    >
      {status || "—"}
    </span>
  );
}

/* ─── Tool name cell ─────────────────────────────────────────────── */
function ToolCell({ name, type }) {
  if (!name) return <span className="text-slate-300 select-none">—</span>;
  const isExact = type === "EXACT";
  const badgeCls = isExact
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : "bg-blue-50 text-blue-700 border-blue-200";

  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="font-medium text-slate-800 leading-tight truncate" title={name}>
        {name}
      </span>
      {type && (
        <span
          className={`inline-block w-fit rounded px-1.5 py-px text-[9px] font-bold uppercase tracking-wider border ${badgeCls}`}
        >
          {type}
        </span>
      )}
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────── */
export default function EmployeeMasterDataPage() {
  const dashboard = useDashboardPage();

  const [searchTerm, setSearchTerm]           = useState("");
  const [selectedAccount, setSelectedAccount] = useState("US Visa");
  const [accountsList, setAccountsList]       = useState([]);
  const [ledgerList, setLedgerList]           = useState([]);
  const [totalCount, setTotalCount]           = useState(0);
  const [isLoading, setIsLoading]             = useState(false);
  const [errorMsg, setErrorMsg]               = useState("");
  const [currentPage, setCurrentPage]         = useState(1);
  const [totalPages, setTotalPages]           = useState(1);
  const [sortBy, setSortBy]                   = useState(null); // 'fusecom' | 'fusenet' | 'herodash' | 'ms-d' | null
  const [sortOrder, setSortOrder]             = useState("desc"); // 'desc' (aliases first) | 'asc' (no aliases first)
  const pageSize = 25;

  /* Fetch accounts */
  useEffect(() => {
    let alive = true;
    fetchMasterDataAccounts()
      .then((res) => { if (alive && res?.success) setAccountsList(res.accounts || []); })
      .catch(console.error);
    return () => { alive = false; };
  }, []);

  /* Fetch ledger data */
  const loadLedgerData = useCallback(
    async (
      searchQuery = "",
      acc = "US Visa",
      page = 1,
      size = 25,
      activeSortBy = null,
      activeSortOrder = "desc",
    ) => {
      const query = searchQuery.trim();
      const targetAccount = acc || "US Visa";

      if (targetAccount && targetAccount.trim().toLowerCase() !== "us visa") {
        setLedgerList([]);
        setTotalCount(0);
        setTotalPages(1);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMsg("");
        const result = await fetchMasterDataLedger({
          search: query,
          account: targetAccount,
          page,
          limit: size,
          viewAll: true,
          sortBy: activeSortBy || "",
          sortOrder: activeSortOrder || "desc",
        });
        if (result?.success) {
          setLedgerList(result.data || []);
          setTotalCount(result.total || 0);
          setTotalPages(result.totalPages || 1);
        } else {
          setErrorMsg(result?.message || "Failed to load master ledger records.");
        }
      } catch {
        setErrorMsg("Unable to connect to Master Data service.");
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const handleToggleToolSort = (toolKey) => {
    if (
      sortBy === toolKey ||
      (toolKey === "ms-d" && (sortBy === "msd" || sortBy === "ms-d")) ||
      (toolKey === "msd" && (sortBy === "msd" || sortBy === "ms-d"))
    ) {
      setSortBy(null);
    } else {
      setSortBy(toolKey);
    }
    setSortOrder("desc");
    setCurrentPage(1);
  };

  useEffect(() => { setCurrentPage(1); }, [searchTerm, selectedAccount]);

  useEffect(() => {
    const t = setTimeout(() => {
      void loadLedgerData(searchTerm, selectedAccount, currentPage, pageSize, sortBy, sortOrder);
    }, 250);
    return () => clearTimeout(t);
  }, [searchTerm, selectedAccount, currentPage, pageSize, sortBy, sortOrder, loadLedgerData]);

  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [isSearchingAccount, setIsSearchingAccount]       = useState(false);
  const [accountSearchTerm, setAccountSearchTerm]         = useState("");
  const accountDropdownRef                                = useRef(null);
  const accountSearchInputRef                             = useRef(null);

  useEffect(() => {
    if (!isAccountDropdownOpen && !isSearchingAccount) return;

    const handleClickOutside = (e) => {
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(e.target)) {
        setIsAccountDropdownOpen(false);
        setIsSearchingAccount(false);
        setAccountSearchTerm("");
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsAccountDropdownOpen(false);
        setIsSearchingAccount(false);
        setAccountSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAccountDropdownOpen, isSearchingAccount]);

  useEffect(() => {
    if (isSearchingAccount) {
      setTimeout(() => {
        accountSearchInputRef.current?.focus();
      }, 50);
    }
  }, [isSearchingAccount]);

  const selectableAccounts = useMemo(() => {
    const list = ["US Visa", "All Accounts"];
    accountsList.forEach((acc) => {
      const clean = String(acc || "").trim();
      if (clean && clean.toLowerCase() !== "us visa" && !list.includes(clean)) {
        list.push(clean);
      }
    });
    return list;
  }, [accountsList]);

  const filteredAccountOptions = useMemo(() => {
    const term = accountSearchTerm.trim().toLowerCase();
    if (!term) return selectableAccounts;
    return selectableAccounts.filter((acc) =>
      acc.toLowerCase().includes(term),
    );
  }, [selectableAccounts, accountSearchTerm]);

  const handleSelectAccount = (acc) => {
    const value = acc === "All Accounts" ? "" : acc;
    setSelectedAccount(value);
    setIsAccountDropdownOpen(false);
    setIsSearchingAccount(false);
    setAccountSearchTerm("");
    setCurrentPage(1);
  };

  const [editingEmployee, setEditingEmployee] = useState(null);
  const [isSavingEdit, setIsSavingEdit]       = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg]   = useState("");

  const handleOpenEditModal = (emp) => {
    setEditingEmployee(emp);
  };

  const handleCloseEditModal = () => {
    if (isSavingEdit) return;
    setEditingEmployee(null);
  };

  const handleSaveToolAlignment = async (updatedAliases) => {
    if (!editingEmployee?.sibsId) return;
    try {
      setIsSavingEdit(true);
      setErrorMsg("");
      const res = await updateEmployeeToolAliases(editingEmployee.sibsId, updatedAliases);
      if (res?.success) {
        setSaveSuccessMsg(`Successfully updated tool alignment for ${editingEmployee.fullName}.`);
        setTimeout(() => setSaveSuccessMsg(""), 4000);
        setEditingEmployee(null);
        void loadLedgerData(searchTerm, selectedAccount, currentPage, pageSize, sortBy, sortOrder);
      } else {
        setErrorMsg(res?.message || "Failed to update tool alignment.");
      }
    } catch (err) {
      console.error("Save error:", err);
      setErrorMsg(err?.response?.data?.message || "Unable to save tool alignment.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);

  const handleDownloadTemplate = async () => {
    if (isDownloadingTemplate) return;

    try {
      setIsDownloadingTemplate(true);

      let exportRecords = ledgerList;

      // If there are more records than currently loaded in the page, fetch all matching records
      if (totalCount > ledgerList.length) {
        const res = await fetchMasterDataLedger({
          search: searchTerm.trim(),
          account: selectedAccount || "US Visa",
          page: 1,
          limit: Math.max(totalCount, 1000),
          viewAll: true,
          sortBy: sortBy || "",
          sortOrder: sortOrder || "desc",
        });
        if (res?.success && Array.isArray(res.data)) {
          exportRecords = res.data;
        }
      }

      const rows = exportRecords.map((emp) => ({
        "SIBS ID": emp.sibsId || "",
        "OFFICIAL KRONOS NAME": emp.fullName || "",
        "FUSECOM NAME": emp.toolMappings?.fusecom?.name || "",
        "FUSENET NAME": emp.toolMappings?.fusenet?.name || "",
        "HERODASH NAME": emp.toolMappings?.herodash?.name || "",
        "MS-D NAME":
          emp.toolMappings?.msd?.name ||
          emp.toolMappings?.["ms-d"]?.name ||
          emp.toolMappings?.ms_d?.name ||
          "",
        "ACCOUNT": emp.account || selectedAccount || "US Visa",
      }));

      const XLSX = await import("xlsx");
      const worksheet = XLSX.utils.json_to_sheet(rows, {
        header: [
          "SIBS ID",
          "OFFICIAL KRONOS NAME",
          "FUSECOM NAME",
          "FUSENET NAME",
          "HERODASH NAME",
          "MS-D NAME",
          "ACCOUNT",
        ],
      });

      worksheet["!cols"] = [
        { wch: 12 },
        { wch: 32 },
        { wch: 28 },
        { wch: 28 },
        { wch: 28 },
        { wch: 28 },
        { wch: 16 },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "SIBS_PMS_Employee_Roster_Template.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to generate populated template download:", err);
      // Fallback: direct download of the static template if dynamic generation encounters an issue
      const fallbackLink = document.createElement("a");
      fallbackLink.href = "/template/SIBS_PMS_Employee_Roster_Template.xlsx";
      fallbackLink.download = "SIBS_PMS_Employee_Roster_Template.xlsx";
      document.body.appendChild(fallbackLink);
      fallbackLink.click();
      document.body.removeChild(fallbackLink);
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const isAdmin =
    dashboard.authUser?.role === "admin" ||
    Number(dashboard.authUser?.adminAccess ?? dashboard.authUser?.admin_access ?? 0) === 7 ||
    ["admin", "bod", "som"].includes(dashboard.authUser?.role);

  const hasQuery = true;

  /* ─── RENDER ───────────────────────────────────────────────────── */
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f0f4f8] text-slate-800 antialiased font-sans">
      {/* Sidebar */}
      <AdminSidebar
        modules={dashboard.modules}
        isMobileOpen={dashboard.isMobileSidebarOpen}
        onMobileClose={() => dashboard.setIsMobileSidebarOpen(false)}
      />

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <AppHeader
          title={isAdmin ? dashboard.authUser?.roleLabel || "Super Admin" : "Employee Master Data Ledger"}
          subtitle={isAdmin ? "Performance Management System" : "Align tool identities (Fusecom, FuseNet, HeroDash)"}
          userName={dashboard.userName}
          onMenuClick={() => dashboard.setIsMobileSidebarOpen(true)}
          onLogoutClick={() => dashboard.setShowLogoutModal(true)}
        />

        <main className="flex flex-1 min-h-0 flex-col gap-3 overflow-hidden px-3 sm:px-4 lg:px-5 pt-3 sm:pt-4 lg:pt-5 pb-0">

          {/* ── Toolbar ────────────────────────────────────────────── */}
          <div className="shrink-0 flex flex-col sm:flex-row items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-3 shadow-xs">
            {/* Account select + Reset (Left) */}
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none" ref={accountDropdownRef}>
                {isSearchingAccount ? (
                  <div className="relative h-9 w-full sm:w-72">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      ref={accountSearchInputRef}
                      type="text"
                      value={accountSearchTerm}
                      onChange={(e) => {
                        setAccountSearchTerm(e.target.value);
                        setIsAccountDropdownOpen(true);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && filteredAccountOptions.length > 0) {
                          handleSelectAccount(filteredAccountOptions[0]);
                        }
                      }}
                      placeholder="Search department..."
                      className="h-9 w-full rounded-lg border border-[#0b3b68] bg-white pl-8 pr-7 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0b3b68]/15"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setAccountSearchTerm("");
                        setIsSearchingAccount(false);
                        setIsAccountDropdownOpen(false);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAccountDropdownOpen((prev) => !prev)}
                    onDoubleClick={() => {
                      setIsSearchingAccount(true);
                      setIsAccountDropdownOpen(true);
                    }}
                    title="Click to select, double-click to search departments"
                    className="flex h-9 w-full sm:w-72 cursor-pointer items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-100 focus:border-[#0b3b68] focus:outline-none"
                  >
                    <span className="truncate">
                      {selectedAccount || "All Accounts"}
                    </span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 text-slate-400 transition-transform ${
                        isAccountDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                )}

                {/* Dropdown Menu */}
                {isAccountDropdownOpen && (
                  <div className="absolute left-0 top-full z-50 mt-1 max-h-96 w-full sm:w-72 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg shadow-slate-900/10">
                    {!isSearchingAccount && (
                      <div className="border-b border-slate-100 p-1.5">
                        <div className="relative">
                          <Search className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                          <input
                            type="text"
                            value={accountSearchTerm}
                            onChange={(e) => setAccountSearchTerm(e.target.value)}
                            placeholder="Type to search..."
                            className="h-7 w-full rounded-md border border-slate-200 bg-slate-50 pl-6 pr-2 text-[11px] text-slate-800 focus:border-[#0b3b68] focus:bg-white focus:outline-none"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                    )}

                    <div className="max-h-80 overflow-y-auto sibs-scrollbar">
                      {filteredAccountOptions.length > 0 ? (
                        filteredAccountOptions.map((acc) => {
                          const isSelected =
                            acc === "All Accounts"
                              ? !selectedAccount
                              : selectedAccount === acc;
                          return (
                            <button
                              key={acc}
                              type="button"
                              onClick={() => handleSelectAccount(acc)}
                              className={`flex w-full cursor-pointer items-center justify-between px-3 py-1.5 text-left text-xs transition ${
                                isSelected
                                  ? "bg-sky-50 font-bold text-[#0b3b68]"
                                  : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                              }`}
                            >
                              <span className="truncate">{acc}</span>
                              {isSelected && (
                                <Check className="h-3.5 w-3.5 text-[#0b3b68]" />
                              )}
                            </button>
                          );
                        })
                      ) : (
                        <div className="px-3 py-4 text-center text-xs text-slate-400">
                          No departments found
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedAccount("US Visa");
                  setIsSearchingAccount(false);
                  setIsAccountDropdownOpen(false);
                  setAccountSearchTerm("");
                  setSortBy(null);
                  setSortOrder("desc");
                  setCurrentPage(1);
                }}
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
                placeholder="Search by SIBS ID, employee name, or tool alias…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-8 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#0b3b68] focus:bg-white focus:ring-2 focus:ring-[#0b3b68]/10 focus:outline-none transition"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Template Actions (Right) */}
            <div className="shrink-0 w-full sm:w-auto flex items-center gap-2 justify-end">
              <button
                type="button"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 transition cursor-pointer shadow-2xs shrink-0"
                title="Import template"
              >
                <Upload className="h-3.5 w-3.5 text-slate-500" />
                <span>Import template</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadTemplate}
                disabled={isDownloadingTemplate}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 transition cursor-pointer shadow-2xs shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
                title="Download template with employee ledger data"
              >
                {isDownloadingTemplate ? (
                  <Loader2 className="h-3.5 w-3.5 text-slate-500 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5 text-slate-500" />
                )}
                <span>{isDownloadingTemplate ? "Downloading…" : "Download template"}</span>
              </button>
            </div>
          </div>

          {/* ── Success Toast (Upper Right Floating) ───────────────── */}
          {saveSuccessMsg && (
            <div className="fixed top-5 right-6 z-50 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/95 px-3.5 py-2.5 text-xs font-semibold text-emerald-900 shadow-lg backdrop-blur-xs max-w-sm transition-all duration-200">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span className="flex-1 truncate">{saveSuccessMsg}</span>
              <button
                type="button"
                onClick={() => setSaveSuccessMsg("")}
                className="rounded p-0.5 text-emerald-500 hover:bg-emerald-100 hover:text-emerald-800 transition cursor-pointer shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* ── Error banner ───────────────────────────────────────── */}
          {errorMsg && (
            <div className="shrink-0 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">
              {errorMsg}
            </div>
          )}

          {/* ── Table card ─────────────────────────────────────────── */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden rounded-t-xl rounded-b-none border border-b-0 border-slate-200 bg-white shadow-xs">

            {/* Scrollable table wrapper */}
            <div
              className="flex-1 min-h-0 overflow-x-auto overflow-y-auto sibs-scrollbar scroll-smooth"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
                <table className="w-full min-w-[1410px] table-fixed text-left text-xs border-collapse">
                  <colgroup>
                    <col style={{ width: "95px" }} />
                    <col style={{ width: "240px" }} />
                    <col style={{ width: "190px" }} />
                    <col style={{ width: "190px" }} />
                    <col style={{ width: "190px" }} />
                    <col style={{ width: "190px" }} />
                    <col style={{ width: "110px" }} />
                    <col style={{ width: "110px" }} />
                    <col style={{ width: "95px" }} />
                  </colgroup>
                  {/* ── Table head ──────────────────────────────────── */}
                  <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 whitespace-nowrap overflow-hidden">
                        SIBS ID
                      </th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 whitespace-nowrap overflow-hidden">
                        Official Kronos Name
                      </th>
                      <th
                        onClick={() => handleToggleToolSort("fusecom")}
                        title={
                          sortBy === "fusecom"
                            ? "Filter ON: Showing employees with Fusecom aliases (click to turn OFF)"
                            : "Filter OFF: Click to show employees with Fusecom aliases"
                        }
                        className={`px-4 py-3 text-xs font-bold uppercase tracking-wider select-none cursor-pointer transition whitespace-nowrap overflow-hidden ${
                          sortBy === "fusecom"
                            ? "bg-orange-100/80 text-orange-950"
                            : "text-slate-600 hover:bg-orange-50/80 hover:text-orange-900"
                        }`}
                      >
                        <span className="inline-block h-2 w-2 rounded-full bg-orange-500 mr-1.5 align-middle" />
                        <span>Fusecom Name</span>
                      </th>
                      <th
                        onClick={() => handleToggleToolSort("fusenet")}
                        title={
                          sortBy === "fusenet"
                            ? "Filter ON: Showing employees with FuseNet aliases (click to turn OFF)"
                            : "Filter OFF: Click to show employees with FuseNet aliases"
                        }
                        className={`px-4 py-3 text-xs font-bold uppercase tracking-wider select-none cursor-pointer transition whitespace-nowrap overflow-hidden ${
                          sortBy === "fusenet"
                            ? "bg-blue-100/80 text-blue-950"
                            : "text-slate-600 hover:bg-blue-50/80 hover:text-blue-900"
                        }`}
                      >
                        <span className="inline-block h-2 w-2 rounded-full bg-blue-500 mr-1.5 align-middle" />
                        <span>FuseNet Name</span>
                      </th>
                      <th
                        onClick={() => handleToggleToolSort("herodash")}
                        title={
                          sortBy === "herodash"
                            ? "Filter ON: Showing employees with HeroDash aliases (click to turn OFF)"
                            : "Filter OFF: Click to show employees with HeroDash aliases"
                        }
                        className={`px-4 py-3 text-xs font-bold uppercase tracking-wider select-none cursor-pointer transition whitespace-nowrap overflow-hidden ${
                          sortBy === "herodash"
                            ? "bg-amber-100/80 text-amber-950"
                            : "text-slate-600 hover:bg-amber-50/80 hover:text-amber-900"
                        }`}
                      >
                        <span className="inline-block h-2 w-2 rounded-full bg-amber-500 mr-1.5 align-middle" />
                        <span>HeroDash Name</span>
                      </th>
                      <th
                        onClick={() => handleToggleToolSort("ms-d")}
                        title={
                          sortBy === "ms-d" || sortBy === "msd"
                            ? "Filter ON: Showing employees with MS-D aliases (click to turn OFF)"
                            : "Filter OFF: Click to show employees with MS-D aliases"
                        }
                        className={`px-4 py-3 text-xs font-bold uppercase tracking-wider select-none cursor-pointer transition whitespace-nowrap overflow-hidden ${
                          sortBy === "ms-d" || sortBy === "msd"
                            ? "bg-purple-100/80 text-purple-950"
                            : "text-slate-600 hover:bg-purple-50/80 hover:text-purple-900"
                        }`}
                      >
                        <span className="inline-block h-2 w-2 rounded-full bg-purple-500 mr-1.5 align-middle" />
                        <span>MS-D Name</span>
                      </th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 whitespace-nowrap overflow-hidden">
                        Account
                      </th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 whitespace-nowrap overflow-hidden">
                        Status
                      </th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 whitespace-nowrap text-center overflow-hidden">
                        Action
                      </th>
                    </tr>
                  </thead>

                  {/* ── Table body ──────────────────────────────────── */}
                  <tbody className="divide-y divide-slate-100">
                    {/* Loading */}
                    {isLoading && (
                      <tr>
                        <td colSpan={9} className="py-20 text-center">
                          <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-[#0b3b68]" />
                          <p className="text-xs text-slate-400">Loading employee identities…</p>
                        </td>
                      </tr>
                    )}

                    {/* Prompt — no query yet */}
                    {!isLoading && !hasQuery && (
                      <tr>
                        <td colSpan={9} className="py-20 text-center">
                          <Search className="mx-auto mb-2.5 h-8 w-8 text-slate-200" />
                          <p className="text-xs font-medium text-slate-400">
                            Enter a name, SIBS ID, or tool alias to search the ledger.
                          </p>
                        </td>
                      </tr>
                    )}

                    {/* Empty results */}
                    {!isLoading && hasQuery && ledgerList.length === 0 && (
                      <tr>
                        <td colSpan={9} className="py-20 text-center">
                          <Users className="mx-auto mb-2.5 h-8 w-8 text-slate-200" />
                          <p className="text-xs font-medium text-slate-400">
                            {selectedAccount && selectedAccount.trim().toLowerCase() !== "us visa"
                              ? <>No records for <strong className="text-slate-600">{selectedAccount}</strong>. Identity alignment is active for <strong className="text-slate-600">US Visa</strong> only.</>
                              : "No matching employees found."}
                          </p>
                        </td>
                      </tr>
                    )}

                    {/* Data rows */}
                    {!isLoading && ledgerList.map((emp, idx) => (
                      <tr
                        key={emp.sibsId}
                        className={`group transition-colors hover:bg-[#f0f7ff] ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"}`}
                      >
                        {/* SIBS ID */}
                        <td className="px-4 py-3 whitespace-nowrap overflow-hidden">
                          <span className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-700 group-hover:border-slate-300">
                            {emp.sibsId}
                          </span>
                        </td>

                        {/* Official name + email */}
                        <td className="px-4 py-3 whitespace-nowrap overflow-hidden min-w-0">
                          <div className="font-semibold text-slate-900 leading-tight truncate" title={emp.fullName}>
                            {emp.fullName}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 truncate" title={emp.email}>
                            {emp.email || "No email"}
                          </div>
                        </td>

                        {/* Fusecom */}
                        <td className="px-4 py-3 whitespace-nowrap overflow-hidden min-w-0">
                          <ToolCell
                            name={emp.toolMappings?.fusecom?.name}
                            type={emp.toolMappings?.fusecom?.type}
                          />
                        </td>

                        {/* FuseNet */}
                        <td className="px-4 py-3 whitespace-nowrap overflow-hidden min-w-0">
                          <ToolCell
                            name={emp.toolMappings?.fusenet?.name}
                            type={emp.toolMappings?.fusenet?.type}
                          />
                        </td>

                        {/* HeroDash */}
                        <td className="px-4 py-3 whitespace-nowrap overflow-hidden min-w-0">
                          <ToolCell
                            name={emp.toolMappings?.herodash?.name}
                            type={emp.toolMappings?.herodash?.type}
                          />
                        </td>

                        {/* MS-D */}
                        <td className="px-4 py-3 whitespace-nowrap overflow-hidden min-w-0">
                          <ToolCell
                            name={
                              emp.toolMappings?.msd?.name ||
                              emp.toolMappings?.["ms-d"]?.name ||
                              emp.toolMappings?.ms_d?.name
                            }
                            type={
                              emp.toolMappings?.msd?.type ||
                              emp.toolMappings?.["ms-d"]?.type ||
                              emp.toolMappings?.ms_d?.type
                            }
                          />
                        </td>

                        {/* Account */}
                        <td className="px-4 py-3 whitespace-nowrap overflow-hidden">
                          <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[10.5px] font-semibold text-slate-700">
                            {emp.account || "Unassigned"}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3 whitespace-nowrap overflow-hidden">
                          <StatusBadge status={emp.status} />
                        </td>

                        {/* Action */}
                        <td className="px-4 py-3 whitespace-nowrap text-center overflow-hidden">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(emp)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-[#0b3b68] shadow-2xs hover:border-[#0b3b68] hover:bg-[#0b3b68]/5 transition cursor-pointer"
                            title={`Edit tool alignment for ${emp.fullName}`}
                          >
                            <Pencil size={11} className="text-[#0b3b68]" />
                            <span>Edit</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            {/* ── Pagination footer ────────────────────────────────── */}
            {totalCount > 0 && (
              <div className="shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200/90 bg-slate-50/80 px-5 py-3 sm:py-3.5">
                {/* Count */}
                <p className="text-xs sm:text-[13px] text-slate-600">
                  Showing{" "}
                  <span className="font-bold text-slate-900">{(currentPage - 1) * pageSize + 1}</span>
                  {" "}to{" "}
                  <span className="font-bold text-slate-900">{Math.min(currentPage * pageSize, totalCount)}</span>
                  {" "}of{" "}
                  <span className="font-bold text-slate-900">{totalCount}</span>
                  {" "}employees
                </p>

                {/* Page controls */}
                {totalPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      disabled={currentPage === 1 || isLoading}
                      className="flex h-8 w-8 sm:h-8.5 sm:w-8.5 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-slate-100 hover:text-slate-900 disabled:opacity-35 disabled:cursor-not-allowed transition cursor-pointer"
                      title="Previous page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    <span className="rounded-md border border-slate-200 bg-white px-3 py-1 text-xs sm:text-[12.5px] font-bold text-slate-800 shadow-2xs">
                      {currentPage} / {totalPages}
                    </span>

                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                      disabled={currentPage >= totalPages || isLoading}
                      className="flex h-8 w-8 sm:h-8.5 sm:w-8.5 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-slate-100 hover:text-slate-900 disabled:opacity-35 disabled:cursor-not-allowed transition cursor-pointer"
                      title="Next page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Edit Tool Alignment Modal */}
      <EditToolAlignmentModal
        isOpen={Boolean(editingEmployee)}
        employee={editingEmployee}
        onClose={handleCloseEditModal}
        onSave={handleSaveToolAlignment}
        isSaving={isSavingEdit}
      />

      {/* Modals */}
      <ConfirmationModal
        isOpen={dashboard.showLogoutModal}
        title="Sign Out"
        message="Are you sure you want to log out?"
        confirmText="Log Out"
        cancelText="Cancel"
        onConfirm={dashboard.handleLogout}
        onCancel={() => dashboard.setShowLogoutModal(false)}
      />
      <LoadingModal isOpen={dashboard.isLoggingOut} message="Signing out…" />
    </div>
  );
}
