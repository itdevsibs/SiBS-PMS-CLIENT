// Defines WFM raw data card names and stable card IDs.
export const accountOptions = [
  "US VISA",
  "YOMDEL",
];

const defaultRawDataTitles = Array.from(
  { length: 15 },
  (_, index) => `Raw Data ${index + 1}`,
);

// Account-specific cards shown on the WFM raw data upload cards.
// Calls phase: Call Report (EOD) replaces Skill Statistics + Agent Level uploads.
const accountRawDataCards = {
  "US VISA": [
    {
      id: "call-report-eod-fusecom",
      title: "FuseCom",
      sourceLabel: "FuseCom",
      groupLabel: "CALL REPORT (EOD)",
      taskOrders: [
        { id: "TO12", label: "NICE" },
        { id: "TO16", label: "SEURECA" },
      ],
      importProfileCode: "FUSECOM_CALL_REPORT_EOD",
      fileExtension: ".xlsx",
      acceptedFileTypes: ".xlsx",
      requiresTaskOrderSelection: false,
    },
    {
      id: "call-report-eod-fusenet",
      title: "FuseNet",
      sourceLabel: "FuseNet",
      groupLabel: "CALL REPORT (EOD)",
      taskOrders: [
        { id: "TO14", label: "NESAMI" },
      ],
      importProfileCode: "FUSENET_CALL_REPORT_EOD",
      fileExtension: ".xlsx",
      acceptedFileTypes: ".xlsx",
      requiresTaskOrderSelection: false,
    },
    {
      id: "call-report-eod-herodash",
      title: "HeroDash",
      sourceLabel: "HeroDash",
      groupLabel: "CALL REPORT (EOD)",
      taskOrders: [
        { id: "TO4", label: "PAC" },
        { id: "TO10", label: "SEASIA" },
      ],
      importProfileCode: "HERODASH_CALL_REPORT_EOD",
      fileExtension: ".xlsx",
      acceptedFileTypes: ".xlsx",
      requiresTaskOrderSelection: true,
    },
    {
      id: "chat-report-eod-fusecom",
      title: "FuseCom",
      sourceLabel: "FuseCom",
      groupLabel: "CHAT REPORT (EOD)",
      taskOrders: [
        { id: "TO12", label: "NICE" },
        { id: "TO16", label: "SEURECA" },
      ],
      importProfileCode: "FUSECOM_CHAT_REPORT_EOD",
      fileExtension: ".xlsx",
      acceptedFileTypes: ".xlsx",
      requiresTaskOrderSelection: false,
    },
    {
      id: "chat-report-eod-fusenet",
      title: "FuseNet",
      sourceLabel: "FuseNet",
      groupLabel: "CHAT REPORT (EOD)",
      taskOrders: [
        { id: "TO14", label: "NESAMI" },
      ],
      importProfileCode: "FUSENET_CHAT_REPORT_EOD",
      fileExtension: ".xlsx",
      acceptedFileTypes: ".xlsx",
      requiresTaskOrderSelection: false,
    },
    {
      id: "chat-report-eod-herodash",
      title: "HeroDash",
      sourceLabel: "HeroDash",
      groupLabel: "CHAT REPORT (EOD)",
      taskOrders: [
        { id: "TO4", label: "PAC" },
        { id: "TO10", label: "SEASIA" },
      ],
      importProfileCode: "HERODASH_CHAT_REPORT_EOD",
      fileExtension: ".xlsx",
      acceptedFileTypes: ".xlsx",
      requiresTaskOrderSelection: true,
    },
    {
      id: "agent-occupancy-fusecom",
      title: "Fusecom Agent Occupancy",
      sourceLabel: "Fusecom",
      groupLabel: "AGENT OCCUPANCY",
      taskOrders: [
        { id: "TO12", label: "NICE" },
        { id: "TO16", label: "SEURECA" },
      ],
      importProfileCode: "FUSECOM_AGENT_OCCUPANCY",
      fileExtension: ".xlsx",
      // FuseCom Occupancy resolves each employee's active Task Order from the
      // employee ledger/scope resolver. Do not ask the uploader to choose one.
      requiresTaskOrderSelection: false,
    },
    {
      id: "agent-occupancy-fusenet",
      title: "FuseNet Agent Occupancy",
      sourceLabel: "FuseNet",
      groupLabel: "AGENT OCCUPANCY",
      taskOrders: [
        { id: "TO14", label: "NESAMI" },
      ],
      importProfileCode: "FUSENET_AGENT_OCCUPANCY",
      fileExtension: ".xlsx",
      // Resolve Task Order from the employee's verified active assignment.
      requiresTaskOrderSelection: false,
    },
    {
      id: "agent-occupancy-herodash",
      title: "HeroDash Agent Occupancy",
      sourceLabel: "HeroDash",
      groupLabel: "AGENT OCCUPANCY",
      taskOrders: [
        { id: "TO4", label: "PAC" },
        { id: "TO10", label: "SEASIA" },
      ],
      importProfileCode: "HERODASH_AGENT_OCCUPANCY",
      fileExtension: ".xlsx",
      requiresTaskOrderSelection: true,
      requiresReportingPeriod: false,
    },
    {
      id: "agent-activity-productive-breaks-herodash",
      title: "HeroDash",
      sourceLabel: "HeroDash",
      groupLabel: "AGENT ACTIVITY - PRODUCTIVE BREAKS",
      taskOrders: [],
      importProfileCode: "HERODASH_AGENT_ACTIVITY_PRODUCTIVE_BREAKS",
      fileExtension: ".xlsx",
      acceptedFileTypes: ".xlsx",
      requiresTaskOrderSelection: false,
      requiresReportingPeriod: false,
    },
    {
      id: "agent-performance-by-skill-herodash",
      title: "HeroDash",
      sourceLabel: "HeroDash",
      groupLabel: "AGENT PERFORMANCE BY SKILL",
      taskOrders: [],
      importProfileCode: "HERODASH_AGENT_PERFORMANCE_BY_SKILL",
      fileExtension: ".xlsx",
      acceptedFileTypes: ".xlsx",
      requiresTaskOrderSelection: false,
      // The exported report has no date column; store a user-confirmed date.
      requiresReportingPeriod: true,
    },
    {
      id: "email-raw-data",
      title: "Email Raw Data",
      sourceLabel: "Email",
      groupLabel: "EMAIL LEVEL",
      taskOrders: [
        { id: "TO4", label: "PAC" },
        { id: "TO10", label: "SEASIA" },
        { id: "TO12", label: "NICE" },
        { id: "TO14", label: "NESAMI" },
        { id: "TO16", label: "SEURECA" },
      ],
      importProfileCode: "US_VISA_EMAIL_RAW_DATA",
      fileExtension: ".xlsx",
      requiresTaskOrderSelection: true,
    },
    {
      id: "quality-audit",
      title: "Quality Audit",
      sourceLabel: "Quality Audit",
      groupLabel: "QUALITY AUDIT",
      taskOrders: [],
      importProfileCode: "US_VISA_QUALITY_AUDIT",
      fileExtension: ".xlsx",
      requiresTaskOrderSelection: false,
      requiresReportingPeriod: false,
    },
  ],
  "YOMDEL": [
    "Raw Data 1",
    "Raw Data 2",
    "Raw Data 3",
  ],
};

