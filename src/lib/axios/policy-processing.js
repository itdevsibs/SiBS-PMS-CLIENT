// Client API service for AI Report - Policy Processing module
import api from "./api-template.js";

/**
 * Fetch overview summary metrics (Total, Successfully Processed, Pending, Failed/Attention)
 */
export async function getPolicyProcessingOverview() {
  const { data } = await api.get("/policy-processing/overview");
  return data?.data || {
    totalDocuments: 0,
    successfullyProcessed: 0,
    pendingProcessing: 0,
    failedAttention: 0,
  };
}

/**
 * List policy documents with pagination and filtering
 */
export async function getPolicyProcessingDocuments(params = {}) {
  const queryParams = new URLSearchParams();
  if (params.search) queryParams.append("search", params.search);
  if (params.category && params.category !== "all") queryParams.append("category", params.category);
  if (params.status && params.status !== "all") queryParams.append("status", params.status);
  if (params.page) queryParams.append("page", params.page);
  if (params.limit) queryParams.append("limit", params.limit);

  const queryString = queryParams.toString();
  const url = queryString ? `/policy-processing/documents?${queryString}` : "/policy-processing/documents";
  const { data } = await api.get(url);
  return data;
}

/**
 * Fetch full policy document details, extracted pages, sections, versions, and audit jobs
 */
export async function getPolicyProcessingDetail(id) {
  const { data } = await api.get(`/policy-processing/documents/${encodeURIComponent(id)}`);
  return data?.data;
}

/**
 * Reprocess an existing policy document
 */
export async function reprocessPolicyDocument(id) {
  const { data } = await api.post(`/policy-processing/documents/${encodeURIComponent(id)}/reprocess`);
  return data;
}

/**
 * Upload a new or revised approved policy document
 */
export async function uploadPolicyDocument(formData, onProgress) {
  const { data } = await api.post("/policy-processing/documents/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted);
      }
    },
  });
  return data;
}

/**
 * Search extracted text passages and formulas with PDF citation references
 */
export async function searchPolicyContent(params = {}) {
  const queryParams = new URLSearchParams();
  if (params.q) queryParams.append("q", params.q);
  if (params.category && params.category !== "all") queryParams.append("category", params.category);
  if (params.limit) queryParams.append("limit", params.limit);

  const { data } = await api.get(`/policy-processing/search?${queryParams.toString()}`);
  return data?.data || [];
}

/**
 * Get preview URL or blob for a policy PDF
 */
export function getPolicyPdfPreviewUrl(id) {
  const baseURL = api.defaults.baseURL || "/api";
  return `${baseURL}/policy-processing/documents/${encodeURIComponent(id)}/preview`;
}
