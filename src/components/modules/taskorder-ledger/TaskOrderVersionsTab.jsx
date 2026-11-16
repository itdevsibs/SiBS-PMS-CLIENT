import { useCallback, useEffect, useState } from 'react';
import { GitCompare, Loader2, ShieldCheck } from 'lucide-react';
import { fetchTaskOrderVersions, fetchTaskOrderVersionDiff, fetchTaskOrderVersion } from '@/lib/axios/task-order-ledger';
const control = 'h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700';
const th = 'bg-[#052e53] px-4 py-3 text-left text-[11px] font-bold text-white';
export default function TaskOrderVersionsTab() {
  const [versions,setVersions]=useState([]);
  const [currentId,setCurrentId]=useState(null);
  const [base,setBase]=useState('1');
  const [target,setTarget]=useState('current');
  const [selected,setSelected]=useState(null);
  const [diff,setDiff]=useState(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const load=useCallback(async()=>{
    setBusy(true);setError('');
    try {
      const response=await fetchTaskOrderVersions();
      if (!response?.success) throw new Error(response?.message||'Unable to load versions');
      const rows = response.data?.rows || [];
      setVersions(rows);
      const baseline = rows.find((item) => Number(item.version_number) === 1);
      if (baseline) setBase(String(baseline.id));
      setCurrentId(response.data?.currentVersionId||null);
    } catch(err) {setError(err?.response?.data?.message||err.message);}
    finally {setBusy(false);}
  },[]);
  useEffect(()=>{void load();},[load]);
  const inspect=async(id)=>{
    setBusy(true);setError('');
    try {const response=await fetchTaskOrderVersion(id); setSelected(response.data);}
    catch(err){setError(err?.response?.data?.message||err.message);}
    finally{setBusy(false);}
  };
  const compare=async()=>{
    setBusy(true);setError('');
    try {const response=await fetchTaskOrderVersionDiff(base,target);setDiff(response.data);}
    catch(err){setError(err?.response?.data?.message||err.message);}
    finally {setBusy(false);}
  };
  return <div className="space-y-4 p-4 text-xs text-slate-700">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-slate-500">Published versions are read-only. V1 is the verified baseline at bootstrap, not automatically an older historical mapping.</p>
      <button className={control} type="button" onClick={load}>Reload versions</button>
    </div>
    {error && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700">{error}</div>}
    {busy && <div className="flex items-center gap-2 text-slate-500"><Loader2 size={15} className="animate-spin"/> Loading...</div>}
    <div className="overflow-auto rounded-xl border border-slate-200">
      <table className="w-full min-w-[670px] text-left"><thead><tr>
        {['Version','Description','Countries','Published by','Status','Action'].map(v=><th className={th} key={v}>{v}</th>)}
      </tr></thead><tbody>
        {!versions.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No published versions. Complete the database migration and V1 bootstrap.</td></tr>}
        {versions.map((v)=><tr className="border-b border-slate-100" key={v.id}>
          <td className="px-4 py-3 font-bold">V{v.version_number}</td>
          <td className="px-4 py-3">{v.label}</td>
          <td className="px-4 py-3">{v.country_count}</td>
          <td className="px-4 py-3">{v.published_by}</td>
          <td className="px-4 py-3">{v.isCurrent?<span className="text-emerald-700">Current</span>:'Archived'}</td>
          <td className="px-4 py-3"><button type="button" onClick={()=>inspect(v.id)} className="font-bold text-blue-700 hover:underline">Inspect</button></td>
        </tr>)}
      </tbody></table>
    </div>
    {selected && <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="mb-2 flex items-center gap-2 font-bold"><ShieldCheck size={15}/>{selected.version?.label} — Immutable snapshot</div>
      <p className="mb-2 text-slate-500">Hash: <span className="break-all font-mono">{selected.version?.contentHash}</span></p>
      <div className="grid max-h-52 grid-cols-1 gap-1 overflow-y-auto sm:grid-cols-2 xl:grid-cols-3">
        {selected.countries?.map((c)=><div key={c.countryKey} className="rounded bg-white px-2 py-1.5">{c.countryLabel} → {selected.profiles?.find((p)=>p.profileId===c.profileId)?.name||'Unmapped'} <span className="text-slate-500">({selected.profiles?.find((p)=>p.profileId===c.profileId)?.sourceSystem||'Legacy source not recorded'})</span></div>)}
      </div>
    </div>}
    <div className="rounded-xl border border-slate-200 p-3">
      <div className="mb-3 flex items-center gap-2 font-bold"><GitCompare size={16}/> Compare country ownership</div>
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1">Base version<select className={control} value={base} onChange={(e)=>setBase(e.target.value)}>{versions.map((v)=><option key={v.id} value={v.id}>V{v.version_number} — {v.label}</option>)}</select></label>
        <label className="flex flex-col gap-1">Target version<select className={control} value={target} onChange={(e)=>setTarget(e.target.value)}><option value="current">Current {currentId?`(ID ${currentId})`:''}</option>{versions.map((v)=><option key={v.id} value={v.id}>V{v.version_number}</option>)}</select></label>
        <button type="button" className="h-9 rounded-lg bg-[#052e53] px-4 font-bold text-white" onClick={compare} disabled={busy||!versions.length}>Compare</button>
      </div>
      {diff && <div className="mt-3 space-y-1">
        <p className="font-semibold">{diff.identical?'Identical mapping snapshots':`${diff.countryMovements?.length||0} ownership changes`}</p>
        {diff.sourceMovements?.map((m)=><div className="rounded bg-blue-50 px-3 py-2" key={`source-${m.profileId}`}>{m.taskOrder}: {m.previousSource} → {m.newSource} (source changed)</div>)}
        {diff.countryMovements?.map((m)=><div className="rounded bg-slate-50 px-3 py-2" key={m.countryKey}>{m.country}: {m.previousTaskOrder||'Unmapped'} → {m.newTaskOrder||'Unmapped'} <span className="text-slate-500">({m.changeType})</span></div>)}
      </div>}
    </div>
  </div>;
}
