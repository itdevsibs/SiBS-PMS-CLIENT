import { Sparkles, ArrowRight, BookOpen, AlertCircle } from "lucide-react";

export default function AiInsightCard({
  title = "AI Executive Summary",
  category = "Analysis",
  insights = [],
  policyNotice = "",
  className = "",
}) {
  return (
    <div className={`rounded-xl border border-blue-100 bg-linear-to-r from-blue-50/70 via-slate-50 to-white p-4 shadow-2xs ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-blue-100/70">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#082B60] text-white">
            <Sparkles size={14} className="text-[#ff5c28]" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-[#082B60]">
              {title}
            </h4>
            <span className="text-[10px] text-slate-500 font-medium">
              Category: {category} • Hermes AI Ready
            </span>
          </div>
        </div>

        {policyNotice && (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 bg-white/90 px-2.5 py-1 rounded-md border border-slate-200">
            <BookOpen size={12} className="text-[#082B60] shrink-0" />
            <span className="truncate max-w-xs">{policyNotice}</span>
          </div>
        )}
      </div>

      <div className="mt-3 space-y-2">
        {insights.length > 0 ? (
          insights.map((insight, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
              <ArrowRight size={13} className="text-[#ff5c28] mt-0.5 shrink-0" />
              <span className="leading-snug">{insight}</span>
            </div>
          ))
        ) : (
          <div className="flex items-center gap-2 text-xs text-slate-500 italic py-1">
            <AlertCircle size={14} className="text-slate-400" />
            <span>
              Telemetry and reporting parameters active. Automated Hermes AI insights will stream here upon model connector activation.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
