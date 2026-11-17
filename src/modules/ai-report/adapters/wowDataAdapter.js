/**
 * AI Report Adapter: WoW Report Data Access
 * 
 * Strict Isolation: Authorized Read-Only access to existing PMS WoW KPI APIs.
 * Does not mutate database records or alter KPI formulas.
 */

import {
  getCallKpis,
  getCallSkills,
  getEmailKpis,
  getQualityAuditKpis,
  getOccupancyKpis,
  getUtilizationKpis,
  getAbsenteeismKpis,
} from "@/lib/axios/kpis";

export {
  SOURCE_OPTIONS,
  PERIOD_OPTIONS,
  getTaskOrderOptions,
  getTaskOrderLabel,
  getSkillOptions,
  getSkillLabel,
  getCountryOptions,
  getCountryLabel,
} from "@/config/kpiFiltersConfig";

/**
 * Fetch Call KPIs in read-only mode for AI Report analysis.
 */
export async function fetchAiCallKpis(params) {
  try {
    const res = await getCallKpis(params);
    return { success: true, data: res };
  } catch (err) {
    return {
      success: false,
      error: err?.response?.data?.message || err?.message || "Failed to load call KPIs",
      data: null,
    };
  }
}

/**
 * Fetch Email KPIs in read-only mode for AI Report analysis.
 */
export async function fetchAiEmailKpis(params) {
  try {
    const res = await getEmailKpis(params);
    return { success: true, data: res };
  } catch (err) {
    return {
      success: false,
      error: err?.response?.data?.message || err?.message || "Failed to load email KPIs",
      data: null,
    };
  }
}

/**
 * Fetch Quality Audit KPIs in read-only mode for AI Report analysis.
 */
export async function fetchAiQualityAuditKpis(params) {
  try {
    const res = await getQualityAuditKpis(params);
    return { success: true, data: res };
  } catch (err) {
    return {
      success: false,
      error: err?.response?.data?.message || err?.message || "Failed to load QA KPIs",
      data: null,
    };
  }
}

/**
 * Fetch Occupancy & HC KPIs in read-only mode for AI Report analysis.
 */
export async function fetchAiOccupancyKpis(params) {
  try {
    const [occupancyRes, utilizationRes, absenteeismRes] = await Promise.all([
      getOccupancyKpis(params).catch(() => null),
      getUtilizationKpis(params).catch(() => null),
      getAbsenteeismKpis(params).catch(() => null),
    ]);

    return {
      success: true,
      data: {
        occupancy: occupancyRes,
        utilization: utilizationRes,
        absenteeism: absenteeismRes,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err?.response?.data?.message || err?.message || "Failed to load occupancy KPIs",
      data: null,
    };
  }
}

/**
 * Fetch available Call Skills list for filters.
 */
export async function fetchAiCallSkills(params = { onlySkillStatistics: true }) {
  try {
    const res = await getCallSkills(params);
    return Array.isArray(res) ? res : [];
  } catch (err) {
    console.error("Failed to fetch AI call skills list:", err);
    return [];
  }
}
