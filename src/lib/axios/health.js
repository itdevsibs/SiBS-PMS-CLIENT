import { apiGet } from "./api";

export function getBackendHealth() {
  return apiGet("/health");
}
