// Phase 1: request six full Sunday-Saturday windows, latest first.  Keeping
// this independent of JSX lets regression tests verify ordering and merging.
const DAY_MS = 86_400_000;

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

export function getProgressiveWeeklyWindows(referenceDate, count = 6) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(referenceDate || ''))) return [];
  const anchor = new Date(`${referenceDate}T00:00:00.000Z`);
  if (Number.isNaN(anchor.getTime()) || formatDate(anchor) !== referenceDate) return [];
  const mostRecentSunday = new Date(anchor.getTime() - anchor.getUTCDay() * DAY_MS);
  return Array.from({ length: count }, (_, i) => {
    const sunday = new Date(mostRecentSunday.getTime() - i * 7 * DAY_MS);
    const saturday = new Date(sunday.getTime() + 6 * DAY_MS);
    return { weekFrom: formatDate(sunday), weekTo: formatDate(saturday) };
  });
}

export const HEADCOUNT_FIELDS = ['actualHeadcount','requiredHeadcount','buffer','staffingCoverage','staffingCoverageStatus','headcountStatus','requiredSnapshotDate','coveredDays','days','headcountEvidenceId'];
export const hasHeadcount = row => row?.actualHeadcount != null || row?.requiredHeadcount != null;
// Keep a coherent headcount tuple and its evidence ID, never mix separate snapshots.
export function selectHeadcount(primary, fallback) {
  const score = row => 10*(Number(row?.actualHeadcount != null) + Number(row?.requiredHeadcount != null)) + Number(Boolean(row?.headcountEvidenceId));
  return score(primary) >= score(fallback) && hasHeadcount(primary) ? primary : fallback;
}
export function pickHeadcount(primary, fallback) {
  const row = selectHeadcount(primary, fallback);
  return Object.fromEntries(HEADCOUNT_FIELDS.map(key => [key, row?.[key] ?? null]));
}
export function weeklyBucket(window) {
  const date = new Date(`${window.weekFrom}T00:00:00Z`);
  const first = year => { const d = new Date(Date.UTC(year,0,1)); return d.getTime()-d.getUTCDay()*DAY_MS; };
  let year=date.getUTCFullYear();
  if(date.getTime()>=first(year+1)) year++;
  const week=Math.round((date.getTime()-first(year))/(7*DAY_MS))+1;
  return {key:`${year}-W${String(week).padStart(2,'0')}`,label:`Week ${week}`};
}
export function isSourceUnavailable(data, type) {
  if(type==='headcount') return Boolean(data?.evidenceErrors?.headcount || Object.keys(data?.staffing?.sourceErrors || {}).length);
  return CLOSED_STATUSES.has(data?.[type]?.status) || (type==='absenteeism' && Boolean(data?.staffing?.scheduleError || data?.evidenceErrors?.absenteeism || data?.evidenceErrors?.headcount || Object.keys(data?.staffing?.sourceErrors || {}).length));
}
const ABSENCE_FIELDS = ['absenteeismPct','presentHeadcount','presentEmployeeDays','absentHeadcount','absentEmployeeDays','plannedLeaveEmployeeDays','unverifiedEmployeeDays','scheduledEmployeeDays','scheduledDays','absenteeismEvidenceId'];
const ATTRITION_FIELDS = ['attritionPct','attritedHeadcount','scheduledHeadcountStatus'];
const UTILIZATION_FIELDS = ['utilizationPct','utilizationProductiveTime','totalShiftTime','utilizationMatchedEmployeeDays','utilizationEvidenceId'];
const copyFields=(row,fields)=>Object.fromEntries(fields.map(key=>[key,row?.[key]??null]));
const sameValues=(a,b,fields)=>fields.filter(k=>!k.endsWith('EvidenceId')).every(k=>(a?.[k]??null)===(b?.[k]??null));
// Use final range totals when verified. Keep the original evidence ID when its
// values match, and never replace a verified weekly metric with an unavailable
// metric. A recovery request instead prefers its newly published evidence.
export function mergeFinalWeeklyResponse(partial, final, type, {recover=false}={}) {
  const old=partial?.data?.data || {}, next=final?.data?.data || {};
  const byKey=new Map((next.series || []).map(r=>[r.key,{...r}]));
  const retained=new Set();
  for(const prior of old.series || []) {
    const fresh=byKey.get(prior.key);
    if(!fresh) {byKey.set(prior.key,prior);retained.add(type);continue;}
    const groups=type==='headcount'?[[HEADCOUNT_FIELDS,'headcount',hasHeadcount(prior),hasHeadcount(fresh)]]:type==='utilization'?[[UTILIZATION_FIELDS,'utilization',prior.utilizationPct!=null,fresh.utilizationPct!=null]]: [
      [ABSENCE_FIELDS,'absenteeism',prior.absenteeismPct!=null,fresh.absenteeismPct!=null],
      [HEADCOUNT_FIELDS,'headcount',hasHeadcount(prior),hasHeadcount(fresh)],
      [ATTRITION_FIELDS,'attrition',prior.attritionPct!=null,fresh.attritionPct!=null],
    ];
    for(const [fields,family,oldValid,newValid] of groups) {
      const losesHeadcount=family==='headcount' && selectHeadcount(fresh,prior)===prior;
      const unchanged=sameValues(prior,fresh,fields);
      if((oldValid&&!newValid)||losesHeadcount) {Object.assign(fresh,copyFields(prior,fields));if(!unchanged)retained.add(family);}
      else if(!recover&&unchanged&&fields.some(k=>k.endsWith('EvidenceId')&&prior[k])) Object.assign(fresh,copyFields(prior,fields));
    }
  }
  const summary={...next.summary};
  // A full-period aggregate cannot be derived from a mixture of old and new
  // employee-day evidence. Keep it unavailable if a constituent week differs.
  if(retained.has('absenteeism')) Object.assign(summary,copyFields(null,ABSENCE_FIELDS));
  if(retained.has('utilization')) Object.assign(summary,copyFields(null,UTILIZATION_FIELDS));
  if(retained.has('attrition')) Object.assign(summary,copyFields(null,ATTRITION_FIELDS));
  const series=[...byKey.values()].sort((a,b)=>a.key.localeCompare(b.key));
  if(type!=='utilization' && retained.has('headcount')) Object.assign(summary,pickHeadcount(series.at(-1),null));
  return {...final,data:{...final.data,data:{...next,summary,series,retainedWeeklyMetrics:[...retained]}}};
}
const CLOSED_STATUSES = new Set(['UNAVAILABLE', 'ACCOUNT_UNAVAILABLE']);
export function isWeeklyKpiUsable(payload, type) {
  const data = payload?.data?.data;
  if (!data || !Array.isArray(data.series) || data.series.length !== 1) return false;
  const row = data.series[0];
  if (!row?.key) return false;
  if (type === 'headcount') return hasHeadcount(row);
  if (type === 'absenteeism') return !CLOSED_STATUSES.has(data.absenteeism?.status) || hasHeadcount(row) || row.attritionPct != null;
  return !CLOSED_STATUSES.has(data[type]?.status);
}

