import { useEffect, useMemo, useState } from "react";

import { getMyUsVisaPerformance } from "@/lib/axios/us-visa-performance";

const DEFAULT_FILTERS = {
  period: "weekly",
  referenceDate: "",
  from: "",
  to: "",
};

function buildAgentPerformanceParams(filters = {}) {
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
    "Unable to load your Agent Level performance."
  );
}

export default function useAgentPerformance(initialFilters = DEFAULT_FILTERS) {
  const [filters, setFilters] = useState({
    ...DEFAULT_FILTERS,
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
          getMyUsVisaPerformance(requestParams),
          getMyUsVisaPerformance({
            ...requestParams,
            groupBy: "skill",
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
