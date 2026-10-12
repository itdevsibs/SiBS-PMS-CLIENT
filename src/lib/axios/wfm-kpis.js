// API helpers for WFM KPI dashboards backed by canonical PMS data.
import api from "./api-template";

export async function getWfmCallKpis(params = {}) {
  const response = await api.get("/kpis/calls", { params });
  return response;
}

export async function getWfmCallSkills() {
  const response = await api.get("/kpis/skills");
  return response?.data || response;
}

export async function getWfmEmailKpis(params = {}) {
  const response = await api.get("/kpis/emails", { params });
  return response;
}

export async function getWfmQualityAuditKpis(params = {}) {
  const response = await api.get("/kpis/quality-audit", { params });
  return response;
}

export async function getWfmOccupancyKpis(params = {}) {
  const response = await api.get("/kpis/occupancy", { params });
  return response;
}

export async function getWfmUtilizationKpis(params = {}) {
  const response = await api.get("/kpis/utilization", { params });
  return response;
}

export async function getCallsReport(params = {}) {
  const response = await api.get("/kpis/calls-report", { params });
  return response?.data || response;
}
