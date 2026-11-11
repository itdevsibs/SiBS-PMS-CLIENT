// Task Order Ledger API — uses existing credentialed Axios client.
import { apiGet, apiPost, apiPut } from './api';

const ROOT = '/wfm/task-order-ledger';
export async function fetchTaskOrderLedger({ taskOrder, country, skill, search } = {}) {
  const params = new URLSearchParams();
  if (taskOrder && taskOrder !== 'ALL' && taskOrder !== 'All Task Orders') params.set('taskOrder', taskOrder);
  if (country && country !== 'ALL' && country !== 'All Countries') params.set('country', country);
  if (skill && skill !== 'ALL' && skill !== 'All Skills') params.set('skill', skill);
  if (search?.trim()) params.set('search', search.trim());
  const suffix = params.toString();
  return apiGet(`${ROOT}${suffix ? `?${suffix}` : ''}`);
}
export const fetchTaskOrderManagement = () => apiGet(`${ROOT}/management`);
export const fetchTaskOrderHistory = (page = 1) => apiGet(`${ROOT}/history?page=${Number(page) || 1}`);
export const transferTaskOrderCountry = (body) => apiPost(`${ROOT}/country-transfer`, body);
export const createTaskOrderCountry = (body) => apiPost(`${ROOT}/countries`, body);
export const createTaskOrderSkill = (body) => apiPost(`${ROOT}/skills`, body);
export const updateTaskOrderSkill = (id, body) => apiPut(`${ROOT}/skills/${id}`, body);
export const createTaskOrderProfile = (body) => apiPost(`${ROOT}/profiles`, body);
export const updateTaskOrderProfile = (id, body) => apiPut(`${ROOT}/profiles/${id}`, body);
