import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Search } from "lucide-react";
import TablePagination from "@/components/common/tables/TablePagination.jsx";
import { getDocumentedCallsAhtReport } from "@/lib/axios/kpis";
import { resolveAhtPeriodDateRange } from "./callDrillDownPeriod.js";

const fmt=(v,digits=2)=>v==null || !Number.isFinite(Number(v)) ? "--" : Number(v).toLocaleString(undefined,{maximumFractionDigits:digits});
const seconds=v=>v==null ? "--" : `${fmt(v)}s`;
const countryLabel=v=>v==null || v==="__UNMAPPED__" ? "Unmapped Country" : v;
const orderLabel=v=>v==null || v==="__UNRESOLVED__" ? "Unresolved Task Order" : v;
const mappingLabels={COUNTRY:"Country",EMPLOYEE_LEDGER:"Employee Ledger",UNRESOLVED:"Unresolved"};
const inputClass="min-w-0 rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 focus:border-[#103B63] focus:outline-none cursor-pointer";
const headClass="px-3 py-2 text-left font-bold uppercase text-white";
const cellClass="px-3 py-2.5 align-top break-words";

function Metric({label,value,detail,tone="text-[#103B63]",indicator}) {
  return <div title={detail} className="min-w-0 rounded border border-slate-200 bg-white px-3 py-2 shadow-2xs">
    <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-500"><span>{label}</span>{indicator&&<span className={`text-[10px] font-bold normal-case tracking-normal ${tone}`}>{indicator}</span>}</div>
    <div className={`mt-0.5 text-lg font-black tabular-nums break-words ${tone}`}>{value}</div>
  </div>;
}

export default function AhtDrillDownModalContent({series=[],selectedIndex=0,filters={},targets={}}) {
  const active=series[selectedIndex];
  const range=useMemo(()=>resolveAhtPeriodDateRange(active,filters),[active?.key,active?.startDate,active?.endDate,active?.dateFrom,active?.dateTo,filters?.dateFrom,filters?.dateTo]);
  // Pinned graph version; never silently query current if a graph version is unavailable.
  const version=filters?.taskOrderVersionId;
  const csv=value=>Array.isArray(value)?value.join(","):value||undefined;
  const scopeKey=JSON.stringify({sourceSystem:csv(filters?.sourceSystem||filters?.source)||"US_VISA",taskOrder:csv(filters?.taskOrder),country:csv(filters?.country),taskOrderVersionId:version,...range});
  const unavailable=active?.ahtSource==="UNVERIFIABLE_DOCUMENTED_AHT";
  // Changing the parent period/scope remounts local controls and cancels old requests.
  return <AhtReport key={scopeKey} scopeKey={scopeKey} valid={Boolean(range&&version&&!unavailable)} unavailable={unavailable} active={active} target={targets?.ahtSeconds}/>;
}

