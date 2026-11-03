import { useEffect, useMemo, useState } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, FileSpreadsheet, Loader2, Search, Users, ShieldAlert, Copy, Eye, UserX, FileText } from "lucide-react";
import AppModal from "@/components/common/ui/AppModal";
import { Button } from "@/components/common/ui/Button";
import BatchDetailStat from "@/components/modules/wfm/imports/WfmBatchDetailStat";
import { getUsVisaImportBatchErrors } from "@/lib/axios/us-visa-imports";
import { formatRelativeTime, getImportDisplayStatus } from "@/lib/wfm-import-utils";

const PAGE_SIZE = 25;
const TABS = [
  { key: "overview", label: "Overview", icon: Eye },
  { key: "mapping", label: "Employee Mapping", icon: Users },
  { key: "validation", label: "Validation Issues", icon: ShieldAlert },
  { key: "raw", label: "Raw Data", icon: FileSpreadsheet },
];

function getIssueKey(issue) {
  return `${issue.sheetName || ""}:${issue.excelRowNumber || issue.id}`;
}

export default function WfmBatchDetailsModal({ selectedUploadDetails: batch, activeOpenCard, onOpenRawData, onClose }) {
  const [tab, setTab] = useState("overview");
  const [issueType, setIssueType] = useState("validation");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [issueResponse, setIssueResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const batchId = batch?.batchId || (typeof batch?.id === "number" ? batch.id : null);
  const display = getImportDisplayStatus(batch);
  const currentCategory = tab === "mapping" ? "mapping" : issueType;

  useEffect(() => {
    setTab("overview"); setPage(1); setSearch(""); setAppliedSearch("");
    setIssueType("validation"); setIssueResponse(null);
  }, [batchId]);

  useEffect(() => {
    if (!batchId || !["mapping", "validation"].includes(tab)) return;
    let cancelled = false;
    setLoading(true); setLoadError("");
    getUsVisaImportBatchErrors(batchId, {
      category: currentCategory, page, limit: PAGE_SIZE, search: appliedSearch || undefined,
    }).then((result) => { if (!cancelled) setIssueResponse(result); })
      .catch(() => { if (!cancelled) { setIssueResponse(null); setLoadError("Unable to load issues. Please retry."); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [batchId, tab, currentCategory, page, appliedSearch]);

  const groupedMapping = useMemo(() => {
    if (tab !== "mapping") return [];
    const names = new Map();
    for (const item of issueResponse?.data || []) {
      const key = `${String(item.rawValue || "Unknown source name").trim().toUpperCase()}|${item.errorCode}`;
      if (!names.has(key)) names.set(key, { name: item.rawValue || "Unknown source name", code: item.errorCode, entries: [] });
      names.get(key).entries.push(item);
    }
    return [...names.values()];
  }, [tab, issueResponse]);
  const issues = issueResponse?.data || [];
  const pagination = issueResponse?.pagination || {};
  const issueTotal = pagination.total || 0;
  const totalPages = Math.max(1, pagination.totalPages || 1);

  const changeTab = (next) => { setTab(next); setPage(1); setSearch(""); setAppliedSearch(""); setIssueResponse(null); };

  return (
    <AppModal isOpen={Boolean(batch)} className="!max-w-none w-full !w-[min(96vw,1280px)] !p-0 overflow-hidden" zIndex="z-[140]">
      <div className="flex h-[84vh] max-h-[84vh] flex-col overflow-hidden rounded-2xl bg-white">
        <div className="shrink-0 border-b border-slate-100 bg-gradient-to-br from-slate-50 via-white to-sky-50/50 p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-100 bg-sky-50 text-sky-600"><FileSpreadsheet className="h-5 w-5" /></div>
              <div className="min-w-0">
                <p className="m-0 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Batch Details</p>
                <p className="mt-1 text-sm font-bold text-sibs-primary-1 break-words">{batch?.fileName || "Import"}</p>
                <p className="mt-1 text-[11px] text-slate-500">{activeOpenCard?.title || batch?.rawDataTitle || "US Visa"} · {batch?.batchCode || ""} · {batch?.uploadedAt ? `${formatRelativeTime(batch)} · ${batch.uploadedAt}` : ""}</p>
              </div>
            </div>
            <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-bold ${display.tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : display.tone === "danger" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
              {display.tone === "success" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
              {display.label}
            </span>
          </div>
        </div>
        <div className="shrink-0 flex flex-wrap gap-1 border-b border-slate-100 px-4 pt-2 sm:px-5" role="tablist" aria-label="Batch details sections">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button type="button" role="tab" aria-selected={tab === key} key={key} onClick={() => changeTab(key)} className={`inline-flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-semibold transition-colors ${tab === key ? "border-sibs-primary-1 text-sibs-primary-1" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
              <Icon className="h-3.5 w-3.5" />{label}{key === "mapping" && Number(batch?.mappingRows || 0) > 0 ? ` (${batch.mappingRows})` : ""}
            </button>
          ))}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          {tab === "overview" && <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <BatchDetailStat label="Total Rows" value={batch?.totalRows || 0} icon={FileSpreadsheet} tone="blue" />
              <BatchDetailStat label="Accepted" value={batch?.validRows || 0} icon={CheckCircle2} tone="emerald" />
              <BatchDetailStat label="Rejected" value={batch?.invalidRows || 0} icon={AlertCircle} tone="rose" />
              <BatchDetailStat label="Duplicates" value={batch?.duplicateRows || 0} icon={Copy} tone="orange" />
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-3"><div><p className="m-0 text-sm font-bold text-sibs-primary-1">Employee Mapping</p><p className="mt-1 text-xs text-slate-500">Mapping is separate from import validation and does not reject stored records.</p></div><span className="text-lg font-bold text-sibs-primary-1">{(batch?.mappingRows || 0).toLocaleString()}</span></div>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-600"><span>Unmapped employee rows: <b>{batch?.unmappedRows || 0}</b></span><span>Task Order mapping rows: <b>{batch?.unassignedTaskOrderRows || 0}</b></span></div>
              <button type="button" onClick={() => changeTab("mapping")} className="mt-3 text-xs font-semibold text-sibs-primary-2 hover:underline">Review mapping records</button>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-600"><span>Validation warnings: <b>{batch?.warningRows || 0}</b> · Info records: <b>{batch?.infoRows || 0}</b></span><button type="button" className="font-semibold text-sibs-primary-2 hover:underline" onClick={() => changeTab("validation")}>View validation details</button></div>
            {(batch?.invalidRows || 0) === 0 && (batch?.duplicateRows || 0) === 0 && (batch?.warningRows || 0) === 0 ? <p className="m-0 flex items-center gap-2 text-xs font-semibold text-emerald-700"><CheckCircle2 className="h-4 w-4" />No import-validation issues were reported.</p> : null}
          </div>}
          {["mapping", "validation"].includes(tab) && <div className="space-y-3">
            {tab === "validation" ? <div className="flex gap-2">{["validation","duplicate"].map((type) => <button key={type} onClick={() => { setIssueType(type); setPage(1); setIssueResponse(null); }} type="button" className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${issueType === type ? "bg-sibs-primary-1 text-white" : "bg-white text-slate-600"}`}>{type === "validation" ? "Validation & warnings" : "Duplicates & conflicts"}</button>)}</div> : <p className="m-0 text-xs text-slate-500">Unresolved employee identities and Task Orders are tracked here, not as validation errors. Repeated names are grouped within each page.</p>}
            <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); setPage(1); setAppliedSearch(search); }}><div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400"/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, row, issue code..." className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-xs outline-none focus:border-sky-400" /></div><Button type="submit" variant="outline" className="h-9 text-xs">Search</Button></form>
            {loading ? (
              <p className="flex items-center gap-2 py-5 text-xs text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin"/>Loading records...
              </p>
            ) : loadError ? (
              <p role="alert" className="text-xs text-rose-700">{loadError}</p>
            ) : issues.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-xs text-slate-500">
                No records in this category.
              </div>
            ) : tab === "mapping" ? (
              <div className="space-y-2">
                {groupedMapping.map((group) => (
                  <div
                    key={`${group.code}-${group.name}`}
                    className="rounded-lg border border-slate-200/80 bg-white p-2.5 sm:px-3 shadow-2xs transition-colors hover:border-slate-300"
                  >
                    {/* Top Row: Name, Status Badge, and Count */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500 border border-slate-200/80">
                          <UserX className="h-3 w-3" />
                        </span>
                        <p className="m-0 truncate text-xs font-bold text-slate-800">
                          {group.name}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="inline-flex items-center rounded-md border border-amber-200/70 bg-amber-50/60 px-1.5 py-0.2 text-[9.5px] font-semibold text-amber-700">
                          {group.code ? group.code.replaceAll("_", " ") : "EMPLOYEE NOT MAPPED"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {group.entries.length} on this page
                        </span>
                      </div>
                    </div>

                    {/* Compact, crisp, highly legible row occurrences */}
                    <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mr-1">
                        Affected Rows:
                      </span>
                      {group.entries.map((item, idx) => (
                        <span
                          key={`${item.sheetName}-${item.excelRowNumber}-${idx}`}
                          className="inline-flex items-center gap-1.5 rounded-md border border-sky-200/70 bg-sky-50/50 px-2 py-0.5 text-[11px] shadow-2xs transition-colors hover:bg-sky-50 hover:border-sky-300"
                        >
                          <span className="font-semibold text-sibs-primary-1">{item.sheetName || "Sheet"}</span>
                          <span className="text-sky-300 font-bold">·</span>
                          <span className="inline-block rounded bg-sky-100/70 border border-sky-200/50 px-1.5 py-0.2 font-mono text-[10.5px] font-bold text-sky-800">
                            row {item.excelRowNumber || "-"}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200/90 bg-white shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-3.5 py-2.5 whitespace-nowrap">Sheet</th>
                      <th className="px-3 py-2.5 whitespace-nowrap text-center">Row</th>
                      <th className="px-3.5 py-2.5 whitespace-nowrap">Severity</th>
                      <th className="px-3.5 py-2.5 whitespace-nowrap">Code</th>
                      <th className="px-3.5 py-2.5 whitespace-nowrap">Column</th>
                      <th className="px-4 py-2.5 min-w-[280px]">Message</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {issues.map((issue) => {
                      const sev = (issue.severity || "INFO").toUpperCase();
                      const sevBadgeClass =
                        sev === "ERROR" || sev === "FATAL"
                          ? "bg-rose-50 text-rose-700 border-rose-200/70"
                          : sev === "WARNING" || sev === "WARN"
                          ? "bg-amber-50 text-amber-700 border-amber-200/70"
                          : "bg-sky-50 text-sky-700 border-sky-200/70";

                      return (
                        <tr key={getIssueKey(issue) + issue.id} className="transition-colors hover:bg-slate-50/60">
                          <td className="px-3.5 py-2.5 whitespace-nowrap font-medium text-slate-700">
                            {issue.sheetName || "-"}
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap text-center">
                            {issue.excelRowNumber ? (
                              <span className="inline-block rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-bold text-slate-700">
                                {issue.excelRowNumber}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-3.5 py-2.5 whitespace-nowrap">
                            <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wide ${sevBadgeClass}`}>
                              {sev}
                            </span>
                          </td>
                          <td className="px-3.5 py-2.5 whitespace-nowrap font-mono text-[10.5px] font-semibold text-slate-700">
                            {issue.errorCode || "-"}
                          </td>
                          <td className="px-3.5 py-2.5 whitespace-nowrap font-mono text-[10.5px] text-slate-600">
                            {issue.columnName || "-"}
                          </td>
                          <td className="px-4 py-2.5 text-[11.5px] leading-relaxed text-slate-600">
                            {issue.errorMessage}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex items-center justify-between gap-2 text-xs text-slate-500"><span>{issueTotal.toLocaleString()} issue event{issueTotal === 1 ? "" : "s"}</span><div className="flex items-center gap-2"><Button variant="outline" type="button" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>Back</Button><span>{page} / {totalPages}</span><Button variant="outline" type="button" disabled={page >= totalPages || loading} onClick={() => setPage((p) => p + 1)}>Next</Button></div></div>
          </div>}
          {tab === "raw" && <div className="space-y-3 rounded-xl border border-slate-200 p-5"><p className="m-0 text-sm font-bold text-sibs-primary-1">Original imported rows</p><p className="m-0 text-xs text-slate-500">Open the read-only raw-data preview to inspect and filter the source records. Imported rows and matching issues remain preserved for audit.</p><Button type="button" disabled={!batchId || !onOpenRawData} onClick={() => onOpenRawData?.(batch)} className="text-xs"><FileSpreadsheet className="h-4 w-4"/> Open Raw Data</Button></div>}
        </div>
        <div className="flex shrink-0 justify-end border-t border-slate-100 bg-slate-50/50 px-4 py-3 sm:px-5"><Button type="button" onClick={onClose} className="h-9 rounded-lg bg-sibs-primary-1 px-5 text-xs text-white">Close</Button></div>
      </div>
    </AppModal>
  );
}
