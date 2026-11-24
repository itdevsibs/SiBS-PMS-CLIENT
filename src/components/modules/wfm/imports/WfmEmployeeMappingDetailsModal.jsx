import { useEffect, useRef, useState } from "react";
import { AlertCircle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2, Search, X } from "lucide-react";
import AppModal from "@/components/common/ui/AppModal";
import { Button } from "@/components/common/ui/Button";
import { getUsVisaBatchEmployeeMappingRows } from "@/lib/axios/us-visa-imports";
import { getPageNumbers } from "@/lib/wfm-import-utils";

const PAGE_SIZES = [10, 25, 50, 100];
const COLUMNS = ["Sheet", "Row", "Severity", "Code", "Column", "Value", "Message"];
const WIDTHS = [15, 7, 11, 19, 12, 15, 21];
const NAV_CLASS = "inline-flex h-8 min-w-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 hover:border-sibs-primary-1 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40";
const CELL_CLASS = "px-3 py-2.5 align-top whitespace-pre-wrap [overflow-wrap:anywhere]";

function originalValue(value) {
  if (value === undefined || value === null || value === "") return "—";
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}

function Severity({ value }) {
  const severity = String(value || "").toUpperCase();
  const color = severity === "ERROR" ? "border-rose-200 bg-rose-50 text-rose-700"
    : severity === "WARNING" || severity === "DUPLICATE" ? "border-amber-200 bg-amber-50 text-amber-800"
    : severity === "INFO" ? "border-sky-200 bg-sky-50 text-sky-700"
    : "border-slate-200 bg-slate-50 text-slate-700";
  return <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold ${color}`}>{severity || "—"}</span>;
}

function MappingRow({ row }) {
  // One outer table row per distinct source row. Each issue occupies an
  // aligned inner row so its severity, code, value and message stay together.
  const issues = row.issues?.length ? row.issues : [{}];
  return (
    <tr className="bg-[#f8fbfd] align-top hover:bg-sky-50/40">
      <td className={`${CELL_CLASS} font-medium text-sibs-primary-1`}>{originalValue(row.sheetName)}</td>
      <td className={`${CELL_CLASS} text-center font-mono text-[11px]`}>{originalValue(row.excelRowNumber)}</td>
      <td colSpan={5} className="p-0">
        <table className="w-full table-fixed border-collapse text-xs" aria-label={`Mapping issues for row ${originalValue(row.excelRowNumber)}`}>
          <colgroup>{WIDTHS.slice(2).map((width, index) => <col key={index} style={{ width: `${width / 78 * 100}%` }} />)}</colgroup>
          <tbody className="divide-y divide-sibs-tertiary-10">
            {issues.map((issue, index) => (
              <tr key={issue.id ?? index}>
                <td className={CELL_CLASS}><Severity value={issue.severity} /></td>
                <td className={`${CELL_CLASS} font-mono text-[11px]`}>{originalValue(issue.errorCode)}</td>
                <td className={CELL_CLASS}>{originalValue(issue.columnName)}</td>
                <td className={CELL_CLASS}>{originalValue(issue.rawValue)}</td>
                <td className={`${CELL_CLASS} leading-relaxed`}>{originalValue(issue.errorMessage)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </td>
    </tr>
  );
}

function EmployeeMappingDetails({ batchId, employee, onClose }) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [jumpInput, setJumpInput] = useState("1");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const tableRef = useRef(null);
  const groupKey = employee.groupKey;

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setResult(null);
    if (tableRef.current) tableRef.current.scrollTop = 0;
    getUsVisaBatchEmployeeMappingRows(batchId, groupKey, { page, limit, search })
      .then((response) => {
        if (!active) return;
        const lastPage = Math.max(1, Number(response?.pagination?.totalPages) || 1);
        if (page > lastPage) {
          setPage(lastPage);
          setJumpInput(String(lastPage));
        } else {
          setResult(response);
        }
      })
      .catch(() => { if (active) setError("Unable to load affected rows. Please retry."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [batchId, groupKey, page, limit, search, retry]);

  const total = Number(result?.pagination?.total || 0);
  const totalPages = Math.max(1, Number(result?.pagination?.totalPages) || 1);
  const start = total ? (page - 1) * limit + 1 : 0;
  const end = Math.min(page * limit, total);
  const disabled = loading || Boolean(error) || !result;
  const changePage = (next) => {
    const target = Math.min(totalPages, Math.max(1, Math.trunc(Number(next)) || 1));
    setPage(target);
    setJumpInput(String(target));
  };
  const applySearch = (value) => {
    const next = value.trim().slice(0, 150);
    setSearch(next);
    setPage(1);
    setJumpInput("1");
  };
  const status = employee.missingIdentity ? "Missing identity" : employee.status === "AMBIGUOUS" ? "Ambiguous" : "Unmapped";

  return (
    <AppModal isOpen className="!max-w-none !w-[min(96vw,1440px)] !h-[90vh] !max-h-[90vh] flex flex-col !p-3.5 sm:!p-6 overflow-hidden" zIndex="z-[160]">
      <header className="flex shrink-0 flex-wrap items-start justify-between gap-3 border-b border-sibs-tertiary-10 pb-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="m-0 text-lg font-bold text-sibs-primary-1 sm:text-xl">Unmapped Employee Details</h2>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800">{Number(employee.affectedRows || 0).toLocaleString()} affected rows</span>
          </div>
          <p className="mb-0 mt-1 break-words text-sm font-semibold text-sibs-primary-1">{employee.sourceEmployee || "—"}</p>
          <p className="mb-0 mt-1 text-xs text-sibs-tertiary-5">{employee.sourceColumn || "Source identity unavailable"} · <span className="font-semibold">{status}</span></p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <form className="flex min-w-0 flex-1 items-center gap-2" onSubmit={(event) => { event.preventDefault(); applySearch(searchInput); }}>
            <div className="relative min-w-0 flex-1 sm:w-72">
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-sibs-tertiary-6" />
              <input aria-label="Search affected rows" value={searchInput} maxLength={150} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search sheet, row, code, value..." className="h-9 w-full rounded-lg border border-sibs-tertiary-9 bg-white pl-8 pr-8 text-xs outline-none focus:border-sibs-primary-2" />
              {(searchInput || search) && <button type="button" aria-label="Clear search" onClick={() => { setSearchInput(""); applySearch(""); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500"><X className="h-3.5 w-3.5" /></button>}
            </div>
            <Button type="submit" variant="outline" className="h-9 shrink-0 text-xs"><Search className="h-3.5 w-3.5" /> Search</Button>
          </form>
          <Button type="button" variant="outline" onClick={onClose} className="h-9 shrink-0 text-xs">Close</Button>
        </div>
      </header>
      <div className="flex shrink-0 flex-wrap justify-between gap-2 py-2.5 text-xs text-slate-500">
        <span>Mapping issues for each affected source row.</span><span>Read-only</span>
      </div>
      <div ref={tableRef} className="sibs-scrollbar min-h-0 flex-1 overflow-auto rounded-lg border border-sibs-tertiary-10 bg-white" aria-busy={loading}>
        <table className="w-full min-w-[760px] table-fixed border-collapse text-left text-xs text-sibs-tertiary-5 lg:min-w-0">
          <colgroup>{WIDTHS.map((width, index) => <col key={index} style={{ width: `${width}%` }} />)}</colgroup>
          <thead className="sticky top-0 z-10 bg-[#f0f5fa] uppercase text-sibs-tertiary-6 shadow-xs">
            <tr className="border-b border-sibs-tertiary-10">{COLUMNS.map((column, index) => <th key={column} scope="col" className={`px-3 py-3 font-bold ${index === 1 ? "text-center" : ""}`}>{column}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-sibs-tertiary-10">
            {loading ? <tr><td colSpan={7} className="px-5 py-16 text-center"><span role="status" className="inline-flex items-center gap-2 font-semibold text-sibs-primary-1"><Loader2 className="h-4 w-4 animate-spin" /> Loading affected rows...</span></td></tr>
              : error ? <tr><td colSpan={7} className="px-5 py-12 text-center"><div role="alert" className="mb-3 inline-flex items-center gap-2 text-rose-700"><AlertCircle className="h-4 w-4" />{error}</div><div><Button type="button" variant="outline" onClick={() => setRetry((value) => value + 1)}>Retry</Button></div></td></tr>
              : !result?.data?.length ? <tr><td colSpan={7} className="px-5 py-16 text-center text-slate-500">{search ? "No affected rows match your search." : "No affected source rows found."}</td></tr>
              : result.data.map((row, index) => <MappingRow key={row.rowKey || `${page}-${index}`} row={row} />)}
          </tbody>
        </table>
      </div>
      <footer className="mt-3 flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-sibs-tertiary-10 pt-3 text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-medium" aria-live="polite">{loading ? "Loading affected rows..." : error ? "Affected rows unavailable" : `Showing ${start.toLocaleString()}${total ? ` to ${end.toLocaleString()}` : ""} of ${total.toLocaleString()} affected rows`}</span>
          <label className="flex items-center gap-1.5">Per page:
            <select value={limit} disabled={loading} onChange={(event) => { setLimit(Number(event.target.value)); setPage(1); setJumpInput("1"); }} className="h-8 rounded border border-slate-200 bg-white px-1.5 text-xs">{PAGE_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}</select>
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <form className="flex items-center gap-1.5" onSubmit={(event) => { event.preventDefault(); changePage(jumpInput); }}>
            <label htmlFor="mapping-jump-page">Go to:</label>
            <input id="mapping-jump-page" type="number" min={1} max={totalPages} value={jumpInput} onChange={(event) => setJumpInput(event.target.value)} disabled={disabled} className="h-8 w-14 rounded-lg border border-slate-200 px-1 text-center text-xs" />
            <span className="text-slate-400">/ {totalPages}</span>
            <button type="submit" disabled={disabled || totalPages <= 1} className={NAV_CLASS}>Go</button>
          </form>
          <nav aria-label="Affected rows pagination" className="flex flex-wrap items-center gap-1">
            <button type="button" className={NAV_CLASS} aria-label="First page" disabled={disabled || page <= 1} onClick={() => changePage(1)}><ChevronsLeft className="h-3.5 w-3.5" /></button>
            <button type="button" className={NAV_CLASS} aria-label="Previous page" disabled={disabled || page <= 1} onClick={() => changePage(page - 1)}><ChevronLeft className="h-3.5 w-3.5" /></button>
            {getPageNumbers(Math.min(page, totalPages), totalPages).map((number, index) => number === "..." ? <span key={`ellipsis-${index}`} className="px-1 text-slate-400">…</span> : <button key={number} type="button" aria-current={page === number ? "page" : undefined} aria-label={`Page ${number}`} disabled={disabled || page === number} onClick={() => changePage(number)} className={page === number ? "inline-flex h-8 min-w-8 items-center justify-center rounded-lg bg-sibs-primary-1 px-2 font-bold text-white" : NAV_CLASS}>{number}</button>)}
            <button type="button" className={NAV_CLASS} aria-label="Next page" disabled={disabled || page >= totalPages} onClick={() => changePage(page + 1)}><ChevronRight className="h-3.5 w-3.5" /></button>
            <button type="button" className={NAV_CLASS} aria-label="Last page" disabled={disabled || page >= totalPages} onClick={() => changePage(totalPages)}><ChevronsRight className="h-3.5 w-3.5" /></button>
          </nav>
        </div>
      </footer>
    </AppModal>
  );
}

export default function WfmEmployeeMappingDetailsModal({ batchId, employee, onClose }) {
  if (!batchId || !employee?.groupKey) return null;
  // Remount when switching groups so filters and pages cannot leak between employees.
  return <EmployeeMappingDetails key={JSON.stringify([batchId, employee.groupKey])} batchId={batchId} employee={employee} onClose={onClose} />;
}
