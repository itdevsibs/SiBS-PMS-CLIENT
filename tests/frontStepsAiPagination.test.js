import assert from "node:assert/strict";
import test from "node:test";
import {
  deduplicateFrontStepsEmployees,
  resolveCanonicalSibsId,
  FRONTSTEPS_CANONICAL_SIBS_ID_MAP,
  FRONTSTEPS_CLIENT_TENURE_REGISTRY,
  adaptPmpPipData,
} from "../src/modules/frontsteps-ai-report/adapters/frontStepsAiDataAdapter.js";

test("FrontSteps AI — Employee Scorecard Pagination & Deduplication Suite", async (t) => {
  await t.test("1. FRONTSTEPS_CANONICAL_SIBS_ID_MAP maps Kronos internal IDs to canonical SIBS IDs", () => {
    assert.equal(resolveCanonicalSibsId("1403"), "5515");
    assert.equal(resolveCanonicalSibsId("1603"), "5689");
    assert.equal(resolveCanonicalSibsId("5206"), "5206");
    assert.equal(resolveCanonicalSibsId("6859"), "6859");
  });

  await t.test("2. deduplicateFrontStepsEmployees deduplicates 31 keys to exactly 29 unique human employees", () => {
    // Generate raw collection with all 31 tenure registry keys
    const rawList = Object.entries(FRONTSTEPS_CLIENT_TENURE_REGISTRY).map(([sid, meta]) => ({
      sibsId: sid,
      kronosEmpCode: sid,
      employeeName: meta.name,
      employmentStatus: meta.status,
      siteName: meta.site,
      hireDate: meta.start,
      lastWorkingDay: meta.end,
    }));
    assert.equal(rawList.length, 31, "Raw list contains 31 directory/alias keys");

    const deduped = deduplicateFrontStepsEmployees(rawList);
    assert.equal(deduped.length, 29, "Deduplicated collection contains exactly 29 unique human employees");

    // Verify 1403 was canonicalized to 5515 and 1603 to 5689
    const sibsIds = deduped.map((e) => e.sibsId);
    assert.ok(sibsIds.includes("5515"), "Canonical 5515 (Angelito Romero) present");
    assert.ok(!sibsIds.includes("1403"), "Alias 1403 merged into canonical 5515");
    assert.ok(sibsIds.includes("5689"), "Canonical 5689 (Senate Stefane Toning) present");
    assert.ok(!sibsIds.includes("1603"), "Alias 1603 merged into canonical 5689");

    // Unique check
    const uniqueIds = new Set(sibsIds);
    assert.equal(uniqueIds.size, 29, "All 29 SIBS IDs in the deduplicated collection are strictly unique");
  });

  await t.test("3. Status counters describe the exact same canonical employee population (29)", () => {
    const rawList = Object.entries(FRONTSTEPS_CLIENT_TENURE_REGISTRY).map(([sid, meta]) => ({
      sibsId: sid,
      kronosEmpCode: sid,
      employeeName: meta.name,
      employmentStatus: meta.status,
      siteName: meta.site,
    }));
    const deduped = deduplicateFrontStepsEmployees(rawList);

    const activeCount = deduped.filter((e) => e.employmentStatus === "ACTIVE").length;
    const verificationRequiredCount = deduped.filter((e) => e.employmentStatus === "VERIFICATION_REQUIRED").length;
    const inactiveCount = deduped.filter((e) => e.employmentStatus === "INACTIVE_SEPARATED").length;
    const transferredCount = deduped.filter((e) => e.employmentStatus === "TRANSFERRED").length;

    assert.equal(activeCount, 5, "5 Active employees");
    assert.equal(verificationRequiredCount, 1, "1 Verification Required employee (6855)");
    assert.equal(inactiveCount, 18, "18 Inactive/Separated employees (deduped)");
    assert.equal(transferredCount, 5, "5 Transferred employees (deduped)");
    assert.equal(
      activeCount + verificationRequiredCount + inactiveCount + transferredCount,
      29,
      "Sum of all status categories equals exactly 29 unique employees"
    );
  });

  await t.test("4. Page slicing at default 15 employees per page yields Page 1: 1–15 and Page 2: 16–29", () => {
    const rawList = Object.entries(FRONTSTEPS_CLIENT_TENURE_REGISTRY).map(([sid, meta]) => ({
      sibsId: sid,
      kronosEmpCode: sid,
      employeeName: meta.name,
      employmentStatus: meta.status,
    }));
    const deduped = deduplicateFrontStepsEmployees(rawList);
    const PAGE_SIZE = 15;
    const totalItems = deduped.length;
    const totalPages = Math.ceil(totalItems / PAGE_SIZE);

    assert.equal(totalItems, 29);
    assert.equal(totalPages, 2, "29 items at 15/page yields exactly 2 pages");

    // Page 1
    const page1Start = 0;
    const page1 = deduped.slice(page1Start, page1Start + PAGE_SIZE);
    assert.equal(page1.length, 15, "Page 1 displays exactly 15 employees");
    const page1Range = `${page1Start + 1}–${page1Start + page1.length}`;
    assert.equal(page1Range, "1–15");

    // Page 2
    const page2Start = 15;
    const page2 = deduped.slice(page2Start, page2Start + PAGE_SIZE);
    assert.equal(page2.length, 14, "Page 2 displays remaining 14 employees");
    const page2Range = `${page2Start + 1}–${page2Start + page2.length}`;
    assert.equal(page2Range, "16–29");

    // Zero overlap between pages
    const page1Ids = new Set(page1.map((e) => e.sibsId));
    for (const emp of page2) {
      assert.ok(!page1Ids.has(emp.sibsId), `Employee ${emp.sibsId} on Page 2 must not appear on Page 1`);
    }
  });

  await t.test("5. Search filtering precedes pagination and computes accurate range and total", () => {
    const rawList = Object.entries(FRONTSTEPS_CLIENT_TENURE_REGISTRY).map(([sid, meta]) => ({
      sibsId: sid,
      kronosEmpCode: sid,
      employeeName: meta.name,
      employmentStatus: meta.status,
    }));
    const deduped = deduplicateFrontStepsEmployees(rawList);

    // Search query matching 1 employee
    const q1 = "sanding";
    const filtered1 = deduped.filter((e) => e.employeeName.toLowerCase().includes(q1));
    assert.equal(filtered1.length, 1);
    assert.equal(filtered1[0].sibsId, "6859");
    const pages1 = Math.ceil(filtered1.length / 15);
    assert.equal(pages1, 1);

    // Search query matching multiple employees (e.g. "al")
    const q2 = "al";
    const filtered2 = deduped.filter((e) => e.employeeName.toLowerCase().includes(q2));
    assert.ok(filtered2.length > 1);
    assert.ok(filtered2.length <= 29);

    // Empty search result
    const qNone = "nonexistent_employee_xyz";
    const filteredNone = deduped.filter((e) => e.employeeName.toLowerCase().includes(qNone));
    assert.equal(filteredNone.length, 0);
    const pagesNone = Math.max(1, Math.ceil(filteredNone.length / 15));
    assert.equal(pagesNone, 1);
  });

  await t.test("6. adaptPmpPipData output incorporates active-only directory and preserved KPI structure", () => {
    const adapted = adaptPmpPipData({
      hasPublishedSnapshot: true,
      individualKpi: {
        employees: [
          { sibsId: "5206", employeeName: "LESLIE JOY PATRICIO", calls: { offered: 50, answered: 48 } },
        ],
        directory: Object.entries(FRONTSTEPS_CLIENT_TENURE_REGISTRY).map(([sid, meta]) => ({
          sibsId: sid,
          kronosEmpCode: sid,
          employeeName: meta.name,
          employmentStatus: meta.status,
          siteName: meta.site,
          calls: { offered: sid === "5206" ? 50 : 35, answered: sid === "5206" ? 48 : 31 },
          cases: { attributedClosedCasesModifiedBy: sid === "5206" ? 12 : 7 },
          kpis: {
            CASES_CLOSED: { status: "BLOCKED", weightPercent: 45 },
          },
          finalKpiScore: { status: "BLOCKED", score: null },
        })),
      },
    });

    assert.equal(adapted.directory.length, 5, "Adapted directory filters out inactive/separated employees, leaving exactly 5 active agents");
    assert.equal(adapted.totalDirectoryCount, 5);

    // Inactive employee 6859 must NOT be in active directory
    const emp6859 = adapted.directory.find((e) => e.sibsId === "6859");
    assert.equal(emp6859, undefined, "Inactive employee 6859 must be excluded from active directory");

    // Active employee 5206 must be in active directory with preserved KPI structures
    const emp5206 = adapted.directory.find((e) => e.sibsId === "5206");
    assert.ok(emp5206, "Active agent 5206 exists in adapted active directory");
    assert.equal(emp5206.calls.offered, 50);
    assert.equal(emp5206.calls.answered, 48);
    assert.equal(emp5206.cases.attributedClosedCasesModifiedBy, 12);
    assert.equal(emp5206.kpis.CASES_CLOSED.status, "BLOCKED");
    assert.equal(emp5206.finalKpiScore.status, "BLOCKED");

    // Active roster verification
    const activeIds = adapted.directory.map((e) => e.sibsId).sort();
    assert.deepEqual(activeIds, ["3463", "5206", "6754", "6863", "6887"], "Only the 5 active FrontSteps agents are included");
  });

  await t.test("7. Active roster pagination renders exactly 1 page with range 1–5", () => {
    const activeEmployees = [
      { sibsId: "3463", employeeName: "JEAZAER MEA CAÑEDO" },
      { sibsId: "5206", employeeName: "LESLIE JOY PATRICIO" },
      { sibsId: "6754", employeeName: "ISAGANI CABALLEJO" },
      { sibsId: "6863", employeeName: "ROSUEL ALIDO" },
      { sibsId: "6887", employeeName: "SHELLA MAE TIMTIM" },
    ];
    const PAGE_SIZE = 15;
    const totalItems = activeEmployees.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
    assert.equal(totalItems, 5);
    assert.equal(totalPages, 1, "5 active employees at 15/page yields exactly 1 page");

    const pageStart = 0;
    const pageItems = activeEmployees.slice(pageStart, pageStart + PAGE_SIZE);
    assert.equal(pageItems.length, 5);
    const rangeLabel = `Showing ${pageStart + 1}–${pageStart + pageItems.length} of ${totalItems} employee records`;
    assert.equal(rangeLabel, "Showing 1–5 of 5 employee records");
  });
});
