// API helpers for US VISA raw Excel imports.
import api from "./api-template";

export async function uploadUsVisaImport({
  file,
  importProfileId,
  reportDateFrom,
  reportDateTo,
  onProgress,
}) {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("importProfileId", importProfileId);

  if (reportDateFrom) {
    formData.append("reportDateFrom", reportDateFrom);
  }

  if (reportDateTo) {
    formData.append("reportDateTo", reportDateTo);
  }

  const response = await api.post("/us-visa/imports", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress: (progressEvent) => {
      if (!onProgress || !progressEvent.total) {
        return;
      }

      onProgress(
        Math.round((progressEvent.loaded * 100) / progressEvent.total),
      );
    },
  });

  return response.data;
}

export async function getUsVisaImportHistory(params) {
  const response = await api.get("/us-visa/imports", {
    params,
  });

  return response.data;
}

export async function getUsVisaImportBatchDetails(batchId) {
  const response = await api.get(
    `/us-visa/imports/${encodeURIComponent(batchId)}`,
  );

  return response.data;
}

export async function getUsVisaImportBatchErrors(batchId, params) {
  const response = await api.get(
    `/us-visa/imports/${encodeURIComponent(batchId)}/errors`,
    {
      params,
    },
  );

  return response.data;
}

export async function deleteUsVisaImportBatch(batchId) {
  const response = await api.delete(
    `/us-visa/imports/${encodeURIComponent(batchId)}`,
  );

  return response.data;
}

