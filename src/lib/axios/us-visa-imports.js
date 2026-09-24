// API helpers for US VISA raw Excel imports.
import api from "./api-template";

const IMPORT_PROGRESS_POLL_MS = 500;

function createProgressToken() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `import-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getUsVisaImportProgress(progressToken) {
  const response = await api.get(
    `/us-visa/imports/progress/${encodeURIComponent(progressToken)}`,
  );

  return response.data;
}

async function pollUsVisaImportProgress({
  progressToken,
  onServerProgress,
  state,
}) {
  if (!onServerProgress) return;

  while (!state.done) {
    await wait(IMPORT_PROGRESS_POLL_MS);
    if (state.done) break;

    try {
      const response = await getUsVisaImportProgress(progressToken);
      const progress = response?.progress;

      if (progress) {
        onServerProgress(progress);
        if (progress.status === "completed" || progress.status === "failed") {
          break;
        }
      }
    } catch (error) {
      if (error?.response?.status !== 404 && !state.done) {
        console.warn("Unable to poll import progress:", error?.message);
      }
    }
  }
}

export async function uploadUsVisaImport({
  file,
  importProfileId,
  taskOrderId,
  reportDateFrom,
  reportDateTo,
  onProgress,
  onServerProgress,
}) {
  const formData = new FormData();
  const progressToken = createProgressToken();
  const pollState = { done: false };

  formData.append("file", file);
  formData.append("importProfileId", importProfileId);
  formData.append("progressToken", progressToken);

  if (taskOrderId) {
    formData.append("taskOrderId", taskOrderId);
  }

  if (reportDateFrom) {
    formData.append("reportDateFrom", reportDateFrom);
  }

  if (reportDateTo) {
    formData.append("reportDateTo", reportDateTo);
  }

  const pollingPromise = pollUsVisaImportProgress({
    progressToken,
    onServerProgress,
    state: pollState,
  });

  try {
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

    try {
      const finalProgress = await getUsVisaImportProgress(progressToken);
      if (finalProgress?.progress) {
        onServerProgress?.(finalProgress.progress);
      }
    } catch {
      // The upload response remains authoritative if progress cleanup raced polling.
    }

    return response.data;
  } catch (error) {
    try {
      const finalProgress = await getUsVisaImportProgress(progressToken);
      if (finalProgress?.progress) {
        onServerProgress?.(finalProgress.progress);
      }
    } catch {
      // Preserve the original upload error.
    }

    throw error;
  } finally {
    pollState.done = true;
    await pollingPromise;
  }
}

export async function getUsVisaImportHistory(params) {
  const response = await api.get("/us-visa/imports", {
    params,
  });

  return response.data;
}

export async function getUsVisaImportSummary(params = {}) {
  const response = await api.get("/us-visa/imports/summary", {
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
