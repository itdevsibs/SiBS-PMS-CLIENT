import test from 'node:test';
import assert from 'node:assert/strict';
import { callRate, completeCallSum, formatCallRate } from './callRate.js';

test('answer, service, outside SLA and abandonment rates use the correct denominators',()=>{
  assert.equal(callRate(800,1000),80);
  assert.equal(callRate(720,800),90);
  assert.equal(callRate(80,800),10);
  assert.equal(callRate(200,1000),20);
});
test('aggregate uses sums of counts rather than average percentages',()=>{
  const rows=[{handled:80,within:72},{handled:150,within:120}];
  assert.equal(formatCallRate(callRate(completeCallSum(rows,'within'),completeCallSum(rows,'handled'))),'83.48%');
});
test('missing measurements and zero denominators are not zero percent',()=>{
  assert.equal(formatCallRate(callRate(null,80)),'--');
  assert.equal(formatCallRate(callRate(0,0)),'--');
  assert.equal(formatCallRate(callRate(0,80)),'0.00%');
  assert.equal(completeCallSum([{within:0},{within:null}],'within'),null);
  assert.equal(completeCallSum([],'within'),null);
  assert.equal(callRate('',80),null);
});
