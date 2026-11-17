import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import test from "node:test";

const root = process.cwd();

async function read(relativePath) {
  return fs.readFile(path.join(root, relativePath), "utf8");
}

test("Architectural Isolation: Original report pages are strictly preserved without AI modifications", async () => {
  const protectedPages = [
    "src/pages/graphs/ViewGraphsPage.jsx",
    "src/pages/employeeMasterData/EmployeeMasterDataPage.jsx",
    "src/pages/workForceManagement/StaffingRequirementsPage.jsx",
    "src/pages/occupancy/OccupancyPage.jsx",
    "src/pages/attendanceSheet/AttendanceSheetPage.jsx",
    "src/pages/callsReport/CallsReportPage.jsx",
    "src/pages/chatReports/ChatReportsPage.jsx",
  ];

  for (const pagePath of protectedPages) {
    const content = await read(pagePath);
    assert.doesNotMatch(
      content,
      /modules\/ai-report/,
      `${pagePath} must not import from ai-report module`,
    );
    assert.doesNotMatch(
      content,
      /AiReportContext/,
      `${pagePath} must not import or depend on AiReportContext`,
    );
    assert.doesNotMatch(
      content,
      /AiReportWrapper/,
      `${pagePath} must not import or depend on AiReportWrapper`,
    );
  }
});

test("Architectural Isolation: router.jsx maps AI routes to dedicated AI module pages while preserving original routes", async () => {
  const routerSource = await read("src/router.jsx");

  // AI routes must use AI module components
  assert.match(routerSource, /import AIWowReportPage from "\.\/modules\/ai-report\/pages\/wow\/AIWowReportPage";/);
  assert.match(routerSource, /import AIEmployeeLedgerPage from "\.\/modules\/ai-report\/pages\/workforce\/AIEmployeeLedgerPage";/);
  assert.match(routerSource, /import AIStaffingRequirementsPage from "\.\/modules\/ai-report\/pages\/workforce\/AIStaffingRequirementsPage";/);
  assert.match(routerSource, /import AIOccupancyPage from "\.\/modules\/ai-report\/pages\/operations\/AIOccupancyPage";/);
  assert.match(routerSource, /import AIAttendancePage from "\.\/modules\/ai-report\/pages\/operations\/AIAttendancePage";/);
  assert.match(routerSource, /import AICallsReportPage from "\.\/modules\/ai-report\/pages\/operations\/AICallsReportPage";/);
  assert.match(routerSource, /import AIChatReportsPage from "\.\/modules\/ai-report\/pages\/operations\/AIChatReportsPage";/);

  // Original routes must still point to original pages
  assert.match(routerSource, /path="\/view-graphs"[\s\S]*?<ViewGraphsPage \/>/);
  assert.match(routerSource, /path="\/employee-master-data"[\s\S]*?<EmployeeMasterDataPage \/>/);
  assert.match(routerSource, /path="\/staffing-requirements"[\s\S]*?<StaffingRequirementsPage \/>/);
  assert.match(routerSource, /path="\/occupancy"[\s\S]*?<OccupancyPage \/>/);
  assert.match(routerSource, /path="\/attendance-sheet"[\s\S]*?<AttendanceSheetPage \/>/);
  assert.match(routerSource, /path="\/calls-report"[\s\S]*?<CallsReportPage \/>/);
  assert.match(routerSource, /path="\/chat-reports"[\s\S]*?<ChatReportsPage \/>/);
});

test("Architectural Isolation: AI Report adapters enforce Read-Only access and do not expose mutations", async () => {
  const workforceAdapter = await read("src/modules/ai-report/adapters/workforceDataAdapter.js");

  // Must not expose mutation methods
  assert.doesNotMatch(workforceAdapter, /importUsVisaEmployeeLedger/);
  assert.doesNotMatch(workforceAdapter, /updateEmployeeLedgerRecord/);
  assert.doesNotMatch(workforceAdapter, /saveStaffingRequirements/);
  assert.doesNotMatch(workforceAdapter, /deleteStaffingRequirements/);

  // Must provide read-only fetchers
  assert.match(workforceAdapter, /export async function fetchAiEmployeeLedger/);
  assert.match(workforceAdapter, /export async function fetchAiStaffingRequirements/);
  assert.match(workforceAdapter, /export async function fetchAiStaffingDailyCoverage/);

  const wowAdapter = await read("src/modules/ai-report/adapters/wowDataAdapter.js");
  assert.match(wowAdapter, /export async function fetchAiCallKpis/);
  assert.match(wowAdapter, /export async function fetchAiEmailKpis/);
  assert.match(wowAdapter, /export async function fetchAiQualityAuditKpis/);
  assert.match(wowAdapter, /export async function fetchAiOccupancyKpis/);

  const opsAdapter = await read("src/modules/ai-report/adapters/operationsDataAdapter.js");
  assert.match(opsAdapter, /export async function fetchAiOccupancyData/);
  assert.match(opsAdapter, /export async function fetchAiAttendanceSheet/);
  assert.match(opsAdapter, /export async function fetchAiCallsReport/);
  assert.match(opsAdapter, /export async function fetchAiChatReport/);
});

test("Architectural Isolation: AI CSS is strictly namespaced", async () => {
  const css = await read("src/modules/ai-report/styles/ai-report.css");
  const rules = css
    .split("}")
    .map((r) => r.trim())
    .filter((r) => r.length > 0 && !r.startsWith("/*") && !r.startsWith("*"));

  for (const rule of rules) {
    const selector = rule.split("{")[0].trim();
    if (selector && !selector.startsWith("@") && !selector.startsWith("/*")) {
      assert.ok(
        selector.includes(".ai-report") || selector.includes("[data-ai-report"),
        `CSS rule selector "${selector}" must be scoped to .ai-report or data-ai-report`,
      );
    }
  }
});

test("Architectural Isolation: Future Hermes integration contract is defined inside AI module", async () => {
  const { AI_BACKEND_CONTRACT, AI_REPORT_VERSION, getAiReportMetadata } = await import(
    "../src/modules/ai-report/services/aiReportService.js"
  );

  assert.equal(AI_BACKEND_CONTRACT.BASE_URL, "/api/ai-report");
  assert.equal(AI_BACKEND_CONTRACT.ENDPOINTS.INSIGHTS, "/api/ai-report/insights");
  assert.equal(AI_BACKEND_CONTRACT.ENDPOINTS.POLICY_EVALUATION, "/api/ai-report/policies/evaluate");
  assert.equal(AI_BACKEND_CONTRACT.ENDPOINTS.POLICY_RULES, "/api/ai-report/policies/rules");

  const meta = getAiReportMetadata("wow-report", "WoW Report");
  assert.equal(meta.module, "ai-report");
  assert.equal(meta.hermesReady, true);
});
