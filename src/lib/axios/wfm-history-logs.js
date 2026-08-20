// API helpers for database-backed WFM history logs.
import { getAuthDisplayName, getAuthUser } from "@/lib/auth";
import api from "./api-template";

function getEmployeeId(user = {}) {
  return (
    user.gy_emp_id ||
    user.gyEmpId ||
    user.employeeId ||
    user.sibs_id ||
    user.sibsId ||
    user.username ||
    user.id ||
    null
  );
}

function withCurrentUser(payload = {}) {
  const user = getAuthUser() || {};

  return {
    ...payload,
    userId: payload.userId || getEmployeeId(user),
    userName: payload.userName || getAuthDisplayName(user),
    userEmail: payload.userEmail || user.email || null,
  };
}

export async function fetchWfmHistoryLogs({
  date,
  account,
  action,
  search,
  page = 1,
  limit = 20,
} = {}) {
  const response = await api.get("/wfm/history-logs", {
    params: {
      date: date || undefined,
      account: account && account !== "All Accounts" ? account : undefined,
      action: action && action !== "All Actions" ? action : undefined,
      search: search || undefined,
      page,
      limit,
    },
  });

  return response.data;
}

export async function clearWfmHistoryLogs() {
  const response = await api.delete("/wfm/history-logs");

  return response.data;
}

export async function recordWfmHistoryLog(payload = {}) {
  const response = await api.post("/wfm/history-logs", withCurrentUser(payload));

  return response.data;
}

export function recordWfmHistoryLogQuietly(payload = {}) {
  return recordWfmHistoryLog(payload).catch((error) => {
    console.warn(
      "Failed to record WFM history log:",
      error?.response?.data || error?.message || error,
    );
  });
}

export function recordWfmLogout() {
  const user = getAuthUser() || {};
  const userName = getAuthDisplayName(user);
  const employeeId = getEmployeeId(user);

  return recordWfmHistoryLog({
    action: "logout",
    account: "WFM",
    rawDataTitle: "Authentication",
    message: "logout",
    userId: employeeId,
    userName,
    userEmail: user.email || null,
  });
}
