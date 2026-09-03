import { useEffect, useMemo, useState } from "react";

import {
  buildAgentPerformanceParams,
  DEFAULT_AGENT_PERFORMANCE_FILTERS,
} from "@/components/agent/agentPerformanceFilterUtils";
import { getMyUsVisaPerformance } from "@/lib/axios/us-visa-performance";

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Unable to load your Agent Level performance."
  );
}

export default function useAgentPerformance(
  initialFilters = DEFAULT_AGENT_PERFORMANCE_FILTERS,
) {
  const [filters, setFilters] = useState({
    ...DEFAULT_AGENT_PERFORMANCE_FILTERS,
    ...initialFilters,
  });
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const requestParams = useMemo(
    () => buildAgentPerformanceParams(filters),
    [filters],
  );

  useEffect(() => {
    let isActive = true;

    const loadPerformance = async () => {
      setIsLoading(true);
      setError("");

      try {
        const [trendResponse, skillResponse] = await Promise.all([
          getMyUsVisaPerformance({
            ...requestParams,
            includeFilterOptions: true,
          }),
          getMyUsVisaPerformance({
            ...requestParams,
            groupBy: "skill",
            includeFilterOptions: false,
          }),
        ]);

        if (isActive) {
          setData({
            ...(trendResponse?.data || {}),
            skillBreakdown: skillResponse?.data?.performance?.series || [],
          });
        }
      } catch (loadError) {
        if (isActive) {
          setData(null);
          setError(getErrorMessage(loadError));
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadPerformance();

    return () => {
      isActive = false;
    };
  }, [requestParams, refreshKey]);

  return {
    data,
    error,
    filters,
    isLoading,
    refresh: () => setRefreshKey((current) => current + 1),
    setFilters,
  };
}

export { buildAgentPerformanceParams };
