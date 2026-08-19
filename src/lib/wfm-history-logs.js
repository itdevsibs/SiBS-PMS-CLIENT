// Stores WFM import, graph, and removal history in local storage and database.
import { recordWfmHistoryLog } from "./axios/wfm-history-logs";

const WFM_HISTORY_LOGS_KEY = "sibs-wfm-history-logs";

export function readWfmHistoryLogs() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const logs = JSON.parse(window.localStorage.getItem(WFM_HISTORY_LOGS_KEY) || "[]");

    return Array.isArray(logs) ? logs : [];
  } catch {
    return [];
  }
}

export function addWfmHistoryLog({
  action,
  fileName,
  rawDataTitle,
  account,
  message,
  userName,
  userEmail,
  userId,
}) {
  if (typeof window === "undefined") {
    return;
  }

  const timestamp = new Date();
  const nextLog = {
    id: `wfm-log-${timestamp.getTime()}-${Math.random().toString(36).slice(2)}`,
    action,
    account,
    date: timestamp.toISOString().slice(0, 10),
    fileName,
    message,
    rawDataTitle,
    userName: userName || "User",
    userEmail: userEmail || null,
    userId: userId || null,
    timestamp: timestamp.toISOString(),
  };

  try {
    window.localStorage.setItem(
      WFM_HISTORY_LOGS_KEY,
      JSON.stringify([nextLog, ...readWfmHistoryLogs()]),
    );
  } catch (error) {
    console.error("Failed to write WFM history log to localStorage:", error);
  }

  // Persist to database asynchronously
  recordWfmHistoryLog({
    action,
    account,
    rawDataTitle,
    fileName,
    message,
    userName: userName || "User",
    userEmail: userEmail || null,
    userId: userId || null,
    logDate: nextLog.date,
  }).catch((error) => {
    console.warn("Failed to persist WFM history log to database:", error?.response?.data || error?.message || error);
  });
}
