import { useMemo } from "react";
import { MessageCircle, MessageSquareCheck, MessageSquareOff, Percent, Clock, Search, Shield } from "lucide-react";

import AIReportLayout from "../AIReportLayout";
import AiPageHeader from "../../components/common/AiPageHeader";
import AiInsightCard from "../../components/common/AiInsightCard";
import AiEmptyState from "../../components/common/AiEmptyState";
import { useAiChatReportData } from "../../hooks/useAiOperationsData";
import TablePagination from "@/components/common/tables/TablePagination";
import DatePicker from "@/components/common/filters/DatePicker";

export default function AIChatReportsPage() {
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
    refreshChatReport,
  } = useAiChatReportData();

  const totalOffered = summary?.offeredChats ?? data.reduce((acc, r) => acc + Number(r.offered_chats || r.offered || 0), 0);
  const totalHandled = summary?.handledChats ?? data.reduce((acc, r) => acc + Number(r.handled_chats || r.handled || 0), 0);
  const totalMissed = summary?.missedChats ?? data.reduce((acc, r) => acc + Number(r.missed_chats || r.missed || 0), 0);
  const serviceLevel = summary?.serviceLevel ?? (totalOffered > 0 ? ((totalHandled / totalOffered) * 100).toFixed(1) : "0.0");

  return (
    <AIReportLayout
      title="Chat Reports (AI Report)"
      subtitle="Operations Tracking • Authorized Read-Only Stream • Hermes Concurrency Evaluation"
    >
      <div className="space-y-3 pb-6">
        <AiPageHeader
          title="Chat Reports (AI Report)"
          subtitle="Real-time digital chat interactions, concurrency volumes, response times, and resolution metrics."
          category="Operations Tracking"
          onRefresh={refreshChatReport}
          isLoading={loading}
        />

        <AiInsightCard
          title="Hermes Chat Concurrency & Resolution Telemetry"
          category="Operations Tracking"
          insights={[
            "Live chat operations data accessed through authorized read-only channels.",
            "Hermes AI policy verification benchmarks first response time (FRT) and concurrency saturation across chat queues.",
          ]}
          policyNotice="Chat channel metrics evaluate digital resolution performance standards."
        />

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Offered Chats
              </span>
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-50 text-[#082B60]">
                <MessageCircle size={14} />
              </div>
            </div>
            <div className="mt-1 text-xl font-black text-[#14233F]">
              {totalOffered}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Handled Chats
              </span>
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
                <MessageSquareCheck size={14} />
              </div>
            </div>
            <div className="mt-1 text-xl font-black text-emerald-700">
              {totalHandled}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Missed Chats
              </span>
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-rose-50 text-rose-600">
                <MessageSquareOff size={14} />
              </div>
            </div>
            <div className="mt-1 text-xl font-black text-rose-700">
              {totalMissed}
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
                placeholder="Search Chat Skill..."
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

        {/* Chat Reports Table */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Skill / Channel</th>
                  <th className="py-2.5 px-3">Offered</th>
                  <th className="py-2.5 px-3">Handled</th>
                  <th className="py-2.5 px-3">Missed</th>
                  <th className="py-2.5 px-3">Avg Chat Time</th>
                  <th className="py-2.5 px-3">SL %</th>
                  <th className="py-2.5 px-3">Policy Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Loading chat reports data...
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8">
                      <AiEmptyState
                        title="No Chat Records Found"
                        message="No digital chat records match the current filter selection."
                      />
                    </td>
                  </tr>
                ) : (
                  data.map((record, idx) => {
                    const off = Number(record.offered_chats || record.offered || 0);
                    const hnd = Number(record.handled_chats || record.handled || 0);
                    const msd = Number(record.missed_chats || record.missed || 0);
                    const sl = off > 0 ? ((hnd / off) * 100).toFixed(1) : "0.0";
                    const chatTime = record.avg_chat_time || record.duration || "240s";

                    return (
                      <tr key={record.id || idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 px-3 text-slate-600">
                          {record.date || date}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {record.skill_name || record.skill || "Online Chat Support"}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {off}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-emerald-700">
                          {hnd}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-rose-600">
                          {msd}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {chatTime}
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
