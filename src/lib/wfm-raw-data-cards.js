// Defines WFM raw data card names and stable card IDs.
export const accountOptions = [
  "US VISA",
  "YUM-DEL",
];

const defaultRawDataTitles = Array.from(
  { length: 15 },
  (_, index) => `Raw Data ${index + 1}`,
);

// Account-specific cards shown on the WFM raw data upload cards.
const accountRawDataCards = {
  "US VISA": [
    {
      title: "Fusecom Skill Statistics",
      sourceLabel: "Fusecom",
      groupLabel: "SERVICE / QUEUE LEVEL",
      taskOrders: ["Seurica", "Nice"],
      importProfileCode: "FUSECOM_SKILL_STATISTICS_INBOUND",
    },
    {
      title: "HeroDash Skill Statistics",
      sourceLabel: "HeroDash",
      groupLabel: "SERVICE / QUEUE LEVEL",
      taskOrders: ["Seasia", "Pac"],
      importProfileCode: "HERO_SKILL_STATISTICS_INBOUND",
    },
    {
      title: "Fusecom Agent Level",
      sourceLabel: "Fusecom",
      groupLabel: "AGENT LEVEL",
      taskOrders: ["Seurica", "Nice"],
      importProfileCode: "FUSECOM_AGENT_LEVEL",
    },
    {
      title: "FuseNet Agent Level",
      sourceLabel: "FuseNet",
      groupLabel: "AGENT LEVEL",
      taskOrders: ["Nesami"],
      importProfileCode: "FUSENET_AGENT_LEVEL",
    },
    {
      title: "HeroDash Agent Level",
      sourceLabel: "HeroDash",
      groupLabel: "AGENT LEVEL",
      taskOrders: ["Seasia", "Pac"],
      importProfileCode: "HERODASH_AGENT_LEVEL",
    },
  ],
  "YUM-DEL": [
    "Raw Data 1",
    "Raw Data 2",
    "Raw Data 3",
  ],
};

function slugifyAccount(account) {
  return String(account || "").toLowerCase().replace(/[^a-z0-9]/g, "-");
}

function getAccountTitles(account) {
  return (accountRawDataCards[account] || defaultRawDataTitles).map((card) =>
    typeof card === "string" ? card : card.title,
  );
}

export function getRawDataCardByImportProfileCode(importProfileCode) {
  const profileCode = String(importProfileCode || "").trim();

  if (!profileCode) {
    return null;
  }

  for (const account of accountOptions) {
    const card = getRawDataCards(account).find(
      (item) => item.importProfileCode === profileCode,
    );

    if (card) return card;
  }

  return null;
}

// Builds stable card IDs used to connect uploads, dashboard imports, and graphs.
export function getRawDataCards(account) {
  if (!account || account === "All Accounts") {
    return [];
  }

  return (accountRawDataCards[account] || defaultRawDataTitles).map((card, index) => {
    const title = typeof card === "string" ? card : card.title;

    return {
    key: `raw-data-${index + 1}`,
    title,
    id: `${slugifyAccount(account)}-raw-data-${index + 1}`,
    account,
    sourceLabel: typeof card === "string" ? title : card.sourceLabel || title,
    groupLabel: typeof card === "string" ? null : card.groupLabel || null,
    taskOrders: Array.isArray(card.taskOrders) ? card.taskOrders : [],
    importProfileCode:
      typeof card === "string" ? null : card.importProfileCode || null,
    };
  });
}

// Resolves old saved graph card IDs back into the visible raw data title.
export function getRawDataTitleFromCardId(cardId, fallbackTitle = "") {
  const safeCardId = String(cardId || "");
  const rawDataMatch = safeCardId.match(/^(.*)-raw-data-(\d+)$/);

  if (!rawDataMatch) {
    return fallbackTitle || "";
  }

  const [, accountSlug, indexText] = rawDataMatch;
  const index = Number(indexText) - 1;
  const matchingAccount = accountOptions.find(
    (account) => slugifyAccount(account) === accountSlug,
  );

  if (!matchingAccount) {
    return fallbackTitle || "";
  }

  return getAccountTitles(matchingAccount)[index] || fallbackTitle || "";
}