// The backend uses a Sunday-week reporting key. Keep data ordered by the
// server's bucket key, not completion order; unrequested weeks stay missing.
export function buildPartialWeeklyResponse(pieces, type) {
  const ready = pieces.filter(Boolean);
  const first = ready[0]?.data?.data || {};
  const values = new Map();
  for (const item of ready) {
    for (const bucket of item?.data?.data?.series || []) values.set(bucket.key, bucket);
  }
  const latestWindow=getProgressiveWeeklyWindows(first.filters?.referenceDate)[0];
  const latest=latestWindow ? values.get(weeklyBucket(latestWindow).key) : values.get([...values.keys()].sort().at(-1));
  const summary = type === 'utilization'
    ? { utilizationPct: null, utilizationProductiveTime: null, totalShiftTime: null, utilizationMatchedEmployeeDays: null }
    : type === 'headcount' ? pickHeadcount(latest,null) : { absenteeismPct: null, actualHeadcount: null, presentHeadcount: null,
        presentEmployeeDays: null, absentEmployeeDays: null, scheduledEmployeeDays: null };
  return {
    data: {
      success: true,
      data: {
        summary,
        series: [...values.values()].sort((a, b) => a.key.localeCompare(b.key)),
        [type]: { ...(first[type] || {}), status: 'PARTIAL_LOADING',
          message: 'Weekly values are available. Full-period totals are still loading.' },
        filters: first.filters || {},
        staffing: first.staffing,
      },
    },
  };
}

// Preserve a completed bucket recovered while the progressive loop is still
// publishing other weeks. The newly fetched bucket itself takes precedence.
export function appendProgressiveWeeklyResponse(previous,partial,newKey) {
  const next=partial.data.data;
  const prior=new Map((previous?.data?.data?.series||[]).map(r=>[r.key,r]));
  return {...partial,data:{...partial.data,data:{...next,series:next.series.map(r=>r.key===newKey?r:(prior.get(r.key)||r))}}};
}
export function mergeRecoveredWeeklyBucket(previous,recovered,type) {
  if(!previous) return recovered;
  const old=previous.data.data, next=recovered.data.data;
  const merged=mergeFinalWeeklyResponse(previous,recovered,type,{recover:true}).data.data;
  const recoveredKeys=new Set(next.series.map(row=>row.key));
  // Keep full summary unchanged only if the recovered metric values match;
  // a changed week invalidates the previous full-range total.
  const summary={...old.summary};
  const groups=type==='utilization'?[[UTILIZATION_FIELDS,'utilization']]:[[ABSENCE_FIELDS,'absenteeism'],[HEADCOUNT_FIELDS,'headcount'],[ATTRITION_FIELDS,'attrition']];
  for(const [fields,family] of groups) {
    const changed=merged.series.some(row=>recoveredKeys.has(row.key)&&!sameValues(old.series.find(r=>r.key===row.key),row,fields));
    if(changed && family!=='headcount') Object.assign(summary,copyFields(null,fields));
    if(changed && family==='headcount') Object.assign(summary,pickHeadcount(merged.series.at(-1),null));
  }
  return {...previous,data:{...previous.data,data:{...old,summary,series:merged.series}}};
}
