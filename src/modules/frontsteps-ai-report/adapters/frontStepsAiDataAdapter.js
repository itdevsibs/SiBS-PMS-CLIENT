/**
 * FrontSteps AI Report Data Adapter
 * Strictly formats authorized read-only data for UI presentation.
 * Never invents mock metrics if backend has no records.
 */

export function getFsAiPolicyPreviewUrl(id) {
  if (!id) return "#";
  return `/api/frontsteps/ai-report/policies/${id}/preview`;
}

function resolveCrmMetric(scorecardMetrics = [], metricCode) {
  if (!Array.isArray(scorecardMetrics)) return null;
  return scorecardMetrics.find((m) => m.metricCode === metricCode) || null;
}

function formatCrmDocumentationRate(populatedCount, closedCases, metric) {
  if (metric && metric.actualValue !== null && metric.actualValue !== undefined && metric.status !== "NO_DATA") {
    const val = Number(metric.actualValue);
    if (Number.isFinite(val)) return `${val.toFixed(2)}%`;
  }
  const closed = Number(closedCases || 0);
  const populated = Number(populatedCount || 0);
  if (closed <= 0) return "N/A";
  return `${((populated / closed) * 100).toFixed(2)}%`;
}

export function adaptSummaryData(response = {}) {
  const summary = response.summary || {};
  const calls = summary.calls || response.calls || {};
  const cases = summary.cases || response.cases || {};
  const scorecard = summary.scorecard || { metrics: [], finalKpiScore: null };
  const scorecardMetrics = Array.isArray(scorecard.metrics) ? scorecard.metrics : [];
  const intervals = response.intervals || {};
  const biHourlyRows = Array.isArray(intervals.seriesBiHourly) ? intervals.seriesBiHourly : [];
  const halfHourRows = Array.isArray(intervals.series30Min) ? intervals.series30Min : [];
  const dailyRows = Array.isArray(intervals.seriesDaily) ? intervals.seriesDaily : [];
  const intervalData = biHourlyRows.length > 0 ? biHourlyRows : (response.intervalPerformance?.data || []);

  const topDriversRaw = Array.isArray(response.topDrivers)
    ? response.topDrivers
    : Array.isArray(response.topCaseDrivers)
      ? response.topCaseDrivers
      : [];

  const resolutionMetric = resolveCrmMetric(scorecardMetrics, "CRM_RESOLUTION");
  const subCodeMetric = resolveCrmMetric(scorecardMetrics, "CRM_SUB_CODE_COMPLETION");
  const summaryMetric = resolveCrmMetric(scorecardMetrics, "CRM_SUMMARY_COMPLETION");

  return {
    hasPublishedSnapshot: Boolean(response.hasPublishedSnapshot),
    hasImportedData:
      Boolean(response.hasImportedData) ||
      Number(calls.offered || 0) > 0 ||
      Number(cases.totalCases || 0) > 0,
    period: response.reportingPeriod || response.period || "monthly",
    periodWindow: response.periodWindow || null,
    scopeFilter: response.scopeFilter || null,
    message:
      response.message ||
      (response.hasPublishedSnapshot === false && response.period ? "No Report Available for Selected Filters" : null),
    unavailableDetail: response.unavailableDetail || null,
    snapshot: response.snapshot || null,
    policyContext: response.policyContext || null,
    executionReadiness: response.executionReadiness || {
      state: response.hasPublishedSnapshot ? "VERIFIED" : "NOT_CALCULATED",
      blockingReasons: [],
      incompletenessReasons: [],
      warnings: [],
    },
    verification: response.verification || null,
    diagnostics: response.diagnostics || {},
    sourceWatermark: response.sourceWatermark || null,
    hermesCallsCount: Number(response.hermesCallsCount || 0),
    // Call telemetry
    callsOffered: calls.offered || 0,
    callsHandled: calls.answered ?? calls.handled ?? 0,
    callsAbandoned: calls.abandoned || 0,
    unansweredNonQueued: calls.unansweredNonQueued || 0,
    answerRate: calls.answerRate || "N/A",
    abandonRate: calls.abandonRate || "N/A",
    averageSpeedOfAnswer: calls.asaFormatted || calls.averageSpeedOfAnswer || "N/A",
    averageHandleTime: calls.ahtFormatted || calls.averageHandleTime || "N/A",
    ahtCompliancePercent:
      calls.ahtCompliancePercent !== null && calls.ahtCompliancePercent !== undefined
        ? `${calls.ahtCompliancePercent}%`
        : "N/A",
    // Case telemetry
    totalCases: cases.totalCases || 0,
    closedCases: cases.closedCases || 0,
    openCases: cases.openCases || 0,
    closedSlaRate: cases.closedSlaRate || "N/A",
    backlogRate: cases.backlogRate || "N/A",
    agingBands: {
      lt1Day: cases.lt1Day || 0,
      oneToTwoDays: cases.oneToTwoDays || 0,
      gt2Days: cases.gt2Days || 0,
      closedWithin2Days: cases.closedWithin2Days || 0,
    },
    repeatOpenCases: cases.repeatOpenCases ?? null,
    repeatOpenStatus: cases.repeatOpenStatus || "UNAVAILABLE",
    crmDocumentation: {
      resolutionPopulated: Number(cases.resolutionPopulated || 0),
      resolutionRate: formatCrmDocumentationRate(cases.resolutionPopulated, cases.closedCases, resolutionMetric),
      resolutionMetric,
      subCodesPopulated: Number(cases.subCodesPopulated || 0),
      subCodeRate: formatCrmDocumentationRate(cases.subCodesPopulated, cases.closedCases, subCodeMetric),
      subCodeMetric,
      summaryPopulated: Number(cases.summaryPopulated || 0),
      summaryRate: formatCrmDocumentationRate(cases.summaryPopulated, cases.closedCases, summaryMetric),
      summaryMetric,
    },
    // Policy-driven Scorecard
    scorecardMetrics,
    finalKpiScore: scorecard.finalKpiScore || null,
    // Drivers
    topCaseDrivers: topDriversRaw.map((d) => ({
      label: d.driver || d.label || "Unspecified",
      count: Number(d.totalCount ?? d.count ?? 0),
      closedCount: Number(d.closedCount ?? 0),
      openCount: Number(d.openCount ?? 0),
      percentage: d.percentage || "0.0%",
    })),
    // DST-aware Intervals
    intervalPerformance: {
      isAvailable: intervalData.length > 0 || halfHourRows.length > 0 || dailyRows.length > 0,
      seriesBiHourly: biHourlyRows,
      series30Min: halfHourRows,
      seriesDaily: dailyRows,
      data: intervalData,
      timezoneMode:
        intervalData[0]?.timezoneConversionMode ||
        dailyRows[0]?.timezoneConversionMode ||
        halfHourRows[0]?.timezoneConversionMode ||
        null,
      timezoneConfidence:
        intervalData[0]?.timezoneConfidence ||
        dailyRows[0]?.timezoneConfidence ||
        halfHourRows[0]?.timezoneConfidence ||
        "UNCONFIRMED",
    },
    isSibsOnly: Boolean(response.isSibsOnly || summary.isSibsOnly),
    reportingScope: response.reportingScope || "SIBS_EMPLOYEES_ONLY",
    scopeLabel: response.scopeLabel || "SiBS FrontSteps Team",
    hermesStatus: response.hermesStatus || { ready: true, policyEvaluationConnected: true },
  };
}

