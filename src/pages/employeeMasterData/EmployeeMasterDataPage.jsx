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

/* ─── Status badge ──────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const map = {
    UNIFIED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    ALIASED:  "bg-amber-50  text-amber-700  border-amber-200",
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
function ToolCell({ name, type, accentClass }) {
  if (!name) return <span className="text-slate-300 select-none">—</span>;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-medium text-slate-800 leading-tight">{name}</span>
      {type && (
        <span
          className={`inline-block w-fit rounded px-1.5 py-px text-[9px] font-bold uppercase tracking-wider border ${accentClass}`}
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
  const [selectedAccount, setSelectedAccount] = useState("");
  const [accountsList, setAccountsList]       = useState([]);
  const [ledgerList, setLedgerList]           = useState([]);
  const [totalCount, setTotalCount]           = useState(0);
  const [isLoading, setIsLoading]             = useState(false);
  const [errorMsg, setErrorMsg]               = useState("");
  const [currentPage, setCurrentPage]         = useState(1);
  const [totalPages, setTotalPages]           = useState(1);
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
    async (searchQuery = "", acc = "", page = 1, size = 25) => {
      const query  = searchQuery.trim();
      const hasAcc = Boolean(acc);

      if (!query && !hasAcc) {
        setLedgerList([]); setTotalCount(0); setTotalPages(1); setIsLoading(false);
        return;
      }
      if (hasAcc && acc.trim().toLowerCase() !== "us visa") {
        setLedgerList([]); setTotalCount(0); setTotalPages(1); setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true); setErrorMsg("");
        const result = await fetchMasterDataLedger({ search: query, account: acc, page, limit: size, viewAll: true });
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

  useEffect(() => { setCurrentPage(1); }, [searchTerm, selectedAccount]);

  useEffect(() => {
    const t = setTimeout(() => {
      void loadLedgerData(searchTerm, selectedAccount, currentPage, pageSize);
    }, 250);
    return () => clearTimeout(t);
  }, [searchTerm, selectedAccount, currentPage, pageSize, loadLedgerData]);

  const isAdmin =
    dashboard.authUser?.role === "admin" ||
    Number(dashboard.authUser?.adminAccess ?? dashboard.authUser?.admin_access ?? 0) === 7 ||
    ["admin", "bod", "som"].includes(dashboard.authUser?.role);

  const hasQuery = Boolean(searchTerm.trim() || selectedAccount);

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

        <main className="flex flex-1 min-h-0 flex-col gap-3 overflow-hidden p-3 sm:p-4 lg:p-5">

          {/* ── Toolbar ────────────────────────────────────────────── */}
          <div className="shrink-0 flex flex-col sm:flex-row items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-3 shadow-xs">
            {/* Search */}
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

            {/* Account select + Reset */}
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="h-9 flex-1 sm:flex-none rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700 focus:border-[#0b3b68] focus:outline-none transition"
              >
                <option value="">All Accounts</option>
                {accountsList.map((acc) => (
                  <option key={acc} value={acc}>{acc}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => { setSearchTerm(""); setSelectedAccount(""); setCurrentPage(1); }}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
              >
                <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
                Reset
              </button>
            </div>
          </div>

          {/* ── Error banner ───────────────────────────────────────── */}
          {errorMsg && (
            <div className="shrink-0 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">
              {errorMsg}
            </div>
          )}

          {/* ── Table card ─────────────────────────────────────────── */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">

            {/* Scrollable table wrapper */}
            <div
              className="flex-1 min-h-0 overflow-x-auto overflow-y-auto sibs-scrollbar scroll-smooth"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
                <table className="min-w-full text-left text-xs border-collapse">
                  {/* ── Table head ──────────────────────────────────── */}
                  <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-[10.5px] font-extrabold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                        SIBS ID
                      </th>
                      <th className="px-4 py-3 text-[10.5px] font-extrabold uppercase tracking-wider text-slate-500 whitespace-nowrap min-w-[200px]">
                        Official Kronos Name
                      </th>
                      <th className="px-4 py-3 text-[10.5px] font-extrabold uppercase tracking-wider text-slate-500 whitespace-nowrap min-w-[170px]">
                        <span className="inline-block h-2 w-2 rounded-full bg-orange-500 mr-1.5 align-middle" />
                        Fusecom Name
                      </th>
                      <th className="px-4 py-3 text-[10.5px] font-extrabold uppercase tracking-wider text-slate-500 whitespace-nowrap min-w-[170px]">
                        <span className="inline-block h-2 w-2 rounded-full bg-blue-500 mr-1.5 align-middle" />
                        FuseNet Name
                      </th>
                      <th className="px-4 py-3 text-[10.5px] font-extrabold uppercase tracking-wider text-slate-500 whitespace-nowrap min-w-[170px]">
                        <span className="inline-block h-2 w-2 rounded-full bg-amber-500 mr-1.5 align-middle" />
                        HeroDash Name
                      </th>
                      <th className="px-4 py-3 text-[10.5px] font-extrabold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                        Account
                      </th>
                      <th className="px-4 py-3 text-[10.5px] font-extrabold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                        Status
                      </th>
                    </tr>
                  </thead>

                  {/* ── Table body ──────────────────────────────────── */}
                  <tbody className="divide-y divide-slate-100">
                    {/* Loading */}
                    {isLoading && (
                      <tr>
                        <td colSpan={7} className="py-20 text-center">
                          <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-[#0b3b68]" />
                          <p className="text-xs text-slate-400">Loading employee identities…</p>
                        </td>
                      </tr>
                    )}

                    {/* Prompt — no query yet */}
                    {!isLoading && !hasQuery && (
                      <tr>
                        <td colSpan={7} className="py-20 text-center">
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
                        <td colSpan={7} className="py-20 text-center">
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
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-700 group-hover:border-slate-300">
                            {emp.sibsId}
                          </span>
                        </td>

                        {/* Official name + email */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-semibold text-slate-900 leading-tight">
                            {emp.fullName}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[220px]">
                            {emp.email || "No email"}
                          </div>
                        </td>

                        {/* Fusecom */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <ToolCell
                            name={emp.toolMappings?.fusecom?.name}
                            type={emp.toolMappings?.fusecom?.type}
                            accentClass={
                              emp.toolMappings?.fusecom?.type === "EXACT"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-orange-50 text-orange-700 border-orange-200"
                            }
                          />
                        </td>

                        {/* FuseNet */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <ToolCell
                            name={emp.toolMappings?.fusenet?.name}
                            type={emp.toolMappings?.fusenet?.type}
                            accentClass={
                              emp.toolMappings?.fusenet?.type === "EXACT"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-blue-50 text-blue-700 border-blue-200"
                            }
                          />
                        </td>

                        {/* HeroDash */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <ToolCell
                            name={emp.toolMappings?.herodash?.name}
                            type={emp.toolMappings?.herodash?.type}
                            accentClass={
                              emp.toolMappings?.herodash?.type === "EXACT"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }
                          />
                        </td>

                        {/* Account */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[10.5px] font-semibold text-slate-700">
                            {emp.account || "Unassigned"}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <StatusBadge status={emp.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            {/* ── Pagination footer ────────────────────────────────── */}
            {totalCount > 0 && (
              <div className="shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/60 px-4 py-2.5">
                {/* Count */}
                <p className="text-[11px] text-slate-500">
                  Showing{" "}
                  <span className="font-semibold text-slate-800">{(currentPage - 1) * pageSize + 1}</span>
                  {" "}to{" "}
                  <span className="font-semibold text-slate-800">{Math.min(currentPage * pageSize, totalCount)}</span>
                  {" "}of{" "}
                  <span className="font-semibold text-slate-800">{totalCount}</span>
                  {" "}employees
                </p>

                {/* Page controls */}
                {totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      disabled={currentPage === 1 || isLoading}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>

                    <span className="px-2 text-[11px] font-semibold text-slate-600">
                      {currentPage} / {totalPages}
                    </span>

                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                      disabled={currentPage >= totalPages || isLoading}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

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
