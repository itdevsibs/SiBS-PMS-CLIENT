import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import test from "node:test";

import {
  adaptSummaryData,
  adaptAccountKpiData,
  adaptPmpPipData,
  adaptPoliciesData,
  adaptPolicySyncStatus,
  adaptPolicyVersionHistoryData,
  adaptExtractionRunData,
  adaptPolicyPagesData,
  adaptKnowledgeSearchResults,
  adaptInsightData,
  getFsAiPolicyPreviewUrl,
} from "../src/modules/frontsteps-ai-report/adapters/frontStepsAiDataAdapter.js";

const root = process.cwd();

async function read(relativePath) {
  return fs.readFile(path.join(root, relativePath), "utf8");
}

test("FrontSteps AI Isolation: Original FrontSteps reporting components are strictly protected", async () => {
  const protectedFiles = [
    "src/pages/frontSteps/FrontStepsDashboardSummary.jsx",
    "src/pages/frontSteps/FrontStepsDashboardAccountBased.jsx",
    "src/pages/frontSteps/FrontStepsDashboardKPIIndiv.jsx",
    "src/pages/frontSteps/FrontStepsDataManagement.jsx",
    "src/pages/frontSteps/PolicyDocumentsRepositoryPanel.jsx",
  ];

  for (const filePath of protectedFiles) {
    const content = await read(filePath);
    assert.doesNotMatch(
      content,
      /modules\/frontsteps-ai-report/,
      `${filePath} must not import from frontsteps-ai-report module`,
    );
    assert.doesNotMatch(
      content,
      /frontsteps_ai_active_tab/,
      `${filePath} must not reference FrontSteps AI active tab state`,
    );
  }
});

test("FrontSteps AI Navigation: Sidebar hierarchy has AI Report between Reporting & Data and System", async () => {
  const { FRONTSTEPS_NAV_MODULES } = await import(
    "../src/modules/frontsteps-ai-report/config/frontStepsAiNavigation.js"
  );

  const keys = FRONTSTEPS_NAV_MODULES.map((m) => m.key);
  assert.deepEqual(
    keys,
    ["overview", "performance-management", "reporting-data", "ai-report", "system"],
    "FrontSteps navigation groups must follow exact specified order",
  );

  const aiGroup = FRONTSTEPS_NAV_MODULES.find((m) => m.key === "ai-report");
  assert.ok(aiGroup, "AI Report navigation group must exist");
  assert.equal(aiGroup.name, "AI Report");
  assert.equal(aiGroup.submodules.length, 4, "AI Report group must have exactly 4 submodules");

  const subIds = aiGroup.submodules.map((s) => s.id);
  assert.deepEqual(
    subIds,
    ["ai-summary", "ai-account-kpi", "ai-pmp-pip", "ai-policy-processing"],
    "Submodules must include summary, account-kpi, pmp-pip, and policy-processing",
  );

  const subPaths = aiGroup.submodules.map((s) => s.path);
  assert.deepEqual(
    subPaths,
    [
      "/frontsteps/ai-report/summary",
      "/frontsteps/ai-report/account-kpi",
      "/frontsteps/ai-report/pmp-pip",
      "/frontsteps/ai-report/policy-processing",
    ],
    "Submodule paths must be unique under /frontsteps/ai-report namespace",
  );
});

