import React from "react";
import { FileQuestion, AlertCircle } from "lucide-react";

export default function FrontStepsAiEmptyState({
  title = "No Data Available",
  message = "No authorized FrontSteps records found for the selected reporting period.",
  notice = "Values will populate automatically when FrontSteps Calls or Cases files are imported.",
  actionLabel = null,
  onAction = null,
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-xl border border-dashed border-slate-200 font-jakarta">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400 mb-3">
        <FileQuestion size={24} />
      </div>
      <h3 className="text-sm font-bold text-slate-800">{title}</h3>
      <p className="text-xs text-slate-500 max-w-sm mt-1 mb-2 leading-relaxed">
        {message}
      </p>
      {notice && (
        <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50/70 border border-blue-100 rounded-lg text-[11px] text-[#042c51] font-medium mb-3">
          <AlertCircle size={12} className="text-[#ff5c28] shrink-0" />
          <span>{notice}</span>
        </div>
      )}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="px-3.5 py-1.5 rounded-lg bg-[#042c51] text-white text-xs font-bold hover:bg-[#03203c] transition-all cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
