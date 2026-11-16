import api from './api-template';

const base = '/kpis/us-visa/targets';
export async function fetchUsVisaKpiTargetSettings(params = {}) {
  const response = await api.get(base, { params });
  return response.data;
}
export async function fetchUsVisaKpiTargetHistory(params = {}) {
  const response = await api.get(`${base}/history`, { params });
  return response.data;
}
export async function saveUsVisaKpiTarget(body) {
  const response = await api.post(base, body);
  return response.data;
}
