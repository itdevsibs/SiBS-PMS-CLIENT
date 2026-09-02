import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

async function read(relativePath) {
  return fs.readFile(path.join(root, relativePath), "utf8");
}

test("Operations Manager API bridge uses the role-scoped operations endpoint", async () => {
  const source = await read("src/lib/axios/us-visa-performance.js");

  assert.match(source, /\/us-visa\/performance\/operations/);
});

test("Operations Manager hook uses backend scope and only sends narrowing filters for drilldown", async () => {
  const source = await read("src/hooks/useOperationsManagerPerformance.js");

  assert.match(source, /getOperationsUsVisaPerformance\(requestParams\)/);
  assert.match(source, /teamLeaderUid:\s*selectedTeamLeaderUid/);
  assert.match(source, /employeeUid:\s*selectedAgentUid/);
  assert.match(source, /getWfmCallKpis/);
  assert.match(source, /sourceSystem:\s*"US_VISA"/);
  assert.match(source, /period/);
  assert.match(source, /referenceDate/);
  assert.match(source, /from/);
  assert.match(source, /to/);
});

test("Operations Manager dashboard separates queue context from Agent Level people performance", async () => {
  const source = await read("src/components/operationsManager/OperationsManagerPerformanceDashboard.jsx");

  assert.match(source, /Operations \/ Queue Context/);
  assert.match(source, /Team Leader Rollup/);
  assert.match(source, /Agent Drilldown/);
  assert.match(source, /Service Level/);
  assert.match(source, /Calls Offered/);
  assert.match(source, /Agent-Level Operations Performance/);
  assert.match(source, /N\/A/);
  assert.doesNotMatch(source, /overall score/i);
});

test("Operations Manager dashboard consumes backend TL summaries and reuses shared Agent detail", async () => {
  const source = await read("src/components/operationsManager/OperationsManagerPerformanceDashboard.jsx");
  const detail = await read("src/components/agent/AgentKpiDetail.jsx");
  const teamLeader = await read("src/components/teamLeader/TeamLeaderPerformanceDashboard.jsx");

  assert.match(source, /teamLeader\.summary/);
  assert.doesNotMatch(source, /reduce\(/);
  assert.match(source, /AgentKpiDetail/);
  assert.match(teamLeader, /AgentKpiDetail/);
  assert.match(detail, /Handled/);
  assert.match(detail, /AHT/);
});

test("existing Operations Manager route renders the performance dashboard", async () => {
  const page = await read("src/pages/dashboard/OperationsManagementPage.jsx");
  const router = await read("src/router.jsx");

  assert.match(page, /OperationsManagerPerformanceDashboard/);
  assert.match(page, /useOperationsManagerPerformance/);
  assert.match(router, /path="\/dashboard\/om"/);
});
