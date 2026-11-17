import { useState, useEffect, useCallback, useMemo } from "react";
import {
  fetchAiCallKpis,
  fetchAiEmailKpis,
  fetchAiQualityAuditKpis,
  fetchAiOccupancyKpis,
  fetchAiCallSkills,
  getTaskOrderOptions,
  getCountryOptions,
  getSkillOptions,
} from "../adapters/wowDataAdapter";

const DEFAULT_FILTERS = {
  sourceSystem: "us-visa",
  period: "weekly",
  taskOrder: "all",
  country: "all",
  skill: "all",
  referenceDate: "",
  dateFrom: "",
  dateTo: "",
};

export function useAiWowData(initialSection = "") {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [activeSection, setActiveSection] = useState(initialSection);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [callKpiData, setCallKpiData] = useState(null);
  const [emailKpiData, setEmailKpiData] = useState(null);
  const [qaKpiData, setQaKpiData] = useState(null);
  const [occupancyKpiData, setOccupancyKpiData] = useState(null);
  const [skillsList, setSkillsList] = useState([]);

  // Load skills list on mount
  useEffect(() => {
    let ignore = false;
    fetchAiCallSkills().then((res) => {
      if (!ignore && Array.isArray(res)) {
        setSkillsList(res);
      }
    });
    return () => {
      ignore = true;
    };
  }, []);

  // Build query params
  const buildParams = useCallback((f) => {
    const p = {
      sourceSystem: f.sourceSystem || "us-visa",
      period: f.period || "weekly",
    };
    if (f.taskOrder && f.taskOrder !== "all") p.taskOrder = f.taskOrder;
    if (f.country && f.country !== "all") p.country = f.country;
    if (f.skill && f.skill !== "all") p.skill = f.skill;

    if (f.period === "custom") {
      if (f.dateFrom) p.dateFrom = f.dateFrom;
      if (f.dateTo) p.dateTo = f.dateTo;
    } else if (f.referenceDate) {
      p.referenceDate = f.referenceDate;
    }
    return p;
  }, []);

  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = buildParams(filters);

    try {
      const promises = [];
      const section = activeSection.toLowerCase();

      // Fetch calls if all or calls
      if (!section || section === "calls") {
        promises.push(
          fetchAiCallKpis(params).then((res) => {
            if (res.success) setCallKpiData(res.data);
            else setError(res.error);
          }),
        );
      }

      // Fetch emails if all or emails
      if (!section || section === "emails") {
        promises.push(
          fetchAiEmailKpis(params).then((res) => {
            if (res.success) setEmailKpiData(res.data);
          }),
        );
      }

      // Fetch QA if all or qa
      if (!section || section === "qa") {
        promises.push(
          fetchAiQualityAuditKpis(params).then((res) => {
            if (res.success) setQaKpiData(res.data);
          }),
        );
      }

      // Fetch occupancy if all or occupancy
      if (!section || section === "occupancy") {
        promises.push(
          fetchAiOccupancyKpis(params).then((res) => {
            if (res.success) setOccupancyKpiData(res.data);
          }),
        );
      }

      await Promise.all(promises);
    } catch (err) {
      setError(err?.message || "Failed to load AI WoW report data");
    } finally {
      setLoading(false);
    }
  }, [activeSection, filters, buildParams]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Dynamic filter options based on selection
  const taskOrderOptions = useMemo(
    () => getTaskOrderOptions(filters.sourceSystem),
    [filters.sourceSystem],
  );

  const countryOptions = useMemo(
    () => getCountryOptions(filters.sourceSystem, filters.taskOrder),
    [filters.sourceSystem, filters.taskOrder],
  );

  const skillOptions = useMemo(
    () => getSkillOptions(filters.sourceSystem, filters.taskOrder, filters.country),
    [filters.sourceSystem, filters.taskOrder, filters.country],
  );

  return {
    filters,
    setFilters,
    activeSection,
    setActiveSection,
    loading,
    error,
    callKpiData,
    emailKpiData,
    qaKpiData,
    occupancyKpiData,
    skillsList,
    taskOrderOptions,
    countryOptions,
    skillOptions,
    refreshData,
  };
}

export default useAiWowData;