export function adaptAccountKpiData(response = {}) {
  const callQueues = Array.isArray(response.accountKpi?.callQueues)
    ? response.accountKpi.callQueues
    : Array.isArray(response.queues)
      ? response.queues
      : [];
  const caseChannels = Array.isArray(response.accountKpi?.caseChannels)
    ? response.accountKpi.caseChannels
    : [];
  const availableFilters = response.availableFilters || {};

  return {
    hasPublishedSnapshot: Boolean(response.hasPublishedSnapshot),
    hasImportedData:
      Boolean(response.hasImportedData) ||
      callQueues.length > 0 ||
      caseChannels.length > 0,
    account: response.account || response.scopeFilter || "FrontSteps Support",
    period: response.reportingPeriod || response.period || "monthly",
    periodWindow: response.periodWindow || null,
    scopeFilter: response.scopeFilter || null,
    message:
      response.message ||
      (response.hasPublishedSnapshot === false && response.period ? "No Report Available for Selected Filters" : null),
    unavailableDetail: response.unavailableDetail || null,
    hasData: callQueues.length > 0 || caseChannels.length > 0 || Boolean(response.hasData),
    snapshot: response.snapshot || null,
    policyContext: response.policyContext || null,
    executionReadiness: response.executionReadiness || {
      state: response.hasPublishedSnapshot ? "VERIFIED" : "NOT_CALCULATED",
      blockingReasons: [],
      incompletenessReasons: [],
      warnings: [],
    },
    verification: response.verification || null,
    diagnostics: response.diagnostics || {},
    sourceWatermark: response.sourceWatermark || null,
    hermesCallsCount: Number(response.hermesCallsCount || 0),
    availableFilters: {
      callQueues: Array.isArray(availableFilters.callQueues)
        ? availableFilters.callQueues
        : callQueues.map((q) => q.queueName).filter(Boolean),
      caseQueues: Array.isArray(availableFilters.caseQueues)
        ? availableFilters.caseQueues
        : [...new Set(caseChannels.map((c) => c.queueName).filter(Boolean))],
      caseOrigins: Array.isArray(availableFilters.caseOrigins)
        ? availableFilters.caseOrigins
        : [...new Set(caseChannels.map((c) => c.caseOrigin).filter(Boolean))],
    },
    activeFilters: response.activeFilters || {
      period: response.reportingPeriod || response.period || "monthly",
      account: response.account || "all",
      caseQueue: response.caseQueue || "all",
      caseOrigin: response.caseOrigin || "all",
    },
    callSummary: response.summary?.calls || null,
    caseSummary: response.summary?.cases || null,
    isCallScopeFiltered: Boolean(response.summary?.isCallScopeFiltered),
    isCaseScopeFiltered: Boolean(response.summary?.isCaseScopeFiltered),
    scorecardMetrics: Array.isArray(response.summary?.scorecard?.metrics)
      ? response.summary.scorecard.metrics
      : [],
    finalKpiScore: response.summary?.scorecard?.finalKpiScore || null,
    isSibsOnly: Boolean(response.isSibsOnly || response.summary?.isSibsOnly),
    reportingScope: response.reportingScope || "SIBS_EMPLOYEES_ONLY",
    scopeLabel: response.scopeLabel || "SiBS FrontSteps Team",
    callQueues,
    caseChannels,
    queues: callQueues,
    totalQueues: callQueues.length,
    totalChannels: caseChannels.length,
  };
}

function isRosterVerificationRequiredEmployee(emp = {}) {
  return (
    emp.availabilityStatus === "ROSTER_VERIFICATION_REQUIRED" ||
    emp.identityCategory === "ROSTER_VERIFICATION_REQUIRED" ||
    emp.identityCategory === "ACTIVE_DIRECTORY_STALLED_TRACKER" ||
    emp.hasStalledTracker === true
  );
}

function resolveClientAvailabilityStatus(emp = {}) {
  if (emp.availabilityStatus) return emp.availabilityStatus;
  if (isRosterVerificationRequiredEmployee(emp)) return "ROSTER_VERIFICATION_REQUIRED";
  if (emp.hasAliasMapping === false || emp.identityCategory === "MISSING_ALIAS_ACTIVE_FS") {
    return "ACTIVE_MISSING_SOURCE_ALIAS";
  }
  const hasCalls = Number(emp.calls?.offered || 0) > 0;
  const hasCases =
    Number(emp.cases?.attributedClosedCasesModifiedBy || 0) > 0 ||
    Number(emp.cases?.informationalOwnedClosedCases || 0) > 0 ||
    Number(emp.cases?.totalCases || 0) > 0;
  if (emp.calls !== undefined && emp.cases !== undefined && !hasCalls && !hasCases) {
    return "ACTIVE_NO_SOURCE_RECORDS";
  }
  return "VERIFIED_ACTIVE_FRONTSTEPS";
}

