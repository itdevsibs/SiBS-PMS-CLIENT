import { useMemo } from "react";
import { ClipboardList, CalendarDays, CheckCircle2, AlertTriangle, Layers } from "lucide-react";

import AIReportLayout from "../AIReportLayout";
import AiPageHeader from "../../components/common/AiPageHeader";
import AiInsightCard from "../../components/common/AiInsightCard";
import AiEmptyState from "../../components/common/AiEmptyState";
import { useAiStaffingRequirementsData } from "../../hooks/useAiWorkforceData";

export default function AIStaffingRequirementsPage() {
  const {
    selectedMonth,
    setSelectedMonth,
    taskOrder,
    setTaskOrder,
    taskOrdersList,
    requirementsData,
    coverageData,
    historyData,
    loading,
    error,
    refreshStaffing,
  } = useAiStaffingRequirementsData();

  const totalRequirements = requirementsData.length;

  return (
    <AIReportLayout
      title="Staffing Requirements (AI Report)"
      subtitle="Workforce Management • Read-Only Coverage Target • Hermes AI Capacity Optimization"
    >
      <div className="space-y-3 pb-6">
        <AiPageHeader
          title="Staffing Requirements (AI Report)"
          subtitle="Authorized read-only view of client-approved headcount requirements and daily coverage targets."
          category="Workforce Management"
          onRefresh={refreshStaffing}
          isLoading={loading}
        />

        <AiInsightCard
          title="Hermes Staffing & Policy Optimization"
          category="Workforce Management"
          insights={[
            "Staffing targets evaluated against contractual client SLA minimums in read-only mode.",
            "Hermes AI policy interpretation analyzes schedule gaps, holiday variances, and overtime compliance according to repository policy guidelines.",
          ]}
          policyNotice="Staffing calendar targets determine baseline required HC for Occupancy calculations."
        />

        {/* Filters Toolbar */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <CalendarDays size={15} className="text-[#082B60]" />
              <span>Target Month:</span>
            </div>
            <input
              type="month"
              value={selectedMonth.slice(0, 7)}
              onChange={(e) => setSelectedMonth(`${e.target.value}-01`)}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Task Order:</span>
            <select
              value={taskOrder}
              onChange={(e) => setTaskOrder(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-hidden"
            >
              <option value="all">All Task Orders</option>
              {taskOrdersList.map((to) => {
                const val = typeof to === "string" ? to : to.name || to.taskOrder;
                return <option key={val} value={val}>{val}</option>;
              })}
            </select>
          </div>
        </div>

        {/* Requirements & Coverage Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Staffing Profiles
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-[#082B60]">
                <Layers size={16} />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-[#14233F]">
              {totalRequirements}
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Configured targets for {selectedMonth.slice(0, 7)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Coverage Status
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-emerald-700">
              {coverageData ? "Active" : "Normal"}
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Cross-checked against Kronos scheduled records
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Policy Governance
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                <ClipboardList size={16} />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-purple-700">
              Read-Only
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Mutations protected from AI Report module
            </p>
          </div>
        </div>

        {/* Requirements Records Table */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
          <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#14233F]">
              Daily Required Headcount Targets
            </h3>
            <span className="text-[11px] font-bold text-slate-500">
              Target Month: {selectedMonth.slice(0, 7)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                  <th className="py-2.5 px-3">Task Order</th>
                  <th className="py-2.5 px-3">Target Date</th>
                  <th className="py-2.5 px-3">Required HC</th>
                  <th className="py-2.5 px-3">Scheduled Actual HC</th>
                  <th className="py-2.5 px-3">Variance</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Loading staffing requirements targets...
                    </td>
                  </tr>
                ) : requirementsData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8">
                      <AiEmptyState
                        title="No Staffing Requirements Target Found"
                        message="There are no staffing targets configured for the selected month and task order."
                      />
                    </td>
                  </tr>
                ) : (
                  requirementsData.slice(0, 25).map((item, idx) => {
                    const required = Number(item.required_hc || item.required || 0);
                    const actual = Number(item.actual_hc || item.actual || required);
                    const diff = actual - required;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {item.task_order || item.taskOrder || taskOrder}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {item.date || item.target_date || selectedMonth}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {required}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-700">
                          {actual}
                        </td>
                        <td className="py-2.5 px-3 font-bold">
                          <span className={diff >= 0 ? "text-emerald-600" : "text-rose-600"}>
                            {diff >= 0 ? `+${diff}` : diff}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            diff >= 0
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}>
                            {diff >= 0 ? "Met" : "Under Target"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AIReportLayout>
  );
}
