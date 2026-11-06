import React from "react";
import { FolderOpen, FileSpreadsheet, Eye, AlertTriangle, UserX, Trash2 } from "lucide-react";

function formatDesignTimestamp(value) {
  if (!value) return "\u2014";
  const str = String(value).trim();
  const sqlMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/);
  let year, month, day, hours, minutes;
  if (sqlMatch) {
    [, year, month, day, hours, minutes] = sqlMatch;
  } else {
    const date = value instanceof Date ? value : new Date(str);
    if (Number.isNaN(date.getTime())) return str;
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Singapore", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).formatToParts(date);
    const part = (type) => parts.find((item) => item.type === type)?.value;
    year = part("year"); month = part("month"); day = part("day");
    hours = part("hour"); minutes = part("minute");
  }
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  hours = Number(hours);
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${monthNames[Number(month) - 1]} ${Number(day)}, ${year} \u00b7 ${hours}:${String(minutes).padStart(2, "0")} ${ampm}`;
}

export default function CallsReportRepositoryView({
  folderItems = [],
  folderStats = { completed: 0, withWarnings: 0, sourceRows: 0, unmatchedRecords: 0, issues: 0 },
  historyLoading = false,
  onOpenRaw,
  onOpenIssues,
  onOpenUnmatched,
  onDeleteBatch,
}) {
  return (
    <div className="flex flex-col gap-4 font-sans">
      {/* 1. Repository Overview */}
      <section>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-[3px] h-4 bg-[#12376B] rounded-full shrink-0" />
          <h3 className="text-sm font-bold text-[#14233F]">1. Repository Overview</h3>
        </div>
        <p className="text-xs text-[#526582] pl-[11px] mb-4">
          High-level status of all uploaded batches for this FrontSteps source.
        </p>

        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
          {/* Card 1: Uploaded Files */}
          <div className="relative overflow-hidden rounded-xl border border-[#DCE4EE] bg-white p-3.5 shadow-2xs">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#12376B]" />
            <p className="text-xs font-bold text-[#14233F]">Uploaded Files</p>
            <p className="mt-2 text-2xl font-extrabold text-[#12376B] leading-none">
              {Number(folderItems.length || 0).toLocaleString()}
            </p>
            <p className="mt-3 text-[11px] font-medium text-[#526582]">
              {folderStats.completed || 0} completed · {folderStats.withWarnings || 0} with warnings
            </p>
          </div>

          {/* Card 2: Source Rows */}
          <div className="relative overflow-hidden rounded-xl border border-[#DCE4EE] bg-white p-3.5 shadow-2xs">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#12376B]" />
            <p className="text-xs font-bold text-[#14233F]">Source Rows</p>
            <p className="mt-2 text-2xl font-extrabold text-[#12376B] leading-none">
              {Number(folderStats.sourceRows || 0).toLocaleString()}
            </p>
            <p className="mt-3 text-[11px] font-medium text-[#526582]">
              Rows received across all batches
            </p>
          </div>

          {/* Card 3: Unmatched Records */}
          <div className="relative overflow-hidden rounded-xl border border-[#DCE4EE] bg-white p-3.5 shadow-2xs">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#12376B]" />
            <p className="text-xs font-bold text-[#14233F]">Unmatched Records</p>
            <p className="mt-2 text-2xl font-extrabold text-[#B45309] leading-none">
              {Number(folderStats.unmatchedRecords || 0).toLocaleString()}
            </p>
            <p className="mt-3 text-[11px] font-medium text-[#526582]">
              Source rows awaiting employee mapping
            </p>
          </div>

          {/* Card 4: Import Issues */}
          <div className="relative overflow-hidden rounded-xl border border-[#DCE4EE] bg-white p-3.5 shadow-2xs">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#12376B]" />
            <p className="text-xs font-bold text-[#14233F]">Import Issues</p>
            <p className="mt-2 text-2xl font-extrabold text-[#B91C1C] leading-none">
              {Number(folderStats.issues || 0).toLocaleString()}
            </p>
            <p className="mt-3 text-[11px] font-medium text-[#526582]">
              Validation, duplicate, or conflict findings
            </p>
          </div>
        </div>
      </section>

      {/* 2. Uploaded Batches */}
      <section>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-[3px] h-4 bg-[#12376B] rounded-full shrink-0" />
          <h3 className="text-sm font-bold text-[#14233F]">2. Uploaded Batches</h3>
        </div>
        <p className="text-xs text-[#526582] pl-[11px] mb-3">
          Each upload remains traceable to its source rows, mapping findings, and batch-level status.
        </p>

        {/* Batch Count Sub-bar */}
        <div className="mb-3.5 flex items-center justify-between rounded-xl border border-[#DCE4EE] bg-[#F4F6F9] px-4 py-2.5">
          <span className="text-xs font-extrabold text-[#14233F]">
            {folderItems.length} batch{folderItems.length === 1 ? "" : "es"}
          </span>
          <span className="text-xs font-medium text-[#526582]">
            {historyLoading ? "Loading server history..." : "Sorted by most recent upload"}
          </span>
        </div>

        <div className="overflow-hidden rounded-xl border border-[#DCE4EE] bg-white shadow-2xs">
          <div className="overflow-x-auto sibs-scrollbar">
            <table className="w-full min-w-[980px] text-left text-xs border-collapse">
              <thead className="bg-[#F0F3F7] text-[#14233F] border-b border-[#DCE4EE]">
                <tr>
                  <th className="w-[30%] px-4 py-3 font-bold">Source File</th>
                  <th className="w-[15%] px-4 py-3 font-bold">Uploaded</th>
                  <th className="w-[17%] px-4 py-3 font-bold">Batch Status</th>
                  <th className="w-[13%] px-4 py-3 font-bold">Records</th>
                  <th className="w-[25%] px-4 py-3 font-bold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE4EE]">
                {folderItems.length > 0 ? (
                  folderItems.map((item) => {
                    const hasIssues = Number(item.issueCount || 0) > 0 || (item.status || "").includes("ERROR") || (item.status || "").includes("WARNING");
                    const isCompletedWithErrors = item.status === "COMPLETED_WITH_ERRORS" || hasIssues;
                    const issueCount = Number(item.issueCount || 0);
                    const unmatchedCount = Number(item.unmatchedRecordCount ?? item.unmapped ?? 0);

                    return (
                      <tr key={item.id} className="align-middle transition-colors hover:bg-slate-50/60">
                        {/* 1. Source File */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                              <FileSpreadsheet className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-bold text-[#14233F] text-xs" title={item.name}>
                                {item.name}
                              </p>
                              <p className="mt-0.5 text-[11px] font-medium text-[#526582]">
                                Batch #{item.id} · {item.size || "0 KB"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* 2. Uploaded */}
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-[#14233F]">
                          {formatDesignTimestamp(item.timestamp)}
                        </td>

                        {/* 3. Batch Status */}
                        <td className="px-4 py-3">
                          <div className="flex flex-col items-start gap-0.5">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap ${
                                isCompletedWithErrors
                                  ? "bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]"
                                  : "bg-emerald-50 text-[#15803D] border border-emerald-200"
                              }`}
                            >
                              {item.status === "COMPLETED"
                                ? "Completed"
                                : item.status === "COMPLETED_WITH_ERRORS"
                                ? "Completed with Errors"
                                : item.status || "Completed"}
                            </span>
                            {issueCount > 0 && (
                              <span className="text-[11px] font-bold text-[#B91C1C]">
                                {issueCount} import {issueCount === 1 ? "issue" : "issues"}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 4. Records */}
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-0.5 text-[11px] leading-tight text-[#526582]">
                            <p>
                              <strong className="font-extrabold text-[#14233F]">
                                {Number(item.inserted || 0).toLocaleString()}
                              </strong>{" "}
                              new
                            </p>
                            <p>
                              <strong className="font-extrabold text-[#14233F]">
                                {Number(item.updated || 0).toLocaleString()}
                              </strong>{" "}
                              updated
                            </p>
                            <p>
                              <strong className="font-extrabold text-[#14233F]">
                                {Number(item.duplicates || 0).toLocaleString()}
                              </strong>{" "}
                              duplicates
                            </p>
                            <p>
                              <strong className="font-extrabold text-[#B45309]">
                                {unmatchedCount.toLocaleString()}
                              </strong>{" "}
                              unmatched
                            </p>
                          </div>
                        </td>

                        {/* 5. Actions */}
                        <td className="px-4 py-3">
                          <div className="mx-auto grid w-full max-w-[300px] grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => onOpenRaw(item)}
                              aria-label={`View rows for batch ${item.id}`}
                              className="inline-flex h-9 min-w-0 items-center gap-2 rounded-lg border border-blue-200 bg-white px-2.5 text-left text-[11px] font-semibold text-blue-800 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                            >
                              <Eye size={15} className="shrink-0 text-blue-600" />
                              <span className="truncate">Rows</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => onOpenIssues(item)}
                              aria-label={`View ${issueCount} issues for batch ${item.id}`}
                              className="inline-flex h-9 min-w-0 items-center gap-2 rounded-lg border border-amber-200 bg-white px-2.5 text-left text-[11px] font-semibold text-amber-800 transition-colors hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                            >
                              <AlertTriangle size={15} className="shrink-0 text-amber-600" />
                              <span className="truncate">Issues</span>
                              <span className="ml-auto rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] leading-none text-amber-800">{issueCount}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => onOpenUnmatched(item)}
                              aria-label={`View ${unmatchedCount.toLocaleString()} unmatched records for batch ${item.id}`}
                              className="inline-flex h-9 min-w-0 items-center gap-2 rounded-lg border border-violet-200 bg-white px-2.5 text-left text-[11px] font-semibold text-violet-800 transition-colors hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
                            >
                              <UserX size={15} className="shrink-0 text-violet-600" />
                              <span className="truncate">Unmatched</span>
                              <span className="ml-auto rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] leading-none text-violet-800">{unmatchedCount.toLocaleString()}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => onDeleteBatch(item)}
                              aria-label={`Delete batch ${item.id}`}
                              title="Delete this import batch and all linked data"
                              className="inline-flex h-9 min-w-0 items-center gap-2 rounded-lg border border-rose-200 bg-white px-2.5 text-left text-[11px] font-semibold text-rose-700 transition-colors hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
                            >
                              <Trash2 size={15} className="shrink-0 text-rose-600" />
                              <span className="truncate">Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr className="h-[60px] text-[#526582] bg-white">
                    <td colSpan={5} className="px-4 py-8 text-center text-xs text-[#526582]">
                      No batches uploaded yet for this source.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