export const FRONTSTEPS_CANONICAL_SIBS_ID_MAP = {
  "1403": "5515", // Angelito Romero: 1403 is Kronos gy_emp_id, 5515 is SIBS ID
  "1603": "5689", // Senate Stefane Toning: 1603 is Kronos gy_emp_id, 5689 is SIBS ID
};

export function resolveCanonicalSibsId(sibsId) {
  const sid = String(sibsId || "").trim();
  return FRONTSTEPS_CANONICAL_SIBS_ID_MAP[sid] || sid;
}

export function deduplicateFrontStepsEmployees(employees = []) {
  if (!Array.isArray(employees)) return [];
  const map = new Map();
  for (const emp of employees) {
    if (!emp) continue;
    const rawSid = String(emp.sibsId || emp.kronosEmpCode || "").trim();
    if (!rawSid) continue;
    const canonicalSid = resolveCanonicalSibsId(rawSid);
    if (!map.has(canonicalSid)) {
      const normalizedEmp =
        rawSid !== canonicalSid
          ? {
              ...emp,
              sibsId: canonicalSid,
              kronosEmpCode: canonicalSid,
              aliasSibsId: rawSid,
            }
          : emp;
      map.set(canonicalSid, normalizedEmp);
    } else {
      const existing = map.get(canonicalSid);
      if (existing.sibsId !== canonicalSid && rawSid === canonicalSid) {
        map.set(canonicalSid, {
          ...existing,
          ...emp,
          sibsId: canonicalSid,
          kronosEmpCode: canonicalSid,
          aliasSibsId: existing.sibsId,
        });
      }
    }
  }
  return Array.from(map.values());
}

export const FRONTSTEPS_CLIENT_TENURE_REGISTRY = {
  "3463": { name: "JEAZAER MEA CAÑEDO", start: "2021-06-14", end: null, status: "ACTIVE", site: "Tagum" },
  "3566": { name: "JAYRIN GEVEROLA", start: "2021-07-28", end: "2024-12-13", status: "INACTIVE_SEPARATED", site: "Tagum" },
  "3707": { name: "ALE MACMOD", start: "2021-10-05", end: "2026-08-14", status: "TRANSFERRED", site: "Tagum" },
  "4143": { name: "JEAN MARIE CASTRO", start: "2022-03-09", end: null, status: "TRANSFERRED", site: "Tagum" },
  "4604": { name: "GLENN EDMUND LORIA", start: "2022-09-26", end: null, status: "TRANSFERRED", site: "Tagum" },
  "5179": { name: "DAPHNE IGDANES", start: "2023-03-27", end: null, status: "TRANSFERRED", site: "Tagum" },
  "5206": { name: "LESLIE JOY PATRICIO", start: "2023-04-11", end: null, status: "ACTIVE", site: "Davao" },
  "5515": { name: "ANGELITO ROMERO", start: "2023-08-21", end: null, status: "TRANSFERRED", site: "Tagum" },
  "1403": { name: "ANGELITO ROMERO", start: "2023-08-21", end: null, status: "TRANSFERRED", site: "Tagum" },
  "5631": { name: "HAZELOU ITOM", start: "2023-10-16", end: "2026-01-30", status: "INACTIVE_SEPARATED", site: "Tagum" },
  "5669": { name: "NIKKI BAGAIPO", start: "2023-12-11", end: "2025-03-06", status: "INACTIVE_SEPARATED", site: "Tagum" },
  "5689": { name: "SENATE STEFANE TONING", start: "2023-12-18", end: "2024-09-03", status: "INACTIVE_SEPARATED", site: "Tagum" },
  "1603": { name: "SENATE STEFANE TONING", start: "2023-12-18", end: "2024-09-03", status: "INACTIVE_SEPARATED", site: "Tagum" },
  "6115": { name: "JEFFERSON MASAMAYOR", start: "2024-11-11", end: "2024-11-11", status: "INACTIVE_SEPARATED", site: "Tagum" },
  "6226": { name: "ALAN BRIONES", start: "2025-01-13", end: "2025-01-28", status: "INACTIVE_SEPARATED", site: "Tagum" },
  "6228": { name: "SESEL EUPALAO", start: "2025-01-13", end: "2025-01-15", status: "INACTIVE_SEPARATED", site: "Tagum" },
  "6519": { name: "ARVIN ENLAHOSTA", start: "2025-09-30", end: "2026-05-22", status: "INACTIVE_SEPARATED", site: "Tagum" },
  "6632": { name: "JASMEN MIQUE", start: "2026-02-16", end: "2026-03-31", status: "INACTIVE_SEPARATED", site: "Tagum" },
  "6649": { name: "REYENA FLOR ALEÑAR", start: "2026-02-23", end: "2026-03-11", status: "INACTIVE_SEPARATED", site: "Tagum" },
  "6687": { name: "DYAN VALERY KABIGTING", start: "2026-03-16", end: "2026-08-10", status: "INACTIVE_SEPARATED", site: "Tagum" },
  "6750": { name: "APRIL ANGEL ELEGUIR", start: "2026-06-09", end: "2026-07-10", status: "INACTIVE_SEPARATED", site: "Tagum" },
  "6754": { name: "ISAGANI CABALLEJO", start: "2026-06-09", end: null, status: "ACTIVE", site: "Tagum" },
  "6756": { name: "JAMES ROLLAN ROSALES", start: "2026-05-18", end: "2026-05-20", status: "INACTIVE_SEPARATED", site: "Tagum" },
  "6855": { name: "CARLO CRISANTO BONDOC", start: "2026-07-20", end: null, status: "VERIFICATION_REQUIRED", site: "Davao" },
  "6858": { name: "CHESTER JAMES LLANOS", start: "2026-07-20", end: "2026-08-11", status: "INACTIVE_SEPARATED", site: "Davao" },
  "6859": { name: "AIRA KRYSTELLE SANDING", start: "2026-07-20", end: "2026-10-02", status: "INACTIVE_SEPARATED", site: "Davao" },
  "6860": { name: "LERRY JEN PERIDA", start: "2026-07-20", end: "2026-09-10", status: "INACTIVE_SEPARATED", site: "Davao" },
  "6861": { name: "JANRIVIN DELA TORRE", start: "2026-07-20", end: "2026-07-20", status: "INACTIVE_SEPARATED", site: "Davao" },
  "6863": { name: "ROSUEL ALIDO", start: "2026-07-20", end: null, status: "ACTIVE", site: "Davao" },
  "6887": { name: "SHELLA MAE TIMTIM", start: "2026-08-24", end: null, status: "ACTIVE", site: "Davao" },
  "6888": { name: "MHITOS LEVITA LARA", start: "2026-08-24", end: "2026-09-08", status: "INACTIVE_SEPARATED", site: "Davao" },
};

