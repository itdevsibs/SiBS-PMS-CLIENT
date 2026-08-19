// API helpers for WFM KPI dashboards backed by canonical PMS data.
import api from "./api-template";

export async function getWfmCallKpis(params = {}) {
  const response = await api.get("/wfm/kpis/calls", { params });
  return response;
}
