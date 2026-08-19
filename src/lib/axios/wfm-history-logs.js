// API helpers for WFM database-backed history logs.
import api from "./api-template";

export async function fetchWfmHistoryLogs({ date, account, action, page = 1, limit = 50 } = {}) {
  const response = await api.get("/wfm/history-logs", {
    params: {
      date: date || undefined,
      account: account && account !== "All Accounts" ? account : undefined,
      action: action || undefined,
      page,
      limit,
    },
  });

  return response.data;
}

export async function recordWfmHistoryLog({
  action,
  account,
  rawDataTitle,
  fileName,
  message,
  userName,
  userEmail,
  userId,
  logDate,
}) {
  const response = await api.post("/wfm/history-logs", {
    action,
    account,
    rawDataTitle,
    fileName,
    message,
    userName,
    userEmail,
    userId,
    logDate,
  });

  return response.data;
}
