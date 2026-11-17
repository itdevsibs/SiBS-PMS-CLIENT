import { useMemo, useState } from "react";
import { Users, TrendingUp, Headphones, PhoneCall, AlertCircle, Clock } from "lucide-react";

import AIReportLayout from "../AIReportLayout";
import AiPageHeader from "../../components/common/AiPageHeader";
import AiInsightCard from "../../components/common/AiInsightCard";
import AiEmptyState from "../../components/common/AiEmptyState";
import { useAiOccupancyData } from "../../hooks/useAiOperationsData";
import OccupancyTable from "@/components/modules/occupancy/OccupancyTable";

export default function AIOccupancyPage() {
  const { data, loading, error, refreshOccupancy } = useAiOccupancyData();
  const [activeRecords, setActiveRecords] = useState([]);

  // Compute summary metrics safely
  const summaryStats = useMemo(() => {
    const list = activeRecords.length > 0 ? activeRecords : data;
    const totalEmployees = list.length;
    let totalEff = 0;
    let validEffCount = 0;

    for (const row of list) {
      const eff = parseFloat(row.actual_efficiency || row.efficiency || row.occupancy_rate || 0);
      if (!isNaN(eff) && eff > 0) {
        totalEff += eff;
        validEffCount++;
      }
    }

    const avgEff = validEffCount > 0 ? (totalEff / validEffCount).toFixed(1) : "0.0";
    return {
      totalEmployees,
      avgEfficiency: `${avgEff}%`,
    };
  }, [data, activeRecords]);

  return (
    <AIReportLayout
      title="Occupancy (AI Report)"
      subtitle="Operations Tracking • Authorized Read-Only Stream • Hermes Anomaly Detection"
    >
      <div className="space-y-3 pb-6">
        <AiPageHeader
          title="Occupancy Tracking (AI Report)"
          subtitle="Real-time employee occupancy, auxiliary status, and operational efficiency analysis."
          category="Operations Tracking"
          onRefresh={refreshOccupancy}
          isLoading={loading}
        />

        <AiInsightCard
          title="Hermes Occupancy & Efficiency Intelligence"
          category="Operations Tracking"
          insights={[
            "Operational occupancy records streamed in authorized read-only mode.",
            "Hermes AI anomaly detection evaluates auxiliary utilization against contractual adherence thresholds.",
          ]}
          policyNotice="Occupancy metrics evaluate billable hours and agent productive time."
        />

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Total Agents
              </span>
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-50 text-[#082B60]">
                <Users size={14} />
              </div>
            </div>
            <div className="mt-1 text-xl font-black text-[#14233F]">
              {summaryStats.totalEmployees}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Avg Efficiency
              </span>
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
                <TrendingUp size={14} />
              </div>
            </div>
            <div className="mt-1 text-xl font-black text-emerald-700">
              {summaryStats.avgEfficiency}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Operational State
              </span>
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-purple-50 text-purple-600">
                <Headphones size={14} />
              </div>
            </div>
            <div className="mt-1 text-xl font-black text-purple-700">
              Live
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Policy Governance
              </span>
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-50 text-amber-600">
                <Clock size={14} />
              </div>
            </div>
            <div className="mt-1 text-xl font-black text-amber-700">
              Protected
            </div>
          </div>
        </div>

        {/* Occupancy Table Component */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
          {data.length === 0 && !loading ? (
            <AiEmptyState
              title="No Occupancy Data Available"
              message="No occupancy records found in the current session. Occupancy data will display automatically when recorded."
            />
          ) : (
            <OccupancyTable
              data={data}
              isLoading={loading}
              onFilteredDataChange={setActiveRecords}
            />
          )}
        </div>
      </div>
    </AIReportLayout>
  );
}
