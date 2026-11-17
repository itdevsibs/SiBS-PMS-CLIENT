/**
 * AI Report Adapter: Workforce Management Data Access
 * 
 * Strict Isolation: Authorized Read-Only access to Employee Master Data Ledger
 * and Staffing Requirements.
 * Mutations (CSV uploads, employee record updates, saving/deleting staffing targets)
 * are NOT exposed or allowed through this adapter.
 */

import {
  fetchMasterDataLedger,
  fetchMasterDataAccounts,
  fetchMasterDataTaskOrders,
} from "@/lib/axios/masterdata";

import {
  getStaffingRequirements,
  getStaffingRequirementHistory,
  getStaffingDailyCoverage,
  getStaffingTaskOrders,
} from "@/lib/axios/staffing-requirements";

/**
 * Fetch Employee Master Data Ledger records in read-only mode.
 */
export async function fetchAiEmployeeLedger(params = {}) {
  try {
    const res = await fetchMasterDataLedger(params);
    return {
      success: true,
      data: res?.data || (Array.isArray(res) ? res : []),
      pagination: res?.pagination || null,
      summary: res?.summary || null,
    };
  } catch (err) {
    return {
      success: false,
      error: err?.response?.data?.message || err?.message || "Failed to load employee ledger data",
      data: [],
      pagination: null,
      summary: null,
    };
  }
}

/**
 * Fetch authorized Master Data accounts for filters.
 */
export async function fetchAiMasterDataAccounts() {
  try {
    const res = await fetchMasterDataAccounts();
    return Array.isArray(res) ? res : [];
  } catch {
    return [];
  }
}

/**
 * Fetch authorized Master Data task orders for filters.
 */
export async function fetchAiMasterDataTaskOrders(account) {
  try {
    const res = await fetchMasterDataTaskOrders(account);
    return Array.isArray(res) ? res : [];
  } catch {
    return [];
  }
}

/**
 * Fetch Staffing Requirements targets in read-only mode.
 */
export async function fetchAiStaffingRequirements(params = {}) {
  try {
    const res = await getStaffingRequirements(params);
    return {
      success: true,
      data: res?.data || (Array.isArray(res) ? res : []),
    };
  } catch (err) {
    return {
      success: false,
      error: err?.response?.data?.message || err?.message || "Failed to load staffing requirements",
      data: [],
    };
  }
}

/**
 * Fetch Daily Coverage calculations (Required HC vs Scheduled Actual HC) read-only.
 */
export async function fetchAiStaffingDailyCoverage(params = {}) {
  try {
    const res = await getStaffingDailyCoverage(params);
    return {
      success: true,
      data: res?.data || res || {},
    };
  } catch (err) {
    return {
      success: false,
      error: err?.response?.data?.message || err?.message || "Failed to load staffing daily coverage",
      data: null,
    };
  }
}

/**
 * Fetch available Task Orders for Staffing Requirements.
 */
export async function fetchAiStaffingTaskOrders() {
  try {
    const res = await getStaffingTaskOrders();
    return Array.isArray(res) ? res : [];
  } catch {
    return [];
  }
}

/**
 * Fetch Staffing Requirements historical revisions read-only.
 */
export async function fetchAiStaffingHistory(params = {}) {
  try {
    const res = await getStaffingRequirementHistory(params);
    return {
      success: true,
      data: Array.isArray(res) ? res : (res?.data || []),
    };
  } catch {
    return { success: false, data: [] };
  }
}
