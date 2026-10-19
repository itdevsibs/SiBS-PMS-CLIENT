// API helpers for PMS KPI dashboards backed by canonical PMS data.
import api from "./api-template";

export async function getCallKpis(params = {}) {
  const response = await api.get("/kpis/calls", { params });
  return response;
}

export async function getCallSkills() {
  const response = await api.get("/kpis/skills");
  return response?.data || response;
}

export async function getEmailKpis(params = {}) {
  const response = await api.get("/kpis/emails", { params });
  return response;
}

export async function getQualityAuditKpis(params = {}) {
  const response = await api.get("/kpis/quality-audit", { params });
  return response;
}

export async function getOccupancyKpis(params = {}) {
  const response = await api.get("/kpis/occupancy", { params });
  return response;
}

export async function getUtilizationKpis(params = {}) {
  const response = await api.get("/kpis/utilization", { params });
  return response;
}

export async function getAbsenteeismKpis(params = {}) {
  const response = await api.get("/kpis/absenteeism", { params });
  return response;
}

export async function getCallsReport(params = {}) {
  const response = await api.get("/kpis/calls-report", { params });
  return response?.data || response;
}