export function resolveClientEmploymentStatus(emp = {}) {
  const sid = String(emp.sibsId || emp.kronosEmpCode || "").trim();
  const cat = String(emp.identityCategory || "").toUpperCase();
  const avail = String(emp.availabilityStatus || "").toUpperCase();
  const reason = String(emp.reason || "").toLowerCase();

  if (
    emp.rosterVerificationRequired ||
    avail === "ROSTER_VERIFICATION_REQUIRED" ||
    cat === "ACTIVE_DIRECTORY_STALLED_TRACKER" ||
    cat === "ACTIVE_DIRECTORY_ZERO_SCHEDULE_UNVERIFIED" ||
    sid === "6855"
  ) {
    return "VERIFICATION_REQUIRED";
  }

  if (
    avail === "VERIFIED_ACTIVE_FRONTSTEPS" ||
    avail === "ACTIVE_MISSING_SOURCE_ALIAS" ||
    avail === "ACTIVE_NO_SOURCE_RECORDS" ||
    cat === "VERIFIED_ACTIVE_FRONTSTEPS" ||
    cat === "MISSING_ALIAS_ACTIVE_FS" ||
    ["3463", "5206", "6754", "6863", "6887"].includes(sid)
  ) {
    return "ACTIVE";
  }

  if (
    reason.includes("team leader") ||
    reason.includes("non-agent kronos role") ||
    reason.includes("account='none'") ||
    reason.includes("transferred") ||
    ["3707", "4604", "5179", "1403", "5515", "4143"].includes(sid)
  ) {
    return "TRANSFERRED";
  }

  return "INACTIVE_SEPARATED";
}

export function getClientBadgeLabel(status) {
  switch (status) {
    case "ACTIVE": return "Active";
    case "VERIFICATION_REQUIRED": return "Verification Required";
    case "TRANSFERRED": return "Transferred";
    case "INACTIVE_SEPARATED": return "Inactive / Separated";
    default: return status || "Unknown";
  }
}

export function resolveClientAssignmentPeriod(emp = {}) {
  const sid = String(emp.sibsId || emp.kronosEmpCode || "").trim();
  const reg = FRONTSTEPS_CLIENT_TENURE_REGISTRY[sid];
  if (reg) {
    if (reg.end) return `${reg.start || "N/A"} to ${reg.end}`;
    if (reg.status === "ACTIVE") return `${reg.start || "N/A"} to Present`;
    if (reg.status === "VERIFICATION_REQUIRED") return `${reg.start || "N/A"} to Present (Held)`;
    if (reg.status === "TRANSFERRED") return `${reg.start || "N/A"} to Transferred`;
    return `${reg.start || "N/A"} to Inactive`;
  }
  const start = emp.hireDate || emp.accJoinDate || "N/A";
  const end = emp.separatedDate || emp.lastWorkingDay || null;
  if (end) return `${start} to ${end}`;
  const status = resolveClientEmploymentStatus(emp);
  if (status === "ACTIVE") return `${start} to Present`;
  if (status === "VERIFICATION_REQUIRED") return `${start} to Present (Held)`;
  if (status === "TRANSFERRED") return `${start} to Transferred`;
  return `${start} to Inactive`;
}

function adaptDirectoryEntry(emp = {}) {
  const sid = String(emp.sibsId || emp.kronosEmpCode || "").trim();
  const status = emp.employmentStatus || resolveClientEmploymentStatus(emp);
  const badgeLabel = emp.statusBadgeLabel || getClientBadgeLabel(status);
  const assignmentPeriod = emp.assignmentPeriod || resolveClientAssignmentPeriod(emp);

  return {
    ...emp,
    sibsId: sid,
    kronosEmpCode: emp.kronosEmpCode || sid,
    employeeName: emp.employeeName || `Agent #${sid}`,
    employmentStatus: status,
    statusBadgeLabel: badgeLabel,
    assignmentPeriod,
    siteName: emp.siteName || (FRONTSTEPS_CLIENT_TENURE_REGISTRY[sid]?.site || "Tagum"),
    isWfh: Boolean(emp.isWfh),
    taskOrder: emp.taskOrder || "N/A (FrontSteps Resident Support)",
    availabilityStatus: emp.availabilityStatus || status,
    hasAliasMapping: emp.hasAliasMapping !== false,
    hasStalledTracker: Boolean(emp.hasStalledTracker),
    calls: emp.calls || {
      offered: null,
      answered: null,
      abandoned: null,
      asaSeconds: null,
      ahtSeconds: null,
      ahtCompliancePercent: null,
    },
    cases: emp.cases || {
      attributedClosedCasesModifiedBy: emp.historicalClosedCasesModifiedByCount || 0,
      informationalOwnedClosedCases: emp.historicalOwnedClosedCasesCount || 0,
    },
    kpis: emp.kpis || {
      AHT: { status: "NO_DATA", rawValue: null, targetValue: 900, weightPercent: 10, weightedScore: null, blockingReason: "Not on Account: Employee was not active on FrontSteps during reporting period." },
      AHT_COMPLIANCE: { status: "NO_DATA", rawValue: null, targetValue: 80, weightPercent: 15, weightedScore: null, blockingReason: "Not on Account: Employee was not active on FrontSteps during reporting period." },
      CASES_CLOSED: { status: "BLOCKED", rawValue: null, targetValue: 140, weightPercent: 45, weightedScore: null, blockingReason: "Cases Closed KPI scoring is BLOCKED: Certified closure event evidence required." },
      CRM_RESOLUTION: { status: "NO_DATA", rawValue: null, targetValue: 100, weightPercent: 10, weightedScore: null, blockingReason: "Not on Account: Employee was not active on FrontSteps during reporting period." },
      CRM_SUB_CODE_COMPLETION: { status: "NO_DATA", rawValue: null, targetValue: 95, weightPercent: 10, weightedScore: null, blockingReason: "Not on Account: Employee was not active on FrontSteps during reporting period." },
      CRM_SUMMARY_COMPLETION: { status: "NO_DATA", rawValue: null, targetValue: 95, weightPercent: 10, weightedScore: null, blockingReason: "Not on Account: Employee was not active on FrontSteps during reporting period." },
    },
    finalKpiScore: emp.finalKpiScore || {
      status: "BLOCKED",
      score: null,
      blockingReason: "Final KPI Score blocked: incomplete components (CASES_CLOSED).",
      pmpClassification: "PENDING_INCOMPLETE_DATA",
    },
    isHistorical: Boolean(emp.isHistorical || status === "INACTIVE_SEPARATED" || status === "TRANSFERRED"),
    isOnAccountInPeriod: Boolean(emp.isOnAccountInPeriod !== undefined ? emp.isOnAccountInPeriod : (status === "ACTIVE" || sid === "6859")),
  };
}

