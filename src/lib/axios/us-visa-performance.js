// API helpers for role-scoped US Visa Agent Level performance.
import api from "./api-template";

export async function getMyUsVisaPerformance(params = {}) {
  const response = await api.get("/us-visa/performance/me", {
    params,
  });

  return response.data;
}

export async function getTeamUsVisaPerformance(params = {}) {
  const response = await api.get("/us-visa/performance/team", {
    params,
  });

  return response.data;
}

export async function getOperationsUsVisaPerformance(params = {}) {
  const response = await api.get("/us-visa/performance/operations", {
    params,
  });

  return response.data;
}

export async function getWfmUsVisaPerformanceComparison(params = {}) {
  const response = await api.get("/us-visa/performance/comparison", {
    params,
  });

  return response.data;
}