// History/repository records from the pre-EOD Calls pipeline remain resolvable
// even though these cards are no longer available for new uploads.
const legacyUsVisaPositionalTitles = [
  "Fusecom Skill Statistics",
  "HeroDash Skill Statistics",
  "Fusecom Agent Level",
  "FuseNet Agent Level",
  "HeroDash Agent Level",
  "Fusecom Agent Occupancy",
  "FuseNet Agent Occupancy",
  "HeroDash Agent Occupancy",
  "Email Raw Data",
  "Quality Audit",
  "FuseNet Skill Statistics",
];

const legacyUsVisaProfileCards = {
  FUSECOM_SKILL_STATISTICS_INBOUND: {
    id: "legacy-fusecom-skill-statistics",
    title: "Fusecom Skill Statistics",
    sourceLabel: "Fusecom",
    groupLabel: "SERVICE / QUEUE LEVEL",
  },
  FUSENET_SKILL_STATISTICS_INBOUND: {
    id: "legacy-fusenet-skill-statistics",
    title: "FuseNet Skill Statistics",
    sourceLabel: "FuseNet",
    groupLabel: "SERVICE / QUEUE LEVEL",
  },
  HERO_SKILL_STATISTICS_INBOUND: {
    id: "legacy-herodash-skill-statistics",
    title: "HeroDash Skill Statistics",
    sourceLabel: "HeroDash",
    groupLabel: "SERVICE / QUEUE LEVEL",
  },
  FUSECOM_AGENT_LEVEL: {
    id: "legacy-fusecom-agent-level",
    title: "Fusecom Agent Level",
    sourceLabel: "Fusecom",
    groupLabel: "AGENT LEVEL",
  },
  FUSENET_AGENT_LEVEL: {
    id: "legacy-fusenet-agent-level",
    title: "FuseNet Agent Level",
    sourceLabel: "FuseNet",
    groupLabel: "AGENT LEVEL",
  },
  HERODASH_AGENT_LEVEL: {
    id: "legacy-herodash-agent-level",
    title: "HeroDash Agent Level",
    sourceLabel: "HeroDash",
    groupLabel: "AGENT LEVEL",
  },
};

