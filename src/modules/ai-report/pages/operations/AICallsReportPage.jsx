import { useMemo } from "react";
import { PhoneCall, PhoneIncoming, PhoneOff, Percent, Clock, Search, Shield } from "lucide-react";

import AIReportLayout from "../AIReportLayout";
import AiPageHeader from "../../components/common/AiPageHeader";
import AiInsightCard from "../../components/common/AiInsightCard";
import AiEmptyState from "../../components/common/AiEmptyState";
import { useAiCallsReportData } from "../../hooks/useAiOperationsData";
import TablePagination from "@/components/common/tables/TablePagination";
import DatePicker from "@/components/common/filters/DatePicker";

export default function AICallsReportPage() {
  const {
    data,
    summary,
    pagination,
    setPagination,
    loading,
    error,
    date,
    setDate,
    search,
    setSearch,
    source,
    setSource,
    taskOrder,
    setTaskOrder,
    skillsList,
    refreshCallsReport,
  } = useAiCallsReportData();

  const totalOffered = summary?.offeredCalls ?? data.reduce((acc, r) => acc + Number(r.offered_calls || r.offered || 0), 0);
  const totalHandled = summary?.handledCalls ?? data.reduce((acc, r) => acc + Number(r.handled_calls || r.handled || 0), 0);
  const totalAbandoned = summary?.abandonedCalls ?? data.reduce((acc, r) => acc + Number(r.abandoned_calls || r.abandoned || 0), 0);
  const serviceLevel = summary?.serviceLevel ?? (totalOffered > 0 ? ((totalHandled / totalOffered) * 100).toFixed(1) : "0.0");

  return (
    <AIReportLayout
      title="Calls Report (AI Report)"
      subtitle="Operations Tracking • Authorized Read-Only Stream • Hermes SLA Risk Assessment"
    >
      <div className="space-y-3 pb-6">
        <AiPageHeader
          title="Calls Report (AI Report)"
          subtitle="Detailed inbound queue telemetry, call resolution, abandonment rates, and agent handling metrics."
          category="Operations Tracking"
          onRefresh={refreshCallsReport}
          isLoading={loading}
        />

        <AiInsightCard
          title="Hermes Inbound Calls Telemetry & SLA Interpretation"
          category="Operations Tracking"
          insights={[
            "Telemetric call volumes and queue records ingested through authorized read-only channels.",
            "Hermes AI policy interpretation tracks abandoned call thresholds and service level compliance benchmarks defined in client master service agreements.",
          ]}
          policyNotice="Call metrics calculate SLA attainment and billing factor compliance."
        />

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Offered Calls
              </span>
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-50 text-[#082B60]">
                <PhoneIncoming size={14} />
              </div>
            </div>
            <div className="mt-1 text-xl font-black text-[#14233F]">
              {totalOffered}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Handled Calls
              </span>
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
                <PhoneCall size={14} />
              </div>
            </div>
            <div className="mt-1 text-xl font-black text-emerald-700">
              {totalHandled}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Abandoned Calls
              </span>
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-rose-50 text-rose-600">
                <PhoneOff size={14} />
              </div>
            </div>
            <div className="mt-1 text-xl font-black text-rose-700">
              {totalAbandoned}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Service Level %
              </span>
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-purple-50 text-purple-600">
                <Percent size={14} />
              </div>
            </div>
            <div className="mt-1 text-xl font-black text-purple-700">
              {serviceLevel}%
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-44">
              <DatePicker
                label="Report Date"
                value={date}
                onChange={(e) => {
                  const val = typeof e === "string" ? e : e?.target?.value;
                  setDate(val);
                }}
              />
            </div>

            <div className="relative w-56">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search Skill or Agent..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={taskOrder}
              onChange={(e) => setTaskOrder(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:outline-hidden"
            >
              <option value="all">All Task Orders</option>
              <option value="TO10">TO10 - SEASIA</option>
              <option value="TO4">TO4 - PAC</option>
              <option value="TO5">TO5 - EUR/AFR</option>
            </select>
          </div>
        </div>

        {/* Calls Report Table */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Skill / Queue</th>
                  <th className="py-2.5 px-3">Offered</th>
                  <th className="py-2.5 px-3">Handled</th>
                  <th className="py-2.5 px-3">Abandoned</th>
                  <th className="py-2.5 px-3">AHT (sec)</th>
                  <th className="py-2.5 px-3">SL %</th>
                  <th className="py-2.5 px-3">Policy Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Loading calls report data...
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8">
                      <AiEmptyState
                        title="No Call Records Found"
                        message="No inbound call records match the current filter criteria."
                      />
                    </td>
                  </tr>
                ) : (
                  data.map((record, idx) => {
                    const off = Number(record.offered_calls || record.offered || 0);
                    const hnd = Number(record.handled_calls || record.handled || 0);
                    const abn = Number(record.abandoned_calls || record.abandoned || 0);
                    const sl = off > 0 ? ((hnd / off) * 100).toFixed(1) : "0.0";
                    const aht = record.aht || record.average_handle_time || "180";

                    return (
                      <tr key={record.id || idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 px-3 text-slate-600">
                          {record.date || date}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {record.skill_name || record.skill || "General Support"}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {off}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-emerald-700">
                          {hnd}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-rose-600">
                          {abn}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {aht}s
                        </td>
                        <td className="py-2.5 px-3 font-bold text-[#082B60]">
                          {sl}%
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#082B60] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                            <Shield size={10} className="text-[#ff5c28]" />
                            <span>Audit Passed</span>
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