function buildClientUnifiedDirectory({ verifiedEmployees = [] } = {}) {
  const dir = [];
  const seenCanonicalIds = new Set();

  for (const emp of verifiedEmployees) {
    const rawSid = String(emp.sibsId || emp.kronosEmpCode || "").trim();
    if (!rawSid) continue;
    const canonicalSid = resolveCanonicalSibsId(rawSid);
    if (seenCanonicalIds.has(canonicalSid)) continue;
    seenCanonicalIds.add(canonicalSid);
    dir.push(adaptDirectoryEntry({ ...emp, sibsId: canonicalSid, kronosEmpCode: canonicalSid, employmentStatus: "ACTIVE", statusBadgeLabel: "Active" }));
  }

  dir.sort((a, b) => String(a.employeeName || "").localeCompare(String(b.employeeName || "")));
  return dir;
}

export function adaptPmpPipData(response = {}) {
  const indKpi = response.individualKpi || {};
  const rawEmployees = Array.isArray(indKpi.employees)
    ? indKpi.employees
    : Array.isArray(response.employees)
      ? response.employees
      : [];

  const backendIssues = Array.isArray(indKpi.identityVerificationIssues)
    ? indKpi.identityVerificationIssues
    : [];

  const verifiedEmployees = [];
  const quarantinedMap = new Map();

  for (const issue of backendIssues) {
    const key = String(issue.sibsId || issue.kronosEmpCode || issue.employeeName || quarantinedMap.size);
    quarantinedMap.set(key, {
      ...issue,
      availabilityStatus: issue.availabilityStatus || "ROSTER_VERIFICATION_REQUIRED",
    });
  }

  for (const emp of rawEmployees) {
    if (isRosterVerificationRequiredEmployee(emp)) {
      const key = String(emp.sibsId || emp.kronosEmpCode || emp.employeeName || quarantinedMap.size);
      if (!quarantinedMap.has(key)) {
        quarantinedMap.set(key, {
          ...emp,
          availabilityStatus: "ROSTER_VERIFICATION_REQUIRED",
          excludedFromScorecards: true,
          individualScoresWithheld: true,
          issueCode: "ROSTER_VERIFICATION_REQUIRED",
          reason:
            (Array.isArray(emp.identityStatusNotes) ? emp.identityStatusNotes[0] : emp.identityStatusNotes) ||
            "Active in Kronos directory (account_id=64), but attendance and CRM activity halted mid-period with open scheduled shifts and no HR separation/leave record. Individual scores withheld pending HR/Ops confirmation.",
        });
      }
    } else {
      verifiedEmployees.push({
        ...emp,
        availabilityStatus: resolveClientAvailabilityStatus(emp),
      });
    }
  }

  const identityVerificationIssues = Array.from(quarantinedMap.values());
  const excludedEmployees = (Array.isArray(indKpi.excludedEmployees) ? indKpi.excludedEmployees : []).map((ex) => ({
    ...ex,
    availabilityStatus:
      ex.availabilityStatus ||
      (ex.isExternalActor ? "VERIFIED_EXTERNAL_OR_NON_SIBS" : "VERIFIED_INACTIVE_OR_SEPARATED"),
  }));

  const hasAnyInputData = Boolean(
    response.hasPublishedSnapshot ||
    response.hasImportedData ||
    rawEmployees.length > 0 ||
    backendIssues.length > 0 ||
    (Array.isArray(indKpi.excludedEmployees) && indKpi.excludedEmployees.length > 0) ||
    (Array.isArray(indKpi.directory) && indKpi.directory.length > 0)
  );

  const backendDirectory = Array.isArray(indKpi.directory)
    ? indKpi.directory
    : Array.isArray(response.directory)
      ? response.directory
      : null;

  const rawDirectory = !hasAnyInputData
    ? []
    : backendDirectory && backendDirectory.length > 0
      ? backendDirectory
          .map(adaptDirectoryEntry)
          .filter((e) => e.employmentStatus === "ACTIVE" || e.availabilityStatus === "VERIFIED_ACTIVE_FRONTSTEPS" || e.availabilityStatus === "ACTIVE_MISSING_SOURCE_ALIAS" || e.availabilityStatus === "ACTIVE_NO_SOURCE_RECORDS")
      : buildClientUnifiedDirectory({ verifiedEmployees });

  const directory = deduplicateFrontStepsEmployees(rawDirectory);

  const availableFilters = response.availableFilters || {};

  return {
    hasPublishedSnapshot: Boolean(response.hasPublishedSnapshot),
    hasImportedData:
      Boolean(response.hasImportedData) ||
      verifiedEmployees.length > 0 ||
      identityVerificationIssues.length > 0 ||
      directory.length > 0,
    period: response.reportingPeriod || response.period || "monthly",
    periodWindow: response.periodWindow || null,
    scopeFilter: response.scopeFilter || null,
    message:
      response.message ||
      (response.hasPublishedSnapshot === false && response.period ? "No Report Available for Selected Filters" : null),
    unavailableDetail: response.unavailableDetail || null,
    employees: verifiedEmployees,
    directory,
    allEmployees: directory,
    identityVerificationIssues,
    selectedEmployeeExcludedForVerification: Boolean(indKpi.selectedEmployeeExcludedForVerification),
    selectedUnverifiedEmployee: indKpi.selectedUnverifiedEmployee || null,
    excludedEmployees,
    totalRosterCount: verifiedEmployees.length || response.totalRosterCount || 0,
    totalDirectoryCount: directory.length,
    unmappedTopCallOwners: Array.isArray(indKpi.unmappedTopCallOwners) ? indKpi.unmappedTopCallOwners : [],
    unmappedTopCaseModifiers: Array.isArray(indKpi.unmappedTopCaseModifiers) ? indKpi.unmappedTopCaseModifiers : [],
    actorReconciliation: indKpi.actorReconciliation || response.executionReadiness?.actorReconciliation || null,
    identityReconciliation: indKpi.identityReconciliation || null,
    aliasIdMismatches: Array.isArray(indKpi.aliasIdMismatches) ? indKpi.aliasIdMismatches : [],
    availableFilters: {
      employees: Array.isArray(availableFilters.employees)
        ? availableFilters.employees
        : verifiedEmployees.map((emp) => ({
            sibsId: emp.sibsId,
            kronosEmpCode: emp.kronosEmpCode,
            employeeName: emp.employeeName,
            siteName: emp.siteName || null,
            identityCategory: emp.identityCategory || null,
            availabilityStatus: emp.availabilityStatus || null,
            hasAliasMapping: emp.hasAliasMapping !== false,
            hasStalledTracker: Boolean(emp.hasStalledTracker),
          })),
      directoryEmployees: directory.map((emp) => ({
        sibsId: emp.sibsId,
        kronosEmpCode: emp.kronosEmpCode,
        employeeName: emp.employeeName,
        siteName: emp.siteName || null,
        employmentStatus: emp.employmentStatus,
        statusBadgeLabel: emp.statusBadgeLabel,
        availabilityStatus: emp.availabilityStatus || null,
      })),
      sites: Array.isArray(availableFilters.sites)
        ? availableFilters.sites
        : [...new Set(directory.map((emp) => emp.siteName).filter(Boolean))],
    },
    activeFilters: response.activeFilters || {
      period: response.reportingPeriod || response.period || "monthly",
      employeeId: response.employeeId || "all",
      site: response.site || "all",
    },
    snapshot: response.snapshot || null,
    policyContext: response.policyContext || null,
    scorecard: response.summary?.scorecard || { metrics: [], finalKpiScore: null },
    pmpPipGovernance: response.pmpPipGovernance || {
      isEvaluationReady: Boolean(response.hasPublishedSnapshot && response.executionReadiness?.state === "EXECUTION_READY"),
      message:
        response.executionReadiness?.incompletenessReasons?.[0] ||
        "Verified snapshot data loaded; incomplete proration/attribution blocks Final KPI Score.",
    },
    executionReadiness: response.executionReadiness || {
      state: response.hasPublishedSnapshot ? "VERIFIED" : "NOT_CALCULATED",
      blockingReasons: [],
      incompletenessReasons: [],
      warnings: [],
    },
    verification: response.verification || null,
    diagnostics: response.diagnostics || {},
    sourceWatermark: response.sourceWatermark || null,
    hermesCallsCount: Number(response.hermesCallsCount || 0),
  };
}

