import { useEffect, useMemo, useState } from "react";

import { getTeamUsVisaPerformance } from "@/lib/axios/us-visa-performance";
import { getWfmCallKpis } from "@/lib/axios/wfm-kpis";

const DEFAULT_FILTERS = {
  period: "weekly",
  referenceDate: "",
  from: "",
  to: "",
};

function buildTeamPerformanceParams(filters = {}) {
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
    "Unable to load Team Leader performance."
  );
}

export default function useTeamLeaderPerformance(initialFilters = DEFAULT_FILTERS) {
  const [filters, setFilters] = useState({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });
  const [teamData, setTeamData] = useState(null);
  const [selectedAgentUid, setSelectedAgentUid] = useState("");
  const [selectedAgentData, setSelectedAgentData] = useState(null);
  const [operationalContext, setOperationalContext] = useState(null);
  const [operationalError, setOperationalError] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAgent, setIsLoadingAgent] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const requestParams = useMemo(
    () => buildTeamPerformanceParams(filters),
    [filters],
  );

  useEffect(() => {
    let isActive = true;

    const loadTeam = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await getTeamUsVisaPerformance(requestParams);

        if (isActive) {
          setTeamData(response?.data || null);
        }
      } catch (loadError) {
        if (isActive) {
          setTeamData(null);
          setError(getErrorMessage(loadError));
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadTeam();

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
    let isActive = true;

    if (!selectedAgentUid) {
      setSelectedAgentData(null);
      setIsLoadingAgent(false);
      return () => {
        isActive = false;
      };
    }

    const loadAgent = async () => {
      setIsLoadingAgent(true);

      try {
        const response = await getTeamUsVisaPerformance({
          ...requestParams,
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
  }, [requestParams, refreshKey, selectedAgentUid]);

  return {
    error,
    filters,
    isLoading,
    isLoadingAgent,
    operationalContext,
    operationalError,
    refresh: () => setRefreshKey((current) => current + 1),
    selectedAgentData,
    selectedAgentUid,
    setFilters,
    setSelectedAgentUid,
    teamData,
  };
}

export { buildTeamPerformanceParams };
