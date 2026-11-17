import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import test from "node:test";

const root = process.cwd();

async function read(relativePath) {
  return fs.readFile(path.join(root, relativePath), "utf8");
}

test("AI Report module configuration has correct position, hierarchy and icons", async () => {
  const { DASHBOARD_MODULES, PERMISSIONS } = await import(
    "../src/config/accessControl.js"
  );

  const keys = DASHBOARD_MODULES.map((m) => m.key);
  const otIndex = keys.indexOf("operations-tracking");
  const aiIndex = keys.indexOf("ai-report");
  const saIndex = keys.indexOf("super-admin");

  assert.ok(otIndex !== -1, "operations-tracking exists");
  assert.ok(aiIndex !== -1, "ai-report exists");
  assert.ok(saIndex !== -1, "super-admin exists");
  assert.ok(
    aiIndex > saIndex,
    "ai-report is positioned at the lowest part, after super-admin",
  );
  assert.equal(
    aiIndex,
    keys.length - 1,
    "ai-report is at the lowest position in DASHBOARD_MODULES",
  );

  const aiModule = DASHBOARD_MODULES[aiIndex];
  assert.equal(aiModule.name, "AI Report");
  assert.equal(aiModule.iconKey, "brain-circuit");

  const nestedGroupNames = aiModule.submodules.map((s) => s.name);
  assert.deepEqual(nestedGroupNames, [
    "WoW Report",
    "Workforce Management",
    "Operations Tracking",
    "Policy Processing",
  ]);

  // Policy Processing leaf child
  const policyItem = aiModule.submodules.find(
    (s) => s.name === "Policy Processing",
  );
  assert.ok(policyItem, "Policy Processing exists under AI Report");
  assert.equal(policyItem.iconKey, "file-cog");
  assert.equal(policyItem.path, "/ai-report/policy-processing");
  assert.equal(policyItem.permission, PERMISSIONS.VIEW_POLICY_PROCESSING);

  // 1. WoW Report
  const wowGroup = aiModule.submodules.find((s) => s.name === "WoW Report");
  assert.equal(wowGroup.iconKey, "bar-chart");
  assert.deepEqual(
    wowGroup.submodules.map((item) => ({
      name: item.name,
      path: item.path,
      iconKey: item.iconKey,
      permission: item.permission,
    })),
    [
      {
        name: "Calls",
        path: "/ai-report/view-graphs?section=calls",
        iconKey: "phone-call",
        permission: PERMISSIONS.VIEW_WOW_REPORT,
      },
      {
        name: "Emails",
        path: "/ai-report/view-graphs?section=emails",
        iconKey: "mail",
        permission: PERMISSIONS.VIEW_WOW_REPORT,
      },
      {
        name: "QA",
        path: "/ai-report/view-graphs?section=qa",
        iconKey: "clipboard-check",
        permission: PERMISSIONS.VIEW_WOW_REPORT,
      },
      {
        name: "Occupancy & HC",
        path: "/ai-report/view-graphs?section=occupancy",
        iconKey: "users",
        permission: PERMISSIONS.VIEW_WOW_REPORT,
      },
    ],
  );

  // 2. Workforce Management
  const wfmGroup = aiModule.submodules.find(
    (s) => s.name === "Workforce Management",
  );
  assert.equal(wfmGroup.iconKey, "users-round");
  assert.deepEqual(
    wfmGroup.submodules.map((item) => ({
      name: item.name,
      path: item.path,
      iconKey: item.iconKey,
      permission: item.permission,
    })),
    [
      {
        name: "Employee Ledger",
        path: "/ai-report/employee-master-data",
        iconKey: "database",
        permission: PERMISSIONS.VIEW_EMPLOYEE_LEDGER,
      },
      {
        name: "Staffing Requirements",
        path: "/ai-report/staffing-requirements",
        iconKey: "clipboard-list",
        permission: PERMISSIONS.WFM_STAFFING_CALENDAR,
      },
    ],
  );

  // 3. Operations Tracking
  const otGroup = aiModule.submodules.find(
    (s) => s.name === "Operations Tracking",
  );
  assert.equal(otGroup.iconKey, "line-chart");
  assert.deepEqual(
    otGroup.submodules.map((item) => ({
      name: item.name,
      path: item.path,
      iconKey: item.iconKey,
      permission: item.permission,
    })),
    [
      {
        name: "Occupancy",
        path: "/ai-report/occupancy",
        iconKey: "users",
        permission: PERMISSIONS.VIEW_OCCUPANCY,
      },
      {
        name: "Attendance Sheet",
        path: "/ai-report/attendance-sheet",
        iconKey: "clipboard-check",
        permission: PERMISSIONS.VIEW_ATTENDANCE_SHEET,
      },
      {
        name: "Calls Report",
        path: "/ai-report/calls-report",
        iconKey: "phone-call",
        permission: PERMISSIONS.VIEW_CALLS_REPORT,
      },
      {
        name: "Chat Reports",
        path: "/ai-report/chat-reports",
        iconKey: "message-circle",
        permission: PERMISSIONS.VIEW_CHAT_REPORT,
      },
    ],
  );
});

