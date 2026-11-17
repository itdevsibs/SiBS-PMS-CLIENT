import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchFsAiSummary,
  fetchFsAiAccountKpi,
  fetchFsAiPmpPip,
  fetchFsAiPolicies,
  fetchFsAiPolicySyncStatus,
  triggerFsAiPolicySync,
  fetchFsAiPolicyVersionHistory,
  triggerFsAiVersionExtraction,
  fetchFsAiVersionExtraction,
  fetchFsAiVersionPages,
  fetchFsAiVersionChunks,
  searchFsAiPolicyKnowledge,
  triggerFsAiVersionInterpretation,
  fetchFsAiVersionInterpretation,
  fetchFsAiVersionRules,
  fetchFsAiInterpretationOverview,
  fetchFsAiJobStatus,
  triggerFsAiPolicyValidation,
  fetchFsAiValidationStatus,
  fetchFsAiCanonicalRules,
  fetchFsAiValidationIssues,
  fetchFsAiPolicySnapshots,
  fetchFsAiActivePolicySnapshot,
  createFsAiPolicySnapshot,
  publishFsAiPolicySnapshot,
  triggerFsAiReportRebuild,
  fetchFsAiCalculationAudits,
  fetchFsAiInsights,
  triggerFsAiInsightGeneration,
} from "../services/frontStepsAiApi";
import {
  adaptSummaryData,
  adaptAccountKpiData,
  adaptPmpPipData,
  adaptPoliciesData,
  adaptPolicySyncStatus,
  adaptPolicyVersionHistoryData,
  adaptExtractionRunData,
  adaptPolicyPagesData,
  adaptKnowledgeSearchResults,
  adaptInsightData,
} from "../adapters/frontStepsAiDataAdapter";

function useReportRebuildAction(reportType, filters, loadData, setError) {
  const [rebuilding, setRebuilding] = useState(false);
  const [rebuildStatus, setRebuildStatus] = useState(null);
  const abortPollRef = useRef(false);

  useEffect(() => {
    abortPollRef.current = false;
    return () => {
      abortPollRef.current = true;
    };
  }, []);

  const rebuildReport = useCallback(
    async (options = {}) => {
      setRebuilding(true);
      setError(null);
      setRebuildStatus({ state: "TRIGGERING", message: `Queueing deterministic calculation (${reportType})...` });
      try {
        const res = await triggerFsAiReportRebuild({
          reportType,
          period: filters.period || "monthly",
          startDate: filters.startDate || null,
          endDate: filters.endDate || null,
          account: filters.account || "all",
          employeeId: filters.employeeId || "all",
          queueName: filters.queueName || null,
          mode: options.mode || "async",
          force: Boolean(options.force),
        });

        if (res.mode === "sync") {
          setRebuildStatus({ state: "COMPLETED", message: "Deterministic calculation verified and published." });
          await loadData();
          return res;
        }

        const jobId = res.jobId;
        if (!jobId) {
          await loadData();
          return res;
        }

        setRebuildStatus({ state: "QUEUED", jobId, message: `Rebuild job #${jobId} queued for background worker...` });

        // Poll background worker job completion without triggering Hermes
        for (let attempt = 0; attempt < 40; attempt++) {
          if (abortPollRef.current) break;
          await new Promise((r) => setTimeout(r, 1000));
          const jobRes = await fetchFsAiJobStatus(jobId);
          const job = jobRes?.job;
          if (!job) break;
          if (job.status === "COMPLETED" || job.status === "BLOCKED") {
            setRebuildStatus({
              state: job.status,
              jobId,
              message:
                job.status === "COMPLETED"
                  ? `Snapshot verified & published by worker in ${job.durationMs || 0}ms.`
                  : `Rebuild job #${jobId} blocked by Execution Readiness Gate.`,
            });
            await loadData();
            return job;
          }
          if (job.status === "FAILED") {
            const msg = job.errorDetails || "Background report rebuild failed";
            setRebuildStatus({ state: "FAILED", jobId, message: msg });
            setError(msg);
            return job;
          }
          setRebuildStatus({ state: job.status, jobId, message: `Worker ${job.status.toLowerCase()} job #${jobId}...` });
        }
        await loadData();
        return res;
      } catch (err) {
        const msg = err?.response?.data?.message || err?.message || "Failed to rebuild FrontSteps AI snapshot";
        setRebuildStatus({ state: "FAILED", message: msg });
        setError(msg);
        throw err;
      } finally {
        setRebuilding(false);
      }
    },
    [reportType, filters, loadData, setError]
  );

  return { rebuildReport, rebuilding, rebuildStatus };
}

