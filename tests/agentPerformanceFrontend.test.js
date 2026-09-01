import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

async function read(relativePath) {
  return fs.readFile(path.join(root, relativePath), "utf8");
}

test("Agent performance API bridge uses server-derived self endpoint", async () => {
  const source = await read("src/lib/axios/us-visa-performance.js");

  assert.match(source, /\/us-visa\/performance\/me/);
  assert.doesNotMatch(source, /employeeUid/);
  assert.doesNotMatch(source, /agentUid/);
});

test("Agent performance hook sends date and grouping filters but no employee selector", async () => {
  const source = await read("src/hooks/useAgentPerformance.js");

  assert.match(source, /period/);
  assert.match(source, /referenceDate/);
  assert.match(source, /from/);
  assert.match(source, /to/);
  assert.match(source, /groupBy:\s*"skill"/);
  assert.doesNotMatch(source, /employeeUid/);
  assert.doesNotMatch(source, /agentUid/);
});

test("Agent dashboard displays unavailable values as N/A and does not expose employee selection", async () => {
  const source = await read("src/components/agent/AgentPerformanceDashboard.jsx");

  assert.match(source, /return "N\/A"/);
  assert.match(source, /My Performance/);
  assert.match(source, /Trend by Reporting Period/);
  assert.match(source, /Calls by Skill/);
  assert.doesNotMatch(source, /employeeUid/);
  assert.doesNotMatch(source, /agentUid/);
});

test("existing Agent route renders the Agent performance dashboard", async () => {
  const page = await read("src/pages/dashboard/AgentsPage.jsx");
  const router = await read("src/router.jsx");

  assert.match(page, /AgentPerformanceDashboard/);
  assert.match(page, /useAgentPerformance/);
  assert.match(router, /path="\/dashboard\/agent"/);
  assert.match(router, /path="\/dashboard\/wfm"/);
});
