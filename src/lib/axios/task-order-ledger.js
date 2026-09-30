// API helper for Task Order Ledger data.
import { apiGet } from "./api";

export async function fetchTaskOrderLedger({ taskOrder, country, skill, search } = {}) {
  const params = new URLSearchParams();

  if (taskOrder && taskOrder !== "ALL" && taskOrder !== "All Task Orders") {
    params.set("taskOrder", taskOrder);
  }

  if (country && country !== "ALL" && country !== "All Countries") {
    params.set("country", country);
  }

  if (skill && skill !== "ALL" && skill !== "All Skills") {
    params.set("skill", skill);
  }

  if (search && String(search).trim()) {
    params.set("search", String(search).trim());
  }

  const query = params.toString();
  return apiGet(`/wfm/task-order-ledger${query ? `?${query}` : ""}`);
}
