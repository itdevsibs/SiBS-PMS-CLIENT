import { AlertCircle, FileSearch } from "lucide-react";

export default function AiEmptyState({
  title = "No Data Found",
  message = "There are no records matching your current filter criteria in the authorized PMS database.",
  actionLabel = null,
  onAction = null,
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-xl border border-dashed border-slate-200">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400 mb-3">
        <FileSearch size={24} />
      </div>
      <h3 className="text-sm font-bold text-slate-800">{title}</h3>
      <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4 leading-relaxed">
        {message}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="px-3 py-1.5 rounded-lg bg-[#082B60] text-white text-xs font-bold hover:bg-[#062047] transition-all cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
