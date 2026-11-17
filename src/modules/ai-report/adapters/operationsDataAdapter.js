/**
 * AI Report Adapter: Operations Tracking Data Access
 * 
 * Strict Isolation: Authorized Read-Only access to Occupancy, Attendance Sheet,
 * Calls Report, and Chat Reports.
 */

import {
  fetchAttendanceSheet,
  fetchAttendanceSheetAccounts,
  fetchAttendanceSheetStatus,
} from "@/lib/axios/attendance-sheet";

import {
  getCallsReport,
  getCallsReportSkills,
  getChatReport,
  getCallSkills,
} from "@/lib/axios/kpis";

/**
 * Fetch Occupancy Tracking records in read-only mode.
 */
export async function fetchAiOccupancyData() {
  try {
    const stored =
      localStorage.getItem("sibs-occupancy-records") ||
      localStorage.getItem("sibs-occupancy-data");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return { success: true, data: parsed };
      }
    }
    return { success: true, data: [] };
  } catch (err) {
    return {
      success: false,
      error: err?.message || "Failed to load occupancy data",
      data: [],
    };
  }
}

/**
 * Fetch Attendance Sheet records in read-only mode.
 */
export async function fetchAiAttendanceSheet(params = {}) {
  try {
    const res = await fetchAttendanceSheet(params);
    return {
      success: true,
      data: res?.data || (Array.isArray(res) ? res : []),
      pagination: res?.pagination || null,
      summary: res?.summary || null,
    };
  } catch (err) {
    return {
      success: false,
      error: err?.response?.data?.message || err?.message || "Failed to load attendance records",
      data: [],
      pagination: null,
      summary: null,
    };
  }
}

export async function fetchAiAttendanceAccounts() {
  try {
    const res = await fetchAttendanceSheetAccounts();
    return Array.isArray(res) ? res : [];
  } catch {
    return [];
  }
}

export async function fetchAiAttendanceStatus() {
  try {
    const res = await fetchAttendanceSheetStatus();
    return Array.isArray(res) ? res : [];
  } catch {
    return [];
  }
}

/**
 * Fetch Calls Report in read-only mode.
 */
export async function fetchAiCallsReport(params = {}) {
  try {
    const res = await getCallsReport(params);
    return {
      success: true,
      data: res?.data || (Array.isArray(res) ? res : []),
      summary: res?.summary || res?.totals || null,
      pagination: res?.pagination || null,
    };
  } catch (err) {
    return {
      success: false,
      error: err?.response?.data?.message || err?.message || "Failed to load calls report",
      data: [],
      summary: null,
      pagination: null,
    };
  }
}

export async function fetchAiCallsReportSkills() {
  try {
    const res = await getCallsReportSkills();
    return Array.isArray(res) ? res : [];
  } catch {
    return [];
  }
}

/**
 * Fetch Chat Reports in read-only mode.
 */
export async function fetchAiChatReport(params = {}) {
  try {
    const res = await getChatReport(params);
    return {
      success: true,
      data: res?.data || (Array.isArray(res) ? res : []),
      summary: res?.summary || res?.totals || null,
      pagination: res?.pagination || null,
    };
  } catch (err) {
    return {
      success: false,
      error: err?.response?.data?.message || err?.message || "Failed to load chat reports",
      data: [],
      summary: null,
      pagination: null,
    };
  }
}

export async function fetchAiChatSkills() {
  try {
    const res = await getCallSkills({ onlySkillStatistics: true });
    return Array.isArray(res) ? res : [];
  } catch {
    return [];
  }
}
