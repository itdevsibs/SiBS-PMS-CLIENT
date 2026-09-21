import { useCallback, useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  RotateCcw,
  Search,
  Users,
  X,
} from "lucide-react";

import AdminSidebar from "@/components/layout/AdminSidebar";
import AppHeader from "@/components/layout/AppHeader";
import ConfirmationModal from "@/components/ui/confirmation-modal";
import LoadingModal from "@/components/ui/loading-modal";
import useDashboardPage from "@/hooks/useDashboardPage";
import {
  fetchMasterDataAccounts,
  fetchMasterDataLedger,
} from "@/lib/axios/masterdata";

export default function EmployeeMasterDataPage() {
  const dashboard = useDashboardPage();

  // Search, filter & data states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [accountsList, setAccountsList] = useState([]);
  const [ledgerList, setLedgerList] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;
  const [totalPages, setTotalPages] = useState(1);

  // Fetch accounts on mount for the account filter
  useEffect(() => {
    let isMounted = true;
    fetchMasterDataAccounts()
      .then((res) => {
        if (isMounted && res?.success) {
          setAccountsList(res.accounts || []);
        }
      })
      .catch((err) => console.error("Error loading master data accounts:", err));
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch ledger data from live API
  const loadLedgerData = useCallback(
    async (searchQuery = "", acc = "", page = 1, size = 25) => {
      const query = searchQuery.trim();
      const hasAcc = Boolean(acc);

      // Clean initial state: If no query and no account, keep table empty
      if (!query && !hasAcc) {
        setLedgerList([]);
        setTotalCount(0);
        setTotalPages(1);
        setIsLoading(false);
        return;
      }

      // Only US Visa is fetched for now; do not fetch data if another account is selected
      if (hasAcc && acc.trim().toLowerCase() !== "us visa") {
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
          account: acc,
          page,
          limit: size,
          viewAll: true,
        });

        if (result?.success) {
          setLedgerList(result.data || []);
          setTotalCount(result.total || 0);
          setTotalPages(result.totalPages || 1);
        } else {
          setErrorMsg(result?.message || "Failed to load master ledger records.");
        }
      } catch (err) {
        console.error("Master data fetch error:", err);
        setErrorMsg("Unable to connect to Master Data service.");
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // Reset to page 1 when search term or account changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedAccount]);

  // Debounced search & filter trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      void loadLedgerData(searchTerm, selectedAccount, currentPage, pageSize);
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm, selectedAccount, currentPage, pageSize, loadLedgerData]);

  const isAdmin =
    dashboard.authUser?.role === "admin" ||
    Number(dashboard.authUser?.adminAccess ?? dashboard.authUser?.admin_access ?? 0) === 7 ||
    ["admin", "bod", "som"].includes(dashboard.authUser?.role);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-slate-800 antialiased font-sans">
      {/* Sidebar */}
      <AdminSidebar
        modules={dashboard.modules}
        isMobileOpen={dashboard.isMobileSidebarOpen}
        onMobileClose={() => dashboard.setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden bg-white">
        {/* App Header */}
        <AppHeader
          title={
            isAdmin
              ? dashboard.authUser?.roleLabel || "Super Admin"
              : "Employee Master Data Ledger"
          }
          subtitle={
            isAdmin
              ? "Performance Management System"
              : "Align names and phone IDs per tool (Fusecom, FuseNet, HeroDash)"
          }
          userName={dashboard.userName}
          onMenuClick={() => dashboard.setIsMobileSidebarOpen(true)}
          onLogoutClick={() => dashboard.setShowLogoutModal(true)}
        />

        {/* Main Body */}
        <main className="flex-1 overflow-y-auto bg-[#f8fafc] p-4 sm:p-6 lg:p-8">
          <div className="w-full space-y-6">
            {/* Search & Account Filter Toolbar (Inline) */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
              {/* Search bar on the left */}
              <div className="relative flex-1 w-full">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by SIBS ID, employee name, phone ID, or tool alias..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-9 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#ff5c28] focus:ring-2 focus:ring-[#ff5c28]/20 focus:outline-none transition"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Filtering inline on the right side */}
              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 focus:border-[#ff5c28] focus:outline-none"
                >
                  <option value="">All Accounts / Campaigns</option>
                  {accountsList.map((acc) => (
                    <option key={acc} value={acc}>
                      {acc}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedAccount("");
                    setCurrentPage(1);
                  }}
                  title="Reset filters"
                  className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
                  Reset
                </button>
              </div>
            </div>

            {/* Error notice if any */}
            {errorMsg && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700">
                {errorMsg}
              </div>
            )}

            {/* Master Identity Ledger Table */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
              <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600 shadow-xs">
                    <tr>
                      <th className="px-4 py-3.5">SIBS ID</th>
                      <th className="px-4 py-3.5">Official Kronos Name</th>
                      <th className="px-4 py-3.5">Phone / Login</th>
                      <th className="px-4 py-3.5">
                        <span className="text-orange-600">●</span> Fusecom Name
                      </th>
                      <th className="px-4 py-3.5">
                        <span className="text-blue-600">●</span> FuseNet Name
                      </th>
                      <th className="px-4 py-3.5">
                        <span className="text-amber-600">●</span> HeroDash Name
                      </th>
                      <th className="px-4 py-3.5">Account / Department</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="py-16 text-center text-slate-400">
                          <Loader2 className="mx-auto h-7 w-7 animate-spin text-[#ff5c28] mb-2" />
                          Loading employee identities...
                        </td>
                      </tr>
                    ) : !searchTerm.trim() && !selectedAccount ? (
                      <tr>
                        <td colSpan={7} className="py-16 text-center text-slate-400">
                          <Search className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                          Please enter an employee name, SIBS ID, or tool alias in the search bar above to view their record.
                        </td>
                      </tr>
                    ) : ledgerList.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-14 text-center text-slate-400">
                          <Users className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                          {selectedAccount && selectedAccount.trim().toLowerCase() !== "us visa" ? (
                            <span>
                              No master data records found for{" "}
                              <strong className="text-slate-600 font-semibold">
                                {selectedAccount}
                              </strong>
                              . Tool identity alignment is currently active for{" "}
                              <strong className="text-slate-600 font-semibold">
                                US Visa
                              </strong>{" "}
                              only.
                            </span>
                          ) : (
                            "No matching employees found for the current search and filter criteria."
                          )}
                        </td>
                      </tr>
                    ) : (
                      ledgerList.map((emp) => (
                        <tr
                          key={emp.sibsId}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          {/* SIBS ID */}
                          <td className="px-4 py-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                            <span className="rounded-md bg-slate-100 border border-slate-200 px-2 py-1">
                              {emp.sibsId}
                            </span>
                          </td>

                          {/* Official Kronos Name & Email */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <div className="font-semibold text-slate-900">
                              {emp.fullName}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {emp.email || "No email"}
                            </div>
                          </td>

                          {/* Phone ID / Login */}
                          <td className="px-4 py-3.5 whitespace-nowrap font-mono">
                            <div className="text-slate-800">
                              Phone: <span className="font-semibold">{emp.phoneId || "—"}</span>
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Login: {emp.agentLogin || "—"}
                            </div>
                          </td>

                          {/* Fusecom Name */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <div className="text-slate-800 font-medium">
                              {emp.toolMappings?.fusecom?.name || "—"}
                            </div>
                            <span
                              className={`inline-block mt-0.5 rounded px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider ${
                                emp.toolMappings?.fusecom?.type === "EXACT"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}
                            >
                              {emp.toolMappings?.fusecom?.type || "EXACT"}
                            </span>
                          </td>

                          {/* FuseNet Name */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <div className="text-slate-800 font-medium">
                              {emp.toolMappings?.fusenet?.name || "—"}
                            </div>
                            <span
                              className={`inline-block mt-0.5 rounded px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider ${
                                emp.toolMappings?.fusenet?.type === "EXACT"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-blue-50 text-blue-700 border border-blue-200"
                              }`}
                            >
                              {emp.toolMappings?.fusenet?.type || "EXACT"}
                            </span>
                          </td>

                          {/* HeroDash Name */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <div className="text-slate-800 font-medium">
                              {emp.toolMappings?.herodash?.name || "—"}
                            </div>
                            <span
                              className={`inline-block mt-0.5 rounded px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider ${
                                emp.toolMappings?.herodash?.type === "EXACT"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}
                            >
                              {emp.toolMappings?.herodash?.type || "EXACT"}
                            </span>
                          </td>

                          {/* Account / Department */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className="inline-flex items-center rounded-md bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">
                              {emp.account || "Unassigned"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalCount > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/70 px-4 py-3 text-xs text-slate-600">
                  {/* Item counter */}
                  <div>
                    Showing{" "}
                    <span className="font-semibold text-slate-900">
                      {(currentPage - 1) * pageSize + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-semibold text-slate-900">
                      {Math.min(currentPage * pageSize, totalCount)}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-slate-900">
                      {totalCount}
                    </span>{" "}
                    employees
                  </div>

                  {/* Pagination Buttons: Only show when multiple pages exist */}
                  {totalPages > 1 && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                        disabled={currentPage === 1 || isLoading}
                        title="Previous page"
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>

                      <span className="px-2 font-medium text-slate-700">
                        Page {currentPage} of {totalPages}
                      </span>

                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                        disabled={currentPage >= totalPages || isLoading}
                        title="Next page"
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Confirmation & Loading Modals for Logout */}
      <ConfirmationModal
        isOpen={dashboard.showLogoutModal}
        title="Sign Out"
        message="Are you sure you want to log out?"
        confirmText="Log Out"
        cancelText="Cancel"
        onConfirm={dashboard.handleLogout}
        onCancel={() => dashboard.setShowLogoutModal(false)}
      />

      <LoadingModal
        isOpen={dashboard.isLoggingOut}
        message="Signing out..."
      />
    </div>
  );
}
