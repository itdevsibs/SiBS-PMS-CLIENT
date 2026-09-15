// Vibrant, modern 3D-feel visual summary cards for WFM Dashboard.
import {
  CheckCircle2,
  Database,
  Layers,
} from "lucide-react";

export default function WfmVisualMetricCards({
  summary = {},
  cards = [],
  uploadsByCard = {},
  isLoading = false,
}) {
  const totalRows = Number(summary?.totalRows || 0);
  const validRows = Number(summary?.validRows || 0);
  const totalUploads = Number(summary?.totalUploads || 0);
  const uploadsWithIssues = Number(summary?.uploadsWithIssues || 0);

  const acceptanceRate =
    totalRows > 0
      ? ((validRows / totalRows) * 100).toFixed(1)
      : totalUploads > 0
      ? "100.0"
      : "0.0";

  const syncedFeedsCount = cards.reduce((acc, card) => {
    const uploads = uploadsByCard[card.id] || [];
    return acc + (uploads.length > 0 ? 1 : 0);
  }, 0);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 sm:h-32 rounded-2xl bg-slate-200 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
      {/* 1. Records Ingested - Pink/Coral Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#ff6b6b] via-[#ff7e67] to-[#ff9068] p-5 text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
        <div className="pointer-events-none absolute -right-6 -bottom-8 h-32 w-32 rounded-full bg-white/15" />
        <div className="pointer-events-none absolute right-8 -bottom-10 h-28 w-28 rounded-full bg-white/10" />

        <div className="relative z-10 flex flex-col justify-between h-full min-h-[90px]">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-white/90">
              Total Records
            </span>
            <div className="rounded-xl bg-white/20 p-2 backdrop-blur-xs">
              <Database size={16} className="text-white" />
            </div>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-black tracking-tight">
              {totalRows.toLocaleString()}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-white/95">
              <span className="inline-flex items-center rounded-md bg-white/20 px-1.5 py-0.5 text-[10px] font-extrabold backdrop-blur-xs">
                {acceptanceRate}% Valid
              </span>
              <span>acceptance rate</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Pipeline Integrity - Azure/Blue Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#2f80ed] via-[#0099ff] to-[#56ccf2] p-5 text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
        <div className="pointer-events-none absolute -right-6 -bottom-8 h-32 w-32 rounded-full bg-white/15" />
        <div className="pointer-events-none absolute right-8 -bottom-10 h-28 w-28 rounded-full bg-white/10" />

        <div className="relative z-10 flex flex-col justify-between h-full min-h-[90px]">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-white/90">
              Batches Processed
            </span>
            <div className="rounded-xl bg-white/20 p-2 backdrop-blur-xs">
              <CheckCircle2 size={16} className="text-white" />
            </div>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-black tracking-tight">
              {totalUploads.toLocaleString()}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-white/95">
              <span className="inline-flex items-center rounded-md bg-white/20 px-1.5 py-0.5 text-[10px] font-extrabold backdrop-blur-xs">
                {uploadsWithIssues === 0 ? "100% Clean" : `${uploadsWithIssues} Flagged`}
              </span>
              <span>in current cycle</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Feed Sync Health - Teal/Emerald Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#11998e] via-[#38ef7d] to-[#6ee7b7] p-5 text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:col-span-2 lg:col-span-1">
        <div className="pointer-events-none absolute -right-6 -bottom-8 h-32 w-32 rounded-full bg-white/15" />
        <div className="pointer-events-none absolute right-8 -bottom-10 h-28 w-28 rounded-full bg-white/10" />

        <div className="relative z-10 flex flex-col justify-between h-full min-h-[90px]">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-white/90">
              Active Feeds Online
            </span>
            <div className="rounded-xl bg-white/20 p-2 backdrop-blur-xs">
              <Layers size={16} className="text-white" />
            </div>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-black tracking-tight">
              {syncedFeedsCount} <span className="text-lg font-bold text-white/80">/ {cards.length || 5}</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-white/95">
              <span className="inline-flex items-center rounded-md bg-white/20 px-1.5 py-0.5 text-[10px] font-extrabold backdrop-blur-xs">
                {syncedFeedsCount === cards.length ? "All Synced" : "Synced Feeds"}
              </span>
              <span>operational status</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
