// API helper for backend health checks.
import { apiGet } from "./api";

export function getBackendHealth() {
  return apiGet("/health");
}
