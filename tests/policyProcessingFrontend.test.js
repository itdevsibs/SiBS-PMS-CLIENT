import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import test from "node:test";

const root = process.cwd();

async function read(relativePath) {
  return fs.readFile(path.join(root, relativePath), "utf8");
}

test("Policy Processing module configuration in accessControl.js", async () => {
  const { DASHBOARD_MODULES, PERMISSIONS, canAccessDashboardPath, hasPermissionForUser } = await import(
    "../src/config/accessControl.js"
  );

  // 1. Permissions exist
  assert.equal(PERMISSIONS.VIEW_POLICY_PROCESSING, "VIEW_POLICY_PROCESSING");
  assert.equal(PERMISSIONS.MANAGE_POLICY_PROCESSING, "MANAGE_POLICY_PROCESSING");

  // 2. AI Report module contains Policy Processing leaf child
  const aiModule = DASHBOARD_MODULES.find((m) => m.key === "ai-report");
  assert.ok(aiModule, "ai-report module exists");

  const policyItem = aiModule.submodules.find((s) => s.key === "ai-policy-processing");
  assert.ok(policyItem, "ai-policy-processing child exists under AI Report");
  assert.equal(policyItem.name, "Policy Processing");
  assert.equal(policyItem.iconKey, "file-cog");
  assert.equal(policyItem.path, "/ai-report/policy-processing");
  assert.equal(policyItem.permission, PERMISSIONS.VIEW_POLICY_PROCESSING);

  // Position: after Operations Tracking
  const subKeys = aiModule.submodules.map((s) => s.key);
  const otIndex = subKeys.indexOf("ai-operations-tracking");
  const polIndex = subKeys.indexOf("ai-policy-processing");
  assert.ok(polIndex > otIndex, "Policy Processing is positioned after Operations Tracking");

  // 3. Role access rules
  const superAdmin = { adminAccess: 7, role: "admin" };
  const som = { adminAccess: 10, role: "som" };
  const om = { adminAccess: 5, role: "om" };
  const frontsteps = { adminAccess: 11, role: "frontsteps" };
  const wfm = { adminAccess: 9, role: "wfm" };
  const tl = { adminAccess: 8, role: "tl" };
  const employee = { adminAccess: 0, role: "employee" };

  // View permission
  assert.equal(canAccessDashboardPath(superAdmin, "/ai-report/policy-processing"), true);
  assert.equal(canAccessDashboardPath(som, "/ai-report/policy-processing"), true);
  assert.equal(canAccessDashboardPath(om, "/ai-report/policy-processing"), true);
  assert.equal(canAccessDashboardPath(frontsteps, "/ai-report/policy-processing"), true);
  assert.equal(canAccessDashboardPath(wfm, "/ai-report/policy-processing"), true);
  assert.equal(canAccessDashboardPath(tl, "/ai-report/policy-processing"), false);
  assert.equal(canAccessDashboardPath(employee, "/ai-report/policy-processing"), false);

  // Manage permission
  assert.equal(hasPermissionForUser(superAdmin, PERMISSIONS.MANAGE_POLICY_PROCESSING), true);
  assert.equal(hasPermissionForUser(som, PERMISSIONS.MANAGE_POLICY_PROCESSING), true);
  assert.equal(hasPermissionForUser(om, PERMISSIONS.MANAGE_POLICY_PROCESSING), true);
  assert.equal(hasPermissionForUser(frontsteps, PERMISSIONS.MANAGE_POLICY_PROCESSING), true);
  assert.equal(hasPermissionForUser(tl, PERMISSIONS.MANAGE_POLICY_PROCESSING), false);
  assert.equal(hasPermissionForUser(employee, PERMISSIONS.MANAGE_POLICY_PROCESSING), false);
});

test("useDashboardPage.js hydrates file-cog icon with FileCog", async () => {
  const source = await read("src/hooks/useDashboardPage.js");
  assert.match(source, /FileCog/);
  assert.match(source, /"file-cog": FileCog/);
});

test("router.jsx configures /ai-report/policy-processing route and aliases", async () => {
  const routerSource = await read("src/router.jsx");

  assert.match(routerSource, /import PolicyProcessingPage from "\.\/pages\/policyProcessing\/PolicyProcessingPage";/);
  assert.match(routerSource, /path="\/ai-report\/policy-processing"/);
  assert.match(routerSource, /permission={PERMISSIONS\.VIEW_POLICY_PROCESSING}/);
  assert.match(routerSource, /reportId="policy-processing"/);
  assert.match(routerSource, /title="Policy Processing"/);
  assert.match(routerSource, /<PolicyProcessingPage \/>/);

  // Aliases
  assert.match(routerSource, /path="\/ai-report\/policy"/);
  assert.match(routerSource, /path="\/ai-report\/policies"/);
});

test("policy-processing.js API bridge exports all required methods", async () => {
  const source = await read("src/lib/axios/policy-processing.js");

  assert.match(source, /export async function getPolicyProcessingOverview/);
  assert.match(source, /export async function getPolicyProcessingDocuments/);
  assert.match(source, /export async function getPolicyProcessingDetail/);
  assert.match(source, /export async function reprocessPolicyDocument/);
  assert.match(source, /export async function uploadPolicyDocument/);
  assert.match(source, /export async function searchPolicyContent/);
  assert.match(source, /export function getPolicyPdfPreviewUrl/);
});