export function adaptPoliciesData(response = {}) {
  const rawList = Array.isArray(response.data) ? response.data : [];

  const policies = rawList.map((doc) => ({
    ...doc,
    previewUrl: getFsAiPolicyPreviewUrl(doc.id),
    fileSizeFormatted: formatFileSize(doc.fileSize),
    policyVersionId: doc.policyVersionId || null,
    isEligibleCurrent: Boolean(doc.isEligibleCurrent),
    extractionStatus: doc.extractionStatus || "NOT_EXTRACTED",
    extractedPagesCount: Number(doc.extractedPagesCount || 0),
    extractedTablesCount: Number(doc.extractedTablesCount || 0),
    extractedChunksCount: Number(doc.extractedChunksCount || 0),
    lastExtractedAtFormatted: formatDateString(doc.lastExtractedAt),
    hermesExtracted: Boolean(doc.hermesExtracted),
  }));

  const overview = response.overview || {};

  return {
    policies,
    total: response.total || policies.length,
    page: response.page || 1,
    limit: response.limit || 20,
    totalPages: response.totalPages || 1,
    overview: {
      totalVersions: overview.totalVersions || 0,
      extractedVersions: overview.extractedVersions || 0,
      processingVersions: overview.processingVersions || 0,
      needsAttentionVersions: overview.needsAttentionVersions || 0,
    },
  };
}

export function formatFileSize(bytes) {
  if (!bytes || isNaN(bytes)) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDateString(dateVal) {
  if (!dateVal) return "—";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return String(dateVal);
  }
}

export function adaptPolicySyncStatus(response = {}) {
  const summary = response.summary || {};
  const latestRun = response.latestRun || {};

  return {
    isRunning: Boolean(response.isRunning),
    activeRun: response.activeRun || null,
    latestRun: response.latestRun || null,
    summary: {
      uniqueDocuments: summary.uniqueDocuments || 0,
      totalPolicyVersions: summary.totalPolicyVersions || 0,
      currentEligibleCount: summary.currentEligibleCount || 0,
      missingFromSourceCount: summary.missingFromSourceCount || 0,
    },
    lastSyncedAtFormatted: latestRun.started_at
      ? formatDateString(latestRun.started_at)
      : "Never",
    latestRunStatus: latestRun.run_status || "UNKNOWN",
  };
}

