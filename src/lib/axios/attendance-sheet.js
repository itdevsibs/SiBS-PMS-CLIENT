import api from "./api-template";

function unwrap(response) {
  return response?.data || {};
}

export async function fetchAttendanceSheetStatus() {
  const response = await api.get("/kronos/status");
  return unwrap(response);
}

export async function fetchAttendanceSheetAccounts() {
  const response = await api.get("/kronos/accounts");
  return unwrap(response);
}

export async function fetchAttendancePreview(params = {}) {
  const response = await api.get("/kronos/attendance/preview", { params });
  return unwrap(response);
}

export async function fetchAttendanceTrackerHistory(params = {}) {
  const response = await api.get("/kronos/tracker-history/preview", { params });
  return unwrap(response);
}

export async function fetchLiveAttendanceSheet(params = {}) {
  const response = await api.get("/kronos/attendance/live", { params });
  return unwrap(response);
}
