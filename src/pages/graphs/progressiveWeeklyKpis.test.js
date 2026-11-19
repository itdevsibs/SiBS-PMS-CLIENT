import test from 'node:test';
import assert from 'node:assert/strict';
import { getProgressiveWeeklyWindows, isWeeklyKpiUsable, buildPartialWeeklyResponse } from './progressiveWeeklyKpis.js';

test('six weeks are requested latest first but chart data stays chronological', () => {
  const windows=getProgressiveWeeklyWindows('2026-11-19');
  assert.equal(windows.length,6);
  assert.deepEqual(windows[0],{weekFrom:'2026-11-15',weekTo:'2026-11-21'});
  assert.deepEqual(windows[5],{weekFrom:'2026-10-11',weekTo:'2026-10-17'});
  const wrap=(key,label,pct)=>({data:{data:{series:[{key,label,utilizationPct:pct}],
    summary:{utilizationPct:pct},utilization:{status:'AVAILABLE'},filters:{period:'weekly'}}}});
  const partial=buildPartialWeeklyResponse([
    wrap('2026-W47','Week 47',85),wrap('2026-W46','Week 46',78),
  ],'utilization').data.data;
  assert.deepEqual(partial.series.map(x=>x.key),['2026-W46','2026-W47']);
  assert.equal(partial.summary.utilizationPct,null);
  assert.equal(partial.utilization.status,'PARTIAL_LOADING');
});

test('unavailable, empty and incomplete KPI responses do not become successful zero weeks',()=>{
  assert.equal(isWeeklyKpiUsable({data:{data:{series:[{}],utilization:{status:'UNAVAILABLE'}}}},'utilization'),false);
  assert.equal(isWeeklyKpiUsable({data:{data:{series:[],absenteeism:{status:'AVAILABLE'}}}},'absenteeism'),false);
  assert.equal(isWeeklyKpiUsable({data:{data:{series:[{key:'2026-W47'}],absenteeism:{status:'AVAILABLE'}}}},'absenteeism'),true);
  assert.deepEqual(getProgressiveWeeklyWindows('2026-02-30'),[]);
});
