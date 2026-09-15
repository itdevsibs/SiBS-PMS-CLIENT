// Professional Workforce Capacity & Occupancy Snapshot for WFM.
import {
  ArrowRight,
  Headphones,
  Mail,
  TrendingUp,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function WfmOccupancySnapshot({
  stats = {
    totalEmployees: 0,
    actualEfficiency: "0%",
    phoneOccupancy: "0%",
    handledCalls: 0,
    actualEmails: 0,
  },
  isLoading = false,
}) {
  const navigate = useNavigate();
  const phoneOccVal = parseFloat(String(stats.phoneOccupancy || "0").replace("%", "")) || 0;
  const effVal = parseFloat(String(stats.actualEfficiency || "0").replace("%", "")) || 0;

  return (
    <article className="rounded-xl border border-slate-200/90 bg-white relative z-10 flex flex-col h-[385px] shadow-2xs overflow-hidden">
      {/* Clean Header */}
      <div className="border-b border-slate-100 bg-slate-50/50 px-4 py-2.5 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Users size={14} className="text-slate-500 shrink-0" />
          <h3 className="m-0 text-xs sm:text-[13px] font-bold text-slate-800">
            Capacity & Occupancy
          </h3>
        </div>

        <button
          type="button"
          onClick={() => navigate("/dashboard/occupancy")}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-sibs-primary-1 hover:text-sibs-primary-2 cursor-pointer transition-colors"
        >
          <span>Roster</span>
          <ArrowRight size={11} />
        </button>
      </div>

      {/* Content Body */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-3.5">
        {isLoading ? (
          <div className="space-y-3 py-2">
            <div className="h-14 rounded-lg bg-slate-100 animate-pulse" />
            <div className="h-12 rounded-lg bg-slate-100 animate-pulse" />
            <div className="h-12 rounded-lg bg-slate-100 animate-pulse" />
          </div>
        ) : (
          <>
            {/* Top Metric Tiles */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-2.5">
                <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                  <Users size={11} className="text-slate-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Headcount
                  </span>
                </div>
                <p className="m-0 text-xl font-black text-sibs-primary-1 leading-none">
                  {stats.totalEmployees || 0}
                  <span className="text-[11px] font-semibold text-slate-400 ml-1">Agents</span>
                </p>
              </div>

              <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-2.5">
                <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                  <Headphones size={11} className="text-slate-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Calls Handled
                  </span>
                </div>
                <p className="m-0 text-xl font-black text-sibs-primary-1 leading-none">
                  {Number(stats.handledCalls || 0).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Dials & Gauges */}
            <div className="space-y-3">
              {/* Phone Occupancy */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-700 text-[11px] flex items-center gap-1.5">
                    <Headphones size={12} className="text-slate-500" />
                    Phone Occupancy Rate
                  </span>
                  <span className="font-extrabold text-sibs-primary-1 text-[11px]">
                    {stats.phoneOccupancy || "0%"}
                  </span>
                </div>

                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-sibs-primary-2 transition-all duration-500"
                    style={{ width: `${Math.min(phoneOccVal, 100)}%` }}
                  />
                </div>

                <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-medium">
                  <span>Target Range: 75% - 85%</span>
                  <span
                    className={`font-semibold ${
                      phoneOccVal >= 75 && phoneOccVal <= 85
                        ? "text-emerald-600"
                        : phoneOccVal > 85
                        ? "text-amber-600"
                        : "text-slate-400"
                    }`}
                  >
                    {phoneOccVal >= 75 && phoneOccVal <= 85
                      ? "Optimal Utilization"
                      : phoneOccVal > 85
                      ? "High Burnout Risk"
                      : "Available Capacity"}
                  </span>
                </div>
              </div>

              {/* Workforce Efficiency */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-700 text-[11px] flex items-center gap-1.5">
                    <TrendingUp size={12} className="text-emerald-600" />
                    Workforce Efficiency
                  </span>
                  <span className="font-extrabold text-sibs-primary-1 text-[11px]">
                    {stats.actualEfficiency || "0%"}
                  </span>
                </div>

                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${Math.min(effVal, 100)}%` }}
                  />
                </div>

                <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-medium">
                  <span>Productive vs Rostered Hours</span>
                  <span className={effVal >= 85 ? "font-semibold text-emerald-600" : "font-semibold text-slate-400"}>
                    {effVal >= 85 ? "Healthy Adherence" : "Standard"}
                  </span>
                </div>
              </div>

              {/* Back-office / Emails Handled */}
              {Number(stats.actualEmails || 0) > 0 && (
                <div className="flex items-center justify-between rounded-lg border border-slate-200/80 bg-slate-50/50 px-2.5 py-1.5 text-xs">
                  <span className="flex items-center gap-1.5 text-slate-500 font-semibold text-[10.5px]">
                    <Mail size={12} className="text-slate-500" />
                    Back-office Emails:
                  </span>
                  <span className="font-bold text-sibs-primary-1 text-[11px]">
                    {Number(stats.actualEmails || 0).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* Bottom Navigation */}
            <div className="pt-2.5 mt-1 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => navigate("/dashboard/occupancy")}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-sibs-primary-1 hover:text-sibs-primary-2 transition-colors cursor-pointer"
              >
                <span>Full Occupancy Table</span>
                <ArrowRight size={11} />
              </button>
            </div>
          </>
        )}
      </div>
    </article>
  );
}
