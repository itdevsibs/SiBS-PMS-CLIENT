// Compact, space-efficient top metrics for WFM dashboard.
import {
  AlertTriangle,
  CheckCircle2,
  CloudUpload,
  FileSpreadsheet,
} from "lucide-react";

function CompactKpiTile({
  label,
  value,
  detail,
  icon: Icon,
  valueColor = "text-sibs-primary-1",
}) {
  return (
    <article className="min-w-0 rounded-xl border border-slate-200/90 bg-white p-2.5 sm:p-3 shadow-2xs transition-all duration-150 hover:border-slate-300 hover:shadow-xs flex flex-col justify-between gap-1.5 sm:gap-2">
      {/* 1. Header: Label + Icon */}
      <div className="flex items-center justify-between gap-1 min-w-0">
        <span className="m-0 text-[9.5px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-500 leading-none truncate">
          {label}
        </span>
        <div className="rounded-md bg-slate-50 border border-slate-100 p-1 text-slate-400 shrink-0">
          <Icon size={12} />
        </div>
      </div>

      {/* 2. Value on Left + Detail Badge on Right */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-0.5 sm:gap-1.5 min-w-0">
        <span className={`text-xl sm:text-[22px] font-black leading-none tracking-tight shrink-0 ${valueColor}`}>
          {value}
        </span>
        {detail}
      </div>
    </article>
  );
}

export default function WfmDashboardMetrics({ summary = {}, isLoading = false }) {
  const totalUploads = Number(summary?.totalUploads || 0);
  const uploadsWithIssues = Number(summary?.uploadsWithIssues || 0);
  const totalRows = Number(summary?.totalRows || 0);
  const validRows = Number(summary?.validRows || 0);
  const invalidRows = Number(summary?.invalidRows || 0);
  const duplicateRows = Number(summary?.duplicateRows || 0);
  const anomalyCount = invalidRows + duplicateRows;

  const acceptanceRate =
    totalRows > 0
      ? ((validRows / totalRows) * 100).toFixed(1)
      : totalUploads > 0
      ? "100.0"
      : "0.0";

  const rateNum = parseFloat(acceptanceRate);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-200 bg-white h-16 sm:h-20 p-2.5 sm:p-3 animate-pulse flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="h-2 w-16 bg-slate-200 rounded" />
              <div className="h-4 w-4 bg-slate-100 rounded" />
            </div>
            <div className="h-4 w-12 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5">
      {/* 1. Total Batches */}
      <CompactKpiTile
        label="Total Batches"
        value={totalUploads.toLocaleString()}
        icon={CloudUpload}
        detail={
          uploadsWithIssues > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50/90 px-2 py-0.5 text-[9.5px] font-extrabold text-amber-800 leading-none shadow-2xs">
              <AlertTriangle className="h-2.5 w-2.5 shrink-0 text-amber-600" strokeWidth={2.5} />
              <span>{uploadsWithIssues} issues</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 leading-none">
              <span>All clean</span>
            </span>
          )
        }
      />

      {/* 2. Acceptance Rate */}
      <CompactKpiTile
        label="Acceptance Rate"
        value={`${acceptanceRate}%`}
        valueColor={rateNum >= 95 ? "text-emerald-600" : rateNum >= 85 ? "text-amber-600" : "text-rose-600"}
        icon={CheckCircle2}
        detail={
          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50/70 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 leading-none">
            {validRows.toLocaleString()} valid rows
          </span>
        }
      />

      {/* 3. Total Records */}
      <CompactKpiTile
        label="Total Records"
        value={totalRows.toLocaleString()}
        icon={FileSpreadsheet}
        detail={
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[9px] font-bold text-slate-600 leading-none">
            {validRows.toLocaleString()} valid · {invalidRows.toLocaleString()} complete
          </span>
        }
      />

      {/* 4. Exceptions */}
      <CompactKpiTile
        label="Exceptions & Duplicates"
        value={anomalyCount.toLocaleString()}
        valueColor={anomalyCount > 0 ? "text-amber-600" : "text-sibs-primary-1"}
        icon={AlertTriangle}
        detail={
          <span
            className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-bold leading-none ${
              anomalyCount > 0
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : "border-slate-200 bg-slate-50 text-slate-600"
            }`}
          >
            {duplicateRows.toLocaleString()} duplicates · {invalidRows.toLocaleString()} complete
          </span>
        }
      />
    </div>
  );
}