function slugifyAccount(account) {
  return String(account || "").toLowerCase().replace(/[^a-z0-9]/g, "-");
}

function getAccountTitles(account) {
  return (accountRawDataCards[account] || defaultRawDataTitles).map((card) =>
    typeof card === "string" ? card : card.title,
  );
}

function toCardShape(account, card, index) {
  const title = typeof card === "string" ? card : card.title;
  const configuredId = typeof card === "string" ? null : card.id;
  const accountSlug = slugifyAccount(account);
  const stableId = configuredId
    ? `${accountSlug}-${configuredId}`
    : `${accountSlug}-raw-data-${index + 1}`;

  return {
    key: configuredId || `raw-data-${index + 1}`,
    title,
    id: stableId,
    account,
    sourceLabel: typeof card === "string" ? title : card.sourceLabel || title,
    groupLabel: typeof card === "string" ? null : card.groupLabel || null,
    taskOrders: Array.isArray(card.taskOrders) ? card.taskOrders : [],
    importProfileCode:
      typeof card === "string" ? null : card.importProfileCode || null,
    fileExtension:
      typeof card === "string"
        ? null
        : card.fileExtension || (account === "US VISA" ? ".xlsx" : null),
    acceptedFileTypes:
      typeof card === "string"
        ? (account === "US VISA" ? ".xlsx,.csv" : ".xlsx,.xls,.csv")
        : card.acceptedFileTypes || (account === "US VISA" ? ".xlsx,.csv" : ".xlsx,.xls,.csv"),
    requiresTaskOrderSelection:
      typeof card === "string" ? false : Boolean(card.requiresTaskOrderSelection),
    requiresReportingPeriod:
      typeof card === "string" ? false : Boolean(card.requiresReportingPeriod),
  };
}

export function getRawDataCardByImportProfileCode(importProfileCode) {
  const profileCode = String(importProfileCode || "").trim();
  if (!profileCode) return null;

  for (const account of accountOptions) {
    const card = getRawDataCards(account).find(
      (item) => item.importProfileCode === profileCode,
    );
    if (card) return card;
  }

  const legacy = legacyUsVisaProfileCards[profileCode];
  if (!legacy) return null;

  return {
    ...legacy,
    id: `us-visa-${legacy.id}`,
    key: legacy.id,
    account: "US VISA",
    taskOrders: [],
    importProfileCode: profileCode,
    fileExtension: ".xlsx",
    acceptedFileTypes: ".xlsx,.csv",
    requiresTaskOrderSelection: false,
    requiresReportingPeriod: false,
    legacy: true,
  };
}

// Builds stable card IDs used to connect uploads, dashboard imports, and graphs.
export function getRawDataCards(account) {
  if (!account || account === "All Accounts") return [];

  return (accountRawDataCards[account] || defaultRawDataTitles).map((card, index) =>
    toCardShape(account, card, index),
  );
}

// Resolves old saved positional graph card IDs and the new stable card IDs.
export function getRawDataTitleFromCardId(cardId, fallbackTitle = "") {
  const safeCardId = String(cardId || "");

  for (const account of accountOptions) {
    const direct = getRawDataCards(account).find((card) => card.id === safeCardId);
    if (direct) return direct.title;
  }

  const rawDataMatch = safeCardId.match(/^(.*)-raw-data-(\d+)$/);
  if (!rawDataMatch) return fallbackTitle || "";

  const [, accountSlug, indexText] = rawDataMatch;
  const index = Number(indexText) - 1;
  const matchingAccount = accountOptions.find(
    (account) => slugifyAccount(account) === accountSlug,
  );

  if (!matchingAccount) return fallbackTitle || "";
  if (matchingAccount === "US VISA") {
    return legacyUsVisaPositionalTitles[index] || fallbackTitle || "";
  }
  return getAccountTitles(matchingAccount)[index] || fallbackTitle || "";
}
