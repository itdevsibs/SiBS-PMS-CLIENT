import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

async function read(relativePath) {
  return fs.readFile(path.join(root, relativePath), "utf8");
}

test("WFM comparison API bridge calls the separate US Visa comparison endpoint", async () => {
  const source = await read("src/lib/axios/us-visa-performance.js");

  assert.match(source, /getWfmUsVisaPerformanceComparison/);
  assert.match(source, /\/us-visa\/performance\/comparison/);
});

test("View Graph uses one synchronized filter object for graph and comparison", async () => {
  const source = await read("src/pages/graphs/viewGraphsPage.jsx");

  assert.match(source, /const params = buildRequestParams\(filters\)/);
  assert.match(source, /getWfmCallKpis\(params\)/);
  assert.match(source, /getWfmUsVisaPerformanceComparison\(params\)/);
  assert.match(source, /taskOrder/);
  assert.match(source, /skill/);
  assert.match(source, /period/);
  assert.match(source, /referenceDate/);
  assert.match(source, /from/);
  assert.match(source, /to/);
});

test("WFM comparison section is separate from the existing graph dashboard", async () => {
  const page = await read("src/pages/graphs/viewGraphsPage.jsx");
  const dashboard = await read("src/components/workForceManagement/kpi/WfmCallKpiDashboard.jsx");

  assert.match(page, /WfmCallKpiDashboard/);
  assert.match(page, /WfmKpiSourceComparison/);
  assert.doesNotMatch(dashboard, /KPI Source Comparison/);
});

test("WFM comparison table displays exact values, N/A, and supported statuses", async () => {
  const source = await read("src/components/workForceManagement/kpi/WfmKpiSourceComparison.jsx");

  assert.match(source, /Skill Stats/);
  assert.match(source, /Agent Level/);
  assert.match(source, /Difference/);
  assert.match(source, /return "N\/A"/);
  assert.match(source, /MATCH/);
  assert.match(source, /DIFFERENT/);
  assert.match(source, /NOT COMPARABLE/);
  assert.match(source, /MISSING DATA/);
  assert.match(source, /formatDifference/);
  assert.doesNotMatch(source, /tolerance/i);
  assert.doesNotMatch(source, /acceptable/i);
});

test("WFM comparison handles missing Skill or Agent uploads without substituting zero", async () => {
  const source = await read("src/components/workForceManagement/kpi/WfmKpiSourceComparison.jsx");

  assert.match(source, /MISSING_AGENT_DATA/);
  assert.match(source, /MISSING_SKILL_DATA/);
  assert.match(source, /isUnavailable/);
  assert.doesNotMatch(source, /Number\(value \|\| 0\)/);
});