export function adaptPolicyVersionsData(response = {}) {
  const rawList = Array.isArray(response.data) ? response.data : [];

  const versions = rawList.map((v) => ({
    id: v.id,
    sourcePolicyId: v.source_policy_id,
    documentCode: v.document_code,
    title: v.policy_title,
    category: v.policy_category,
    revisionNumber: v.revision_number,
    verifiedChecksum: v.verified_checksum,
    checksumShort: v.verified_checksum ? `${v.verified_checksum.substring(0, 8)}...` : "—",
    fileName: v.file_name,
    fileSize: v.file_size,
    fileSizeFormatted: formatFileSize(v.file_size),
    approvalStatus: v.source_approval_status,
    isCurrentInSource: Boolean(v.source_is_current),
    isEligibleCurrent: Boolean(v.is_eligible_current),
    sourceAvailability: v.source_availability,
    archiveReference: v.archive_reference,
    archiveStatus: v.archive_status,
    versionNotes: v.version_notes,
    discoveredAtFormatted: formatDateString(v.discovered_at),
    createdAtFormatted: formatDateString(v.created_at),
  }));

  return {
    versions,
    total: response.total || versions.length,
  };
}

export function adaptPolicyVersionHistoryData(response = {}) {
  const rawVersions = Array.isArray(response.versions) ? response.versions : [];
  const rawEvents = Array.isArray(response.events) ? response.events : [];

  const versions = rawVersions.map((v) => ({
    id: v.id,
    sourcePolicyId: v.source_policy_id,
    documentCode: v.document_code,
    title: v.policy_title,
    category: v.policy_category,
    revisionNumber: v.revision_number,
    verifiedChecksum: v.verified_checksum,
    checksumShort: v.verified_checksum ? `${v.verified_checksum.substring(0, 8)}...` : "—",
    fileName: v.file_name,
    fileSize: v.file_size,
    fileSizeFormatted: formatFileSize(v.file_size),
    approvalStatus: v.source_approval_status,
    isCurrentInSource: Boolean(v.source_is_current),
    isEligibleCurrent: Boolean(v.is_eligible_current),
    sourceAvailability: v.source_availability,
    archiveReference: v.archive_reference,
    archiveStatus: v.archive_status,
    versionNotes: v.version_notes,
    createdAtFormatted: formatDateString(v.created_at),
    discoveredAtFormatted: formatDateString(v.discovered_at),
  }));

  const events = rawEvents.map((e) => {
    let parsedMeta = null;
    try {
      parsedMeta = typeof e.event_metadata === "string" ? JSON.parse(e.event_metadata) : e.event_metadata;
    } catch {
      parsedMeta = e.event_metadata;
    }

    return {
      id: e.id,
      eventType: e.event_type,
      documentCode: e.document_code,
      policyVersionId: e.policy_version_id,
      previousState: typeof e.previous_state === "string" ? JSON.parse(e.previous_state || "{}") : e.previous_state,
      newState: typeof e.new_state === "string" ? JSON.parse(e.new_state || "{}") : e.new_state,
      metadata: parsedMeta,
      createdAtFormatted: formatDateString(e.created_at),
    };
  });

  return {
    documentCode: response.documentCode || "",
    versions,
    events,
  };
}

export function adaptExtractionRunData(response = {}) {
  const run = response.data?.run || response.run || response.data || {};
  return {
    id: run.id,
    policyVersionId: run.policy_version_id,
    documentCode: run.document_code,
    revisionNumber: run.revision_number,
    archiveChecksum: run.archive_checksum,
    parserVersion: run.parser_version,
    status: run.status || "NOT_EXTRACTED",
    startedAtFormatted: formatDateString(run.started_at),
    completedAtFormatted: formatDateString(run.completed_at),
    durationMs: run.duration_ms,
    durationFormatted: run.duration_ms ? `${(run.duration_ms / 1000).toFixed(2)}s` : "—",
    pageCount: Number(run.page_count || 0),
    processedPages: Number(run.processed_pages || 0),
    tableCount: Number(run.table_count || 0),
    chunkCount: Number(run.chunk_count || 0),
    warningCount: Number(run.warning_count || 0),
    warnings: Array.isArray(run.warnings_json) ? run.warnings_json : [],
    errorSummary: run.error_summary || null,
  };
}

export function adaptPolicyPagesData(response = {}) {
  const rawPages = Array.isArray(response.pages) ? response.pages : [];
  const run = response.run || {};

  const pages = rawPages.map((p) => {
    let structured = p.structured_content_json;
    if (typeof structured === "string") {
      try {
        structured = JSON.parse(structured);
      } catch {
        structured = null;
      }
    }

    let warnings = p.warnings_json;
    if (typeof warnings === "string") {
      try {
        warnings = JSON.parse(warnings);
      } catch {
        warnings = [];
      }
    }

    return {
      id: p.id,
      pageNumber: p.page_number,
      exactText: p.exact_text || "",
      headings: structured?.headings || [],
      formulas: structured?.formulas || [],
      tables: structured?.tables || [],
      charCount: Number(p.char_count || 0),
      wordCount: Number(p.word_count || 0),
      hasTables: Boolean(p.has_tables),
      hasFormulas: Boolean(p.has_formulas),
      extractionStatus: p.extraction_status || "READY",
      warnings: Array.isArray(warnings) ? warnings : [],
    };
  });

  return {
    total: response.total || pages.length,
    page: response.page || 1,
    limit: response.limit || 50,
    totalPages: response.totalPages || 1,
    pages,
    run: adaptExtractionRunData({ run }),
  };
}

export function adaptKnowledgeSearchResults(response = {}) {
  const rawResults = Array.isArray(response.results) ? response.results : [];

  return {
    query: response.query || "",
    total: response.total || rawResults.length,
    page: response.page || 1,
    limit: response.limit || 20,
    totalPages: response.totalPages || 1,
    results: rawResults.map((r) => ({
      chunkId: r.chunkId,
      policyVersionId: r.policyVersionId,
      documentCode: r.documentCode,
      policyTitle: r.policyTitle,
      revisionNumber: r.revisionNumber,
      isEligibleCurrent: Boolean(r.isEligibleCurrent),
      pageStart: r.pageStart,
      pageEnd: r.pageEnd,
      citation: r.citation,
      sectionTitle: r.sectionTitle,
      sectionType: r.sectionType,
      exactText: r.exactText,
    })),
  };
}

