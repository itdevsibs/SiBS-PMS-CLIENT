import api from './api-template';

export async function getStaffingRequirements(params) {
  const response = await api.get('/wfm/staffing-requirements', { params });
  return response.data?.data || [];
}
export async function getStaffingRequirementHistory(params) {
  const response = await api.get('/wfm/staffing-requirements/history', { params });
  return response.data?.data || [];
}
export async function getStaffingDailyCoverage(params) {
  const response = await api.get('/wfm/staffing-requirements/coverage', { params });
  return response.data?.data || null;
}
export async function saveStaffingRequirements(entries, reason = '') {
  const response = await api.post('/wfm/staffing-requirements/bulk', { entries, reason });
  return response.data;
}

export async function deleteStaffingRequirements(entries, reason = '') {
  const response = await api.delete('/wfm/staffing-requirements', { data: { entries, reason } });
  return response.data;
}

export async function getStaffingTaskOrders() {
  const response = await api.get('/wfm/staffing-requirements/task-orders');
  return response.data?.data || [];
}
