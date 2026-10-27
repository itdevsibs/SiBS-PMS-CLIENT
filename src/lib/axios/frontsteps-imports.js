// FrontSteps-only data management endpoints; no US Visa API changes.
import api from './api-template';

const IMPORT_PROGRESS_POLL_MS = 500;

function createProgressToken() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `frontsteps-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getFrontStepsImportProgress(progressToken) {
  const { data } = await api.get(`/frontsteps/imports/progress/${encodeURIComponent(progressToken)}`);
  return data;
}

async function pollFrontStepsImportProgress({ progressToken, onServerProgress, state }) {
  if (!onServerProgress) return;
  while (!state.done) {
    await wait(IMPORT_PROGRESS_POLL_MS);
    if (state.done) break;
    try {
      const response = await getFrontStepsImportProgress(progressToken);
      const progress = response?.progress;
      if (progress) {
        onServerProgress(progress);
        if (progress.status === 'completed' || progress.status === 'failed') break;
      }
    } catch (error) {
      if (error?.response?.status !== 404 && !state.done) {
        console.warn('Unable to poll FrontSteps import progress:', error?.message);
      }
    }
  }
}

export async function uploadFrontStepsFile(reportType, file, onProgress, onServerProgress) {
  const form = new FormData();
  const progressToken = createProgressToken();
  const pollState = { done: false };
  form.append('file', file);
  form.append('reportType', reportType === 'cases' ? 'CASES' : 'CALLS');
  form.append('progressToken', progressToken);

  const pollingPromise = pollFrontStepsImportProgress({ progressToken, onServerProgress, state: pollState });

  try {
    const { data } = await api.post('/frontsteps/imports', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 600000,
      onUploadProgress: (event) => {
        if (event.total && onProgress) onProgress(Math.round((event.loaded * 100) / event.total));
      },
    });

    try {
      const finalProgress = await getFrontStepsImportProgress(progressToken);
      if (finalProgress?.progress) onServerProgress?.(finalProgress.progress);
    } catch {
      // Upload response is authoritative if progress polling races cleanup.
    }
    return data;
  } catch (error) {
    try {
      const finalProgress = await getFrontStepsImportProgress(progressToken);
      if (finalProgress?.progress) onServerProgress?.(finalProgress.progress);
    } catch {
      // Preserve original upload error.
    }
    throw error;
  } finally {
    pollState.done = true;
    await pollingPromise;
  }
}

export async function getFrontStepsHistory(params = {}) {
  const { data } = await api.get('/frontsteps/imports', { params });
  return data;
}
export async function getFrontStepsSummary() {
  const { data } = await api.get('/frontsteps/imports/summary');
  return data;
}
export async function getFrontStepsBatch(batchId) {
  const { data } = await api.get(`/frontsteps/imports/${encodeURIComponent(batchId)}`);
  return data;
}
export async function getFrontStepsRows(batchId, params = {}) {
  const { data } = await api.get(`/frontsteps/imports/${encodeURIComponent(batchId)}/raw-data`, { params });
  return data;
}
export async function getFrontStepsIssues(batchId, params = {}) {
  const { data } = await api.get(`/frontsteps/imports/${encodeURIComponent(batchId)}/errors`, { params });
  return data;
}
export async function getFrontStepsUnmatchedRecords(batchId, params = {}) {
  const { data } = await api.get(`/frontsteps/imports/${encodeURIComponent(batchId)}/unmatched-records`, { params });
  return data;
}
export async function deleteFrontStepsBatch(batchId) {
  const { data } = await api.delete(`/frontsteps/imports/${encodeURIComponent(batchId)}`);
  return data;
}

export async function getFrontStepsEmployeeAssignments(params = {}) {
  const { data } = await api.get('/frontsteps/employee-assignments', { params });
  return data;
}

export async function searchFrontStepsKronosEmployees(search, limit = 25) {
  const { data } = await api.get('/frontsteps/employee-directory', {
    params: { search, limit },
  });
  return data;
}

export async function saveFrontStepsEmployeeAssignment(payload) {
  const { data } = await api.post('/frontsteps/employee-assignments', payload);
  return data;
}

export async function setFrontStepsEmployeeAssignmentStatus(sibsId, active) {
  const { data } = await api.patch(
    `/frontsteps/employee-assignments/${encodeURIComponent(sibsId)}/status`,
    { active },
  );
  return data;
}
