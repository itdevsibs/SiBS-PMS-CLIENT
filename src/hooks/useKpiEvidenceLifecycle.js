import { useCallback, useEffect, useRef, useState } from 'react';
import { renewWorkforceKpiEvidence, releaseWorkforceKpiEvidence } from '@/lib/axios/kpis';

const HEARTBEAT_MS = 60_000;
const RECOVERY_ATTEMPTS = 2;
const LOGOUT_EVENT = 'sibs-auth-logout-start';
const statusOf = error => error?.response?.status;
const codeOf = error => error?.response?.data?.code;
const forbidden = error => [401,403].includes(statusOf(error));
const expired = error => statusOf(error) === 409 && codeOf(error) === 'KPI_EVIDENCE_EXPIRED';
const messageOf = error => error?.response?.data?.message || error?.message || 'Unable to reconnect to this report.';
const wait = (ms, signal) => new Promise(resolve => {
  if (signal.aborted) return resolve();
  const timer = setTimeout(done, ms);
  function done() { clearTimeout(timer); signal.removeEventListener('abort',done); resolve(); }
  signal.addEventListener('abort',done,{once:true});
});

// Each mounted report has its own lease, including reports in another tab.
// This is not an authentication heartbeat and never refreshes source data.
export default function useKpiEvidenceLifecycle({metric,evidenceId,bucketKey,recoverGraph,onForbidden}) {
  const [leaseId] = useState(() => globalThis.crypto?.randomUUID?.() || `report-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const [state,setState] = useState({kind:'loading',message:''});
  const [revision,setRevision] = useState(0);
  const latest=useRef({recoverGraph,onForbidden});
  latest.current={recoverGraph,onForbidden};
  const context=useRef(null);
  const attempts=useRef(0);
  const accessBlocked=useRef(false);

  const stopAccess=useCallback((ctx,error)=>{
    if(context.current!==ctx || ctx.stopped) return;
    ctx.stopped=true;accessBlocked.current=true;ctx.abort.abort();
    latest.current.onForbidden?.();
    setState({kind:'forbidden',message:messageOf(error)});
  },[]);

  const recover=useCallback(ctx=>{
    if(!ctx||ctx.stopped||ctx.abort.signal.aborted) return;
    if(ctx.recovery) return ctx.recovery;
    const run=async()=>{
      setState({kind:'recovering',message:'Restoring the report snapshot…'});
      let error;
      while(attempts.current<RECOVERY_ATTEMPTS) {
        attempts.current++;
        if(ctx.stopped||ctx.abort.signal.aborted) return;
        try {
          if(!latest.current.recoverGraph) throw new Error('Report recovery is unavailable.');
          const nextId=await latest.current.recoverGraph(metric,bucketKey,ctx.abort.signal);
          if(ctx.stopped||ctx.abort.signal.aborted||context.current!==ctx) return;
          if(!nextId) throw new Error('No calculation evidence is available for this period.');
          // Parent state owns the evidence ID. It changes together with graph totals.
          if(nextId===ctx.id) setRevision(v=>v+1);
          return;
        } catch(e) {
          if(ctx.stopped||ctx.abort.signal.aborted) return;
          if(forbidden(e)){stopAccess(ctx,e);return;}
          error=e;
          if(attempts.current<RECOVERY_ATTEMPTS) await wait(1000,ctx.abort.signal);
        }
      }
      if(!ctx.stopped&&context.current===ctx) {
        ctx.recoveryExhausted=true;
        setState({kind:'offline',message:messageOf(error||new Error('Automatic recovery limit reached. Retry the report.'))});
      }
    };
    ctx.recovery=run().finally(()=>{ctx.recovery=null;});
    return ctx.recovery;
  },[metric,bucketKey,stopAccess]);

  const onReadSuccess=useCallback(id=>{
    const ctx=context.current;
    if(!ctx||ctx.id!==id||ctx.stopped) return;
    ctx.lastRenewed=Date.now();ctx.readFailed=false;ctx.recoveryExhausted=false;attempts.current=0;
    setState({kind:'active',message:''});
  },[]);
  const onReadError=useCallback((id,error)=>{
    const ctx=context.current;
    if(!ctx||ctx.id!==id||ctx.stopped) return;
    if(forbidden(error)){stopAccess(ctx,error);return;}
    ctx.readFailed=true;
    if(expired(error)){if(!ctx.recoveryExhausted) void recover(ctx);return;}
    setState({kind:'offline',message:messageOf(error)});
  },[recover,stopAccess]);

  useEffect(()=>{
    if(accessBlocked.current) return;
    const ctx={id:evidenceId,abort:new AbortController(),stopped:false,lastRenewed:0,pending:false,recovery:null,readFailed:false,recoveryExhausted:false};
    context.current=ctx;
    setState({kind:'loading',message:''});
    const heartbeat=async(force=false)=>{
      if(ctx.stopped||document.visibilityState==='hidden'||ctx.pending||ctx.recovery||ctx.recoveryExhausted) return;
      if(!ctx.id){void recover(ctx);return;}
      if(!force&&Date.now()-ctx.lastRenewed<HEARTBEAT_MS) return;
      ctx.pending=true;
      try {
        const res=await renewWorkforceKpiEvidence({metric,evidenceId:ctx.id,leaseId},{signal:ctx.abort.signal});
        if(ctx.stopped||context.current!==ctx) return;
        if(!res?.success||res.data?.status!=='ACTIVE') throw new Error('Invalid snapshot renewal response.');
        ctx.lastRenewed=Date.now();
        if(ctx.readFailed||force){setRevision(v=>v+1);}
      }catch(error){
        if(ctx.stopped||context.current!==ctx) return;
        if(forbidden(error)){stopAccess(ctx,error);return;}
        if(expired(error)){void recover(ctx);return;}
        ctx.readFailed=true;
        setState({kind:'offline',message:messageOf(error)});
      }finally{ctx.pending=false;}
    };
    // The initial report request opens the lease; no duplicate heartbeat at mount.
    if(!ctx.id) void recover(ctx);
    const interval=setInterval(()=>void heartbeat(),HEARTBEAT_MS);
    const visible=()=>{if(document.visibilityState==='visible'){if(ctx.recoveryExhausted)attempts.current=0;ctx.recoveryExhausted=false;void heartbeat(true);}};
    const logout=()=>stopAccess(ctx,new Error('Your session has ended.'));
    document.addEventListener('visibilitychange',visible);
    window.addEventListener(LOGOUT_EVENT,logout);
    return ()=>{
      ctx.stopped=true;ctx.abort.abort();clearInterval(interval);
      document.removeEventListener('visibilitychange',visible);window.removeEventListener(LOGOUT_EVENT,logout);
      if(ctx.id&&!accessBlocked.current) void releaseWorkforceKpiEvidence({metric,evidenceId:ctx.id,leaseId}).catch(()=>{});
      if(context.current===ctx) context.current=null;
    };
  },[metric,evidenceId,leaseId,recover,stopAccess]);

  const retry=useCallback(()=>{
    const ctx=context.current;
    if(!ctx||ctx.stopped||ctx.recovery) return;
    ctx.recoveryExhausted=false;attempts.current=0;
    if(!ctx.id){void recover(ctx);return;}
    setState({kind:'loading',message:''});setRevision(v=>v+1);
  },[recover]);
  return {leaseId,state,revision,onReadSuccess,onReadError,retry};
}
