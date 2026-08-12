// Defines WFM raw data card names and stable card IDs.
export const accountOptions = [
  "US VISA",
  "YUM-DEL",
  "Account 1",
  "Account 2",
  "Account 3",
  "Account 4",
  "Account 5",
];

const defaultRawDataTitles = Array.from(
  { length: 15 },
  (_, index) => `Raw Data ${index + 1}`,
);

// Account-specific labels shown on the WFM raw data upload cards.
const accountRawDataTitles = {
  "US VISA": [
    "PMIS",
    "ESWA",
    "Mongolia",
    "PAC",
    "EURECA",
    "SEURECA",
    "NEA",
    "NICE",
    "SEA",
    "SAMI",
    "CHIPS",
    "SEASIA",
    "CESCAN",
    "NESAMI",
    "Raw Data 15",
  ],
};

function slugifyAccount(account) {
  return String(account || "").toLowerCase().replace(/[^a-z0-9]/g, "-");
}

function getAccountTitles(account) {
  return accountRawDataTitles[account] || defaultRawDataTitles;
}

// Builds stable card IDs used to connect uploads, dashboard imports, and graphs.
export function getRawDataCards(account) {
  if (!account || account === "All Accounts") {
    return [];
  }

  return getAccountTitles(account).map((title, index) => ({
    key: `raw-data-${index + 1}`,
    title,
    id: `${slugifyAccount(account)}-raw-data-${index + 1}`,
    account,
  }));
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
