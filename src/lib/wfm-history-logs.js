// Stores WFM import, graph, and removal history in local storage.
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

export function addWfmHistoryLog({ action, fileName, rawDataTitle, account, message }) {
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
    timestamp: timestamp.toISOString(),
  };

  window.localStorage.setItem(
    WFM_HISTORY_LOGS_KEY,
    JSON.stringify([nextLog, ...readWfmHistoryLogs()]),
  );
}