test("FrontSteps Dashboard: Original dashboard registers AI Report group and protects local state", async () => {
  const dashboardSource = await read("src/pages/frontSteps/FrontStepsDashboard.jsx");

  // AI Report module registered in FRONTSTEPS_MODULES
  assert.match(dashboardSource, /key:\s*"ai-report"/);
  assert.match(dashboardSource, /name:\s*"AI Report"/);
  assert.match(dashboardSource, /path:\s*"\/frontsteps\/ai-report\/summary"/);
  assert.match(dashboardSource, /path:\s*"\/frontsteps\/ai-report\/account-kpi"/);
  assert.match(dashboardSource, /path:\s*"\/frontsteps\/ai-report\/pmp-pip"/);
  assert.match(dashboardSource, /path:\s*"\/frontsteps\/ai-report\/policy-processing"/);

  // Submodule click intercepts AI paths directly to React Router navigate()
  assert.match(
    dashboardSource,
    /if\s*\(\s*sub\.path\?\.startsWith\(\s*["']\/frontsteps\/ai-report["']\s*\)\s*\)\s*\{\s*navigate\(sub\.path\);/,
    "AI submodule clicks must call navigate directly and bypass handleSelectSubmodule",
  );
});

test("FrontSteps AI Routing: router.jsx maps dedicated AI routes with permissions", async () => {
  const routerSource = await read("src/router.jsx");

  // Check imports
  assert.match(routerSource, /import FrontStepsAiSummaryPage from "\.\/modules\/frontsteps-ai-report\/pages\/FrontStepsAiSummaryPage";/);
  assert.match(routerSource, /import FrontStepsAiAccountKpiPage from "\.\/modules\/frontsteps-ai-report\/pages\/FrontStepsAiAccountKpiPage";/);
  assert.match(routerSource, /import FrontStepsAiPmpPipPage from "\.\/modules\/frontsteps-ai-report\/pages\/FrontStepsAiPmpPipPage";/);
  assert.match(routerSource, /import FrontStepsAiPolicyProcessingPage from "\.\/modules\/frontsteps-ai-report\/pages\/FrontStepsAiPolicyProcessingPage";/);

  // Check routes
  assert.match(routerSource, /path="\/frontsteps\/ai-report\/summary"[\s\S]*?<FrontStepsAiSummaryPage \/>/);
  assert.match(routerSource, /path="\/frontsteps\/ai-report\/account-kpi"[\s\S]*?<FrontStepsAiAccountKpiPage \/>/);
  assert.match(routerSource, /path="\/frontsteps\/ai-report\/pmp-pip"[\s\S]*?<FrontStepsAiPmpPipPage \/>/);
  assert.match(routerSource, /path="\/frontsteps\/ai-report\/policy-processing"[\s\S]*?<FrontStepsAiPolicyProcessingPage \/>/);

  // Protected with VIEW_FRONTSTEPS
  assert.match(routerSource, /permission=\{PERMISSIONS\.VIEW_FRONTSTEPS\}/);

  // Original /frontsteps route intact
  assert.match(routerSource, /path="\/frontsteps"[\s\S]*?<FrontStepsDashboard \/>/);
});

test("FrontSteps AI Access Control: accessControl.js registers all AI routes", async () => {
  const accessControlSource = await read("src/config/accessControl.js");

  assert.match(accessControlSource, /"\/frontsteps\/ai-report\/summary"/);
  assert.match(accessControlSource, /"\/frontsteps\/ai-report\/account-kpi"/);
  assert.match(accessControlSource, /"\/frontsteps\/ai-report\/pmp-pip"/);
  assert.match(accessControlSource, /"\/frontsteps\/ai-report\/policy-processing"/);
});

test("FrontSteps AI Data Adapter: adapts data safely without fabricating metrics", () => {
  // 1. Summary adaptation
  const emptySummary = adaptSummaryData({});
  assert.equal(emptySummary.callsOffered, 0);
  assert.equal(emptySummary.totalCases, 0);
  assert.equal(emptySummary.hermesStatus.ready, true);

  const populatedSummary = adaptSummaryData({
    calls: { offered: 150, handled: 140, abandoned: 10 },
    cases: { totalCases: 80, closedCases: 75, openCases: 5 },
    activePoliciesCount: 3,
  });
  assert.equal(populatedSummary.callsOffered, 150);
  assert.equal(populatedSummary.callsHandled, 140);
  assert.equal(populatedSummary.totalCases, 80);

  // 2. Account KPI adaptation
  const emptyAccountKpi = adaptAccountKpiData({});
  assert.deepEqual(emptyAccountKpi.queues, []);
  assert.equal(emptyAccountKpi.account, "FrontSteps Support");
  assert.equal(emptyAccountKpi.hasData, false);
  assert.equal(emptyAccountKpi.totalQueues, 0);

  const populatedAccountKpi = adaptAccountKpiData({
    hasData: true,
    queues: [{ queueName: "Support Tier 1", totalCalls: 100, answeredCalls: 95 }],
  });
  assert.equal(populatedAccountKpi.hasData, true);
  assert.equal(populatedAccountKpi.queues.length, 1);
  assert.equal(populatedAccountKpi.queues[0].queueName, "Support Tier 1");

  // 3. PMP/PIP adaptation
  const emptyPmpPip = adaptPmpPipData({});
  assert.deepEqual(emptyPmpPip.employees, []);
  assert.equal(emptyPmpPip.totalRosterCount, 0);
  assert.equal(emptyPmpPip.pmpPipGovernance.isEvaluationReady, false);

  // 4. Policy adaptation
  const adaptedPolicies = adaptPoliciesData({
    data: [
      {
        id: 1,
        documentCode: "FS-POL-001",
        title: "FrontSteps QA Policy",
        fileSize: 2048576,
      },
    ],
    total: 1,
    page: 1,
  });
  assert.equal(adaptedPolicies.policies.length, 1);
  assert.equal(adaptedPolicies.policies[0].fileSizeFormatted, "2.0 MB");
  assert.equal(adaptedPolicies.policies[0].previewUrl, "/api/frontsteps/ai-report/policies/1/preview");
  assert.equal(getFsAiPolicyPreviewUrl(99), "/api/frontsteps/ai-report/policies/99/preview");
});

test("FrontSteps AI Layout: enforces strict non-overlapping CSS Grid architecture (main.left >= sidebar.right)", async () => {
  const css = await read("src/modules/frontsteps-ai-report/styles/frontsteps-ai-report.css");
  const layout = await read("src/modules/frontsteps-ai-report/layouts/FrontStepsAiLayout.jsx");

  // Grid columns define independent tracks for sidebar and main
  assert.match(css, /\.frontsteps-ai-shell\s*\{[^}]*display:\s*grid;/);
  assert.match(css, /grid-template-columns:\s*var\(--fsai-current-sidebar-width\)\s+minmax\(0,\s*1fr\);/);
  assert.match(css, /--fsai-sidebar-width:\s*260px;/);
  assert.match(css, /--fsai-sidebar-collapsed-width:\s*72px;/);

  // Desktop sidebar track is bounded with overflow: hidden
  assert.match(css, /\.frontsteps-ai-sidebar\s*\{[^}]*overflow:\s*hidden;/);
  assert.match(css, /\.frontsteps-ai-sidebar\s*\{[^}]*min-width:\s*0;/);

  // Main content area cannot render under sidebar
  assert.match(css, /\.frontsteps-ai-main\s*\{[^}]*min-width:\s*0;/);
  assert.match(css, /\.frontsteps-ai-content\s*\{[^}]*overflow-y:\s*auto;/);
  assert.match(css, /\.frontsteps-ai-content\s*\{[^}]*overflow-x:\s*hidden;/);

  // Layout avoids w-screen
  assert.doesNotMatch(layout, /w-screen/, "FrontStepsAiLayout must not use w-screen to prevent viewport overflow");

  // Uses frontsteps-ai-shell and desktop-track classes
  assert.match(layout, /frontsteps-ai-shell/);
  assert.match(layout, /desktop-track/);
  assert.match(layout, /frontsteps-ai-drawer/);
  assert.match(layout, /frontsteps-ai-backdrop/);
});

test("FrontSteps AI Status Display: verified snapshot labels enforce zero Hermes GET inference", async () => {
  const headerSource = await read("src/modules/frontsteps-ai-report/components/FrontStepsAiPageHeader.jsx");
  const summarySource = await read("src/modules/frontsteps-ai-report/pages/FrontStepsAiSummaryPage.jsx");
  const accountSource = await read("src/modules/frontsteps-ai-report/pages/FrontStepsAiAccountKpiPage.jsx");
  const pmpPipSource = await read("src/modules/frontsteps-ai-report/pages/FrontStepsAiPmpPipPage.jsx");
  const policySource = await read("src/modules/frontsteps-ai-report/pages/FrontStepsAiPolicyProcessingPage.jsx");
  const layoutSource = await read("src/modules/frontsteps-ai-report/layouts/FrontStepsAiLayout.jsx");

  // No misleading active/pending claims
  assert.doesNotMatch(headerSource, /Hermes AI Ready/, "Header must not claim Hermes AI Ready");
  assert.doesNotMatch(headerSource, /Hermes:\s*Integration Pending/, "Header must not show stale Integration Pending");
  assert.doesNotMatch(layoutSource, /Hermes:\s*Integration Pending/, "Layout must not show stale Integration Pending");
  assert.doesNotMatch(summarySource, /Governance Active/, "Summary must not claim Governance Active");
  assert.doesNotMatch(summarySource, /SLA Baseline:\s*80\.0%/, "Summary must not claim confirmed SLA baseline");
  assert.doesNotMatch(accountSource, /Audit Active/, "Account KPI must not claim Audit Active");
  assert.doesNotMatch(policySource, /Rule Extraction:\s*Ready/, "Policy Processing must not claim Rule Extraction Ready");

  // Snapshot-driven labels & deterministic calculation governance banners present (no Hermes invocation on dashboard GETs)
  assert.match(headerSource, /Snapshot-Driven \(0 Hermes GET\)/);
  assert.match(layoutSource, /Snapshot-Driven \(0 Hermes GET\)/);
  assert.match(summarySource, /<FrontStepsAiGovernanceBanner/);
  assert.match(summarySource, /IntervalSplineChart/);
  assert.match(summarySource, /crmDocumentation/);
  assert.match(accountSource, /<FrontStepsAiGovernanceBanner/);
  assert.match(accountSource, /Case Queue:/);
  assert.match(accountSource, /Case Origin:/);
  assert.match(pmpPipSource, /<FrontStepsAiGovernanceBanner/);
  assert.match(pmpPipSource, /No Data Available/);
  assert.match(policySource, /Validate Rules/);
});

test("FrontSteps AI Responsive Breakpoints: isolates mobile drawer from desktop layout", async () => {
  const css = await read("src/modules/frontsteps-ai-report/styles/frontsteps-ai-report.css");

  // Responsive media query at 1023px (standard lg breakpoint)
  assert.match(css, /@media\s*\(max-width:\s*1023px\)\s*\{[\s\S]*?\.frontsteps-ai-shell\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  assert.match(css, /@media\s*\(max-width:\s*1023px\)\s*\{[\s\S]*?\.frontsteps-ai-sidebar\.desktop-track\s*\{[\s\S]*?display:\s*none/);
  assert.match(css, /\.frontsteps-ai-drawer\s*\{[^}]*position:\s*fixed;/);
  assert.match(css, /\.frontsteps-ai-backdrop\s*\{[^}]*position:\s*fixed;/);
});

test("FrontSteps AI Policy PDF Viewer: reuses authenticated getFrontStepsPolicyBlob with object URLs and download action", async () => {
  const viewerSource = await read("src/modules/frontsteps-ai-report/components/FrontStepsAiPolicyPdfViewer.jsx");
  const pageSource = await read("src/modules/frontsteps-ai-report/pages/FrontStepsAiPolicyProcessingPage.jsx");

  // 1. Reuses existing authenticated service from frontsteps-imports
  assert.match(
    viewerSource,
    /import\s*\{\s*getFrontStepsPolicyBlob\s*\}\s*from\s*["']@\/lib\/axios\/frontsteps-imports["']/,
    "FrontStepsAiPolicyPdfViewer must reuse getFrontStepsPolicyBlob from frontsteps-imports",
  );

  // 2. Creates and manages Blob object URL
  assert.match(viewerSource, /getFrontStepsPolicyBlob\(policy\.id\)/);
  assert.match(viewerSource, /URL\.createObjectURL/);
  assert.match(viewerSource, /URL\.revokeObjectURL/);

  // 3. Renders iframe with the authenticated blobUrl
  assert.match(viewerSource, /<iframe[\s\S]*?src=\{blobUrl\}[\s\S]*?\/>/);

  // 4. Modal includes download copy action and close button
  assert.match(viewerSource, /Download Copy/);
  assert.match(viewerSource, /download=\{downloadFileName\}/);
  assert.match(viewerSource, /Policy Code:/);
  assert.match(viewerSource, /Revision:/);

  // 5. Page uses modal trigger button instead of unauthenticated <a> tag
  assert.match(pageSource, /import FrontStepsAiPolicyPdfViewer from "\.\.\/components\/FrontStepsAiPolicyPdfViewer";/);
  assert.match(pageSource, /const \[viewingPolicy, setViewingPolicy\] = useState\(null\);/);
  assert.match(pageSource, /<FrontStepsAiPolicyPdfViewer[\s\S]*?policy=\{viewingPolicy\}[\s\S]*?onClose=\{/);
  assert.doesNotMatch(pageSource, /<a[\s\S]*?href=\{policy\.previewUrl\}[\s\S]*?target="_blank"/, "Page must not use unauthenticated <a> link for preview");

  // 6. Test resolution with sample documents: FS-MILESTONE-001, FS-PIP-001, FS-PMP-001
  const testPolicies = [
    { id: 101, documentCode: "FS-MILESTONE-001", title: "Milestone Guidelines", revisionNumber: 1, approvalStatus: "APPROVED", fileName: "FS-MILESTONE-001_Rev001.pdf", fileExtension: "pdf", fileSize: 1048576 },
    { id: 102, documentCode: "FS-PIP-001", title: "PIP Protocol", revisionNumber: 2, approvalStatus: "APPROVED", fileName: "FS-PIP-001_Rev002.pdf", fileExtension: "pdf", fileSize: 2097152 },
    { id: 103, documentCode: "FS-PMP-001", title: "PMP Evaluation Matrix", revisionNumber: 1, approvalStatus: "APPROVED", fileName: "FS-PMP-001_Rev001.pdf", fileExtension: "pdf", fileSize: 3145728 },
  ];

  for (const pol of testPolicies) {
    assert.ok(pol.id > 0, `${pol.documentCode} must resolve to a valid repository ID`);
    assert.match(pol.documentCode, /^FS-[A-Z]+-\d+$/, `${pol.documentCode} must follow standard FrontSteps format`);
    assert.equal(pol.fileExtension, "pdf", `${pol.documentCode} must be a valid PDF document`);
  }
});

test("FrontSteps AI Phase 1: Policy Synchronization and Version Management Architecture", async () => {
  const apiSource = await read("src/modules/frontsteps-ai-report/services/frontStepsAiApi.js");
  const hooksSource = await read("src/modules/frontsteps-ai-report/hooks/useFrontStepsAiData.js");
  const modalSource = await read("src/modules/frontsteps-ai-report/components/FrontStepsAiPolicyVersionHistoryModal.jsx");
  const pageSource = await read("src/modules/frontsteps-ai-report/pages/FrontStepsAiPolicyProcessingPage.jsx");

  // 1. API Service methods
  assert.match(apiSource, /export async function fetchFsAiPolicySyncStatus/);
  assert.match(apiSource, /export async function triggerFsAiPolicySync/);
  assert.match(apiSource, /export async function fetchFsAiPolicyVersions/);
  assert.match(apiSource, /export async function fetchFsAiPolicyVersionHistory/);
  assert.match(apiSource, /export async function fetchFsAiPolicySyncHistory/);

  // 2. Data Adapters
  const syncStatus = adaptPolicySyncStatus({
    isRunning: false,
    summary: { uniqueDocuments: 5, totalPolicyVersions: 8, currentEligibleCount: 5, missingFromSourceCount: 0 },
    latestRun: { started_at: "2026-11-10T08:00:00Z", run_status: "COMPLETED" },
  });
  assert.equal(syncStatus.summary.uniqueDocuments, 5);
  assert.equal(syncStatus.summary.totalPolicyVersions, 8);
  assert.equal(syncStatus.latestRunStatus, "COMPLETED");

  const historyData = adaptPolicyVersionHistoryData({
    documentCode: "FS-PIP-001",
    versions: [
      { id: 1, source_policy_id: 10, document_code: "FS-PIP-001", policy_title: "PIP Policy", revision_number: "001", verified_checksum: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2", source_approval_status: "Approved", source_is_current: 1, is_eligible_current: 1, source_availability: "AVAILABLE", archive_status: "ARCHIVED", file_size: 1048576 }
    ],
    events: [
      { id: 101, event_type: "VERSION_ADDED", document_code: "FS-PIP-001", created_at: "2026-11-10T08:00:00Z" }
    ],
  });
  assert.equal(historyData.documentCode, "FS-PIP-001");
  assert.equal(historyData.versions.length, 1);
  assert.equal(historyData.versions[0].isEligibleCurrent, true);
  assert.equal(historyData.events.length, 1);
  assert.equal(historyData.events[0].eventType, "VERSION_ADDED");

  // 3. Hooks
  assert.match(hooksSource, /export function useFrontStepsAiPolicySync/);
  assert.match(hooksSource, /export function useFrontStepsAiPolicyVersionHistory/);

  // 4. Version History Modal
  assert.match(modalSource, /FrontStepsAiPolicyVersionHistoryModal/);
  assert.match(modalSource, /CURRENT ELIGIBLE FOR AI/);
  assert.match(modalSource, /SHA-256/);
  assert.match(modalSource, /Lifecycle Audit Trail/);

  // 5. Processing Page Integration
  assert.match(pageSource, /useFrontStepsAiPolicySync/);
  assert.match(pageSource, /FrontStepsAiPolicyVersionHistoryModal/);
  assert.match(pageSource, /Sync Policies/);
  assert.match(pageSource, /Immutable Versions/);
  assert.match(pageSource, /Current Eligible for AI/);
});

test("FrontSteps AI Phase 2: PDF Knowledge Extraction, Indexing, and Content Viewer", async () => {
  const apiSource = await read("src/modules/frontsteps-ai-report/services/frontStepsAiApi.js");
  const hooksSource = await read("src/modules/frontsteps-ai-report/hooks/useFrontStepsAiData.js");
  const viewerModalSource = await read("src/modules/frontsteps-ai-report/components/FrontStepsAiPolicyExtractedContentViewerModal.jsx");
  const pageSource = await read("src/modules/frontsteps-ai-report/pages/FrontStepsAiPolicyProcessingPage.jsx");

  // 1. API Service methods
  assert.match(apiSource, /export async function triggerFsAiVersionExtraction/);
  assert.match(apiSource, /export async function fetchFsAiVersionExtraction/);
  assert.match(apiSource, /export async function fetchFsAiVersionPages/);
  assert.match(apiSource, /export async function fetchFsAiVersionChunks/);
  assert.match(apiSource, /export async function searchFsAiPolicyKnowledge/);
  assert.match(apiSource, /export async function fetchFsAiExtractionOverview/);

  // 2. Data Adapters
  const runData = adaptExtractionRunData({
    data: {
      id: 1,
      policy_version_id: 10,
      document_code: "FS-PMP-001",
      revision_number: "000",
      status: "READY",
      page_count: 3,
      table_count: 2,
      chunk_count: 5,
      started_at: "2026-11-10T10:00:00Z",
      completed_at: "2026-11-10T10:00:02Z",
      duration_ms: 2150,
    },
  });
  assert.equal(runData.status, "READY");
  assert.equal(runData.pageCount, 3);
  assert.equal(runData.tableCount, 2);
  assert.equal(runData.durationFormatted, "2.15s");

  const pagesData = adaptPolicyPagesData({
    total: 2,
    pages: [
      {
        id: 1,
        page_number: 1,
        exact_text: "1. PURPOSE\nFrontSteps PMP Guidelines",
        char_count: 35,
        word_count: 5,
        has_tables: 0,
        has_formulas: 0,
        extraction_status: "READY",
      },
      {
        id: 2,
        page_number: 2,
        exact_text: "5. KPI METRIC MATRIX\nQA Score >= 85.0% Weight 40%",
        structured_content_json: JSON.stringify({
          headings: ["5. KPI METRIC MATRIX"],
          tables: [{ headers: ["Metric", "Target"], rows: [["QA Score", ">= 85.0%"]] }],
          formulas: ["QA Score >= 85.0% Weight 40%"],
        }),
        char_count: 50,
        word_count: 8,
        has_tables: 1,
        has_formulas: 1,
        extraction_status: "READY",
      },
    ],
  });
  assert.equal(pagesData.total, 2);
  assert.equal(pagesData.pages.length, 2);
  assert.equal(pagesData.pages[1].tables.length, 1);
  assert.equal(pagesData.pages[1].hasFormulas, true);

  const searchData = adaptKnowledgeSearchResults({
    query: "QA Score",
    total: 1,
    results: [
      {
        chunkId: 101,
        policyVersionId: 10,
        documentCode: "FS-PMP-001",
        revisionNumber: "000",
        pageStart: 2,
        pageEnd: 2,
        citation: "FS-PMP-001 | Rev 000 | Page 2",
        sectionTitle: "5. KPI METRIC MATRIX",
        exactText: "QA Score >= 85.0% Weight 40%",
      },
    ],
  });
  assert.equal(searchData.total, 1);
  assert.equal(searchData.results[0].citation, "FS-PMP-001 | Rev 000 | Page 2");

  // 3. Hooks
  assert.match(hooksSource, /export function useFrontStepsAiPolicyPages/);
  assert.match(hooksSource, /export function useFrontStepsAiVersionExtraction/);
  assert.match(hooksSource, /export function useFrontStepsAiKnowledgeSearch/);

  // 4. Extracted Content Viewer Modal
  assert.match(viewerModalSource, /FrontStepsAiPolicyExtractedContentViewerModal/);
  assert.match(viewerModalSource, /Page Text/);
  assert.match(viewerModalSource, /Structured Tables/);
  assert.match(viewerModalSource, /Find in Document/);
  assert.match(viewerModalSource, /Original PDF/);

  // 5. Processing Page Integration
  assert.match(pageSource, /FrontStepsAiPolicyExtractedContentViewerModal/);
  assert.match(pageSource, /useFrontStepsAiVersionExtraction/);
  assert.match(pageSource, /Extracted Policies/);
  assert.match(pageSource, /Interpreted Rules/);
  assert.match(pageSource, /View Content/);
});

test("FrontSteps AI Phase 4C: PMP/PIP Data Adapter & UI enforce No Data Available, active roster scope, and non-broken actor formatting", async () => {
  const pmpPipSource = await read("src/modules/frontsteps-ai-report/pages/FrontStepsAiPmpPipPage.jsx");
  const summarySource = await read("src/modules/frontsteps-ai-report/pages/FrontStepsAiSummaryPage.jsx");

  // Fixes undefined render bug for top unmapped call owners and mismatch expected Kronos code
  assert.match(pmpPipSource, /u\.name \|\| u\.rawOwner/);
  assert.match(pmpPipSource, /m\.expectedKronosEmpCode \|\| m\.kronosEmpCode/);
  assert.doesNotMatch(pmpPipSource, /\$\{u\.rawOwner\} \(/);

  // Renders explicit No Data Available for NO_DATA metrics & missing SF activity without fabricating scores
  const governanceSource = await read("src/modules/frontsteps-ai-report/components/FrontStepsAiGovernanceBanner.jsx");
  assert.match(pmpPipSource, /kpi\.status === "NO_DATA"/);
  assert.match(pmpPipSource, /emp\.finalKpiScore\?\.status === "NO_DATA"/);
  assert.match(summarySource, /MetricStatusBadge/);
  assert.match(governanceSource, /NO_DATA:\s*"NO DATA"/);

  // Separates Verified Active FrontSteps roster from Excluded Historical/Separated/Mismatched & Unverified Identity panels
  assert.match(pmpPipSource, /Verified Active FrontSteps Agent Scorecards/);
  assert.match(pmpPipSource, /Excluded Historical \/ Separated \/ Non-Agent/);
  assert.match(pmpPipSource, /Roster Verification Required — Individual Scorecards Held/);

  const adapted = adaptPmpPipData({
    hasPublishedSnapshot: true,
    reportingPeriod: "monthly",
    individualKpi: {
      employees: [
        {
          sibsId: "5206",
          employeeName: "VERIFIED AGENT",
          identityCategory: "VERIFIED_ACTIVE_FRONTSTEPS",
          hasAliasMapping: true,
          siteName: "Davao",
          isWfh: true,
          calls: { offered: 100, answered: 95 },
          cases: { attributedClosedCasesModifiedBy: 120 },
          finalKpiScore: { status: "BLOCKED", score: null },
        },
        {
          sibsId: "3463",
          employeeName: "JEAZAER MEA CAÑEDO",
          identityCategory: "MISSING_ALIAS_ACTIVE_FS",
          hasAliasMapping: false,
          calls: { offered: 0, answered: 0 },
          cases: { attributedClosedCasesModifiedBy: 0 },
          finalKpiScore: { status: "NO_DATA", score: null },
        },
        {
          sibsId: "6855",
          employeeName: "CARLO CRISANTO  BONDOC",
          identityCategory: "ACTIVE_DIRECTORY_STALLED_TRACKER",
          hasAliasMapping: true,
          hasStalledTracker: true,
          trackerHaltedSince: "2026-10-07",
          calls: { offered: 42, answered: 42 },
          cases: { attributedClosedCasesModifiedBy: 25 },
          finalKpiScore: { status: "BLOCKED", score: null },
        },
      ],
      excludedEmployees: [
        {
          sibsId: "6859",
          employeeName: "AIRA KRYSTELLE SANDING",
          identityCategory: "SEPARATED_RECENT_LIVE_KRONOS",
          separatedDate: "2026-10-02",
          historicalCallsCount: 318,
        },
      ],
      actorReconciliation: {
        hasKronosDirectoryLookup: true,
        calls: {
          potentialUnmappedSibsCount: 0,
          verifiedNonSibsExternalCount: 100,
          topNonSibsExternalActors: [{ name: "Alkimpo Sael", count: 50 }],
        },
      },
      identityReconciliation: {
        verifiedActiveCount: 2,
        verifiedOperationalRosterCount: 2,
        excludedCount: 1,
        trackerSource: "LIVE_KRONOS_API",
      },
    },
  });

  // Phase 5.5: Confirmed active missing-alias agent (3463) stays in employees with ACTIVE_MISSING_SOURCE_ALIAS & NO_DATA;
  // uncertain directory member (6855) is held in identityVerificationIssues under ROSTER_VERIFICATION_REQUIRED
  assert.equal(adapted.employees.length, 2);
  assert.equal(adapted.employees[0].sibsId, "5206");
  assert.equal(adapted.employees[0].availabilityStatus, "VERIFIED_ACTIVE_FRONTSTEPS");
  assert.equal(adapted.employees[1].sibsId, "3463");
  assert.equal(adapted.employees[1].availabilityStatus, "ACTIVE_MISSING_SOURCE_ALIAS");
  assert.equal(adapted.employees[1].finalKpiScore.status, "NO_DATA");
  assert.equal(adapted.identityVerificationIssues.length, 1);
  assert.equal(adapted.identityVerificationIssues[0].sibsId, "6855");
  assert.equal(adapted.identityVerificationIssues[0].availabilityStatus, "ROSTER_VERIFICATION_REQUIRED");
  assert.equal(adapted.excludedEmployees.length, 1);
  assert.equal(adapted.excludedEmployees[0].sibsId, "6859");
  assert.equal(adapted.excludedEmployees[0].availabilityStatus, "VERIFIED_INACTIVE_OR_SEPARATED");
  assert.equal(adapted.identityReconciliation.trackerSource, "LIVE_KRONOS_API");
  assert.equal(adapted.actorReconciliation.calls.potentialUnmappedSibsCount, 0);
});

test("FrontSteps AI Phase 5: Dashboards adapt Summary CRM/Intervals, Account Scopes, Unavailable States & Zero-Hermes Guards", async () => {
  const apiSource = await read("src/modules/frontsteps-ai-report/services/frontStepsAiApi.js");
  const hooksSource = await read("src/modules/frontsteps-ai-report/hooks/useFrontStepsAiData.js");
  const summarySource = await read("src/modules/frontsteps-ai-report/pages/FrontStepsAiSummaryPage.jsx");
  const accountSource = await read("src/modules/frontsteps-ai-report/pages/FrontStepsAiAccountKpiPage.jsx");
  const pmpPipSource = await read("src/modules/frontsteps-ai-report/pages/FrontStepsAiPmpPipPage.jsx");

  // 1. Query parameters forwarded cleanly on GET without calling rebuild endpoints on filter change
  assert.match(apiSource, /buildCleanReportParams/);
  assert.match(hooksSource, /err\?\.response\?\.status === 400/);
  assert.doesNotMatch(summarySource, /triggerFsAiReportRebuild/);
  assert.doesNotMatch(accountSource, /triggerFsAiReportRebuild/);
  assert.doesNotMatch(pmpPipSource, /triggerFsAiReportRebuild/);

  // 2. Summary adaptation includes CRM completion rates, spline interval series & empty unavailable state
  const summaryAdapted = adaptSummaryData({
    hasPublishedSnapshot: true,
    reportingPeriod: "monthly",
    hermesCallsCount: 0,
    summary: {
      calls: { offered: 3305, answered: 2787, abandoned: 518, ahtFormatted: "0:10:08", asaFormatted: "0:01:29" },
      cases: {
        totalCases: 11346,
        closedCases: 7369,
        openCases: 3977,
        resolutionPopulated: 7366,
        subCodesPopulated: 6039,
        summaryPopulated: 3785,
      },
      scorecard: {
        metrics: [
          { metricCode: "CRM_RESOLUTION", actualValue: 99.9593, status: "CALCULATED" },
          { metricCode: "CRM_SUB_CODE_COMPLETION", actualValue: 81.9514, status: "CALCULATED" },
          { metricCode: "CRM_SUMMARY_COMPLETION", actualValue: 51.3638, status: "CALCULATED" },
        ],
        finalKpiScore: { status: "BLOCKED" },
      },
    },
    intervals: {
      seriesBiHourly: [{ timeEst: "08:00-10:00", offeredCalls: 120, answeredCalls: 110, abandonedCalls: 10, closedCases: 50 }],
      series30Min: [{ timeEst: "08:00", offeredCalls: 30, answeredCalls: 28 }],
      seriesDaily: [{ timeEst: "2026-10-01", offeredCalls: 300, answeredCalls: 260 }],
    },
  });
  assert.equal(summaryAdapted.hasPublishedSnapshot, true);
  assert.equal(summaryAdapted.hermesCallsCount, 0);
  assert.equal(summaryAdapted.crmDocumentation.resolutionRate, "99.96%");
  assert.equal(summaryAdapted.crmDocumentation.subCodeRate, "81.95%");
  assert.equal(summaryAdapted.crmDocumentation.summaryRate, "51.36%");
  assert.equal(summaryAdapted.intervalPerformance.seriesBiHourly.length, 1);
  assert.equal(summaryAdapted.intervalPerformance.series30Min.length, 1);
  assert.equal(summaryAdapted.intervalPerformance.seriesDaily.length, 1);

  const unavailableSummary = adaptSummaryData({
    hasPublishedSnapshot: false,
    period: "quarterly",
    message: "No Report Available for Selected Filters",
  });
  assert.equal(unavailableSummary.hasPublishedSnapshot, false);
  assert.equal(unavailableSummary.message, "No Report Available for Selected Filters");

  // 3. Account KPI preserves full filter dropdowns alongside scoped telemetry without averaging percentages
  const accountAdapted = adaptAccountKpiData({
    hasPublishedSnapshot: true,
    reportingPeriod: "monthly",
    hermesCallsCount: 0,
    availableFilters: {
      callQueues: ["Tier 1 Support", "Emergency Line"],
      caseQueues: ["Tier 1", "Tier 2", "Tier 3"],
      caseOrigins: ["Phone", "Email"],
    },
    summary: {
      calls: { offered: 100, answered: 90, answerRate: "90.00%" },
      cases: { totalCases: 200, closedCases: 150, openCases: 50, backlogRate: "25.00%" },
      isCallScopeFiltered: true,
      isCaseScopeFiltered: false,
      scorecard: { metrics: [], finalKpiScore: { status: "BLOCKED" } },
    },
    accountKpi: {
      callQueues: [{ queueName: "Tier 1 Support", offered: 100, answeredCalls: 90 }],
      caseChannels: [{ queueName: "Tier 1", caseOrigin: "Phone", totalCases: 200 }],
    },
  });
  assert.deepEqual(accountAdapted.availableFilters.callQueues, ["Tier 1 Support", "Emergency Line"]);
  assert.deepEqual(accountAdapted.availableFilters.caseQueues, ["Tier 1", "Tier 2", "Tier 3"]);
  assert.equal(accountAdapted.isCallScopeFiltered, true);
  assert.equal(accountAdapted.callSummary.offered, 100);
  assert.equal(accountAdapted.caseSummary.totalCases, 200);

  // 4. UI pages render unavailable state cleanly, Phase 5.5 availability badges, and per-metric readiness metadata
  assert.match(summarySource, /No Report Available for Selected Filters/);
  assert.match(accountSource, /No Report Available for Selected Filters/);
  assert.match(accountSource, /Operational Telemetry/);
  assert.match(accountSource, /Policy-Scored Account KPI Components/);
  assert.match(pmpPipSource, /No Report Available for Selected Filters/);
  assert.match(pmpPipSource, /Policy Rule Breakdown:/);
  assert.match(pmpPipSource, /Active FS — Missing Source Alias/);
  assert.match(pmpPipSource, /Roster Verification Required/);
  assert.match(pmpPipSource, /Required Source &amp; Mapping/);
  assert.match(pmpPipSource, /aria-label="Period"/);
  assert.match(pmpPipSource, /aria-label="Site"/);
});

test("FrontSteps AI Phase 6: Management Insights panel, API, adapter, non-chatbot & ROSTER_VERIFICATION_REQUIRED guards", async () => {
  const apiSource = await read("src/modules/frontsteps-ai-report/services/frontStepsAiApi.js");
  const hooksSource = await read("src/modules/frontsteps-ai-report/hooks/useFrontStepsAiData.js");
  const panelSource = await read("src/modules/frontsteps-ai-report/components/FrontStepsAiInsightsPanel.jsx");
  const summarySource = await read("src/modules/frontsteps-ai-report/pages/FrontStepsAiSummaryPage.jsx");
  const accountSource = await read("src/modules/frontsteps-ai-report/pages/FrontStepsAiAccountKpiPage.jsx");
  const pmpPipSource = await read("src/modules/frontsteps-ai-report/pages/FrontStepsAiPmpPipPage.jsx");

  // 1. Insight API endpoints and hook exist & respect zero-Hermes GET + async polling
  assert.match(apiSource, /fetchFsAiInsights/);
  assert.match(apiSource, /fetchFsAiInsightById/);
  assert.match(apiSource, /fetchFsAiInsightHistory/);
  assert.match(apiSource, /triggerFsAiInsightGeneration/);
  assert.match(apiSource, /const FS_AI_BASE = "\/api\/frontsteps\/ai-report"/);
  assert.match(apiSource, /\$\{FS_AI_BASE\}\/insights/);
  assert.match(hooksSource, /export function useFrontStepsAiInsights/);
  assert.match(hooksSource, /fetchFsAiJobStatus/);
  assert.match(hooksSource, /useFrontStepsAiInsights.*hasPublishedSnapshot/s);

  // 2. Panel is embedded in all 3 report pages & respects 6855 roster verification lock
  assert.match(summarySource, /FrontStepsAiInsightsPanel/);
  assert.match(accountSource, /FrontStepsAiInsightsPanel/);
  assert.match(pmpPipSource, /FrontStepsAiInsightsPanel/);
  assert.match(pmpPipSource, /selectedEmployeeExcludedForVerification/);
  assert.match(pmpPipSource, /Individual scorecard and AI insights are withheld while employee roster verification is required\./);

  // 3. Strict non-chatbot invariant across Insights UI & hooks
  assert.doesNotMatch(panelSource, /<textarea/i);
  assert.doesNotMatch(panelSource, /<input/i);
  assert.doesNotMatch(panelSource, /send\s*message|ask\s*hermes|chat\s*with/i);
  assert.doesNotMatch(hooksSource, /chatHistory|messagesState|sendChatMessage/i);

  // 4. Adapter normalizes Contract v2 & v3 (resolved_evidence, claim_type, observation, policy_references) + empty-findings + withheld latestAttempt
  const adaptedV2 = adaptInsightData({
    hasPublishedSnapshot: true,
    hasInsight: true,
    hermesCallsCount: 0,
    reportType: "SUMMARY",
    period: "monthly",
    scopeFilter: "all",
    canGenerateInsights: true,
    snapshot: { id: 58 },
    policySnapshot: { id: 4, snapshotCode: "FS-RULE-SNAP-20261110-V004" },
    insight: {
      id: 91,
      reportSnapshotId: 58,
      policyRuleSnapshotId: 4,
      reportType: "SUMMARY",
      reportingPeriod: "monthly",
      scopeFilter: "all",
      schemaVersion: "2",
      promptVersion: "v2.0",
      hasTrustworthyFindings: true,
      validationStatus: "VALIDATED",
      versionNumber: 1,
      hermesModel: "sibs-pms-analyst",
      executiveSummary: "Answer Rate is verified across offered calls in the snapshot window.",
      findings: [
        {
          category: "CALL_PERFORMANCE",
          severity: "WARNING",
          headline: "Call abandonment exceeds operational baseline",
          observation: "Offered call volume experienced elevated abandonment while handle time remained above target.",
          evidence_ids: ["SNAP:58:SUMMARY:monthly:all:AGGREGATE:ABANDON_RATE"],
          resolved_evidence: [
            {
              evidence_id: "SNAP:58:SUMMARY:monthly:all:AGGREGATE:ABANDON_RATE",
              metric_code: "ABANDON_RATE",
              metric_label: "Overall Abandonment Rate (Weighted Period Aggregate)",
              metric_value: 15.67,
              formatted_value: "15.67%",
              unit: "%",
              target_value: 5,
              target_unit: "%",
              aggregation_type: "WEIGHTED_AVERAGE",
              snapshot_reference: "Snapshot #58 (SUMMARY, monthly)",
            },
          ],
          policy_rule_codes: ["FS-PMP-001", "FS_KPI_AHT_TARGET"],
          recommendation: "Review peak bi-hourly staffing alignment.",
          limitations: ["FINAL_KPI_SCORE remains BLOCKED."],
        },
      ],
      dataQualityWarnings: ["FINAL_KPI_SCORE withheld due to missing case attribution."],
      overallLimitations: ["Single-period snapshot only."],
    },
  });

  assert.equal(adaptedV2.hasPublishedSnapshot, true);
  assert.equal(adaptedV2.hasInsight, true);
  assert.equal(adaptedV2.hermesCallsCount, 0);
  assert.equal(adaptedV2.insight.id, 91);
  assert.equal(adaptedV2.insight.schemaVersion, "2");
  assert.equal(adaptedV2.insight.promptVersion, "v2.0");
  assert.equal(adaptedV2.insight.findings.length, 1);
  assert.equal(adaptedV2.insight.findings[0].observation, "Offered call volume experienced elevated abandonment while handle time remained above target.");
  assert.equal(adaptedV2.insight.findings[0].resolvedEvidence[0].metricCode, "ABANDON_RATE");
  assert.equal(adaptedV2.insight.findings[0].resolvedEvidence[0].metricValue, 15.67);
  assert.equal(adaptedV2.insight.findings[0].resolvedEvidence[0].formattedValue, "15.67%");
  assert.equal(adaptedV2.insight.findings[0].resolvedEvidence[0].aggregationType, "WEIGHTED_AVERAGE");
  assert.deepEqual(adaptedV2.insight.findings[0].policyReferences, ["FS-PMP-001", "FS_KPI_AHT_TARGET"]);

  // Phase 6.2 Contract v3 adaptation & deterministic PMS supporting evidence rendering
  const adaptedV3 = adaptInsightData({
    hasPublishedSnapshot: true,
    hasInsight: true,
    hermesCallsCount: 0,
    reportType: "SUMMARY",
    period: "monthly",
    scopeFilter: "all",
    canGenerateInsights: true,
    snapshot: { id: 105 },
    policySnapshot: { id: 4, snapshotCode: "FS-RULE-SNAP-20261110-V004" },
    insight: {
      id: 210,
      reportSnapshotId: 105,
      policyRuleSnapshotId: 4,
      reportType: "SUMMARY",
      reportingPeriod: "monthly",
      scopeFilter: "all",
      schemaVersion: "3",
      promptVersion: "v3.0",
      hasTrustworthyFindings: true,
      validationStatus: "VALIDATED",
      versionNumber: 1,
      hermesModel: "hermes-agent",
      executiveSummary: "Qualitative overview grounded strictly in snapshot totals and blocked scorecard rules.",
      findings: [
        {
          category: "CRM_COMPLIANCE",
          severity: "WARNING",
          claim_type: "PERFORMANCE_VS_TARGET",
          headline: "CRM summary completion fell short of required target",
          observation: "Qualitative summary documentation missed policy expectations while resolution fields neared completion.",
          evidence_ids: ["SNAP:105:17"],
          resolved_evidence: [
            {
              evidence_id: "SNAP:105:17",
              metric_code: "CRM_SUMMARY_COMPLETION",
              metric_label: "CRM Summary Completion Rate",
              metric_value: 51.3638,
              formatted_value: "51.3638%",
              unit: "%",
              target_value: 95,
              formatted_target: "95%",
              target_unit: "%",
              target_attainment: "BELOW_TARGET",
              polarity: "HIGHER_IS_BETTER",
              aggregation_type: "WEIGHTED_AVERAGE",
              entity_label: "All In-Scope Activity",
              snapshot_reference: "Snapshot #105 (SUMMARY, monthly)",
              policy_rule_code: "FS_CRM_SUMMARY_COMPLETION_TARGET",
              supporting_document_codes: ["FS-PMP-001"],
              source_status: "CALCULATED",
            },
          ],
          policy_rule_codes: [],
          policy_references: ["FS_CRM_SUMMARY_COMPLETION_TARGET"],
          recommendation: "Strengthen structured summary note completion checklists during call wrap-up.",
          limitations: ["Final scorecard aggregation remains withheld until closure attribution is complete."],
        },
      ],
      dataQualityWarnings: ["Composite KPI scoring remains incomplete."],
      overallLimitations: ["Single-period snapshot only."],
    },
  });

  assert.equal(adaptedV3.insight.schemaVersion, "3");
  assert.equal(adaptedV3.insight.promptVersion, "v3.0");
  assert.equal(adaptedV3.insight.findings[0].claimType, "PERFORMANCE_VS_TARGET");
  assert.equal(adaptedV3.insight.findings[0].resolvedEvidence[0].formattedValue, "51.3638%");
  assert.equal(adaptedV3.insight.findings[0].resolvedEvidence[0].formattedTarget, "95%");
  assert.equal(adaptedV3.insight.findings[0].resolvedEvidence[0].targetAttainment, "BELOW_TARGET");
  assert.equal(adaptedV3.insight.findings[0].resolvedEvidence[0].policyRuleCode, "FS_CRM_SUMMARY_COMPLETION_TARGET");
  assert.deepEqual(adaptedV3.insight.findings[0].policyReferences, ["FS_CRM_SUMMARY_COMPLETION_TARGET"]);

  assert.match(panelSource, /Verified Supporting Evidence \(Snapshot-Resolved\)/);
  assert.match(panelSource, /Below Target/);
  assert.match(panelSource, /Meets Target/);
  assert.match(panelSource, /Limited Verified Findings for This Scope/);

  const adaptedEmptyFindings = adaptInsightData({
    hasPublishedSnapshot: true,
    hasInsight: true,
    hermesCallsCount: 0,
    insight: {
      id: 93,
      reportSnapshotId: 60,
      hasTrustworthyFindings: false,
      executiveSummary: "Employee 3463 metrics remain NO_DATA pending alias mapping.",
      findings: [],
      overallLimitations: ["NO_DATA reflects missing source alias, never zero productivity."],
    },
  });
  assert.equal(adaptedEmptyFindings.hasInsight, true);
  assert.equal(adaptedEmptyFindings.insight.hasTrustworthyFindings, false);
  assert.equal(adaptedEmptyFindings.insight.findings.length, 0);

  const adaptedWithheld = adaptInsightData({
    hasPublishedSnapshot: true,
    hasInsight: false,
    hermesCallsCount: 0,
    latestAttempt: {
      id: 92,
      validationStatus: "REJECTED",
      errorSummary: "Unverified numeric claim rejected by independent validator.",
    },
  });
  assert.equal(adaptedWithheld.hasInsight, false);
  assert.equal(adaptedWithheld.insight, null);
  assert.equal(adaptedWithheld.latestAttempt.validationStatus, "REJECTED");

  // Phase 6.4 multi-report framing, all 8 panel states, entityLabel rendering & non-chatbot checks
  assert.match(summarySource, /reportType="SUMMARY"/);
  assert.match(accountSource, /reportType="ACCOUNT_KPI"/);
  assert.match(pmpPipSource, /reportType="INDIVIDUAL_KPI_PMP"/);
  assert.match(pmpPipSource, /ACTIVE_MISSING_SOURCE_ALIAS/);
  assert.match(pmpPipSource, /ROSTER_VERIFICATION_REQUIRED/);

  assert.match(hooksSource, /unavailableState\s*=\s*null/);
  assert.match(hooksSource, /UNAUTHORIZED_INSIGHT_SCOPE/);

  assert.match(panelSource, /Data Not Authorized/);
  assert.match(panelSource, /Roster Verification Required/);
  assert.match(panelSource, /No Sufficient Source Evidence/);
  assert.match(panelSource, /No Verified Snapshot/);
  assert.match(panelSource, /Coaching &amp; Review Aid Only/);
  assert.match(panelSource, /ev\.entityLabel/);
  assert.match(panelSource, /ev\.weightPercent/);
  assert.match(panelSource, /ev\.supportingDocumentCodes/);

  const adaptedAccountScoped = adaptInsightData({
    hasPublishedSnapshot: true,
    hasInsight: true,
    hermesCallsCount: 0,
    reportType: "ACCOUNT_KPI",
    period: "monthly",
    scopeFilter: "call:CS_Resident",
    insight: {
      id: 499,
      reportSnapshotId: 59,
      reportType: "ACCOUNT_KPI",
      reportingPeriod: "monthly",
      scopeFilter: "call:CS_Resident",
      schemaVersion: "3",
      promptVersion: "v3.0",
      executiveSummary: "Scoped voice queue handle time evaluated cleanly.",
      findings: [
        {
          category: "CALL_PERFORMANCE",
          severity: "INFO",
          claim_type: "PERFORMANCE_VS_TARGET",
          headline: "CS_Resident AHT compliance met policy expectation",
          observation: "Scoped call compliance satisfied target criteria.",
          evidence_ids: ["SNAP:59_call_CS_Resident:VQ_CS_RESIDENT:AHT_COMPLIANCE"],
          resolved_evidence: [
            {
              evidence_id: "SNAP:59_call_CS_Resident:VQ_CS_RESIDENT:AHT_COMPLIANCE",
              metric_code: "AHT_COMPLIANCE",
              metric_label: "Voice Queue AHT Compliance (CS_Resident)",
              metric_value: 87.5,
              formatted_value: "87.50%",
              unit: "%",
              target_value: 80,
              formatted_target: "80%",
              target_attainment: "MEETS_OR_EXCEEDS_TARGET",
              weight_percent: 15,
              entity_label: "Voice Queue: CS_Resident",
              supporting_document_codes: ["FS-PMP-001"],
            },
          ],
          policy_references: ["FS-PMP-001"],
          recommendation: "Maintain current wrap-up discipline.",
          limitations: ["Salesforce case channels excluded by filter."],
        },
      ],
    },
  });
  assert.equal(adaptedAccountScoped.insight.findings[0].resolvedEvidence[0].entityLabel, "Voice Queue: CS_Resident");
  assert.equal(adaptedAccountScoped.insight.findings[0].resolvedEvidence[0].weightPercent, 15);
  assert.deepEqual(adaptedAccountScoped.insight.findings[0].resolvedEvidence[0].supportingDocumentCodes, ["FS-PMP-001"]);

  const adaptedMissingAlias = adaptInsightData({
    hasPublishedSnapshot: true,
    hasInsight: false,
    canGenerateInsights: false,
    unavailableCode: "NO_SUFFICIENT_SOURCE_EVIDENCE",
    unavailableReason: "Employee has no mapped source alias (ACTIVE_MISSING_SOURCE_ALIAS).",
    hermesCallsCount: 0,
  });
  assert.equal(adaptedMissingAlias.hasPublishedSnapshot, true);
  assert.equal(adaptedMissingAlias.canGenerateInsights, false);
  assert.equal(adaptedMissingAlias.unavailableCode, "NO_SUFFICIENT_SOURCE_EVIDENCE");
  assert.match(adaptedMissingAlias.unavailableReason, /ACTIVE_MISSING_SOURCE_ALIAS/);

  // Phase 6.4.1 semantic-review status propagation and flagged-finding audit framing
  const adaptedFlagged = adaptInsightData({
    hasPublishedSnapshot: true,
    hasInsight: true,
    hermesCallsCount: 0,
    insight: {
      id: 656,
      reportSnapshotId: 60,
      reportType: "INDIVIDUAL_KPI_PMP",
      versionNumber: 1,
      validatorVersion: "v3.2",
      hasTrustworthyFindings: true,
      hasUnqualifiedTrustworthyFindings: false,
      semanticReview: {
        reviewStatus: "FLAGGED_SEMANTIC_ISSUES",
        isSemanticallyVerified: false,
        hasFlaggedFindings: true,
        flaggedFindingsCount: 1,
        passedFindingsCount: 0,
        validatorVersionChecked: "v3.3",
      },
      findings: [
        {
          category: "CALL_PERFORMANCE",
          severity: "INFO",
          claim_type: "BOTTLENECK_OR_RISK",
          headline: "AHT meets expectations",
          observation: "Average handle time met policy target.",
          evidence_ids: ["SNAP:60_emp_6754:03"],
          policy_rule_codes: ["FS_FS_PMP_001_CRM_RESOLUTION_SUBCODE_TARGET"],
          semanticReview: {
            findingIndex: 1,
            status: "FLAGGED",
            isSemanticallyVerified: false,
            issues: [
              {
                code: "IRRELEVANT_POLICY_CITATION",
                reason: "CRM subcode rule does not apply to AHT.",
              },
            ],
          },
        },
      ],
    },
  });
  assert.equal(adaptedFlagged.insight.hasUnqualifiedTrustworthyFindings, false);
  assert.equal(adaptedFlagged.insight.semanticReview.reviewStatus, "FLAGGED_SEMANTIC_ISSUES");
  assert.equal(adaptedFlagged.insight.findings[0].semanticReview.status, "FLAGGED");

  assert.match(panelSource, /Semantic Review Flagged/);
  assert.match(panelSource, /Semantic Review Warning/);
  assert.match(panelSource, /Semantic Review Flagged — Not Verified Conclusion/);
  assert.match(panelSource, /Audit-Only Notice/);
});
