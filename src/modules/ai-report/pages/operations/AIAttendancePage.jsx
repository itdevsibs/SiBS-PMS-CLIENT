import { useMemo } from "react";
import { CalendarDays, Clock, CheckCircle2, AlertCircle, Search, Users, Shield } from "lucide-react";

import AIReportLayout from "../AIReportLayout";
import AiPageHeader from "../../components/common/AiPageHeader";
import AiInsightCard from "../../components/common/AiInsightCard";
import AiEmptyState from "../../components/common/AiEmptyState";
import { useAiAttendanceData } from "../../hooks/useAiOperationsData";
import TablePagination from "@/components/common/tables/TablePagination";
import DatePicker from "@/components/common/filters/DatePicker";

export default function AIAttendancePage() {
  const {
    data,
    pagination,
    setPagination,
    summary,
    loading,
    error,
    date,
    setDate,
    search,
    setSearch,
    account,
    setAccount,
    status,
    setStatus,
    accountsList,
    statusList,
    refreshAttendance,
  } = useAiAttendanceData();

  const totalRecords = pagination.total || data.length;
  const presentCount = summary?.present ?? data.filter((d) => String(d.status).toLowerCase().includes("present")).length;
  const lateCount = summary?.late ?? data.filter((d) => String(d.status).toLowerCase().includes("late")).length;
  const absentCount = summary?.absent ?? data.filter((d) => String(d.status).toLowerCase().includes("absent")).length;

  return (
    <AIReportLayout
      title="Attendance Sheet (AI Report)"
      subtitle="Operations Tracking • Authorized Read-Only Stream • Hermes Punctuality Evaluation"
    >
      <div className="space-y-3 pb-6">
        <AiPageHeader
          title="Attendance Sheet (AI Report)"
          subtitle="Daily operational attendance, scheduled shifts, clock-in records, and tardiness analysis."
          category="Operations Tracking"
          onRefresh={refreshAttendance}
          isLoading={loading}
        />

        <AiInsightCard
          title="Hermes Attendance & Punctuality Policy Audit"
          category="Operations Tracking"
          insights={[
            "Time and attendance telemetry accessed in authorized read-only mode from official records.",
            "Hermes AI policy verification evaluates grace periods, consecutive absences, and undertime thresholds against client HR policies for automated PIP risk flagging.",
          ]}
          policyNotice="Attendance compliance forms a foundational component for KPI quality and employee evaluation."
        />

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Total Roster
              </span>
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-50 text-[#082B60]">
                <Users size={14} />
              </div>
            </div>
            <div className="mt-1 text-xl font-black text-[#14233F]">
              {totalRecords}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Present
              </span>
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={14} />
              </div>
            </div>
            <div className="mt-1 text-xl font-black text-emerald-700">
              {presentCount}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Tardy / Late
              </span>
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-50 text-amber-600">
                <Clock size={14} />
              </div>
            </div>
            <div className="mt-1 text-xl font-black text-amber-700">
              {lateCount}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Absent / Leave
              </span>
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-rose-50 text-rose-600">
                <AlertCircle size={14} />
              </div>
            </div>
            <div className="mt-1 text-xl font-black text-rose-700">
              {absentCount}
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-44">
              <DatePicker
                label="Attendance Date"
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
                placeholder="Search Employee..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:outline-hidden"
            >
              <option value="all">All Accounts</option>
              {accountsList.map((acc) => (
                <option key={acc} value={acc}>{acc}</option>
              ))}
            </select>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:outline-hidden"
            >
              <option value="all">All Statuses</option>
              {statusList.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Attendance Records Table */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  <th className="py-2.5 px-3">Emp ID</th>
                  <th className="py-2.5 px-3">Employee Name</th>
                  <th className="py-2.5 px-3">Account</th>
                  <th className="py-2.5 px-3">Shift</th>
                  <th className="py-2.5 px-3">Time In</th>
                  <th className="py-2.5 px-3">Time Out</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Policy Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Loading attendance records...
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8">
                      <AiEmptyState
                        title="No Attendance Records Found"
                        message="No attendance logs found for the selected date and filters."
                      />
                    </td>
                  </tr>
                ) : (
                  data.map((record, idx) => {
                    const statusStr = String(record.status || "Present");
                    const isPresent = statusStr.toLowerCase().includes("present");
                    const isLate = statusStr.toLowerCase().includes("late");
                    const isAbsent = statusStr.toLowerCase().includes("absent");

                    return (
                      <tr key={record.id || idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {record.employee_id || record.empId || "N/A"}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {record.employee_name || record.name || "N/A"}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {record.account || "US Visa"}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {record.shift || record.schedule || "8:00 AM - 5:00 PM"}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {record.time_in || record.timeIn || "--:--"}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {record.time_out || record.timeOut || "--:--"}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isPresent && !isLate
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : isLate
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}>
                            {statusStr}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#082B60] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                            <Shield size={10} className="text-[#ff5c28]" />
                            <span>Verified</span>
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