export function adaptInsightData(response = {}) {
  const ins = response?.insight || null;
  const findings = Array.isArray(ins?.findings)
    ? ins.findings.map((f) => {
        const rawEvidence = Array.isArray(f.resolved_evidence)
          ? f.resolved_evidence
          : Array.isArray(f.resolvedEvidence)
            ? f.resolvedEvidence
            : Array.isArray(f.evidence)
              ? f.evidence
              : [];

        const resolvedEvidence = rawEvidence.map((ev) => ({
          evidenceId: ev.evidence_id || ev.evidenceId || null,
          metricCode: ev.metric_code || ev.metricCode || "METRIC",
          metricLabel: ev.metric_label || ev.metricLabel || null,
          metricValue: ev.metric_value !== undefined ? ev.metric_value : ev.metricValue ?? null,
          formattedValue: ev.formatted_value || ev.formattedValue || null,
          unit: ev.unit || null,
          targetValue: ev.target_value !== undefined ? ev.target_value : ev.targetValue ?? null,
          formattedTarget: ev.formatted_target || ev.formattedTarget || null,
          targetUnit: ev.target_unit || ev.targetUnit || null,
          targetAttainment: ev.target_attainment || ev.targetAttainment || null,
          polarity: ev.polarity || null,
          weightPercent: ev.weight_percent !== undefined ? ev.weight_percent : ev.weightPercent ?? null,
          granularity: ev.granularity || null,
          aggregationType: ev.aggregation_type || ev.aggregationType || null,
          entityLabel: ev.entity_label || ev.entityLabel || null,
          snapshotReference: ev.snapshot_reference || ev.snapshotReference || "",
          policyRuleCode: ev.policy_rule_code || ev.policyRuleCode || null,
          supportingDocumentCodes: Array.isArray(ev.supporting_document_codes)
            ? ev.supporting_document_codes
            : Array.isArray(ev.supportingDocumentCodes)
              ? ev.supportingDocumentCodes
              : [],
          sourceStatus: ev.source_status || ev.sourceStatus || null,
        }));

        const policyRefs = Array.isArray(f.policy_references) && f.policy_references.length > 0
          ? f.policy_references
          : Array.isArray(f.policy_rule_codes)
            ? f.policy_rule_codes
            : Array.isArray(f.policyRuleCodes)
              ? f.policyRuleCodes
              : Array.isArray(f.policyReferences)
                ? f.policyReferences
                : [];

        const observationText = f.observation || f.explanation || "";
        return {
          category: f.category || "OPERATIONAL_PERFORMANCE",
          severity: f.severity || "INFO",
          claimType: f.claim_type || f.claimType || null,
          headline: f.headline || "Operational Finding",
          observation: observationText,
          explanation: observationText,
          evidenceIds: Array.isArray(f.evidence_ids)
            ? f.evidence_ids
            : Array.isArray(f.evidenceIds)
              ? f.evidenceIds
              : resolvedEvidence.map((ev) => ev.evidenceId).filter(Boolean),
          resolvedEvidence,
          evidence: resolvedEvidence,
          policyReferences: policyRefs,
          recommendation: f.recommendation || "",
          limitations: Array.isArray(f.limitations) ? f.limitations : [],
          semanticReview: f.semanticReview || null,
        };
      })
    : [];

  return {
    hasPublishedSnapshot: Boolean(response?.hasPublishedSnapshot),
    hasInsight: Boolean(response?.hasInsight && ins),
    hermesCallsCount: Number(response?.hermesCallsCount || 0),
    reportType: response?.reportType || null,
    period: response?.period || "monthly",
    scopeFilter: response?.scopeFilter || "all",
    scopeFingerprint: response?.scopeFingerprint || null,
    cacheFingerprint: response?.cacheFingerprint || null,
    snapshot: response?.snapshot || null,
    policySnapshot: response?.policySnapshot || null,
    unavailableReason: response?.unavailableReason || null,
    unavailableCode: response?.unavailableCode || null,
    canGenerateInsights: response?.canGenerateInsights !== false,
    activeJob: response?.activeJob || null,
    latestAttempt: response?.latestAttempt || null,
    insight: ins
      ? {
          id: ins.id,
          reportSnapshotId: ins.reportSnapshotId,
          policyRuleSnapshotId: ins.policyRuleSnapshotId,
          reportType: ins.reportType,
          reportingPeriod: ins.reportingPeriod,
          scopeFilter: ins.scopeFilter,
          schemaVersion: ins.schemaVersion || "3",
          promptVersion: ins.promptVersion || "v3.0",
          validatorVersion: ins.validatorVersion || null,
          validationStatus: ins.validationStatus || "VALIDATED",
          generationStatus: ins.generationStatus || "COMPLETED",
          isCurrentActive: Boolean(ins.isCurrentActive),
          versionNumber: Number(ins.versionNumber || 1),
          hermesModel: ins.hermesModel || "sibs-pms-analyst",
          policySnapshotCode: ins.policySnapshotCode || response?.policySnapshot?.snapshotCode || null,
          generatedAt: ins.generatedAt || null,
          generationDurationMs: ins.generationDurationMs || null,
          hasTrustworthyFindings:
            ins.hasTrustworthyFindings !== undefined
              ? Boolean(ins.hasTrustworthyFindings)
              : findings.length > 0,
          hasUnqualifiedTrustworthyFindings:
            ins.hasUnqualifiedTrustworthyFindings !== undefined
              ? Boolean(ins.hasUnqualifiedTrustworthyFindings)
              : ins.semanticReview
                ? !ins.semanticReview.hasFlaggedFindings && findings.length > 0
                : findings.length > 0,
          executiveSummary: ins.executiveSummary || "",
          findings,
          dataQualityWarnings: Array.isArray(ins.dataQualityWarnings) ? ins.dataQualityWarnings : [],
          overallLimitations: Array.isArray(ins.overallLimitations) ? ins.overallLimitations : [],
          limitationsCatalog: Array.isArray(ins.limitationsCatalog) ? ins.limitationsCatalog : [],
          validationReport: ins.validationReport || null,
          semanticReview: ins.semanticReview || null,
        }
      : null,
  };
}
