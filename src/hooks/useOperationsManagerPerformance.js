import { useEffect, useMemo, useState } from "react";

import { getOperationsUsVisaPerformance } from "@/lib/axios/us-visa-performance";
import { getWfmCallKpis } from "@/lib/axios/wfm-kpis";

const DEFAULT_FILTERS = {
  period: "weekly",
  referenceDate: "",
  from: "",
  to: "",
};

function buildOperationsPerformanceParams(filters = {}) {
  const params = {
    period: filters.period || DEFAULT_FILTERS.period,
  };

  if (params.period === "custom") {
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;
    return params;
  }

  if (filters.referenceDate) {
    params.referenceDate = filters.referenceDate;
  }

  return params;
}

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Unable to load Operations Manager performance."
  );
}

export default function useOperationsManagerPerformance(initialFilters = DEFAULT_FILTERS) {
  const [filters, setFilters] = useState({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });
  const [operationsData, setOperationsData] = useState(null);
  const [selectedTeamLeaderUid, setSelectedTeamLeaderUid] = useState("");
  const [selectedAgentUid, setSelectedAgentUid] = useState("");
  const [selectedAgentData, setSelectedAgentData] = useState(null);
  const [operationalContext, setOperationalContext] = useState(null);
  const [operationalError, setOperationalError] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAgent, setIsLoadingAgent] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const requestParams = useMemo(
    () => buildOperationsPerformanceParams(filters),
    [filters],
  );

  useEffect(() => {
    let isActive = true;

    const loadOperations = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await getOperationsUsVisaPerformance(requestParams);

        if (isActive) {
          setOperationsData(response?.data || null);
        }
      } catch (loadError) {
        if (isActive) {
          setOperationsData(null);
          setError(getErrorMessage(loadError));
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadOperations();

    return () => {
      isActive = false;
    };
  }, [requestParams, refreshKey]);

  useEffect(() => {
    let isActive = true;

    const loadOperationalContext = async () => {
      setOperationalError("");

      try {
        const response = await getWfmCallKpis({
          ...requestParams,
          sourceSystem: "US_VISA",
        });

        if (isActive) {
          setOperationalContext(response?.data?.data || null);
        }
      } catch (loadError) {
        if (isActive) {
          setOperationalContext(null);
          setOperationalError(getErrorMessage(loadError));
        }
      }
    };

    void loadOperationalContext();

    return () => {
      isActive = false;
    };
  }, [requestParams, refreshKey]);

  useEffect(() => {
    setSelectedAgentUid("");
    setSelectedAgentData(null);
  }, [selectedTeamLeaderUid]);

  useEffect(() => {
    let isActive = true;

    if (!selectedTeamLeaderUid || !selectedAgentUid) {
      setSelectedAgentData(null);
      setIsLoadingAgent(false);
      return () => {
        isActive = false;
      };
    }

    const loadAgent = async () => {
      setIsLoadingAgent(true);

      try {
        const response = await getOperationsUsVisaPerformance({
          ...requestParams,
          teamLeaderUid: selectedTeamLeaderUid,
          employeeUid: selectedAgentUid,
        });

        if (isActive) {
          setSelectedAgentData(response?.data || null);
        }
      } catch (loadError) {
        if (isActive) {
          setSelectedAgentData({
            error: getErrorMessage(loadError),
          });
        }
      } finally {
        if (isActive) {
          setIsLoadingAgent(false);
        }
      }
    };

    void loadAgent();

    return () => {
      isActive = false;
    };
  }, [requestParams, refreshKey, selectedAgentUid, selectedTeamLeaderUid]);

  return {
    error,
    filters,
    isLoading,
    isLoadingAgent,
    operationalContext,
    operationalError,
    operationsData,
    refresh: () => setRefreshKey((current) => current + 1),
    selectedAgentData,
    selectedAgentUid,
    selectedTeamLeaderUid,
    setFilters,
    setSelectedAgentUid,
    setSelectedTeamLeaderUid,
  };
}

export { buildOperationsPerformanceParams };