export function useFrontStepsAiSummary(initialFilters = {}) {
  const [filters, setFilters] = useState({
    period: "monthly",
    ...initialFilters,
  });
  const [data, setData] = useState(() => adaptSummaryData({}));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFsAiSummary(filters);
      setData(adaptSummaryData(res));
    } catch (err) {
      console.error("[FrontSteps AI Summary Hook] Error:", err);
      if (err?.response?.status === 400 || err?.response?.data) {
        setData(adaptSummaryData({ ...(err?.response?.data || {}), hasPublishedSnapshot: false }));
      }
      setError(err?.response?.data?.message || err?.message || "Failed to load FrontSteps AI summary");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const { rebuildReport, rebuilding, rebuildStatus } = useReportRebuildAction(
    "SUMMARY",
    filters,
    loadData,
    setError
  );

  return { data, loading, error, filters, setFilters, reload: loadData, rebuildReport, rebuilding, rebuildStatus };
}

export function useFrontStepsAiAccountKpi(initialFilters = {}) {
  const [filters, setFilters] = useState({
    period: "monthly",
    account: "all",
    caseQueue: "all",
    caseOrigin: "all",
    ...initialFilters,
  });
  const [data, setData] = useState(() => adaptAccountKpiData({}));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFsAiAccountKpi(filters);
      setData(adaptAccountKpiData(res));
    } catch (err) {
      console.error("[FrontSteps AI Account KPI Hook] Error:", err);
      if (err?.response?.status === 400 || err?.response?.data) {
        setData(adaptAccountKpiData({ ...(err?.response?.data || {}), hasPublishedSnapshot: false }));
      }
      setError(err?.response?.data?.message || err?.message || "Failed to load FrontSteps AI account KPI");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const { rebuildReport, rebuilding, rebuildStatus } = useReportRebuildAction(
    "ACCOUNT_KPI",
    filters,
    loadData,
    setError
  );

  return { data, loading, error, filters, setFilters, reload: loadData, rebuildReport, rebuilding, rebuildStatus };
}

export function useFrontStepsAiPmpPip(initialFilters = {}) {
  const [filters, setFilters] = useState({
    period: "monthly",
    employeeId: "all",
    site: "all",
    ...initialFilters,
  });
  const [data, setData] = useState(() => adaptPmpPipData({}));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFsAiPmpPip(filters);
      setData(adaptPmpPipData(res));
    } catch (err) {
      console.error("[FrontSteps AI PMP/PIP Hook] Error:", err);
      if (err?.response?.status === 400 || err?.response?.data) {
        setData(adaptPmpPipData({ ...(err?.response?.data || {}), hasPublishedSnapshot: false }));
      }
      setError(err?.response?.data?.message || err?.message || "Failed to load FrontSteps AI PMP/PIP data");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const { rebuildReport, rebuilding, rebuildStatus } = useReportRebuildAction(
    "INDIVIDUAL_KPI_PMP",
    filters,
    loadData,
    setError
  );

  return { data, loading, error, filters, setFilters, reload: loadData, rebuildReport, rebuilding, rebuildStatus };
}

