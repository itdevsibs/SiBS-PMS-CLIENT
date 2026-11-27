import { useEffect, useState } from 'react';
import TablePagination from '@/components/common/tables/TablePagination.jsx';
import useKpiEvidenceLifecycle from '@/hooks/useKpiEvidenceLifecycle';
import { getWorkforceKpiEvidence } from '@/lib/axios/kpis';

const PAGE_SIZE=25;
const inputClass='min-w-0 rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:border-[#103B63] focus:outline-none';
const fmt=(v,d=2)=>v==null||!Number.isFinite(Number(v))?'--':Number(v).toLocaleString(undefined,{maximumFractionDigits:d});
const pct=v=>v==null?'--':`${fmt(v)}%`;
const hours=v=>v==null?'--':`${fmt(Number(v)/3600)}h`;
const text=v=>v==null||v===''?'--':String(v);
const titles={absenteeism:'Absenteeism',headcount:'Headcount',occupancy:'Occupancy',utilization:'Utilization'};
const summaryColumns={absenteeism:[['group','Group'],['scheduledEmployeeDays','Scheduled'],['presentEmployeeDays','Present'],['absentEmployeeDays','Absent days'],['plannedLeaveEmployeeDays','Planned leave'],['unverifiedEmployeeDays','Unverified'],['absenteeismPct','Rate',pct]],headcount:[['group','Task Order'],['requiredHeadcount','Required FTE'],['actualHeadcount','Actual HC'],['buffer','Buffer']],occupancy:[['group','Group'],['matchedAgents','Matched agents'],['workSeconds','Work',hours],['idleSeconds','Idle',hours],['occupancyPct','Occupancy',pct]]};
const employeeColumns={absenteeism:[['workDate','Date'],['employeeUid','SIBS ID'],['employeeName','Employee'],['taskOrderId','Task Order'],['scheduleWindows','Schedule',v=>v?.map(w=>`${w.start} – ${w.end}`).join('; ')||'--'],['loginAt','Login'],['logoutAt','Logout'],['recordedWorkHoursEvidence','Recorded work hours',v=>v?.map(r=>String(r.value)).join('; ')||'--'],['status','Status'],['absent','Counted',v=>v?'Yes':'No']],headcount:[['employeeUid','SIBS ID'],['employeeName','Employee'],['employeeRole','Role'],['taskOrderId','Task Order'],['effectiveFrom','Join date'],['effectiveTo','Departure date'],['userStatus','Current status',v=>v==null?'Unverified':Number(v)===0?'Active':Number(v)===1?'Inactive':'Unverified']],occupancy:[['employeeUid','SIBS ID'],['employeeName','Source agent name'],['taskOrderId','Task Order'],['sourceSystem','Source'],['workSeconds','Work',hours],['idleSeconds','Idle',hours],['occupancyPct','Occupancy',pct]]};
summaryColumns.utilization=[['group','Group'],['matchedAgents','Matched agents'],['validEmployeeDays','Included days'],['productiveSeconds','Productive',hours],['shiftSeconds','Shift',hours],['excludedRecords','Excluded records'],['utilizationPct','Utilization',pct]];
employeeColumns.utilization=[['workDate','Date'],['employeeUid','SIBS ID'],['employeeName','Employee'],['taskOrderId','Task Order'],['workSeconds','Work',hours],['idleSeconds','Idle',hours],['productiveSeconds','Productive',hours],['shiftSeconds','Shift',hours],['utilizationPct','Utilization',pct],['status','Status']];
const sourceCols=[['workDate','Date'],...employeeColumns.occupancy.slice(0,4),['batchId','Batch'],['mappingStatus','Mapping'],['talk','Talk',hours],['hold','Hold',hours],['afterCall','ACW',hours],['wrap','Wrap-up',hours],['email','Email',hours],['chat','Chat',hours],['workSeconds','Work',hours],['idleSeconds','Idle',hours],['occupancyPct','Occupancy',pct]];
function Metric({label,value}){return <div className="min-w-0 rounded border border-slate-200 bg-white px-3 py-2"><div className="text-[10px] font-extrabold uppercase text-slate-500">{label}</div><div className="mt-1 text-lg font-black tabular-nums text-[#103B63]">{value}</div></div>}
function Select({value,onChange,options,label}){return <label className="flex min-w-0 flex-col gap-1 text-[10px] font-bold uppercase text-slate-500">{label}<select className={inputClass} value={value} onChange={e=>onChange(e.target.value)}>{options.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>}
function EvidenceDetails({row,metric}){
  if(metric==='headcount')return <div className="space-y-1"><p>Included in employment snapshot as of {row.snapshotDate}. Current employment status is informational.</p>{row.assignments?.map((a,i)=><p key={i}>{a.taskOrderId}: {text(a.effectiveFrom)} to {text(a.effectiveTo)}</p>)}</div>;
  if(metric==='utilization')return <div className="grid grid-cols-2 gap-2"><div>Login: {text(row.loginAt)}</div><div>Logout: {text(row.logoutAt)}</div><div>Shift status: {text(row.shiftStatus)}</div><div>Included in KPI: {row.utilizationValid?'Yes':'No'}</div><div>Talk: {hours(row.talk)}</div><div>Hold: {hours(row.hold)}</div><div>ACW: {hours(row.afterCall)}</div><div>Wrap: {hours(row.wrap)}</div><div>Email: {hours(row.email)}</div><div>Chat: {hours(row.chat)}</div><div>Source: {text(row.sourceSystem)}</div><div>Batch: {text(row.batchId)}</div><div>Calculation status: {text(row.status)}</div></div>;
  if(metric==='occupancy')return <div>Imported time, grouped by agent. Select Source details to see production date, import batch, Task Order and the individual time components.</div>;
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-2"><div>Verified scheduled denominator: {row.scheduled?'Yes (+1)':'No'}</div><div>Absent numerator: {row.absent?'Yes (+1)':'No'}</div><div>Raw recorded hours (audit only): {row.recordedWorkHoursEvidence?.map(r=>String(r.value)).join('; ')||'Not supplied'}</div><div>Verified positive recorded hours: {row.verifiedRecordedHours?'Yes':'Not established'}</div><div>Completed overlapping tracker interval: {row.completedIntervalEvidence?'Yes':'Not established'}</div><div>Present employee-day: {row.present?'Yes':'No'}</div><div>Planned leave contribution: {row.planned?'Yes':'No'}</div><div className="sm:col-span-2">{row.leaveEvidence?.length?row.leaveEvidence.map((l,i)=><p key={i}>Approved {l.planned?'planned':'unplanned'} leave #{text(l.leaveId)} · filed {text(l.filed)} · {text(l.from)} to {text(l.to)} · approved {text(l.approvedDate)} · {l.noticeCalendarDays} calendar days' notice</p>):'No matching approved leave evidence retained for this employee-day.'}</div></div>;
}
export default function WorkforceKpiEvidenceModalContent({metric,active,initialReport='summary',recoverGraph}){
  const evidenceId=active?.[`${metric}EvidenceId`];
  return <Report key={`${metric}:${active?.key||''}:${initialReport}`} recoverGraph={recoverGraph} metric={metric} active={active} evidenceId={evidenceId} initialReport={initialReport}/>;
}
function Report({metric,active,evidenceId,initialReport,recoverGraph}){
  const [reportType,setReportType]=useState(initialReport),[employeeUid,setEmployeeUid]=useState(''),[search,setSearch]=useState(''),[date,setDate]=useState(''),[taskOrder,setTaskOrder]=useState(''),[sourceSystem,setSource]=useState(''),[status,setStatus]=useState(metric==='utilization'?'all':'counted'),[groupBy,setGroup]=useState(metric==='headcount'?'taskOrder':'date'),[sort,setSort]=useState('name'),[page,setPage]=useState(1),[result,setResult]=useState(null),[loading,setLoading]=useState(false),[expanded,setExpanded]=useState(null),[options,setOptions]=useState({});
  const lifecycle=useKpiEvidenceLifecycle({metric,evidenceId,bucketKey:active?.key,recoverGraph,onForbidden:()=>{setResult(null);setOptions({});setExpanded(null);}});
  const {leaseId,state,revision,onReadSuccess,onReadError,retry}=lifecycle;
  const queryKey=JSON.stringify({reportType,search,date,taskOrder,sourceSystem,status,groupBy,sort,page,employeeUid,limit:PAGE_SIZE});
  const blocked=state.kind==='forbidden';
  useEffect(()=>{
    if(!evidenceId||blocked)return;
    const abort=new AbortController();let cancelled=false;setLoading(true);
    const timer=setTimeout(async()=>{
      try {
        const res=await getWorkforceKpiEvidence(metric,{...JSON.parse(queryKey),evidenceId,leaseId},{signal:abort.signal});
        if(!res?.success||res?.data?.metric!==metric)throw new Error('Invalid report response.');
        if(!cancelled){
          const nextPage=res.data.pagination?.page??page;
          const effectiveKey=nextPage===page?queryKey:JSON.stringify({...JSON.parse(queryKey),page:nextPage});
          setResult({key:effectiveKey,evidenceId,data:res.data});setOptions(res.data.options||{});
          if(nextPage!==page)setPage(nextPage);
          onReadSuccess(evidenceId);
        }
      }catch(e){if(!cancelled)onReadError(evidenceId,e);}
      finally{if(!cancelled)setLoading(false);}
    },search.trim()?200:0);
    return ()=>{cancelled=true;abort.abort();clearTimeout(timer);};
  },[metric,evidenceId,queryKey,search,page,leaseId,revision,blocked,onReadSuccess,onReadError]);
  const change=setter=>value=>{setter(value);setPage(1);setExpanded(null);};
  const switchReport=value=>{setReportType(value);setPage(1);setExpanded(null);setDate('');setEmployeeUid('');};
  const data=!blocked&&result?.key===queryKey?result.data:null;
  const stale=!!data&&(result.evidenceId!==evidenceId||state.kind==='offline'||state.kind==='recovering');
  const busy=!blocked&&!data&&(loading||state.kind==='loading'||state.kind==='recovering');
  const error=blocked||state.kind==='offline'?state.message:'';
  const rowIdentity=row=>JSON.stringify([row.employeeUid,row.workDate,row.group,row.sourceSystem,row.taskOrderId,row.batchId,row.status]);
  const summary=data?.summary;
  const cards=metric==='absenteeism'?[['Scheduled days',fmt(summary?.scheduledEmployeeDays)],['Present days',fmt(summary?.presentEmployeeDays)],['Absent days',fmt(summary?.absentEmployeeDays)],['Unique absent agents',fmt(summary?.uniqueAbsentAgents)],['Planned leave days',fmt(summary?.plannedLeaveEmployeeDays)],['Absenteeism',pct(summary?.absenteeismPct)]]:metric==='headcount'?[['Required FTE',fmt(summary?.requiredHeadcount)],['Actual HC',fmt(summary?.actualHeadcount)],['Buffer',fmt(summary?.buffer)],['Snapshot date',text(summary?.snapshotDate)],...(reportType==='availability'?[['Present days',fmt(summary?.presentEmployeeDays)],['Not verified',fmt(summary?.availabilityNotVerified)]]:[])]:metric==='utilization'?[['Matched agents',fmt(summary?.matchedAgents)],['Valid employee-days',fmt(summary?.validEmployeeDays)],['Productive time',hours(summary?.productiveSeconds)],['Total shift time',hours(summary?.shiftSeconds)],['Excluded records',fmt(summary?.excludedRecords)],['Utilization',pct(summary?.utilizationPct)]]:[['Matched agents',fmt(summary?.matchedAgents)],['Work time',hours(summary?.workSeconds)],['Available idle',hours(summary?.idleSeconds)],['Occupancy',pct(summary?.occupancyPct)]];
  const detailMetric=reportType==='availability'?'absenteeism':metric;
  const cols=reportType==='summary'?summaryColumns[metric]:reportType==='sourceDetails'?sourceCols:employeeColumns[detailMetric];
  const list=data?.rows||[];
  const reset=()=>{setEmployeeUid('');setSearch('');setDate('');setTaskOrder('');setSource('');setStatus(metric==='utilization'?'all':'counted');setSort('name');setPage(1);};
  return <div className="flex h-full min-h-0 flex-col gap-3 text-xs text-slate-700">
    <div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="text-sm font-black text-[#103B63]">{titles[metric]} Report</h3><p className="text-slate-500">{active?.label} · {blocked?'Access unavailable':state.kind==='recovering'?'Restoring report snapshot…':stale?'Last loaded snapshot · Not current':state.kind==='active'?'Snapshot active · Same calculation as graph':'Loading calculation snapshot…'}</p></div><div className="flex flex-wrap gap-1">{[['summary','Report 1'],['details','Report 2'],...(metric==='headcount'?[['availability','Daily Availability']]:metric==='occupancy'?[['sourceDetails','Source Details']]:[])].map(([v,l])=><button key={v} type="button" onClick={()=>switchReport(v)} className={`rounded px-3 py-1.5 font-bold ${reportType===v?'bg-[#103B63] text-white':'bg-slate-100 text-slate-600'}`}>{l}</button>)}</div></div>
    <div className="flex flex-wrap items-end gap-2"><label className="flex flex-col gap-1 text-[10px] font-bold uppercase text-slate-500">Search<input className={inputClass} placeholder="Name or SIBS ID" value={search} onChange={e=>change(setSearch)(e.target.value)}/></label>
      <Select label="Task Order" value={taskOrder} onChange={change(setTaskOrder)} options={[["","All Task Orders"],...(options.taskOrders||[]).map(v=>[v,v])]}/>
      {(metric!=='headcount'||reportType==='availability')&&<Select label="Date" value={date} onChange={change(setDate)} options={[["","All Dates"],...(options.dates||[]).map(v=>[v,v])]}/>}
      {metric==='occupancy'&&<Select label="Source" value={sourceSystem} onChange={change(setSource)} options={[["","All Sources"],...(options.sources||[]).map(v=>[v,v])]}/>}
      {metric==='absenteeism'&&reportType==='details'&&<Select label="Status" value={status} onChange={change(setStatus)} options={[["counted","Counted in Absenteeism"],["all","All Records"],...['Absent','Planned Leave','Unplanned Leave','Present','Unverified','Presence outside verified schedule'].map(v=>[v,v])]}/>}
      {metric==='utilization'&&reportType==='details'&&<Select label="Status" value={status} onChange={change(setStatus)} options={[["all","All Records"],["Included","Included in Utilization"],["excluded","All Excluded"],...['No Attendance','Incomplete Shift','Invalid Shift','Unmapped Employee','Verification Unavailable'].map(v=>[v,v])]}/>}
      {reportType==='summary'&&metric!=='headcount' &&<Select label="Group by" value={groupBy} onChange={change(setGroup)} options={[["date","Date"],["taskOrder","Task Order"],...(metric==='occupancy'?[["source","Source"]]:[])]}/>}
      {['occupancy','utilization'].includes(metric)&&reportType!=='summary'&&<Select label="Sort" value={sort} onChange={change(setSort)} options={[["name","Name"],["high",`Highest ${titles[metric]}`],["low",`Lowest ${titles[metric]}`]]}/>}
      <button type="button" className="rounded border border-slate-300 px-3 py-1.5 font-bold" onClick={reset}>Reset</button>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 shrink-0">{cards.map(([label,value])=><Metric key={label} label={label} value={busy?'…':value}/>)}</div>
    {state.kind==='recovering'&&<p role="status" className="text-slate-600">Restoring the report without closing it…</p>}
    {error&&<div role="alert" className={`flex items-center justify-between gap-2 rounded border p-3 ${blocked?'border-rose-200 bg-rose-50 text-rose-700':'border-amber-200 bg-amber-50 text-amber-800'}`}><span>{stale?'Showing last loaded data. ':''}{error}</span>{!blocked&&<button type="button" className="rounded border border-current px-3 py-1 font-bold" onClick={retry}>Retry</button>}</div>}
    {employeeUid&&<p>Employee drill-down: {employeeUid==='__UNMAPPED__'?'Unmapped Employee':employeeUid} <button className="underline" onClick={()=>{setEmployeeUid('');setPage(1);}}>Clear</button></p>}
    {data?.reconciliation==='MISMATCH'&&<p role="alert" className="font-bold text-rose-700">Evidence totals do not match the graph. Refresh and investigate.</p>}
    {data?.restricted&&<p className="text-amber-700 font-semibold">Showing assigned employees only; totals may differ from the graph.</p>}
    <div className="min-h-0 flex-1 overflow-auto rounded border border-slate-200">
      <table className="w-full text-left text-xs"><thead className="sticky top-0 bg-[#103B63] text-white"><tr>{cols.map(([k,l])=><th key={k} className="px-3 py-2 font-bold uppercase whitespace-nowrap">{l}</th>)}<th className="px-2 py-2"><span className="sr-only">Details</span></th></tr></thead><tbody>
      {busy?Array.from({length:5},(_,i)=><tr key={i}>{cols.map(([k])=><td key={k} className="px-3 py-3"><div className="h-3 w-full animate-pulse rounded bg-slate-100"/></td>)}<td/></tr>):list.length?list.map((row,i)=><Row key={i} row={row} cols={cols} open={expanded===rowIdentity(row)} metric={detailMetric} reportType={reportType} onClick={()=>{if(reportType==='summary'){if(metric==='headcount'||groupBy==='taskOrder')setTaskOrder(row.group);else if(groupBy==='source')setSource(row.group);else setDate(row.group);setReportType('details');setPage(1);}else if(metric==='occupancy'&&reportType==='details'){setSearch('');setEmployeeUid(row.employeeUid||'__UNMAPPED__');setReportType('sourceDetails');setPage(1);}else setExpanded(expanded===rowIdentity(row)?null:rowIdentity(row));}}/>):<tr><td colSpan={cols.length+1} className="p-5 text-center text-slate-500">{error?'Report unavailable.':'No matching records.'}</td></tr>}
      </tbody></table>
    </div>
    {data?.pagination&&<TablePagination
      currentPage={data.pagination.page}
      totalPages={data.pagination.totalPages}
      totalItems={data.pagination.total}
      pageSize={data.pagination.limit||PAGE_SIZE}
      onPageChange={nextPage=>{setExpanded(null);setPage(nextPage);}}
      itemLabel="records"
      disabled={busy||stale||blocked||loading}
      className="shrink-0 rounded border border-slate-200"
    />}
    {data&&<details className="shrink-0 text-[11px] text-slate-500"><summary className="cursor-pointer font-bold">Data Quality &amp; Calculation Notes</summary>{data.notes.map(n=><p key={n}>{n}</p>)}</details>}
  </div>;
}
function Row({row,cols,open,metric,reportType,onClick}){return <><tr className="border-b border-slate-100 hover:bg-slate-50">{cols.map(([k,,format])=><td key={k} className="px-3 py-2 whitespace-nowrap">{format?format(row[k]):text(row[k])}</td>)}<td className="px-2 py-2"><button type="button" onClick={onClick} className="font-bold text-[#103B63] underline">{reportType==='summary'?'View':open?'Hide':'Details'}</button></td></tr>{open&&<tr><td className="bg-slate-50 p-3" colSpan={cols.length+1}><EvidenceDetails row={row} metric={metric}/></td></tr>}</>}
