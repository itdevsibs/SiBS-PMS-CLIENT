// Canonical repository tool choices by the selected raw-data category.
// The Email export is from MS Dynamics even when historical batches use
// source_system=EMAIL and profile_code=US_VISA_EMAIL_RAW_DATA.
const ALL_TOOLS = Object.freeze(["Fusecom", "FuseNet", "HeroDash", "MS Dynamics", "Quality Audit"]);

export const REPOSITORY_TOOLS_BY_LEVEL = Object.freeze({
  ALL: ALL_TOOLS,
  "CALL REPORT (EOD)": ["Fusecom", "FuseNet", "HeroDash"],
  "SKILL STATISTICS": ["Fusecom", "FuseNet", "HeroDash"],
  "CHAT REPORT (EOD)": ["Fusecom", "FuseNet", "HeroDash"],
  "AGENT OCCUPANCY": ["Fusecom", "FuseNet", "HeroDash"],
  "AGENT ACTIVITY - PRODUCTIVE BREAKS": ["HeroDash"],
  "AGENT PERFORMANCE BY SKILL": ["HeroDash"],
  "EMAIL LEVEL": ["MS Dynamics"],
  "QUALITY AUDIT": ["Quality Audit"],
});

export function getRepositoryToolsForLevel(level) {
  return REPOSITORY_TOOLS_BY_LEVEL[level] || ALL_TOOLS;
}

export function normalizeRepositoryTool(input) {
  const value = String(input || "").trim().toUpperCase();
  if (!value || value === "ALL" || value === "ALL TOOLS") return "ALL";
  if (value.includes("DYNAMICS") || value === "EMAIL") return "MS Dynamics";
  if (value.includes("FUSENET")) return "FuseNet";
  if (value.includes("FUSECOM")) return "Fusecom";
  if (value.includes("HERO")) return "HeroDash";
  if (value.includes("QUALITY")) return "Quality Audit";
  return "ALL";
}

export function getRepositoryToolForUpload(upload = {}) {
  // Use source/profile identifiers, not filename text (which is user-controlled).
  const identity = `${upload.importProfileCode || ""} ${upload.sourceSystem || ""} ${upload.sourceLabel || ""} ${upload.cardId || ""}`.toUpperCase();
  if (identity.includes("EMAIL") || identity.includes("DYNAMICS") || String(upload.groupLabel || "").toUpperCase() === "EMAIL LEVEL") return "MS Dynamics";
  if (identity.includes("QUALITY") || String(upload.groupLabel || "").toUpperCase() === "QUALITY AUDIT") return "Quality Audit";
  if (identity.includes("FUSENET")) return "FuseNet";
  if (identity.includes("FUSECOM")) return "Fusecom";
  if (identity.includes("HERO")) return "HeroDash";
  return "Other";
}


// The report type describes WHAT was uploaded; the tool describes WHERE it came
// from. Prefer approved import-profile metadata over a user-supplied filename.
// Preserve distinct labels for retired historical imports.
const REPOSITORY_REPORT_TYPES = Object.freeze([
  ["PERFORMANCE_BY_SKILL", "Agent Performance By Skill"],
  ["PRODUCTIVE_BREAKS", "Agent Activity – Productive Breaks"],
  ["SKILL_STATISTICS", "Skill Statistics"],
  ["SERVICE_/_QUEUE_LEVEL", "Skill Statistics"],
  ["AGENT_LEVEL", "Agent Level (Legacy)"],
  ["CALL_REPORT", "Calls EOD"],
  ["CALL_EOD", "Calls EOD"],
  ["CHAT_REPORT", "Chat EOD"],
  ["CHAT_EOD", "Chat EOD"],
  ["AGENT_OCCUPANCY", "Agent Occupancy"],
  ["OCCUPANCY", "Agent Occupancy"],
  ["EMAIL", "Email Raw Data"],
  ["QUALITY_AUDIT", "Quality Audit"],
]);

export function getRepositoryReportTypeForUpload(upload = {}) {
  const metadata = [
    upload.importProfileCode,
    upload.groupLabel,
    upload.importProfileName,
    upload.rawDataTitle,
  ];
  for (const value of metadata) {
    const normalized = String(value || "")
      .trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    if (!normalized) continue;
    for (const [pattern, label] of REPOSITORY_REPORT_TYPES) {
      if (normalized.includes(pattern)) return label;
    }
  }
  return "Other Import";
}
