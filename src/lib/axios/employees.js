// API helper for fetching employee records.
import { apiGet } from "./api";

export function getEmployees({
  limit = "all",
  search = "",
  account = "",
  department = "",
} = {}) {
  const params = new URLSearchParams();

  params.set("limit", limit);

  if (search) {
    params.set("search", search);
  }

  if (account) {
    params.set("account", account);
  }

  if (department) {
    params.set("department", department);
  }

  return apiGet(`/employees?${params.toString()}`);
}

export default getEmployees;
