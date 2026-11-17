import { BrainCircuit, ShieldCheck, RefreshCw } from "lucide-react";
import AiBadge from "./AiBadge";

export default function AiPageHeader({
  title,
  subtitle,
  category,
  onRefresh,
  isLoading = false,
  extraActions = null,
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 pt-1">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#082B60] text-white shadow-xs">
          <BrainCircuit size={24} className="text-[#ff5c28]" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-[#14233F] tracking-tight">
              {title}
            </h1>
            <AiBadge variant="primary" icon="sparkles">
              Hermes AI Ready
            </AiBadge>
            <AiBadge variant="neutral" icon="shield">
              Read-Only Data
            </AiBadge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {subtitle || `AI-isolated reporting module for ${category || "SiBS PMS"}`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto">
        {extraActions}
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw size={13} className={isLoading ? "animate-spin text-[#082B60]" : "text-slate-500"} />
            <span>Refresh</span>
          </button>
        )}
      </div>
    </div>
  );
}
