import { useState, useEffect, useCallback } from "react";
import {
  fetchAiEmployeeLedger,
  fetchAiMasterDataAccounts,
  fetchAiMasterDataTaskOrders,
  fetchAiStaffingRequirements,
  fetchAiStaffingDailyCoverage,
  fetchAiStaffingTaskOrders,
  fetchAiStaffingHistory,
} from "../adapters/workforceDataAdapter";

export function useAiEmployeeLedgerData() {
  const [ledgerData, setLedgerData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0 });
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [account, setAccount] = useState("all");
  const [taskOrder, setTaskOrder] = useState("all");
  const [status, setStatus] = useState("all");

  const [accountsList, setAccountsList] = useState([]);
  const [taskOrdersList, setTaskOrdersList] = useState([]);

  // Load filter options
  useEffect(() => {
    fetchAiMasterDataAccounts().then(setAccountsList);
    fetchAiMasterDataTaskOrders().then(setTaskOrdersList);
  }, []);

  const refreshLedger = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAiEmployeeLedger({
        page: pagination.page,
        limit: pagination.limit,
        search,
        account: account !== "all" ? account : undefined,
        taskOrder: taskOrder !== "all" ? taskOrder : undefined,
        status: status !== "all" ? status : undefined,
      });

      if (res.success) {
        setLedgerData(res.data);
        if (res.pagination) setPagination(res.pagination);
        if (res.summary) setSummary(res.summary);
      } else {
        setError(res.error);
      }
    } catch (err) {
      setError(err?.message || "Failed to load employee ledger data");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, account, taskOrder, status]);

  useEffect(() => {
    refreshLedger();
  }, [refreshLedger]);

  return {
    ledgerData,
    pagination,
    setPagination,
    summary,
    loading,
    error,
    search,
    setSearch,
    account,
    setAccount,
    taskOrder,
    setTaskOrder,
    status,
    setStatus,
    accountsList,
    taskOrdersList,
    refreshLedger,
  };
}

export function useAiStaffingRequirementsData() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  });
  const [taskOrder, setTaskOrder] = useState("all");
  const [taskOrdersList, setTaskOrdersList] = useState([]);

  const [requirementsData, setRequirementsData] = useState([]);
  const [coverageData, setCoverageData] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAiStaffingTaskOrders().then(setTaskOrdersList);
  }, []);

  const refreshStaffing = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [reqRes, covRes, histRes] = await Promise.all([
        fetchAiStaffingRequirements({ month: selectedMonth, taskOrder }),
        fetchAiStaffingDailyCoverage({ month: selectedMonth, taskOrder }),
        fetchAiStaffingHistory({ month: selectedMonth, taskOrder }),
      ]);

      if (reqRes.success) setRequirementsData(reqRes.data);
      if (covRes.success) setCoverageData(covRes.data);
      if (histRes.success) setHistoryData(histRes.data);
    } catch (err) {
      setError(err?.message || "Failed to load staffing requirements");
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, taskOrder]);

  useEffect(() => {
    refreshStaffing();
  }, [refreshStaffing]);

  return {
    selectedMonth,
    setSelectedMonth,
    taskOrder,
    setTaskOrder,
    taskOrdersList,
    requirementsData,
    coverageData,
    historyData,
    loading,
    error,
    refreshStaffing,
  };
}
