// API helpers for PMS KPI dashboards backed by canonical PMS data.
import api from "./api-template";

export async function getCallKpis(params = {}) {
  const response = await api.get("/kpis/calls", { params });
  return response;
}

export async function getCallsReportSkills() {
  const response = await api.get("/kpis/calls-report/skills");
  return response?.data || response;
}

export async function getCallSkills({ onlySkillStatistics = false, onlyProfiles = false, taskOrderVersionId = 'current' } = {}) {
  const response = await api.get("/kpis/skills", {
    params: { ...(onlyProfiles ? { reportType: "PROFILE_ONLY" } : onlySkillStatistics ? { reportType: "SKILL_STATISTICS" } : {}), taskOrderVersionId },
  });
  return response?.data || response;
}

export async function getEmailKpis(params = {}) {
  const response = await api.get("/kpis/emails", { params });
  return response;
}

export async function getEmailsReport(params = {}) {
  const response = await api.get("/kpis/emails-report", { params });
  return response?.data || response;
}

export async function getQualityAuditKpis(params = {}) {
  const response = await api.get("/kpis/quality-audit", { params });
  return response;
}

export async function getQualityAuditReport(params = {}) {
  const response = await api.get("/kpis/quality-audit-report", { params });
  return response?.data || response;
}

export async function getQualityAuditRowDetail(auditId) {
  const response = await api.get(`/kpis/quality-audit-report/${encodeURIComponent(auditId)}`);
  return response?.data || response;
}

export async function getOccupancyKpis(params = {}) {
  const response = await api.get("/kpis/occupancy", { params });
  return response;
}

export async function getUtilizationKpis(params = {}, config = {}) {
  const response = await api.get("/kpis/utilization", { ...config, params });
  return response;
}

export async function getAbsenteeismKpis(params = {}, config = {}) {
  const response = await api.get("/kpis/absenteeism", { ...config, params });
  return response;
}

export async function getCallsReport(params = {}) {
  const response = await api.get("/kpis/calls-report", { params });
  return response?.data || response;
}
export async function getChatReport(params = {}) {
  const response = await api.get("/kpis/chat-report", { params });
  return response?.data || response;
}

export async function getTaskOrderVersions() {
  const response = await api.get('/kpis/task-order-versions');
  return response?.data || response;
}
export async function compareTaskOrderVersions(body) {
  const response = await api.post('/kpis/task-order-version-comparison', body);
  return response?.data || response;
}
