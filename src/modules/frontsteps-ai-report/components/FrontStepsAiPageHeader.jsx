import React from "react";
import { BrainCircuit, Sparkles, RefreshCw, ShieldCheck } from "lucide-react";

export default function FrontStepsAiPageHeader({
  title,
  subtitle,
  onRefresh,
  isLoading = false,
  extraActions = null,
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 pt-1 font-jakarta min-w-0">
      <div className="flex items-start sm:items-center gap-3 min-w-0">
        <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-[#042c51] text-white shadow-xs shrink-0 mt-0.5 sm:mt-0">
          <BrainCircuit size={22} className="text-[#ff5c28]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg sm:text-xl md:text-2xl font-black text-slate-800 tracking-tight truncate">
              {title}
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
              <Sparkles size={11} className="text-[#ff5c28]" />
              <span>Snapshot-Driven (0 Hermes GET)</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-orange-50 text-[#c4380d] border border-orange-200 shrink-0">
              <ShieldCheck size={11} className="text-[#ff5c28]" />
              <span>FrontSteps Isolated</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 truncate">
            {subtitle || "Dedicated AI Report module for FrontSteps operational governance"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
        {extraActions}
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
            title="Refresh FrontSteps AI Data"
          >
            <RefreshCw size={13} className={isLoading ? "animate-spin text-[#042c51]" : "text-slate-500"} />
            <span>Refresh</span>
          </button>
        )}
      </div>
    </div>
  );
}