export function useFrontStepsAiCalculationAudits(initialReportType = null) {
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadAudits = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchFsAiCalculationAudits({ reportType: initialReportType || undefined, limit: 20 });
      setAudits(Array.isArray(res?.audits) ? res.audits : []);
    } catch {
      setAudits([]);
    } finally {
      setLoading(false);
    }
  }, [initialReportType]);

  useEffect(() => {
    loadAudits();
  }, [loadAudits]);

  return { audits, loading, reload: loadAudits };
}

export function useFrontStepsAiPolicies(initialFilters = {}) {
  const [filters, setFilters] = useState({
    category: "all",
    status: "all",
    search: "",
    page: 1,
    limit: 15,
    ...initialFilters,
  });
  const [data, setData] = useState(() => adaptPoliciesData({}));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFsAiPolicies(filters);
      setData(adaptPoliciesData(res));
    } catch (err) {
      console.error("[FrontSteps AI Policies Hook] Error:", err);
      setError(err?.response?.data?.message || err?.message || "Failed to load FrontSteps AI policies");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { data, loading, error, filters, setFilters, reload: loadData };
}

export function useFrontStepsAiPolicySync() {
  const [syncStatus, setSyncStatus] = useState(() => adaptPolicySyncStatus({}));
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [error, setError] = useState(null);

  const loadStatus = useCallback(async () => {
    setLoadingStatus(true);
    setError(null);
    try {
      const res = await fetchFsAiPolicySyncStatus();
      setSyncStatus(adaptPolicySyncStatus(res));
    } catch (err) {
      console.error("[FrontSteps AI Policy Sync Hook] Error loading status:", err);
      setError(err?.response?.data?.message || err?.message || "Failed to load policy sync status");
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  const triggerSync = useCallback(async () => {
    setSyncing(true);
    setError(null);
    try {
      const res = await triggerFsAiPolicySync();
      setSyncResult(res);
      await loadStatus();
      return res;
    } catch (err) {
      console.error("[FrontSteps AI Policy Sync Hook] Error triggering sync:", err);
      const errMsg = err?.response?.data?.message || err?.message || "Failed to trigger policy synchronization";
      setError(errMsg);
      throw err;
    } finally {
      setSyncing(false);
    }
  }, [loadStatus]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  return {
    syncStatus,
    loadingStatus,
    syncing,
    syncResult,
    error,
    reloadStatus: loadStatus,
    triggerSync,
  };
}

export function useFrontStepsAiPolicyVersionHistory(documentCode) {
  const [history, setHistory] = useState(() => adaptPolicyVersionHistoryData({ documentCode }));
  const [loading, setLoading] = useState(Boolean(documentCode));
  const [error, setError] = useState(null);

  const loadHistory = useCallback(async () => {
    if (!documentCode) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFsAiPolicyVersionHistory(documentCode);
      setHistory(adaptPolicyVersionHistoryData(res));
    } catch (err) {
      console.error(`[FrontSteps AI Version History Hook] Error for ${documentCode}:`, err);
      setError(err?.response?.data?.message || err?.message || "Failed to load version history");
    } finally {
      setLoading(false);
    }
  }, [documentCode]);

  useEffect(() => {
    if (documentCode) {
      loadHistory();
    }
  }, [documentCode, loadHistory]);

  return { history, loading, error, reload: loadHistory };
}

export function useFrontStepsAiPolicyPages(versionId) {
  const [data, setData] = useState(() => adaptPolicyPagesData({}));
  const [loading, setLoading] = useState(Boolean(versionId));
  const [error, setError] = useState(null);
  const [activePage, setActivePage] = useState(1);

  const loadPages = useCallback(async () => {
    if (!versionId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFsAiVersionPages(versionId, { page: 1, limit: 100 });
      const adapted = adaptPolicyPagesData(res);
      setData(adapted);
      if (adapted.pages && adapted.pages.length > 0) {
        setActivePage(adapted.pages[0].pageNumber);
      }
    } catch (err) {
      console.error(`[FrontSteps AI Policy Pages Hook] Error for version ${versionId}:`, err);
      setError(err?.response?.data?.message || err?.message || "Failed to load extracted policy pages");
    } finally {
      setLoading(false);
    }
  }, [versionId]);

  useEffect(() => {
    if (versionId) {
      loadPages();
    }
  }, [versionId, loadPages]);

  return {
    data,
    pages: data.pages || [],
    run: data.run || null,
    total: data.total || 0,
    loading,
    error,
    activePage,
    setActivePage,
    reload: loadPages,
  };
}

export function useFrontStepsAiVersionExtraction() {
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const triggerExtraction = useCallback(async (versionId, force = false) => {
    if (!versionId) return null;
    setExtracting(true);
    setError(null);
    try {
      const res = await triggerFsAiVersionExtraction(versionId, force);
      setResult(res);
      return res;
    } catch (err) {
      console.error(`[FrontSteps AI Extraction Hook] Error extracting version ${versionId}:`, err);
      const errMsg = err?.response?.data?.message || err?.message || "Policy extraction failed";
      setError(errMsg);
      throw err;
    } finally {
      setExtracting(false);
    }
  }, []);

  return {
    extracting,
    error,
    result,
    triggerExtraction,
  };
}

export function useFrontStepsAiKnowledgeSearch(initialQuery = "") {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState(() => adaptKnowledgeSearchResults({}));
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);

  const executeSearch = useCallback(async (searchQuery = query, params = {}) => {
    if (!searchQuery || !searchQuery.trim()) {
      setResults(adaptKnowledgeSearchResults({}));
      return;
    }
    setSearching(true);
    setError(null);
    try {
      const res = await searchFsAiPolicyKnowledge(searchQuery, params);
      setResults(adaptKnowledgeSearchResults(res));
    } catch (err) {
      console.error("[FrontSteps AI Knowledge Search Hook] Error:", err);
      setError(err?.response?.data?.message || err?.message || "Knowledge search failed");
    } finally {
      setSearching(false);
    }
  }, [query]);

  return {
    query,
    setQuery,
    results,
    searching,
    error,
    executeSearch,
  };
}

export function useFrontStepsAiPolicyRules(versionId) {
  const [rules, setRules] = useState([]);
  const [interpretation, setInterpretation] = useState(null);
  const [loading, setLoading] = useState(Boolean(versionId));
  const [error, setError] = useState(null);

  const loadRules = useCallback(async () => {
    if (!versionId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFsAiVersionInterpretation(versionId);
      setInterpretation(res.data);
      setRules(res.data?.rules || []);
    } catch (err) {
      console.error(`[FrontSteps AI Rules Hook] Error for version ${versionId}:`, err);
      setError(err?.response?.data?.message || err?.message || "Failed to load policy rules");
    } finally {
      setLoading(false);
    }
  }, [versionId]);

  useEffect(() => {
    if (versionId) {
      loadRules();
    }
  }, [versionId, loadRules]);

  return { rules, interpretation, loading, error, reload: loadRules };
}

export function useFrontStepsAiVersionInterpretationAction() {
  const [interpreting, setInterpreting] = useState(false);
  const [activeJobId, setActiveJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const triggerInterpretation = useCallback(async (versionId, force = false, model = null) => {
    setInterpreting(true);
    setError(null);
    setResult(null);

    try {
      const res = await triggerFsAiVersionInterpretation(versionId, force, model);

      if (res.alreadyCompleted) {
        setResult(res.data);
        setInterpreting(false);
        return res.data;
      }

      if (res.jobId) {
        setActiveJobId(res.jobId);
        setJobStatus(res.status || 'QUEUED');

        // Poll job status until terminal state
        const maxPollAttempts = 60; // 60 * 2s = 120s max
        let attempts = 0;

        while (attempts < maxPollAttempts) {
          await new Promise((r) => setTimeout(r, 2000));
          attempts++;

          try {
            const statusRes = await fetchFsAiJobStatus(res.jobId);
            const currentJob = statusRes?.data;
            if (!currentJob) continue;

            setJobStatus(currentJob.status);

            if (currentJob.status === 'COMPLETED') {
              setResult(currentJob.result);
              setActiveJobId(null);
              setInterpreting(false);
              return currentJob.result;
            }

            if (currentJob.status === 'FAILED' || currentJob.status === 'BLOCKED') {
              const errMsg = currentJob.errorDetails || `Job ended in state ${currentJob.status}`;
              setError(errMsg);
              setActiveJobId(null);
              setInterpreting(false);
              throw new Error(errMsg);
            }
          } catch (pollErr) {
            if (attempts >= maxPollAttempts) throw pollErr;
          }
        }

        throw new Error('Interpretation job timed out while processing in background');
      }

      setResult(res);
      return res;
    } catch (err) {
      console.error(`[FrontSteps AI Interpretation Action] Error for version ${versionId}:`, err);
      const errMsg = err?.response?.data?.message || err?.message || "Failed to interpret policy rules";
      setError(errMsg);
      throw err;
    } finally {
      setInterpreting(false);
    }
  }, []);

  return {
    interpreting,
    activeJobId,
    jobStatus,
    error,
    result,
    triggerInterpretation,
  };
}

export function useFrontStepsAiRuleValidation() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFsAiValidationStatus();
      setStatus(res.data);
    } catch (err) {
      console.error("[FrontSteps AI Validation Status] Error:", err);
      setError(err?.response?.data?.message || err?.message || "Failed to load validation status");
    } finally {
      setLoading(false);
    }
  }, []);

  const triggerValidation = useCallback(async () => {
    setValidating(true);
    setError(null);
    try {
      const res = await triggerFsAiPolicyValidation();
      await loadStatus();
      return res;
    } catch (err) {
      console.error("[FrontSteps AI Trigger Validation] Error:", err);
      const errMsg = err?.response?.data?.message || err?.message || "Failed to validate policy rules";
      setError(errMsg);
      throw err;
    } finally {
      setValidating(false);
    }
  }, [loadStatus]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  return {
    status,
    loading,
    validating,
    error,
    reload: loadStatus,
    triggerValidation,
  };
}

