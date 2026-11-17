/**
 * AI Report Module Service
 * 
 * Central service interface for AI Report operations and future Hermes AI integration.
 * Defines reserved namespaces:
 *   Frontend: /ai-report/...
 *   Backend:  /api/ai-report/... (future backend endpoint contract)
 */

export const AI_REPORT_VERSION = "1.0.0";
export const HERMES_INTEGRATION_STATUS = {
  READY: "ready",
  STANDBY: "standby",
  CONNECTED: "connected",
};

/**
 * Reserved endpoint contract for future Hermes backend integration:
 * - GET  /api/ai-report/insights/:reportId
 * - POST /api/ai-report/policies/evaluate
 * - GET  /api/ai-report/policies/rules
 * - POST /api/ai-report/audit-logs
 * 
 * Note: These endpoints are reserved for future phases and not called yet.
 */
export const AI_BACKEND_CONTRACT = Object.freeze({
  BASE_URL: "/api/ai-report",
  ENDPOINTS: {
    INSIGHTS: "/api/ai-report/insights",
    POLICY_EVALUATION: "/api/ai-report/policies/evaluate",
    POLICY_RULES: "/api/ai-report/policies/rules",
    AUDIT_LOGS: "/api/ai-report/audit-logs",
  },
});

/**
 * Helper to generate isolated report metadata tags for telemetry/logging
 */
export function getAiReportMetadata(reportId, category) {
  return {
    module: "ai-report",
    reportId,
    category,
    version: AI_REPORT_VERSION,
    timestamp: new Date().toISOString(),
    hermesReady: true,
  };
}
