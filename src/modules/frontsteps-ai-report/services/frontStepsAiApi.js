/**
 * FrontSteps AI Report API Service
 * Isolated read-only HTTP calls to /api/frontsteps/ai-report/*
 */

import api from "@/lib/axios/api-template";

const FS_AI_BASE = "/api/frontsteps/ai-report";

function buildCleanReportParams(params = {}) {
  const clean = {};
  for (const [key, value] of Object.entries(params || {})) {
    if (value === undefined || value === null) continue;
    const trimmed = typeof value === "string" ? value.trim() : value;
    if (trimmed === "") continue;
    clean[key] = trimmed;
  }
  return clean;
}

export async function fetchFsAiSummary(params = {}) {
  const res = await api.get(`${FS_AI_BASE}/summary`, { params: buildCleanReportParams(params) });
  return res.data;
}

export async function fetchFsAiAccountKpi(params = {}) {
  const res = await api.get(`${FS_AI_BASE}/account-kpi`, { params: buildCleanReportParams(params) });
  return res.data;
}

export async function fetchFsAiPmpPip(params = {}) {
  const res = await api.get(`${FS_AI_BASE}/pmp-pip`, { params: buildCleanReportParams(params) });
  return res.data;
}

export async function triggerFsAiReportRebuild(data = {}) {
  const res = await api.post(`${FS_AI_BASE}/reports/rebuild`, data);
  return res.data;
}

export async function fetchFsAiCalculationAudits(params = {}) {
  const res = await api.get(`${FS_AI_BASE}/calculations/audits`, { params });
  return res.data;
}

export async function fetchFsAiPolicies(params = {}) {
  const res = await api.get(`${FS_AI_BASE}/policies`, { params });
  return res.data;
}

export async function fetchFsAiPolicySyncStatus() {
  const res = await api.get(`${FS_AI_BASE}/policies/sync-status`);
  return res.data;
}

export async function triggerFsAiPolicySync() {
  const res = await api.post(`${FS_AI_BASE}/policies/sync`);
  return res.data;
}

export async function fetchFsAiPolicyVersions(params = {}) {
  const res = await api.get(`${FS_AI_BASE}/policies/versions`, { params });
  return res.data;
}

export async function fetchFsAiPolicyVersionHistory(documentCode) {
  const res = await api.get(`${FS_AI_BASE}/policies/versions/${encodeURIComponent(documentCode)}`);
  return res.data;
}

export async function fetchFsAiPolicySyncHistory(params = {}) {
  const res = await api.get(`${FS_AI_BASE}/policies/sync-history`, { params });
  return res.data;
}

export async function fetchFsAiExtractionOverview() {
  const res = await api.get(`${FS_AI_BASE}/policies/extraction-overview`);
  return res.data;
}

export async function triggerFsAiVersionExtraction(versionId, force = false) {
  const res = await api.post(`${FS_AI_BASE}/policies/versions/${versionId}/extract`, { force });
  return res.data;
}

export async function fetchFsAiVersionExtraction(versionId) {
  const res = await api.get(`${FS_AI_BASE}/policies/versions/${versionId}/extraction`);
  return res.data;
}

export async function fetchFsAiVersionPages(versionId, params = {}) {
  const res = await api.get(`${FS_AI_BASE}/policies/versions/${versionId}/pages`, { params });
  return res.data;
}

export async function fetchFsAiVersionChunks(versionId, params = {}) {
  const res = await api.get(`${FS_AI_BASE}/policies/versions/${versionId}/chunks`, { params });
  return res.data;
}

export async function searchFsAiPolicyKnowledge(query, params = {}) {
  const res = await api.get(`${FS_AI_BASE}/policies/knowledge/search`, {
    params: { q: query, ...params },
  });
  return res.data;
}

export async function triggerFsAiVersionInterpretation(versionId, force = false, model = null) {
  const res = await api.post(`${FS_AI_BASE}/policies/versions/${versionId}/interpret`, { force, model });
  return res.data;
}

export async function fetchFsAiVersionInterpretation(versionId) {
  const res = await api.get(`${FS_AI_BASE}/policies/versions/${versionId}/interpretation`);
  return res.data;
}

export async function fetchFsAiVersionRules(versionId) {
  const res = await api.get(`${FS_AI_BASE}/policies/versions/${versionId}/rules`);
  return res.data;
}

export async function fetchFsAiInterpretationOverview() {
  const res = await api.get(`${FS_AI_BASE}/policies/interpretation-overview`);
  return res.data;
}

export async function fetchFsAiJobStatus(jobId) {
  const res = await api.get(`${FS_AI_BASE}/jobs/${jobId}`);
  return res.data;
}

export async function fetchFsAiJobHistory(params = {}) {
  const res = await api.get(`${FS_AI_BASE}/jobs/history`, { params });
  return res.data;
}

export async function fetchFsAiSnapshotsStatus() {
  const res = await api.get(`${FS_AI_BASE}/snapshots/status`);
  return res.data;
}

export async function triggerFsAiPolicyValidation() {
  const res = await api.post(`${FS_AI_BASE}/policies/validate`);
  return res.data;
}

export async function fetchFsAiValidationStatus() {
  const res = await api.get(`${FS_AI_BASE}/policies/validation-status`);
  return res.data;
}

export async function fetchFsAiCanonicalRules() {
  const res = await api.get(`${FS_AI_BASE}/policies/rules/canonical`);
  return res.data;
}

export async function fetchFsAiValidationIssues() {
  const res = await api.get(`${FS_AI_BASE}/policies/rules/issues`);
  return res.data;
}

export async function fetchFsAiPolicySnapshots(params = {}) {
  const res = await api.get(`${FS_AI_BASE}/policies/snapshots`, { params });
  return res.data;
}

export async function fetchFsAiActivePolicySnapshot() {
  const res = await api.get(`${FS_AI_BASE}/policies/snapshots/active`);
  return res.data;
}

export async function createFsAiPolicySnapshot(data = {}) {
  const res = await api.post(`${FS_AI_BASE}/policies/snapshots/generate`, data);
  return res.data;
}

export async function publishFsAiPolicySnapshot(snapshotId, data = {}) {
  const res = await api.post(`${FS_AI_BASE}/policies/snapshots/${snapshotId}/publish`, data);
  return res.data;
}

export function getFsAiPolicyPreviewUrl(id) {
  return `${api.defaults.baseURL || ""}${FS_AI_BASE}/policies/${id}/preview`;
}

export async function fetchFsAiInsights(params = {}) {
  const res = await api.get(`${FS_AI_BASE}/insights`, { params: buildCleanReportParams(params) });
  return res.data;
}

export async function fetchFsAiInsightById(id) {
  const res = await api.get(`${FS_AI_BASE}/insights/${id}`);
  return res.data;
}

export async function fetchFsAiInsightHistory(params = {}) {
  const res = await api.get(`${FS_AI_BASE}/insights/history`, { params: buildCleanReportParams(params) });
  return res.data;
}

export async function triggerFsAiInsightGeneration(data = {}) {
  const res = await api.post(`${FS_AI_BASE}/insights/generate`, data);
  return res.data;
}

export async function fetchFsAiOperationalSettings(params = {}) {
  const res = await api.get(`${FS_AI_BASE}/settings/operational`, { params: buildCleanReportParams(params) });
  return res.data;
}

export async function fetchFsAiTimezonePreview(params = {}) {
  const res = await api.get(`${FS_AI_BASE}/settings/operational/preview`, { params: buildCleanReportParams(params) });
  return res.data;
}