function AhtReport({scopeKey,valid,unavailable,active,target}) {
  const scope=useMemo(()=>JSON.parse(scopeKey),[scopeKey]);
  const [reportType,setReportType]=useState("summary");
  const [search,setSearch]=useState("");
  const [reportCountry,setReportCountry]=useState("");
  const [reportTaskOrder,setReportTaskOrder]=useState("");
  const [mappingSource,setMappingSource]=useState("");
  const [page,setPage]=useState(1);
  const [limit,setLimit]=useState(25);
  const [retry,setRetry]=useState(0);
  const [result,setResult]=useState(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);
  const tableRef=useRef(null);
  const requestKey=JSON.stringify({reportType,search:search.trim(),reportCountry,reportTaskOrder,mappingSource:reportType==="details"?mappingSource:undefined,page,limit,retry});
  useEffect(()=>{
    if(!valid){setLoading(false);return undefined;}
    const abort=new AbortController();
    let cancelled=false;
    setLoading(true);setError(null);
    const timer=setTimeout(async()=>{
      try {
        const params=JSON.parse(requestKey);delete params.retry;
        const response=await getDocumentedCallsAhtReport({...scope,...params},{signal:abort.signal});
        if(cancelled)return;
        if(!response?.success || response?.metricSource!=="DOCUMENTED_CALLS")throw new Error("Invalid Documented Calls report response.");
        setResult({key:requestKey,response});
        if(tableRef.current)tableRef.current.scrollTop=0;
      } catch(err){if(!cancelled){setError(err?.response?.data?.message||err?.message||"Unable to load AHT report.");setResult(null);}}
      finally{if(!cancelled)setLoading(false);}
    },search.trim()?250:0);
    return ()=>{cancelled=true;clearTimeout(timer);abort.abort();};
  },[valid,scope,requestKey]);
  const current=result?.key===requestKey?result.response:null;
  const busy=valid&&(loading||(!current&&!error));
  const summary=current?.summary;
  // Keep options available while requesting a different page/filter, never show stale rows.
  const options=result?.response?.options||{};
  const coverage=current?.coverage;
  const base=current?.baseSummary;
  const filtered=Boolean(search.trim()||reportCountry||reportTaskOrder||(reportType==="details"&&mappingSource));
  const targetValue=target!=null&&Number.isFinite(Number(target))&&Number(target)>0?Number(target):null;
  const variance=summary?.ahtSeconds!=null&&targetValue!=null?summary.ahtSeconds-targetValue:null;
  const mismatch=base && ((active?.ahtSeconds==null)!==(base.ahtSeconds==null) || (active?.ahtSeconds!=null&&base.ahtSeconds!=null&&Math.abs(Number(active.ahtSeconds)-base.ahtSeconds)>0.011) || (active?.ahtCalls!=null&&Number(active.ahtCalls)!==base.eligibleCalls));
  const switchReport=value=>{setReportType(value);setSearch("");setMappingSource("");setPage(1);};
  const resetPage=setter=>event=>{setter(event.target.value);setPage(1);};
  const resetFilters=()=>{setSearch("");setReportCountry("");setReportTaskOrder("");setMappingSource("");setPage(1);};
  const targetTone=variance==null?"text-[#103B63]":variance<=0?"text-emerald-600":"text-rose-600";
  const summaryHeaders=["Country","Task Order","Eligible Calls","Total Duration","AHT","Status"];
  const detailHeaders=["Production Date","Call Log ID","SIBS ID","Created By","Owner","Country","Task Order","Duration","TO Mapping"];
  if(!valid)return <div className="rounded border border-slate-200 bg-white p-6 text-center text-sm text-slate-600">{unavailable?"AHT cannot be verified for this comparison scope.":"The selected chart period or published version is unavailable. Refresh the dashboard and select a valid AHT bar."}</div>;
  return <div className="flex h-full min-h-0 flex-col gap-2.5 text-[#103B63]">
    {/* Match the Calls drill-down toolbar: search, filters, report toggle, date range. */}
    <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 rounded border border-slate-200 bg-white px-3.5 py-2 shadow-2xs">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-56">
          <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/>
          <input type="text" aria-label="Search report" className="w-full rounded border border-slate-300 bg-white py-1 pl-8 pr-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#103B63] focus:outline-none" maxLength={255} value={search} onChange={resetPage(setSearch)} placeholder={reportType==="summary"?"Search country or Task Order...":"Search employee, ID, Owner..."}/>
        </div>
        <select aria-label="Country filter" className={inputClass} value={reportCountry} onChange={resetPage(setReportCountry)}><option value="">All Countries ({(options.countries||[]).length})</option>{(options.countries||[]).map(v=><option key={v} value={v}>{countryLabel(v)}</option>)}</select>
        <select aria-label="Task Order filter" className={inputClass} value={reportTaskOrder} onChange={resetPage(setReportTaskOrder)}><option value="">All Task Orders ({(options.taskOrders||[]).length})</option>{(options.taskOrders||[]).map(v=><option key={v} value={v}>{orderLabel(v)}</option>)}</select>
        {reportType==="details"&&<select aria-label="Mapping source filter" className={inputClass} value={mappingSource} onChange={resetPage(setMappingSource)}><option value="">All Mapping Sources</option>{Object.entries(mappingLabels).map(([v,label])=><option key={v} value={v}>{label}</option>)}</select>}
        <div className="inline-flex items-center rounded border border-slate-300 bg-slate-100 p-0.5" role="group" aria-label="AHT report type">
          {[["summary","Report 1","AHT summary"],["details","Report 2","Individual call records"]].map(([value,label,description])=><button key={value} type="button" title={description} aria-label={`${label} — ${description}`} aria-pressed={reportType===value} onClick={()=>switchReport(value)} className={`rounded px-2.5 py-0.5 text-xs font-bold transition-colors cursor-pointer ${reportType===value?"bg-[#103B63] text-white shadow-2xs":"text-slate-600 hover:text-slate-900"}`}>{label}</button>)}
        </div>
        {filtered&&<button type="button" onClick={resetFilters} className="rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-100 cursor-pointer">Reset</button>}
      </div>
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
        <span>Date Range: <strong className="text-[#103B63]">{scope.dateFrom}</strong> to <strong className="text-[#103B63]">{scope.dateTo}</strong></span>
      </div>
    </div>
    <div className="shrink-0 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2" aria-live="polite">
      <Metric label="Eligible Documented Calls" value={fmt(summary?.eligibleCalls,0)} detail={filtered?"Filtered records":"Positive-duration records"}/>
      <Metric label="Total Call Duration" value={seconds(summary?.totalDurationSeconds)} detail="AHT numerator"/>
      <Metric label="Average Handling Time" tone={targetTone} value={seconds(summary?.ahtSeconds)} detail={filtered?"Filtered weighted average":"Weighted average"}/>
      <Metric label="AHT Target" value={seconds(targetValue)} detail="Dashboard target"/>
      <Metric label="Target Variance" tone={targetTone} indicator={variance==null?null:variance<=0?"Target met":"Above target"} value={variance==null?"--":`${variance>0?"+":""}${seconds(variance)}`} detail={variance==null?"Unavailable":variance<=0?"Target met":"Above target"}/>
      <Metric label="Zero-Duration Calls" indicator="Excluded" tone={coverage?.zeroDurationRows>0?"text-amber-700":"text-[#103B63]"} value={fmt(coverage?.zeroDurationRows,0)} detail="Excluded · chart scope"/>
    </div>
    <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 rounded border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-600">
      <span className="font-semibold text-[#103B63]">MS Dynamics — Documented Calls</span>
      <span>{filtered?"Unfiltered chart scope:":"Chart scope:"} <b>{seconds(base?.ahtSeconds)}</b> · {fmt(base?.eligibleCalls,0)} eligible</span>
      <span>Country mapped: <b>{fmt(coverage?.countryMappedRows,0)}</b></span>
      <span>Employee fallback: <b>{fmt(coverage?.employeeFallbackRows,0)}</b></span>
      <span>Unresolved TO: <b>{fmt(coverage?.unmappedTaskOrderRows,0)}</b></span>
      <span>Missing/invalid duration: <b>{fmt(coverage?.missingDurationRows,0)}</b></span>
    </div>
    <div className="shrink-0 text-[11px] text-slate-500">AHT = total positive eligible duration ÷ eligible documented calls. Skill and language do not apply. Employee fallback uses available ledger assignments; historical transfers may differ. Source scope is inferred from published Task Orders.</div>
    {mismatch&&<div role="status" className="shrink-0 rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">Current database AHT differs from the selected graph ({seconds(active.ahtSeconds)}). Refresh the dashboard to reconcile the latest data.</div>}
    <div className="flex flex-1 min-h-[180px] flex-col overflow-hidden rounded border border-slate-200 bg-white">
      <div ref={tableRef} className="min-h-0 flex-1 overflow-auto">
        <table className="w-full border-collapse text-xs" aria-busy={busy}>
          <thead className="sticky top-0 z-10 bg-[#103B63]"><tr>{(reportType==="summary"?summaryHeaders:detailHeaders).map(h=><th scope="col" key={h} className={headClass}>{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">
            {busy?<tr><td colSpan={reportType==="summary"?6:9} className="p-8 text-center text-slate-500" role="status">Loading Documented Calls…</td></tr>:error?<tr><td colSpan={reportType==="summary"?6:9} className="p-8 text-center text-red-700" role="alert"><AlertCircle size={16} className="mx-auto mb-2"/>{error}<button type="button" className="ml-2 underline" onClick={()=>{setError(null);setLoading(true);setRetry(n=>n+1);}}>Retry</button></td></tr>:!current?.data?.length?<tr><td colSpan={reportType==="summary"?6:9} className="p-8 text-center text-slate-500">No eligible Documented Calls found for this selection.</td></tr>:current.data.map((r,i)=>reportType==="summary"?<tr key={`${r.country??""}:${r.taskOrder??""}:${i}`} className="even:bg-slate-50">
              <td className={cellClass}>{countryLabel(r.country)}</td><td className={cellClass}>{orderLabel(r.taskOrder)}</td><td className={`${cellClass} tabular-nums`}>{fmt(r.eligibleCalls,0)}</td><td className={`${cellClass} tabular-nums`}>{seconds(r.totalDurationSeconds)}</td><td className={`${cellClass} font-bold tabular-nums`}>{seconds(r.ahtSeconds)}</td><td className={cellClass}>{targetValue==null||r.ahtSeconds==null?"--":<span className={r.ahtSeconds<=targetValue?"text-emerald-700":"text-amber-700"}>{r.ahtSeconds<=targetValue?"Target met":"Above target"}</span>}</td>
            </tr>:<tr key={r.id} className="even:bg-slate-50"><td className={cellClass}>{r.productionDate||"--"}</td><td className={cellClass}>{r.callLogId||r.systemCallId||"--"}</td><td className={cellClass}>{r.sibsId||"--"}</td><td className={cellClass}>{r.createdBy||"--"}</td><td className={cellClass}>{r.owner||"--"}</td><td className={cellClass}>{countryLabel(r.country)}</td><td className={cellClass}>{orderLabel(r.taskOrder)}</td><td className={`${cellClass} font-bold tabular-nums`}>{seconds(r.durationSeconds)}</td><td className={cellClass}>{mappingLabels[r.mappingSource]||"--"}</td></tr>)}
          </tbody>
          {reportType==="summary"&&!busy&&!error&&current?.data?.length>0&&<tfoot className="sticky bottom-0 bg-slate-100 font-bold"><tr><td colSpan={2} className={cellClass}>{filtered?"Filtered total":"Total (all pages)"}</td><td className={cellClass}>{fmt(summary.eligibleCalls,0)}</td><td className={cellClass}>{seconds(summary.totalDurationSeconds)}</td><td className={cellClass}>{seconds(summary.ahtSeconds)}</td><td className={cellClass}>{variance==null?"--":variance<=0?"Target met":"Above target"}</td></tr></tfoot>}
        </table>
      </div>
      <TablePagination currentPage={current?.pagination?.page||page} totalPages={current?.pagination?.totalPages||1} totalItems={current?.pagination?.totalRecords||0} pageSize={limit} onPageChange={setPage} itemLabel={reportType==="summary"?"groups":"calls"} disabled={busy||Boolean(error)} extraLeft={<label className="flex items-center gap-1">Per page <select aria-label="Rows per page" className={inputClass} value={limit} onChange={e=>{setLimit(Number(e.target.value));setPage(1);}}>{[10,25,50,100].map(n=><option key={n}>{n}</option>)}</select></label>}/>
    </div>
  </div>;
}
