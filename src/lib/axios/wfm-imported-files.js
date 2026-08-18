// API helpers for syncing WFM imported-file records.
import api from "./api-template";

export async function saveWfmImportedFile(payload) {
  const response = await api.post("/wfm/imported-files", payload);

  return response.data;
}

export async function getWfmImportedFiles(params) {
  const response = await api.get("/wfm/imported-files", { params });

  return response.data;
}

export async function getWfmImportedFileReport(uploadId) {
  const response = await api.get(
    `/wfm/imported-files/${encodeURIComponent(uploadId)}/report`,
  );

  return response.data;
}

export async function markWfmImportedFileGraphReady(uploadId) {
  const response = await api.post(
    `/wfm/imported-files/${encodeURIComponent(uploadId)}/graph-ready`,
  );

  return response.data;
}

export async function deleteWfmImportedFile(uploadId) {
  const response = await api.delete(
    `/wfm/imported-files/${encodeURIComponent(uploadId)}`,
  );

  return response.data;
}