test("Role-based permissions correctly gate AI Report routes and modules", async () => {
  const { canAccessDashboardPath, getAllowedModules } = await import(
    "../src/config/accessControl.js"
  );

  const superAdmin = { adminAccess: 7, role: "admin" };
  const tlUser = { adminAccess: 8, role: "tl" };
  const employeeUser = { adminAccess: 0, role: "employee" };

  // Super Admin has full access
  assert.equal(canAccessDashboardPath(superAdmin, "/ai-report/view-graphs"), true);
  assert.equal(canAccessDashboardPath(superAdmin, "/ai-report/employee-master-data"), true);
  assert.equal(canAccessDashboardPath(superAdmin, "/ai-report/staffing-requirements"), true);
  assert.equal(canAccessDashboardPath(superAdmin, "/ai-report/occupancy"), true);
  assert.equal(canAccessDashboardPath(superAdmin, "/ai-report/attendance-sheet"), true);
  assert.equal(canAccessDashboardPath(superAdmin, "/ai-report/calls-report"), true);
  assert.equal(canAccessDashboardPath(superAdmin, "/ai-report/chat-reports"), true);
  assert.equal(canAccessDashboardPath(superAdmin, "/ai-report/policy-processing"), true);

  // TL lacks Attendance Sheet, Employee Ledger, and Policy Processing
  assert.equal(canAccessDashboardPath(tlUser, "/ai-report/attendance-sheet"), false);
  assert.equal(canAccessDashboardPath(tlUser, "/ai-report/employee-master-data"), false);
  assert.equal(canAccessDashboardPath(tlUser, "/ai-report/staffing-requirements"), false);
  assert.equal(canAccessDashboardPath(tlUser, "/ai-report/policy-processing"), false);
  assert.equal(canAccessDashboardPath(tlUser, "/ai-report/calls-report"), true);
  assert.equal(canAccessDashboardPath(tlUser, "/ai-report/occupancy"), true);

  // Employee lacks reports and policy processing
  assert.equal(canAccessDashboardPath(employeeUser, "/ai-report/calls-report"), false);
  assert.equal(canAccessDashboardPath(employeeUser, "/ai-report/attendance-sheet"), false);
  assert.equal(canAccessDashboardPath(employeeUser, "/ai-report/policy-processing"), false);

  // Module filtering check
  const saModules = getAllowedModules(superAdmin);
  const saAiModule = saModules.find((m) => m.key === "ai-report");
  assert.ok(saAiModule, "Super Admin sees AI Report");
  assert.equal(saAiModule.submodules.length, 4, "Super Admin sees 3 nested groups + Policy Processing");

  const tlModules = getAllowedModules(tlUser);
  const tlAiModule = tlModules.find((m) => m.key === "ai-report");
  assert.ok(tlAiModule, "TL sees AI Report");
  assert.equal(
    tlAiModule.submodules.length,
    2,
    "TL only sees WoW Report and Operations Tracking (Workforce Management hidden)",
  );

  const empModules = getAllowedModules(employeeUser);
  const empAiModule = empModules.find((m) => m.key === "ai-report");
  assert.equal(empAiModule, undefined, "Employee does not see AI Report");
});

test("router.jsx registers all AI Report routes wrapped in AiReportWrapper", async () => {
  const routerSource = await read("src/router.jsx");

  assert.match(routerSource, /import AiReportWrapper from "\.\/components\/modules\/ai-report\/AiReportWrapper";/);
  assert.match(routerSource, /path="\/ai-report\/view-graphs"/);
  assert.match(routerSource, /path="\/ai-report\/employee-master-data"/);
  assert.match(routerSource, /path="\/ai-report\/staffing-requirements"/);
  assert.match(routerSource, /path="\/ai-report\/occupancy"/);
  assert.match(routerSource, /path="\/ai-report\/attendance-sheet"/);
  assert.match(routerSource, /path="\/ai-report\/calls-report"/);
  assert.match(routerSource, /path="\/ai-report\/chat-reports"/);
  assert.match(routerSource, /path="\/ai-report\/policy-processing"/);
});