export function useFrontStepsAiPolicySnapshots() {
  const [snapshots, setSnapshots] = useState([]);
  const [activeSnapshot, setActiveSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  const loadSnapshots = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [listRes, activeRes] = await Promise.all([
        fetchFsAiPolicySnapshots(),
        fetchFsAiActivePolicySnapshot(),
      ]);
      setSnapshots(listRes.snapshots || []);
      setActiveSnapshot(activeRes.snapshot || null);
    } catch (err) {
      console.error("[FrontSteps AI Policy Snapshots] Error:", err);
      setError(err?.response?.data?.message || err?.message || "Failed to load policy snapshots");
    } finally {
      setLoading(false);
    }
  }, []);

  const createSnapshot = useCallback(async (data = {}) => {
    setCreating(true);
    setError(null);
    try {
      const res = await createFsAiPolicySnapshot(data);
      await loadSnapshots();
      return res.snapshot;
    } catch (err) {
      console.error("[FrontSteps AI Create Snapshot] Error:", err);
      const errMsg = err?.response?.data?.message || err?.message || "Failed to create policy snapshot";
      setError(errMsg);
      throw err;
    } finally {
      setCreating(false);
    }
  }, [loadSnapshots]);

  const publishSnapshot = useCallback(async (snapshotId, data = {}) => {
    setPublishing(true);
    setError(null);
    try {
      const res = await publishFsAiPolicySnapshot(snapshotId, data);
      await loadSnapshots();
      return res.snapshot;
    } catch (err) {
      console.error("[FrontSteps AI Publish Snapshot] Error:", err);
      const errMsg = err?.response?.data?.message || err?.message || "Failed to publish policy snapshot";
      setError(errMsg);
      throw err;
    } finally {
      setPublishing(false);
    }
  }, [loadSnapshots]);

  useEffect(() => {
    loadSnapshots();
  }, [loadSnapshots]);

  return {
    snapshots,
    activeSnapshot,
    loading,
    creating,
    publishing,
    error,
    reload: loadSnapshots,
    createSnapshot,
    publishSnapshot,
  };
}

