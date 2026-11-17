import { useMemo } from "react";
import { Users, Search, Database, CheckCircle2, AlertCircle, Shield } from "lucide-react";

import AIReportLayout from "../AIReportLayout";
import AiPageHeader from "../../components/common/AiPageHeader";
import AiInsightCard from "../../components/common/AiInsightCard";
import AiEmptyState from "../../components/common/AiEmptyState";
import { useAiEmployeeLedgerData } from "../../hooks/useAiWorkforceData";
import TablePagination from "@/components/common/tables/TablePagination";

export default function AIEmployeeLedgerPage() {
  const {
    ledgerData,
    pagination,
    setPagination,
    summary,
    loading,
    error,
    search,
    setSearch,
    account,
    setAccount,
    taskOrder,
    setTaskOrder,
    status,
    setStatus,
    accountsList,
    taskOrdersList,
    refreshLedger,
  } = useAiEmployeeLedgerData();

  const totalCount = pagination.total || ledgerData.length;
  const activeCount = summary?.activeCount ?? ledgerData.filter((e) => String(e.status).toLowerCase() === "active").length;
  const inactiveCount = summary?.inactiveCount ?? (totalCount - activeCount);

  return (
    <AIReportLayout
      title="Employee Master Data Ledger (AI Report)"
      subtitle="Workforce Management • Read-Only Operational Roster • Hermes Policy Audit Ready"
    >
      <div className="space-y-3 pb-6">
        <AiPageHeader
          title="Employee Master Data Ledger (AI Report)"
          subtitle="Authorized read-only view of employee workforce records for policy audit and performance evaluation."
          category="Workforce Management"
          onRefresh={refreshLedger}
          isLoading={loading}
        />

        <AiInsightCard
          title="Hermes Workforce Policy Audit"
          category="Workforce Management"
          insights={[
            "Roster data synchronized with authorized SiBS master records in strict read-only mode.",
            "Hermes AI policy evaluation will cross-reference agent tenure, role tiers, and task order assignments against client SOPs.",
          ]}
          policyNotice="Employee ledger data governs KPI entitlement and staffing coverage calculations."
        />

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total Headcount
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-[#082B60]">
                <Users size={16} />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-[#14233F]">
              {totalCount}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Active Employees
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-emerald-700">
              {activeCount}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Inactive / On Leave
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <AlertCircle size={16} />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-amber-700">
              {inactiveCount}
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Employee ID, Name, or Email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:border-[#082B60] transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:outline-hidden"
            >
              <option value="all">All Accounts</option>
              {accountsList.map((acc) => (
                <option key={acc} value={acc}>{acc}</option>
              ))}
            </select>

            <select
              value={taskOrder}
              onChange={(e) => setTaskOrder(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:outline-hidden"
            >
              <option value="all">All Task Orders</option>
              {taskOrdersList.map((to) => (
                <option key={to} value={to}>{to}</option>
              ))}
            </select>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:outline-hidden"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  <th className="py-2.5 px-3">Emp ID</th>
                  <th className="py-2.5 px-3">Full Name</th>
                  <th className="py-2.5 px-3">Account</th>
                  <th className="py-2.5 px-3">Task Order</th>
                  <th className="py-2.5 px-3">Position</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Policy Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Loading employee master data records...
                    </td>
                  </tr>
                ) : ledgerData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8">
                      <AiEmptyState
                        title="No Employee Records Found"
                        message="No master data records match the current filter selection in the authorized database."
                      />
                    </td>
                  </tr>
                ) : (
                  ledgerData.map((emp, index) => {
                    const isEmpActive = String(emp.status || "").toLowerCase() === "active";
                    return (
                      <tr key={emp.employee_id || emp.id || index} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {emp.employee_id || emp.id || "N/A"}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {emp.full_name || emp.name || `${emp.first_name || ""} ${emp.last_name || ""}`.trim() || "N/A"}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {emp.account || "US Visa"}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {emp.task_order || emp.taskOrder || "All"}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {emp.position || emp.role || "Agent"}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isEmpActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}>
                            {isEmpActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#082B60] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                            <Shield size={10} className="text-[#ff5c28]" />
                            <span>Audit Active</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {pagination.total > 0 && (
            <div className="p-2 border-t border-slate-100">
              <TablePagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages || Math.ceil(pagination.total / pagination.limit)}
                pageSize={pagination.limit}
                totalItems={pagination.total}
                onPageChange={(p) => setPagination((prev) => ({ ...prev, page: p }))}
              />
            </div>
          )}
        </div>
      </div>
    </AIReportLayout>
  );
}
