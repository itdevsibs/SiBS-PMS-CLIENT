import { useState, useEffect, useCallback } from "react";
import {
  fetchAiOccupancyData,
  fetchAiAttendanceSheet,
  fetchAiAttendanceAccounts,
  fetchAiAttendanceStatus,
  fetchAiCallsReport,
  fetchAiCallsReportSkills,
  fetchAiChatReport,
  fetchAiChatSkills,
} from "../adapters/operationsDataAdapter";

export function useAiOccupancyData() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshOccupancy = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAiOccupancyData();
      if (res.success) {
        setData(res.data);
      } else {
        setError(res.error);
      }
    } catch (err) {
      setError(err?.message || "Failed to load occupancy data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshOccupancy();
  }, [refreshOccupancy]);

  return { data, loading, error, refreshOccupancy };
}

export function useAiAttendanceData() {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0 });
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [date, setDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [search, setSearch] = useState("");
  const [account, setAccount] = useState("all");
  const [status, setStatus] = useState("all");

  const [accountsList, setAccountsList] = useState([]);
  const [statusList, setStatusList] = useState([]);

  useEffect(() => {
    fetchAiAttendanceAccounts().then(setAccountsList);
    fetchAiAttendanceStatus().then(setStatusList);
  }, []);

  const refreshAttendance = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAiAttendanceSheet({
        date,
        page: pagination.page,
        limit: pagination.limit,
        search,
        account: account !== "all" ? account : undefined,
        status: status !== "all" ? status : undefined,
      });

      if (res.success) {
        setData(res.data);
        if (res.pagination) setPagination(res.pagination);
        if (res.summary) setSummary(res.summary);
      } else {
        setError(res.error);
      }
    } catch (err) {
      setError(err?.message || "Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  }, [date, pagination.page, pagination.limit, search, account, status]);

  useEffect(() => {
    refreshAttendance();
  }, [refreshAttendance]);

  return {
    data,
    pagination,
    setPagination,
    summary,
    loading,
    error,
    date,
    setDate,
    search,
    setSearch,
    account,
    setAccount,
    status,
    setStatus,
    accountsList,
    statusList,
    refreshAttendance,
  };
}

export function useAiCallsReportData() {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [date, setDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [search, setSearch] = useState("");
  const [source, setSource] = useState("us-visa");
  const [taskOrder, setTaskOrder] = useState("all");
  const [skillsList, setSkillsList] = useState([]);

  useEffect(() => {
    fetchAiCallsReportSkills().then(setSkillsList);
  }, []);

  const refreshCallsReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAiCallsReport({
        date,
        page: pagination.page,
        limit: pagination.limit,
        search,
        source,
        taskOrder: taskOrder !== "all" ? taskOrder : undefined,
      });

      if (res.success) {
        setData(res.data);
        if (res.summary) setSummary(res.summary);
        if (res.pagination) setPagination(res.pagination);
      } else {
        setError(res.error);
      }
    } catch (err) {
      setError(err?.message || "Failed to load calls report");
    } finally {
      setLoading(false);
    }
  }, [date, pagination.page, pagination.limit, search, source, taskOrder]);

  useEffect(() => {
    refreshCallsReport();
  }, [refreshCallsReport]);

  return {
    data,
    summary,
    pagination,
    setPagination,
    loading,
    error,
    date,
    setDate,
    search,
    setSearch,
    source,
    setSource,
    taskOrder,
    setTaskOrder,
    skillsList,
    refreshCallsReport,
  };
}

export function useAiChatReportData() {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [date, setDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [search, setSearch] = useState("");
  const [source, setSource] = useState("us-visa");
  const [taskOrder, setTaskOrder] = useState("all");
  const [skillsList, setSkillsList] = useState([]);

  useEffect(() => {
    fetchAiChatSkills().then(setSkillsList);
  }, []);

  const refreshChatReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAiChatReport({
        date,
        page: pagination.page,
        limit: pagination.limit,
        search,
        source,
        taskOrder: taskOrder !== "all" ? taskOrder : undefined,
      });

      if (res.success) {
        setData(res.data);
        if (res.summary) setSummary(res.summary);
        if (res.pagination) setPagination(res.pagination);
      } else {
        setError(res.error);
      }
    } catch (err) {
      setError(err?.message || "Failed to load chat report");
    } finally {
      setLoading(false);
    }
  }, [date, pagination.page, pagination.limit, search, source, taskOrder]);

  useEffect(() => {
    refreshChatReport();
  }, [refreshChatReport]);

  return {
    data,
    summary,
    pagination,
    setPagination,
    loading,
    error,
    date,
    setDate,
    search,
    setSearch,
    source,
    setSource,
    taskOrder,
    setTaskOrder,
    skillsList,
    refreshChatReport,
  };
}