export function useFrontStepsAiCanonicalRules() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadRules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFsAiCanonicalRules();
      setRules(res.rules || []);
    } catch (err) {
      console.error("[FrontSteps AI Canonical Rules] Error:", err);
      setError(err?.response?.data?.message || err?.message || "Failed to load canonical rules");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  return { rules, loading, error, reload: loadRules };
}

export function useFrontStepsAiValidationIssues() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadIssues = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFsAiValidationIssues();
      setIssues(res.issues || []);
    } catch (err) {
      console.error("[FrontSteps AI Validation Issues] Error:", err);
      setError(err?.response?.data?.message || err?.message || "Failed to load validation issues");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIssues();
  }, [loadIssues]);

  return { issues, loading, error, reload: loadIssues };
}

export function useFrontStepsAiInsights({
  reportType,
  filters = {},
  snapshotId = null,
  enabled = true,
  unavailableState = null,
} = {}) {
  const [insightData, setInsightData] = useState(() => adaptInsightData({}));
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [jobState, setJobState] = useState(null);
  const [error, setError] = useState(null);
  const requestIdRef = useRef(0);
  const pollAbortRef = useRef(false);

  const normalizedFilterKey = JSON.stringify({
    reportType,
    snapshotId: snapshotId || null,
    period: filters?.period || "monthly",
    startDate: filters?.startDate || null,
    endDate: filters?.endDate || null,
    account: filters?.account || "all",
    caseQueue: filters?.caseQueue || "all",
    caseOrigin: filters?.caseOrigin || "all",
    employeeId: filters?.employeeId || "all",
    site: filters?.site || "all",
    unavailableCode: unavailableState?.code || null,
    unavailableReason: unavailableState?.reason || null,
  });

  useEffect(() => {
    pollAbortRef.current = false;
    return () => {
      pollAbortRef.current = true;
    };
  }, [normalizedFilterKey]);

  const loadInsights = useCallback(async () => {
    const reqId = ++requestIdRef.current;
    if (!enabled) {
      setInsightData(
        adaptInsightData({
          hasPublishedSnapshot: Boolean(unavailableState?.hasPublishedSnapshot),
          hasInsight: false,
          canGenerateInsights: false,
          unavailableCode: unavailableState?.code || "NO_PUBLISHED_SNAPSHOT",
          unavailableReason: unavailableState?.reason || null,
        })
      );
      setError(null);
      setJobState(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetchFsAiInsights({
        reportType,
        snapshotId,
        period: filters?.period || "monthly",
        startDate: filters?.startDate || null,
        endDate: filters?.endDate || null,
        account: filters?.account || "all",
        caseQueue: filters?.caseQueue || "all",
        caseOrigin: filters?.caseOrigin || "all",
        employeeId: filters?.employeeId || "all",
        site: filters?.site || "all",
      });
      if (reqId !== requestIdRef.current) return;
      const adapted = adaptInsightData(res);
      setInsightData(adapted);
      if (adapted.activeJob) {
        setJobState({
          jobId: adapted.activeJob.id,
          status: adapted.activeJob.status,
          message: `Insight job #${adapted.activeJob.id} is ${adapted.activeJob.status.toLowerCase()} in background worker...`,
        });
      } else {
        setJobState(null);
      }
    } catch (err) {
      if (reqId !== requestIdRef.current) return;
      const status = err?.response?.status;
      const errData = err?.response?.data;
      if (status === 403) {
        setInsightData(
          adaptInsightData({
            hasPublishedSnapshot: Boolean(errData?.hasPublishedSnapshot),
            hasInsight: false,
            canGenerateInsights: false,
            unavailableCode: errData?.code || "UNAUTHORIZED_INSIGHT_SCOPE",
            unavailableReason: errData?.message || "Access denied for current insight scope.",
          })
        );
        setError(null);
      } else {
        setInsightData(
          adaptInsightData({
            hasPublishedSnapshot: false,
            hasInsight: false,
            canGenerateInsights: false,
            unavailableCode: errData?.code || "INSIGHT_LOAD_ERROR",
          })
        );
        setError(errData?.message || err?.message || "Failed to load saved AI insights");
      }
    } finally {
      if (reqId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [enabled, normalizedFilterKey]);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  const generateInsights = useCallback(
    async ({ force = false } = {}) => {
      if (!enabled) return null;
      setGenerating(true);
      setError(null);
      pollAbortRef.current = false;
      setJobState({
        status: "TRIGGERING",
        message: "Submitting insight request for verified report snapshot...",
      });

      try {
        const res = await triggerFsAiInsightGeneration({
          reportType,
          snapshotId,
          period: filters?.period || "monthly",
          startDate: filters?.startDate || null,
          endDate: filters?.endDate || null,
          account: filters?.account || "all",
          caseQueue: filters?.caseQueue || "all",
          caseOrigin: filters?.caseOrigin || "all",
          employeeId: filters?.employeeId || "all",
          site: filters?.site || "all",
          force,
        });

        if (res.status === "CACHED" && res.reused) {
          setJobState({
            status: "COMPLETED",
            message: res.message || "Loaded verified cached insights (0 new Hermes calls).",
          });
          await loadInsights();
          return res;
        }

        const jobId = res.jobId;
        if (!jobId) {
          await loadInsights();
          return res;
        }

        setJobState({
          jobId,
          status: res.status || "QUEUED",
          message:
            res.message ||
            `Insight generation job #${jobId} ${String(res.status || "QUEUED").toLowerCase()}...`,
        });

        const maxPolls = 60;
        for (let attempt = 0; attempt < maxPolls; attempt++) {
          if (pollAbortRef.current) break;
          await new Promise((r) => setTimeout(r, 2000));
          if (pollAbortRef.current) break;

          const statusRes = await fetchFsAiJobStatus(jobId);
          const job = statusRes?.data || statusRes?.job;
          if (!job) continue;

          if (job.status === "COMPLETED") {
            const jobResult = job.result || {};
            if (jobResult.published === false) {
              setJobState({
                jobId,
                status: jobResult.validationStatus || "NEEDS_REVIEW",
                message: `Validation withheld insights (${jobResult.validationStatus || "NEEDS_REVIEW"}): ungrounded claims rejected safely.`,
              });
            } else {
              setJobState({
                jobId,
                status: "COMPLETED",
                message: `Validated insights generated & cached for Snapshot #${jobResult.reportSnapshotId || snapshotId || "active"} in ${job.durationMs || 0}ms.`,
              });
            }
            await loadInsights();
            return job;
          }

          if (job.status === "FAILED" || job.status === "BLOCKED") {
            const errMsg =
              job.errorDetails || `Insight generation job #${jobId} ended with state ${job.status}.`;
            setJobState({ jobId, status: job.status, message: errMsg });
            setError(errMsg);
            await loadInsights();
            return job;
          }

          setJobState({
            jobId,
            status: job.status,
            message: `Worker ${String(job.status || "RUNNING").toLowerCase()} insight job #${jobId}...`,
          });
        }

        await loadInsights();
        return res;
      } catch (err) {
        const msg =
          err?.response?.data?.message || err?.message || "Failed to generate AI management insights";
        setJobState({ status: "FAILED", message: msg });
        setError(msg);
        return null;
      } finally {
        setGenerating(false);
      }
    },
    [enabled, normalizedFilterKey, loadInsights]
  );

  return {
    insightData,
    loading,
    generating,
    jobState,
    error,
    reloadInsights: loadInsights,
    generateInsights,
  };
}
