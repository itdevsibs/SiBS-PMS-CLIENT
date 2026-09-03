export const DEFAULT_AGENT_PERFORMANCE_FILTERS = Object.freeze({
  period: "weekly",
  referenceDate: "",
  from: "",
  to: "",
  skill: "",
  country: "",
});

function text(value) {
  return String(value || "").trim();
}

function sortText(left, right) {
  return left.localeCompare(right);
}

export function buildAgentPerformanceParams(filters = {}) {
  const params = {
    period: filters.period || DEFAULT_AGENT_PERFORMANCE_FILTERS.period,
  };
  const skill = text(filters.skill);
  const country = text(filters.country);

  if (skill) params.skill = skill;
  if (country) params.country = country;

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

export function getAgentCountryOptions(availableFilters = {}) {
  const countryValues = (availableFilters.countries || []).length
    ? availableFilters.countries
    : (availableFilters.skillCountryPairs || []).map((pair) => pair?.country);
  const countries = [...new Set(
    countryValues
      .map(text)
      .filter(Boolean),
  )].sort(sortText);

  return [
    { value: "", label: "All Countries" },
    ...countries.map((country) => ({ value: country, label: country })),
  ];
}

export function getAgentSkillOptions(availableFilters = {}, country = "") {
  const normalizedCountry = text(country).toLowerCase();
  const pairs = availableFilters.skillCountryPairs || [];
  const sourceSkills = normalizedCountry
    ? pairs
      .filter((pair) => text(pair?.country).toLowerCase() === normalizedCountry)
      .map((pair) => text(pair?.skillName))
    : (availableFilters.skills || []).map(text);
  const skills = [...new Set(sourceSkills.filter(Boolean))].sort(sortText);

  return [
    { value: "", label: "All Skills" },
    ...skills.map((skill) => ({ value: skill, label: skill })),
  ];
}

export function isAgentSkillAvailableForCountry(
  availableFilters = {},
  skill = "",
  country = "",
) {
  const selectedSkill = text(skill);
  const selectedCountry = text(country).toLowerCase();

  if (!selectedSkill || !selectedCountry) return true;

  return (availableFilters.skillCountryPairs || []).some(
    (pair) =>
      text(pair?.skillName) === selectedSkill &&
      text(pair?.country).toLowerCase() === selectedCountry,
  );
}
