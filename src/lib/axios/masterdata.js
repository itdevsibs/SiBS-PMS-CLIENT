// API helper for Master Data & Employee Identity Ledger
import { apiGet, apiPut } from "./api";

export async function fetchMasterDataAccounts() {
  return apiGet("/masterdata/accounts");
}

export async function fetchMasterDataLedger({
  search = "",
  filter = "all",
  account = "",
  viewAll = false,
  page = 1,
  limit = 25,
  offset = 0,
  sortBy = "",
  sortOrder = "desc",
} = {}) {
  const params = new URLSearchParams();

  if (search) {
    params.set("search", search);
  }
  if (filter && filter !== "all") {
    params.set("filter", filter);
  }
  if (account) {
    params.set("account", account);
  }
  if (viewAll) {
    params.set("viewAll", "true");
  }
  if (sortBy) {
    params.set("sortBy", sortBy);
    params.set("sortOrder", sortOrder);
  }

  params.set("page", String(page));
  params.set("limit", String(limit));
  if (offset) {
    params.set("offset", String(offset));
  }

  return apiGet(`/masterdata/ledger?${params.toString()}`);
}

export async function updateEmployeeToolAliases(sibsId, payload) {
  return apiPut(`/masterdata/ledger/${encodeURIComponent(sibsId)}`, payload);
}

