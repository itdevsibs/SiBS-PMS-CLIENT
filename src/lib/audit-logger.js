// Utility for managing audit trail logs recorded in localStorage.
import { getAuthUser, getAuthDisplayName } from "./auth";

export const AUDIT_STORAGE_KEY = "frontsteps_audit_trail_logs";
export const AUDIT_LOG_ADDED_EVENT = "frontsteps-audit-log-added";

/**
 * Returns all recorded audit logs from localStorage (newest first).
 */
export function getStoredAuditLogs() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to parse audit logs from storage:", error);
    return [];
  }
}

/**
 * Formats a date into "Oct 20, 2026, 11:24:18 AM"
 */
export function formatAuditTimestamp(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

/**
 * Resolves Kronos ID from user object.
 */
export function resolveKronosId(user = getAuthUser()) {
  if (!user) return "—";
  return String(
    user.gy_emp_code ||
      user.kronosId ||
      user.kronos_id ||
      user.sibs_id ||
      user.sibsId ||
      user.employeeCode ||
      user.employee_code ||
      user.employeeId ||
      user.gy_emp_id ||
      "—"
  ).trim();
}

/**
 * Resolves Employee Name from user object.
 */
export function resolveEmployeeName(user = getAuthUser()) {
  if (!user) return "Unknown User";
  return getAuthDisplayName(user);
}

/**
 * Appends a new audit log entry and notifies listeners.
 *
 * @param {Object} options
 * @param {string} options.action - e.g. "Login", "Logout", "Create", "Update", "Delete", etc.
 * @param {string} options.module - e.g. "Authentication", "Data Management", etc.
 * @param {string} [options.description] - What was done
 * @param {Object} [options.user] - Optional explicit user object (defaults to authUser)
 * @param {string} [options.employeeName]
 * @param {string} [options.kronosId]
 */
export function recordAuditLog({
  action,
  module = "Authentication",
  description = "",
  user = null,
  employeeName = "",
  kronosId = "",
  recordId = "",
} = {}) {
  if (typeof window === "undefined") return null;

  try {
    const targetUser = user || getAuthUser();
    const finalName = employeeName || resolveEmployeeName(targetUser);
    const finalKronosId = kronosId || resolveKronosId(targetUser);
    const now = new Date();

    const newLog = {
      id: `AUD-${now.getFullYear()}-${String(Date.now()).slice(-6)}`,
      timestamp: formatAuditTimestamp(now),
      rawDate: now.toISOString(),
      employeeName: finalName,
      kronosId: finalKronosId,
      action: action || "Activity",
      module: module || "System",
      description: description || `${action} action in ${module}`,
      recordId: recordId || "",
    };

    const existing = getStoredAuditLogs();
    // Keep up to 500 recent audit logs
    const updated = [newLog, ...existing].slice(0, 500);

    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(updated));

    window.dispatchEvent(
      new CustomEvent(AUDIT_LOG_ADDED_EVENT, { detail: newLog })
    );

    return newLog;
  } catch (error) {
    console.error("Failed to record audit log:", error);
    return null;
  }
}

